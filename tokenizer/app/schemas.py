from typing import Literal

from pydantic import BaseModel, Field

from .catalog import ALL_MODELS, ALL_OPTIONS, OAI_ENCODINGS
from .segments import Segment

# Literal types give clients validation errors and a dropdown in /docs.
Option = Literal[tuple(ALL_OPTIONS)]  # type: ignore[valid-type]
Model = Literal[tuple(ALL_MODELS)]  # type: ignore[valid-type]
Encoder = Literal[tuple(OAI_ENCODINGS)]  # type: ignore[valid-type]


class ModelGroup(BaseModel):
    id: str
    label: str
    options: list[str]


class ModelsResponse(BaseModel):
    default: str
    popular: list[str]
    chat_models: list[str]
    groups: list[ModelGroup]


class TokenizeRequest(BaseModel):
    model: Option = Field(examples=["gpt-4o"])
    text: str = Field(examples=["Hello world"])


class TokenizeResponse(BaseModel):
    name: str
    model: str
    count: int
    tokens: list[int]
    segments: list[Segment]


class EncodeResponse(BaseModel):
    name: str | None = None
    tokens: list[int]
    count: int


class ErrorResponse(BaseModel):
    detail: str
