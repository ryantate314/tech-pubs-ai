from sqlalchemy import func
from sqlalchemy.orm import aliased

from fastapi import APIRouter

from techpubs_core.database import get_session
from techpubs_core.models import AircraftModel, Category, Document, DocumentJob, DocumentVersion

from schemas.documents import DocumentListItem, DocumentListResponse

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
