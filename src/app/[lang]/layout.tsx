import type { Metadata } from "next";
import { Hanken_Grotesk, Instrument_Serif } from "next/font/google";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionary";
import { site } from "@/lib/site";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { PageTransition } from "@/components/motion/PageTransition";
import { PointerFX } from "@/components/motion/PointerFX";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingCV } from "@/components/site/FloatingCV";
import { ThemeSync } from "@/components/site/ThemeSync";
import "../globals.css";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

// Runs before paint: applies the saved or system theme, and flags that JS motion is on.
const bootScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme"),k=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;d.classList.toggle("dark",k);if(!matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.motion="on"}catch(e){}})()`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    metadataBase: new URL(site.url),
    title: { default: dict.meta.title, template: `%s | ${dict.meta.title}` },
    description: dict.meta.description,
    openGraph: { type: "website", siteName: site.name, locale: lang === "id" ? "id_ID" : "en_US", alternateLocale: lang === "id" ? "en_US" : "id_ID" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      {/* Font classes live on <body>: React rewrites <html> attributes when the locale changes, which would wipe the theme class. */}
      <body className={`${hanken.variable} ${instrument.variable}`}>
        <ThemeSync />
        <I18nProvider lang={lang} dict={dict}>
          <SmoothScroll>
            <PageTransition>
              <a href="#main" className="sr-only z-[100] rounded-md bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
                {dict.nav.skip}
              </a>
              <Navbar />
              <main id="main" tabIndex={-1} className="outline-none">{children}</main>
              <Footer />
              <FloatingCV />
              <PointerFX />
            </PageTransition>
          </SmoothScroll>
        </I18nProvider>
      </body>
    </html>
  );
}
