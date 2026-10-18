import { GithubIcon, LinkedinIcon, XIcon } from "@/components/icons/social";
import { SOCIAL_LINKS, type SocialId } from "@/lib/site";
import { cn } from "@/lib/utils";

const ICONS: Record<SocialId, typeof GithubIcon> = {
  github: GithubIcon,
  x: XIcon,
  linkedin: LinkedinIcon,
};

export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {SOCIAL_LINKS.filter((link) => link.href).map(({ id, label, href }) => {
        const Icon = ICONS[id];
        return (
          <li key={id}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
