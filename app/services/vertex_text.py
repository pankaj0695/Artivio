"""Stub service for text/content generation via Vertex (future)."""
from __future__ import annotations

from typing import Any, Dict


class VertexTextService:
    """Return placeholder multilingual content bundle.

    Future logic: structured prompting for SEO, style, safety filters, multi-pass
    refinement, translation consistency checks.
    """

    def generate_content_bundle(self, params: Dict[str, Any]) -> Dict[str, Any]:
        product = params.get("product_name", "Product")
        languages = params.get("languages") or ["en"]
        platforms = params.get("platforms") or ["instagram"]

        descriptions = {lang: f"Placeholder {product} description in {lang}" for lang in languages}
        captions = {p: f"Amazing {product}!" for p in platforms}
        hashtags = {p: ["#placeholder", f"#{product.lower().replace(' ', '')}"] for p in platforms}

        return {
            "title": f"Stunning {product}",
            "descriptions": descriptions,
            "story": f"A short crafted story about {product} (placeholder).",
            "captions": captions,
            "hashtags": hashtags,
        }
