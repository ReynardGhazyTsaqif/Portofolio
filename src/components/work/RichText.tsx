import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { imageSize, imageUrl } from "@/lib/sanity/client";
import type { SanityImage } from "@/lib/sanity/types";

type Tone = "muted" | "article";

const build = (tone: Tone): PortableTextComponents => ({
  block: {
    normal: ({ children }) =>
      tone === "article" ? (
        <p className="text-[clamp(1.05rem,1.3vw,1.18rem)] leading-[1.75] text-ink/90 [&+&]:mt-6">{children}</p>
      ) : (
        <p className="max-w-[64ch] text-[17px] leading-relaxed text-muted [&+&]:mt-4">{children}</p>
      ),
    h3: ({ children }) => <h3 className={`mb-3 font-extrabold tracking-[-0.02em] ${tone === "article" ? "mt-14 text-[clamp(1.5rem,2.4vw,2rem)]" : "mt-10 text-[1.4rem]"}`}>{children}</h3>,
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
});

const TONES = { muted: build("muted"), article: build("article") };

/** Sanity rich text (Portable Text) in the site's type styles: muted for case studies, darker and roomier for notes. */
export function RichText({ value, tone = "muted" }: { value: unknown[]; tone?: Tone }) {
  return <PortableText value={value as never} components={TONES[tone]} />;
}
