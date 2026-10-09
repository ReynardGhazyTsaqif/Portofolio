import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary, getLocale } from "@/i18n/dictionary";
import { localePath } from "@/i18n/config";
import { getProject, getProjects, staticSlugs } from "@/lib/sanity/content";
import { imageUrl } from "@/lib/sanity/client";
import { paragraphs, t } from "@/lib/sanity/locale";
import { projectImage, projectTitle } from "@/lib/projects";
import { Reveal } from "@/components/motion/Reveal";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { Stagger } from "@/components/motion/Stagger";
import { TransitionLink } from "@/components/motion/PageTransition";
import { RichText } from "@/components/work/RichText";

export async function generateStaticParams() {
  return staticSlugs((await getProjects()).map((p) => p.slug));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [lang, project] = await Promise.all([getLocale(), getProject(slug)]);
  if (!project) return {};
  const image = imageUrl(project.image, 1200);
  return {
    title: projectTitle(project.title),
    description: t(project.summary, lang, project.description ?? undefined),
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-x-[clamp(24px,5vw,96px)] gap-y-5 border-t border-line py-[clamp(48px,6vw,88px)] lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      <h2 className="text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight font-extrabold tracking-[-0.03em] lg:sticky lg:top-28 lg:self-start">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Pending({ text }: { text: string }) {
  return <p className="max-w-[56ch] rounded-lg border border-dashed border-line bg-surface px-5 py-4 text-muted italic">{text}</p>;
}

export default async function CaseStudyPage({ params }: PageProps<"/[lang]/work/[slug]">) {
  const { slug } = await params;
  const lang = await getLocale();
  const [dict, project, all] = await Promise.all([getDictionary(), getProject(slug), getProjects()]);
  if (!project) notFound();

  const copy = dict.pages.work.case;
  const title = projectTitle(project.title);
  const client = project.title.includes("—") ? project.title.split("—").slice(1).join("—").trim() : null;
  const categories = (project.categories ?? []).map((c) => dict.categories[c]).join(" / ");
  const cover = projectImage(project.image, title, 2000);
  const prose = (field: Parameters<typeof paragraphs>[0]) => paragraphs(field, lang);

  const problem = prose(project.problem);
  const contribution = prose(project.contribution);
  const decisions = (project.decisions?.[lang]?.length ? project.decisions[lang] : project.decisions?.en) ?? [];
  const outcome = prose(project.outcome);
  const metrics = project.metrics ?? [];
  const gallery = (project.gallery ?? []).map((g) => projectImage(g, g.caption || title, 1600)).filter((g) => g !== null);

  const index = all.findIndex((p) => p.slug === project.slug);
  const next = all.length > 1 ? all[(index + 1) % all.length] : null;
  const live = project.liveUrl ?? (project.link && !project.link.includes("github.com") && !project.link.includes("colab") ? project.link : null);
  const repo = project.repoUrl ?? (project.link && project.link !== live ? project.link : null);

  return (
    <article>
      <header className="gutter pt-[calc(128px+env(safe-area-inset-top))]">
        <TransitionLink href={localePath(lang, "/work")} label={dict.nav.work} className="inline-flex items-center gap-2 text-[14px] font-semibold text-muted transition-colors hover:text-ink">
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M14 8H3M7 4 3 8l4 4" />
          </svg>
          {copy.back}
        </TransitionLink>
        <p className="mt-10 font-serif text-[clamp(1.2rem,2vw,1.6rem)] text-moss italic">
          {[categories, client].filter(Boolean).join(", ")}
        </p>
        <Reveal as="h1" delay={0.2} className="mt-2 max-w-[18ch] text-[clamp(2.8rem,8vw,7.5rem)] leading-[0.92] font-extrabold tracking-[-0.05em]">
          {title}
        </Reveal>
        <Reveal as="p" delay={0.45} className="mt-6 max-w-[48ch] text-[clamp(1.1rem,1.6vw,1.35rem)] leading-snug text-muted">
          {t(project.summary, lang, project.description ?? copy.pending)}
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-6 md:grid-cols-4">
          <div data-stagger>
            <p className="text-[13px] font-semibold text-muted">{copy.role}</p>
            <p className="mt-1 font-semibold">{t(project.roleLocalized, lang, project.role ?? "—")}</p>
          </div>
          <div data-stagger>
            <p className="text-[13px] font-semibold text-muted">{copy.year}</p>
            <p className="mt-1 font-semibold tabular-nums">{project.year || "—"}</p>
          </div>
          <div data-stagger>
            <p className="text-[13px] font-semibold text-muted">{copy.stack}</p>
            <p className="mt-1 font-semibold">{(project.techStack ?? []).join(", ") || "—"}</p>
          </div>
          <div data-stagger>
            <p className="text-[13px] font-semibold text-muted">{copy.links}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
              {live && (
                <a href={live} target="_blank" rel="noopener noreferrer" className="underline decoration-moss underline-offset-4">
                  {copy.live}
                </a>
              )}
              {repo && (
                <a href={repo} target="_blank" rel="noopener noreferrer" className="underline decoration-moss underline-offset-4">
                  {copy.repo}
                </a>
              )}
              {!live && !repo && <span>—</span>}
            </div>
          </div>
        </Stagger>
      </header>

      {cover && (
        <ClipReveal delay={0.3} className="gutter mt-[clamp(40px,5vw,72px)]">
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <Image src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} priority sizes="100vw" className="w-full" />
          </div>
        </ClipReveal>
      )}

      <div className="gutter mt-[clamp(56px,8vw,120px)]">
        <Section title={copy.problem}>
          {problem.length ? <div className="grid max-w-[64ch] gap-4 text-[17px] text-muted">{problem.map((p, i) => <p key={i}>{p}</p>)}</div> : <Pending text={copy.pending} />}
        </Section>
        <Section title={copy.contribution}>
          {contribution.length ? <div className="grid max-w-[64ch] gap-4 text-[17px] text-muted">{contribution.map((p, i) => <p key={i}>{p}</p>)}</div> : <Pending text={copy.pending} />}
        </Section>
        <Section title={copy.decisions}>{decisions.length ? <RichText value={decisions} /> : <Pending text={copy.pending} />}</Section>
        <Section title={copy.outcome}>
          {outcome.length ? <div className="grid max-w-[64ch] gap-4 text-[17px] text-muted">{outcome.map((p, i) => <p key={i}>{p}</p>)}</div> : <Pending text={copy.pending} />}
        </Section>
        {metrics.length > 0 && (
          <Section title={copy.numbers}>
            <Stagger as="ul" className="grid gap-8 sm:grid-cols-2">
              {metrics.map((m, i) => (
                <li key={i} data-stagger className="border-t border-ink pt-4">
                  <p className="accent text-[clamp(3rem,6vw,5rem)] leading-none">{m.value}</p>
                  <p className="mt-3 font-semibold">{t(m.label, lang)}</p>
                </li>
              ))}
            </Stagger>
          </Section>
        )}
        {gallery.length > 0 && (
          <Section title={copy.gallery}>
            <div className="grid gap-6 sm:grid-cols-2">
              {gallery.map((g, i) => (
                <ClipReveal key={i} className="overflow-hidden rounded-lg border border-line">
                  <Image src={g.src} width={g.width} height={g.height} alt={g.alt} sizes="(min-width: 1024px) 33vw, 100vw" className="w-full" />
                </ClipReveal>
              ))}
            </div>
          </Section>
        )}
      </div>

      {next && (
        <TransitionLink href={localePath(lang, `/work/${next.slug}`)} label={projectTitle(next.title)} className="group gutter mt-[clamp(40px,6vw,80px)] block border-t border-line py-[clamp(64px,10vw,140px)]">
          <p className="text-[14px] font-semibold text-muted">{copy.next}</p>
          <p className="mt-3 text-[clamp(2.4rem,7vw,6.5rem)] leading-[0.95] font-extrabold tracking-[-0.05em] transition-colors duration-500 group-hover:text-moss">
            {projectTitle(next.title)}
          </p>
        </TransitionLink>
      )}
    </article>
  );
}
