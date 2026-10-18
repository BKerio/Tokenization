"""Group tokens into segments that line up with the user's input text.

A single grapheme (e.g. an emoji or a CJK character) can be split across
several tokens, and a single token can cover several graphemes. A segment is
the smallest run of consecutive tokens whose decoded text matches the next
graphemes of the input, so the UI can highlight text and token ids together.

Ported from the original `src/utils/segments.ts`.
"""

import regex
import tiktoken
from pydantic import BaseModel
from tokenizers import Encoding, Tokenizer

_GRAPHEME = regex.compile(r"\X")


class TokenRef(BaseModel):
    id: int
    idx: int


class Segment(BaseModel):
    text: str
    tokens: list[TokenRef]
    # True for tokens the tokenizer inserted itself (e.g. a BOS `<s>`), which
    # have no counterpart in the input text.
    special: bool = False


def split_graphemes(text: str) -> list[str]:
    return _GRAPHEME.findall(text)


def tiktoken_segments(
    enc: tiktoken.Encoding, text: str, tokens: list[int]
) -> list[Segment]:
    segments: list[Segment] = []
    input_graphemes = split_graphemes(text)
    pos = 0

    byte_acc = bytearray()
    token_acc: list[TokenRef] = []

    for idx, token in enumerate(tokens):
        byte_acc += enc.decode_single_token_bytes(token)
        token_acc.append(TokenRef(id=token, idx=idx))

        segment_text = byte_acc.decode("utf-8", errors="replace")
        graphemes = split_graphemes(segment_text)

        if input_graphemes[pos : pos + len(graphemes)] == graphemes:
            segments.append(Segment(text=segment_text, tokens=token_acc))
            pos += len(graphemes)
            byte_acc = bytearray()
            token_acc = []

    if token_acc:
        segments.append(
            Segment(text=byte_acc.decode("utf-8", errors="replace"), tokens=token_acc)
        )

    return segments


def huggingface_segments(
    tokenizer: Tokenizer, text: str, encoding: Encoding
) -> list[Segment]:
    segments: list[Segment] = []
    input_graphemes = split_graphemes(text)
    pos = 0

    def decode(ids: list[int]) -> str:
        return tokenizer.decode(ids, skip_special_tokens=False)

    # Ids of the text tokens seen so far, ignoring auto-inserted special tokens.
    text_ids: list[int] = []
    # Index into `text_ids` where the pending (unmatched) segment starts, and
    # where the last matched segment started.
    start = 0
    prev_start = 0
    token_acc: list[TokenRef] = []

    def flush_pending() -> None:
        nonlocal token_acc, start, prev_start
        if token_acc:
            segments.append(Segment(text=decode(text_ids[start:]), tokens=token_acc))
            token_acc = []
            prev_start, start = start, len(text_ids)

    for idx, (token, auto_special) in enumerate(
        zip(encoding.ids, encoding.special_tokens_mask)
    ):
        if auto_special:
            flush_pending()
            segments.append(
                Segment(
                    text=tokenizer.id_to_token(token) or "",
                    tokens=[TokenRef(id=token, idx=idx)],
                    special=True,
                )
            )
            continue

        text_ids.append(token)
        token_acc.append(TokenRef(id=token, idx=idx))

        # Decode the pending tokens with the previous segment as context, so
        # decoders that treat the first token specially (SentencePiece
        # stripping a leading space) or merge adjacent tokens (byte fallback)
        # behave as they would mid-sequence. A matched segment is always whole
        # text, so this keeps the work linear instead of re-decoding the prefix.
        context = text_ids[prev_start:start]
        context_text = decode(context)
        full = decode(context + text_ids[start:])
        if full.startswith(context_text):
            segment_text = full[len(context_text) :]
        else:
            prev = decode(text_ids[:start])
            segment_text = decode(text_ids)[len(prev) :]

        graphemes = split_graphemes(segment_text)
        if input_graphemes[pos : pos + len(graphemes)] == graphemes:
            segments.append(Segment(text=segment_text, tokens=token_acc))
            pos += len(graphemes)
            token_acc = []
            prev_start, start = start, len(text_ids)

    flush_pending()
    return segments
