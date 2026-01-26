from datetime import datetime
from typing import Literal, Optional

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
    name: str
    file_name: str
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    blob_path: Optional[str] = None

    class Config:
        from_attributes = True


class SerialRangeResponse(BaseModel):
    id: int
    range_type: Literal["single", "range", "and_subs"]
    serial_start: int
    serial_end: Optional[int] = None

    class Config:
        from_attributes = True


class DocumentDetailResponse(BaseModel):
    guid: str
    name: str
    aircraft_model_id: Optional[int] = None
    aircraft_model_code: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    latest_version: Optional[DocumentVersionDetail] = None
    serial_ranges: list[SerialRangeResponse] = []

    class Config:
        from_attributes = True


class DocumentDownloadUrlResponse(BaseModel):
    download_url: str
    file_name: str
    file_size: Optional[int] = None
    content_type: Optional[str] = None
