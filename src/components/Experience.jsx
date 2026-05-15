import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";
import { experience } from "../data/experience";

const Experience = () => {
  const containerRef = useRef(null);
  const [active, setActive] = useState(0);

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
    /*
      FIX: tinggi section = jumlah item * 100vh agar setiap card
      punya "ruang scroll" sendiri untuk efek sticky bekerja.
    */
    <section
      ref={containerRef}
      className="bg-white px-6"
      style={{ minHeight: `${experience.length * 100}vh` }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-12 pt-40">

        {/* LEFT — Sticky Year Navigation */}
        <div className="col-span-3 sticky top-28 h-fit self-start">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-2xl rotate-45 text-black leading-none">↗</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-black font-poppins">
              Experience
            </h2>
          </div>

          <div className="space-y-5 border-l border-black/10 pl-5">
            {experience.map((exp, i) => (
              <div
                key={i}
                onClick={() =>
                  document
                    .querySelector(`[data-exp='${i}']`)
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className={`
                  text-sm cursor-pointer transition-all duration-300 leading-snug
                  ${active === i
                    ? "text-black font-semibold translate-x-1"
                    : "text-gray-400 hover:text-gray-600"
                  }
                `}
              >
                {/* Titik aktif */}
                <span
                  className={`
                    inline-block w-1.5 h-1.5 rounded-full mr-2 mb-0.5 align-middle
                    transition-all duration-300
                    ${active === i ? "bg-black" : "bg-gray-300"}
                  `}
                />
                {exp.date}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-10 h-0.5 bg-black/10 rounded-full overflow-hidden w-2/3">
            <motion.div
              className="h-full bg-black rounded-full origin-left"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
        </div>

        {/* RIGHT — Stacked Sticky Cards */}
        <div className="col-span-9 relative">
          {experience.map((exp, i) => {
            const isActive = active === i;

            return (
              <motion.div
                key={i}
                data-exp={i}
                animate={{
                  scale: isActive ? 1 : 0.93,
                  opacity: isActive ? 1 : 0.2,
                  filter: isActive ? "blur(0px)" : "blur(1.5px)",
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                /*
                  FIX: sticky di dalam kolom kanan.
                  top offset berbeda tiap card agar tidak tumpang tindih persis
                  — efek stack yang terasa "bergerak naik".
                */
                style={{
                  position: "sticky",
                  top: `${112 + i * 12}px`,
                  marginBottom: "40px",
                  zIndex: i + 1,
                }}
              >
                <div
                  className={`
                    relative bg-white border border-black/10 rounded-3xl p-12
                    transition-shadow duration-500
                    ${isActive ? "shadow-xl" : "shadow-none"}
                  `}
                >
                  {/* Nomor */}
                  <span className="absolute top-10 right-12 text-5xl font-semibold text-black/5 select-none leading-none tracking-[-0.04em]">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                        {exp.date}
                      </p>
                      <h3 className="text-2xl md:text-3xl font-semibold mt-2 tracking-[-0.02em] leading-snug max-w-lg">
                        {exp.title}
                      </h3>
                    </div>

                    {/* Badge "Current" hanya untuk item pertama */}
                    {i === 0 && (
                      <span className="shrink-0 text-[10px] px-3 py-1.5 bg-black text-white rounded-full font-medium tracking-[0.08em] uppercase mt-1">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="mt-8 mb-8 h-px bg-black/5" />

                  {/* Description */}
                  <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
                    {exp.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-8">
                    {exp.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full uppercase tracking-[0.06em]"
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
    </section>
  );
};

export default Experience;