"""Dynamic pricing suggestion endpoint."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..services.pricing_service import PricingService

pricing_bp = Blueprint("pricing", __name__)
pricing_service = PricingService()


@pricing_bp.post("/suggest")
def suggest_prices():
    """Suggest a recommended price range (placeholder)."""
    data = request.get_json(silent=True) or {}
    suggestion = pricing_service.suggest_prices(data)
    return jsonify({**suggestion, "todo": "Incorporate seasonality & trend multipliers"})
