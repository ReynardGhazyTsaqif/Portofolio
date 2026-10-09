// Query GROQ + adapter: data Sanity diubah ke bentuk yang sama dengan
// data lama di src/data/, sehingga markup komponen tidak berubah.
import { useSanityQuery } from "./useSanityQuery";
import { urlFor } from "./sanity";
import { getTechIcon } from "./techIcons";

import { projects as projectsData } from "../data/projects";
import { experience as experienceData } from "../data/experience";
import { technologies as technologiesData } from "../data/technologies";
import { personal, bio, stats as statsData } from "../data/personal";
import ReyImage from "../assets/Rey.png";
import ReyAbout from "../assets/ReyAbout.jpg";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-03-01" -> "Mar 2026" (tanpa Date() agar tidak bergeser karena timezone)
function formatMonth(iso) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function formatRange(start, end) {
  const from = formatMonth(start);
  if (!end) return `${from} – Present`;
  const to = formatMonth(end);
  return from === to ? from : `${from} – ${to}`;
}

// Urut berdasarkan "order"; jika sama/kosong, lanjut berdasarkan key (desc untuk tanggal).
const byOrder = (key, dir = "desc") => (a, b) =>
  (a.order ?? Infinity) - (b.order ?? Infinity) ||
  (dir === "desc" ? -1 : 1) *
    String(a[key] ?? "").localeCompare(String(b[key] ?? ""));

// ─── Projects ────────────────────────────────────────────────────────────────
const PROJECTS_QUERY = `*[_type == "project" && !(_id in path("drafts.**"))]{
  _id, title, role, date, link, techStack, order, image
}`;

const mapProjects = (rows) =>
  [...rows].sort(byOrder("date")).map((p) => ({
    id: p._id,
    name: p.title,
    role: p.role,
    year: p.date?.slice(0, 4) ?? "",
    services: p.techStack ?? [],
    github: p.link ?? "",
    image: p.image?.asset ? urlFor(p.image).width(720).url() : "",
  }));

const projectsFallback = projectsData.map((p) => ({
  ...p,
  id: p.name,
  image: p.image ? `/${p.image}` : "",
}));

export const useProjects = () =>
  useSanityQuery(PROJECTS_QUERY, { map: mapProjects, fallback: projectsFallback });

// ─── Experience ──────────────────────────────────────────────────────────────
const EXPERIENCE_QUERY = `*[_type == "experience" && !(_id in path("drafts.**"))]{
  _id, company, role, startDate, endDate, description, tags, order
}`;

const mapExperience = (rows) =>
  [...rows].sort(byOrder("startDate")).map((e) => ({
    id: e._id,
    title: [e.role, e.company].filter(Boolean).join(" — "),
    date: formatRange(e.startDate, e.endDate),
    description: e.description ?? "",
    tags: e.tags ?? [],
  }));

const experienceFallback = experienceData.map((e) => ({ ...e, id: e.title }));

export const useExperience = () =>
  useSanityQuery(EXPERIENCE_QUERY, { map: mapExperience, fallback: experienceFallback });

// ─── Technologies ────────────────────────────────────────────────────────────
const TECHNOLOGIES_QUERY = `*[_type == "technology" && !(_id in path("drafts.**"))]{
  _id, name, iconKey, order
}`;

const mapTechnologies = (rows) =>
  [...rows].sort(byOrder("name", "asc")).map((t) => ({
    id: t._id,
    name: t.name,
    icon: getTechIcon(t.iconKey),
  }));

const technologiesFallback = technologiesData.map((t) => ({ ...t, id: t.name }));

export const useTechnologies = () =>
  useSanityQuery(TECHNOLOGIES_QUERY, { map: mapTechnologies, fallback: technologiesFallback });

// ─── Profile (singleton) ─────────────────────────────────────────────────────
const PROFILE_QUERY = `*[_type == "profile" && _id == "profile"][0]{
  name, role, description, bio, location, availability,
  email, github, linkedin, instagram, stats,
  heroImage, aboutImage,
  "resumeUrl": resume.asset->url
}`;

const DEFAULT_RESUME = "/CV_Reynard_Ghazy_Tsaqif.pdf";

const profileFallback = {
  name: personal.name,
  role: personal.role,
  description: personal.description,
  bio: bio.description,
  location: personal.location,
  availability: personal.availability,
  email: personal.email,
  github: personal.github,
  linkedin: `https://${personal.linkedin}`,
  instagram: personal.instagram,
  resume: DEFAULT_RESUME,
  heroImage: ReyImage,
  aboutImage: ReyAbout,
  stats: statsData.map((s) => ({ value: s.number || s.text, label: s.label })),
};

// Field yang kosong di Sanity memakai nilai lama, supaya tampilan tidak rusak
// saat dokumen Profile belum lengkap.
const mapProfile = (p) => {
  if (!p) return profileFallback;
  return {
    name: p.name || profileFallback.name,
    role: p.role ?? "",
    description: p.description ?? "",
    bio: p.bio ?? "",
    location: p.location ?? "",
    availability: p.availability ?? "",
    email: p.email ?? "",
    github: p.github ?? "",
    linkedin: p.linkedin ?? "",
    instagram: p.instagram ?? "",
    resume: p.resumeUrl || DEFAULT_RESUME,
    heroImage: p.heroImage?.asset
      ? urlFor(p.heroImage).width(1280).url()
      : profileFallback.heroImage,
    aboutImage: p.aboutImage?.asset
      ? urlFor(p.aboutImage).width(760).url()
      : profileFallback.aboutImage,
    stats: p.stats ?? [],
  };
};

// Dipakai selama profile masih loading (atau error tanpa fallback).
const emptyProfile = {
  ...Object.fromEntries(Object.keys(profileFallback).map((k) => [k, ""])),
  resume: DEFAULT_RESUME,
  stats: [],
};

export const useProfile = () => {
  const result = useSanityQuery(PROFILE_QUERY, {
    map: mapProfile,
    fallback: profileFallback,
  });
  return { ...result, profile: result.data ?? emptyProfile };
};
