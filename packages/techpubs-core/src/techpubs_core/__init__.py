"""Shared library for Tech Pubs v3."""

from techpubs_core.constants import (
    DEFAULT_CHUNKING_QUEUE,
    DEFAULT_EMBEDDING_QUEUE,
    DOCUMENTS_CONTAINER,
)
from techpubs_core.database import get_engine, get_session, get_session_factory
from techpubs_core.models import (
    AircraftModel,
    Base,
    Category,
    Document,
    DocumentCategory,
    DocumentChunk,
    DocumentJob,
    DocumentType,
    DocumentVersion,
    Generation,
    Platform,
)

__all__ = [
    "AircraftModel",
    "Base",
    "Category",
    "Document",
    "DocumentCategory",
    "DocumentChunk",
    "DocumentJob",
    "DocumentType",
    "DocumentVersion",
    "Generation",
    "Platform",
    "DEFAULT_CHUNKING_QUEUE",
    "DEFAULT_EMBEDDING_QUEUE",
    "DOCUMENTS_CONTAINER",
    "get_engine",
    "get_session",
    "get_session_factory",
]

# Conditional imports for optional [queue] extra
try:
    from techpubs_core.queue import (
        JobMessage,
        JobQueueConsumer,
        JobQueueProducer,
        get_credential,
        get_queue_client,
    )

    __all__.extend([
        "JobMessage",
        "JobQueueConsumer",
        "JobQueueProducer",
        "get_credential",
        "get_queue_client",
    ])
except ImportError:
    # Queue dependencies not installed (techpubs-core[queue] not used)
    pass
