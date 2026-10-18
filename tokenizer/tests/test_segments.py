import shutil
from pathlib import Path

import pytest
import tiktoken

from app import engine, hf
from app.config import get_settings
from app.segments import tiktoken_segments

FIXTURES = [
    "Hello world",
    "New lines\n\n\n\n\n       Spaces",
    "👩‍👦‍👦 👩‍👧‍👦 👩‍👧‍👧 👩‍👩‍👦 👩‍👩‍👧 🇨🇿 Emojis: 🧑🏾‍💻️🧑🏿‍🎓️🧑🏿‍🏭️🧑🏿‍💻️",
    "是美國一個人工智能研究實驗室 由非營利組織OpenAI Inc",
    "<|im_start|>test<|im_end|>",
]


@pytest.mark.parametrize("fixture", FIXTURES)
def test_tiktoken_segments_equality(fixture: str):
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(fixture, allowed_special="all")
    segments = tiktoken_segments(enc, fixture, tokens)

    assert "".join(s.text for s in segments) == enc.decode(tokens)
    assert [t.id for s in segments for t in s.tokens] == tokens
    assert [t.idx for s in segments for t in s.tokens] == list(range(len(tokens)))


@pytest.mark.parametrize(
    "text,expected",
    [
        (
            "👩‍👦‍👦 👩‍👧‍👦 👩‍👧‍👧 👩‍👩‍👦 👩‍👩‍👧 🇨🇿",
            ["👩‍👦‍👦", " 👩‍👧‍👦", " 👩‍👧‍👧", " 👩‍👩‍👦", " 👩‍👩‍👧", " 🇨🇿"],
        ),
        ("由非營利組織", ["由", "非", "營", "利", "組", "織"]),
    ],
)
def test_tiktoken_segments_graphemes(text: str, expected: list[str]):
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text, allowed_special="all")
    assert [s.text for s in tiktoken_segments(enc, text, tokens)] == expected


def test_chat_model_special_tokens():
    result = engine.get_tokenizer("gpt-4o").tokenize("<|im_start|>user<|im_sep|>hi<|im_end|>")
    assert result.tokens[0] == 200264
    assert 200266 in result.tokens
    assert result.tokens[-1] == 200265


def test_new_embedding_models_supported():
    assert engine.get_tokenizer("text-embedding-3-small").tokenize("hi").count == 1


# Tokenizer files fetched by `python download.py`.
LOCAL_HF_DIR = Path(__file__).resolve().parents[1] / "hf_cache"
CODELLAMA = "codellama/CodeLlama-7b-hf"


@pytest.fixture
def codellama(tmp_path, monkeypatch):
    src = LOCAL_HF_DIR / CODELLAMA
    if not (src / "tokenizer.json").exists():
        pytest.skip("CodeLlama tokenizer not cached locally")
    shutil.copytree(src, tmp_path / CODELLAMA)
    monkeypatch.setattr(get_settings(), "hf_cache_dir", tmp_path)
    monkeypatch.setattr(engine, "_cache", {})
    # Fail loudly if anything tries to hit the network.
    monkeypatch.setattr(hf.httpx, "Client", None)
    return engine.get_tokenizer(CODELLAMA)


@pytest.mark.parametrize("fixture", FIXTURES[:4])
def test_huggingface_segments(codellama, fixture: str):
    result = codellama.tokenize(fixture)
    segments = result.segments

    # The auto-inserted BOS token gets its own special segment.
    assert segments[0].special and segments[0].text == "<s>"
    assert not any(s.special for s in segments[1:])

    text_ids = result.tokens[1:]
    assert "".join(s.text for s in segments[1:]) == codellama.tokenizer.decode(
        text_ids, skip_special_tokens=False
    )
    assert [t.id for s in segments for t in s.tokens] == result.tokens
    assert [t.idx for s in segments for t in s.tokens] == list(range(result.count))


def test_huggingface_segments_resync_after_byte_fallback(codellama):
    # The emoji is encoded as byte-fallback tokens; segmentation must not get
    # stuck afterwards and swallow the rest of the text into one segment.
    texts = [s.text for s in codellama.tokenize("你好 🎉\nThe quick").segments[1:]]
    # The leading "▁" token decodes to nothing at the start of a sequence.
    assert texts == ["", "你", "好", " ", "🎉", "\n", "The", " quick"]


def test_huggingface_segments_graphemes(codellama):
    texts = [s.text for s in codellama.tokenize("由非營利組織").segments[1:]]
    assert "".join(texts).strip() == "由非營利組織"
    assert all("�" not in t for t in texts)
