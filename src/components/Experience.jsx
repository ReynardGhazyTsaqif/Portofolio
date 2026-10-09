import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";
import { useExperience } from "../lib/content";
import SectionStatus from "./SectionStatus";

const Experience = () => {
  const min_height = 400;
  const containerRef = useRef(null);
  const [active, setActive] = useState(0);
  const { status, data, retry } = useExperience();
  const experience = data ?? [];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const index = Math.min(
      experience.length - 1,
      Math.floor(latest * experience.length)
    );
    setActive(index);
  });

  return (
    <section
      ref={containerRef}
      className="bg-white px-6 lg:px-12"
      style={{ minHeight: `${experience.length * min_height}px` }}
    >
      <div className="max-w-6xl mx-auto">

        {/* ─── Heading — di luar grid, tidak ikut sticky ───────────── */}
        <div className="pt-16 lg:pt-20 pb-10 lg:pb-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl rotate-45 text-black leading-none">↗</span>
            <h2 className="section-heading mb-0">Experience</h2>
          </div>
        </div>

        {(status !== "success" || experience.length === 0) && (
          <div className="pb-16">
            <SectionStatus status={status} label="experience" onRetry={retry} />
          </div>
        )}

        {/* ─── Layout grid — sama di mobile dan desktop ─────────────── */}
        <div className="grid grid-cols-4 lg:grid-cols-12 gap-6 lg:gap-12">

          {/* LEFT — Sticky Year Navigation */}
          <div className="col-span-1 lg:col-span-3 sticky top-24 h-fit self-start">
            <div className="space-y-4 lg:space-y-5 border-l border-black/10 pl-3 lg:pl-5">
              {experience.map((exp, i) => (
                <div
                  key={exp.id}
                  onClick={() =>
                    document
                      .querySelector(`[data-exp='${i}']`)
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className={`
                    text-[10px] lg:text-sm cursor-pointer transition-all duration-300 leading-snug font-poppins
                    ${active === i
                      ? "text-black font-semibold translate-x-1"
                      : "text-gray-400 hover:text-gray-600"
                    }
                  `}
                >
                  <span
                    className={`
                      inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5 align-middle shrink-0
                      transition-all duration-300
                      ${active === i ? "bg-black" : "bg-gray-300"}
                    `}
                  />
                  {/* Mobile: hanya tahun, desktop: full date */}
                  <span className="lg:hidden">
                    {exp.date.match(/\d{4}/)?.[0] ?? exp.date}
                  </span>
                  <span className="hidden lg:inline">{exp.date}</span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-6 lg:mt-10 h-0.5 bg-black/10 rounded-full overflow-hidden w-full lg:w-2/3">
              <motion.div
                className="h-full bg-black rounded-full origin-left"
                style={{ scaleX: scrollYProgress }}
              />
            </div>
          </div>

          {/* RIGHT — Stacked Sticky Cards */}
          <div className="col-span-3 lg:col-span-9 relative">
            {experience.map((exp, i) => {
              const isActive = active === i;

              return (
                <motion.div
                  key={exp.id}
                  data-exp={i}
                  animate={{
                    scale: isActive ? 1 : 0.95,
                    opacity: isActive ? 1 : 0.25,
                    filter: isActive ? "blur(0px)" : "blur(1px)",
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    position: "sticky",
                    top: `${80 + i * 10}px`,
                    marginBottom: "32px",
                    zIndex: i + 1,
                  }}
                >
                  <div
                    className={`
                      relative bg-white border border-black/10 rounded-2xl lg:rounded-3xl
                      p-5 sm:p-8 lg:p-12
                      transition-shadow duration-500
                      ${isActive ? "shadow-xl" : "shadow-none"}
                    `}
                  >
                    {/* Nomor */}
                    <span className="absolute top-4 right-4 lg:top-10 lg:right-12 text-3xl lg:text-5xl font-semibold text-black/5 select-none leading-none tracking-[-0.04em]">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Header */}
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div>
                        <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 font-poppins">
                          {exp.date}
                        </p>
                        <h3 className="text-lg sm:text-xl lg:text-3xl font-semibold mt-1.5 lg:mt-2 tracking-[-0.02em] leading-snug font-poppins">
                          {exp.title}
                        </h3>
                      </div>

                      {i === 0 && (
                        <span className="shrink-0 text-[9px] lg:text-[10px] px-2.5 py-1 lg:px-3 lg:py-1.5 bg-black text-white rounded-full font-medium tracking-[0.08em] uppercase mt-1">
                          Current
                        </span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="mt-4 mb-4 lg:mt-8 lg:mb-8 h-px bg-black/5" />

                    {/* Description */}
                    <p className="text-gray-600 text-xs sm:text-sm lg:text-base leading-relaxed lg:max-w-2xl font-poppins">
                      {exp.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 lg:gap-2 mt-4 lg:mt-8">
                      {(exp.tags ?? []).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] lg:text-[11px] font-medium px-2.5 py-1 lg:px-3 lg:py-1.5 bg-gray-100 text-gray-600 rounded-full uppercase tracking-[0.06em]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Experience;