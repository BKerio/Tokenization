from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_models():
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    body = res.json()
    assert body["default"] == "gpt-4o"
    assert "gpt-4o" in body["chat_models"]
    assert [g["id"] for g in body["groups"]] == [
        "popular",
        "open-source",
        "openai-encodings",
        "openai-models",
    ]


def test_tokenize():
    res = client.post("/api/v1/tokenize", json={"model": "cl100k_base", "text": "Hello world"})
    assert res.status_code == 200
    body = res.json()
    assert body == {
        "name": "cl100k_base",
        "model": "cl100k_base",
        "count": 2,
        "tokens": [9906, 1917],
        "segments": [
            {"text": "Hello", "tokens": [{"id": 9906, "idx": 0}], "special": False},
            {"text": " world", "tokens": [{"id": 1917, "idx": 1}], "special": False},
        ],
    }


def test_tokenize_invalid_model():
    res = client.post("/api/v1/tokenize", json={"model": "nope", "text": "x"})
    assert res.status_code == 422


def test_encode_get_with_encoder():
    res = client.get("/api/v1/encode", params={"encoder": "cl100k_base", "text": "Hello world"})
    assert res.json() == {"name": "cl100k_base", "tokens": [9906, 1917], "count": 2}


def test_encode_post_with_model():
    res = client.post("/api/v1/encode", json={"model": "gpt-4", "text": "Hello world"})
    assert res.json() == {"name": "cl100k_base", "tokens": [9906, 1917], "count": 2}


def test_encode_query_overrides_body():
    res = client.post(
        "/api/v1/encode?encoder=gpt2", json={"encoder": "cl100k_base", "text": "Hello world"}
    )
    assert res.json()["name"] == "gpt2"


def test_encode_errors():
    assert client.get("/api/v1/encode", params={"text": "x"}).status_code == 400
    assert client.get("/api/v1/encode", params={"model": "gpt-4"}).status_code == 400
    assert client.get("/api/v1/encode", params={"encoder": "gpt-4", "text": "x"}).status_code == 400
