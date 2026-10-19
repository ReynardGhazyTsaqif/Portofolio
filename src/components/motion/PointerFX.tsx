"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useI18n } from "@/components/providers/I18nProvider";

/*
 * Pointer interactions for mouse and trackpad users, wired once for the whole site by event delegation,
 * so server-rendered markup only needs a data attribute:
 *   data-cursor="Label"  a moss pill with the label follows the pointer (empty value: the default label)
 *   data-magnetic="0.3"  the element leans toward the pointer by that share of the distance
 *   data-tilt="5"        the element tips toward the pointer by up to that many degrees
 * Touch devices and reduced motion get none of it; the native cursor always stays visible.
 */
export function PointerFX() {
  const { dict } = useI18n();
  const pill = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || prefersReducedMotion()) return;
    const el = pill.current!, label = text.current!;
    gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0 });

    const pillX = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3" });
    const pillY = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3" });
    let px = -100, py = -100, placed = false;
    let cursorEl: Element | null = null, magnetEl: HTMLElement | null = null, tiltEl: HTMLElement | null = null;
    // rest position of the magnet, measured without the pull it already has
    let magnetBox = { cx: 0, cy: 0, w: 1, h: 1 };
    let magnetTo: { x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null = null;
    let tiltTo: { x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null = null;

    function showPill(target: Element | null) {
      if (target === cursorEl) return;
      cursorEl = target;
      if (target) {
        label.textContent = target.getAttribute("data-cursor") || el.dataset.label || "";
        if (!placed) {
          gsap.set(el, { x: px, y: py });
          placed = true;
        }
        gsap.to(el, { scale: 1, opacity: 1, duration: 0.5, ease: "expo.out", overwrite: "auto" });
      } else {
        gsap.to(el, { scale: 0, opacity: 0, duration: 0.35, ease: "power3.in", overwrite: "auto" });
      }
    }

    function setMagnet(target: HTMLElement | null) {
      if (target === magnetEl) return;
      if (magnetEl) gsap.to(magnetEl, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
      magnetEl = target;
      magnetTo = null;
      if (!target) return;
      const r = target.getBoundingClientRect();
      const ox = Number(gsap.getProperty(target, "x")) || 0, oy = Number(gsap.getProperty(target, "y")) || 0;
      magnetBox = { cx: r.left - ox + r.width / 2, cy: r.top - oy + r.height / 2, w: r.width, h: r.height };
      magnetTo = { x: gsap.quickTo(target, "x", { duration: 0.6, ease: "power3" }), y: gsap.quickTo(target, "y", { duration: 0.6, ease: "power3" }) };
    }

    function setTilt(target: HTMLElement | null) {
      if (target === tiltEl) return;
      if (tiltEl) gsap.to(tiltEl, { rotationX: 0, rotationY: 0, duration: 1, ease: "expo.out", overwrite: "auto" });
      tiltEl = target;
      tiltTo = null;
      if (!target) return;
      gsap.set(target, { transformPerspective: 1000 });
      tiltTo = { x: gsap.quickTo(target, "rotationX", { duration: 0.8, ease: "power3" }), y: gsap.quickTo(target, "rotationY", { duration: 0.8, ease: "power3" }) };
    }

    function update(target: Element | null) {
      showPill(target?.closest("[data-cursor]") ?? null);
      setMagnet((target?.closest("[data-magnetic]") as HTMLElement | null) ?? null);
      setTilt((target?.closest("[data-tilt]") as HTMLElement | null) ?? null);

      if (magnetEl && magnetTo) {
        const pull = Number(magnetEl.dataset.magnetic) || 0.3;
        magnetTo.x((px - magnetBox.cx) * pull);
        magnetTo.y((py - magnetBox.cy) * pull);
      }
      if (tiltEl && tiltTo) {
        const r = tiltEl.getBoundingClientRect();
        const max = Number(tiltEl.dataset.tilt) || 5;
        tiltTo.x(-((py - r.top) / r.height - 0.5) * 2 * max);
        tiltTo.y(((px - r.left) / r.width - 0.5) * 2 * max);
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      px = e.clientX;
      py = e.clientY;
      pillX(px);
      pillY(py);
      update(e.target as Element);
    };
    // Content can slide under a still pointer (smooth scroll, the pinned work rail), so look again on scroll.
    let pending = false;
    const onScroll = () => {
      if (pending || px < 0) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (magnetEl) setMagnet(null); // its rest position moved with the page
        update(document.elementFromPoint(px, py));
      });
    };
    const onLeave = () => update(null);
    // A click on a link starts the page curtain; the pill shouldn't hang over it.
    const onDown = () => showPill(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(el);
      [magnetEl, tiltEl].forEach((t) => t && gsap.set(t, { clearProps: "transform" }));
    };
  }, []);

  return (
    <div
      ref={pill}
      aria-hidden
      data-label={dict.home.work.view}
      className="pointer-events-none fixed top-0 left-0 z-[85] flex h-12 min-w-12 items-center justify-center rounded-full bg-moss px-5 text-[13px] font-semibold whitespace-nowrap text-on-moss opacity-0 shadow-[0_14px_34px_-14px_rgba(29,34,27,0.55)]"
    >
      <span ref={text} />
    </div>
  );
}
