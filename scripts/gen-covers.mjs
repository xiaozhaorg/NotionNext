import fs from "node:fs";
import path from "node:path";
import { createElement as e } from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const ROOT = process.cwd();
const FONTDIR = path.join(process.env.SystemRoot || "C:/Windows", "Fonts");
const REG = path.join(FONTDIR, "Noto Sans SC (TrueType).otf");
const BOLD = path.join(FONTDIR, "Noto Sans SC Bold (TrueType).otf");
const SRC = path.join(ROOT, "src", "content");
const OUT = path.join(ROOT, "public", "images");
fs.mkdirSync(OUT, { recursive: true });

const SITE_NAME = "小吒博客";
const SITE_URL = "xiaozha.org";

const fontRegular = fs.readFileSync(REG);
const fontBold = fs.readFileSync(BOLD);
const FONTS = [
  { name: "Noto Sans SC", data: fontRegular, weight: 400, style: "normal" },
  { name: "Noto Sans SC", data: fontBold, weight: 700, style: "normal" },
];

const palettes = [
  ["#0f172a", "#312e81"],
  ["#1e1b4b", "#6d28d9"],
  ["#042f2e", "#065f46"],
  ["#1f0b13", "#9f1239"],
  ["#0b1a2e", "#0369a1"],
  ["#1e1a0b", "#a16207"],
  ["#0c1322", "#1e3a5f"],
  ["#1a0e22", "#7e22ce"],
];

function hash(s) {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function parseFrontmatter(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const block = raw.split("---")[1] ?? "";
  const get = (k) => {
    const m = new RegExp(`^${k}:\\s*["']?([^"'\\n]+)`, "m").exec(block);
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  const title = get("title");
  const category = get("category");
  const description = get("description");
  let tags = [];
  const tb = /^tags:\n((?:[ \t]*-[ \t]*.+\n?)+)/m.exec(block);
  if (tb) {
    tags = tb[1]
      .split("\n")
      .filter(Boolean)
      .map((l) => l.replace(/^\s*-\s*/, "").trim())
      .filter(Boolean);
  } else {
    const tf = /^tags:\s*\[([^\]]*)\]/m.exec(block);
    if (tf)
      tags = tf[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
  }
  return { title, category, description, tags };
}

function buildCard({ title, category, tags }) {
  const [c1, c2] = palettes[hash(title + (category || "")) % palettes.length];
  const cat = category || tags[0] || "技术";
  const labelTags = tags.slice(0, 3).map((t) => "#" + t);
  const size = title.length <= 12 ? 78 : title.length <= 20 ? 66 : title.length <= 30 ? 56 : title.length <= 44 ? 46 : 38;
  const sub = tags.filter((t) => t !== cat).slice(0, 2).join(" · ");

  const deco1 = e("div", {
    style: {
      position: "absolute",
      right: -180,
      top: -180,
      width: 560,
      height: 560,
      borderRadius: "50%",
      border: "64px solid rgba(255,255,255,0.06)",
    },
  });
  const deco2 = e("div", {
    style: {
      position: "absolute",
      left: -140,
      bottom: -160,
      width: 460,
      height: 460,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(251,191,36,0.20), transparent 70%)",
    },
  });
  const site = e(
    "div",
    { style: { position: "absolute", top: 56, left: 72, display: "flex", alignItems: "center", gap: 16, zIndex: 1 } },
    e("div", { style: { width: 14, height: 14, borderRadius: "50%", background: "#fbbf24" } }),
    e("div", { style: { fontSize: 26, fontWeight: 700, letterSpacing: 1, color: "#fff" } }, SITE_NAME)
  );
  const catPill = e(
    "div",
    {
      style: {
        position: "absolute",
        top: 48,
        left: 830,
        maxWidth: 320,
        fontSize: 24,
        fontWeight: 700,
        padding: "6px 20px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.2)",
        border: "1px solid rgba(255,255,255,0.3)",
        color: "#fff",
      },
    },
    cat
  );
  const mid = e(
    "div",
    { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", zIndex: 1 } },
    e(
      "div",
      {
        style: {
          width: "100%",
          fontSize: size,
          fontWeight: 700,
          lineHeight: 1.18,
          color: "#ffffff",
          textShadow: "0 4px 28px rgba(0,0,0,0.35)",
        },
      },
      title
    ),
    sub
      ? e(
          "div",
          {
            style: {
              width: "100%",
              marginTop: 22,
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.72)",
            },
          },
          sub
        )
      : null
  );
  const tagsRow = e(
    "div",
    { style: { position: "absolute", top: 556, left: 72, display: "flex", gap: 12, zIndex: 1 } },
    ...labelTags.map((t) =>
      e(
        "div",
        {
          style: {
            fontSize: 22,
            padding: "6px 16px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fde68a",
          },
        },
        t
      )
    )
  );
  const watermark = e(
    "div",
    { style: { position: "absolute", top: 562, left: 980, fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.85)", zIndex: 1 } },
    SITE_URL
  );

  return e(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: 1200,
        height: 675,
        padding: "60px 72px",
        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
        color: "#fff",
        fontFamily: "Noto Sans SC",
        position: "relative",
        overflow: "hidden",
      },
    },
    deco1,
    deco2,
    site,
    catPill,
    mid,
    tagsRow,
    watermark
  );
}

// 英文篇：若 ogImage 仍指向 -real（中文封面），改为指向 -en-real（英文独立封面），保持幂等
function ensureEnOgImage(mdFile, slug, outSlug) {
  const raw = fs.readFileSync(mdFile, "utf8");
  const re = new RegExp(`ogImage:\\s*["']/images/${slug}-real\\.(?:jpg|jpeg|png|webp)["']`);
  if (re.test(raw)) {
    const next = raw.replace(re, `ogImage: "/images/${outSlug}-real.jpg"`);
    fs.writeFileSync(mdFile, next);
  }
}

async function genOne(slug, fm, outSlug, mdFile) {
  if (!fm.title) return false;
  const svg = await satori(buildCard(fm), {
    width: 1200,
    height: 675,
    fonts: FONTS,
  });
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: {
      fontFiles: [REG, BOLD],
      loadSystemFonts: false,
      defaultFontFamily: "Noto Sans SC",
    },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(
    path.join(OUT, `${outSlug}-real.webp`),
    await sharp(png).webp({ quality: 82 }).toBuffer()
  );
  fs.writeFileSync(
    path.join(OUT, `${outSlug}-real-thumb.webp`),
    await sharp(png).resize(640, 360).webp({ quality: 80 }).toBuffer()
  );
  if (mdFile && outSlug !== slug) ensureEnOgImage(mdFile, slug, outSlug);
  return true;
}

async function main() {
  const only = process.argv[2];
  let made = 0;
  let skipped = 0;
  for (const [dir, suffixed] of [
    ["posts", false],
    ["posts-en", true],
  ]) {
    const base = path.join(SRC, dir);
    if (!fs.existsSync(base)) continue;
    for (const f of fs.readdirSync(base)) {
      if (!f.endsWith(".md")) continue;
      const slug = f.replace(/\.md$/, "");
      if (only && slug !== only) continue;
      const outSlug = suffixed ? `${slug}-en` : slug;
      const mdFile = path.join(base, f);
      const ok = await genOne(slug, parseFrontmatter(mdFile), outSlug, mdFile);
      ok ? made++ : skipped++;
    }
  }
  console.log(`covers: made=${made} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
