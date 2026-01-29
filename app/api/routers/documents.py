from typing import Optional

from sqlalchemy import func, or_

from fastapi import APIRouter, HTTPException, Query

from techpubs_core.database import get_session
from techpubs_core.models import AircraftModel, Document, DocumentCategory, DocumentChunk, DocumentType, DocumentSerialRange, DocumentVersion, DocumentJob

from config import settings
from schemas.documents import (
    DocumentDetailResponse,
    DocumentDownloadUrlResponse,
    DocumentListItem,
    DocumentListResponse,
    DocumentUpdateRequest,
    DocumentVersionDetail,
    ReprocessResponse,
    SerialRangeResponse,
)
from services.azure_storage import azure_storage_service
from services.cache_service import SearchCacheService
from services.queue_service import queue_service

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=DocumentListResponse)
def list_documents(
    platform_id: Optional[int] = Query(None, description="Filter by platform ID"),
    generation_id: Optional[int] = Query(None, description="Filter by generation ID"),
    document_type_id: Optional[int] = Query(None, description="Filter by document type ID"),
    document_category_id: Optional[int] = Query(None, description="Filter by document category ID"),
    search: Optional[str] = Query(None, description="Search by document name or aircraft model code"),
    aircraft_model_id: Optional[int] = Query(None, description="Filter by aircraft model ID"),
) -> DocumentListResponse:
    """List all documents with their embed status (embedded_chunks/total_chunks)."""
    with get_session() as session:
        # Subquery to get the latest document_version_id for each document
        latest_version_subq = (
            session.query(
                DocumentVersion.document_id,
                func.max(DocumentVersion.id).label("latest_version_id"),
            )
            .filter(DocumentVersion.deleted_at.is_(None))
            .group_by(DocumentVersion.document_id)
            .subquery()
        )

        # Subquery to get chunk counts for each document version
        chunk_counts_subq = (
            session.query(
                DocumentChunk.document_version_id,
                func.count(DocumentChunk.id).label("total_chunks"),
                func.count(DocumentChunk.embedding).label("embedded_chunks"),
            )
            .group_by(DocumentChunk.document_version_id)
            .subquery()
        )

        # Main query
        query = (
            session.query(
                Document.id,
                Document.guid,
                Document.name,
                AircraftModel.name.label("aircraft_model_name"),
                func.coalesce(chunk_counts_subq.c.total_chunks, 0).label("total_chunks"),
                func.coalesce(chunk_counts_subq.c.embedded_chunks, 0).label("embedded_chunks"),
                Document.created_at,
            )
            .outerjoin(AircraftModel, Document.aircraft_model_id == AircraftModel.id)
            .outerjoin(
                latest_version_subq,
                Document.id == latest_version_subq.c.document_id,
            )
            .outerjoin(
                chunk_counts_subq,
                latest_version_subq.c.latest_version_id == chunk_counts_subq.c.document_version_id,
            )
            .filter(Document.deleted_at.is_(None))
        )

        # Apply optional filters
        if platform_id is not None:
            query = query.filter(Document.platform_id == platform_id)

        if generation_id is not None:
            query = query.filter(Document.generation_id == generation_id)

        if document_type_id is not None:
            query = query.filter(Document.document_type_id == document_type_id)

        if document_category_id is not None:
            query = query.join(DocumentType, Document.document_type_id == DocumentType.id).filter(
                DocumentType.document_category_id == document_category_id
            )

        if aircraft_model_id is not None:
            query = query.filter(Document.aircraft_model_id == aircraft_model_id)

        if search is not None and search.strip():
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Document.name.ilike(search_term),
                    AircraftModel.code.ilike(search_term),
                )
            )

        query = query.order_by(Document.created_at.desc())

        results = query.all()

        # Get all document IDs to fetch serial ranges
        doc_ids = [row.id for row in results]

        # Fetch all serial ranges for these documents
        serial_ranges_by_doc: dict[int, list[SerialRangeResponse]] = {doc_id: [] for doc_id in doc_ids}
        if doc_ids:
            all_serial_ranges = (
                session.query(DocumentSerialRange)
                .filter(DocumentSerialRange.document_id.in_(doc_ids))
                .all()
            )
            for sr in all_serial_ranges:
                serial_ranges_by_doc[sr.document_id].append(
                    SerialRangeResponse(
                        id=sr.id,
                        range_type=sr.range_type,
                        serial_start=sr.serial_start,
                        serial_end=sr.serial_end,
                    )
                )

        documents = [
            DocumentListItem(
                id=row.id,
                guid=str(row.guid),
                name=row.name,
                aircraft_model_name=row.aircraft_model_name,
                total_chunks=row.total_chunks,
                embedded_chunks=row.embedded_chunks,
                serial_ranges=serial_ranges_by_doc.get(row.id, []),
                created_at=row.created_at,
            )
            for row in results
        ]

        return DocumentListResponse(
            documents=documents,
            total=len(documents),
        )


@router.get("/{guid}", response_model=DocumentDetailResponse)
def get_document(guid: str) -> DocumentDetailResponse:
    """Get document details by GUID."""
    with get_session() as session:
        # Query for document with aircraft model, category, and latest version
        document = (
            session.query(Document)
            .filter(Document.guid == guid, Document.deleted_at.is_(None))
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Get aircraft model name if exists
        aircraft_model_name = None
        if document.aircraft_model_id:
            aircraft_model = session.query(AircraftModel).get(document.aircraft_model_id)
            if aircraft_model:
                aircraft_model_name = aircraft_model.name

        # Get document type and category info if exists
        document_type_id = document.document_type_id
        document_type_name = None
        document_category_id = None
        document_category_name = None
        if document_type_id:
            document_type = session.query(DocumentType).get(document_type_id)
            if document_type:
                document_type_name = document_type.name
                document_category_id = document_type.document_category_id
                document_category = session.query(DocumentCategory).get(document_category_id)
                if document_category:
                    document_category_name = document_category.name

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

        latest_version_detail = None
        if latest_version:
            latest_version_detail = DocumentVersionDetail(
                guid=str(latest_version.guid),
                name=latest_version.name,
                file_name=latest_version.file_name,
                content_type=latest_version.content_type,
                file_size=latest_version.file_size,
                blob_path=latest_version.blob_path,
            )

        # Get serial ranges
        serial_ranges = (
            session.query(DocumentSerialRange)
            .filter(DocumentSerialRange.document_id == document.id)
            .all()
        )
        serial_range_responses = [
            SerialRangeResponse(
                id=sr.id,
                range_type=sr.range_type,
                serial_start=sr.serial_start,
                serial_end=sr.serial_end,
            )
            for sr in serial_ranges
        ]

        return DocumentDetailResponse(
            guid=str(document.guid),
            name=document.name,
            aircraft_model_id=document.aircraft_model_id,
            aircraft_model_name=aircraft_model_name,
            document_category_id=document_category_id,
            document_category_name=document_category_name,
            document_type_id=document_type_id,
            document_type_name=document_type_name,
            latest_version=latest_version_detail,
            serial_ranges=serial_range_responses,
        )


@router.patch("/{guid}", response_model=DocumentDetailResponse)
def update_document(guid: str, request: DocumentUpdateRequest) -> DocumentDetailResponse:
    """Update document metadata by GUID."""
    with get_session() as session:
        document = (
            session.query(Document)
            .filter(Document.guid == guid, Document.deleted_at.is_(None))
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Update name if provided
        if request.name is not None:
            document.name = request.name

        # Update document_type_id if provided (category is derived from type)
        if request.document_type_id is not None:
            # Verify the document type exists
            document_type = session.query(DocumentType).get(request.document_type_id)
            if not document_type:
                raise HTTPException(status_code=400, detail="Invalid document type ID")
            document.document_type_id = request.document_type_id
        elif request.document_category_id is not None and request.document_type_id is None:
            # If category provided but no type, clear the type
            document.document_type_id = None

        # Update serial ranges if provided (replace all)
        if request.serial_ranges is not None:
            # Delete existing serial ranges
            session.query(DocumentSerialRange).filter(
                DocumentSerialRange.document_id == document.id
            ).delete()

            # Insert new serial ranges
            for sr in request.serial_ranges:
                new_range = DocumentSerialRange(
                    document_id=document.id,
                    range_type=sr.range_type,
                    serial_start=sr.serial_start,
                    serial_end=sr.serial_end if sr.range_type == "range" else None,
                )
                session.add(new_range)

        session.commit()

        # Invalidate search cache since document metadata changed
        if settings.cache_enabled:
            SearchCacheService(session).invalidate_corpus()

        # Fetch updated data for response
        # Get aircraft model name if exists
        aircraft_model_name = None
        if document.aircraft_model_id:
            aircraft_model = session.query(AircraftModel).get(document.aircraft_model_id)
            if aircraft_model:
                aircraft_model_name = aircraft_model.name

        # Get document type and category info if exists
        document_type_id = document.document_type_id
        document_type_name = None
        document_category_id = None
        document_category_name = None
        if document_type_id:
            document_type = session.query(DocumentType).get(document_type_id)
            if document_type:
                document_type_name = document_type.name
                document_category_id = document_type.document_category_id
                document_category = session.query(DocumentCategory).get(document_category_id)
                if document_category:
                    document_category_name = document_category.name

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

        latest_version_detail = None
        if latest_version:
            latest_version_detail = DocumentVersionDetail(
                guid=str(latest_version.guid),
                name=latest_version.name,
                file_name=latest_version.file_name,
                content_type=latest_version.content_type,
                file_size=latest_version.file_size,
                blob_path=latest_version.blob_path,
            )

        # Get serial ranges
        serial_ranges = (
            session.query(DocumentSerialRange)
            .filter(DocumentSerialRange.document_id == document.id)
            .all()
        )
        serial_range_responses = [
            SerialRangeResponse(
                id=sr.id,
                range_type=sr.range_type,
                serial_start=sr.serial_start,
                serial_end=sr.serial_end,
            )
            for sr in serial_ranges
        ]

        return DocumentDetailResponse(
            guid=str(document.guid),
            name=document.name,
            aircraft_model_id=document.aircraft_model_id,
            aircraft_model_name=aircraft_model_name,
            document_category_id=document_category_id,
            document_category_name=document_category_name,
            document_type_id=document_type_id,
            document_type_name=document_type_name,
            latest_version=latest_version_detail,
            serial_ranges=serial_range_responses,
        )


@router.get("/{guid}/download-url", response_model=DocumentDownloadUrlResponse)
def get_document_download_url(guid: str) -> DocumentDownloadUrlResponse:
    """Get a pre-signed SAS URL for downloading/viewing a document."""
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

        if not latest_version or not latest_version.blob_path:
            raise HTTPException(
                status_code=404, detail="No document version available for download"
            )

        # Generate the download URL
        download_url = azure_storage_service.generate_download_url(latest_version.blob_path)

        return DocumentDownloadUrlResponse(
            download_url=download_url,
            file_name=latest_version.file_name,
            file_size=latest_version.file_size,
            content_type=latest_version.content_type,
        )


@router.delete("/{guid}", status_code=204)
def delete_document(guid: str) -> None:
    """Soft delete a document by GUID and cancel any incomplete jobs."""
    with get_session() as session:
        document = (
            session.query(Document)
            .filter(Document.guid == guid, Document.deleted_at.is_(None))
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Cancel any incomplete jobs for this document's versions
        version_ids = [v.id for v in document.versions]
        if version_ids:
            session.query(DocumentJob).filter(
                DocumentJob.document_version_id.in_(version_ids),
                DocumentJob.status.in_(["pending", "processing"]),
            ).update({"status": "cancelled"}, synchronize_session=False)

        document.deleted_at = func.now()
        session.commit()

        # Invalidate search cache since document was deleted
        if settings.cache_enabled:
            SearchCacheService(session).invalidate_corpus()


@router.post("/{guid}/reprocess", response_model=ReprocessResponse)
def reprocess_document(guid: str) -> ReprocessResponse:
    """Reprocess a document by cancelling pending jobs, deleting chunks, and queuing new chunking job."""
    with get_session() as session:
        # Find document and validate
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

        # Cancel any pending/running jobs for this version
        jobs_cancelled = (
            session.query(DocumentJob)
            .filter(
                DocumentJob.document_version_id == latest_version.id,
                DocumentJob.status.in_(["pending", "processing"]),
            )
            .update({"status": "cancelled"}, synchronize_session=False)
        )

        # Delete existing chunks for this version
        session.query(DocumentChunk).filter(
            DocumentChunk.document_version_id == latest_version.id
        ).delete(synchronize_session=False)

        # Create new chunking job
        new_job = DocumentJob(
            document_version_id=latest_version.id,
            job_type="chunking",
            status="pending",
        )
        session.add(new_job)
        session.commit()

        # Queue the chunking job
        queue_service.send_chunking_job_message(new_job.id)

        return ReprocessResponse(
            success=True,
            message=f"Document queued for reprocessing",
            jobs_cancelled=jobs_cancelled,
        )
