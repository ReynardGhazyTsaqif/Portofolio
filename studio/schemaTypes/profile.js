import { defineField, defineType } from "sanity";

export default defineType({
  name: "profile",
  title: "Profile",
  type: "document",
  groups: [
    { name: "main", title: "Utama", default: true },
    { name: "about", title: "About" },
    { name: "contact", title: "Kontak & Sosmed" },
    { name: "v2", title: "Situs baru (v2)" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "main",
      validation: (r) => r.required(),
    }),
    defineField({ name: "role", title: "Role / Tagline", type: "string", group: "main" }),
    defineField({
      name: "description",
      title: "Hero Description",
      type: "text",
      rows: 3,
      group: "main",
    }),
    defineField({ name: "heroImage", title: "Hero Image", type: "image", group: "main" }),
    defineField({
      name: "resume",
      title: "Resume (PDF)",
      type: "file",
      options: { accept: "application/pdf" },
      group: "main",
    }),

    defineField({ name: "bio", title: "Bio", type: "text", rows: 6, group: "about" }),
    defineField({ name: "aboutImage", title: "About Image", type: "image", group: "about" }),
    defineField({
      name: "stats",
      title: "Stats",
      type: "array",
      group: "about",
      description: "Tiga item pertama ditampilkan di samping foto About.",
      of: [
        {
          type: "object",
          name: "stat",
          fields: [
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              description: "Mis. \"2 years\", \"8+\", \"Active\"",
            }),
            defineField({ name: "label", title: "Label", type: "string" }),
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        },
      ],
    }),

    defineField({ name: "location", title: "Location", type: "string", group: "contact" }),
    defineField({ name: "availability", title: "Availability", type: "string", group: "contact" }),
    defineField({ name: "email", title: "Email", type: "string", group: "contact" }),
    defineField({ name: "github", title: "GitHub URL", type: "url", group: "contact" }),
    defineField({ name: "linkedin", title: "LinkedIn URL", type: "url", group: "contact" }),
    defineField({ name: "instagram", title: "Instagram URL", type: "url", group: "contact" }),

    // ─── New site (v2). Old fields above stay for the previous site. ───
    defineField({ name: "headline", title: "Headline", type: "localeString", group: "v2", description: "Baris kecil di hero. Mis. Web developer and AI engineer" }),
    defineField({ name: "oneLiner", title: "One-liner", type: "localeString", group: "v2", description: "Kalimat utama untuk recruiter." }),
    defineField({ name: "titles", title: "Titles", type: "array", of: [{ type: "localeString" }], group: "v2", description: "Mis. Web Developer, AI Engineer, Data Scientist" }),
    defineField({ name: "about", title: "About (paragraphs)", type: "localeText", group: "v2", description: "Pisahkan paragraf dengan satu baris kosong." }),
    defineField({ name: "availabilityText", title: "Availability", type: "localeString", group: "v2" }),
  ],
  preview: { prepare: () => ({ title: "Profile" }) },
});
