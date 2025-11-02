"""Dev entrypoint for artisan-assistant."""
from __future__ import annotations

from app import create_app

app = create_app()
print("--- REGISTERED ROUTES ---")
with app.app_context():
    for rule in app.url_map.iter_rules():
        # We don't need to see the 'static' route
        if rule.endpoint != 'static':
            print(f"Endpoint: {rule.endpoint}")
            print(f"  Methods: {list(rule.methods)}")
            print(f"  Route: {str(rule)}")

if __name__ == "__main__":  # pragma: no cover (no tests per requirements)
    app.run(host="0.0.0.0", port=5001, debug=app.config.get("FLASK_ENV") != "production")
