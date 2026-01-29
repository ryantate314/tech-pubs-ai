"""Tools for the search agent."""

import math
import time

from pydantic import BaseModel
from pydantic_ai import RunContext
from sqlalchemy import text

from techpubs_core.embeddings import generate_embedding

from .dependencies import SearchAgentDeps


def _sanitize_similarity(value: float) -> float:
    """Sanitize similarity score - replace NaN/Inf with 0.0."""
    if math.isnan(value) or math.isinf(value):
        return 0.0
    return value


class VectorSearchResult(BaseModel):
    """A single result from vector search."""

    chunk_id: int
    content: str
    page_number: int | None
    chapter_title: str | None
    document_guid: str
    document_name: str
    aircraft_model_name: str | None
    similarity: float
    chunk_index: int
    document_version_id: int


class ChunkContext(BaseModel):
    """Context around a chunk including adjacent chunks."""

    target_chunk: VectorSearchResult
    before_chunks: list[VectorSearchResult]
    after_chunks: list[VectorSearchResult]


def vector_search(
    ctx: RunContext[SearchAgentDeps],
    query: str,
    limit: int = 10,
    min_similarity: float | None = None,
) -> list[VectorSearchResult]:
    """
    Execute a vector similarity search against document chunks.

    Args:
        query: The search query text to embed and search for
        limit: Maximum number of results to return (default 10)
        min_similarity: Minimum cosine similarity threshold (0-1). Uses default from deps if not specified.

    Returns:
        List of matching chunks with content, metadata, and similarity scores
    """
    start_time = time.perf_counter()
    deps = ctx.deps

    print(f"DEBUG: vector_search called with query: '{query[:80]}{'...' if len(query) > 80 else ''}'")

    # Use provided min_similarity or fall back to deps default
    effective_min_similarity = (
        min_similarity if min_similarity is not None else deps.min_similarity
    )

    # Limit results to configured max
    effective_limit = min(limit, deps.max_results)

    # Generate embedding for the query (this calls Azure OpenAI)
    embed_start = time.perf_counter()
    query_embedding = generate_embedding(query)
    embed_elapsed = (time.perf_counter() - embed_start) * 1000
    print(f"DEBUG: vector_search embedding took {embed_elapsed:.2f}ms")

    sql = """
        SELECT
            dc.id as chunk_id,
            dc.content,
            dc.page_number,
            dc.chapter_title,
            d.guid::text as document_guid,
            d.name as document_name,
            am.name as aircraft_model_name,
            1 - (dc.embedding <=> CAST(:query_embedding AS vector)) as similarity,
            dc.chunk_index,
            dc.document_version_id
        FROM document_chunks dc
        JOIN document_versions dv ON dc.document_version_id = dv.id
        JOIN documents d ON dv.document_id = d.id
        LEFT JOIN aircraft_models am ON d.aircraft_model_id = am.id
        WHERE dc.embedding IS NOT NULL
          AND dv.deleted_at IS NULL
          AND d.deleted_at IS NULL
          AND 1 - (dc.embedding <=> CAST(:query_embedding AS vector)) >= :min_similarity
    """

    params = {
        "query_embedding": str(query_embedding),
        "min_similarity": effective_min_similarity,
        "limit": effective_limit,
    }

    sql += " ORDER BY similarity DESC LIMIT :limit"

    result = deps.session.execute(text(sql), params)
    rows = result.fetchall()

    elapsed_ms = (time.perf_counter() - start_time) * 1000
    print(f"DEBUG: vector_search completed in {elapsed_ms:.2f}ms, found {len(rows)} results")

    return [
        VectorSearchResult(
            chunk_id=row.chunk_id,
            content=row.content,
            page_number=row.page_number,
            chapter_title=row.chapter_title,
            document_guid=row.document_guid,
            document_name=row.document_name,
            aircraft_model_name=row.aircraft_model_name,
            similarity=_sanitize_similarity(float(row.similarity)),
            chunk_index=row.chunk_index,
            document_version_id=row.document_version_id,
        )
        for row in rows
    ]


def get_chunk_context(
    ctx: RunContext[SearchAgentDeps],
    chunk_id: int,
    before: int = 1,
    after: int = 1,
) -> ChunkContext | None:
    """
    Get the surrounding context for a chunk by fetching adjacent chunks.

    Args:
        chunk_id: The ID of the target chunk
        before: Number of chunks to fetch before the target (default 1)
        after: Number of chunks to fetch after the target (default 1)

    Returns:
        ChunkContext with the target chunk and its neighbors, or None if chunk not found
    """
    start_time = time.perf_counter()
    print(f"DEBUG: get_chunk_context called for chunk_id={chunk_id}, before={before}, after={after}")

    deps = ctx.deps

    # First get the target chunk to find its position
    target_sql = """
        SELECT
            dc.id as chunk_id,
            dc.content,
            dc.page_number,
            dc.chapter_title,
            d.guid::text as document_guid,
            d.name as document_name,
            am.name as aircraft_model_name,
            dc.chunk_index,
            dc.document_version_id
        FROM document_chunks dc
        JOIN document_versions dv ON dc.document_version_id = dv.id
        JOIN documents d ON dv.document_id = d.id
        LEFT JOIN aircraft_models am ON d.aircraft_model_id = am.id
        WHERE dc.id = :chunk_id
    """

    result = deps.session.execute(text(target_sql), {"chunk_id": chunk_id})
    target_row = result.fetchone()

    if not target_row:
        return None

    target_chunk = VectorSearchResult(
        chunk_id=target_row.chunk_id,
        content=target_row.content,
        page_number=target_row.page_number,
        chapter_title=target_row.chapter_title,
        document_guid=target_row.document_guid,
        document_name=target_row.document_name,
        aircraft_model_name=target_row.aircraft_model_name,
        similarity=1.0,  # Target chunk has perfect similarity to itself
        chunk_index=target_row.chunk_index,
        document_version_id=target_row.document_version_id,
    )

    # Get adjacent chunks from the same document version
    context_sql = """
        SELECT
            dc.id as chunk_id,
            dc.content,
            dc.page_number,
            dc.chapter_title,
            d.guid::text as document_guid,
            d.name as document_name,
            am.name as aircraft_model_name,
            dc.chunk_index,
            dc.document_version_id
        FROM document_chunks dc
        JOIN document_versions dv ON dc.document_version_id = dv.id
        JOIN documents d ON dv.document_id = d.id
        LEFT JOIN aircraft_models am ON d.aircraft_model_id = am.id
        WHERE dc.document_version_id = :doc_version_id
          AND dc.chunk_index >= :min_index
          AND dc.chunk_index <= :max_index
          AND dc.id != :chunk_id
        ORDER BY dc.chunk_index
    """

    min_index = max(0, target_row.chunk_index - before)
    max_index = target_row.chunk_index + after

    result = deps.session.execute(
        text(context_sql),
        {
            "doc_version_id": target_row.document_version_id,
            "min_index": min_index,
            "max_index": max_index,
            "chunk_id": chunk_id,
        },
    )
    context_rows = result.fetchall()

    before_chunks = []
    after_chunks = []

    for row in context_rows:
        chunk = VectorSearchResult(
            chunk_id=row.chunk_id,
            content=row.content,
            page_number=row.page_number,
            chapter_title=row.chapter_title,
            document_guid=row.document_guid,
            document_name=row.document_name,
            aircraft_model_name=row.aircraft_model_name,
            similarity=0.0,  # Context chunks don't have similarity scores
            chunk_index=row.chunk_index,
            document_version_id=row.document_version_id,
        )
        if row.chunk_index < target_row.chunk_index:
            before_chunks.append(chunk)
        else:
            after_chunks.append(chunk)

    elapsed_ms = (time.perf_counter() - start_time) * 1000
    print(f"DEBUG: get_chunk_context completed in {elapsed_ms:.2f}ms, found {len(before_chunks)} before, {len(after_chunks)} after")

    return ChunkContext(
        target_chunk=target_chunk,
        before_chunks=before_chunks,
        after_chunks=after_chunks,
    )
