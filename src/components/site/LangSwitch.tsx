"use client";

import Link from "next/link";
import { locales, switchLocalePath } from "@/i18n/config";
import { useI18n } from "@/components/providers/I18nProvider";

export function LangSwitch({ pathname }: { pathname: string }) {
  const { lang, dict } = useI18n();

  return (
    <div role="group" aria-label={dict.nav.language} className="flex items-center rounded-full border border-line p-0.5 text-[13px] font-semibold">
      {locales.map((l) => (
        <Link
          key={l}
          href={switchLocalePath(pathname, l)}
          hrefLang={l}
          scroll={false}
          aria-current={l === lang ? "true" : undefined}
          onClick={() => {
            document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
          }}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${l === lang ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
