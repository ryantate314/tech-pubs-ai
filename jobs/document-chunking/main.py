import os
import re
import sys
import tempfile
import traceback
from collections.abc import Iterator
from datetime import datetime
from pathlib import Path

import fitz  # PyMuPDF
from azure.storage.blob import BlobServiceClient
import tiktoken
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter
from docling_core.transforms.chunker.tokenizer.openai import OpenAITokenizer

from techpubs_core import (
    DOCUMENTS_CONTAINER,
    DocumentChunk,
    DocumentJob,
    DocumentVersion,
    JobQueueConsumer,
    JobQueueProducer,
    get_credential,
    get_session,
)

# OpenAI text-embedding-3-small model parameters
# - Max input: 8191 tokens
# - Recommended chunk size: ~1000 tokens for optimal retrieval
# - Uses cl100k_base tokenizer (same as GPT-4)
EMBEDDING_MODEL_TOKENIZER = "cl100k_base"
EMBEDDING_MODEL_MAX_TOKENS = 1000

# Batch size for embedding jobs (number of chunks per job)
EMBEDDING_BATCH_SIZE = 500

# Thresholds for determining large PDFs (configurable via env vars)
LARGE_PDF_PAGE_THRESHOLD = int(os.environ.get("LARGE_PDF_PAGE_THRESHOLD", "100"))
LARGE_PDF_SIZE_MB_THRESHOLD = int(os.environ.get("LARGE_PDF_SIZE_MB_THRESHOLD", "10"))


def download_blob_to_file(storage_account_url: str, blob_path: str, file_path: str) -> int:
    """Download blob content from Azure Blob Storage directly to a file.

    Returns the number of bytes downloaded.
    """
    credential = get_credential()
    blob_service_client = BlobServiceClient(storage_account_url, credential=credential)
    blob_client = blob_service_client.get_blob_client(DOCUMENTS_CONTAINER, blob_path)

    with open(file_path, "wb") as f:
        stream = blob_client.download_blob()
        stream.readinto(f)
        return stream.size


def analyze_pdf(file_path: str) -> dict:
    """Analyze PDF for size and TOC to determine chunking strategy."""
    doc = fitz.open(file_path)
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    toc = doc.get_toc()  # [[level, title, page], ...]
    page_count = len(doc)

    is_large = page_count > LARGE_PDF_PAGE_THRESHOLD or file_size_mb > LARGE_PDF_SIZE_MB_THRESHOLD

    # Filter to top-level chapters (level 1)
    chapters = [{"title": t[1], "page": t[2]} for t in toc if t[0] == 1]
    has_valid_toc = len(chapters) >= 2

    doc.close()

    return {
        "page_count": page_count,
        "file_size_mb": file_size_mb,
        "is_large": is_large,
        "has_toc": has_valid_toc,
        "chapters": chapters,
    }


def extract_chapter_pdf(source_path: str, start_page: int, end_page: int) -> str:
    """Extract page range to temp PDF file. Returns temp file path."""
    doc = fitz.open(source_path)
    new_doc = fitz.open()
    new_doc.insert_pdf(doc, from_page=start_page - 1, to_page=end_page - 1)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        new_doc.save(tmp.name)
        new_doc.close()
        doc.close()
        return tmp.name


def extract_text_chunks_simple(file_path: str, max_tokens: int = EMBEDDING_MODEL_MAX_TOKENS) -> Iterator[dict]:
    """Page-based text extraction with sentence-boundary chunking.

    Used for large PDFs without a valid TOC.
    """
    doc = fitz.open(file_path)
    chunk_index = 0

    for page_num in range(len(doc)):
        text = doc[page_num].get_text("text")
        sentences = re.split(r'(?<=[.!?])\s+', text)

        current_chunk = []
        current_tokens = 0

        for sentence in sentences:
            tokens = len(sentence.split())
            if current_tokens + tokens > max_tokens and current_chunk:
                yield {
                    "content": " ".join(current_chunk),
                    "chunk_index": chunk_index,
                    "page_number": page_num + 1,
                }
                chunk_index += 1
                current_chunk, current_tokens = [], 0
            current_chunk.append(sentence)
            current_tokens += tokens

        if current_chunk:
            yield {
                "content": " ".join(current_chunk),
                "chunk_index": chunk_index,
                "page_number": page_num + 1,
            }
            chunk_index += 1

    doc.close()


def extract_text_chunks_docling(file_path: str) -> Iterator[dict]:
    """
    Extract text chunks from document using Docling's HybridChunker.

    Uses tokenizer-aware chunking that respects document structure (headings,
    sections, paragraphs) and produces chunks sized appropriately for the
    embedding model (text-embedding-3-small).

    Args:
        file_path: Path to the document file to process.

    Yields dicts with 'content', 'page_number', and 'chunk_index' keys.
    """
    converter = DocumentConverter()
    result = converter.convert(file_path)

    # Use OpenAI's cl100k_base tokenizer (used by text-embedding-3-small)
    # max_tokens is required for OpenAI tokenizers
    tokenizer = OpenAITokenizer(
        tokenizer=tiktoken.get_encoding(EMBEDDING_MODEL_TOKENIZER),
        max_tokens=EMBEDDING_MODEL_MAX_TOKENS,
    )

    # Use HybridChunker with tokenizer matching our embedding model
    # This ensures chunks are properly sized for embedding and respect document structure
    chunker = HybridChunker(
        tokenizer=tokenizer,
        merge_peers=True,
    )

    for chunk_index, chunk in enumerate(chunker.chunk(dl_doc=result.document)):
        # Use contextualize() to get context-enriched text that includes
        # heading hierarchy for better semantic search
        print(f"Processing chunk {chunk_index} of length {len(chunk.text)}")
        content = chunker.contextualize(chunk)
        print(f"Size with context: {len(content)}")
        print(content)

        # Truncate to model's max sequence length if needed
        # This can happen when contextualize() adds long heading hierarchies
        enc = tiktoken.get_encoding(EMBEDDING_MODEL_TOKENIZER)
        tokens = enc.encode(content)
        if len(tokens) > EMBEDDING_MODEL_MAX_TOKENS:
            tokens = tokens[:EMBEDDING_MODEL_MAX_TOKENS]
            content = enc.decode(tokens)

        # Extract page number from chunk metadata if available
        page_number = None
        if chunk.meta and chunk.meta.doc_items:
            # Get the page number from the first doc item's provenance
            for doc_item in chunk.meta.doc_items:
                if doc_item.prov and len(doc_item.prov) > 0:
                    page_number = doc_item.prov[0].page_no
                    break

        yield {
            "content": content,
            "chunk_index": chunk_index,
            "page_number": page_number,
        }


def extract_text_chunks_by_chapter(file_path: str, analysis: dict) -> Iterator[dict]:
    """Process chapters sequentially with Docling.

    Splits large PDFs by TOC chapters and processes each chapter separately
    to avoid memory issues with very large documents.
    """
    chapters = analysis["chapters"]
    total_pages = analysis["page_count"]
    chunk_index = 0

    for i, chapter in enumerate(chapters):
        start_page = chapter["page"]
        end_page = chapters[i + 1]["page"] - 1 if i + 1 < len(chapters) else total_pages

        print(f"  Processing chapter: {chapter['title']} (pages {start_page}-{end_page})")
        chapter_path = extract_chapter_pdf(file_path, start_page, end_page)

        try:
            for chunk in extract_text_chunks_docling(chapter_path):
                yield {
                    "content": chunk["content"],
                    "chunk_index": chunk_index,
                    "page_number": chunk["page_number"],
                    "chapter_title": chapter["title"],
                }
                chunk_index += 1
        finally:
            os.unlink(chapter_path)


def extract_text_chunks(file_path: str) -> Iterator[dict]:
    """Extract chunks using strategy based on PDF size and TOC.

    Routes to one of three strategies:
    - Small PDFs: Use Docling directly
    - Large PDFs with TOC: Split by chapter, process each with Docling
    - Large PDFs without TOC: Use simple page-based chunking
    """
    analysis = analyze_pdf(file_path)
    print(f"PDF analysis: {analysis['page_count']} pages, {analysis['file_size_mb']:.1f}MB, TOC: {analysis['has_toc']}")

    # if not analysis["is_large"]:
    #     # Small PDF: use Docling directly
    #     print("Strategy: Docling (small PDF)")
    #     yield from extract_text_chunks_docling(file_path)

    # elif analysis["has_toc"]:
    #     # Large PDF with TOC: split by chapter
    #     print(f"Strategy: Chapter-based ({len(analysis['chapters'])} chapters)")
    #     yield from extract_text_chunks_by_chapter(file_path, analysis)

    # else:
    # Large PDF without TOC: simple chunking
    print("Strategy: Simple page-based (large PDF, no TOC)")
    yield from extract_text_chunks_simple(file_path)


def store_chunks_without_embeddings(
    chunks: Iterator[dict],
    document_version_id: int,
    session,
    tokenizer=None,
) -> tuple[list[DocumentChunk], int]:
    """
    Store chunks in the database without embeddings.

    Args:
        chunks: Iterator of chunk dictionaries with content and metadata
        document_version_id: ID of the document version
        session: Database session
        tokenizer: Optional HuggingFace tokenizer for accurate token counting.
                   If None, falls back to word splitting approximation.

    Returns:
        Tuple of (list of created DocumentChunk objects, total token count)
    """
    stored_chunks = []
    total_token_count = 0

    for chunk in chunks:
        content = chunk["content"]

        # Use tokenizer for accurate count, fall back to word split
        if tokenizer is not None:
            token_count = len(tokenizer.encode(content))
        else:
            token_count = len(content.split())

        total_token_count += token_count

        document_chunk = DocumentChunk(
            document_version_id=document_version_id,
            chunk_index=chunk["chunk_index"],
            content=content,
            embedding=None,  # Will be filled in by embedding job
            token_count=token_count,
            page_number=chunk["page_number"],
            chapter_title=chunk.get("chapter_title"),
        )
        session.add(document_chunk)
        stored_chunks.append(document_chunk)

        if len(stored_chunks) % 100 == 0:
            print(f"  Stored {len(stored_chunks)} chunks...")

    return stored_chunks, total_token_count


def create_embedding_jobs(
    document_version_id: int,
    total_chunks: int,
    parent_job_id: int,
    session,
) -> list[DocumentJob]:
    """
    Create embedding jobs for batches of chunks.

    Returns the list of created DocumentJob objects.
    """
    embedding_jobs = []

    for start_idx in range(0, total_chunks, EMBEDDING_BATCH_SIZE):
        end_idx = min(start_idx + EMBEDDING_BATCH_SIZE, total_chunks)

        embedding_job = DocumentJob(
            document_version_id=document_version_id,
            job_type="embedding",
            status="pending",
            parent_job_id=parent_job_id,
            chunk_start_index=start_idx,
            chunk_end_index=end_idx,
        )
        session.add(embedding_job)
        embedding_jobs.append(embedding_job)

    return embedding_jobs


def queue_embedding_jobs(embedding_jobs: list[DocumentJob]) -> None:
    """Queue embedding jobs to the embedding queue."""
    embedding_queue_name = os.environ.get("EMBEDDING_QUEUE_NAME")
    if not embedding_queue_name:
        raise ValueError("EMBEDDING_QUEUE_NAME environment variable must be set")

    producer = JobQueueProducer(queue_name=embedding_queue_name)

    for job in embedding_jobs:
        producer.send_job(job.id)
        print(f"  Queued embedding job {job.id} (chunks {job.chunk_start_index}-{job.chunk_end_index})")


def process_chunking_job(job_id: int) -> None:
    """
    Process a document chunking job.

    1. Look up the DocumentJob by ID
    2. Get the associated DocumentVersion and blob_path
    3. Download and parse the document
    4. Extract text chunks and store WITHOUT embeddings
    5. Create embedding jobs for batches of chunks
    6. Queue embedding jobs
    7. Update job status
    """
    storage_account_url = os.environ.get("STORAGE_ACCOUNT_URL")
    if not storage_account_url:
        raise ValueError("STORAGE_ACCOUNT_URL environment variable must be set")

    with get_session() as session:
        # Look up the job
        job = session.query(DocumentJob).filter(DocumentJob.id == job_id).first()
        if not job:
            raise ValueError(f"DocumentJob with id {job_id} not found")

        if job.status != "pending":
            print(f"Job {job_id} is not pending (status: {job.status}), skipping")
            return

        # Get the document version
        document_version = job.document_version
        if not document_version:
            raise ValueError(f"DocumentVersion not found for job {job_id}")

        if not document_version.blob_path:
            raise ValueError(f"DocumentVersion {document_version.id} has no blob_path")

        print(f"Processing chunking job {job_id} for document version {document_version.id}")
        print(f"Blob path: {document_version.blob_path}")

        # Mark job as running
        job.status = "running"
        job.started_at = datetime.now()
        session.commit()

        # Create temp file for download
        suffix = Path(document_version.file_name).suffix
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
            tmp_path = tmp_file.name

        try:
            # Download the blob directly to temp file
            print("Downloading blob...")
            bytes_downloaded = download_blob_to_file(
                storage_account_url, document_version.blob_path, tmp_path
            )
            print(f"Downloaded {bytes_downloaded} bytes")

            # Extract and store chunks without embeddings
            print("Extracting and storing chunks...")
            chunks = list(extract_text_chunks(tmp_path))
            total_chunks = len(chunks)

            if total_chunks == 0:
                print("No text chunks extracted")
                job.status = "completed"
                job.completed_at = datetime.now()
                return

            # Initialize tokenizer for accurate token counting
            print("Loading tokenizer for token counting...")
            tokenizer = tiktoken.get_encoding(EMBEDDING_MODEL_TOKENIZER)

            _, total_token_count = store_chunks_without_embeddings(
                iter(chunks),
                document_version.id,
                session,
                tokenizer=tokenizer,
            )

            # Update document version with total token count
            document_version.total_token_count = total_token_count
            session.flush()  # Ensure chunks are in DB before creating embedding jobs

            print(f"Stored {total_chunks} chunks ({total_token_count:,} tokens), creating embedding jobs...")

            # Create embedding jobs for batches
            embedding_jobs = create_embedding_jobs(
                document_version_id=document_version.id,
                total_chunks=total_chunks,
                parent_job_id=job_id,
                session=session,
            )
            session.flush()  # Ensure embedding jobs have IDs

            print(f"Created {len(embedding_jobs)} embedding jobs")

            # Queue embedding jobs
            queue_embedding_jobs(embedding_jobs)

            # Mark chunking job as completed
            job.status = "completed"
            job.completed_at = datetime.now()

            print(f"Successfully processed chunking job {job_id}")
            print(f"  - Document Version ID: {document_version.id}")
            print(f"  - Chunks stored: {total_chunks}")
            print(f"  - Total tokens: {total_token_count:,}")
            print(f"  - Embedding jobs created: {len(embedding_jobs)}")

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now()
            raise

        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


def main():
    print("Document chunking job started")

    try:
        queue_name = os.environ.get("QUEUE_NAME")
        if not queue_name:
            raise ValueError("QUEUE_NAME environment variable must be set")

        # Use 600s visibility timeout for chunking jobs (longer processing time)
        consumer = JobQueueConsumer(queue_name=queue_name, visibility_timeout=600)

        message_count = 0
        for job_message in consumer.receive_messages(max_messages=1):
            message_count += 1
            print(f"Processing message: {job_message.raw_message.id}")

            try:
                print(f"Processing job ID: {job_message.job_id}")

                process_chunking_job(job_message.job_id)

                # Delete the message after successful processing
                consumer.delete_message(job_message)
                print(f"Message {job_message.raw_message.id} deleted from queue")

            except Exception as e:
                print(f"Error processing message {job_message.raw_message.id}: {e}", file=sys.stderr)
                traceback.print_exc()
                # Message will become visible again after visibility_timeout expires
                raise

        if message_count == 0:
            print("No messages in queue")

        print("Document chunking job completed")

    except Exception as e:
        print(f"Error in document chunking job: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
