import { Stagger } from "@/components/motion/Stagger";

export type SkillGroup = { key: string; title: string; items: string[] };

/** Skills grouped by area, as plain readable lists rather than logo walls. */
export function Skills({ groups, learning, learningLabel }: { groups: SkillGroup[]; learning: string[]; learningLabel: string }) {
  return (
    <>
      <Stagger className="mt-[clamp(40px,5vw,72px)] grid gap-x-[clamp(24px,4vw,56px)] gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g) => (
          <div key={g.key} data-stagger className="border-t border-ink pt-5">
            <h3 className="text-[15px] font-bold">{g.title}</h3>
            <ul className="mt-4 grid gap-1.5">
              {g.items.map((s) => (
                <li key={s} className="text-[clamp(1.15rem,1.6vw,1.4rem)] font-semibold tracking-[-0.015em]">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Stagger>
      {learning.length > 0 && (
        <p className="mt-12 text-[15px] text-muted">
          <span className="font-semibold text-ink">{learningLabel}:</span> {learning.join(", ")}
        </p>
      )}
    </>
  );
}
