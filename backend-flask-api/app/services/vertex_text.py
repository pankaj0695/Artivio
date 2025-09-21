import os
import base64
import tempfile
import time
from typing import Dict, Any
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from ..config import Config


class VertexTextService:
    """A service for generating text content using Vertex AI (Gemini)."""


    def __init__(self):
        """Initializes the VertexTextService with configurable model and robust error handling."""
        cfg = Config()
        self.project_id = cfg.GOOGLE_PROJECT_ID or os.getenv("GOOGLE_PROJECT_ID")
        self.location = (
            cfg.GOOGLE_LOCATION or os.getenv("GOOGLE_LOCATION") or "us-central1"
        )
        # Allow override of model name via env VERTEX_TEXT_MODEL else default to gemini-2.5-flash
        self.model_name = os.getenv("VERTEX_TEXT_MODEL", "gemini-2.5-flash")
        self._model = None
        self._init_error = None
        self._config = cfg
        self.max_retries = int(os.getenv("VERTEX_TEXT_MAX_RETRIES", "2"))
        self.retry_delay_seconds = float(os.getenv("VERTEX_TEXT_RETRY_DELAY", "0.75"))

        try:
            self._initialize_vertex()
        except Exception as e:
            self._init_error = e
            print(
                f"Warning: Vertex AI initialization failed. Text generation will not work. Error: {e}"
            )

    def _setup_credentials(self) -> None:
        """Set up ADC using base64 SA key if GOOGLE_APPLICATION_CREDENTIALS is not set."""
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            return
        creds_b64 = getattr(self._config, "GOOGLE_CREDENTIALS_JSON_BASE64", None)
        if not creds_b64:
            # Fall back to ADC (gcloud auth application-default login)
            return
        try:
            key_bytes = base64.b64decode(creds_b64)
            key_path = os.path.join(tempfile.gettempdir(), f"sa_{int(time.time())}.json")
            with open(key_path, "wb") as fh:
                fh.write(key_bytes)
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path
        except Exception as exc:
            raise RuntimeError(
                "Failed decoding service account key from GOOGLE_CREDENTIALS_JSON_BASE64"
            ) from exc

    def _initialize_vertex(self):
        """Initializes the Vertex AI client if not already done."""
        self._setup_credentials()
        if not self.project_id:
            raise ValueError(
                "Missing GOOGLE_PROJECT_ID environment variable for Vertex AI."
            )
        vertexai.init(project=self.project_id, location=self.location)

    def _get_model(self):
        """Lazy-loads the Gemini model defined by configuration."""
        if self._init_error:
            raise RuntimeError(
                f"Vertex AI not initialized: {self._init_error}"
            ) from self._init_error

        if self._model is None:
            self._model = GenerativeModel(self.model_name)
        return self._model

    def _call_model(
        self, prompt: str, max_output_tokens: int, temperature: float = 0.2
    ) -> Dict[str, Any]:
        """Calls the Gemini model with retries and returns structured info.

        Returns dict: { text, blocked, error, attempts, latency_ms }
        """
        attempt = 0
        last_error = None
        start_overall = time.perf_counter()
        while attempt <= self.max_retries:
            attempt += 1
            start = time.perf_counter()
            try:
                model = self._get_model()
                gen_cfg = GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                )
                resp = model.generate_content(prompt, generation_config=gen_cfg)
                text = (getattr(resp, "text", "") or "").strip()
                if text:
                    return {
                        "text": text,
                        "blocked": False,
                        "error": None,
                        "attempts": attempt,
                        "latency_ms": int((time.perf_counter() - start) * 1000),
                    }
                # Empty text; treat as possibly blocked/filtered
                if attempt > self.max_retries:
                    return {
                        "text": "",
                        "blocked": True,
                        "error": "Empty or blocked response",
                        "attempts": attempt,
                        "latency_ms": int((time.perf_counter() - start_overall) * 1000),
                    }
            except Exception as exc:  # noqa: BLE001
                last_error = str(exc)
                if attempt > self.max_retries:
                    return {
                        "text": "",
                        "blocked": False,
                        "error": last_error,
                        "attempts": attempt,
                        "latency_ms": int((time.perf_counter() - start_overall) * 1000),
                    }
            time.sleep(self.retry_delay_seconds)
        return {
            "text": "",
            "blocked": False,
            "error": last_error or "Unknown error",
            "attempts": attempt,
            "latency_ms": int((time.perf_counter() - start_overall) * 1000),
        }

    # --- Fallback helpers -------------------------------------------------
    def _fallback(self, kind: str, product_name: str) -> str:
        name = (product_name or "Product").strip()
        if kind == "title":
            return f"{name} Handmade Creation"
        if kind == "description":
            return f"{name} – a handcrafted item made with care."
        if kind == "keywords":
            return "handmade, artisan, craft"
        if kind == "tagline":
            return f"{name} artisan crafted"
        return name

    def generate_title(self, product_name: str, keywords: str) -> str:
        """Generates a product title."""
        prompt = f"""Suggest one catchy, SEO-optimized title for a product named '{product_name}' using these keywords: {keywords}.
The title should be under 70 characters.
Return only the title text, with no extra formatting, quotes, or introductory phrases."""
        base_prompt = f"""Craft a concise, compelling artisan product title for '{product_name}'.
Include 1-2 of these keywords if natural: {keywords}.
Constraints: Max 8 words. Avoid filler like 'Best', 'Premium'. Return ONLY the title text."""
        result = self._call_model(base_prompt, max_output_tokens=20)
        if not result["text"]:
            return self._fallback("title", product_name)
        title = result["text"].strip().strip('"')
        # Post-process: if too short (<=1 word) or too generic, attempt enhancement
        words = title.split()
        generic = {"product", "item", "artisan", "handmade"}
        if len(words) <= 1 or all(w.lower() in generic for w in words):
            enhance_prompt = f"Improve this weak title for '{product_name}' using at most 7 words, keeping it specific, authentic, and keyword-aware (subset only): {keywords}.\nOriginal: {title}\nRewritten (no quotes):"
            enhance = self._call_model(enhance_prompt, max_output_tokens=20, temperature=0.6)
            if enhance["text"] and len(enhance["text"].split()) <= 8:
                new_title = enhance["text"].strip().strip('"')
                if len(new_title.split()) > 1:
                    title = new_title
        return title

    def generate_description(
        self, product_name: str, keywords: str, tone: str = "professional"
    ) -> str:
        """Generates a product description."""
        base_prompt = f"""Write an engaging, {tone} SEO product description for '{product_name}'.
Incorporate these keywords naturally: {keywords}.
The description should be around 150 words, in 2-3 paragraphs.
Highlight: craftsmanship, heritage inspiration, practical use, emotional appeal.
Return only the description text, no headings."""
        result = self._call_model(base_prompt, max_output_tokens=350)
        if not result["text"]:
            return self._fallback("description", product_name)
        text = result["text"].strip()
        # If too short, attempt an expansion pass
        min_len = int(os.getenv("VERTEX_DESC_MIN_LEN", "180"))
        target_len = int(os.getenv("VERTEX_DESC_TARGET_LEN", "230"))
        if len(text) < min_len:
            expand_prompt = (
                f"The following draft description for '{product_name}' is too short. Improve it to roughly {target_len} words.\n"
                f"Maintain the same tone: {tone}.\n"
                "Ensure it includes:\n"
                "- Opening hook evoking heritage or artistry\n"
                "- Materials & making technique (if implied)\n"
                "- Practical usage scenario\n"
                "- Care or longevity hint\n"
                "- Subtle call-to-action\n\n"
                "Draft:\n"
                f"""{text}\n\n"""
                "Rewrite now (no title, no bullet list):"
            )
            expand_result = self._call_model(expand_prompt, max_output_tokens=420, temperature=0.4)
            if expand_result["text"] and len(expand_result["text"]) > len(text):
                text = expand_result["text"].strip()
        return text

    def generate_keywords(self, product_name: str, category: str) -> str:
        """Generates SEO keywords."""
        prompt = f"""Suggest a list of 10 SEO keywords for a product '{product_name}' in the category '{category}'.
Return the keywords as a single comma-separated string. Do not include numbers or bullet points."""
        result = self._call_model(prompt, max_output_tokens=50)
        if not result["text"]:
            return self._fallback("keywords", product_name)
        raw = result["text"].strip()
        # Split aggressively on commas or newlines
        candidates = [c.strip() for chunk in raw.split("\n") for c in chunk.split(",")]
        clean = []
        seen = set()
        banned = {"product", "item", "artisan", "handmade"}
        for c in candidates:
            if not c:
                continue
            token = c.lower().rstrip('.').strip()
            # Filter banned or long phrases
            if token in banned or len(token.split()) > 3:
                continue
            if token not in seen:
                seen.add(token)
                clean.append(token)
            if len(clean) >= 8:  # Limit to max_keywords
                break
        if not clean:
            return self._fallback("keywords", product_name)
        return ", ".join(clean)

    def generate_tagline(self, product_name: str, keywords: str, tone: str = "artisan") -> str:
        """Generates a product tagline."""
        base_prompt = f"""Generate 5 distinct punchy {tone} taglines for '{product_name}'.
Each must: be <=8 words, no trailing period, no quotes, avoid hype words (revolutionary, ultimate, premium), optionally use ONE of: {keywords}.
Return as a plain list separated by newlines, no numbering."""
        result = self._call_model(base_prompt, max_output_tokens=80, temperature=0.8)
        if not result["text"]:
            return self._fallback("tagline", product_name)
        raw_lines = [l.strip().strip('"') for l in result["text"].splitlines() if l.strip()]
        # Heuristic scoring
        sensory = {"warm", "textured", "earth", "hand", "crafted", "woven", "glow", "grain", "patina", "silk", "stone", "clay", "brass"}
        weak = {"artisan", "handmade", "crafted", "quality", "authentic"}
        banned = {"revolutionary", "ultimate", "premium", "best", "amazing", "exclusive"}

        def score(t: str) -> float:
            w = t.lower().split()
            if len(w) < 2:
                return 0
            if any(b in w for b in banned):
                return 0
            length_penalty = max(0, len(w) - 8) * 2
            sensory_hits = sum(1 for token in w if token in sensory)
            weak_hits = sum(1 for token in w if token in weak)
            uniqueness = len(set(w)) / max(1, len(w))
            return sensory_hits * 2 + uniqueness * 3 - weak_hits - length_penalty

        candidates = []
        seen = set()
        for line in raw_lines:
            if not line:
                continue
            # normalize spacing & trim trailing punctuation commas/periods
            norm = " ".join(line.split()).rstrip(".,;: ")
            if norm.lower() in seen:
                continue
            seen.add(norm.lower())
            if len(norm.split()) > 10:
                continue
            candidates.append((score(norm), norm))

        if not candidates:
            return self._fallback("tagline", product_name)
        candidates.sort(key=lambda x: x[0], reverse=True)
        best = candidates[0][1]

        # Handle obviously truncated (ends with comma) or very short (<3 words) first
        if best.endswith(',') or len(best.split()) < 3:
            fix_prompt = f"The following tagline looks incomplete or too short. Expand it to a vivid, sensory phrase (3-8 words, no hype, no punctuation end) for '{product_name}'.\nTagline: {best}\nImproved:"
            fixed = self._call_model(fix_prompt, max_output_tokens=20, temperature=0.7)
            if fixed["text"]:
                candidate = fixed["text"].strip().strip('"').rstrip(".,;:")
                if 3 <= len(candidate.split()) <= 8:
                    best = candidate

        if candidates[0][0] < 2.5:
            refine_prompt = f"Improve this tagline for '{product_name}' into something more sensory & evocative (<=8 words, no hype, no period): {best}\nRewritten:";
            refine = self._call_model(refine_prompt, max_output_tokens=20, temperature=0.7)
            if refine["text"]:
                refined = refine["text"].strip().strip('"').rstrip('.')
                if 2 <= len(refined.split()) <= 8:
                    best = refined
        # Final sanitation: remove dangling punctuation & double spaces
        best = " ".join(best.split()).rstrip(",;:. ")
        return best
