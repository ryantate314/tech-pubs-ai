"""Shared library for Tech Pubs v3."""

from techpubs_core.constants import DOCUMENTS_CONTAINER
from techpubs_core.database import get_engine, get_session, get_session_factory
from techpubs_core.models import (
    AircraftModel,
    Base,
    Category,
    Document,
    DocumentChunk,
    DocumentJob,
    DocumentVersion,
)

__all__ = [
    "AircraftModel",
    "Base",
    "Category",
    "Document",
    "DocumentChunk",
    "DocumentJob",
    "DocumentVersion",
    "DOCUMENTS_CONTAINER",
    "get_engine",
    "get_session",
    "get_session_factory",
]
