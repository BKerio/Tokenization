import { useEffect, useRef, useState } from "react";
import { Plus, X as Close } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, TextArea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ChatMessage, getChatGPTEncoding } from "@/lib/chat";
import { cn } from "@/lib/utils";

const TEXT_COMMON_STYLE = cn(
  "col-[1] row-[1]",
  "flex h-full w-full rounded-md border py-2 px-3 text-sm leading-[22px]"
);

function AutosizingTextArea(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-1">
      <TextArea
        rows={1}
        placeholder={props.placeholder}
        className={cn("resize-none overflow-hidden", TEXT_COMMON_STYLE)}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {/* Invisible copy of the text that sizes the grid cell. */}
      <div
        aria-hidden
        className={cn("invisible whitespace-pre-wrap", TEXT_COMMON_STYLE)}
      >
        {props.value || props.placeholder}{" "}
      </div>
    </div>
  );
}

export function ChatEditor(props: {
  model: string;
  onChange: (value: string) => void;
}) {
  const [rows, setRows] = useState<ChatMessage[]>([
    { role: "system", content: "You are a helpful assistant", name: "" },
    { role: "user", content: "", name: "" },
  ]);

  const changeRef = useRef(props.onChange);
  useEffect(() => void (changeRef.current = props.onChange), [props.onChange]);
  useEffect(() => {
    changeRef.current(getChatGPTEncoding(rows, props.model));
  }, [props.model, rows]);

  const updateRow = (i: number, patch: Partial<ChatMessage>) =>
    setRows((rows) => rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div className="grid grid-cols-[min-content,1fr,auto] gap-2" key={i}>
          <Select value={row.role} onValueChange={(role) => updateRow(i, { role })}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="assistant">Assistant</SelectItem>
              <SelectSeparator />
              <SelectItem value="system-name">Custom</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-col gap-2">
            {row.role === "system-name" && (
              <Input
                value={row.name}
                placeholder="Name"
                onChange={(e) => updateRow(i, { name: e.target.value })}
              />
            )}

            <AutosizingTextArea
              value={row.content}
              placeholder="Content"
              onChange={(content) => updateRow(i, { content })}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remove message"
            onClick={() => setRows((rows) => rows.filter((_, j) => j !== i))}
          >
            <Close className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 self-start border-dashed"
        onClick={() =>
          setRows((rows) => {
            let role = "user";
            if (rows.length === 0) {
              role = "system";
            } else if (rows.at(-1)?.role === "user") {
              role = "assistant";
            }
            return [...rows, { role, content: "", name: "" }];
          })
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add message
      </Button>
    </div>
  );
}
