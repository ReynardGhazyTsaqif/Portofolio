import { defineField, defineType } from "sanity";

export default defineType({
  name: "achievement",
  title: "Achievement",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "localeString", validation: (r) => r.required(), description: "Mis. National finalist / Finalis nasional" }),
    defineField({ name: "event", title: "Event / competition", type: "string", description: "Mis. LIDM 2026" }),
    defineField({ name: "organizer", title: "Organizer", type: "string" }),
    defineField({ name: "date", title: "Date", type: "date" }),
    defineField({ name: "summary", title: "Summary", type: "localeText" }),
    defineField({ name: "project", title: "Related project", type: "reference", to: [{ type: "project" }] }),
    defineField({ name: "image", title: "Image", type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Alt text", type: "string" })] }),
    defineField({ name: "link", title: "Link", type: "url" }),
    defineField({ name: "featured", title: "Highlight on home page", type: "boolean", initialValue: false }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title.en", subtitle: "event", media: "image" } },
});
