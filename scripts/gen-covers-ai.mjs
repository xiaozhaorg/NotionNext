import fs from "node:fs";
import path from "node:path";
import { createElement as e } from "react";
import satori from "satori";
import sharp from "sharp";

const ROOT = process.cwd();
const FONTDIR = path.join(process.env.SystemRoot || "C:/Windows", "Fonts");
const REG = path.join(FONTDIR, "Noto Sans SC (TrueType).otf");
const BOLD = path.join(FONTDIR, "Noto Sans SC Bold (TrueType).otf");
const SRC = path.join(ROOT, "src", "content");
const OUT = path.join(ROOT, "public", "images");
const AI = path.join(ROOT, "public", "images", "_ai");
fs.mkdirSync(OUT, { recursive: true });

const SITE_NAME = "小吒博客";
const SITE_URL = "xiaozha.org";

const fontRegular = fs.readFileSync(REG);
const fontBold = fs.readFileSync(BOLD);
const FONTS = [
  { name: "Noto Sans SC", data: fontRegular, weight: 400, style: "normal" },
  { name: "Noto Sans SC", data: fontBold, weight: 700, style: "normal" },
];

function hash(s) {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function parseFrontmatter(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const block = raw.split("---")[1] ?? "";
  const get = (k) => {
    const m = new RegExp(`^${k}:\\s*["']?([^"'\n]+)`, "m").exec(block);
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  const title = get("title");
  const category = get("category");
  let tags = [];
  const tb = /^tags:\n((?:[ \t]*-[ \t]*.+\n?)+)/m.exec(block);
  if (tb) {
    tags = tb[1].split("\n").filter(Boolean).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  } else {
    const tf = /^tags:\s*\[([^\]]*)\]/m.exec(block);
    if (tf) tags = tf[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  return { title, category, tags };
}

const ACCENT = {
  code: "#3b82f6", server: "#10b981", cloud: "#0ea5e9", ai: "#a855f7",
  security: "#f43f5e", image: "#f59e0b", default: "#6366f1",
};
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

function findAi(baseSlug) {
  const dir = path.join(AI, baseSlug);
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).find((x) => x.endsWith(".png"));
  return f ? path.join(dir, f) : null;
}

// 透明文字层（叠加在 AI 主视觉上）
function textLayer({ title, category, tags, accent }) {
  const cat = category || tags[0] || "技术";
  const size = title.length <= 12 ? 74 : title.length <= 20 ? 62 : title.length <= 30 ? 52 : title.length <= 44 ? 44 : 36;
  const sub = tags.filter((t) => t !== cat).slice(0, 2).join(" · ");

  const scrimL = e("div", { style: { position: "absolute", top: 0, left: 0, width: 800, height: 675, background: "linear-gradient(90deg, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.34) 46%, rgba(0,0,0,0) 74%)" } });
  const scrimB = e("div", { style: { position: "absolute", bottom: 0, left: 0, width: 1200, height: 240, background: "linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)" } });

  const site = e("div", { style: { position: "absolute", top: 52, left: 72, display: "flex", alignItems: "center", gap: 14, zIndex: 3 } },
    e("div", { style: { width: 14, height: 14, borderRadius: "50%", background: accent } }),
    e("div", { style: { fontSize: 24, fontWeight: 700, letterSpacing: 1, color: "#fff" } }, SITE_NAME));

  const catPill = e("div", { style: { position: "absolute", top: 46, left: 884, maxWidth: 300, fontSize: 22, fontWeight: 700, padding: "8px 22px", borderRadius: 999, background: accent, color: "#0b1020" } }, cat);

  const titleBlock = e("div", { style: { position: "absolute", top: 205, left: 72, width: 660, display: "flex", flexDirection: "column", zIndex: 3 } },
    e("div", { style: { width: 56, height: 6, borderRadius: 3, background: accent, marginBottom: 22 } }),
    e("div", { style: { width: "100%", fontSize: size, fontWeight: 700, lineHeight: 1.16, color: "#ffffff", textShadow: "0 4px 28px rgba(0,0,0,0.55)" } }, title),
    sub ? e("div", { style: { width: "100%", marginTop: 20, fontSize: 24, fontWeight: 400, lineHeight: 1.5, color: "rgba(255,255,255,0.78)" } }, sub) : null);

  const tagsRow = e("div", { style: { position: "absolute", top: 565, left: 72, display: "flex", gap: 12, zIndex: 3 } },
    ...tags.slice(0, 3).map((t) => e("div", { style: { fontSize: 20, padding: "6px 16px", borderRadius: 999, background: "rgba(255,255,255,0.10)", border: `1px solid ${hexA(accent, 0.45)}`, color: accent } }, "#" + t)));

  const watermark = e("div", { style: { position: "absolute", top: 612, left: 1004, fontSize: 19, fontWeight: 700, color: "rgba(255,255,255,0.82)", zIndex: 3 } }, SITE_URL);

  return e("div", { style: { display: "flex", width: 1200, height: 675, position: "relative", fontFamily: "Noto Sans SC", color: "#fff" } },
    scrimL, scrimB, site, catPill, titleBlock, tagsRow, watermark);
}

async function renderTextLayer(fm, accent) {
  return await satori(textLayer({ ...fm, accent }), { width: 1200, height: 675, fonts: FONTS });
}

function ensureEnOgImage(mdFile, slug, outSlug) {
  const raw = fs.readFileSync(mdFile, "utf8");
  const re = new RegExp(`ogImage:\\s*["']/images/${slug}-real\\.(?:jpg|jpeg|png|webp)["']`);
  if (re.test(raw)) {
    fs.writeFileSync(mdFile, raw.replace(re, `ogImage: "/images/${outSlug}-real.jpg"`));
  }
}

async function genOne(slug, fm, outSlug, mdFile) {
  if (!fm.title) return false;
  const baseSlug = slug.replace(/-en$/, "");
  const aiPath = findAi(baseSlug);
  if (!aiPath) { console.error(`NO AI IMAGE for ${baseSlug}`); return false; }
  const kind = kindOf(fm.category, fm.tags);
  const accent = ACCENT[kind] || ACCENT.default;

  const svg = await renderTextLayer(fm, accent);
  const textPng = await new (await import("@resvg/resvg-js")).Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { fontFiles: [REG, BOLD], loadSystemFonts: false, defaultFontFamily: "Noto Sans SC" },
  }).render().asPng();

  const base = sharp(aiPath).resize(1200, 675, { fit: "cover", position: "centre" });
  const fullBuf = await base
    .composite([{ input: textPng, top: 0, left: 0, blend: "over" }])
    .webp({ quality: 82 })
    .toBuffer();

  fs.writeFileSync(path.join(OUT, `${outSlug}-real.webp`), fullBuf);
  fs.writeFileSync(path.join(OUT, `${outSlug}-real-thumb.webp`), await sharp(fullBuf).resize(640, 360).webp({ quality: 80 }).toBuffer());

  if (mdFile && outSlug !== slug) ensureEnOgImage(mdFile, slug, outSlug);
  return true;
}

async function main() {
  const only = process.argv[2];
  let made = 0, skipped = 0, failed = [];
  for (const [dir, suffixed] of [["posts", false], ["posts-en", true]]) {
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

main().catch((err) => { console.error(err); process.exit(1); });
