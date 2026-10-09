import { Reveal } from "@/components/motion/Reveal";

type Props = { label: string; title: string; accent: string; intro?: string; action?: React.ReactNode; align?: "left" | "center" };

/** Section opener: small moss label, big title with one serif-italic word, optional intro and link. */
export function SectionHead({ label, title, accent, intro, action, align = "left" }: Props) {
  const center = align === "center";
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-10 gap-y-6 ${center ? "flex-col items-center text-center" : ""}`}>
      <div className={center ? "flex flex-col items-center" : ""}>
        <p className="inline-flex items-center gap-2.5 text-[14px] font-semibold text-moss">
          <span className="size-1.5 rounded-full bg-moss" aria-hidden />
          {label}
        </p>
        <Reveal as="h2" delay={0.1} className="mt-4 text-[clamp(2.6rem,7vw,6.2rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
          {title} <span className="accent">{accent}</span>
        </Reveal>
        {intro && <p className={`mt-5 max-w-[46ch] text-muted ${center ? "mx-auto" : ""}`}>{intro}</p>}
      </div>
      {action}
    </div>
  );
}
