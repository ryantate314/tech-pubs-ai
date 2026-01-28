import json

from azure.identity import DefaultAzureCredential
from azure.storage.queue import QueueClient

from config import settings


class QueueService:
    def __init__(self) -> None:
        self._credential = DefaultAzureCredential()
        self._chunking_queue_client = QueueClient(
            account_url=settings.storage_queue_url,
            queue_name=settings.chunking_queue_name,
            credential=self._credential,
        )
        self._embedding_queue_client = QueueClient(
            account_url=settings.storage_queue_url,
            queue_name=settings.embedding_queue_name,
            credential=self._credential,
        )

    def send_chunking_job_message(self, job_id: int) -> None:
        """Send a chunking job message to the document-chunking queue."""
        message = json.dumps({"job_id": job_id})
        self._chunking_queue_client.send_message(message)

    def clear_chunking_queue(self) -> int:
        """Clear all messages from the document-chunking queue.

        Returns the approximate number of messages that were cleared.
        """
        properties = self._chunking_queue_client.get_queue_properties()
        message_count = properties.approximate_message_count or 0
        self._chunking_queue_client.clear_messages()
        return message_count

    def clear_embedding_queue(self) -> int:
        """Clear all messages from the document-embedding queue.

        Returns the approximate number of messages that were cleared.
        """
        properties = self._embedding_queue_client.get_queue_properties()
        message_count = properties.approximate_message_count or 0
        self._embedding_queue_client.clear_messages()
        return message_count


queue_service = QueueService()
