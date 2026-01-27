from typing import Optional

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query text")
    limit: int = Field(default=10, ge=1, le=100, description="Maximum number of results")
    min_similarity: float = Field(default=0.5, ge=0.0, le=1.0, description="Minimum similarity threshold")
    aircraft_model_id: Optional[int] = Field(default=None, description="Filter by aircraft model ID")


class ChunkResult(BaseModel):
    id: int
    content: str
    summary: str
    page_number: Optional[int] = None
    chapter_title: Optional[str] = None
    document_guid: str
    document_name: str
    aircraft_model_name: Optional[str] = None
    similarity: float

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    query: str
    results: list[ChunkResult]
    total_found: int
