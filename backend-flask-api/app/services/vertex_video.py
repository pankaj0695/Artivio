"""Veo 3 preview video generation (synchronous) with Cloudinary upload."""
from __future__ import annotations

import base64
import os
import tempfile
import time
import uuid
from typing import Any, Dict, List

try:
    from google import genai  # type: ignore
    from google.genai import types  # type: ignore
except Exception as _imp_err:  # capture any import issue
    genai = None  # type: ignore
    types = None  # type: ignore
    _GENAI_IMPORT_ERROR = _imp_err

from ..config import Config

config = Config()


class VertexVideoService:
    MODEL_NAME = config.VERTEX_VIDEO_MODEL

    def __init__(self) -> None:
        self.project = config.GOOGLE_PROJECT_ID
        self.location = config.GOOGLE_LOCATION or "us-central1"
        self._client = None  # lazy google-genai client
        self._init_error = None  # store initialization exception if any

    # --- Credential setup ---------------------------------------------------------
    def _setup_credentials(self) -> None:
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            return
        creds_b64 = getattr(config, "GOOGLE_CREDENTIALS_JSON_BASE64", None)
        if not creds_b64:
            raise RuntimeError("Missing GOOGLE_CREDENTIALS_JSON_BASE64 for credentials setup.")
        try:
            key_bytes = base64.b64decode(creds_b64)
            key_path = os.path.join(tempfile.gettempdir(), f"sa_{int(time.time())}.json")
            with open(key_path, "wb") as fh:
                fh.write(key_bytes)
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path
        except Exception as exc:
            raise RuntimeError("Failed decoding service account key from GOOGLE_CREDENTIALS_JSON_BASE64") from exc

    def _client_or_init(self):  # -> genai.Client
        if self._client:
            return self._client
        if genai is None:
            raise RuntimeError(
                "google-genai library not available. Install with 'pip install google-genai' and ensure no namespace package collision (e.g., leftover 'google' dir). "
                f"Underlying import error: {_GENAI_IMPORT_ERROR}"
            )
        try:
            self._setup_credentials()
            self._client = genai.Client(vertexai=True, project=self.project, location=self.location)
        except Exception as exc:
            self._init_error = exc
            raise
        return self._client

    # Backwards compatibility for routes using ensure_initialized
    def ensure_initialized(self) -> bool:
        try:
            self._client_or_init()
            return True
        except Exception:
            return False

    # --- Main generation (synchronous polling) ------------------------------------
    def generate_sequence(
        self,
        image_url: str,
        duration_seconds: int,
        add_captions: bool,
        add_music: bool,
        preset: str,
    ) -> Dict[str, Any]:
        client = self._client_or_init()

        images_clause = "\n".join(f"Reference image: {image_url}") if image_url else ""
        base_prompt = (
            "Create a cinematic product advertisement focusing on the referenced images with dynamic shots with different angle(front, side and back) of the product, coherent narrative "
            "and engaging pacing."
        )
        if add_captions:
            base_prompt += " Include concise, compelling captions describing product benefits."
        if add_music:
            base_prompt += " Include suitable background audio."
        prompt = f"{base_prompt}\nDesired duration: {duration_seconds}s. Preset: {preset}.\n{images_clause}".strip()

        # Actual binary reference image (first provided) so the model can condition on it.
        image_arg = self._prepare_starting_image(image_url)
        image_provided = image_arg is not None

        try:
            operation = client.models.generate_videos(
                model=self.MODEL_NAME,
                prompt=prompt,
                image=image_arg,
                config=types.GenerateVideosConfig(
                    aspect_ratio="16:9",
                    number_of_videos=1,
                    duration_seconds=min(max(duration_seconds, 1), 12),
                    resolution="1080p",
                    person_generation="allow_all",
                    enhance_prompt=True,
                    generate_audio=bool(add_music),
                ),
            )
        except Exception as exc:
            raise RuntimeError(f"Veo generation request failed: {exc}") from exc

        op_name = getattr(operation, "name", None) or getattr(operation, "operation", None) or "unknown"
        job_id = op_name.split("/")[-1]

        # Poll until completion (bounded)
        max_wait_seconds = max(60, min(300, duration_seconds * 40))
        interval = 10
        waited = 0
        while not getattr(operation, "done", False) and waited < max_wait_seconds:
            time.sleep(interval)
            waited += interval
            try:
                operation = client.operations.get(operation)
            except Exception:
                pass

        if not getattr(operation, "done", False):
            return {
                "job_id": job_id,
                "operation": op_name,
                "status": "timeout",
                "waited_seconds": waited,
                "note": "Generation still running; try again later.",
                "reference_image_used": image_provided,
            }

        # Extract video bytes
        video_bytes = None
        try:
            result = getattr(operation, "result", None)
            videos = getattr(result, "generated_videos", []) if result else []
            if videos:
                vid_obj = videos[0]
                video_container = getattr(vid_obj, "video", None)
                raw = getattr(video_container, "video_bytes", None) if video_container else None
                if isinstance(raw, (bytes, bytearray)):
                    video_bytes = bytes(raw)
                elif isinstance(raw, str):
                    try:
                        video_bytes = base64.b64decode(raw)
                    except Exception:
                        pass
        except Exception:
            video_bytes = None

        if not video_bytes:
            return {
                "job_id": job_id,
                "operation": op_name,
                "status": "done_no_video",
                "note": "Operation finished but no video bytes found.",
                "reference_image_used": image_provided,
            }

        # Upload to Cloudinary
        try:
            upload_info = self._upload_to_cloudinary(video_bytes)
            return {
                "job_id": job_id,
                "operation": op_name,
                "status": "uploaded",
                "reference_image_used": image_provided,
                **upload_info,
            }
        except Exception as exc:
            return {
                "job_id": job_id,
                "operation": op_name,
                "status": "error",
                "message": f"Cloudinary upload failed: {exc}",
                "reference_image_used": image_provided,
            }

    # --- Helpers ----------------------------------------------------------------
    def _prepare_starting_image(self, image_url: str):  # returns a types.Image or None
        first = image_url
        # Remote URL: download and wrap
        if first.startswith("http://") or first.startswith("https://"):
            try:
                import requests

                resp = requests.get(first, timeout=30)
                if resp.status_code >= 400:
                    return None
                content_type = resp.headers.get("Content-Type", "").split(";")[0].strip().lower()
                if not content_type.startswith("image"):
                    # Some hosting may not set header; fallback assume jpeg
                    if not resp.content:
                        return None
                    content_type = "image/jpeg"
                data = resp.content
                # Prefer direct from_bytes if available, else write temp file and from_file
                if hasattr(types.Image, "from_bytes"):
                    try:
                        return types.Image.from_bytes(data=data, mime_type=content_type)  # type: ignore[attr-defined]
                    except Exception:
                        pass
                # Fallback: temp file
                try:
                    suffix = ".jpg" if "jpeg" in content_type or "jpg" in content_type else ".png"
                    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tf:
                        tf.write(data)
                        temp_path = tf.name
                    return types.Image.from_file(location=temp_path)  # type: ignore[attr-defined]
                except Exception:
                    return None
            except Exception:
                return None
        return None

    # --- Cloudinary upload --------------------------------------------------------
    def _upload_to_cloudinary(self, video_bytes: bytes) -> Dict[str, Any]:
        import requests

        cloud_name = "dnfkcjujc"  # provided static values
        upload_preset = "Artivio"
        endpoint = f"https://api.cloudinary.com/v1_1/{cloud_name}/video/upload"

        files = {"file": (f"veo_{uuid.uuid4().hex[:10]}.mp4", video_bytes, "video/mp4")}
        data = {"upload_preset": upload_preset}
        resp = requests.post(endpoint, files=files, data=data, timeout=120)
        if resp.status_code >= 400:
            raise RuntimeError(f"Cloudinary error {resp.status_code}: {resp.text[:400]}")
        payload = resp.json()
        return {
            "cloudinary_public_id": payload.get("public_id"),
            "cloudinary_url": payload.get("secure_url") or payload.get("url"),
            "bytes": payload.get("bytes"),
            "format": payload.get("format"),
        }

