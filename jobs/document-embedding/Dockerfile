ARG ACR_NAME
FROM ${ACR_NAME}.azurecr.io/jobs-base:latest

WORKDIR /app

# Copy job-specific pyproject.toml
COPY jobs/document-embedding/pyproject.toml jobs/document-embedding/

# Install job dependencies (sentence-transformers via techpubs-core[embeddings])
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --package document-embedding

# Copy job source
COPY jobs/document-embedding/main.py jobs/document-embedding/

USER appuser
WORKDIR /app/jobs/document-embedding
CMD ["/app/.venv/bin/python", "main.py"]
