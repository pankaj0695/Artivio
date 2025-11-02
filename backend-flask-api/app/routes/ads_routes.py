"""Google Ads routes (Test-only) for Artivio.

Only exposes a sandbox endpoint to create a paused SEARCH campaign for the
test customer. This keeps the surface minimal and safe.

Mounted under /api/ads (see app/__init__.py).
"""
from __future__ import annotations

import os
from flask import Blueprint, jsonify, request
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from ..services.vertex_text import VertexTextService
from datetime import datetime, timezone


ads_bp = Blueprint("ads", __name__)
text_service = VertexTextService()
API_VERSION = os.getenv("GOOGLE_ADS_API_VERSION", "v22")


def _load_google_ads_client() -> GoogleAdsClient:
    return GoogleAdsClient.load_from_dict({
        "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN"),
        "client_id": os.getenv("GOOGLE_ADS_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_ADS_CLIENT_SECRET"),
        "refresh_token": os.getenv("GOOGLE_ADS_REFRESH_TOKEN"),
        "login_customer_id": os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID").replace("-", ""),  # MCC
        "use_proto_plus": True,
    })


@ads_bp.post("/ads/test/create-campaign")
def test_create_campaign():
    """Create a simple paused SEARCH campaign for the test account.

    Body (JSON) optional overrides:
      - customer_id: string (defaults to env GOOGLE_ADS_TEST_CUSTOMER_ID)
      - name: string (default "Artivio Sample Campaign")
      - budget_micros: int (default 1_000_000)
    """
    print("test create campaign")
    body = request.get_json(silent=True) or {}
    customer_id = (body.get("customer_id") or os.getenv("GOOGLE_ADS_TEST_CUSTOMER_ID") or "").replace("-", "")
    if not customer_id:
        return jsonify({"error": "BadRequest", "message": "GOOGLE_ADS_TEST_CUSTOMER_ID is not set and customer_id not provided"}), 400

    name = (body.get("name") or "Artivio Sample Campaign").strip()
    try:
        budget_micros = int(body.get("budget_micros") or 1_000_000)
    except (TypeError, ValueError):
        return jsonify({"error": "BadRequest", "message": "budget_micros must be an integer"}), 400

    try:
        client = _load_google_ads_client()

        # 1. Create Campaign Budget
        budget_service = client.get_service("CampaignBudgetService", version=API_VERSION)
        budget_op = client.get_type("CampaignBudgetOperation", version=API_VERSION)
        budget = budget_op.create
        budget.name = f"{name} Budget"
        budget.amount_micros = budget_micros
        budget_response = budget_service.mutate_campaign_budgets(
            customer_id=customer_id, operations=[budget_op]
        )
        budget_rn = budget_response.results[0].resource_name

        # 2. Create Campaign (paused SEARCH)
        campaign_service = client.get_service("CampaignService", version=API_VERSION)
        operation = client.get_type("CampaignOperation", version=API_VERSION)
        campaign = operation.create
        
        campaign.name = name
        campaign.status = client.enums.CampaignStatusEnum.PAUSED
        campaign.campaign_budget = budget_rn
        campaign.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
        
        # NOTE: advertising_channel_sub_type is REMOVED as it caused an error
        
        # Set a safe start date (today, UTC, timezone-aware)
        campaign.start_date = datetime.now(timezone.utc).strftime("%Y%m%d")

        # *** START: Fix for contains_eu_political_advertising ***
        # We replace the 'BoolValue' code with this two-part fix.

        # Part 1: Set the value directly on the Python object
        
        # *** END: Part 1 of fix ***
        
        # Set a simple bidding strategy (required): Manual CPC
        campaign.manual_cpc.enhanced_cpc_enabled = False

        # Settings for "Google Search Only"
        campaign.network_settings.target_google_search = True
        campaign.network_settings.target_search_network = False
        campaign.network_settings.target_partner_search_network = False
        campaign.network_settings.target_content_network = False

        # *** START: Fix for contains_eu_political_advertising ***
        # Part 2: Add the _pb hack to force serialization
        # This ensures the 'False' value is sent to the API.
        try:
            # Note: 'operation.create' is the campaign object
            operation._pb.create.contains_eu_political_advertising = False
        except Exception as e:
            # If this fails, we have a bigger problem.
            print(f"CRITICAL: Failed to apply _pb hack: {e}")
            pass
        # *** END: Part 2 of fix ***

        response = campaign_service.mutate_campaigns(
            customer_id=customer_id, operations=[operation]
        )

        return jsonify(
            {
                "status": "success",
                "message": "Test campaign created successfully!",
                "resource_name": response.results[0].resource_name,
                "budget_resource_name": budget_rn,
                "customer_id": customer_id,
            }
        ), 200

    except GoogleAdsException as ex:  # <-- This requires the import!
        errors = []
        for err in ex.failure.errors:
            errors.append({
                "message": err.message,
                "field_path": ".".join([fpe.field_name for fpe in err.location.field_path_elements]) if err.location else None,
                "trigger": (str(err.trigger) if getattr(err, "trigger", None) is not None else None),
            })
        return jsonify({
            "error": "GoogleAdsException",
            "request_id": ex.request_id,
            "details": errors,
        }), 400
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": "TestCreateCampaignError", "message": str(e)[:300]}), 500
@ads_bp.post("/ads/test/create-video-ad")
def test_create_video_ad():
    """Build a test video ad preview using product images + AI captions.

    This does NOT create anything in Google Ads; it only returns a storyboard
    you can preview on the frontend.

    Body (JSON):
      - productTitle: string (required)
      - images: string[] (optional; image URLs to include as frames)
      - category: string (optional)
      - final_url: string (optional; landing page to include in response)

    Returns: { status, headline, description, frames: [ { image_url, caption } ], final_url }
    """
    data = request.get_json(silent=True) or {}
    title = (data.get("productTitle") or data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "BadRequest", "message": "productTitle is required"}), 400
    images = data.get("images") or []
    if not isinstance(images, list):
        return jsonify({"error": "BadRequest", "message": "images must be an array of URLs"}), 400
    category = (data.get("category") or "").strip()
    final_url = (data.get("final_url") or data.get("landingUrl") or "").strip()

    try:
        # Generate core copy
        keywords = text_service.generate_keywords(title, category)
        headline = text_service.generate_tagline(title, keywords)
        description = text_service.generate_description(title, keywords)

        # Generate short captions per frame
        frames = []
        if images:
            for idx, url in enumerate(images, start=1):
                prompt = (
                    f"Write a vivid 6-10 word caption for a product video frame for '{title}'. "
                    f"Avoid hype and terminal punctuation; one short line only."
                )
                res = text_service._call_model(prompt, max_output_tokens=24, temperature=0.7)
                caption = (res.get("text") or "Handcrafted detail, made to last").strip().strip('"').rstrip(".,;: ")
                frames.append({"image_url": url, "caption": caption})

        return jsonify({
            "status": "success",
            "headline": headline,
            "description": description,
            "frames": frames,
            "final_url": final_url,
            "note": "Test preview only. Not created in Google Ads.",
        }), 200
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": "TestCreateVideoAdError", "message": str(e)[:300]}), 500


@ads_bp.post("/ads/test/delete-campaign")
def test_delete_campaign():
    """Simulate deleting a campaign (no-op).

    Body (JSON):
      - campaign_id: string (required)
      - customer_id: string (optional; included in response if provided/env)
    """
    data = request.get_json(silent=True) or {}
    campaign_id = (data.get("campaign_id") or "").strip()
    if not campaign_id:
        return jsonify({"error": "BadRequest", "message": "campaign_id is required"}), 400
    customer_id = (data.get("customer_id") or os.getenv("GOOGLE_ADS_TEST_CUSTOMER_ID") or "").replace("-", "")

    return jsonify({
        "status": "success",
        "message": "Simulated campaign deletion (no changes made)",
        "campaign_id": campaign_id,
        "customer_id": customer_id or None,
    }), 200
