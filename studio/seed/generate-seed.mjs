// Membuat seed/data.ndjson dari data hardcode di ../../src/data/
// Jalankan dari folder studio:  npm run seed
// Lalu impor:                    npm run import
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const load = (p) => import(pathToFileURL(path.join(root, p)).href);

const { projects } = await load("src/data/projects.js");
const { experience } = await load("src/data/experience.js");
// technologies.js mengimpor react-icons (tidak bisa di-load di Node),
// jadi pasangan name/icon dibaca langsung dari teksnya.
const technologies = [
  ...readFileSync(path.join(root, "src/data/technologies.js"), "utf8").matchAll(
    /name:\s*"([^"]+)",\s*icon:\s*(\w+)/g,
  ),
].map(([, name, icon]) => ({ name, icon }));
const { personal, bio, stats } = await load("src/data/personal.js");

const missing = [];

// Referensi file lokal -> diunggah otomatis oleh `sanity dataset import`
function asset(kind, relPath) {
  const abs = path.join(root, relPath);
  if (!existsSync(abs)) {
    missing.push(relPath);
    return undefined;
  }
  const ref = { _sanityAsset: `${kind}@${pathToFileURL(abs).href}` };
  return kind === "image" ? { _type: "image", ...ref } : { _type: "file", ...ref };
}

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// "Mar 2026" -> "2026-03-01"
function parseMonth(str) {
  const [mon, year] = str.trim().split(/\s+/);
  const m = MONTHS.indexOf(mon.slice(0, 3).toLowerCase()) + 1;
  if (!m || !year) throw new Error(`Format tanggal tidak dikenal: "${str}"`);
  return `${year}-${String(m).padStart(2, "0")}-01`;
}

const docs = [];

// ─── Profile ─────────────────────────────────────────────────────────────────
docs.push({
  _id: "profile",
  _type: "profile",
  name: personal.name,
  role: personal.role,
  description: personal.description,
  bio: bio.description,
  location: personal.location,
  availability: personal.availability,
  email: personal.email,
  github: personal.github,
  linkedin: personal.linkedin.startsWith("http")
    ? personal.linkedin
    : `https://${personal.linkedin}`,
  instagram: personal.instagram,
  stats: stats.map((s, i) => ({
    _key: `stat${i}`,
    _type: "stat",
    value: s.number || s.text,
    label: s.label,
  })),
  heroImage: asset("image", "src/assets/Rey.png"),
  aboutImage: asset("image", "src/assets/ReyAbout.jpg"),
  resume: asset("file", "public/CV_Reynard_Ghazy_Tsaqif.pdf"),
});

// ─── Projects ────────────────────────────────────────────────────────────────
projects.forEach((p, i) => {
  docs.push({
    _id: `project-${slug(p.name)}`,
    _type: "project",
    title: p.name,
    role: p.role,
    date: `${p.year}-01-01`,
    link: p.github || undefined,
    techStack: p.services,
    order: i + 1,
    image: p.image ? asset("image", `public/${p.image}`) : undefined,
  });
});

// ─── Experience ──────────────────────────────────────────────────────────────
experience.forEach((e, i) => {
  const [role, ...companyParts] = e.title.split(" — ");
  const [startStr, endStr] = e.date.split("–").map((s) => s.trim());
  const startDate = parseMonth(startStr);
  const endDate =
    endStr === undefined ? startDate : /present/i.test(endStr) ? undefined : parseMonth(endStr);

  docs.push({
    _id: `experience-${slug(e.title)}`,
    _type: "experience",
    role: role.trim(),
    company: companyParts.join(" — ").trim(),
    startDate,
    endDate,
    description: e.description,
    tags: e.tags,
    order: i + 1,
  });
});

// ─── Technologies ────────────────────────────────────────────────────────────
technologies.forEach((t, i) => {
  docs.push({
    _id: `technology-${slug(t.name)}`,
    _type: "technology",
    name: t.name,
    iconKey: t.icon,
    order: i + 1,
  });
});

const out = path.join(here, "data.ndjson");
writeFileSync(out, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");

console.log(`✔ ${docs.length} dokumen ditulis ke ${path.relative(process.cwd(), out)}`);
if (missing.length) {
  console.warn("⚠ File berikut tidak ditemukan, upload manual di Studio:");
  missing.forEach((m) => console.warn("  -", m));
}
