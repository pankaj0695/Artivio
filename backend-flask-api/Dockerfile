# Python slim base
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=0 \
    APP_HOME=/app \
    PORT=8080

# Install system dependencies (if any future libs need build tools, add here)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR ${APP_HOME}

# Copy requirements first for caching
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy application code
COPY . .
COPY app ./app
COPY wsgi.py ./wsgi.py

# Create non-root user
RUN useradd -u 1001 -m appuser && chown -R appuser:appuser ${APP_HOME}
USER appuser

EXPOSE 8080

# Default env
ENV FLASK_ENV=production

# Healthcheck: simple curl to /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
 CMD curl -fsS http://127.0.0.1:${PORT}/health || exit 1

# Gunicorn already in requirements. (If removed from requirements, uncomment the line below)
# RUN pip install gunicorn

# Command (use wsgi:app entrypoint)
CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:8080", "--workers", "2", "--threads", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
