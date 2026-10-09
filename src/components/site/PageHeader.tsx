import { Reveal } from "@/components/motion/Reveal";

type PageHeaderProps = { title: string; accent: string; intro: string };

/** Big page title with one serif-italic word, followed by a short intro. */
export function PageHeader({ title, accent, intro }: PageHeaderProps) {
  return (
    <header className="gutter pt-[calc(140px+env(safe-area-inset-top))] pb-[clamp(40px,6vw,80px)]">
      <Reveal as="h1" className="text-[clamp(3.4rem,12vw,10.5rem)] leading-[0.92] font-extrabold tracking-[-0.05em]">
        {title} <span className="accent">{accent}</span>
      </Reveal>
      <Reveal as="p" delay={0.55} className="mt-6 max-w-[52ch] text-[clamp(1rem,1.4vw,1.15rem)] text-muted">
        {intro}
      </Reveal>
    </header>
  );
}

/** Marks a section that a later build phase fills in. */
export function PhaseNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="gutter pb-[clamp(80px,10vw,140px)]">
      <p className="rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center text-muted">{children}</p>
    </div>
  );
}
