import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionary";
import { getAchievements, getCertificates, getEducation, getExperience, getProfile, getTechnologies } from "@/lib/sanity/content";
import { imageUrl } from "@/lib/sanity/client";
import { formatMonth, formatRange, paragraphs, t } from "@/lib/sanity/locale";
import type { Technology } from "@/lib/sanity/types";
import { PageHeader } from "@/components/site/PageHeader";
import { SectionHead } from "@/components/ui/SectionHead";
import { QuickGlance } from "@/components/about/QuickGlance";
import { Timeline, type TimelineItem } from "@/components/about/Timeline";
import { Education, type EducationCard } from "@/components/about/Education";
import { Achievements, type AchievementCard, type CertificateCard } from "@/components/about/Achievements";
import { Skills, type SkillGroup } from "@/components/about/Skills";

export async function generateMetadata(): Promise<Metadata> {
  const page = (await getDictionary()).pages.about;
  return { title: `${page.title} ${page.accent}`, description: page.intro };
}

// Used until technologies get a category in Sanity (see studio/migrations/v2-content.mjs).
const GUESS: Record<string, Technology["category"]> = {
  react: "web", laravel: "web", tailwind: "web", javascript: "web", typescript: "web", php: "web", next: "web", inertia: "web", html: "web", css: "web",
  python: "ai", tensorflow: "ai", "scikit-learn": "ai", opencv: "ai", keras: "ai", pytorch: "ai",
  pandas: "data", numpy: "data", mysql: "data", postgresql: "data", jupyter: "data",
  git: "tools", github: "tools", docker: "tools", figma: "tools", linux: "tools", postman: "tools", vercel: "tools",
};
const categoryOf = (tech: Technology) => tech.category ?? GUESS[tech.name.toLowerCase().split(/[ .]/)[0]] ?? "tools";

const FALLBACK_COURSES = {
  en: ["Web Programming", "Artificial Intelligence", "Machine Learning", "Data Visualization", "Data Science"],
  id: ["Pemrograman Web", "Kecerdasan Buatan", "Pembelajaran Mesin", "Visualisasi Data", "Sains Data"],
};

export default async function AboutPage() {
  const lang = await getLocale();
  const [dict, profile, experience, education, achievements, certificates, technologies] = await Promise.all([
    getDictionary(), getProfile(), getExperience(), getEducation(), getAchievements(), getCertificates(), getTechnologies(),
  ]);
  const page = dict.pages.about;

  const timeline: TimelineItem[] = experience.map((e) => {
    const highlights = (e.highlights ?? []).map((h) => t(h, lang)).filter(Boolean);
    return {
      id: e._id,
      range: formatRange(e.startDate, e.endDate, lang) || page.education.pending,
      kind: e.kind ? dict.kinds[e.kind] : null,
      org: e.company,
      role: t(e.roleLocalized, lang, e.role),
      highlights: highlights.length ? highlights : [t(e.summary, lang, e.description ?? "")].filter(Boolean),
      tags: e.tags ?? [],
    };
  });

  const schools: EducationCard[] = education.length
    ? education.map((e) => ({
        id: e._id,
        institution: e.institution,
        degree: t(e.degree, lang),
        period: formatRange(e.startDate, e.endDate, lang) || t(e.expected, lang) || page.education.pending,
        focus: t(e.focus, lang),
        gpa: e.gpa,
        gpaScale: e.gpaScale ?? "4.00",
        courses: (e.courses ?? []).map((c) => t(c, lang)).filter(Boolean),
      }))
    : [{
        id: "unand",
        institution: "Universitas Andalas",
        degree: lang === "id" ? "S1 Informatika" : "Bachelor of Informatics",
        period: page.education.pending,
        focus: lang === "id" ? "Kecerdasan buatan dan sains data" : "Artificial intelligence and data science",
        gpa: "3.97",
        gpaScale: "4.00",
        courses: FALLBACK_COURSES[lang],
      }];

  const lidm = dict.home.highlights.items[0];
  const awards: AchievementCard[] = achievements.length
    ? achievements.map((a) => ({ id: a._id, event: a.event ?? "", title: t(a.title, lang), summary: t(a.summary, lang), date: formatMonth(a.date, lang), link: a.link }))
    : [{ id: "lidm", event: lidm.value, title: lidm.label, summary: lidm.body, date: "", link: null }];

  const certs: CertificateCard[] = certificates.map((c) => ({ id: c._id, title: c.title, issuer: c.issuer ?? "", date: formatMonth(c.issueDate, lang), link: c.credentialUrl }));

  const groups: SkillGroup[] = (["web", "ai", "data", "tools"] as const)
    .map((key) => ({ key, title: page.skills.groups[key], items: technologies.filter((tech) => !tech.learning && categoryOf(tech) === key).map((tech) => tech.name) }))
    .filter((g) => g.items.length > 0);
  const learning = technologies.filter((tech) => tech.learning).map((tech) => tech.name);

  const titles = (profile?.titles ?? []).map((x) => t(x, lang)).filter(Boolean);

  return (
    <>
      <PageHeader title={page.title} accent={page.accent} intro={page.intro} />
      <QuickGlance
        label={page.glance.label}
        title={page.glance.title}
        accent={page.glance.accent}
        paragraphs={paragraphs(profile?.about, lang, page.glance.bio)}
        titles={titles.length ? titles : ["Web Developer", "AI Engineer", "Data Scientist"]}
        status={t(profile?.availabilityText, lang, page.glance.status)}
        based={page.glance.based}
        clock={dict.clock}
        portrait={{ src: imageUrl(profile?.aboutImage, 900) || "/ReyAbout.jpg", alt: page.glance.portraitAlt }}
      />

      <section className="border-y border-line bg-surface py-[clamp(100px,13vw,190px)]">
        <div className="gutter">
          <SectionHead label={page.experience.label} title={page.experience.title} accent={page.experience.accent} intro={page.experience.intro} align="center" />
          <Timeline items={timeline} />
        </div>
      </section>

      <section className="gutter py-[clamp(100px,13vw,190px)]">
        <SectionHead label={page.education.label} title={page.education.title} accent={page.education.accent} />
        <Education items={schools} labels={page.education} />
      </section>

      <section className="gutter pb-[clamp(100px,13vw,190px)]">
        <SectionHead label={page.achievements.label} title={page.achievements.title} accent={page.achievements.accent} />
        <Achievements achievements={awards} certificates={certs} labels={page.achievements} />
      </section>

      <section className="gutter pb-[clamp(110px,14vw,200px)]">
        <SectionHead label={page.skills.label} title={page.skills.title} accent={page.skills.accent} />
        <Skills groups={groups} learning={learning} learningLabel={page.skills.learning} />
      </section>
    </>
  );
}
