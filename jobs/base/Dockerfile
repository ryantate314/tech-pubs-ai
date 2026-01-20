FROM python:3.12-slim

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# uv optimizations for containers
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Pin uv version for reproducibility
COPY --from=ghcr.io/astral-sh/uv:0.5.14 /uv /uvx /bin/

WORKDIR /app

# Install PyTorch with CUDA support (auto-detects GPU at runtime)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system \
    torch==2.5.0 torchvision==0.20.0 \
    --index-url https://download.pytorch.org/whl/cu124

# Copy workspace files for techpubs-core
COPY pyproject.toml uv.lock ./
COPY packages/techpubs-core/ packages/techpubs-core/

# Install techpubs-core (base, no embeddings extra)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --package techpubs-core

# Create non-root user
RUN adduser -u 5678 --disabled-password --gecos "" appuser
