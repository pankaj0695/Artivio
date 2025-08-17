"""Image-related endpoints (enhance, background replace, optimize)."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..services.vertex_image import VertexImageService

images_bp = Blueprint("images", __name__)
image_service = VertexImageService()


@images_bp.post("/enhance")
def enhance_image():
    """Enhance image resolution / lighting (placeholder Vertex integration)."""
    data = request.get_json(silent=True) or {}
    source = data.get("image_url") or data.get("base64_image")
    result = image_service.enhance(
        source=source,
        target_resolution=data.get("target_resolution"),
        auto_lightning=bool(data.get("auto_lightning", True)),
    )
    return jsonify({
        "request": {"target_resolution": data.get("target_resolution"), "auto_lightning": bool(data.get("auto_lightning", True))},
        "output": result,
        "todo": "Integrate actual Vertex Image super-resolution later",
    })


@images_bp.post("/background")
def replace_background():
    """Replace/remove background (placeholder)."""
    data = request.get_json(silent=True) or {}
    source = data.get("image_url") or data.get("base64_image")
    result = image_service.replace_background(
        source=source,
        background=data.get("background", "white"),
        lifestyle_context=data.get("lifestyle_context"),
    )
    return jsonify({
        "request": {"background": data.get("background", "white")},
        "output": result,
        "todo": "Add smart background selection + Vertex segmentation",
    })


@images_bp.post("/optimize")
def optimize_image():
    """Low-end device optimization (compress / denoise / sharpen)."""
    data = request.get_json(silent=True) or {}
    source = data.get("image_url") or data.get("base64_image")
    result = image_service.optimize(
        source=source,
        compress=bool(data.get("compress", True)),
        denoise=bool(data.get("denoise", True)),
        sharpen=bool(data.get("sharpen", True)),
    )
    return jsonify({
        "request": {"compress": bool(data.get("compress", True)), "denoise": bool(data.get("denoise", True)), "sharpen": bool(data.get("sharpen", True))},
        "output": result,
        "todo": "Implement adaptive quality & size presets",
    })
