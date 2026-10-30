"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { localePath } from "@/i18n/config";
import { navItems } from "@/lib/site";
import { useI18n } from "@/components/providers/I18nProvider";
import { TransitionLink } from "@/components/motion/PageTransition";
import { RouteWatcher, WithPathname } from "@/components/motion/Pathname";
import { RollText } from "@/components/ui/RollText";
import { ThemeToggle } from "./ThemeToggle";
import { LangSwitch } from "./LangSwitch";
import { LocalClock } from "./LocalClock";

export function Navbar() {
  const { lang, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);

  const links = navItems.map((item) => ({ ...item, href: localePath(lang, item.path), label: dict.nav[item.key] }));
  const isActive = (pathname: string, href: string, path: string) =>
    path === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const home = localePath(lang);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  const closeMenu = useCallback(() => setOpen(false), []);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const el = header.current!;
    gsap.fromTo(el, { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, ease: "expo.out", delay: 0.2 });

    // Slips away while reading down the page and comes back the moment you scroll up.
    let hidden = false;
    const show = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      gsap.to(el, next ? { yPercent: -110, duration: 0.5, ease: "power3.in", overwrite: "auto" } : { yPercent: 0, opacity: 1, duration: 0.8, ease: "expo.out", overwrite: "auto" });
    };
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => show(self.direction === 1 && self.scroll() > 320 && !openRef.current),
    });
    // keyboard users always see where focus went
    const onFocus = () => show(false);
    el.addEventListener("focusin", onFocus);
    return () => el.removeEventListener("focusin", onFocus);
  });

  useGSAP(
    () => {
      const el = menu.current;
      if (!el) return;
      const reduce = prefersReducedMotion();
      if (open) {
        gsap.set(el, { display: "flex" });
        gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: reduce ? 0 : 0.7, ease: "expo.inOut" });
        gsap.fromTo(el.querySelectorAll("[data-item]"), { yPercent: 110 }, { yPercent: 0, duration: reduce ? 0 : 0.9, ease: "expo.out", stagger: 0.05, delay: reduce ? 0 : 0.25 });
      } else if (el.style.display === "flex") {
        gsap.to(el, { clipPath: "inset(0 0 100% 0)", duration: reduce ? 0 : 0.6, ease: "expo.inOut", onComplete: () => gsap.set(el, { display: "none" }) });
      }
    },
    { dependencies: [open] },
  );

  useEffect(() => {
    openRef.current = open;
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        ref={header}
        data-env-flip
        className={`fixed inset-x-0 top-0 z-[70] pt-[env(safe-area-inset-top)] text-ink transition-[background-color,border-color] duration-500 ${
          scrolled && !open ? "border-b border-line bg-paper/95" : "border-b border-transparent"
        }`}
      >
        <div className="gutter flex h-16 items-center justify-between gap-4 md:h-[72px]">
          <TransitionLink href={localePath(lang)} label={dict.nav.home} className="text-[19px] font-extrabold tracking-[-0.04em]">
            Reynard<span className="text-moss">.</span>
          </TransitionLink>

          <nav aria-label={dict.nav.main} className="hidden lg:block">
            <WithPathname fallback={home}>
              {(pathname) => (
            <ul className="flex items-center gap-1">
              {links.map((l) => {
                const active = isActive(pathname, l.href, l.path);
                return (
                  <li key={l.key}>
                    <TransitionLink
                      href={l.href}
                      label={l.label}
                      aria-current={active ? "page" : undefined}
                      className={`relative rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}
                    >
                      <RollText>{l.label}</RollText>
                      <span className={`absolute inset-x-3.5 -bottom-0.5 h-[1.5px] origin-left bg-moss transition-transform duration-500 ease-out-expo ${active ? "scale-x-100" : "scale-x-0"}`} />
                    </TransitionLink>
                  </li>
                );
              })}
            </ul>
              )}
            </WithPathname>
          </nav>

          <div className="flex items-center gap-2.5">
            <LocalClock place={dict.clock} className="mr-2 hidden text-[13px] text-muted xl:inline" />
            <WithPathname fallback={home}>{(pathname) => <LangSwitch pathname={pathname} />}</WithPathname>
            <ThemeToggle label={dict.nav.theme} />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              data-magnetic="0.3"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="ml-1 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper lg:hidden"
            >
              {open ? dict.nav.close : dict.nav.menu}
            </button>
          </div>
        </div>
      </header>

      <div
        ref={menu}
        id="mobile-menu"
        style={{ display: "none" }}
        className="gutter fixed inset-0 z-[65] flex-col justify-between bg-paper pt-28 pb-24 lg:hidden"
        data-lenis-prevent
      >
        <RouteWatcher onChange={closeMenu} />
        <nav aria-label={dict.nav.main}>
          <WithPathname fallback={home}>
            {(pathname) => (
          <ul className="grid gap-1">
            {links.map((l) => (
              <li key={l.key} className="overflow-hidden">
                <TransitionLink
                  href={l.href}
                  label={l.label}
                  data-item
                  aria-current={isActive(pathname, l.href, l.path) ? "page" : undefined}
                  className={`block font-serif text-[clamp(2.6rem,11vw,4.5rem)] leading-[1.05] italic ${isActive(pathname, l.href, l.path) ? "text-moss" : "text-ink"}`}
                >
                  {l.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
            )}
          </WithPathname>
        </nav>
        <LocalClock place={dict.clock} className="text-[14px] text-muted" />
      </div>
    </>
  );
}
