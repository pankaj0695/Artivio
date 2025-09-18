import os
import base64
import tempfile
import time
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from ..config import Config


class VertexTextService:
    """A service for generating text content using Vertex AI (Gemini)."""


    def __init__(self):
        """Initializes the VertexTextService."""
        cfg = Config()
        self.project_id = cfg.GOOGLE_PROJECT_ID or os.getenv("GOOGLE_PROJECT_ID")
        self.location = (cfg.GOOGLE_LOCATION or os.getenv("GOOGLE_LOCATION") or "us-central1")
        self._model = None
        self._init_error = None
        self._config = cfg

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
        """Lazy-loads the Gemini model (gemini-1.5-flash)."""
        if self._init_error:
            raise RuntimeError(
                f"Vertex AI not initialized: {self._init_error}"
            ) from self._init_error

        if self._model is None:
            # Prefer the latest flash model; allow region-specific suffix if needed
            # Using -001 suffix for stability; adjust if your project exposes plain name
            self._model = GenerativeModel("gemini-1.5-flash-001")
        return self._model

    def _call_model(
        self, prompt: str, max_output_tokens: int, temperature: float = 0.2
    ) -> str:
        """Calls the Gemini model with the given prompt."""
        model = self._get_model()
        gen_cfg = GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
        resp = model.generate_content(prompt, generation_config=gen_cfg)
        return getattr(resp, "text", "") or ""

    def generate_title(self, product_name: str, keywords: str) -> str:
        """Generates a product title."""
        prompt = f"""Suggest one catchy, SEO-optimized title for a product named '{product_name}' using these keywords: {keywords}.
The title should be under 70 characters.
Return only the title text, with no extra formatting, quotes, or introductory phrases."""
        return self._call_model(prompt, max_output_tokens=50)

    def generate_description(
        self, product_name: str, keywords: str, tone: str = "professional"
    ) -> str:
        """Generates a product description."""
        prompt = f"""Write an engaging, {tone} SEO product description for '{product_name}'.
Incorporate these keywords naturally: {keywords}.
The description should be around 150 words, in 2-3 paragraphs.
Return only the description text, without any titles or introductory phrases."""
        return self._call_model(prompt, max_output_tokens=250)

    def generate_keywords(self, product_name: str, category: str) -> str:
        """Generates SEO keywords."""
        prompt = f"""Suggest a list of 10 SEO keywords for a product '{product_name}' in the category '{category}'.
Return the keywords as a single comma-separated string. Do not include numbers or bullet points."""
        return self._call_model(prompt, max_output_tokens=100)

    def generate_tagline(self, product_name: str) -> str:
        """Generates a product tagline."""
        prompt = f"""Suggest one short, catchy tagline for the product '{product_name}'.
Keep it under 10 words.
Return only the tagline text, with no extra formatting or introductory phrases."""
        return self._call_model(prompt, max_output_tokens=20)
