"""Stub service for image-related Vertex AI interactions."""
from __future__ import annotations

from typing import Any, Dict


class VertexImageService:
    """Placeholder methods where Vertex Image / GCS logic will live later."""

    def enhance(self, source: str | None, target_resolution: str | None, auto_lightning: bool) -> Dict[str, Any]:
        """Pretend to enhance image resolution & adjust lighting.

        Args:
            source: URL or base64 content.
            target_resolution: Desired WxH string.
            auto_lightning: Whether automatic lighting fix requested.
        Returns:
            Dict containing fake output URL & echo parameters.
        """
        return {
            "enhanced_url": "https://example.com/fake_enhanced.jpg",
            "target_resolution": target_resolution,
            "auto_lightning": auto_lightning,
            "source_present": bool(source),
        }

    def replace_background(self, source: str | None, background: str, lifestyle_context: str | None) -> Dict[str, Any]:
        """Pretend to replace or remove background.

        Would call segmentation / inpainting and upload to GCS later.
        """
        return {
            "processed_url": "https://example.com/fake_bg.jpg",
            "background_mode": background,
            "lifestyle_context": lifestyle_context,
            "source_present": bool(source),
        }

    def optimize(self, source: str | None, compress: bool, denoise: bool, sharpen: bool) -> Dict[str, Any]:
        """Pretend to apply compression & quality filters for low-end devices."""
        return {
            "optimized_url": "https://example.com/fake_optimized.jpg",
            "operations": {
                "compress": compress,
                "denoise": denoise,
                "sharpen": sharpen,
            },
            "source_present": bool(source),
        }
