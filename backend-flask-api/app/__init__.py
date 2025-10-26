"""Application factory for artisan-assistant.

Loads config, registers blueprints, sets JSON-only error handling.
"""
from __future__ import annotations

from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
try:
    # Load environment variables from a .env file if present (searches upwards)
    from dotenv import load_dotenv, find_dotenv  # type: ignore

    load_dotenv(find_dotenv(), override=False)
except Exception:
    # python-dotenv is optional; if not installed, env vars must be provided by the process
    pass


def create_app() -> Flask:
    """Create and configure the Flask app instance.

    Returns:
        Configured Flask application.
    """
    app = Flask(__name__)
    app.config.from_object(Config())

    # CORS: allow frontend app (env NEXT_PUBLIC_FRONTEND_ORIGIN or default localhost:3000)
    frontend_origin = app.config.get("FRONTEND_ORIGIN") or "http://localhost:3000"
    CORS(
        app,
        resources={r"/api/*": {"origins": [frontend_origin]}},
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-Requested-With",
        ],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        max_age=600,
    )

    # Register blueprints
    from .routes.health import health_bp
    from .routes.images import images_bp
    from .routes.videos import videos_bp
    from .routes.content import content_bp
    from .routes.pricing import pricing_bp
    from .routes.ads_routes import ads_bp

    app.register_blueprint(health_bp)  # /health (no /api prefix)
    app.register_blueprint(ads_bp)
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
