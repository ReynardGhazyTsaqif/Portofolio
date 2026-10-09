"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/lib/site";

const format = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: site.timeZone });

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
}

/** Current time in Padang (WIB, UTC+7). Renders a stable placeholder on the server. */
export function LocalClock({ place, className = "" }: { place: string; className?: string }) {
  const time = useSyncExternalStore(subscribe, () => format.format(new Date()), () => "--:--");
  return (
    <span className={`tabular-nums ${className}`}>
      {place} {time} WIB
    </span>
  );
}

export function CurrentYear() {
  return <>{useSyncExternalStore(() => () => {}, () => new Date().getFullYear(), () => 2026)}</>;
}
