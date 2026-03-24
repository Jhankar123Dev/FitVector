# ---------------------------------------------------------------------------
# Stage 1 – build / install dependencies
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /app

# System deps needed for psycopg2-binary, PyMuPDF, and building wheels
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .

# Install Python dependencies into a virtual-env so we can copy it cleanly
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir .

# ---------------------------------------------------------------------------
# Stage 2 – production image
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install Tectonic TeX engine and minimal runtime libs
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        tectonic \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built virtual-env from the builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Pre-download the HuggingFace embedding model (~80MB) to avoid cold-start delay
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application source
COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
