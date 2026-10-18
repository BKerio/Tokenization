import { useState } from "react";
import { Check, ChevronsUpDown, Cpu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ModelGroup } from "@/lib/api";
import { cn } from "@/lib/utils";

export function EncoderSelect(props: {
  value: string;
  groups: ModelGroup[];
  onChange: (value: string) => void;
  isLoading?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select model or encoding"
          className="h-10 w-full justify-between gap-2 px-3 sm:w-[300px]"
        >
          <span className="flex min-w-0 items-center gap-2">
            {props.isLoading ? (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground border-b-transparent" />
            ) : (
              <Cpu className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate font-mono text-[13px]">{props.value}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Search models and encodings..." />
          <CommandList>
            <CommandEmpty>No model or encoding found.</CommandEmpty>
            {props.groups.map((group, i) => (
              <div key={group.id}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup heading={group.label}>
                  {group.options.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => {
                        setOpen(false);
                        props.onChange(option);
                      }}
                      className="gap-2 font-mono text-[13px]"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          option === props.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{option}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
