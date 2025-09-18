import os
import cv2
import numpy as np
import requests
from flask import Blueprint, request, jsonify

# Cloudinary config
CLOUD_NAME = os.getenv("CLOUD_NAME")
UPLOAD_PRESET = "Artivio"
ENDPOINT = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

# Blueprint
images_bp = Blueprint("images", __name__)

def upscale_and_enhance(input_path, output_path, scale=2, steps=4, sharpen=True, sharpen_strength=1.0, denoise=True):
    """
    Upscale an image using bicubic interpolation with optional enhancement.
    """
    img = cv2.imread(input_path)
    if img is None:
        raise FileNotFoundError(f"❌ Image not found at {input_path}")

    # Progressive upscaling
    for i in range(steps):
        h, w = img.shape[:2]
        img = cv2.resize(img, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)

    # Denoise
    if denoise:
        img = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)

    # Sharpen
    if sharpen:
        kernel = np.array([[0, -1, 0],
                           [-1, 4 + sharpen_strength, -1],
                           [0, -1, 0]])
        img = cv2.filter2D(img, -1, kernel)

    cv2.imwrite(output_path, img)
    return output_path

@images_bp.route("/enhance-image", methods=["POST"])
def enhance_image():
    """
    API route: enhance and upscale an image, then upload to Cloudinary.
    Expected JSON body:
    {
        "input_path": "/path/to/image.jpg"
    }
    """
    try:
        data = request.get_json()
        input_path = data.get("input_path")
        if not input_path or not os.path.exists(input_path):
            return jsonify({"error": "Invalid or missing input_path"}), 400

        output_path = "enhanced_output.jpg"
        upscale_and_enhance(input_path, output_path, scale=2, steps=3, sharpen=True, sharpen_strength=1.2, denoise=True)

        # Upload to Cloudinary
        with open(output_path, "rb") as f:
            files = {"file": f}
            payload = {"upload_preset": UPLOAD_PRESET}
            upload_res = requests.post(ENDPOINT, files=files, data=payload)

        if upload_res.status_code != 200:
            return jsonify({"error": "Cloudinary upload failed", "details": upload_res.text}), 500

        return jsonify(upload_res.json()), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
