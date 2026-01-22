from fastapi import APIRouter, HTTPException

from techpubs_core.database import get_session
from techpubs_core.models import DocumentCategory, DocumentType

from schemas.document_categories import DocumentCategoryResponse
from schemas.document_types import DocumentTypeResponse

router = APIRouter(prefix="/api/document-categories", tags=["document-categories"])


@router.get("", response_model=list[DocumentCategoryResponse])
def list_document_categories() -> list[DocumentCategoryResponse]:
    """List all document categories."""
    with get_session() as session:
        categories = (
            session.query(DocumentCategory)
            .order_by(DocumentCategory.display_order)
            .all()
        )
        return [
            DocumentCategoryResponse(
                id=c.id,
                code=c.code,
                name=c.name,
                description=c.description,
                display_order=c.display_order,
            )
            for c in categories
        ]


@router.get("/{category_id}/types", response_model=list[DocumentTypeResponse])
def list_types_for_category(category_id: int) -> list[DocumentTypeResponse]:
    """List document types for a specific category."""
    with get_session() as session:
        # Verify category exists
        category = (
            session.query(DocumentCategory)
            .filter(DocumentCategory.id == category_id)
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Document category not found")

        types = (
            session.query(DocumentType)
            .filter(DocumentType.document_category_id == category_id)
            .order_by(DocumentType.display_order)
            .all()
        )
        return [
            DocumentTypeResponse(
                id=t.id,
                code=t.code,
                name=t.name,
                description=t.description,
                display_order=t.display_order,
            )
            for t in types
        ]
