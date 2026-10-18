"""Download and cache Hugging Face tokenizer files.

Ported from the original `src/scripts/download.ts`. Files are fetched lazily on
first use, or ahead of time with `python download.py`.
"""

import logging
from pathlib import Path

import httpx

from .catalog import hf_revision
from .config import get_settings

logger = logging.getLogger(__name__)

TOKENIZER_FILES = ("tokenizer.json", "tokenizer_config.json")


class HFDownloadError(RuntimeError):
    pass


def model_dir(model: str) -> Path:
    org_id, model_id = model.split("/", 1)
    return get_settings().hf_cache_dir / org_id / model_id


def ensure_downloaded(model: str, client: httpx.Client | None = None) -> Path:
    """Make sure the tokenizer files for `model` are cached and return their dir."""
    settings = get_settings()
    target_dir = model_dir(model)
    revision = hf_revision(model)

    if all((target_dir / file).exists() for file in TOKENIZER_FILES):
        return target_dir

    headers = {}
    if settings.hf_api_key:
        headers["Authorization"] = f"Bearer {settings.hf_api_key}"

    own_client = client is None
    client = client or httpx.Client(follow_redirects=True, timeout=60)
    try:
        for file in TOKENIZER_FILES:
            target = target_dir / file
            if target.exists():
                continue

            url = f"https://huggingface.co/{model}/resolve/{revision}/{file}"
            logger.info("Downloading %s", url)
            res = client.get(url, headers=headers)
            if res.status_code in (401, 403):
                reason = res.headers.get("x-error-message") or (
                    "Set HF_API_KEY to a token that has accepted the model's license."
                )
                raise HFDownloadError(f"'{model}' is gated on Hugging Face. {reason}")
            if res.status_code != 200:
                raise HFDownloadError(
                    f"Failed to fetch {file} for {model} (HTTP {res.status_code})"
                )

            target_dir.mkdir(parents=True, exist_ok=True)
            # Write atomically so a crash never leaves a truncated file behind.
            tmp = target.with_suffix(target.suffix + ".part")
            tmp.write_bytes(res.content)
            tmp.replace(target)
    finally:
        if own_client:
            client.close()

    return target_dir
