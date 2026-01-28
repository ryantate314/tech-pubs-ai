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


class QueueActionResponse(BaseModel):
    success: bool
    message: str
    messages_cleared: int


# Hierarchical job schemas
class ChildJobCounts(BaseModel):
    total: int
    completed: int
    failed: int


class ParentJobResponse(BaseModel):
    id: int
    document_version_id: int
    document_name: str
    document_version: str
    job_type: str
    status: str
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    child_job_counts: ChildJobCounts

    class Config:
        from_attributes = True


class ParentJobListResponse(BaseModel):
    jobs: list[ParentJobResponse]
    total: int
    pending_count: int
    running_count: int
    completed_count: int
    failed_count: int
    cancelled_count: int


class ChildJobResponse(BaseModel):
    id: int
    job_type: str
    status: str
    error_message: Optional[str] = None
    chunk_start_index: Optional[int] = None
    chunk_end_index: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobDetailResponse(BaseModel):
    parent_job: ParentJobResponse
    child_jobs: list[ChildJobResponse]
