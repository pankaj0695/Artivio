"""Video generation endpoints."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..services.vertex_video import VertexVideoService

videos_bp = Blueprint("videos", __name__)
video_service = VertexVideoService()


@videos_bp.post("/generate")
def generate_video():
    """Queue a product video generation job (placeholder for async processing)."""
    data = request.get_json(silent=True) or {}
    image_urls = data.get("image_urls") or []
    job = video_service.generate_sequence(
        image_urls=image_urls,
        duration_seconds=data.get("duration_seconds"),
        add_captions=bool(data.get("add_captions", True)),
        add_music=bool(data.get("add_music", True)),
        preset=data.get("preset"),
    )
    return jsonify({
        "job_id": job["job_id"],
        "status": "queued",
        "accepted_images": len(image_urls),
        "todo": "Call Vertex Video (e.g., Veo) and track job status later",
    }), 202
