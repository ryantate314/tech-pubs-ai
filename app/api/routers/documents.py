from sqlalchemy import func
from sqlalchemy.orm import aliased

from fastapi import APIRouter, HTTPException

from techpubs_core.database import get_session
from techpubs_core.models import AircraftModel, Category, Document, DocumentJob, DocumentVersion

from schemas.documents import (
    DocumentDetailResponse,
    DocumentDownloadUrlResponse,
    DocumentListItem,
    DocumentListResponse,
    DocumentVersionDetail,
)
from services.azure_storage import azure_storage_service

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=DocumentListResponse)
def list_documents() -> DocumentListResponse:
    """List all documents with their latest job status."""
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

        # Subquery to get the latest job for each document version
        latest_job_subq = (
            session.query(
                DocumentJob.document_version_id,
                func.max(DocumentJob.id).label("latest_job_id"),
            )
            .group_by(DocumentJob.document_version_id)
            .subquery()
        )

        # Alias for the DocumentJob to get status
        LatestJob = aliased(DocumentJob)

        # Main query
        query = (
            session.query(
                Document.id,
                Document.guid,
                Document.name,
                AircraftModel.code.label("aircraft_model_code"),
                Category.name.label("category_name"),
                LatestJob.status.label("latest_job_status"),
                Document.created_at,
            )
            .outerjoin(AircraftModel, Document.aircraft_model_id == AircraftModel.id)
            .outerjoin(Category, Document.category_id == Category.id)
            .outerjoin(
                latest_version_subq,
                Document.id == latest_version_subq.c.document_id,
            )
            .outerjoin(
                latest_job_subq,
                latest_version_subq.c.latest_version_id == latest_job_subq.c.document_version_id,
            )
            .outerjoin(
                LatestJob,
                latest_job_subq.c.latest_job_id == LatestJob.id,
            )
            .filter(Document.deleted_at.is_(None))
            .order_by(Document.created_at.desc())
        )

        results = query.all()

        documents = [
            DocumentListItem(
                id=row.id,
                guid=str(row.guid),
                name=row.name,
                aircraft_model_code=row.aircraft_model_code,
                category_name=row.category_name,
                latest_job_status=row.latest_job_status,
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

        # Get aircraft model code if exists
        aircraft_model_code = None
        if document.aircraft_model_id:
            aircraft_model = session.query(AircraftModel).get(document.aircraft_model_id)
            if aircraft_model:
                aircraft_model_code = aircraft_model.code

        # Get category name if exists
        category_name = None
        if document.category_id:
            category = session.query(Category).get(document.category_id)
            if category:
                category_name = category.name

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

        return DocumentDetailResponse(
            guid=str(document.guid),
            name=document.name,
            aircraft_model_id=document.aircraft_model_id,
            aircraft_model_code=aircraft_model_code,
            category_id=document.category_id,
            category_name=category_name,
            latest_version=latest_version_detail,
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
