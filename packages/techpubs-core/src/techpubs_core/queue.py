"""Shared queue utilities for Azure Queue Storage."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from typing import TYPE_CHECKING

from azure.identity import DefaultAzureCredential
from azure.storage.queue import QueueClient, QueueMessage

if TYPE_CHECKING:
    from collections.abc import Iterator


@dataclass
class JobMessage:
    """Typed wrapper for queue messages containing a job ID."""

    job_id: int
    raw_message: QueueMessage

    @classmethod
    def from_queue_message(cls, message: QueueMessage) -> "JobMessage":
        """Parse a queue message into a JobMessage.

        Expected message format: {"job_id": 123}
        """
        try:
            data = json.loads(message.content)
            job_id = data.get("job_id")
            if not job_id:
                raise ValueError("Message missing 'job_id' field")
            return cls(job_id=int(job_id), raw_message=message)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in queue message: {e}") from e


@lru_cache(maxsize=1)
def get_credential() -> DefaultAzureCredential:
    """Get cached Azure credential with optional managed identity support.

    Uses AZURE_CLIENT_ID environment variable for user-assigned managed identities.
    """
    client_id = os.environ.get("AZURE_CLIENT_ID")
    if not client_id:
        print(
            "WARNING: AZURE_CLIENT_ID not set. "
            "Managed identity authentication may fail for user-assigned identities."
        )
    return DefaultAzureCredential(managed_identity_client_id=client_id)


def get_queue_client(queue_name: str, queue_url: str | None = None) -> QueueClient:
    """Create a QueueClient for the specified queue.

    Args:
        queue_name: Name of the queue.
        queue_url: Storage account queue URL. If not provided, reads from
            STORAGE_QUEUE_URL environment variable.

    Returns:
        QueueClient configured with Azure credentials.

    Raises:
        ValueError: If queue_url is not provided and STORAGE_QUEUE_URL is not set.
    """
    if queue_url is None:
        queue_url = os.environ.get("STORAGE_QUEUE_URL")
        if not queue_url:
            raise ValueError(
                "STORAGE_QUEUE_URL environment variable must be set "
                "or queue_url must be provided"
            )

    credential = get_credential()
    account_url = queue_url.rstrip("/")

    return QueueClient(
        account_url=account_url,
        queue_name=queue_name,
        credential=credential,
    )


class JobQueueProducer:
    """High-level class for sending job messages to a queue."""

    def __init__(self, queue_name: str, queue_url: str | None = None) -> None:
        """Initialize the producer.

        Args:
            queue_name: Name of the queue to send messages to.
            queue_url: Storage account queue URL. If not provided, reads from
                STORAGE_QUEUE_URL environment variable.
        """
        self._client = get_queue_client(queue_name, queue_url)
        self._queue_name = queue_name

    def send_job(self, job_id: int) -> None:
        """Send a job message to the queue.

        Args:
            job_id: ID of the job to queue.
        """
        message = json.dumps({"job_id": job_id})
        self._client.send_message(message)

    def clear_queue(self) -> int:
        """Clear all messages from the queue.

        Returns:
            Approximate number of messages that were cleared.
        """
        properties = self._client.get_queue_properties()
        message_count = properties.approximate_message_count or 0
        self._client.clear_messages()
        return message_count

    @property
    def queue_name(self) -> str:
        """Get the queue name."""
        return self._queue_name


class JobQueueConsumer:
    """High-level class for receiving and processing job messages from a queue."""

    def __init__(
        self,
        queue_name: str,
        queue_url: str | None = None,
        visibility_timeout: int = 300,
    ) -> None:
        """Initialize the consumer.

        Args:
            queue_name: Name of the queue to receive messages from.
            queue_url: Storage account queue URL. If not provided, reads from
                STORAGE_QUEUE_URL environment variable.
            visibility_timeout: Seconds to hide message from other consumers
                while processing. Use 300s for embedding jobs, 600s for chunking.
        """
        self._client = get_queue_client(queue_name, queue_url)
        self._queue_name = queue_name
        self._visibility_timeout = visibility_timeout

    def receive_messages(self, max_messages: int = 1) -> Iterator[JobMessage]:
        """Receive and parse job messages from the queue.

        Args:
            max_messages: Maximum number of messages to receive (1-32).

        Yields:
            JobMessage objects for each message received.
        """
        messages = self._client.receive_messages(
            visibility_timeout=self._visibility_timeout,
            max_messages=max_messages,
        )
        for message in messages:
            yield JobMessage.from_queue_message(message)

    def delete_message(self, job_message: JobMessage) -> None:
        """Delete a message from the queue after successful processing.

        Args:
            job_message: The JobMessage to delete (contains the raw message).
        """
        self._client.delete_message(job_message.raw_message)

    @property
    def queue_name(self) -> str:
        """Get the queue name."""
        return self._queue_name

    @property
    def visibility_timeout(self) -> int:
        """Get the visibility timeout in seconds."""
        return self._visibility_timeout
