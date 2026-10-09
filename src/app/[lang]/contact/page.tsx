import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary, getLocale } from "@/i18n/dictionary";
import { getProfile } from "@/lib/sanity/content";
import { t } from "@/lib/sanity/locale";
import { site } from "@/lib/site";
import { PageHeader } from "@/components/site/PageHeader";
import { CopyEmail } from "@/components/site/CopyEmail";
import { LocalClock } from "@/components/site/LocalClock";
import { Stagger } from "@/components/motion/Stagger";

export async function generateMetadata(): Promise<Metadata> {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const page = dict.pages.contact;
  return pageMetadata(lang, "/contact", `${page.title} ${page.accent}`, page.intro);
}

const handle = (href: string) => href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export default async function ContactPage() {
  const lang = await getLocale();
  const [dict, profile] = await Promise.all([getDictionary(), getProfile()]);
  const page = dict.pages.contact;
  const cv = profile?.resumeUrl || site.cv;

  return (
    <>
      <PageHeader title={page.title} accent={page.accent} intro={page.intro} />
      <section className="gutter pb-[clamp(110px,14vw,200px)]">
        <p className="text-[13px] font-semibold text-muted">{page.emailLabel}</p>
        <CopyEmail className="mt-2" />
        <p className="mt-4 max-w-[52ch] text-muted">{page.reply}</p>

        <Stagger className="mt-[clamp(56px,8vw,110px)] grid gap-x-[clamp(24px,4vw,56px)] gap-y-12 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div data-stagger>
            <h2 className="text-[13px] font-semibold text-muted">{page.channels}</h2>
            <ul className="mt-3 grid gap-2">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="group block">
                    <span className="font-bold transition-colors group-hover:text-moss">{s.label}</span>
                    <span className="block text-[14px] break-all text-muted">{handle(s.href)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div data-stagger>
            <h2 className="text-[13px] font-semibold text-muted">{page.availability}</h2>
            <p className="mt-3 flex items-center gap-2.5 font-bold">
              <span className="size-2.5 rounded-full bg-[#5da35a]" aria-hidden />
              {t(profile?.availabilityText, lang, dict.pages.about.glance.status)}
            </p>
          </div>
          <div data-stagger>
            <h2 className="text-[13px] font-semibold text-muted">{page.location}</h2>
            <p className="mt-3 font-bold">{page.locationValue}</p>
            <p className="mt-1 text-[15px] text-muted">
              {page.time}: <LocalClock place="" />
            </p>
          </div>
          <div data-stagger>
            <h2 className="text-[13px] font-semibold text-muted">CV</h2>
            <a href={cv} download className="mt-3 inline-block rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-paper transition-transform duration-300 hover:-translate-y-0.5">
              {page.cv}
            </a>
            <p className="mt-2 text-[14px] text-muted">{page.cvBody}</p>
          </div>
        </Stagger>
      </section>
    </>
  );
}
