import { defineField, defineType } from "sanity";

// Bilingual fields for the new site. English is required, Indonesian falls back to English when empty.
const LANGS = [
  { id: "en", title: "English" },
  { id: "id", title: "Bahasa Indonesia" },
];

export const localeString = defineType({
  name: "localeString",
  title: "Text (EN / ID)",
  type: "object",
  options: { columns: 2 },
  fields: LANGS.map((l) => defineField({ name: l.id, title: l.title, type: "string" })),
});

export const localeText = defineType({
  name: "localeText",
  title: "Paragraph (EN / ID)",
  type: "object",
  fields: LANGS.map((l) => defineField({ name: l.id, title: l.title, type: "text", rows: 4 })),
});

const blockContent = [
  { type: "block", styles: [{ title: "Normal", value: "normal" }, { title: "Heading", value: "h3" }, { title: "Quote", value: "blockquote" }] },
  { type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Alt text", type: "string" }), defineField({ name: "caption", title: "Caption", type: "string" })] },
  {
    type: "object",
    name: "codeBlock",
    title: "Code",
    fields: [defineField({ name: "language", type: "string", title: "Language" }), defineField({ name: "code", type: "text", title: "Code", rows: 10 })],
    preview: { select: { title: "language", subtitle: "code" } },
  },
];

export const localeBlocks = defineType({
  name: "localeBlocks",
  title: "Rich text (EN / ID)",
  type: "object",
  fields: LANGS.map((l) => defineField({ name: l.id, title: l.title, type: "array", of: blockContent })),
});

export const blocks = defineType({
  name: "blocks",
  title: "Rich text",
  type: "array",
  of: blockContent,
});
