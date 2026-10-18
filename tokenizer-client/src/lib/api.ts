// Base URL of the FastAPI backend. Empty means same origin (the Vite dev
// server proxies /api to the backend, see vite.config.ts).
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export type TokenRef = { id: number; idx: number };

export type Segment = {
  text: string;
  tokens: TokenRef[];
  special: boolean;
};

export type TokenizeResponse = {
  name: string;
  model: string;
  count: number;
  tokens: number[];
  segments: Segment[];
};

export type ModelGroup = { id: string; label: string; options: string[] };

export type ModelsResponse = {
  default: string;
  popular: string[];
  chat_models: string[];
  groups: ModelGroup[];
};

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // keep the generic message
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export function fetchModels(): Promise<ModelsResponse> {
  return request("/api/v1/models");
}

export function tokenize(
  model: string,
  text: string,
  signal?: AbortSignal
): Promise<TokenizeResponse> {
  return request("/api/v1/tokenize", {
    method: "POST",
    body: JSON.stringify({ model, text }),
    signal,
  });
}
