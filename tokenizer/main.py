import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.config import get_settings

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="Tiktokenizer API",
    description="Count and visualize tokens for OpenAI and open-source models.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def home():
    return {"message": "Tiktokenizer API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
