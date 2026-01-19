import json

from azure.identity import DefaultAzureCredential
from azure.storage.queue import QueueClient

from config import settings


class QueueService:
    def __init__(self) -> None:
        self._credential = DefaultAzureCredential()
        self._queue_client = QueueClient(
            account_url=settings.storage_queue_url,
            queue_name=settings.queue_name,
            credential=self._credential,
        )

    def send_job_message(self, job_id: int) -> None:
        """Send a job message to the queue."""
        message = json.dumps({"job_id": job_id})
        self._queue_client.send_message(message)


queue_service = QueueService()
