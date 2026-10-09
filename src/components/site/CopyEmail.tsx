"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { site } from "@/lib/site";

export function CopyEmail({ className = "" }: { className?: string }) {
  const { dict } = useI18n();
  const [status, setStatus] = useState<"idle" | "copied" | "selected">("idle");
  const addr = useRef<HTMLAnchorElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(site.email);
      setStatus("copied");
    } catch {
      const range = document.createRange();
      if (addr.current) range.selectNodeContents(addr.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      setStatus("selected");
    }
    window.setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${className}`}>
      <a ref={addr} href={`mailto:${site.email}`} className="text-[clamp(1.4rem,4vw,3rem)] font-extrabold tracking-[-0.035em] break-all decoration-moss decoration-2 underline-offset-[6px] hover:underline">
        {site.email}
      </a>
      <button type="button" onClick={copy} className="rounded-md border border-ink px-3 py-1.5 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-paper" aria-live="polite">
        {status === "copied" ? dict.footer.copied : status === "selected" ? dict.footer.selected : dict.footer.copy}
      </button>
    </div>
  );
}
