from fastapi import APIRouter

from techpubs_core.database import get_session
from techpubs_core.models import Category

from schemas.categories import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories() -> list[CategoryResponse]:
    """List all categories."""
    with get_session() as session:
        categories = session.query(Category).filter(Category.deleted_at.is_(None)).all()
        return [CategoryResponse(id=c.id, name=c.name) for c in categories]
