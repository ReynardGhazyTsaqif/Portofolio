import { getDictionary, getLocale } from "@/i18n/dictionary";
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

  return (
    <>
      <HeroManinjau
        eyebrow={t(profile?.headline, lang, home.eyebrow)}
        oneLiner={t(profile?.oneLiner, lang, home.oneLiner)}
        place={home.place}
        replay={home.replay}
        scroll={home.scroll}
      />
      <Statement text={home.statement} />
      <Highlights label={home.highlights.label} title={home.highlights.title} accent={home.highlights.accent} items={highlights} />
      <WorkRail items={rail} labels={home.work} allHref={localePath(lang, "/work")}>
        <SectionHead label={home.work.label} title={home.work.title} accent={home.work.accent} intro={home.work.intro} />
      </WorkRail>
      <ExperiencePreview items={experience} lang={lang} dict={dict} href={localePath(lang, "/about")} />
      <NotesPreview posts={posts} lang={lang} dict={dict} />
    </>
  );
}
