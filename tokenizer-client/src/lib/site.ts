export type SocialId = "github" | "x" | "linkedin";

/** Social profiles shown in the header and footer. Leave `href` empty to hide one. */
export const SOCIAL_LINKS: { id: SocialId; label: string; href: string }[] = [
  { id: "github", label: "GitHub", href: "https://github.com/BKerio" },
  { id: "x", label: "X", href: "https://x.com/_briankerio" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/briankerio/" },
];

export const REPO_URL = "https://github.com/BKerio/tiktokenization";
