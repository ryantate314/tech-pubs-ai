"""Search caching service for reducing API costs and improving response times."""

import hashlib
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import delete, insert, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from techpubs_core.models import CorpusVersion, EmbeddingCache, SearchCache


class SearchCacheService:
    """Service for managing search result and embedding caches."""

    def __init__(
        self,
        session: Session,
        result_ttl_seconds: int = 604800,  # 7 days
        embedding_ttl_seconds: int = 2592000,  # 30 days
    ):
        self.session = session
        self.result_ttl = result_ttl_seconds
        self.embedding_ttl = embedding_ttl_seconds

    def get_corpus_version(self) -> str:
        """Get current corpus version."""
        result = self.session.execute(select(CorpusVersion.version)).scalar()
        return result or "initial"

    def invalidate_corpus(self) -> str:
        """Invalidate corpus version, causing cache misses for search results.

        Returns:
            The new corpus version string.
        """
        new_version = uuid4().hex[:8]
        self.session.execute(
            update(CorpusVersion)
            .where(CorpusVersion.id == 1)
            .values(version=new_version, updated_at=datetime.utcnow())
        )
        self.session.commit()
        return new_version

    def build_cache_key(
        self,
        query: str,
        limit: int,
        min_similarity: float,
        corpus_version: str,
    ) -> str:
        """Build a deterministic cache key from search parameters."""
        # Normalize query: lowercase, collapse whitespace
        normalized = " ".join(query.lower().strip().split())
        query_hash = hashlib.sha256(normalized.encode()).hexdigest()[:16]
        sim_int = int(min_similarity * 100)
        return f"search:q:{query_hash}:lim:{limit}:sim:{sim_int}:cv:{corpus_version}"

    def get_cached_result(self, cache_key: str) -> dict | None:
        """Get cached search result if exists and not expired."""
        cached = self.session.execute(
            select(SearchCache.response)
            .where(SearchCache.cache_key == cache_key)
            .where(SearchCache.expires_at > datetime.utcnow())
        ).scalar()
        return cached

    def cache_result(
        self,
        cache_key: str,
        query: str,
        response: dict,
        corpus_version: str,
    ) -> None:
        """Store search result in cache using upsert."""
        expires_at = datetime.utcnow() + timedelta(seconds=self.result_ttl)
        stmt = pg_insert(SearchCache).values(
            cache_key=cache_key,
            query_text=query,
            response=response,
            corpus_version=corpus_version,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["cache_key"],
            set_={
                "response": response,
                "expires_at": expires_at,
            },
        )
        self.session.execute(stmt)
        self.session.commit()

    def get_cached_embedding(self, text: str) -> list[float] | None:
        """Get cached embedding for text if exists and not expired."""
        text_hash = hashlib.sha256(text.encode()).hexdigest()
        cached = self.session.execute(
            select(EmbeddingCache.embedding)
            .where(EmbeddingCache.text_hash == text_hash)
            .where(EmbeddingCache.expires_at > datetime.utcnow())
        ).scalar()
        if cached is not None:
            return cached.tolist()
        return None

    def cache_embedding(self, text: str, embedding: list[float]) -> None:
        """Store embedding in cache using upsert."""
        text_hash = hashlib.sha256(text.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(seconds=self.embedding_ttl)
        stmt = pg_insert(EmbeddingCache).values(
            text_hash=text_hash,
            embedding=embedding,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["text_hash"],
            set_={
                "embedding": embedding,
                "expires_at": expires_at,
            },
        )
        self.session.execute(stmt)
        self.session.commit()

    def cleanup_expired(self) -> tuple[int, int]:
        """Delete expired cache entries.

        Returns:
            Tuple of (embedding_count, search_count) deleted.
        """
        now = datetime.utcnow()

        embedding_result = self.session.execute(
            delete(EmbeddingCache).where(EmbeddingCache.expires_at < now)
        )
        search_result = self.session.execute(
            delete(SearchCache).where(SearchCache.expires_at < now)
        )
        self.session.commit()

        return (embedding_result.rowcount, search_result.rowcount)
