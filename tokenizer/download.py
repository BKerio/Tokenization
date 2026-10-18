"""Pre-download every open-source tokenizer into the cache.

Usage: python download.py
"""

import logging
import sys

import httpx

from app.catalog import OPEN_SOURCE_MODELS
from app.hf import HFDownloadError, ensure_downloaded


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    failed = []
    with httpx.Client(follow_redirects=True, timeout=60) as client:
        for model in OPEN_SOURCE_MODELS:
            try:
                path = ensure_downloaded(model, client)
                print(f"ok      {model} -> {path}")
            except HFDownloadError as e:
                failed.append(model)
                print(f"FAILED  {model}: {e}", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
