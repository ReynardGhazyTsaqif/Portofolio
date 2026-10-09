// Adds the bilingual fields and new documents used by the v2 site.
// Safe to run more than once: existing values are never overwritten (setIfMissing / createIfNotExists).
//
// Run from the studio folder, logged in with `npx sanity login`:
//   npx sanity exec migrations/v2-content.mjs --with-user-token
//
// Documents whose details are still unknown are created as drafts ("drafts." ids), so they stay
// hidden from the site until you fill them in and press Publish in the Studio.
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2025-01-01" });

const L = (en, id) => ({ _type: "localeString", en, id });
const T = (en, id) => ({ _type: "localeText", en, id });
let k = 0;
const key = () => `v2k${(k++).toString(36)}`;
const list = (items) => items.map((i) => ({ ...i, _key: key() }));
const slug = (current) => ({ _type: "slug", current });

const profile = {
  headline: L("Web developer and AI engineer", "Web developer dan AI engineer"),
  oneLiner: L(
    "Many people can train a model. I make sure it reaches the user's screen.",
    "Banyak orang bisa melatih model. Saya memastikan model itu sampai ke layar pengguna.",
  ),
  titles: list([L("Web Developer", "Web Developer"), L("AI Engineer", "AI Engineer"), L("Data Scientist", "Data Scientist")]),
  about: T(
    "I'm an Informatics student at Universitas Andalas in Padang. My studies focus on artificial intelligence and data science, and web development is how I put that work in front of people.\n\nI build front ends with React, Laravel and Tailwind CSS at PT Neo Telemetri, coordinate research and development at the campus Programming Laboratory, and reached the national finals of LIDM 2026.\n\nA model is only useful once someone can use it. That last step, from notebook to browser, is the part I like to own.",
    "Saya mahasiswa Informatika Universitas Andalas di Padang. Fokus kuliah saya adalah kecerdasan buatan dan sains data, dan web development adalah cara saya membawa hasilnya ke pengguna.\n\nSaya membangun front-end dengan React, Laravel, dan Tailwind CSS di PT Neo Telemetri, mengoordinasikan riset dan pengembangan di Laboratorium Pemrograman kampus, dan menjadi finalis nasional LIDM 2026.\n\nModel baru berguna setelah bisa dipakai orang. Langkah terakhir itu, dari notebook sampai ke browser, adalah bagian yang paling saya sukai.",
  ),
  availabilityText: L("Open to internships and junior roles", "Terbuka untuk magang dan posisi junior"),
};

const projects = {
  "project-unand-co-workspace-ucw-app": {
    slug: slug("unand-co-workspace"),
    categories: ["web"],
    featured: true,
    roleLocalized: L("Front-end Developer", "Front-end Developer"),
    summary: T(
      "Front end for Universitas Andalas' co-working space app, with real-time updates through Laravel Reverb.",
      "Front-end aplikasi co-working space Universitas Andalas, dengan pembaruan real-time lewat Laravel Reverb.",
    ),
  },
  "project-open-recruitment-platform-neo-telemetri": {
    slug: slug("neo-telemetri-open-recruitment"),
    categories: ["web"],
    featured: true,
    roleLocalized: L("Front-end Developer", "Front-end Developer"),
    summary: T(
      "Role-based recruitment platform for Neo Telemetri, built with the programming and UI/UX teams.",
      "Platform rekrutmen berbasis peran untuk Neo Telemetri, dibangun bersama tim programming dan UI/UX.",
    ),
    liveUrl: "https://or.neotelemetri.id/",
  },
  "project-indonesian-spice-image-classification": {
    slug: slug("indonesian-spice-classifier"),
    categories: ["ai", "data"],
    featured: true,
    roleLocalized: L("AI / ML Engineer", "AI / ML Engineer"),
    summary: T(
      "Image classifier that recognises Indonesian spices from photos, using transfer learning on MobileNetV2.",
      "Model klasifikasi gambar yang mengenali rempah Indonesia dari foto, dengan transfer learning MobileNetV2.",
    ),
    repoUrl: "https://colab.research.google.com/drive/1cnXMvtGbaWJ2Au4K5oeBGWz2D-IU91ME",
  },
  "project-informatics-department-information-system": {
    slug: slug("informatics-department-system"),
    categories: ["web"],
    featured: false,
    roleLocalized: L("Full-stack Developer", "Full-stack Developer"),
    summary: T(
      "Information system for the Informatics department at Universitas Andalas, built with Laravel and MySQL.",
      "Sistem informasi Departemen Informatika Universitas Andalas, dibangun dengan Laravel dan MySQL.",
    ),
    repoUrl: "https://github.com/farhnsaptr/project_if_v3",
  },
  "project-e-commerce-web-application": {
    slug: slug("e-commerce-web-app"),
    categories: ["web"],
    featured: false,
    roleLocalized: L("Front-end Developer", "Front-end Developer"),
    summary: T(
      "Storefront front end for a capstone project, built with React and Tailwind CSS on a REST API.",
      "Front-end toko online untuk project capstone, dibangun dengan React dan Tailwind CSS di atas REST API.",
    ),
    repoUrl: "https://github.com/ReynardGhazyTsaqif/CapstoneMentee",
  },
};

const experiences = {
  "experience-frontend-web-programmer-neo-telemetri": {
    kind: "work",
    roleLocalized: L("Frontend Web Programmer", "Frontend Web Programmer"),
    summary: T(
      "Front-end developer in the programming division, building web applications to client requirements.",
      "Front-end developer di divisi programming, membangun aplikasi web sesuai kebutuhan klien.",
    ),
    highlights: list([
      L("Built role-based recruitment platforms with the programming and UI/UX teams.", "Membangun platform rekrutmen berbasis peran bersama tim programming dan UI/UX."),
      L("Adapted the stack to each project, mostly React and Tailwind CSS on NestJS APIs.", "Menyesuaikan stack dengan tiap project, umumnya React dan Tailwind CSS di atas API NestJS."),
    ]),
  },
  "experience-coordinator-of-research-development-programming-laboratory-u": {
    kind: "lab",
    roleLocalized: L("Coordinator of Research & Development", "Koordinator Riset & Pengembangan"),
    summary: T(
      "Leading the research and development division of the campus Programming Laboratory.",
      "Memimpin divisi riset dan pengembangan di Laboratorium Pemrograman kampus.",
    ),
    highlights: list([
      L("Coordinate internal projects across lab members.", "Mengoordinasikan project internal antaranggota lab."),
      L("Run knowledge-sharing sessions on programming and software development.", "Mengadakan sesi berbagi ilmu tentang pemrograman dan pengembangan perangkat lunak."),
    ]),
  },
  "experience-staff-of-internal-division-informatics-student-association-h": {
    kind: "organisation",
    roleLocalized: L("Internal Division Staff", "Staf Divisi Internal"),
    summary: T(
      "Coordinated internal activities for an association of more than 100 Informatics students.",
      "Mengoordinasikan kegiatan internal untuk himpunan dengan lebih dari 100 mahasiswa Informatika.",
    ),
    highlights: list([
      L("Planned member gatherings and organisational meetings.", "Merencanakan gathering anggota dan rapat organisasi."),
      L("Managed communication between members and the board.", "Mengelola komunikasi antara anggota dan pengurus."),
    ]),
  },
  "experience-volunteer-community-service-kpri-tarusan-cooperative": {
    kind: "volunteer",
    roleLocalized: L("Volunteer", "Relawan"),
    summary: T(
      "Community service on digital transformation for a local cooperative.",
      "Pengabdian masyarakat tentang transformasi digital untuk koperasi lokal.",
    ),
    highlights: list([
      L("Demonstrated a cooperative management website to stakeholders.", "Memperkenalkan website manajemen koperasi kepada pemangku kepentingan."),
    ]),
  },
};

const technologies = {
  "technology-react-js": "web", "technology-laravel": "web", "technology-tailwind-css": "web", "technology-javascript": "web",
  "technology-php": "web", "technology-python": "ai", "technology-tensorflow": "ai", "technology-scikit-learn": "ai",
  "technology-opencv": "ai", "technology-pandas": "data", "technology-mysql": "data", "technology-git": "tools",
};

const newDocs = [
  {
    _id: "education-universitas-andalas",
    _type: "education",
    institution: "Universitas Andalas",
    degree: L("Bachelor of Informatics", "S1 Informatika"),
    gpa: "3.97",
    gpaScale: "4.00",
    focus: L("Artificial intelligence and data science", "Kecerdasan buatan dan sains data"),
    courses: list([
      L("Web Programming", "Pemrograman Web"),
      L("Artificial Intelligence", "Kecerdasan Buatan"),
      L("Machine Learning", "Pembelajaran Mesin"),
      L("Data Visualization", "Visualisasi Data"),
      L("Data Science", "Sains Data"),
    ]),
    order: 1,
  },
  {
    _id: "achievement-lidm-2026",
    _type: "achievement",
    title: L("National finalist", "Finalis nasional"),
    event: "LIDM 2026",
    summary: T(
      "Reached the national finals of LIDM (Lomba Inovasi Digital Mahasiswa) 2026.",
      "Menjadi finalis nasional LIDM (Lomba Inovasi Digital Mahasiswa) 2026.",
    ),
    featured: true,
    order: 1,
  },
  // Drafts: details to be filled in and published from the Studio.
  {
    _id: "drafts.experience-internship-diskominfo-pariaman",
    _type: "experience",
    kind: "internship",
    company: "Dinas Komunikasi dan Informatika Kota Pariaman",
    role: "Intern",
    roleLocalized: L("Intern", "Peserta Magang"),
    summary: T(
      "Internship at the Pariaman city communications and IT office. (Fill in dates and details.)",
      "Magang di Dinas Kominfo Kota Pariaman. (Lengkapi tanggal dan detail.)",
    ),
    highlights: list([
      L("Built AI features for the official website of Bappeda Kota Pariaman.", "Membangun fitur AI untuk website resmi Bappeda Kota Pariaman."),
    ]),
    location: "Pariaman, West Sumatra",
    order: 0,
  },
  {
    _id: "drafts.project-bappeda-pariaman-ai",
    _type: "project",
    title: "AI features for Bappeda Kota Pariaman",
    slug: slug("bappeda-pariaman-ai"),
    categories: ["ai", "web"],
    featured: true,
    role: "AI Engineer",
    roleLocalized: L("AI Engineer", "AI Engineer"),
    summary: T(
      "AI features for the official website of Bappeda Kota Pariaman. (Describe the feature.)",
      "Fitur AI untuk website resmi Bappeda Kota Pariaman. (Jelaskan fiturnya.)",
    ),
    order: 0,
  },
];

const tx = client.transaction();
tx.patch("profile", (p) => p.setIfMissing(profile));
for (const [id, fields] of Object.entries(projects)) tx.patch(id, (p) => p.setIfMissing(fields));
for (const [id, fields] of Object.entries(experiences)) tx.patch(id, (p) => p.setIfMissing(fields));
for (const [id, category] of Object.entries(technologies)) tx.patch(id, (p) => p.setIfMissing({ category, learning: false }));
for (const doc of newDocs) tx.createIfNotExists(doc);

const res = await tx.commit({ visibility: "async" });
console.log(`Done: ${res.results.length} changes in transaction ${res.transactionId}`);
