from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import TypeAdapter, ValidationError

from . import catalog
from .config import get_settings
from .engine import InvalidModelError, TokenizerResult, get_tokenizer
from .hf import HFDownloadError
from .schemas import (
    Encoder,
    EncodeResponse,
    ErrorResponse,
    Model,
    ModelGroup,
    ModelsResponse,
    TokenizeRequest,
    TokenizeResponse,
)

router = APIRouter(prefix="/api/v1")

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    400: {"model": ErrorResponse},
    413: {"model": ErrorResponse},
    502: {"model": ErrorResponse},
}


def run_tokenizer(model: str, text: str) -> TokenizerResult:
    if len(text) > get_settings().max_text_length:
        raise HTTPException(413, "Text is too long")
    try:
        return get_tokenizer(model).tokenize(text)
    except InvalidModelError as e:
        raise HTTPException(400, str(e)) from e
    except HFDownloadError as e:
        raise HTTPException(502, str(e)) from e


@router.get("/models", response_model=ModelsResponse)
def list_models() -> ModelsResponse:
    """Every model and encoding the tokenizer supports, grouped for display."""
    return ModelsResponse(
        default=catalog.DEFAULT_MODEL,
        popular=catalog.POPULAR,
        chat_models=catalog.CHAT_MODELS,
        groups=[
            ModelGroup(id="popular", label="Popular", options=catalog.POPULAR),
            ModelGroup(
                id="open-source",
                label="Open-Source Models",
                options=[m for m in catalog.OPEN_SOURCE_MODELS if m not in catalog.POPULAR],
            ),
            ModelGroup(
                id="openai-encodings",
                label="OpenAI Encodings",
                options=[m for m in catalog.OAI_ENCODINGS if m not in catalog.POPULAR],
            ),
            ModelGroup(
                id="openai-models",
                label="OpenAI Models",
                options=[m for m in catalog.OAI_MODELS if m not in catalog.POPULAR],
            ),
        ],
    )


@router.post("/tokenize", response_model=TokenizeResponse, responses=ERROR_RESPONSES)
def tokenize(body: TokenizeRequest) -> TokenizeResponse:
    """Tokenize text and return token ids plus segments aligned to the input."""
    result = run_tokenizer(body.model, body.text)
    return TokenizeResponse(
        name=result.name,
        model=body.model,
        count=result.count,
        tokens=result.tokens,
        segments=result.segments,
    )


_encode_input = TypeAdapter(dict[str, Any])
_encoder_adapter = TypeAdapter(Encoder)
_model_adapter = TypeAdapter(Model)


@router.api_route(
    "/encode",
    methods=["GET", "POST"],
    response_model=EncodeResponse,
    responses=ERROR_RESPONSES,
)
async def encode(request: Request) -> EncodeResponse:
    """Count tokens. Compatible with the original `/api/v1/encode` endpoint.

    Accepts `text` plus either `encoder` (an OpenAI encoding) or `model`, as
    query parameters and/or a JSON body. Query parameters take precedence.
    """
    data: dict[str, Any] = {}
    if request.method == "POST" and await request.body():
        try:
            data = _encode_input.validate_python(await request.json())
        except (ValueError, ValidationError) as e:
            raise HTTPException(400, "Body must be a JSON object") from e
    data.update(request.query_params)

    text = data.get("text")
    if not isinstance(text, str):
        raise HTTPException(400, "'text' is required and must be a string")

    try:
        if "encoder" in data:
            name = _encoder_adapter.validate_python(data["encoder"])
        elif "model" in data:
            name = _model_adapter.validate_python(data["model"])
        else:
            raise HTTPException(400, "Either 'encoder' or 'model' is required")
    except ValidationError as e:
        raise HTTPException(400, "Invalid model or encoder") from e

    result = run_tokenizer(name, text)
    return EncodeResponse(name=result.name, tokens=result.tokens, count=result.count)
