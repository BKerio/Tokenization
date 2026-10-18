from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    # Needed for gated Hugging Face repos (Llama 3, Gemma, ...).
    hf_api_key: str = ""
    # Where tokenizer.json / tokenizer_config.json files are cached.
    hf_cache_dir: Path = BASE_DIR / "hf_cache"
    # Comma-separated list of origins allowed to call the API.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Upper bound on input size so a single request can't pin the server.
    max_text_length: int = 1_000_000

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
