import { defineField, defineType } from "sanity";

export default defineType({
  name: "project",
  title: "Project",
  type: "document",
  groups: [
    { name: "v2", title: "Situs baru (v2)" },
    { name: "case", title: "Studi kasus" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      description: "Mis. Frontend Developer",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "url",
      description: "Repo GitHub / demo. Kosongkan jika tidak ada.",
    }),
    defineField({
      name: "techStack",
      title: "Tech Stack",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      description: "Kolom Year di web diambil dari tahun tanggal ini.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Urutan tampil (kecil = lebih atas).",
    }),

    // ─── New site (v2) ───
    defineField({ name: "slug", title: "Slug", type: "slug", group: "v2", options: { source: "title", maxLength: 96 }, description: "Alamat halaman studi kasus: /work/<slug>" }),
    defineField({ name: "categories", title: "Categories", type: "array", group: "v2", of: [{ type: "string" }], options: { list: [{ title: "Web", value: "web" }, { title: "AI / ML", value: "ai" }, { title: "Data", value: "data" }], layout: "grid" } }),
    defineField({ name: "featured", title: "Featured on home page", type: "boolean", group: "v2", initialValue: false }),
    defineField({ name: "roleLocalized", title: "Role", type: "localeString", group: "v2" }),
    defineField({ name: "summary", title: "Summary", type: "localeText", group: "v2", description: "1–2 kalimat untuk kartu project." }),
    defineField({ name: "liveUrl", title: "Live site", type: "url", group: "v2" }),
    defineField({ name: "repoUrl", title: "Repository / notebook", type: "url", group: "v2" }),
    defineField({ name: "gallery", title: "Gallery", type: "array", group: "case", of: [{ type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Alt text", type: "string" }), defineField({ name: "caption", title: "Caption", type: "string" })] }] }),
    defineField({ name: "problem", title: "Problem", type: "localeText", group: "case", description: "Masalah apa yang diselesaikan, dan untuk siapa." }),
    defineField({ name: "contribution", title: "My role", type: "localeText", group: "case", description: "Apa yang Anda kerjakan secara spesifik." }),
    defineField({ name: "decisions", title: "Technical decisions", type: "localeBlocks", group: "case" }),
    defineField({ name: "outcome", title: "Outcome", type: "localeText", group: "case" }),
    defineField({
      name: "metrics",
      title: "Key numbers",
      type: "array",
      group: "case",
      of: [{ type: "object", name: "metric", fields: [defineField({ name: "value", title: "Value", type: "string" }), defineField({ name: "label", title: "Label", type: "localeString" })], preview: { select: { title: "value", subtitle: "label.en" } } }],
    }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
    { title: "Date (terbaru)", name: "dateDesc", by: [{ field: "date", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "role", media: "image" },
  },
});
