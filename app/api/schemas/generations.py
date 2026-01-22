from pydantic import BaseModel


class GenerationResponse(BaseModel):
    id: int
    code: str
    name: str
    display_order: int

    class Config:
        from_attributes = True
