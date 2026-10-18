import { Fragment, useMemo, useState } from "react";
import { Check, Copy, MousePointerClick } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useCopy } from "@/hooks/use-copy";
import type { Segment, TokenizeResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

// Full class names so Tailwind can see them; each works in light and dark.
const COLORS = [
  "bg-sky-200 dark:bg-sky-500/30",
  "bg-amber-200 dark:bg-amber-500/30",
  "bg-emerald-200 dark:bg-emerald-500/30",
  "bg-rose-200 dark:bg-rose-500/30",
  "bg-violet-200 dark:bg-violet-500/30",
  "bg-lime-200 dark:bg-lime-500/30",
  "bg-orange-200 dark:bg-orange-500/30",
  "bg-cyan-200 dark:bg-cyan-500/30",
  "bg-fuchsia-200 dark:bg-fuchsia-500/30",
  "bg-teal-200 dark:bg-teal-500/30",
  "bg-indigo-200 dark:bg-indigo-500/30",
  "bg-yellow-200 dark:bg-yellow-500/30",
];

const colorFor = (idx: number) => COLORS[idx % COLORS.length];

const BLOCK_STYLE =
  "max-h-[360px] min-h-[160px] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-mono text-[13px] leading-7";

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function countCharacters(text: string) {
  return Array.from(graphemeSegmenter.segment(text)).length;
}

function encodeWhitespace(str: string) {
  let result = str;

  result = result.replaceAll(" ", "⋅");
  result = result.replaceAll("\t", "→");
  result = result.replaceAll("\f", "\\f\f");
  result = result.replaceAll("\b", "\\b\b");
  result = result.replaceAll("\v", "\\v\v");

  result = result.replaceAll("\r", "\\r\r");
  result = result.replaceAll("\n", "\\n\n");
  result = result.replaceAll("\\r\r\\n\n", "\\r\\n\r\n");

  return result;
}

function Stat(props: { label: string; value: string | number; emphasis?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{props.label}</p>
      <p
        className={cn(
          "mt-1 font-semibold tabular-nums tracking-tight",
          props.emphasis ? "text-3xl text-primary" : "text-2xl"
        )}
      >
        {props.value}
      </p>
    </div>
  );
}

function SectionLabel(props: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {props.children}
      </h3>
      {props.actions}
    </div>
  );
}

function HoverDetails({ segment, index }: { segment: Segment | undefined; index: number | null }) {
  if (!segment || index == null) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <MousePointerClick className="h-3.5 w-3.5" />
        Hover over text or a token ID to inspect it.
      </p>
    );
  }

  return (
    <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-muted-foreground">Segment {index + 1}</span>
      <code className={cn("rounded px-1.5 py-0.5 font-mono", colorFor(index))}>
        {encodeWhitespace(segment.text) || "∅"}
      </code>
      <span className="text-muted-foreground">
        {segment.tokens.length} {segment.tokens.length === 1 ? "token" : "tokens"}:
      </span>
      <span className="font-mono">{segment.tokens.map((t) => t.id).join(", ")}</span>
      {segment.special && <Badge variant="outline">added by tokenizer</Badge>}
    </p>
  );
}

export function OutputPanel(props: {
  text: string;
  data: TokenizeResponse | undefined;
  isFetching: boolean;
  error: string | null;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const { copied, copy } = useCopy();

  const segments = props.data?.segments ?? [];
  const tokenCount = props.data?.count ?? 0;
  const characters = useMemo(() => countCharacters(props.text), [props.text]);
  const ratio =
    tokenCount > 0 && characters > 0 ? (characters / tokenCount).toFixed(2) : "—";

  const hoverProps = (idx: number) => ({
    onMouseEnter: () => setHovered(idx),
    onMouseLeave: () => setHovered(null),
  });

  return (
    <Card className="relative flex flex-col overflow-hidden">
      {props.isFetching && (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden" aria-hidden>
          <div className="h-full w-1/3 animate-progress bg-primary" />
        </div>
      )}

      <CardHeader>
        <CardTitle>Output</CardTitle>
        {props.data && (
          <Badge variant="outline" className="font-mono">
            {props.data.name}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {props.error && <Alert title="Tokenization failed">{props.error}</Alert>}

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Tokens" value={tokenCount.toLocaleString()} emphasis />
          <Stat label="Characters" value={characters.toLocaleString()} />
          <Stat label="Chars / token" value={ratio} />
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel
            actions={
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={showWhitespace}
                  onCheckedChange={(v) => setShowWhitespace(v === true)}
                />
                Show whitespace
              </label>
            }
          >
            Tokenized text
          </SectionLabel>
          <pre className={cn(BLOCK_STYLE, "break-all", props.isFetching && "opacity-60")}>
            {tokenCount === 0 ? (
              <span className="font-sans text-muted-foreground">
                Tokens will appear here as you type.
              </span>
            ) : (
              segments.map(({ text, special }, idx) => (
                <span
                  key={idx}
                  {...hoverProps(idx)}
                  className={cn(
                    "rounded-[3px] transition-colors",
                    (hovered == null || hovered === idx) && colorFor(idx),
                    hovered === idx && "ring-2 ring-primary/60",
                    special && "italic opacity-70"
                  )}
                >
                  {showWhitespace || hovered === idx ? encodeWhitespace(text) : text}
                </span>
              ))
            )}
          </pre>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel
            actions={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground"
                disabled={tokenCount === 0}
                onClick={() => copy(JSON.stringify(props.data?.tokens ?? []))}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            }
          >
            Token IDs
          </SectionLabel>
          <pre className={cn(BLOCK_STYLE, "text-muted-foreground", props.isFetching && "opacity-60")}>
            {tokenCount === 0 ? (
              <span className="font-sans">No tokens yet.</span>
            ) : (
              segments.map((segment, segmentIdx) => (
                <Fragment key={segmentIdx}>
                  {segment.tokens.map((token) => (
                    <Fragment key={token.idx}>
                      <span
                        {...hoverProps(segmentIdx)}
                        className={cn(
                          "rounded-[3px] transition-colors",
                          hovered === segmentIdx && cn(colorFor(segmentIdx), "text-foreground")
                        )}
                      >
                        {token.id}
                      </span>
                      {token.idx < tokenCount - 1 && ", "}
                    </Fragment>
                  ))}
                </Fragment>
              ))
            )}
          </pre>
        </div>
      </CardContent>

      <div className="mt-auto border-t bg-muted/30 px-4 py-2.5 text-xs">
        <HoverDetails
          index={hovered}
          segment={hovered == null ? undefined : segments[hovered]}
        />
      </div>
    </Card>
  );
}
