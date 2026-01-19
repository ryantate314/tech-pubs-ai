from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class JobResponse(BaseModel):
    id: int
    document_version_id: int
    document_name: str
    job_type: str
    status: str
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    pending_count: int
    running_count: int
    completed_count: int
    failed_count: int
    cancelled_count: int


class JobActionResponse(BaseModel):
    success: bool
    message: str
    job: JobResponse
