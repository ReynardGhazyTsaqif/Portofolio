import { defineField, defineType } from "sanity";

export default defineType({
  name: "education",
  title: "Education",
  type: "document",
  fields: [
    defineField({ name: "institution", title: "Institution", type: "string", validation: (r) => r.required() }),
    defineField({ name: "degree", title: "Degree / programme", type: "localeString", description: "Mis. B.Sc. in Informatics / S1 Informatika" }),
    defineField({ name: "startDate", title: "Start date", type: "date" }),
    defineField({ name: "endDate", title: "End date", type: "date", description: "Kosongkan jika masih berjalan." }),
    defineField({ name: "expected", title: "Expected graduation", type: "localeString", description: "Mis. Expected 2027 / Lulus 2027" }),
    defineField({ name: "gpa", title: "GPA", type: "string", description: "Mis. 3.97" }),
    defineField({ name: "gpaScale", title: "GPA scale", type: "string", initialValue: "4.00" }),
    defineField({ name: "focus", title: "Focus", type: "localeString", description: "Mis. AI & Data Science" }),
    defineField({ name: "courses", title: "Relevant courses", type: "array", of: [{ type: "localeString" }] }),
    defineField({ name: "summary", title: "Summary", type: "localeText" }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "institution", subtitle: "degree.en" } },
});
