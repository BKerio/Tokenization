import logoDark from "@/assets/brand/logo-dark.png";
import logoLight from "@/assets/brand/logo.png";
import { cn } from "@/lib/utils";

const IMG_PROPS = {
  alt: "Tiktokenizer — Token counter for LLMs",
  draggable: false,
  width: 953,
  height: 240,
  className: "h-full w-auto select-none",
} as const;

/** Brand wordmark, swapped for a light-on-dark version in dark mode. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("block h-11 shrink-0 sm:h-14", className)}>
      <img src={logoLight} {...IMG_PROPS} className={cn(IMG_PROPS.className, "dark:hidden")} />
      <img
        src={logoDark}
        {...IMG_PROPS}
        aria-hidden
        alt=""
        className={cn(IMG_PROPS.className, "hidden dark:block")}
      />
    </span>
  );
}
