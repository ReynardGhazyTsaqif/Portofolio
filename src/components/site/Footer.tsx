import { getDictionary } from "@/i18n/dictionary";
import { site } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import { RollText } from "@/components/ui/RollText";
import { CopyEmail } from "./CopyEmail";
import { CurrentYear, LocalClock } from "./LocalClock";

export async function Footer() {
  const dict = await getDictionary();

  return (
    <>
      {/* no copy here on purpose: the last stretch of the dive, where the water goes dark */}
      <div data-env-plunge aria-hidden className="env-plunge h-[clamp(320px,62vh,720px)]" />
      <footer className="env-floor dark gutter pt-[clamp(40px,6vw,80px)] pb-28 text-ink md:pb-10">
      <Reveal as="p" delay={0} className="max-w-[46ch] text-muted">
        {dict.footer.lead}
      </Reveal>
      <CopyEmail className="mt-4" />
      {/* right padding keeps the row clear of the floating CV button */}
      <div className="mt-[clamp(56px,8vw,110px)] flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6 text-[14px] text-muted md:pr-44">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink">
                <RollText>{s.label}</RollText>
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <LocalClock place={dict.clock} />
          <span>
            © <CurrentYear /> {dict.footer.rights}
          </span>
        </div>
      </div>
      </footer>
    </>
  );
}
