import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Link-preview cards (Telegram, WhatsApp, Facebook, X): 1200×630, in the site's colours.
 * Fonts are TTF cuts of the site's own (app/fonts/og; next/og can't read woff2).
 */
export const OG_SIZE = { width: 1200, height: 630 };

const font = (file: string) => readFile(join(process.cwd(), "app/fonts/og", file));
const fontsPromise = Promise.all([font("jakarta-800.ttf"), font("inter-500.ttf"), font("ethiopic-700.ttf")]);
const iconPromise = readFile(join(process.cwd(), "public/icon-192.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`);

const RIVER = "#0e3d47";
const MARIGOLD = "#f2b134";
const SOFT = "#fbe3a6";

export async function ogCard({ pill, title, lines, footer }: { pill: string; title: string; lines: string[]; footer: string }) {
  const [jakarta, inter, ethiopic] = await fontsPromise;
  const icon = await iconPromise;
  const size = title.length > 60 ? 54 : title.length > 36 ? 66 : 80;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: RIVER, color: "white", padding: "64px 72px", fontFamily: "Inter" }}>
        {/* The river ripples of the site's dark sections. */}
        <div style={{ position: "absolute", right: -160, top: -160, width: 620, height: 620, borderRadius: 9999, border: "2px solid rgba(242,177,52,0.22)", display: "flex" }} />
        <div style={{ position: "absolute", right: -60, top: -60, width: 420, height: 420, borderRadius: 9999, border: "2px solid rgba(255,255,255,0.10)", display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain img */}
          <img src={icon} width={72} height={72} style={{ borderRadius: 18 }} alt="" />
          <div style={{ display: "flex", padding: "10px 22px", borderRadius: 9999, background: MARIGOLD, color: RIVER, fontFamily: "Jakarta", fontSize: 28 }}>{pill}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontFamily: "Jakarta", fontSize: size, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 1000 }}>{title}</div>
          {lines.map((l) => (
            <div key={l} style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.82)" }}>{l}</div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, color: SOFT }}>
          <div style={{ display: "flex", fontFamily: "Jakarta" }}>{footer}</div>
          <div style={{ display: "flex", color: "rgba(255,255,255,0.6)" }}>bulbula-directory.vercel.app</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Jakarta", data: jakarta, weight: 800, style: "normal" },
        { name: "Inter", data: inter, weight: 500, style: "normal" },
        // Amharic names and copy fall back to this.
        { name: "Ethiopic", data: ethiopic, weight: 700, style: "normal" },
      ],
    },
  );
}
