import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { hasLocale } from "@/i18n/config";
import en from "@/i18n/dictionaries/en.json";
import id from "@/i18n/dictionaries/id.json";
import { PALETTES, RIDGES, ridgeY, WORLD } from "@/components/hero/scene";

export const alt = "Reynard Ghazy Tsaqif, web developer and AI engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The hero's ridges, scaled to sit along the bottom of the card.
function ridgePath(i: number) {
  const sx = size.width / WORLD.w, top = 400, sy = 0.75;
  const pts: string[] = [];
  for (let x = 0; x <= WORLD.w; x += 16) pts.push(`${(x * sx).toFixed(1)} ${(top + (ridgeY(RIDGES[i], x) - 430) * sy).toFixed(1)}`);
  return `M0 ${size.height} L${pts.join(" L")} L${size.width} ${size.height}Z`;
}

export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = hasLocale(lang) && lang === "id" ? id : en;
  const fonts = join(process.cwd(), "src/assets/fonts");
  const [bold, medium, serif] = await Promise.all([
    readFile(join(fonts, "HankenGrotesk-ExtraBold.ttf")),
    readFile(join(fonts, "HankenGrotesk-Medium.ttf")),
    readFile(join(fonts, "InstrumentSerif-Italic.ttf")),
  ]);
  const p = PALETTES.light;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: p.skyTop, padding: "64px 72px", position: "relative" }}>
        <svg width={size.width} height={size.height} style={{ position: "absolute", left: 0, top: 0 }}>
          {RIDGES.map((_, i) => <path key={i} d={ridgePath(i)} fill={p.ridges[i]} />)}
        </svg>
        <div style={{ display: "flex", fontFamily: "Hanken", fontWeight: 500, fontSize: 28, color: "#46663f" }}>{dict.home.eyebrow}</div>
        <div style={{ display: "flex", marginTop: 18, fontFamily: "Hanken", fontWeight: 800, fontSize: 104, lineHeight: 0.95, letterSpacing: -4, color: p.ink }}>Reynard Ghazy Tsaqif</div>
        <div style={{ display: "flex", marginTop: 26, maxWidth: 820, fontFamily: "Instrument", fontSize: 42, lineHeight: 1.15, color: "#3d4a38" }}>{dict.home.oneLiner}</div>
        <div style={{ display: "flex", position: "absolute", right: 72, bottom: 48, fontFamily: "Hanken", fontWeight: 500, fontSize: 24, color: "#f2ede3" }}>reynarddev.vercel.app</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Hanken", data: bold, weight: 800, style: "normal" },
        { name: "Hanken", data: medium, weight: 500, style: "normal" },
        { name: "Instrument", data: serif, weight: 400, style: "italic" },
      ],
    },
  );
}
