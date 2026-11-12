import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionary";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { localePath } from "@/i18n/config";
import { getAchievements, getEducation, getExperience, getPosts, getProfile, getProjects } from "@/lib/sanity/content";
import { projectView } from "@/lib/projects";
import { t } from "@/lib/sanity/locale";
import { HeroManinjau } from "@/components/hero/HeroManinjau";
import { Statement } from "@/components/home/Statement";
import { Highlights } from "@/components/home/Highlights";
import { WorkRail, type RailItem } from "@/components/home/WorkRail";
import { ExperiencePreview } from "@/components/home/ExperiencePreview";
import { NotesPreview } from "@/components/home/NotesPreview";
import { SectionHead } from "@/components/ui/SectionHead";
import { StoryWorld } from "@/components/story/StoryWorld";
import { StoryChapter } from "@/components/story/StoryChapter";

export async function generateMetadata(): Promise<Metadata> {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  return { ...pageMetadata(lang, "/", undefined, dict.meta.description), title: { absolute: `${dict.meta.title}, ${dict.home.eyebrow}` } };
}

export default async function HomePage() {
  const lang = await getLocale();
  const [dict, profile, projects, experience, education, achievements, posts] = await Promise.all([
    getDictionary(),
    getProfile(),
    getProjects(),
    getExperience(),
    getEducation(),
    getAchievements(),
    getPosts(lang),
  ]);
  const { home } = dict;

  // Highlights use Sanity data where it exists, otherwise the dictionary copy.
  const lidm = achievements.find((a) => a.featured);
  const edu = education.find((e) => e.gpa);
  const highlights = home.highlights.items.map((item, i) => {
    if (i === 0 && lidm) return { ...item, value: lidm.event || item.value, label: t(lidm.title, lang, item.label) };
    if (i === 2 && edu?.gpa) return { ...item, value: edu.gpa };
    return item;
  });

  const featured = [...projects].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, 6);
  const rail: RailItem[] = featured.map((p) => {
    const v = projectView(p, lang, dict);
    return { ...v, category: v.categoryLabel };
  });

  // Structured data so search engines can show who this site is about.
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    email: `mailto:${site.email}`,
    jobTitle: home.eyebrow,
    address: { "@type": "PostalAddress", addressLocality: "Padang", addressRegion: "West Sumatra", addressCountry: "ID" },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Universitas Andalas" },
    knowsAbout: ["Web development", "React", "Laravel", "Machine learning", "Data science"],
    sameAs: site.socials.map((s) => s.href),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <HeroManinjau
        eyebrow={t(profile?.headline, lang, home.eyebrow)}
        oneLiner={t(profile?.oneLiner, lang, home.oneLiner)}
        place={home.place}
        replay={home.replay}
        scroll={home.scroll}
      />
      <Statement text={home.statement} />
      <Highlights label={home.highlights.label} title={home.highlights.title} accent={home.highlights.accent} items={highlights} />
      {/* the 3D story: lake bed -> loss surface -> data -> laptop, and into its screen for the rest of the page */}
      <StoryWorld screen={{ title: home.work.title, accent: home.work.accent, label: home.work.label, nav: [dict.nav.home, dict.nav.about, dict.nav.work, dict.nav.notes, dict.nav.contact] }} />
      <StoryChapter kind="converge" label={home.story.converge.label} beats={home.story.converge.beats} />
      <WorkRail items={rail} labels={home.work} allHref={localePath(lang, "/work")}>
        <SectionHead label={home.work.label} title={home.work.title} accent={home.work.accent} intro={home.work.intro} />
      </WorkRail>
      <ExperiencePreview items={experience} lang={lang} dict={dict} href={localePath(lang, "/about")} />
      <NotesPreview posts={posts} lang={lang} dict={dict} />
      <StoryChapter kind="outro" label={home.story.outro.label} beats={home.story.outro.beats} />
    </>
  );
}
