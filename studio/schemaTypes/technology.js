import { defineField, defineType } from "sanity";

// Harus sinkron dengan peta ikon di web: src/lib/techIcons.js
// Ikon baru = tambahkan di kedua tempat (perlu deploy web sekali).
const ICONS = [
  ["React", "SiReact"],
  ["Laravel", "SiLaravel"],
  ["Tailwind CSS", "SiTailwindcss"],
  ["JavaScript", "SiJavascript"],
  ["TypeScript", "SiTypescript"],
  ["PHP", "SiPhp"],
  ["Python", "SiPython"],
  ["TensorFlow", "SiTensorflow"],
  ["Scikit-learn", "SiScikitlearn"],
  ["OpenCV", "SiOpencv"],
  ["Pandas", "SiPandas"],
  ["NumPy", "SiNumpy"],
  ["Keras", "SiKeras"],
  ["PyTorch", "SiPytorch"],
  ["Jupyter", "SiJupyter"],
  ["MySQL", "SiMysql"],
  ["PostgreSQL", "SiPostgresql"],
  ["MongoDB", "SiMongodb"],
  ["Firebase", "SiFirebase"],
  ["Supabase", "SiSupabase"],
  ["Git", "SiGit"],
  ["GitHub", "SiGithub"],
  ["Node.js", "SiNodedotjs"],
  ["NestJS", "SiNestjs"],
  ["Next.js", "SiNextdotjs"],
  ["Inertia.js", "SiInertia"],
  ["Vite", "SiVite"],
  ["HTML5", "SiHtml5"],
  ["CSS3", "SiCss3"],
  ["Bootstrap", "SiBootstrap"],
  ["Framer Motion", "SiFramer"],
  ["Figma", "SiFigma"],
  ["Docker", "SiDocker"],
  ["Linux", "SiLinux"],
  ["Postman", "SiPostman"],
  ["Vercel", "SiVercel"],
  ["Sanity", "SiSanity"],
  ["Flutter", "SiFlutter"],
  ["Dart", "SiDart"],
  ["Kotlin", "SiKotlin"],
  ["C++", "SiCplusplus"],
];

export default defineType({
  name: "technology",
  title: "Technology / Skill",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "iconKey",
      title: "Icon",
      type: "string",
      options: {
        list: ICONS.map(([title, value]) => ({ title, value })),
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Urutan tampil (kecil = lebih dulu).",
    }),
    defineField({
      name: "category",
      title: "Category (v2)",
      type: "string",
      options: { list: [{ title: "Web", value: "web" }, { title: "AI / ML", value: "ai" }, { title: "Data", value: "data" }, { title: "Tools", value: "tools" }], layout: "radio" },
    }),
    defineField({ name: "learning", title: "Currently learning", type: "boolean", initialValue: false }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", subtitle: "iconKey" },
  },
});
