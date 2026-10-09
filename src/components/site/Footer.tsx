import { getDictionary } from "@/i18n/dictionary";
import { site } from "@/lib/site";
import { CopyEmail } from "./CopyEmail";
import { CurrentYear, LocalClock } from "./LocalClock";

export async function Footer() {
  const dict = await getDictionary();

  return (
    <footer className="gutter border-t border-line bg-surface pt-[clamp(72px,10vw,140px)] pb-28 md:pb-10">
      <p className="max-w-[46ch] text-muted">{dict.footer.lead}</p>
      <CopyEmail className="mt-4" />
      {/* right padding keeps the row clear of the floating CV button */}
      <div className="mt-[clamp(56px,8vw,110px)] flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6 text-[14px] text-muted md:pr-44">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline-offset-4 hover:underline">
                {s.label}
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
  );
}
