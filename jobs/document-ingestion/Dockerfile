FROM python:3.12-slim

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# uv optimizations for containers
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Pin uv version for reproducibility
COPY --from=ghcr.io/astral-sh/uv:0.5.14 /uv /uvx /bin/

WORKDIR /app

# Copy dependency files for all workspace members
COPY pyproject.toml uv.lock ./
COPY packages/techpubs-core/pyproject.toml packages/techpubs-core/README.md packages/techpubs-core/
COPY jobs/document-ingestion/pyproject.toml jobs/document-ingestion/

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project --no-install-workspace

# Copy source code
COPY packages/techpubs-core/src packages/techpubs-core/src
COPY jobs/document-ingestion/main.py jobs/document-ingestion/

# Install workspace packages
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --package document-ingestion

# Create non-root user
RUN adduser -u 5678 --disabled-password --gecos "" appuser \
    && chown -R appuser /app
USER appuser

WORKDIR /app/jobs/document-ingestion

# Run directly from venv
CMD ["/app/.venv/bin/python", "main.py"]
