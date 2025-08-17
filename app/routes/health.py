"""Health endpoint blueprint."""
from __future__ import annotations

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    """Return basic liveness info."""
    return jsonify({"status": "ok", "service": "artisan-assistant"})
