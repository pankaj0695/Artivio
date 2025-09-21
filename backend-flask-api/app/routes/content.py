"""Content suggestion endpoints (title, tagline, description, tags, SEO)."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..services.vertex_text import VertexTextService

content_bp = Blueprint("content", __name__)
text_service = VertexTextService()


@content_bp.post("/title")
def suggest_title():
    """Return only generated title."""
    data = request.get_json(silent=True) or {}
    product_name = data.get("productTitle", "").strip()
    category = data.get("category", "").strip()
    if not product_name:
        return jsonify({"error": "BadRequest", "message": "productTitle is required"}), 400
    try:
        keywords = text_service.generate_keywords(product_name, category)
        title = text_service.generate_title(product_name, keywords)
        return jsonify({"title": title})
    except Exception as e:
        return jsonify({"error": "TitleGenerationError", "message": str(e)[:200]}), 500


@content_bp.post("/tagline")
def suggest_tagline():
    """Return only generated tagline (fallback if blocked)."""
    data = request.get_json(silent=True) or {}
    product_name = data.get("productTitle", "").strip()
    keywords = ", ".join(data.get("keywords", [])).strip()
    if not product_name:
        return jsonify({"error": "BadRequest", "message": "productTitle is required"}), 400
    try:
        tagline = text_service.generate_tagline(product_name, keywords)
        if not tagline:
            raise ValueError("Empty tagline returned")
        return jsonify({"tagline": tagline})
    except ValueError:
        fallback = f"{product_name} artisan crafted"
        return jsonify({"tagline": fallback}), 200
    except Exception as e:
        return jsonify({"error": "TaglineGenerationError", "message": str(e)[:200]}), 500


@content_bp.post("/description")
def suggest_description():
    """Return only generated description."""
    data = request.get_json(silent=True) or {}
    product_name = data.get("productTitle", "").strip()
    category = data.get("category", "").strip()
    if not product_name:
        return jsonify({"error": "BadRequest", "message": "productTitle is required"}), 400
    try:
        keywords = text_service.generate_keywords(product_name, category)
        description = text_service.generate_description(product_name, keywords)
        return jsonify({"description": description})
    except Exception as e:
        return jsonify({"error": "DescriptionGenerationError", "message": str(e)[:200]}), 500


@content_bp.post("/tags")
def suggest_tags():
    """Return only generated tags array."""
    data = request.get_json(silent=True) or {}
    product_name = data.get("productTitle", "").strip()
    category = data.get("category", "").strip()
    if not product_name:
        return jsonify({"error": "BadRequest", "message": "productTitle is required"}), 400
    try:
        keywords = text_service.generate_keywords(product_name, category)
        tags = [t.strip().lower() for t in (keywords.split(",") if keywords else []) if t.strip()]
        dedup = []
        for t in tags:
            if t not in dedup:
                dedup.append(t)
        return jsonify({"tags": dedup[:15]})
    except Exception as e:
        return jsonify({"error": "TagsGenerationError", "message": str(e)[:200]}), 500
