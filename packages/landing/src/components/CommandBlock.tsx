import { useRef, useState } from "react";
import "./CommandBlock.css";

const COMMAND = "npm create rrstack@latest";

export function CommandBlock() {
  const [copied, setCopied] = useState(false);
  const checkRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(COMMAND);
    } catch {
      // Clipboard API unavailable (non-secure context, permissions) — the
      // command is still selectable text, so this is a quiet no-op.
    }
    setCopied(true);
    const check = checkRef.current;
    if (check) {
      check.setAttribute("data-state", "out");
      void check.offsetWidth;
      check.setAttribute("data-state", "in");
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="command-block">
      <span className="command-block__prompt" aria-hidden>
        $
      </span>
      <code className="command-block__text">{COMMAND}</code>
      <button
        type="button"
        className="command-block__copy"
        onClick={handleCopy}
        aria-label="Copy command"
      >
        <span className="command-block__copy-icon" data-hidden={copied || undefined}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect
              x="5.5"
              y="5.5"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M3 10V3.5A1.5 1.5 0 0 1 4.5 2H10"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span
          className="t-success-check command-block__check"
          data-state="out"
          ref={checkRef}
          aria-hidden="true"
        >
          <svg viewBox="0 0 16 16" fill="none" width="15" height="15" aria-hidden="true">
            <path
              d="M3 8.5 6.5 12 13 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={20}
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
