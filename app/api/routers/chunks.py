import math
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func

from techpubs_core.database import get_session
from techpubs_core.models import Document, DocumentChunk, DocumentJob, DocumentVersion

from schemas.chunks import ChunkResponse, DocumentChunksResponse, JobSummary

router = APIRouter(prefix="/api/documents", tags=["chunks"])


@router.get("/{guid}/chunks", response_model=DocumentChunksResponse)
def get_document_chunks(
    guid: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
) -> DocumentChunksResponse:
    """Get chunks and job information for a document's latest version."""
    with get_session() as session:
        # Find the document
        document = (
            session.query(Document)
            .filter(Document.guid == guid, Document.deleted_at.is_(None))
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Get latest version
        latest_version = (
            session.query(DocumentVersion)
            .filter(
                DocumentVersion.document_id == document.id,
                DocumentVersion.deleted_at.is_(None),
            )
            .order_by(DocumentVersion.id.desc())
            .first()
        )

        if not latest_version:
            raise HTTPException(status_code=404, detail="No document version found")

        # Get total chunks count
        total_chunks = (
            session.query(func.count(DocumentChunk.id))
            .filter(DocumentChunk.document_version_id == latest_version.id)
            .scalar()
        )

        # Get embedded chunks count
        embedded_chunks = (
            session.query(func.count(DocumentChunk.id))
            .filter(
                DocumentChunk.document_version_id == latest_version.id,
                DocumentChunk.embedding.isnot(None),
            )
            .scalar()
        )

        # Get total tokens
        total_tokens = (
            session.query(func.coalesce(func.sum(DocumentChunk.token_count), 0))
            .filter(DocumentChunk.document_version_id == latest_version.id)
            .scalar()
        )

        # Get embedding model (from first embedded chunk)
        embedding_model = (
            session.query(DocumentChunk.embedding_model)
            .filter(
                DocumentChunk.document_version_id == latest_version.id,
                DocumentChunk.embedding_model.isnot(None),
            )
            .limit(1)
            .scalar()
        )

        # Calculate pagination
        total_pages = max(1, math.ceil(total_chunks / page_size))
        offset = (page - 1) * page_size

        # Get paginated chunks
        chunks = (
            session.query(DocumentChunk)
            .filter(DocumentChunk.document_version_id == latest_version.id)
            .order_by(DocumentChunk.chunk_index)
            .offset(offset)
            .limit(page_size)
            .all()
        )

        chunk_responses = [
            ChunkResponse(
                id=chunk.id,
                chunk_index=chunk.chunk_index,
                content_preview=chunk.content[:100] + "..." if len(chunk.content) > 100 else chunk.content,
                has_embedding=chunk.embedding is not None,
                embedding_model=chunk.embedding_model,
                token_count=chunk.token_count,
                page_number=chunk.page_number,
                chapter_title=chunk.chapter_title,
            )
            for chunk in chunks
        ]

        # Get jobs for this version
        jobs = (
            session.query(DocumentJob)
            .filter(DocumentJob.document_version_id == latest_version.id)
            .order_by(DocumentJob.created_at.desc())
            .all()
        )

        job_summaries = [
            JobSummary(
                id=job.id,
                job_type=job.job_type,
                status=job.status,
                error_message=job.error_message,
                started_at=job.started_at,
                completed_at=job.completed_at,
                created_at=job.created_at,
                chunk_start_index=job.chunk_start_index,
                chunk_end_index=job.chunk_end_index,
            )
            for job in jobs
        ]

        return DocumentChunksResponse(
            document_guid=str(document.guid),
            document_name=document.name,
            version_guid=str(latest_version.guid),
            version_name=latest_version.name,
            total_chunks=total_chunks,
            embedded_chunks=embedded_chunks,
            total_tokens=total_tokens,
            embedding_model=embedding_model,
            chunks=chunk_responses,
            jobs=job_summaries,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
