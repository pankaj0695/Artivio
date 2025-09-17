"""Video generation endpoints."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..services.vertex_video import VertexVideoService

videos_bp = Blueprint("videos", __name__)
# Lazy service instance — created on first request to avoid import-time Vertex init
_video_service: VertexVideoService | None = None


def get_video_service() -> VertexVideoService:
    global _video_service
    if _video_service is None:
        _video_service = VertexVideoService()
    return _video_service


@videos_bp.post("/generate")
def generate_video():
    """Queue a product video generation job using Veo 3."""
    data = request.get_json(silent=True) or {}
    # Accept either a single `image_url` or an array `image_urls`
    image_url = data.get("image_url")
    if not image_url:
        image_urls = data.get("image_urls") or []
        if isinstance(image_urls, list) and image_urls:
            image_url = image_urls[0]
    if not image_url:
        return jsonify({
            "error": "BadRequest",
            "message": "image_url is required (provide 'image_url' or first item in 'image_urls')",
        }), 400

    try:
        svc = get_video_service()
        svc.ensure_initialized()
    except Exception as e:
        # Initialization failed (missing ADC / project). Surface a helpful error.
        return (
            jsonify({
                "error": "VertexInitializationError",
                "message": str(e),
            }),
            503,
        )

    job = svc.generate_sequence(
        image_url=image_url,
        duration_seconds=data.get("duration_seconds", 8),
        add_captions=bool(data.get("add_captions", True)),
        add_music=bool(data.get("add_music", True)),
        preset=data.get("preset", "reel"),
    )

    return jsonify(job), 202
