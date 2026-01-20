import json
import os
import sys
import tempfile
from collections.abc import Iterator
from datetime import datetime
from pathlib import Path

from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient
from azure.storage.queue import QueueClient
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter

from techpubs_core import (
    DOCUMENTS_CONTAINER,
    DocumentChunk,
    DocumentJob,
    DocumentVersion,
    get_session,
)
from techpubs_core.embeddings import MODEL_NAME, generate_embeddings_batch


def get_credential() -> DefaultAzureCredential:
    """Create a credential using managed identity."""
    client_id = os.environ.get("AZURE_CLIENT_ID")
    if not client_id:
        print("WARNING: AZURE_CLIENT_ID not set. Managed identity authentication may fail for user-assigned identities.")
    return DefaultAzureCredential(managed_identity_client_id=client_id)


def get_queue_client() -> QueueClient:
    """Create a QueueClient using managed identity."""
    credential = get_credential()
    queue_url = os.environ.get("STORAGE_QUEUE_URL")
    queue_name = os.environ.get("QUEUE_NAME")

    if not queue_url or not queue_name:
        raise ValueError("STORAGE_QUEUE_URL and QUEUE_NAME environment variables must be set")

    account_url = queue_url.rstrip("/")
    return QueueClient(
        account_url=account_url,
        queue_name=queue_name,
        credential=credential,
    )


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


def extract_text_chunks(file_path: str) -> Iterator[dict]:
    """
    Extract text chunks from document using Docling's HybridChunker.

    Uses tokenizer-aware chunking that respects document structure (headings,
    sections, paragraphs) and produces chunks sized appropriately for the
    embedding model.

    Args:
        file_path: Path to the document file to process.

    Yields dicts with 'content', 'page_number', and 'chunk_index' keys.
    """
    converter = DocumentConverter()
    result = converter.convert(file_path)

    # Use HybridChunker with tokenizer matching our embedding model
    # This ensures chunks are properly sized for embedding and respect document structure
    chunker = HybridChunker(
        tokenizer=MODEL_NAME,
        max_tokens=512,
        merge_peers=True,
    )

    for chunk_index, chunk in enumerate(chunker.chunk(dl_doc=result.document)):
        # Use contextualize() to get context-enriched text that includes
        # heading hierarchy for better semantic search
        content = chunker.contextualize(chunk)

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


def process_and_store_chunks(
    chunks: Iterator[dict],
    document_version_id: int,
    session,
    batch_size: int = 32,
) -> int:
    """
    Process chunks in batches: generate embeddings and store in database.

    Streams chunks from the iterator, batching them to efficiently generate
    embeddings while minimizing memory usage.

    Returns the total number of chunks processed.
    """
    batch = []
    total_chunks = 0

    for chunk in chunks:
        batch.append(chunk)

        if len(batch) >= batch_size:
            _embed_and_store_batch(batch, document_version_id, session)
            total_chunks += len(batch)
            print(f"  Processed {total_chunks} chunks...")
            batch = []

    # Process any remaining chunks
    if batch:
        _embed_and_store_batch(batch, document_version_id, session)
        total_chunks += len(batch)

    return total_chunks


def _embed_and_store_batch(batch: list[dict], document_version_id: int, session) -> None:
    """Generate embeddings for a batch of chunks and store them in the database."""
    chunk_texts = [c["content"] for c in batch]
    embeddings = generate_embeddings_batch(chunk_texts)

    for chunk, embedding in zip(batch, embeddings):
        document_chunk = DocumentChunk(
            document_version_id=document_version_id,
            chunk_index=chunk["chunk_index"],
            content=chunk["content"],
            embedding=embedding,
            token_count=len(chunk["content"].split()),
            page_number=chunk["page_number"],
        )
        session.add(document_chunk)


def process_document_job(job_id: int) -> None:
    """
    Process a document ingestion job.

    1. Look up the DocumentJob by ID
    2. Get the associated DocumentVersion and blob_path
    3. Download and parse the document
    4. Extract text chunks and generate embeddings
    5. Store chunks in the database
    6. Update job status
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

        print(f"Processing job {job_id} for document version {document_version.id}")
        print(f"Blob path: {document_version.blob_path}")

        # Mark job as running
        job.status = "running"
        job.started_at = datetime.now()
        session.commit()  # Commit immediately so status is visible to other connections

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

            # Extract chunks, generate embeddings, and store in database
            print("Processing document chunks...")
            total_chunks = process_and_store_chunks(
                chunks=extract_text_chunks(tmp_path),
                document_version_id=document_version.id,
                session=session,
            )

            if total_chunks == 0:
                print("No text chunks extracted")

            # Mark job as completed
            job.status = "completed"
            job.completed_at = datetime.now()

            print(f"Successfully processed job {job_id}")
            print(f"  - Document Version ID: {document_version.id}")
            print(f"  - Chunks stored: {total_chunks}")

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now()
            raise

        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


def process_queue_message(message_content: str) -> int:
    """
    Parse queue message and return the job ID.

    Expected message format: {"job_id": 123}
    """
    try:
        data = json.loads(message_content)
        job_id = data.get("job_id")
        if not job_id:
            raise ValueError("Message missing 'job_id' field")
        return int(job_id)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in queue message: {e}")


def main():
    print("Document ingestion job started")

    try:
        queue_client = get_queue_client()

        # Receive messages from the queue
        # visibility_timeout ensures the message is hidden from other consumers while processing
        messages = queue_client.receive_messages(visibility_timeout=300, max_messages=1)

        message_count = 0
        for message in messages:
            message_count += 1
            print(f"Processing message: {message.id}")

            try:
                job_id = process_queue_message(message.content)
                print(f"Processing job ID: {job_id}")

                process_document_job(job_id)

                # Delete the message after successful processing
                queue_client.delete_message(message)
                print(f"Message {message.id} deleted from queue")

            except Exception as e:
                print(f"Error processing message {message.id}: {e}", file=sys.stderr)
                # Message will become visible again after visibility_timeout expires
                raise

        if message_count == 0:
            print("No messages in queue")

        print("Document ingestion job completed")

    except Exception as e:
        print(f"Error in document ingestion job: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
