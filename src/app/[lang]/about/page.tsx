import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionary";
import { PageHeader, PhaseNote } from "@/components/site/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  const page = dict.pages.about;
  return { title: `${page.title} ${page.accent}`, description: page.intro };
}

export default async function Page() {
  const page = (await getDictionary()).pages.about;
  return (
    <>
      <PageHeader title={page.title} accent={page.accent} intro={page.intro} />
      <PhaseNote>{page.placeholder}</PhaseNote>
    </>
  );
}
