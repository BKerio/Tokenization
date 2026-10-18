import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function Alert({
  title,
  children,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{title}</p>
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
    </div>
  );
}
