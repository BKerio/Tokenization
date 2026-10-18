# Tiktokenizer API (FastAPI)

Backend for the Tiktokenizer playground. Tokenizes text with
[tiktoken](https://github.com/openai/tiktoken) (OpenAI models and encodings)
and Hugging Face [tokenizers](https://github.com/huggingface/tokenizers)
(open-source models). The React client lives in `../tokenizer-client`.

## Run

```sh
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # set HF_API_KEY for gated models
python download.py              # optional: pre-fetch open-source tokenizers
fastapi dev main.py             # http://127.0.0.1:8000, docs at /docs
```

Then, in `../tokenizer-client`:

```sh
npm install
npm run dev                     # http://localhost:5173, proxies /api to :8000
```

Open-source tokenizer files are downloaded on first use into `hf_cache/`.
Llama 3 and Gemma are gated: `HF_API_KEY` must belong to an account that has
accepted their licenses.

## Endpoints

| Method     | Path               | Description                                              |
| ---------- | ------------------ | -------------------------------------------------------- |
| `GET`      | `/api/v1/models`   | Supported models/encodings, grouped for the UI           |
| `POST`     | `/api/v1/tokenize` | `{model, text}` → token ids, count, and text segments    |
| `GET/POST` | `/api/v1/encode`   | `text` + `encoder` or `model` → `{name, tokens, count}`  |
| `GET`      | `/health`          | Liveness check                                           |

`/api/v1/encode` matches the original Next.js endpoint, so existing callers
keep working.

## Test

```sh
pytest
```
