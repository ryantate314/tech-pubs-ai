from techpubs_core import JobQueueProducer

from config import settings


class QueueService:
    def __init__(self) -> None:
        self._chunking_producer = JobQueueProducer(
            queue_name=settings.chunking_queue_name,
            queue_url=settings.storage_queue_url,
        )
        self._embedding_producer = JobQueueProducer(
            queue_name=settings.embedding_queue_name,
            queue_url=settings.storage_queue_url,
        )

    def send_chunking_job_message(self, job_id: int) -> None:
        """Send a chunking job message to the document-chunking queue."""
        self._chunking_producer.send_job(job_id)

    def send_embedding_job_message(self, job_id: int) -> None:
        """Send an embedding job message to the document-embedding queue."""
        self._embedding_producer.send_job(job_id)

    def clear_chunking_queue(self) -> int:
        """Clear all messages from the document-chunking queue.

        Returns the approximate number of messages that were cleared.
        """
        return self._chunking_producer.clear_queue()

    def clear_embedding_queue(self) -> int:
        """Clear all messages from the document-embedding queue.

        Returns the approximate number of messages that were cleared.
        """
        return self._embedding_producer.clear_queue()


queue_service = QueueService()
