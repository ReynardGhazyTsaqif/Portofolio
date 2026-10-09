import { getDictionary, getLocale } from "@/i18n/dictionary";
import { localePath } from "@/i18n/config";
import { TransitionLink } from "@/components/motion/PageTransition";

export default async function NotFound() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <section className="gutter flex min-h-[80svh] flex-col justify-center pt-32 pb-20">
      <p className="text-[15px] font-semibold text-moss">404</p>
      <h1 className="mt-3 text-[clamp(2.8rem,8vw,6rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">{dict.notFound.title}</h1>
      <p className="mt-5 max-w-[44ch] text-muted">{dict.notFound.body}</p>
      <TransitionLink href={localePath(lang)} label={dict.nav.home} className="mt-8 self-start rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-paper">
        {dict.notFound.back}
      </TransitionLink>
    </section>
  );
}
