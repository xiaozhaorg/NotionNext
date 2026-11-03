import fs from "node:fs";
import path from "node:path";
import { createElement as e } from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { SITE_HOST, SITE_TITLE } from "./site-meta.mjs";

const ROOT = process.cwd();
const FONTDIR = path.join(process.env.SystemRoot || "C:/Windows", "Fonts");
const REG = path.join(FONTDIR, "Noto Sans SC (TrueType).otf");
const BOLD = path.join(FONTDIR, "Noto Sans SC Bold (TrueType).otf");
const SRC = path.join(ROOT, "src", "content");
const OUT = path.join(ROOT, "public", "images");
fs.mkdirSync(OUT, { recursive: true });

const SITE_NAME = SITE_TITLE;
const SITE_URL = SITE_HOST;

const fontRegular = fs.readFileSync(REG);
const fontBold = fs.readFileSync(BOLD);
const FONTS = [
  { name: "Noto Sans SC", data: fontRegular, weight: 400, style: "normal" },
  { name: "Noto Sans SC", data: fontBold, weight: 700, style: "normal" },
];

// base: 深色渐变双色；accent: 高亮色；glow: 光晕色
const palettes = [
  { base: ["#0f172a", "#312e81"], accent: "#a5b4fc", glow: "#6366f1" },
  { base: ["#1e1b4b", "#6d28d9"], accent: "#d8b4fe", glow: "#a855f7" },
  { base: ["#042f2e", "#065f46"], accent: "#6ee7b7", glow: "#10b981" },
  { base: ["#1f0b13", "#9f1239"], accent: "#fda4af", glow: "#f43f5e" },
  { base: ["#0b1a2e", "#0369a1"], accent: "#7dd3fc", glow: "#0ea5e9" },
  { base: ["#1e1a0b", "#a16207"], accent: "#fcd34d", glow: "#f59e0b" },
  { base: ["#0c1322", "#1e3a5f"], accent: "#93c5fd", glow: "#3b82f6" },
  { base: ["#1a0e22", "#7e22ce"], accent: "#f0abfc", glow: "#d946ef" },
];

function hash(s) {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
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

/* ---------- 绘图基元（全部避免 boxShadow/transform，只用语义安全的渐变/边框） ---------- */
// 光晕：径向渐变圆（resvg 安全）
function glowOrb(size, color, opacity = 0.55, top = 0, left = 0) {
  return e("div", {
    style: {
      position: "absolute", top, left, width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity,
    },
  });
}
// 圆环：描边圆（无阴影）
function ringEl(size, color, sw = 2, op = 0.28, top = 0, left = 0) {
  return e("div", {
    style: {
      position: "absolute", top, left, width: size, height: size, borderRadius: "50%",
      border: `${sw}px solid ${hexA(color, op)}`,
    },
  });
}
// 霓虹点：光晕 + 实心点
function neonDot(top, left, size, color, haloFactor = 2.6, haloOp = 0.5) {
  const H = Math.round(size * haloFactor);
  return [
    glowOrb(H, color, haloOp, top - (H - size) / 2, left - (H - size) / 2),
    e("div", { style: { position: "absolute", top, left, width: size, height: size, borderRadius: "50%", background: color } }),
  ];
}
// 半透明圆（云朵单元等）
function softCircle(size, top, left, op = 0.9) {
  return e("div", {
    style: { position: "absolute", top, left, width: size, height: size, borderRadius: "50%", background: `rgba(255,255,255,${op})` },
  });
}

/* ---------- 主题插画（460x460 画布内，绝对定位） ---------- */
function illCode(accent, glow) {
  const bars = [72, 90, 48, 82, 60, 36];
  const colors = ["rgba(255,255,255,0.85)", accent, "rgba(255,255,255,0.4)", accent, "rgba(255,255,255,0.6)", "rgba(255,255,255,0.3)"];
  return [
    glowOrb(300, glow, 0.5, 80, 80),
    e("div", {
      style: {
        position: "absolute", top: 95, left: 55, width: 350, height: 270, borderRadius: 18,
        background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))",
        border: "1px solid rgba(255,255,255,0.22)",
        display: "flex", flexDirection: "column", padding: 22,
      },
    },
      e("div", { style: { display: "flex", gap: 10 } },
        e("div", { style: { width: 14, height: 14, borderRadius: "50%", background: "#ff5f57" } }),
        e("div", { style: { width: 14, height: 14, borderRadius: "50%", background: "#febc2e" } }),
        e("div", { style: { width: 14, height: 14, borderRadius: "50%", background: "#28c840" } }),
      ),
      e("div", { style: { display: "flex", flexDirection: "column", gap: 15, marginTop: 20 } },
        ...bars.map((w, i) => e("div", { style: { height: 12, borderRadius: 6, width: w + "%", background: colors[i] } })),
      ),
    ),
  ];
}
function illServer(accent, glow) {
  const out = [glowOrb(320, glow, 0.45, 60, 70)];
  for (let i = 0; i < 3; i++) {
    const y = 120 + i * 86;
    out.push(
      e("div", { style: { position: "absolute", top: y, left: 70, width: 300, height: 64, borderRadius: 12, background: "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.2)" } }),
      e("div", { style: { position: "absolute", top: y + 25, left: 92, width: 14, height: 14, borderRadius: "50%", background: accent } }),
      e("div", { style: { position: "absolute", top: y + 24, left: 130, width: 200, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.5)" } }),
      e("div", { style: { position: "absolute", top: y + 42, left: 130, width: 130, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.25)" } }),
    );
  }
  return out;
}
function illCloud(accent, glow) {
  return [
    glowOrb(320, glow, 0.5, 70, 70),
    softCircle(150, 175, 150, 0.92),
    softCircle(120, 205, 75, 0.85),
    softCircle(110, 135, 255, 0.85),
    softCircle(95, 245, 245, 0.8),
    ...neonDot(190, 200, 72, accent, 2.4, 0.55),
  ];
}
function illAi(accent, glow) {
  return [
    glowOrb(340, glow, 0.55, 60, 60),
    ringEl(380, accent, 2, 0.25, 40, 40),
    ringEl(280, accent, 2, 0.3, 90, 90),
    ringEl(180, accent, 2, 0.35, 140, 140),
    ...neonDot(190, 190, 110, accent, 2.0, 0.6),
    ...neonDot(60, 230, 16, accent, 2.4, 0.5),
    ...neonDot(230, 60, 16, accent, 2.4, 0.5),
    ...neonDot(360, 200, 16, "#fff", 2.4, 0.4),
    ...neonDot(200, 360, 16, "#fff", 2.4, 0.4),
  ];
}
function illSecurity(accent, glow) {
  return [
    glowOrb(300, glow, 0.5, 80, 80),
    ringEl(92, accent, 14, 0.9, 120, 184),
    e("div", { style: { position: "absolute", top: 195, left: 150, width: 160, height: 150, borderRadius: 22, background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.22)" } }),
    ...neonDot(255, 213, 28, accent, 2.2, 0.55),
    e("div", { style: { position: "absolute", top: 286, left: 223, width: 14, height: 34, borderRadius: 7, background: accent } }),
  ];
}
function illImage(accent, glow) {
  return [
    glowOrb(300, glow, 0.5, 80, 80),
    e("div", {
      style: {
        position: "absolute", top: 110, left: 80, width: 300, height: 240, borderRadius: 20, overflow: "hidden",
        background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))",
        border: `2px solid ${accent}`,
      },
    },
      e("div", { style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)" } }),
      ...neonDot(40 - 0, 200 - 0, 70, accent, 2.0, 0.55).map((n, i) =>
        i === 1 ? e("div", { ...n.props, style: { ...n.props.style, top: 40, left: 200 } }) : n
      ),
      e("div", { style: { position: "absolute", bottom: 0, left: 0, width: "55%", height: 90, background: "rgba(255,255,255,0.12)" } }),
      e("div", { style: { position: "absolute", bottom: 0, left: "45%", width: "55%", height: 130, background: "rgba(255,255,255,0.08)" } }),
    ),
  ];
}
function illDefault(accent, glow) {
  return [
    glowOrb(340, glow, 0.5, 60, 60),
    ringEl(360, accent, 2, 0.25, 50, 50),
    ringEl(240, accent, 2, 0.3, 110, 110),
    e("div", { style: { position: "absolute", top: 120, left: 90, width: 120, height: 90, borderRadius: 16, background: "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.2)" } }),
    e("div", { style: { position: "absolute", top: 230, left: 250, width: 120, height: 90, borderRadius: 16, background: "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.2)" } }),
    glowOrb(200, accent, 0.35, 210, 170),
    ...neonDot(90, 300, 16, accent, 2.2, 0.5),
    ...neonDot(320, 120, 16, "#fff", 2.2, 0.4),
  ];
}
function kindOf(cat, tags) {
  const s = (cat + " " + tags.join(" ")).toLowerCase();
  if (/cloudflare|cdn|云|cloud|边缘|dns|pages|workers/.test(s)) return "cloud";
  if (/ai|gpt|claude|gemini|大模型|机器|神经|智能|llm|agi|deepseek|kimi/.test(s)) return "ai";
  if (/自托管|self|host|服务器|server|nas|部署|deploy|docker|k8s|运维|r2|tunnel/.test(s)) return "server";
  if (/安全|锁|隐私|密码|security|privacy|vpn|防护|盾|immich|backup/.test(s)) return "security";
  if (/图|image|设计|design|视频|video|摄影|photo|媒|compressor/.test(s)) return "image";
  if (/开发|工具|code|编程|ide|编辑器|框架|前端|后端|教程|tutorial|程序|cursor|vscode|trae|rust|go\b/.test(s)) return "code";
  return "default";
}
function illustration(kind, accent, glow) {
  switch (kind) {
    case "cloud": return illCloud(accent, glow);
    case "ai": return illAi(accent, glow);
    case "server": return illServer(accent, glow);
    case "security": return illSecurity(accent, glow);
    case "image": return illImage(accent, glow);
    case "code": return illCode(accent, glow);
    default: return illDefault(accent, glow);
  }
}

/* ---------- 卡片合成 ---------- */
function buildCard({ title, category, tags }) {
  const pal = palettes[hash(title + (category || "")) % palettes.length];
  const [c1, c2] = pal.base;
  const accent = pal.accent;
  const glow = pal.glow;
  const cat = category || tags[0] || "技术";
  const kind = kindOf(cat, tags);
  const size = title.length <= 12 ? 76 : title.length <= 20 ? 64 : title.length <= 30 ? 54 : title.length <= 44 ? 46 : 38;
  const sub = tags.filter((t) => t !== cat).slice(0, 2).join(" · ");

  const orb1 = glowOrb(560, glow, 0.32, -130, 740);
  const orb2 = glowOrb(380, accent, 0.22, 380, -120);
  const ringDeco = ringEl(720, accent, 1, 0.08, -180, 820);
  const scrim = e("div", {
    style: { position: "absolute", top: 150, left: 0, width: 780, height: 400, background: "linear-gradient(90deg, rgba(0,0,0,0.40), transparent)" },
  });

  const site = e(
    "div",
    { style: { position: "absolute", top: 50, left: 72, display: "flex", alignItems: "center", gap: 14, zIndex: 2 } },
    ...neonDot(50 - 7, 72 - 0, 14, accent, 2.2, 0.5).map((n, i) =>
      i === 1 ? e("div", { ...n.props, style: { ...n.props.style, top: 50, left: 72 } }) : n
    ),
    e("div", { style: { fontSize: 25, fontWeight: 700, letterSpacing: 1, color: "#fff" } }, SITE_NAME)
  );
  const catPill = e(
    "div",
    {
      style: { position: "absolute", top: 44, left: 880, maxWidth: 300, fontSize: 23, fontWeight: 700, padding: "8px 22px", borderRadius: 999, background: accent, color: "#0b1020" },
    },
    cat
  );
  const hero = e(
    "div",
    { style: { position: "absolute", top: 95, left: 715, width: 460, height: 460, zIndex: 1 } },
    ...illustration(kind, accent, glow)
  );
  const titleBlock = e(
    "div",
    { style: { position: "absolute", top: 210, left: 72, width: 630, display: "flex", flexDirection: "column", zIndex: 2 } },
    e("div", { style: { width: 56, height: 6, borderRadius: 3, background: accent, marginBottom: 22 } }),
    e(
      "div",
      { style: { width: "100%", fontSize: size, fontWeight: 700, lineHeight: 1.16, color: "#ffffff", textShadow: "0 4px 30px rgba(0,0,0,0.45)" } },
      title
    ),
    sub
      ? e("div", { style: { width: "100%", marginTop: 20, fontSize: 25, fontWeight: 400, lineHeight: 1.5, color: "rgba(255,255,255,0.72)" } }, sub)
      : null
  );
  const tagsRow = e(
    "div",
    { style: { position: "absolute", top: 562, left: 72, display: "flex", gap: 12, zIndex: 2 } },
    ...tags.slice(0, 3).map((t) =>
      e(
        "div",
        {
          style: {
            fontSize: 21, padding: "6px 16px", borderRadius: 999,
            background: "rgba(255,255,255,0.08)", border: `1px solid ${hexA(accent, 0.4)}`, color: accent,
          },
        },
        "#" + t
      )
    )
  );
  const watermark = e(
    "div",
    { style: { position: "absolute", top: 612, left: 1000, fontSize: 19, fontWeight: 700, color: "rgba(255,255,255,0.8)", zIndex: 2 } },
    SITE_URL
  );

  return e(
    "div",
    {
      style: {
        display: "flex", width: 1200, height: 675,
        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
        color: "#fff", fontFamily: "Noto Sans SC", position: "relative", overflow: "hidden",
      },
    },
    orb1, orb2, ringDeco, scrim, site, catPill, hero, titleBlock, tagsRow, watermark
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
  const failed = [];
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
      try {
        const ok = await genOne(slug, parseFrontmatter(mdFile), outSlug, mdFile);
        ok ? made++ : skipped++;
      } catch (err) {
        failed.push(`${dir}/${slug}`);
        console.error(`FAIL ${dir}/${slug}:`, err && err.message ? err.message : err);
      }
    }
  }
  if (failed.length) console.log("FAILED:", failed.join(", "));
  console.log(`covers: made=${made} skipped=${skipped} failed=${failed.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
