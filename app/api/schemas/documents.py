from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentListItem(BaseModel):
    id: int
    guid: str
    name: str
    aircraft_model_code: Optional[str] = None
    category_name: Optional[str] = None
    latest_job_status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: list[DocumentListItem]
    total: int
