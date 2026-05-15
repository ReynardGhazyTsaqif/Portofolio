import { useRef, useState, useCallback } from "react";
import { projects } from "../data/projects";

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

function ProjectRow({ project, index }) {
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

    // ✅ FIX: set lebar overlay = lebar row yang sebenarnya (bukan 100vw)
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

    fill.getBoundingClientRect(); // force reflow

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
          className="fixed z-[9999] w-[240px] overflow-hidden rounded-xl shadow-2xl pointer-events-none animate-[previewIn_0.25s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]"
          style={{ left: previewPos.x, top: previewPos.y }}
        >
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
          <div className="bg-white px-4 py-2 text-[11px] font-bold text-center uppercase tracking-[0.1em] text-black">
            View Case — {project.name}
          </div>
        </div>
      )}

      <tr
        ref={rowRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="relative border-b border-black/10 cursor-pointer 
    "
        style={{ overflow: "hidden" }}
      >
        {/*
          ✅ Overlay diletakkan di <td> pertama dengan position absolute.
          Lebar & tingginya di-set via JS saat mouseenter = ukuran row asli.
          Tidak pakai 100vw sehingga tidak ada horizontal scroll.
        */}
        <td
          className={`relative px-6 py-7 text-lg font-semibold transition-colors duration-500 w-[35%] ${
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

              // ✨ smoother rendering
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
              opacity: 0.95,
            }}
          />
          {project.name}
        </td>

        <td
          className={`relative px-6 py-7 text-sm transition-colors duration-500 w-[25%] ${
            hovered ? "text-white/70" : "text-gray-500"
          }`}
          style={{ zIndex: 2 }}
        >
          {project.role}
        </td>

        <td
          className={`relative px-6 py-7 text-sm transition-colors duration-500 w-[15%] ${
            hovered ? "text-white/70" : "text-gray-500"
          }`}
          style={{ zIndex: 2 }}
        >
          {project.year}
        </td>

        <td
          className={`relative px-6 py-7 text-sm transition-colors duration-500 w-[25%] ${
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

const Projects = () => {
  return (
    <>
      <style>{`
        @keyframes previewIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <section
        id="projects"
        className="min-h-screen bg-white px-6 md:px-12 lg:px-20 py-20"
      >
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <div className="flex items-center gap-3 mb-12">
            <span className="text-3xl rotate-45 text-black leading-none">
              ↗
            </span>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-[-0.04em] text-black font-poppins">
              Projects
            </h2>
          </div>

          {/* Table — overflow-hidden di sini juga sebagai backup */}
          <div className="overflow-x-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black/20">
                  {["Name", "Role", "Year", "Services"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-6 pb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <ProjectRow
                    key={project.name}
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
