import { defineField, defineType } from "sanity";

export default defineType({
  name: "experience",
  title: "Experience",
  type: "document",
  fields: [
    defineField({
      name: "company",
      title: "Company / Organization",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start Date",
      type: "date",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "endDate",
      title: "End Date",
      type: "date",
      description:
        "Kosongkan jika masih berlangsung (tampil sebagai \"Present\"). Isi sama dengan Start Date untuk kegiatan satu bulan.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description:
        "Urutan tampil (kecil = lebih atas). Item paling atas diberi badge \"Current\".",
    }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
    { title: "Start date (terbaru)", name: "startDesc", by: [{ field: "startDate", direction: "desc" }] },
  ],
  preview: {
    select: { title: "role", subtitle: "company" },
  },
});
