# artisan-assistant (Flask API)

Minimal, JSON-only Flask 3.x backend with stub endpoints for image optimization, video generation, SEO content, and pricing suggestions. No DB, no auth, just placeholders ready to wire into Vertex AI later.

## Quick Start

1. Create & activate Python 3.11+ environment.
2. Install deps:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy env file:
   ```bash
   cp .env.example .env
   ```
4. Run dev server:
   ```bash
   python run.py
   ```
   Or with gunicorn:
   ```bash
   gunicorn --config gunicorn.conf.py "app:create_app()"
   ```

Service listens on http://localhost:8080

## Environment Variables

See `.env.example` for all keys. Only minimal placeholders now.

| Key                | Purpose                              | Default                 |
| ------------------ | ------------------------------------ | ----------------------- |
| FLASK_ENV          | environment mode                     | development             |
| SECRET_KEY         | session / signing (not heavily used) | dev-secret              |
| GOOGLE_PROJECT_ID  | future Vertex project id             | None                    |
| GOOGLE_LOCATION    | Vertex region                        | None                    |
| VERTEX_TEXT_MODEL  | placeholder text model               | placeholder-text-model  |
| VERTEX_IMAGE_MODEL | placeholder image model              | placeholder-image-model |
| VERTEX_VIDEO_MODEL | placeholder video model              | placeholder-video-model |
| GCS_BUCKET_NAME    | future bucket for assets             | placeholder-bucket      |
| MAX_CONTENT_LENGTH | request size limit                   | 26214400                |

## Endpoints Summary

### Health

GET /health -> `{ "status": "ok", "service": "artisan-assistant" }`

### Images (`/api/images`)

POST /enhance

```json
{
  "image_url": "https://...",
  "target_resolution": "1024x1024",
  "auto_lightning": true
}
```

POST /background

```json
{
  "image_url": "https://...",
  "background": "white|transparent|lifestyle",
  "lifestyle_context": "studio pottery on wooden table"
}
```

POST /optimize

```json
{
  "image_url": "https://...",
  "compress": true,
  "denoise": true,
  "sharpen": true
}
```

### Videos (`/api/videos`)

POST /generate

```json
{
  "image_urls": ["https://...1.jpg", "https://...2.jpg"],
  "duration_seconds": 25,
  "add_captions": true,
  "add_music": true,
  "preset": "reel"
}
```

Response: `202 Accepted` with `{ "job_id": "...", "status": "queued" }`

### Content (`/api/content`)

POST /generate

```json
{
  "product_name": "Handcrafted Ceramic Mug",
  "keywords": ["ceramic", "mug", "artisan"],
  "craft_region": "Jaipur",
  "materials": ["clay"],
  "style": "rustic",
  "languages": ["en", "hi"],
  "platforms": ["google", "etsy", "instagram"],
  "story_depth": "medium"
}
```

### Pricing (`/api/pricing`)

POST /suggest

```json
{
  "product_name": "Handcrafted Ceramic Mug",
  "category": "home-decor",
  "cost_price": 150,
  "marketplaces": ["etsy", "amazon"],
  "festival_context": "Diwali",
  "competitor_samples": [{ "title": "Rustic Mug", "price": 399 }],
  "trend_hints": ["warm tones"]
}
```

## Error Handling

All unexpected errors return JSON:

```json
{ "error": "ExceptionType", "message": "(truncated in non-prod)" }
```

## Notes

- All outputs are placeholders; integrate Vertex AI & storage later.
- Keep the codebase small—no ORM, no tests (by spec), no extra tooling.
