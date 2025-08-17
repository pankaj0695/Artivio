"""Environment-driven configuration for artisan-assistant.

Only minimal keys required by current stub implementation.
"""
from __future__ import annotations

import os


class Config:
    """Basic config loaded via environment variables.

    Intended to stay minimal. Extend carefully only when feature set grows.
    """

    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret")

    GOOGLE_PROJECT_ID: str | None = os.getenv("GOOGLE_PROJECT_ID")
    GOOGLE_LOCATION: str | None = os.getenv("GOOGLE_LOCATION")

    VERTEX_TEXT_MODEL: str = os.getenv("VERTEX_TEXT_MODEL", "placeholder-text-model")
    VERTEX_IMAGE_MODEL: str = os.getenv("VERTEX_IMAGE_MODEL", "placeholder-image-model")
    VERTEX_VIDEO_MODEL: str = os.getenv("VERTEX_VIDEO_MODEL", "placeholder-video-model")

    GCS_BUCKET_NAME: str = os.getenv("GCS_BUCKET_NAME", "placeholder-bucket")

    MAX_CONTENT_LENGTH: int = int(os.getenv("MAX_CONTENT_LENGTH", str(25 * 1024 * 1024)))
