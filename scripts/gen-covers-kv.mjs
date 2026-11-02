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
fs.mkdirSync(OUT, { recursive: true });

const SITE_NAME = "小吒博客";
const SITE_URL = "xiaozha.org";
const YELLOW = "#ffd54a";

// AI 提炼的大小标题：{ [outSlug]: { headline, subhead } }
let TEXT = {};
try { TEXT = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "_covers-text.json"), "utf8")); } catch {}

const fontRegular = fs.readFileSync(REG);
const fontBold = fs.readFileSync(BOLD);
const FONTS = [
  { name: "Noto Sans SC", data: fontRegular, weight: 400, style: "normal" },
  { name: "Noto Sans SC", data: fontBold, weight: 700, style: "normal" },
];

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

function led(d, color) {
  return e("div", { style: { width: d, height: d, borderRadius: 999, background: color, flex: "0 0 auto" } });
}
function orb(x, y, w, color, a) {
  return e("div", { style: { position: "absolute", left: x, top: y, width: w, height: w, borderRadius: 999, background: `radial-gradient(circle at 50% 50%, ${hexA(color, a)} 0%, ${hexA(color, 0)} 70%)` } });
}

function emblem(kind, accent) {
  // 居中的霓虹主题徽标（标题背后的发光底纹），box 300x300，内容居中
  const ring = (d, w, op) => e("div", { style: { position: "absolute", left: 150 - d / 2, top: 150 - d / 2, width: d, height: d, borderRadius: 999, border: `${w}px solid ${hexA(accent, op)}` } });
  if (kind === "ai" || kind === "default") {
    return e("div", { style: { position: "relative", width: 300, height: 300 } },
      ring(260, 3, 0.7), ring(180, 2, 0.5),
      e("div", { style: { position: "absolute", left: 110, top: 110, width: 80, height: 80, borderRadius: 999, background: `radial-gradient(circle at 50% 50%, ${accent} 0%, ${hexA(accent, 0.15)} 100%)` } }),
      e("div", { style: { position: "absolute", left: 44, top: 44, width: 16, height: 16, borderRadius: 999, background: "#fff" } }),
      e("div", { style: { position: "absolute", left: 240, top: 120, width: 12, height: 12, borderRadius: 999, background: YELLOW } }));
  }
  if (kind === "cloud") {
    return e("div", { style: { position: "relative", width: 300, height: 300 } },
      ring(240, 3, 0.6),
      e("div", { style: { position: "absolute", left: 95, top: 95, width: 110, height: 110, borderRadius: 999, background: `radial-gradient(circle, ${hexA("#ffffff", 0.85)} 0%, ${hexA(accent, 0.25)} 100%)` } }),
      e("div", { style: { position: "absolute", left: 60, top: 60, width: 70, height: 70, borderRadius: 999, background: hexA("#bfe9ff", 0.7) } }),
      e("div", { style: { position: "absolute", left: 178, top: 178, width: 58, height: 58, borderRadius: 999, background: hexA(accent, 0.5) } }));
  }
  if (kind === "server") {
    const bar = (t) => e("div", { style: { position: "absolute", left: 30, top: t, width: 240, height: 40, borderRadius: 10, background: hexA("#ffffff", 0.06), border: `2px solid ${hexA(accent, 0.6)}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 } },
      led(14, accent), e("div", { style: { flex: "1 1 auto", height: 8, borderRadius: 4, background: hexA("#ffffff", 0.28) } }));
    return e("div", { style: { position: "relative", width: 300, height: 300 } }, ring(280, 2, 0.4), bar(110), bar(165), bar(220));
  }
  if (kind === "security") {
    return e("div", { style: { position: "relative", width: 300, height: 300 } },
      ring(250, 3, 0.6),
      e("div", { style: { position: "absolute", left: 110, top: 70, width: 80, height: 80, borderRadius: 999, border: `14px solid ${hexA(accent, 0.9)}` } }),
      e("div", { style: { position: "absolute", left: 135, top: 140, width: 30, height: 30, borderRadius: 999, background: "rgba(255,255,255,0.9)" } }));
  }
  if (kind === "code") {
    return e("div", { style: { position: "relative", width: 300, height: 300 } }, ring(280, 2, 0.4),
      e("div", { style: { position: "absolute", left: 40, top: 80, width: 220, height: 150, borderRadius: 16, background: "#0b1020", border: `2px solid ${hexA(accent, 0.7)}`, display: "flex", flexDirection: "column", padding: "16px 18px", gap: 12 } },
        e("div", { style: { display: "flex", gap: 8 } }, led(12, "#ff5f57"), led(12, "#febc2e"), led(12, "#28c840")),
        e("div", { style: { marginTop: 4, height: 9, width: "80%", borderRadius: 5, background: hexA(accent, 0.7) } }),
        e("div", { style: { height: 9, width: "92%", borderRadius: 5, background: hexA("#ffffff", 0.28) } }),
        e("div", { style: { height: 9, width: "70%", borderRadius: 5, background: hexA("#ffffff", 0.22) } })));
  }
  if (kind === "image") {
    return e("div", { style: { position: "relative", width: 300, height: 300 } }, ring(250, 3, 0.6),
      e("div", { style: { position: "absolute", left: 80, top: 90, width: 140, height: 110, borderRadius: 16, border: `3px solid ${hexA(accent, 0.85)}`, background: hexA("#ffffff", 0.04) } }),
      e("div", { style: { position: "absolute", left: 180, top: 60, width: 50, height: 50, borderRadius: 999, background: `radial-gradient(circle, ${YELLOW} 0%, ${hexA(accent, 0.3)} 100%)` } }));
  }
  return e("div", { style: { position: "relative", width: 300, height: 300 } }, ring(240, 3, 0.6));
}

function buildKV(fm, accent, kind, text) {
  const title = text.headline || fm.title || "技术文章";
  const sub = text.subhead || "";
  const cat = fm.category || (fm.tags && fm.tags[0]) || "技术";
  const chips = fm.tags && fm.tags.length ? fm.tags.slice(0, 3) : [cat];
  const size = title.length <= 10 ? 68 : title.length <= 16 ? 56 : title.length <= 22 ? 46 : title.length <= 30 ? 38 : 31;

  return e("div", { style: { display: "flex", width: 1200, height: 675, position: "relative", fontFamily: "Noto Sans SC", color: "#fff", overflow: "hidden", background: "linear-gradient(135deg, #070b16 0%, #0c1228 55%, #070b16 100%)" } },
    orb(-120, -160, 520, accent, 0.6),
    orb(700, 440, 560, "#a855f7", 0.34),
    orb(-160, 380, 460, "#22d3ee", 0.4),
    // 居中徽标（标题背后发光底纹）
    e("div", { style: { position: "absolute", left: 450, top: 52, width: 300, height: 300, opacity: 0.38 } }, emblem(kind, accent)),
    // 顶部居中分类胶囊
    e("div", { style: { position: "absolute", top: 58, left: 450, width: 300, display: "flex", justifyContent: "center" } },
      e("div", { style: { fontSize: 22, fontWeight: 700, padding: "9px 22px", borderRadius: 999, background: accent, color: "#0b1020" } }, cat)),
    // 居中标题列（左右留出安全边距，避开卡片横向裁切）
    e("div", { style: { position: "absolute", top: 268, left: 0, width: 1200, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 130px" } },
      e("div", { style: { width: 56, height: 6, borderRadius: 3, background: YELLOW, marginBottom: 20 } }),
      e("div", { style: { width: "100%", fontSize: size, fontWeight: 700, lineHeight: 1.18, color: "#fff", textShadow: "0 2px 26px rgba(0,0,0,0.55)" } }, title),
      sub ? e("div", { style: { marginTop: 18, fontSize: 26, fontWeight: 700, color: YELLOW, textShadow: "0 2px 18px rgba(0,0,0,0.45)" } }, sub) : null),
    // 底部居中标签
    e("div", { style: { position: "absolute", top: 556, left: 0, width: 1200, display: "flex", justifyContent: "center", gap: 12 } },
      ...chips.map((t, i) => e("div", { style: { display: "flex", alignItems: "center", gap: 9, fontSize: 20, fontWeight: 700, padding: "8px 18px", borderRadius: 999, background: hexA(accent, 0.14), border: `1.5px solid ${hexA(accent, 0.55)}`, color: i === 0 ? YELLOW : accent } },
        e("div", { style: { width: 10, height: 10, borderRadius: 999, background: i === 0 ? YELLOW : accent } }), t))),
    e("div", { style: { position: "absolute", top: 52, left: 72, display: "flex", alignItems: "center", gap: 14 } },
      e("div", { style: { width: 14, height: 14, borderRadius: 999, background: YELLOW } }),
      e("div", { style: { fontSize: 24, fontWeight: 700, letterSpacing: 1, color: "#fff" } }, SITE_NAME)),
    e("div", { style: { position: "absolute", top: 612, left: 1004, fontSize: 19, fontWeight: 700, color: "rgba(255,255,255,0.8)" } }, SITE_URL)
  );
}

async function renderCover(fm, accent, kind, text) {
  const svg = await satori(buildKV(fm, accent, kind, text || {}), { width: 1200, height: 675, fonts: FONTS });
  return await new (await import("@resvg/resvg-js")).Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { fontFiles: [REG, BOLD], loadSystemFonts: false, defaultFontFamily: "Noto Sans SC" },
  }).render().asPng();
}

async function genOne(slug, fm, outSlug) {
  if (!fm.title) return false;
  const kind = kindOf(fm.category, fm.tags);
  const accent = ACCENT[kind] || ACCENT.default;
  const png = await renderCover(fm, accent, kind, TEXT[outSlug] || {});
  const full = await sharp(png).webp({ quality: 84 }).toBuffer();
  fs.writeFileSync(path.join(OUT, `${outSlug}-real.webp`), full);
  fs.writeFileSync(path.join(OUT, `${outSlug}-real-thumb.webp`), await sharp(full).resize(640, 360).webp({ quality: 80 }).toBuffer());
  return true;
}

async function main() {
  const only = process.argv[2];
  let made = 0, failed = [];
  for (const [dir, suffixed] of [["posts", false], ["posts-en", true]]) {
    const base = path.join(SRC, dir);
    if (!fs.existsSync(base)) continue;
    for (const f of fs.readdirSync(base)) {
      if (!f.endsWith(".md")) continue;
      const slug = f.replace(/\.md$/, "");
      if (only && slug !== only) continue;
      const outSlug = suffixed ? `${slug}-en` : slug;
      try {
        const ok = await genOne(slug, parseFrontmatter(path.join(base, f)), outSlug);
        ok ? made++ : console.log("skip", dir, slug);
      } catch (err) {
        failed.push(`${dir}/${slug}`);
        console.error(`FAIL ${dir}/${slug}:`, err && err.message ? err.message : err);
      }
    }
  }
  if (failed.length) console.log("FAILED:", failed.join(", "));
  console.log(`covers: made=${made} failed=${failed.length}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
