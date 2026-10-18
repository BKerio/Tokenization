import { GithubIcon } from "@/components/icons/social";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { ModelGroup } from "@/lib/api";
import { REPO_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { EncoderSelect } from "@/sections/encoder-select";

export type ApiStatus = "connecting" | "online" | "offline";

const STATUS_STYLE: Record<ApiStatus, { dot: string; label: string }> = {
  connecting: { dot: "bg-amber-500 animate-pulse", label: "Connecting" },
  online: { dot: "bg-emerald-500", label: "FastAPI online" },
  offline: { dot: "bg-destructive", label: "FastAPI offline" },
};

export function SiteHeader(props: {
  model: string;
  groups: ModelGroup[];
  isLoading: boolean;
  apiStatus: ApiStatus;
  onModelChange: (model: string) => void;
}) {
  const status = STATUS_STYLE[props.apiStatus];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4 sm:min-h-[88px] sm:px-6">
        <a
          href="/"
          aria-label="Tiktokenizer home"
          className="mr-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Logo />
        </a>

        <div
          className="hidden items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground md:flex"
          role="status"
        >
          <span className={cn("h-2 w-2 rounded-full", status.dot)} />
          {status.label}
        </div>

        <div className="order-last w-full sm:order-none sm:w-auto">
          <EncoderSelect
            value={props.model}
            groups={props.groups}
            isLoading={props.isLoading}
            onChange={props.onModelChange}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" asChild>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="View source on GitHub"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
