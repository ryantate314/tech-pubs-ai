import json
import os
import sys
from datetime import datetime

from azure.identity import DefaultAzureCredential
from azure.storage.queue import QueueClient

from techpubs_core import (
    DocumentChunk,
    DocumentJob,
    get_session,
)
from techpubs_core.embeddings import generate_embeddings_batch


def get_credential() -> DefaultAzureCredential:
    """Create a credential using managed identity."""
    client_id = os.environ.get("AZURE_CLIENT_ID")
    if not client_id:
        print("WARNING: AZURE_CLIENT_ID not set. Managed identity authentication may fail for user-assigned identities.")
    return DefaultAzureCredential(managed_identity_client_id=client_id)


def get_queue_client() -> QueueClient:
    """Create a QueueClient for the embedding job queue using managed identity."""
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


def process_embedding_job(job_id: int) -> None:
    """
    Process a document embedding job.

    1. Look up the DocumentJob by ID
    2. Get chunks in the specified range that need embeddings
    3. Generate embeddings in batches
    4. Update chunk records with embeddings
    5. Update job status
    """
    with get_session() as session:
        # Look up the job
        job = session.query(DocumentJob).filter(DocumentJob.id == job_id).first()
        if not job:
            raise ValueError(f"DocumentJob with id {job_id} not found")

        if job.status != "pending":
            print(f"Job {job_id} is not pending (status: {job.status}), skipping")
            return

        if job.chunk_start_index is None or job.chunk_end_index is None:
            raise ValueError(f"Embedding job {job_id} missing chunk range")

        print(f"Processing embedding job {job_id}")
        print(f"  Document version: {job.document_version_id}")
        print(f"  Chunk range: {job.chunk_start_index}-{job.chunk_end_index}")

        # Mark job as running
        job.status = "running"
        job.started_at = datetime.now()
        session.commit()

        try:
            # Query chunks that need embeddings in the specified range
            chunks = (
                session.query(DocumentChunk)
                .filter(
                    DocumentChunk.document_version_id == job.document_version_id,
                    DocumentChunk.chunk_index >= job.chunk_start_index,
                    DocumentChunk.chunk_index < job.chunk_end_index,
                    DocumentChunk.embedding.is_(None),
                )
                .order_by(DocumentChunk.chunk_index)
                .all()
            )

            if not chunks:
                print("No chunks need embeddings in this range")
                job.status = "completed"
                job.completed_at = datetime.now()
                return

            print(f"Generating embeddings for {len(chunks)} chunks...")

            # Generate embeddings in batches of 32 for efficiency
            batch_size = 32
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i : i + batch_size]
                texts = [chunk.content for chunk in batch]
                embeddings = generate_embeddings_batch(texts)

                for chunk, embedding in zip(batch, embeddings):
                    chunk.embedding = embedding

                print(f"  Processed {min(i + batch_size, len(chunks))}/{len(chunks)} chunks")

            # Mark job as completed
            job.status = "completed"
            job.completed_at = datetime.now()

            print(f"Successfully processed embedding job {job_id}")
            print(f"  - Chunks embedded: {len(chunks)}")

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
    print("Document embedding job started")

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

                process_embedding_job(job_id)

                # Delete the message after successful processing
                queue_client.delete_message(message)
                print(f"Message {message.id} deleted from queue")

            except Exception as e:
                print(f"Error processing message {message.id}: {e}", file=sys.stderr)
                # Message will become visible again after visibility_timeout expires
                raise

        if message_count == 0:
            print("No messages in queue")

        print("Document embedding job completed")

    except Exception as e:
        print(f"Error in document embedding job: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
