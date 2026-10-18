import * as React from "react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  default: "border-transparent bg-primary/10 text-primary",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "text-muted-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof VARIANTS }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
