from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ChunkResponse(BaseModel):
    id: int
    chunk_index: int
    content_preview: str
    has_embedding: bool
    embedding_model: Optional[str] = None
    token_count: Optional[int] = None
    page_number: Optional[int] = None
    chapter_title: Optional[str] = None

    class Config:
        from_attributes = True


class JobSummary(BaseModel):
    id: int
    job_type: str
    status: str
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    chunk_start_index: Optional[int] = None
    chunk_end_index: Optional[int] = None

    class Config:
        from_attributes = True


class DocumentChunksResponse(BaseModel):
    document_guid: str
    document_name: str
    version_guid: str
    version_name: str
    total_chunks: int
    embedded_chunks: int
    total_tokens: int
    embedding_model: Optional[str] = None
    chunks: list[ChunkResponse]
    jobs: list[JobSummary]
    page: int
    page_size: int
    total_pages: int
