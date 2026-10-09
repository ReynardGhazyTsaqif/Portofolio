import { Stagger } from "@/components/motion/Stagger";

export type EducationCard = {
  id: string;
  institution: string;
  degree: string;
  period: string;
  focus: string;
  gpa: string | null;
  gpaScale: string;
  courses: string[];
};

type Labels = { gpa: string; of: string; courses: string; focus: string };

/** One card per school: name and programme on the left, GPA as the large figure on the right. */
export function Education({ items, labels }: { items: EducationCard[]; labels: Labels }) {
  return (
    <Stagger className="mt-[clamp(40px,5vw,72px)] grid gap-6">
      {items.map((e) => (
        <article key={e.id} data-stagger className="grid gap-8 rounded-xl border border-line bg-surface p-[clamp(24px,3.5vw,48px)] md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-muted tabular-nums">{e.period}</p>
            <h3 className="mt-2 text-[clamp(1.8rem,3.6vw,3rem)] leading-[1] font-extrabold tracking-[-0.04em]">{e.institution}</h3>
            <p className="mt-2 font-serif text-[clamp(1.2rem,2vw,1.6rem)] text-muted italic">{e.degree}</p>
            {e.focus && (
              <p className="mt-5 text-[15px]">
                <span className="font-semibold">{labels.focus}:</span> {e.focus}
              </p>
            )}
            {e.courses.length > 0 && (
              <>
                <p className="mt-6 text-[13px] font-semibold text-muted">{labels.courses}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {e.courses.map((c) => (
                    <li key={c} className="rounded-full border border-line bg-paper px-3 py-1 text-[14px]">
                      {c}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {e.gpa && (
            <div className="self-start md:text-right">
              <p className="text-[13px] font-semibold text-muted">{labels.gpa}</p>
              <p className="accent text-[clamp(4rem,9vw,7.5rem)] leading-[0.9]">{e.gpa}</p>
              <p className="text-[14px] text-muted">
                {labels.of} {e.gpaScale}
              </p>
            </div>
          )}
        </article>
      ))}
    </Stagger>
  );
}
