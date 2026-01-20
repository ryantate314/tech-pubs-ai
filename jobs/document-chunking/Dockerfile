ARG ACR_NAME
FROM ${ACR_NAME}.azurecr.io/jobs-base:latest

WORKDIR /app

# Copy job-specific pyproject.toml
COPY jobs/document-chunking/pyproject.toml jobs/document-chunking/

# Install job dependencies (docling)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --package document-chunking

# Copy job source
COPY jobs/document-chunking/main.py jobs/document-chunking/

USER appuser
WORKDIR /app/jobs/document-chunking
CMD ["/app/.venv/bin/python", "main.py"]
