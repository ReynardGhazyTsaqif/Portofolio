"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";

type I18n = { lang: Locale; dict: Dictionary };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ lang, dict, children }: I18n & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ lang, dict }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
