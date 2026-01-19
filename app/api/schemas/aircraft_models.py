from pydantic import BaseModel


class AircraftModelResponse(BaseModel):
    id: int
    code: str
    name: str
