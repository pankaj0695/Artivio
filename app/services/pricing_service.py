"""Stub service for dynamic pricing suggestions."""
from __future__ import annotations

from statistics import median
from typing import Any, Dict, List


class PricingService:
    """Return placeholder pricing recommendation.

    Future approach:
      * Compute base margin target from cost_price & category benchmarks.
      * Apply festival / seasonal multipliers.
      * Derive competitor median & adjust with trend premiums.
      * Potential external data: BigQuery sales, Google Trends, marketplace APIs.
    """

    def suggest_prices(self, params: Dict[str, Any]) -> Dict[str, Any]:
        cost = float(params.get("cost_price", 0.0))
        competitors: List[Dict[str, Any]] = params.get("competitor_samples") or []
        comp_prices = [float(c.get("price", 0)) for c in competitors if c.get("price") is not None]
        comp_median = median(comp_prices) if comp_prices else cost * 2.0 if cost else 100.0
        recommended = round((comp_median + cost * 1.5) / 2, 2) if cost else round(comp_median, 2)
        price_range = {
            "min": round(recommended * 0.9, 2),
            "max": round(recommended * 1.2, 2),
        }
        return {
            "recommended_price": recommended,
            "range": price_range,
            "rationale": "Placeholder blend of cost & competitor median",
            "platform_notes": {},
        }
