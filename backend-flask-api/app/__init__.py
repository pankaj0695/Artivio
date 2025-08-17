"""Application factory for artisan-assistant.

Loads config, registers blueprints, sets JSON-only error handling.
"""
from __future__ import annotations

from flask import Flask, jsonify
from .config import Config


def create_app() -> Flask:
    """Create and configure the Flask app instance.

    Returns:
        Configured Flask application.
    """
    app = Flask(__name__)
    app.config.from_object(Config())

    # Register blueprints
    from .routes.health import health_bp
    from .routes.images import images_bp
    from .routes.videos import videos_bp
    from .routes.content import content_bp
    from .routes.pricing import pricing_bp

    app.register_blueprint(health_bp)  # /health (no /api prefix)
    app.register_blueprint(images_bp, url_prefix="/api/images")
    app.register_blueprint(videos_bp, url_prefix="/api/videos")
    app.register_blueprint(content_bp, url_prefix="/api/content")
    app.register_blueprint(pricing_bp, url_prefix="/api/pricing")

    @app.errorhandler(Exception)
    def handle_unexpected(e):  # noqa: ANN001
        """Catch-all JSON error handler.

        In production we avoid leaking internals; otherwise echo truncated message.
        """
        env = app.config.get("FLASK_ENV", "development")
        message = "Internal server error"
        if env != "production":  # show short message only in non-prod
            message = (str(e) or message)[:200]
        return (
            jsonify({
                "error": e.__class__.__name__,
                "message": message,
            }),
            500,
        )

    @app.after_request
    def set_json_headers(resp):  # noqa: ANN001
        """Force JSON MIME type (defensive) and no caching for dynamic endpoints."""
        if resp.content_type.startswith("application/json"):
            resp.headers.setdefault("Cache-Control", "no-store")
        return resp

    return app
