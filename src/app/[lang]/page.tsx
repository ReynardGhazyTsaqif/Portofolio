import { getDictionary } from "@/i18n/dictionary";
import { HeroManinjau } from "@/components/hero/HeroManinjau";
import { PhaseNote } from "@/components/site/PageHeader";

export default async function HomePage() {
  const { home } = await getDictionary();

  return (
    <>
      <HeroManinjau eyebrow={home.eyebrow} oneLiner={home.oneLiner} place={home.place} replay={home.replay} scroll={home.scroll} />
      <div className="pt-[clamp(80px,10vw,140px)]">
        <PhaseNote>{home.placeholder}</PhaseNote>
      </div>
    </>
  );
}
