from fastapi import APIRouter, HTTPException

from techpubs_core.database import get_session
from techpubs_core.models import Platform, Generation

from schemas.platforms import PlatformResponse
from schemas.generations import GenerationResponse

router = APIRouter(prefix="/api/platforms", tags=["platforms"])


@router.get("", response_model=list[PlatformResponse])
def list_platforms() -> list[PlatformResponse]:
    """List all aircraft platforms."""
    with get_session() as session:
        platforms = session.query(Platform).order_by(Platform.display_order).all()
        return [
            PlatformResponse(
                id=p.id,
                code=p.code,
                name=p.name,
                description=p.description,
                display_order=p.display_order,
            )
            for p in platforms
        ]


@router.get("/{platform_id}/generations", response_model=list[GenerationResponse])
def list_generations_for_platform(platform_id: int) -> list[GenerationResponse]:
    """List generations for a specific platform."""
    with get_session() as session:
        # Verify platform exists
        platform = session.query(Platform).filter(Platform.id == platform_id).first()
        if not platform:
            raise HTTPException(status_code=404, detail="Platform not found")

        generations = (
            session.query(Generation)
            .filter(Generation.platform_id == platform_id)
            .order_by(Generation.display_order)
            .all()
        )
        return [
            GenerationResponse(
                id=g.id,
                code=g.code,
                name=g.name,
                display_order=g.display_order,
            )
            for g in generations
        ]
