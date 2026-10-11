import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import { getDictionary, getLocale } from "@/i18n/dictionary";
import { getPlayground } from "@/lib/sanity/content";
import { t } from "@/lib/sanity/locale";
import { projectImage } from "@/lib/projects";
import { PageHeader } from "@/components/site/PageHeader";
import { SectionHead } from "@/components/ui/SectionHead";
import { Stagger } from "@/components/motion/Stagger";
import { KMeansPalette } from "@/components/playground/KMeansPalette";
import { KnnClassifier } from "@/components/playground/KnnClassifier";
import { GradientDescent } from "@/components/playground/GradientDescent";

export async function generateMetadata(): Promise<Metadata> {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const page = dict.pages.playground;
  return pageMetadata(lang, "/playground", `${page.title}${page.accent}`, page.intro);
}

export default async function PlaygroundPage() {
  const lang = await getLocale();
  const [dict, items] = await Promise.all([getDictionary(), getPlayground()]);
  const page = dict.pages.playground;
  const km = page.kmeans;

  return (
    <>
      <PageHeader title={page.title} accent={page.accent} intro={page.intro} />

      <section className="gutter pb-[clamp(100px,13vw,180px)]">
        <SectionHead label={km.label} title={km.title} accent={km.accent} intro={km.intro} />
        <KMeansPalette labels={km} lang={lang} />
      </section>

      <section className="gutter pb-[clamp(100px,13vw,180px)]">
        <SectionHead label={page.knn.label} title={page.knn.title} accent={page.knn.accent} intro={page.knn.intro} />
        <KnnClassifier labels={page.knn} />
      </section>

      <section className="gutter pb-[clamp(100px,13vw,180px)]">
        <SectionHead label={page.regression.label} title={page.regression.title} accent={page.regression.accent} intro={page.regression.intro} />
        <GradientDescent labels={page.regression} lang={lang} />
      </section>

      <section className="gutter pb-[clamp(110px,14vw,200px)]">
        <h2 className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold tracking-[-0.03em]">{page.more}</h2>
        {items.length === 0 ? (
          <p className="mt-6 max-w-[52ch] rounded-lg border border-dashed border-line bg-surface px-6 py-6 text-muted">{page.moreEmpty}</p>
        ) : (
          <Stagger as="ul" className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const title = t(item.title, lang);
              const cover = projectImage(item.cover, title, 900);
              const body = (
                <>
                  {cover && <Image src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} sizes="(min-width: 1024px) 33vw, 100vw" className="mb-5 aspect-[16/10] w-full rounded-lg object-cover" />}
                  <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-[12px] font-semibold text-muted">{page.status[item.status ?? "idea"]}</span>
                  <h3 className="mt-3 text-[1.35rem] leading-snug font-extrabold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 text-[15px] text-muted">{t(item.summary, lang)}</p>
                  {item.tags && item.tags.length > 0 && <p className="mt-4 text-[13px] text-muted">{item.tags.join(", ")}</p>}
                </>
              );
              return (
                <li key={item._id} data-stagger className="rounded-xl border border-line bg-surface p-6">
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="block hover:[&_h3]:text-moss">
                      {body}
                    </a>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </Stagger>
        )}
      </section>
    </>
  );
}
