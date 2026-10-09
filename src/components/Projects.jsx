import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects } from "../lib/content";
import SectionStatus from "./SectionStatus";

// ─── Desktop: direction-aware fill helper ───────────────────────────────────
function getEnterDirection(e, rect) {
  const top = e.clientY - rect.top;
  const bottom = rect.height - top;
  const left = e.clientX - rect.left;
  const right = rect.width - left;
  const min = Math.min(top, bottom, left, right);
  if (min === top) return "top";
  if (min === bottom) return "bottom";
  if (min === left) return "left";
  return "right";
}

// ─── Desktop: table row dengan hover fill + floating preview ────────────────
function ProjectRow({ project }) {
  const rowRef = useRef(null);
  const fillRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });

  const services = Array.isArray(project.services)
    ? project.services.join(", ")
    : project.services;

  const handleMouseEnter = useCallback((e) => {
    const rect = rowRef.current.getBoundingClientRect();
    const dir = getEnterDirection(e, rect);
    const fill = fillRef.current;

    fill.style.width = rect.width + "px";
    fill.style.height = rect.height + "px";
    fill.style.transition =
      "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease";

    if (dir === "top" || dir === "bottom") {
      fill.style.transformOrigin = dir;
      fill.style.transform = "scaleY(0)";
    } else {
      fill.style.transformOrigin = dir;
      fill.style.transform = "scaleX(0)";
    }

    fill.getBoundingClientRect();

    fill.style.transition =
      "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    if (dir === "top" || dir === "bottom") {
      fill.style.transform = "scaleY(1)";
    } else {
      fill.style.transform = "scaleX(1)";
    }

    setHovered(true);
  }, []);

  const handleMouseLeave = useCallback((e) => {
    const rect = rowRef.current.getBoundingClientRect();
    const dir = getEnterDirection(e, rect);
    const fill = fillRef.current;

    fill.style.transition =
      "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease";
    if (dir === "top" || dir === "bottom") {
      fill.style.transformOrigin = dir;
      fill.style.transform = "scaleY(0)";
    } else {
      fill.style.transformOrigin = dir;
      fill.style.transform = "scaleX(0)";
    }

    setHovered(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    setPreviewPos({ x: e.clientX + 24, y: e.clientY - 90 });
  }, []);

  const handleClick = () => {
    if (project.github) {
      window.open(project.github, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      {/* Floating Preview */}
      {hovered && (
        <div
          className="fixed z-[9999] w-[320px] bg-white p-2 overflow-hidden shadow-2xl pointer-events-none animate-[previewIn_0.25s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]"
          style={{ left: previewPos.x, top: previewPos.y }}
        >
          <div className=" overflow-hidden">
            {project.image ? (
              <img
                src={project.image}
                alt={project.name}
                className="w-full h-[150px] object-cover block"
              />
            ) : (
              <div className="w-full h-[150px] flex items-center justify-center bg-zinc-900 text-white/40 text-[11px] uppercase tracking-[0.1em]">
                Preview Coming Soon
              </div>
            )}
          </div>
        </div>
      )}

      <tr
        ref={rowRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="relative border-b border-black/10 cursor-pointer"
        style={{ overflow: "hidden" }}
      >
        <td
          className={`relative px-4 py-6 text-base font-semibold transition-colors duration-500 w-[35%] ${
            hovered ? "text-white" : "text-black"
          }`}
          style={{ zIndex: 2 }}
        >
          <div
            ref={fillRef}
            style={{
              position: "absolute",
              inset: 0,
              background: "#111",
              transform: "scaleY(0)",
              transformOrigin: "top",
              zIndex: -1,
              pointerEvents: "none",
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
              opacity: 0.95,
            }}
          />
          {project.name}
        </td>
        <td
          className={`relative px-4 py-6 text-sm transition-colors duration-500 w-[25%] ${
            hovered ? "text-white/70" : "text-gray-500"
          }`}
          style={{ zIndex: 2 }}
        >
          {project.role}
        </td>
        <td
          className={`relative px-4 py-6 text-sm transition-colors duration-500 w-[15%] ${
            hovered ? "text-white/70" : "text-gray-500"
          }`}
          style={{ zIndex: 2 }}
        >
          {project.year}
        </td>
        <td
          className={`relative px-4 py-6 text-sm transition-colors duration-500 w-[25%] ${
            hovered ? "text-white/70" : "text-gray-500"
          }`}
          style={{ zIndex: 2 }}
        >
          {services}
        </td>
      </tr>
    </>
  );
}

// ─── Mobile: card dengan gambar preview di dalam ─────────────────────────────
function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false);

  const services = Array.isArray(project.services)
    ? project.services.join(", ")
    : project.services;

  const handleClick = () => {
    if (project.github) {
      window.open(project.github, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border-b border-black/10 overflow-hidden"
    >
      {/* Row utama — tap untuk expand/collapse preview */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left py-5 flex items-center justify-between gap-4 group"
      >
        <div>
          <h3 className="text-base font-semibold text-black font-poppins">
            {project.name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 font-poppins">
            {project.role} · {project.year}
          </p>
        </div>

        {/* Ikon expand */}
        <motion.span
          animate={{ rotate: expanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xl text-gray-400 shrink-0 leading-none"
        >
          +
        </motion.span>
      </button>

      {/* Preview panel — expand saat di-tap */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="preview"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5 space-y-3">
              {/* Gambar preview */}
              <div className=" overflow-hidden">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-[180px] object-cover"
                  />
                ) : (
                  <div className="w-full h-[140px] flex items-center justify-center bg-zinc-100 text-gray-400 text-[11px] uppercase tracking-[0.1em] rounded-xl">
                    Preview Coming Soon
                  </div>
                )}
              </div>

              {/* Services */}
              <p className="text-xs text-gray-500 font-poppins">{services}</p>

              {/* CTA */}
              {project.github && (
                <button
                  onClick={handleClick}
                  className="
                    inline-flex items-center gap-1.5
                    text-[11px] font-semibold uppercase tracking-[0.1em]
                    px-4 py-2 rounded-full bg-black text-white
                    hover:bg-zinc-800 transition-colors duration-200
                    font-poppins
                  "
                >
                  View Source Code ↗
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Section utama ───────────────────────────────────────────────────────────
const Projects = () => {
  const { status, data, retry } = useProjects();
  const projects = data ?? [];
  const showStatus = status !== "success" || projects.length === 0;

  return (
    <>
      <style>{`
        @keyframes previewIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <section id="projects" className="section bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <div className="flex items-center gap-3 mb-10 lg:mb-12">
            <span className="text-2xl lg:text-3xl rotate-45 text-black leading-none">
              ↗
            </span>
            <h2 className="section-heading mb-0">Projects</h2>
          </div>

          {showStatus && (
            <SectionStatus status={status} label="projects" onRetry={retry} />
          )}

          {/* Mobile: expandable cards dengan preview */}
          <div className="md:hidden">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Desktop: tabel interaktif dengan hover fill */}
          <div
            className={`hidden ${showStatus ? "" : "md:block"} overflow-x-hidden`}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black/20">
                  {["Name", "Role", "Year", "Services"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 pb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
};

export default Projects;
