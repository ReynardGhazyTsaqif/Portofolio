import { defineField, defineType } from "sanity";

// One note per language; translations link to each other.
export default defineType({
  name: "post",
  title: "Note",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "language", title: "Language", type: "string", options: { list: [{ title: "English", value: "en" }, { title: "Bahasa Indonesia", value: "id" }], layout: "radio" }, initialValue: "en", validation: (r) => r.required() }),
    defineField({ name: "translation", title: "Translation", type: "reference", to: [{ type: "post" }], description: "Catatan yang sama dalam bahasa lain (opsional)." }),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3 }),
    defineField({ name: "publishedAt", title: "Published at", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "tags", title: "Tags", type: "array", of: [{ type: "string" }], options: { layout: "tags" } }),
    defineField({ name: "cover", title: "Cover", type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Alt text", type: "string" })] }),
    defineField({ name: "body", title: "Body", type: "blocks" }),
  ],
  orderings: [{ title: "Newest", name: "publishedDesc", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "language", media: "cover" } },
});
