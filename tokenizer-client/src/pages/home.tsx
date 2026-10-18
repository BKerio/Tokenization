import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { SocialLinks } from "@/components/social-links";
import { Alert } from "@/components/ui/alert";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchModels, tokenize } from "@/lib/api";
import { REPO_URL } from "@/lib/site";
import { InputPanel } from "@/sections/input-panel";
import { OutputPanel } from "@/sections/output-panel";
import { type ApiStatus, SiteHeader } from "@/sections/site-header";

const FALLBACK_MODEL = "gpt-4o";

function useModelParam(validOptions: string[] | undefined, fallback: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("model");

  // Until the model list loads, trust the URL; afterwards, reject unknowns.
  const model =
    requested && (!validOptions || validOptions.includes(requested))
      ? requested
      : fallback;

  const setModel = (model: string) => setSearchParams({ model });

  return [model, setModel] as const;
}

export default function Home() {
  const models = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
    staleTime: Infinity,
  });

  const allOptions = models.data?.groups.flatMap((g) => g.options);
  const chatModels = models.data?.chat_models ?? [];
  const [model, setModel] = useModelParam(
    allOptions,
    models.data?.default ?? FALLBACK_MODEL
  );
  const isChatModel = (m: string) => chatModels.includes(m);

  const [inputText, setInputText] = useState("");
  const debouncedText = useDebouncedValue(inputText, 150);

  const tokens = useQuery({
    queryKey: ["tokenize", model, debouncedText],
    queryFn: ({ signal }) => tokenize(model, debouncedText, signal),
    placeholderData: keepPreviousData,
    retry: false,
    enabled: !models.isError,
  });

  const apiStatus: ApiStatus = models.isError
    ? "offline"
    : models.isSuccess
      ? "online"
      : "connecting";

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 dark:bg-background">
      <SiteHeader
        model={model}
        groups={models.data?.groups ?? []}
        isLoading={tokens.isFetching}
        apiStatus={apiStatus}
        onModelChange={(update) => {
          setModel(update);
          if (isChatModel(update) !== isChatModel(model)) {
            setInputText("");
          }
        }}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 max-w-2xl lg:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Tokenizer playground
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            See exactly how GPT, Llama, Qwen, DeepSeek and other models split your
            text into tokens, and how many you're sending.
          </p>
        </div>

        {models.isError && (
          <Alert title="Can't reach the tokenizer API" className="mb-6">
            Make sure the FastAPI backend is running and that{" "}
            <code className="font-mono text-foreground">VITE_API_URL</code> points
            to it.
          </Alert>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <InputPanel
            model={model}
            isChat={isChatModel(model)}
            value={inputText}
            onChange={setInputText}
          />
          <OutputPanel
            text={inputText}
            data={tokens.isError ? undefined : tokens.data}
            isFetching={tokens.isFetching}
            error={tokens.isError && !models.isError ? tokens.error.message : null}
          />
        </div>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p>© {new Date().getFullYear()} Brian Kerio. All rights reserved.</p>
            <p>
              Based on{" "}
              <a
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                href={REPO_URL}
              >
                Tiktokenizer
              </a>{" "}
              by dqbd.
            </p>
          </div>
          <SocialLinks />
        </div>
      </footer>
    </div>
  );
}
