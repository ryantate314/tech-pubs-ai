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


class DocumentVersionDetail(BaseModel):
    guid: str
    file_name: str
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    blob_path: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentDetailResponse(BaseModel):
    guid: str
    name: str
    aircraft_model_code: Optional[str] = None
    category_name: Optional[str] = None
    latest_version: Optional[DocumentVersionDetail] = None

    class Config:
        from_attributes = True


class DocumentDownloadUrlResponse(BaseModel):
    download_url: str
    file_name: str
    file_size: Optional[int] = None
    content_type: Optional[str] = None
