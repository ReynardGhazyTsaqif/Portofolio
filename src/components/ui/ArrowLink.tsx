import { TransitionLink } from "@/components/motion/PageTransition";

/** Text link with an underline that draws in on hover; uses the page curtain. */
export function ArrowLink({ href, children, label }: { href: string; children: React.ReactNode; label?: string }) {
  return (
    <TransitionLink href={href} label={label} className="group inline-flex items-center gap-2 text-[15px] font-semibold">
      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1.5px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-out-expo group-hover:bg-[length:100%_1.5px]">
        {children}
      </span>
      <svg viewBox="0 0 16 16" className="size-3.5 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <path d="M2 8h11M9 4l4 4-4 4" />
      </svg>
    </TransitionLink>
  );
}
