import { defineField, defineType } from "sanity";

export default defineType({
  name: "playground",
  title: "Playground item",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "localeString", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title.en", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "summary", title: "Summary", type: "localeText" }),
    defineField({ name: "status", title: "Status", type: "string", options: { list: [{ title: "Live", value: "live" }, { title: "In progress", value: "wip" }, { title: "Idea", value: "idea" }], layout: "radio" }, initialValue: "wip" }),
    defineField({ name: "kind", title: "Kind", type: "string", options: { list: ["ai-demo", "data-viz", "web-experiment"] } }),
    defineField({ name: "tags", title: "Tags", type: "array", of: [{ type: "string" }], options: { layout: "tags" } }),
    defineField({ name: "link", title: "External link", type: "url" }),
    defineField({ name: "cover", title: "Cover", type: "image", options: { hotspot: true } }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title.en", subtitle: "status", media: "cover" } },
});
