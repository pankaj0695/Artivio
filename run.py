"""Dev entrypoint for artisan-assistant."""
from __future__ import annotations

from app import create_app

app = create_app()

if __name__ == "__main__":  # pragma: no cover (no tests per requirements)
    app.run(host="0.0.0.0", port=8080, debug=app.config.get("FLASK_ENV") != "production")
