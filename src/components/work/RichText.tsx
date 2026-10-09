import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { imageSize, imageUrl } from "@/lib/sanity/client";
import type { SanityImage } from "@/lib/sanity/types";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="max-w-[64ch] text-[17px] leading-relaxed text-muted [&+&]:mt-4">{children}</p>,
    h3: ({ children }) => <h3 className="mt-10 mb-3 text-[1.4rem] font-extrabold tracking-[-0.02em]">{children}</h3>,
    blockquote: ({ children }) => <blockquote className="my-8 border-l-2 border-moss pl-5 font-serif text-[1.5rem] leading-snug italic">{children}</blockquote>,
  },
  marks: {
    link: ({ children, value }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-moss underline-offset-4">
        {children}
      </a>
    ),
    code: ({ children }) => <code className="rounded bg-surface px-1.5 py-0.5 text-[0.9em]">{children}</code>,
  },
  list: {
    bullet: ({ children }) => <ul className="my-4 grid max-w-[64ch] list-disc gap-2 pl-5 text-muted marker:text-moss">{children}</ul>,
    number: ({ children }) => <ol className="my-4 grid max-w-[64ch] list-decimal gap-2 pl-5 text-muted marker:text-moss">{children}</ol>,
  },
  types: {
    image: ({ value }: { value: SanityImage }) => {
      const size = imageSize(value);
      if (!size) return null;
      return (
        <figure className="my-8">
          <Image src={imageUrl(value, 1400)} width={size.width} height={size.height} alt={value.alt ?? ""} sizes="(min-width: 1024px) 60vw, 100vw" className="w-full rounded-lg border border-line" />
          {value.caption && <figcaption className="mt-2 text-[14px] text-muted">{value.caption}</figcaption>}
        </figure>
      );
    },
    codeBlock: ({ value }: { value: { language?: string; code?: string } }) => (
      <pre className="my-6 overflow-x-auto rounded-lg border border-line bg-surface p-5 text-[14px] leading-relaxed">
        <code>{value.code}</code>
      </pre>
    ),
  },
};

/** Sanity rich text (Portable Text) in the site's type styles. */
export function RichText({ value }: { value: unknown[] }) {
  return <PortableText value={value as never} components={components} />;
}
