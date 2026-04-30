# ─────────────────────────────────────────────────────────────
# FinGuard 3.0 — Simple Production Docker build
# ─────────────────────────────────────────────────────────────

FROM python:3.12-slim
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc libffi-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Non-root user
RUN useradd -m -u 1000 finguard && chown -R finguard:finguard /app
USER finguard

EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "panic_api:app", "--host", "0.0.0.0", "--port", "8000"]
