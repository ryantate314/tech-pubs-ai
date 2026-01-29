import os
import sys
from datetime import datetime

from techpubs_core import (
    DocumentChunk,
    DocumentJob,
    JobQueueConsumer,
    get_session,
)
from techpubs_core.embeddings import generate_embeddings_batch, get_embedding_model


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

            # Get the model identifier for tracking
            embedding_model = get_embedding_model()
            print(f"  Using model: {embedding_model}")

            # Generate embeddings (library handles batching internally)
            batch_delay = float(os.environ.get("EMBEDDING_BATCH_DELAY", "0.0"))
            texts = [chunk.content for chunk in chunks]
            embeddings = generate_embeddings_batch(texts, batch_delay=batch_delay)

            for chunk, embedding in zip(chunks, embeddings):
                chunk.embedding = embedding
                chunk.embedding_model = embedding_model

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


def main():
    print("Document embedding job started")

    try:
        queue_name = os.environ.get("QUEUE_NAME")
        if not queue_name:
            raise ValueError("QUEUE_NAME environment variable must be set")

        # Use 300s visibility timeout for embedding jobs
        consumer = JobQueueConsumer(queue_name=queue_name, visibility_timeout=300)

        message_count = 0
        for job_message in consumer.receive_messages(max_messages=1):
            message_count += 1
            print(f"Processing message: {job_message.raw_message.id}")

            try:
                print(f"Processing job ID: {job_message.job_id}")

                process_embedding_job(job_message.job_id)

                # Delete the message after successful processing
                consumer.delete_message(job_message)
                print(f"Message {job_message.raw_message.id} deleted from queue")

            except Exception as e:
                print(f"Error processing message {job_message.raw_message.id}: {e}", file=sys.stderr)
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
