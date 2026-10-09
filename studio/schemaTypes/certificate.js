import { defineField, defineType } from "sanity";

// Belum ditampilkan di web — disiapkan agar sertifikat bisa mulai diisi.
export default defineType({
  name: "certificate",
  title: "Certificate",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({ name: "issuer", title: "Issuer", type: "string" }),
    defineField({ name: "issueDate", title: "Issue Date", type: "date" }),
    defineField({ name: "credentialId", title: "Credential ID", type: "string" }),
    defineField({ name: "credentialUrl", title: "Credential URL", type: "url" }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
  preview: {
    select: { title: "title", subtitle: "issuer", media: "image" },
  },
});
