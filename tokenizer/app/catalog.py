"""Catalog of every encoding and model the playground supports.

Ported from the original `src/models/index.ts`.
"""

OAI_ENCODINGS = [
    "gpt2",
    "r50k_base",
    "p50k_base",
    "p50k_edit",
    "cl100k_base",
    "o200k_base",
]

CHAT_MODELS = [
    "gpt-4o",
    "gpt-3.5-turbo",
    "gpt-4",
    "gpt-4-32k",
    "gpt-4-1106-preview",
]

LEGACY_TEXT_MODELS = [
    "text-davinci-003",
    "text-davinci-002",
    "text-davinci-001",
    "text-curie-001",
    "text-babbage-001",
    "text-ada-001",
    "davinci",
    "curie",
    "babbage",
    "ada",
    "code-davinci-002",
    "code-davinci-001",
    "code-cushman-002",
    "code-cushman-001",
    "davinci-codex",
    "cushman-codex",
    "text-davinci-edit-001",
    "code-davinci-edit-001",
]

EMBEDDING_MODELS = [
    "text-embedding-ada-002",
    "text-embedding-3-small",
    "text-embedding-3-large",
]

LEGACY_EMBEDDING_MODELS = [
    "text-similarity-davinci-001",
    "text-similarity-curie-001",
    "text-similarity-babbage-001",
    "text-similarity-ada-001",
    "text-search-davinci-doc-001",
    "text-search-curie-doc-001",
    "text-search-babbage-doc-001",
    "text-search-ada-doc-001",
    "code-search-babbage-code-001",
    "code-search-ada-code-001",
]

OAI_MODELS = [
    *CHAT_MODELS,
    *LEGACY_TEXT_MODELS,
    *LEGACY_EMBEDDING_MODELS,
    *EMBEDDING_MODELS,
]

OPEN_SOURCE_MODELS = [
    "codellama/CodeLlama-7b-hf",
    "codellama/CodeLlama-70b-hf",
    "meta-llama/Meta-Llama-3-8B",
    "meta-llama/Meta-Llama-3-70B",
    "microsoft/phi-2",
    "google/gemma-7b",
    "deepseek-ai/DeepSeek-R1",
    "Qwen/Qwen2.5-72B",
    "tiiuae/falcon-7b",
    "01-ai/Yi-6B",
    "openai/whisper-tiny",
]

# Some repos only ship a fast tokenizer.json on a PR branch.
HF_REVISIONS = {
    "meta-llama/Meta-Llama-3-8B": "refs/pr/35",
    "meta-llama/Meta-Llama-3-70B": "refs/pr/5",
}

ALL_MODELS = [*OAI_MODELS, *OPEN_SOURCE_MODELS]
ALL_OPTIONS = [*ALL_MODELS, *OAI_ENCODINGS]

POPULAR = [
    "cl100k_base",
    "o200k_base",
    "gpt-4-1106-preview",
    "gpt-3.5-turbo",
    "codellama/CodeLlama-7b-hf",
]

DEFAULT_MODEL = "gpt-4o"


def hf_revision(model: str) -> str:
    return HF_REVISIONS.get(model, "main")


def is_chat_model(model: str) -> bool:
    return model in CHAT_MODELS


def is_valid_option(model: str) -> bool:
    return model in ALL_OPTIONS
