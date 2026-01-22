"""Shared library for Tech Pubs v3."""

from techpubs_core.constants import DOCUMENTS_CONTAINER
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
    "DOCUMENTS_CONTAINER",
    "get_engine",
    "get_session",
    "get_session_factory",
]
