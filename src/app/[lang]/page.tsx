import { getDictionary } from "@/i18n/dictionary";
import { Reveal } from "@/components/motion/Reveal";
import { PhaseNote } from "@/components/site/PageHeader";

export default async function HomePage() {
  const dict = await getDictionary();

  return (
    <>
      <section className="gutter flex min-h-[88svh] flex-col justify-end pt-32 pb-[clamp(48px,8vw,96px)]">
        <Reveal as="p" delay={0.2} className="text-[15px] font-semibold text-moss">
          {dict.home.eyebrow}
        </Reveal>
        <Reveal as="h1" delay={0.3} className="mt-4 text-[clamp(3.6rem,13vw,12rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
          Reynard <span className="accent">Ghazy</span> Tsaqif
        </Reveal>
        <Reveal as="p" delay={0.6} className="mt-8 max-w-[34ch] text-[clamp(1.25rem,2.4vw,2rem)] leading-snug font-medium tracking-[-0.02em]">
          {dict.home.oneLiner}
        </Reveal>
      </section>
      <PhaseNote>{dict.home.placeholder}</PhaseNote>
    </>
  );
}
