"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";

/*
 * With Cache Components, reading the URL outside <Suspense> blocks prerendering of the whole route.
 * These helpers keep each URL read in its own small boundary so the rest of the page stays static.
 */

function PathnameInner({ children }: { children: (pathname: string) => React.ReactNode }) {
  return <>{children(usePathname())}</>;
}

/** Render-prop access to the pathname; `fallback` is used while prerendering. */
export function WithPathname({ fallback, children }: { fallback: string; children: (pathname: string) => React.ReactNode }) {
  return (
    <Suspense fallback={children(fallback)}>
      <PathnameInner>{children}</PathnameInner>
    </Suspense>
  );
}

function WatcherInner({ onChange }: { onChange: (pathname: string) => void }) {
  const pathname = usePathname();
  useEffect(() => onChange(pathname), [pathname, onChange]);
  return null;
}

/** Calls `onChange` after mount and on every route change. */
export function RouteWatcher({ onChange }: { onChange: (pathname: string) => void }) {
  return (
    <Suspense fallback={null}>
      <WatcherInner onChange={onChange} />
    </Suspense>
  );
}
