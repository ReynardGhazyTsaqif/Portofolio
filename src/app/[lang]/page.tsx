import { getDictionary, getLocale } from "@/i18n/dictionary";
import { getProfile } from "@/lib/sanity/content";
import { t } from "@/lib/sanity/locale";
import { HeroManinjau } from "@/components/hero/HeroManinjau";
import { PhaseNote } from "@/components/site/PageHeader";

export default async function HomePage() {
  const [lang, { home }, profile] = await Promise.all([getLocale(), getDictionary(), getProfile()]);

  return (
    <>
      <HeroManinjau
        eyebrow={t(profile?.headline, lang, home.eyebrow)}
        oneLiner={t(profile?.oneLiner, lang, home.oneLiner)}
        place={home.place}
        replay={home.replay}
        scroll={home.scroll}
      />
      <div className="pt-[clamp(80px,10vw,140px)]">
        <PhaseNote>{home.placeholder}</PhaseNote>
      </div>
    </>
  );
}
