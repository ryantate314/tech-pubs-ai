from typing import Optional
from pydantic import BaseModel


class DocumentTypeResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True
