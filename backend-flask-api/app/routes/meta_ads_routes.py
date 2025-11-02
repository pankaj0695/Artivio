import requests
import json
import os
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, request  # <-- Flask imports
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()  # This loads the .env file

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
print(ACCESS_TOKEN)
AD_ACCOUNT_ID = os.getenv("AD_ACCOUNT_ID")
PAGE_ID = os.getenv("PAGE_ID")
GRAPH_API_VERSION = os.getenv("GRAPH_API_VERSION")

# Simple check to make sure .env is loaded
if not all([ACCESS_TOKEN, AD_ACCOUNT_ID, PAGE_ID, GRAPH_API_VERSION]):
    print("❌ Error: Missing configuration. Make sure your .env file is set up correctly.")
    # In a real app, you'd want to handle this more gracefully
    # exit() 

# --- Define your Blueprint ---
# This line assumes you will import 'ads_bp' into your main app file
ads_bp1 = Blueprint("ads1", __name__)


# --- Internal Logic Function ---
# This function contains the actual API calls (the "curl")
# It's designed to be called by either the API route or a direct script.
def _create_meta_ad_logic(adset_id, image_url, product_title, product_description, redirect_url):
    """
    Internal logic to create a Meta ad.
    Returns the final ad_data dictionary on success.
    Raises an Exception on failure.
    """
    try:
        print(ACCESS_TOKEN)
        # 1️⃣ Upload Image to Meta
        print(f"Uploading image from: {image_url}")
        image_url_endpoint = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{AD_ACCOUNT_ID}/adimages"
        image_params = {"url": image_url, "access_token": ACCESS_TOKEN}
        
        # This is the Python equivalent of a curl POST request
        image_res = requests.post(image_url_endpoint, params=image_params)
        image_data = image_res.json()
        
        if "hash" not in image_data:
            raise Exception(f"Error uploading image: {image_data.get('error', image_data)}")

        image_hash = image_data["hash"]
        print(f"Image Upload Response (Hash): {image_hash}")

        # 2️⃣ Create New Ad Creative
        print("Creating new Ad Creative...")
        creative_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{AD_ACCOUNT_ID}/adcreatives"
        object_story_spec = {
            "page_id": PAGE_ID,
            "link_data": {
                "image_hash": image_hash,
                "link": redirect_url,
                "message": product_description,
                "name": product_title 
            }
        }
        creative_params = {
            "name": f"Ad Creative for {product_title}",
            "object_story_spec": json.dumps(object_story_spec),
            "access_token": ACCESS_TOKEN
        }
        
        # This is another Python "curl"
        creative_res = requests.post(creative_url, params=creative_params)
        creative_data = creative_res.json()
        
        if "id" not in creative_data:
            raise Exception(f"Error creating creative: {creative_data.get('error', creative_data)}")

        creative_id = creative_data["id"]
        print(f"New Creative Response: {creative_data}")

        # 3️⃣ Create New Ad
        print("Creating new Ad...")
        ad_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{AD_ACCOUNT_ID}/ads"
        ad_params = {
            "name": f"Ad for {product_title}",
            "adset_id": adset_id,
            "creative": json.dumps({"creative_id": creative_id}),
            "status": "PAUSED",
            "access_token": ACCESS_TOKEN
        }
        
        # This is the final Python "curl"
        ad_res = requests.post(ad_url, params=ad_params)
        ad_data = ad_res.json()
        
        if "id" not in ad_data:
            raise Exception(f"Error creating ad: {ad_data.get('error', ad_data)}")
        
        print(f"✅ New Ad Response: {ad_data}")
        return ad_data

    except requests.RequestException as e:
        # Handle network-level errors
        raise Exception(f"An HTTP error occurred: {e}")
    except Exception as e:
        # Re-raise the exceptions we created
        raise e


# --- The New Flask API Route ---
@ads_bp1.post("/ads/test/create-meta-ad")
def create_meta_ad_route():
    """
    API endpoint to create a new Meta ad.
    """
    print ("Received request to create Meta ad.")
    data = request.get_json()
    if not data:
        return jsonify({"error": "BadRequest", "message": "No JSON body provided"}), 400

    try:
        adset_id = data["adset_id"]
        image_url = data["image_url"]
        product_title = data["product_title"]
        product_description = data["product_description"]
        redirect_url = data["redirect_url"]
    except KeyError as e:
        return jsonify({"error": "BadRequest", "message": f"Missing required field: {e}"}), 400

    try:
        # Call the internal logic function
        ad_data = _create_meta_ad_logic(
            adset_id=adset_id,
            image_url=image_url,
            product_title=product_title,
            product_description=product_description,
            redirect_url=redirect_url
        )
        
        return jsonify({
            "status": "success",
            "message": "Meta ad created successfully!",
            "ad": ad_data
        }), 201 # 201 Created

    except Exception as e:
        return jsonify({
            "error": "MetaApiError", 
            "message": str(e)
        }), 500


# --- Script Execution ---
# This block only runs when you execute: python your_script_name.py
if __name__ == "__main__":
    
    # 1. *** YOUR ADSET ID IS SET HERE ***
    EXISTING_ADSET_ID = "120232519671240461" 

    # 2. Define your new ad content
    NEW_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/3/3a/A_red_rose.jpg" 
    NEW_PRODUCT_TITLE = "Stunning Red Rose"
    NEW_PRODUCT_DESCRIPTION = "Discover the beauty of our fresh-cut red roses. Perfect for any occasion. Shop now!"
    NEW_REDIRECT_URL = "https://example.com/roses"

    print(f"--- [SCRIPT MODE] Creating new ad in existing AdSet: {EXISTING_ADSET_ID} ---")
    
    # Check for config again, just for script mode
    if not all([ACCESS_TOKEN, AD_ACCOUNT_ID, PAGE_ID, GRAPH_API_VERSION]):
        print("❌ Cannot run script. Please check your .env file.")
    else:
        try:
            # Call the logic function directly
            ad_data = _create_meta_ad_logic(
                adset_id=EXISTING_ADSET_ID,
                image_url=NEW_IMAGE_URL,
                product_title=NEW_PRODUCT_TITLE,
                product_description=NEW_PRODUCT_DESCRIPTION,
                redirect_url=NEW_REDIRECT_URL
            )
            print(f"--- [SCRIPT MODE] Successfully created Ad ID: {ad_data.get('id')} ---")
        except Exception as e:
            print(f"--- [SCRIPT MODE] FAILED ---")
            print(f"❌ Error: {e}")