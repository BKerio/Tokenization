import { useCallback, useEffect, useRef, useState } from "react";

/** Copy text to the clipboard and expose a short-lived `copied` flag. */
export function useCopy(resetAfter = 1500) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeout.current), []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => setCopied(false), resetAfter);
      } catch {
        setCopied(false);
      }
    },
    [resetAfter]
  );

  return { copied, copy };
}
