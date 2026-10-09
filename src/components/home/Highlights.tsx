import { SectionHead } from "@/components/ui/SectionHead";
import { Stagger } from "@/components/motion/Stagger";

type Item = { value: string; label: string; body: string };

/** Three proof points, each with one large figure. */
export function Highlights({ label, title, accent, items }: { label: string; title: string; accent: string; items: Item[] }) {
  return (
    <section className="gutter pb-[clamp(100px,13vw,190px)]">
      <SectionHead label={label} title={title} accent={accent} />
      <Stagger as="ul" className="mt-[clamp(48px,6vw,88px)] grid gap-x-[clamp(24px,4vw,64px)] gap-y-12 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.value} data-stagger className="border-t border-ink pt-6">
            <p className="accent text-[clamp(3rem,6vw,5.4rem)] leading-none">{item.value}</p>
            <p className="mt-6 text-[17px] font-bold tracking-[-0.01em]">{item.label}</p>
            <p className="mt-2 max-w-[34ch] text-muted">{item.body}</p>
          </li>
        ))}
      </Stagger>
    </section>
  );
}
