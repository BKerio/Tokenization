import { useState } from "react";
import { Eraser, RotateCcw, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextArea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatEditor } from "@/sections/chat-editor";

const EXAMPLE_TEXT = `Many words map to one token, but some don't: indivisible.

Unicode characters like emojis may be split into many tokens containing the underlying bytes: 🤚🏾

Sequences of characters commonly found next to each other may be grouped together: 1234567890`;

export function InputPanel(props: {
  model: string;
  isChat: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  // Bumping the key remounts the chat editor, resetting its messages.
  const [chatKey, setChatKey] = useState(0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Input</CardTitle>
          <Badge variant="secondary">{props.isChat ? "Chat" : "Text"}</Badge>
        </div>

        <div className="flex items-center gap-1">
          {props.isChat ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground"
              onClick={() => setChatKey((k) => k + 1)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground"
                onClick={() => props.onChange(EXAMPLE_TEXT)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Example
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground"
                onClick={() => props.onChange("")}
                disabled={!props.value}
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {props.isChat && (
          <ChatEditor key={chatKey} model={props.model} onChange={props.onChange} />
        )}

        <div className="flex flex-1 flex-col gap-2">
          {props.isChat && (
            <label
              htmlFor="prompt-input"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Rendered prompt
            </label>
          )}
          <TextArea
            id="prompt-input"
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder="Type or paste text to tokenize…"
            spellCheck={false}
            aria-label="Text to tokenize"
            className={cn(
              "flex-1 resize-y bg-muted/30 p-4 font-mono text-[13px] leading-relaxed",
              props.isChat ? "min-h-[160px]" : "min-h-[320px]"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
