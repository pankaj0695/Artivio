"""Content suggestion endpoints (title, tagline, description, tags, SEO)."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..services.vertex_text import VertexTextService

content_bp = Blueprint("content", __name__)
text_service = VertexTextService()


@content_bp.post("/title")
def suggest_title():
    """Suggest product titles."""
    data = request.get_json(silent=True) or {}
    product_name = data.get("productTitle", "")
    category = data.get("category", "")
    
    keywords = text_service.generate_keywords(product_name, category)
    title = text_service.generate_title(product_name, keywords)
    
    return jsonify({
        "title": title,
        "keywords": keywords
    })


@content_bp.post("/tagline")
def suggest_tagline():
    """Suggest product taglines."""
    data = request.get_json(silent=True) or {}
    product_name = data.get("productTitle", "")
    
    tagline = text_service.generate_tagline(product_name)
    
    return jsonify({
        "tagline": tagline
    })


@content_bp.post("/description")
def suggest_description():
    """Suggest product descriptions."""
    data = request.get_json(silent=True) or {}
    product_name = data.get("productTitle", "")
    category = data.get("category", "")
    
    keywords = text_service.generate_keywords(product_name, category)
    description = text_service.generate_description(product_name, keywords)
    
    return jsonify({
        "description": description,
        "keywords": keywords
    })


@content_bp.post("/tags")
def suggest_tags():
    """Suggest product tags."""
    data = request.get_json(silent=True) or {}
    product_name = data.get("productTitle", "")
    category = data.get("category", "")
    
    keywords = text_service.generate_keywords(product_name, category)
    
    return jsonify({
        "tags": keywords.split(", ") if keywords else []
    })
