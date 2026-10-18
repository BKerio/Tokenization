"""Tokenizer implementations backed by tiktoken and Hugging Face `tokenizers`.

Ported from the original `src/models/tokenizer.ts`.
"""

import threading
from dataclasses import dataclass
from functools import lru_cache
from typing import Protocol

import tiktoken
from tokenizers import Tokenizer as HFTokenizer

from . import hf
from .catalog import OAI_ENCODINGS, OAI_MODELS, OPEN_SOURCE_MODELS
from .segments import Segment, huggingface_segments, tiktoken_segments


class InvalidModelError(ValueError):
    pass


@dataclass
class TokenizerResult:
    name: str
    tokens: list[int]
    segments: list[Segment]

    @property
    def count(self) -> int:
        return len(self.tokens)


class Tokenizer(Protocol):
    name: str

    def tokenize(self, text: str) -> TokenizerResult: ...


# ChatML tokens, so the chat editor's output is counted the way the API does.
_CHAT_SPECIAL_TOKENS = {
    "cl100k_base": {
        "<|im_start|>": 100264,
        "<|im_end|>": 100265,
        "<|im_sep|>": 100266,
    },
    "o200k_base": {
        "<|im_start|>": 200264,
        "<|im_end|>": 200265,
        "<|im_sep|>": 200266,
    },
}

_CHAT_MODEL_ENCODINGS = {
    "gpt-3.5-turbo": "cl100k_base",
    "gpt-4": "cl100k_base",
    "gpt-4-32k": "cl100k_base",
    "gpt-4-1106-preview": "cl100k_base",
    "gpt-4o": "o200k_base",
}


@lru_cache
def _chat_encoding(base_name: str) -> tiktoken.Encoding:
    base = tiktoken.get_encoding(base_name)
    return tiktoken.Encoding(
        name=base.name,
        pat_str=base._pat_str,
        mergeable_ranks=base._mergeable_ranks,
        special_tokens={**base._special_tokens, **_CHAT_SPECIAL_TOKENS[base_name]},
    )


class TiktokenTokenizer:
    def __init__(self, model: str):
        if model in OAI_ENCODINGS:
            self.enc = tiktoken.get_encoding(model)
        elif model in _CHAT_MODEL_ENCODINGS:
            self.enc = _chat_encoding(_CHAT_MODEL_ENCODINGS[model])
        elif model in OAI_MODELS:
            self.enc = tiktoken.encoding_for_model(model)
        else:
            raise InvalidModelError(f"Invalid model or encoding: {model}")
        self.name = self.enc.name

    def tokenize(self, text: str) -> TokenizerResult:
        tokens = self.enc.encode(text, allowed_special="all")
        return TokenizerResult(
            name=self.name,
            tokens=tokens,
            segments=tiktoken_segments(self.enc, text, tokens),
        )


class OpenSourceTokenizer:
    def __init__(self, model: str):
        if model not in OPEN_SOURCE_MODELS:
            raise InvalidModelError(f"Invalid model: {model}")
        path = hf.ensure_downloaded(model) / "tokenizer.json"
        self.tokenizer = HFTokenizer.from_file(str(path))
        self.name = model

    def tokenize(self, text: str) -> TokenizerResult:
        encoding = self.tokenizer.encode(text)
        return TokenizerResult(
            name=self.name,
            tokens=list(encoding.ids),
            segments=huggingface_segments(self.tokenizer, text, encoding),
        )


_cache: dict[str, Tokenizer] = {}
_lock = threading.Lock()


def get_tokenizer(name: str) -> Tokenizer:
    """Return a (cached) tokenizer for a model or encoding name."""
    if (cached := _cache.get(name)) is not None:
        return cached

    with _lock:
        if (cached := _cache.get(name)) is not None:
            return cached

        if name in OAI_ENCODINGS or name in OAI_MODELS:
            tokenizer: Tokenizer = TiktokenTokenizer(name)
        elif name in OPEN_SOURCE_MODELS:
            tokenizer = OpenSourceTokenizer(name)
        else:
            raise InvalidModelError(f"Invalid model or encoding: {name}")

        _cache[name] = tokenizer
        return tokenizer
