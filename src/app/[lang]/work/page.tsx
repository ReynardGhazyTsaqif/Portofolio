import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary, getLocale } from "@/i18n/dictionary";
import { getProjects } from "@/lib/sanity/content";
import { projectView } from "@/lib/projects";
import { PageHeader } from "@/components/site/PageHeader";
import { ProjectGrid } from "@/components/work/ProjectGrid";

export async function generateMetadata(): Promise<Metadata> {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const page = dict.pages.work;
  return pageMetadata(lang, "/work", `${page.title} ${page.accent}`, page.intro);
}

export default async function WorkPage() {
  const lang = await getLocale();
  const [dict, projects] = await Promise.all([getDictionary(), getProjects()]);
  const page = dict.pages.work;

  return (
    <>
      <PageHeader title={page.title} accent={page.accent} intro={page.intro} />
      <ProjectGrid items={projects.map((p) => projectView(p, lang, dict))} labels={page} />
    </>
  );
}
