import { Rule, Stagger } from "@/components/motion/Stagger";

export type AchievementCard = { id: string; event: string; title: string; summary: string; date: string; link: string | null };
export type CertificateCard = { id: string; title: string; issuer: string; date: string; link: string | null };

type Labels = { certs: string; noCerts: string; view: string };

/** Achievements as large cards, certificates as a tidy list below. */
export function Achievements({ achievements, certificates, labels }: { achievements: AchievementCard[]; certificates: CertificateCard[]; labels: Labels }) {
  return (
    <>
      <Stagger className="mt-[clamp(40px,5vw,72px)] grid gap-6 md:grid-cols-2">
        {achievements.map((a) => (
          <article key={a.id} data-stagger data-tilt="4" className="flex flex-col justify-between gap-10 rounded-xl bg-ink p-[clamp(24px,3.5vw,44px)] text-paper">
            <div>
              {a.date && <p className="text-[14px] font-semibold opacity-60 tabular-nums">{a.date}</p>}
              <p className="mt-2 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.95] italic">{a.event}</p>
            </div>
            <div>
              <h3 className="text-[1.35rem] font-extrabold tracking-[-0.02em]">{a.title}</h3>
              {a.summary && <p className="mt-2 max-w-[46ch] opacity-70">{a.summary}</p>}
              {a.link && (
                <a href={a.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-[14px] font-semibold underline underline-offset-4">
                  {labels.view}
                </a>
              )}
            </div>
          </article>
        ))}
      </Stagger>

      <h3 className="mt-[clamp(48px,6vw,80px)] text-[13px] font-semibold text-muted">{labels.certs}</h3>
      {certificates.length === 0 ? (
        <p className="mt-3 max-w-[48ch] rounded-lg border border-dashed border-line bg-surface px-6 py-6 text-muted">{labels.noCerts}</p>
      ) : (
        <Stagger as="ul" className="mt-3 border-b border-line">
          {certificates.map((c) => (
            <li key={c.id} data-stagger className="relative grid gap-x-8 gap-y-1 py-5 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-baseline">
              <Rule />
              <p className="font-bold">{c.title}</p>
              <p className="text-[15px] text-muted">
                {c.issuer}
                {c.date && <span className="tabular-nums">, {c.date}</span>}
              </p>
              {c.link && (
                <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold underline-offset-4 hover:underline">
                  {labels.view}
                </a>
              )}
            </li>
          ))}
        </Stagger>
      )}
    </>
  );
}
