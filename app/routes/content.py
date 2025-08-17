"""Content generation endpoints for SEO / storytelling / captions."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..services.vertex_text import VertexTextService

content_bp = Blueprint("content", __name__)
text_service = VertexTextService()


@content_bp.post("/generate")
def generate_content():
    """Generate a multilingual content bundle (placeholder)."""
    data = request.get_json(silent=True) or {}
    bundle = text_service.generate_content_bundle(data)
    return jsonify({**bundle, "todo": "Wire Vertex Text model for real outputs"})
