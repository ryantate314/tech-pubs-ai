import os
from functools import lru_cache

from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from tenacity import retry, stop_after_attempt, wait_exponential

# Embedding dimension for text-embedding-3-small
EMBEDDING_DIMENSION = 1536


def _get_deployment() -> str:
    """Get the Azure OpenAI embedding deployment name."""
    return os.environ.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")


def get_embedding_model() -> str:
    """Get the embedding model identifier for tracking purposes."""
    return f"azure/{_get_deployment()}"


@lru_cache(maxsize=1)
def _get_client() -> AzureOpenAI:
    """Create Azure OpenAI client with Entra ID authentication."""
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    if not endpoint:
        raise ValueError("AZURE_OPENAI_ENDPOINT environment variable required")

    token_provider = get_bearer_token_provider(
        DefaultAzureCredential(),
        "https://cognitiveservices.azure.com/.default"
    )
    return AzureOpenAI(
        azure_endpoint=endpoint,
        azure_ad_token_provider=token_provider,
        api_version="2024-02-15-preview"
    )


def _sanitize_text(text: str) -> str:
    """Sanitize text for the OpenAI embedding API.

    Removes null bytes, control characters, and normalizes whitespace.
    """
    import re

    # Remove null bytes
    text = text.replace('\x00', '')

    # Remove control characters (ASCII 0-31) except tab, newline, carriage return
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)

    # Remove invalid Unicode surrogates
    text = text.encode('utf-8', errors='ignore').decode('utf-8')

    # Normalize whitespace (collapse multiple spaces/newlines)
    text = ' '.join(text.split())

    return text


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def _embed(texts: list[str]) -> list[list[float]]:
    """Generate embeddings using Azure OpenAI API."""
    import time

    client = _get_client()
    deployment = _get_deployment()

    # Sanitize inputs to avoid API errors
    sanitized_texts = [_sanitize_text(t) for t in texts]

    # Filter out empty strings and track their positions
    non_empty_indices = set(i for i, t in enumerate(sanitized_texts) if t.strip())
    non_empty_texts = [sanitized_texts[i] for i in sorted(non_empty_indices)]

    if not non_empty_texts:
        # All texts were empty, return zero vectors
        return [[0.0] * EMBEDDING_DIMENSION for _ in texts]

    try:
        start_time = time.perf_counter()
        response = client.embeddings.create(
            input=non_empty_texts,
            model=deployment,
            dimensions=EMBEDDING_DIMENSION
        )
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # Log timing and token usage
        tokens_used = response.usage.total_tokens if response.usage else "unknown"
        print(f"DEBUG: Embedding API call took {elapsed_ms:.2f}ms for {len(non_empty_texts)} texts ({tokens_used} tokens)")

        # Log rate limit headers if available
        if hasattr(response, '_response') and response._response:
            headers = response._response.headers
            remaining = headers.get('x-ratelimit-remaining-tokens')
            reset = headers.get('x-ratelimit-reset-tokens')
            if remaining or reset:
                print(f"DEBUG: Rate limit - remaining tokens: {remaining}, reset: {reset}")
    except Exception as ex:
        print('WARNING: Error generating embeddings', ex)
        raise

    # Sort by index to ensure correct order
    sorted_data = sorted(response.data, key=lambda x: x.index)
    api_embeddings = [item.embedding for item in sorted_data]

    # Map embeddings back to original positions, using zero vectors for empty texts
    zero_vector = [0.0] * EMBEDDING_DIMENSION
    result = []
    api_idx = 0
    for i in range(len(texts)):
        if i in non_empty_indices:
            result.append(api_embeddings[api_idx])
            api_idx += 1
        else:
            result.append(zero_vector)

    return result


def generate_embedding(text: str) -> list[float]:
    """Generate embedding for a single text."""
    embeddings = _embed([text])
    return embeddings[0]


def generate_embedding_cached(text: str, session) -> list[float]:
    """Generate embedding with PostgreSQL caching.

    Checks the embedding_cache table before calling the embedding API.
    If a cached embedding exists and hasn't expired, returns it directly.
    Otherwise, generates a new embedding and caches it.

    Args:
        text: The text to generate an embedding for.
        session: SQLAlchemy session for database operations.

    Returns:
        List of floats representing the embedding vector.
    """
    import hashlib
    from datetime import datetime, timedelta

    from sqlalchemy import select
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    from .models import EmbeddingCache

    # Sanitize text before hashing (same sanitization as _embed)
    sanitized = _sanitize_text(text)
    text_hash = hashlib.sha256(sanitized.encode()).hexdigest()

    # Check cache
    cached = session.execute(
        select(EmbeddingCache.embedding)
        .where(EmbeddingCache.text_hash == text_hash)
        .where(EmbeddingCache.expires_at > datetime.utcnow())
    ).scalar()

    if cached is not None:
        return cached.tolist()

    # Generate fresh embedding
    embedding = _embed([sanitized])[0]

    # Store in cache (30 day TTL)
    expires_at = datetime.utcnow() + timedelta(days=30)
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
    session.execute(stmt)
    session.commit()

    return embedding


def generate_embeddings_batch(
    texts: list[str],
    batch_size: int = 32,
    batch_delay: float = 0.0
) -> list[list[float]]:
    """Generate embeddings for multiple texts efficiently.

    Args:
        texts: List of texts to generate embeddings for.
        batch_size: Number of texts per API call.
        batch_delay: Seconds to sleep between batches (helps avoid rate limits).
    """
    import time

    if not texts:
        return []

    all_embeddings: list[list[float]] = []

    # Process in batches
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_embeddings = _embed(batch)
        all_embeddings.extend(batch_embeddings)
        print(f"  Processed {len(all_embeddings)}/{len(texts)} texts")

        # Sleep between batches to avoid rate limiting (skip after last batch)
        if batch_delay > 0 and len(all_embeddings) < len(texts):
            time.sleep(batch_delay)

    return all_embeddings


def cosine_similarity(embedding1: list[float], embedding2: list[float]) -> float:
    """Calculate cosine similarity between two embeddings."""
    import math

    dot_product = sum(a * b for a, b in zip(embedding1, embedding2))
    norm1 = math.sqrt(sum(a * a for a in embedding1))
    norm2 = math.sqrt(sum(b * b for b in embedding2))

    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)
