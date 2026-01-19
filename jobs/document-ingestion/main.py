import json
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient
from azure.storage.queue import QueueClient
from docling.document_converter import DocumentConverter

from techpubs_core import DocumentChunk, DocumentJob, DocumentVersion, get_session
from techpubs_core.embeddings import generate_embeddings_batch


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


def download_blob(storage_account_url: str, blob_path: str) -> bytes:
    """Download blob content from Azure Blob Storage."""
    credential = get_credential()
    blob_service_client = BlobServiceClient(storage_account_url, credential=credential)

    # blob_path format: "container_name/path/to/blob"
    parts = blob_path.split("/", 1)
    if len(parts) != 2:
        raise ValueError(f"Invalid blob_path format: {blob_path}. Expected 'container/path'")

    container_name, blob_name = parts
    blob_client = blob_service_client.get_blob_client(container_name, blob_name)

    return blob_client.download_blob().readall()


def extract_text_chunks(content: bytes, file_name: str) -> list[dict]:
    """
    Extract text chunks from document using Docling.

    Returns list of dicts with 'content', 'page_number', and 'chunk_index' keys.
    """
    chunks = []

    # Write content to temp file for Docling processing
    suffix = Path(file_name).suffix
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
        tmp_file.write(content)
        tmp_path = tmp_file.name

    try:
        converter = DocumentConverter()
        result = converter.convert(tmp_path)

        # Export as markdown and split into chunks
        markdown_content = result.document.export_to_markdown()

        # Split into chunks by paragraphs/sections
        # Keep chunks reasonable size (roughly 500-1000 chars)
        current_chunk = []
        current_length = 0
        chunk_index = 0
        max_chunk_length = 1000

        for line in markdown_content.split("\n"):
            line_length = len(line)

            # If adding this line exceeds max length and we have content, save current chunk
            if current_length + line_length > max_chunk_length and current_chunk:
                chunk_text = "\n".join(current_chunk).strip()
                if chunk_text:
                    chunks.append(
                        {
                            "content": chunk_text,
                            "chunk_index": chunk_index,
                            "page_number": None,  # Docling doesn't always provide page numbers in markdown export
                        }
                    )
                    chunk_index += 1
                current_chunk = []
                current_length = 0

            current_chunk.append(line)
            current_length += line_length + 1  # +1 for newline

        # Don't forget the last chunk
        if current_chunk:
            chunk_text = "\n".join(current_chunk).strip()
            if chunk_text:
                chunks.append(
                    {
                        "content": chunk_text,
                        "chunk_index": chunk_index,
                        "page_number": None,
                    }
                )

    finally:
        # Clean up temp file
        os.unlink(tmp_path)

    return chunks


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
        session.flush()

        try:
            # Download the blob
            print("Downloading blob...")
            content = download_blob(storage_account_url, document_version.blob_path)
            print(f"Downloaded {len(content)} bytes")

            # Extract text chunks
            print("Extracting text chunks...")
            chunks = extract_text_chunks(content, document_version.file_name)
            print(f"Extracted {len(chunks)} chunks")

            if not chunks:
                print("No text chunks extracted, marking job as completed")
                job.status = "completed"
                job.completed_at = datetime.now()
                return

            # Generate embeddings
            print("Generating embeddings...")
            chunk_texts = [chunk["content"] for chunk in chunks]
            embeddings = generate_embeddings_batch(chunk_texts)
            print(f"Generated {len(embeddings)} embeddings")

            # Store chunks with embeddings
            print("Storing chunks in database...")
            for chunk, embedding in zip(chunks, embeddings):
                document_chunk = DocumentChunk(
                    document_version_id=document_version.id,
                    chunk_index=chunk["chunk_index"],
                    content=chunk["content"],
                    embedding=embedding,
                    token_count=len(chunk["content"].split()),  # Approximate token count
                    page_number=chunk["page_number"],
                )
                session.add(document_chunk)

            # Mark job as completed
            job.status = "completed"
            job.completed_at = datetime.now()

            print(f"Successfully processed job {job_id}")
            print(f"  - Document Version ID: {document_version.id}")
            print(f"  - Chunks stored: {len(chunks)}")

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now()
            raise


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
