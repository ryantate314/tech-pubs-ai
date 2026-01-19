from fastapi import APIRouter

from techpubs_core.database import get_session
from techpubs_core.models import AircraftModel

from schemas.aircraft_models import AircraftModelResponse

router = APIRouter(prefix="/api/aircraft-models", tags=["aircraft-models"])


@router.get("", response_model=list[AircraftModelResponse])
def list_aircraft_models() -> list[AircraftModelResponse]:
    """List all aircraft models."""
    with get_session() as session:
        models = session.query(AircraftModel).all()
        return [
            AircraftModelResponse(id=m.id, code=m.code, name=m.name) for m in models
        ]
