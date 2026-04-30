# ─────────────────────────────────────────────────────────────
# FinGuard 3.0 — Multi-stage Docker build
#
# Build:  docker build -t finguard:latest .
# Run UI: docker run -p 8501:8501 --env-file .env finguard:latest streamlit
# Run API:docker run -p 8000:8000 --env-file .env finguard:latest api
# ─────────────────────────────────────────────────────────────

# ── Stage 1: builder ──────────────────────────────────────────
FROM python:3.12-slim AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends gcc libffi-dev \
    && rm -rf /var/lib/apt/lists/*
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# ── Stage 2: runtime ──────────────────────────────────────────
FROM python:3.12-slim AS app
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY finguard/      ./finguard/
COPY app.py         ./app.py
COPY panic_mode.py  ./panic_mode.py
COPY cli.py         ./cli.py

# Non-root user
RUN useradd -m -u 1000 finguard && chown -R finguard:finguard /app
USER finguard

EXPOSE 8501 8000

# Entrypoint: pass "streamlit", "api", or "cli <args>" as CMD
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["streamlit"]
