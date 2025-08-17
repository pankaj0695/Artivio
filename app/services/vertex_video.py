"""Stub service for video generation via Vertex (future)."""
from __future__ import annotations

import uuid
from typing import Any, Dict, List


class VertexVideoService:
    """Placeholder for product video generation logic.

    Future: craft prompts, transitions, camera pans, call Vertex Video model, store
    job metadata and poll until complete.
    """

    def generate_sequence(
        self,
        image_urls: List[str],
        duration_seconds: int | None,
        add_captions: bool,
        add_music: bool,
        preset: str | None,
    ) -> Dict[str, Any]:
        """Return a fake queued job record."""
        return {
            "job_id": f"vid-{uuid.uuid4().hex[:12]}",
            "preset": preset or "reel",
            "duration_seconds": duration_seconds or 20,
            "image_count": len(image_urls),
            "features": {"captions": add_captions, "music": add_music},
        }
