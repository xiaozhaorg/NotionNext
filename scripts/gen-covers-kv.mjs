import fs from "node:fs";
import path from "node:path";
import { createElement as e } from "react";
import satori from "satori";
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

// 比例化布局：所有位置按 W/H 折算，字号按宽度 S 缩放 —— 不再写死像素
function buildKV(fm, accent, kind, text, W, H) {
  const title = text.headline || fm.title || "技术文章";
  const sub = text.subhead || "";
  const cat = fm.category || (fm.tags && fm.tags[0]) || "技术";
  const chips = fm.tags && fm.tags.length ? fm.tags.slice(0, 3) : [cat];
  const S = W / 1200; // 字号缩放因子
  const MX = Math.round(W * 0.13); // 左右安全边距 13%
  // 字号按标题长度分档（已按宽度缩放，缩略图缩小后同步变小）
  const base = title.length <= 7 ? 88 : title.length <= 11 ? 76 : title.length <= 16 ? 64 : title.length <= 22 ? 54 : title.length <= 30 ? 44 : 38;
  const hSize = Math.round(base * S);
  const subSize = Math.round(30 * S);
  const catSize = Math.round(24 * S);
  const chipSize = Math.round(21 * S);

  return e("div", { style: { display: "flex", width: W, height: H, position: "relative", fontFamily: "Noto Sans SC", color: "#fff", overflow: "hidden", background: "linear-gradient(135deg, #070b16 0%, #0c1228 55%, #070b16 100%)" } },
    orb(-120, -160, 520, accent, 0.6),
    orb(W * 0.58, H * 0.65, 560, "#a855f7", 0.34),
    orb(-160, H * 0.56, 460, "#22d3ee", 0.4),
    // 居中徽标（标题背后发光底纹），按画布比例居中
    e("div", { style: { position: "absolute", left: W / 2 - 150, top: H * 0.5 - 200, width: 300, height: 300, opacity: 0.32 } }, emblem(kind, accent)),
    // 左上站点名（内移 10%）
    e("div", { style: { position: "absolute", top: Math.round(H * 0.075), left: Math.round(W * 0.1), display: "flex", alignItems: "center", gap: 14 } },
      e("div", { style: { width: 14, height: 14, borderRadius: 999, background: YELLOW } }),
      e("div", { style: { fontSize: Math.round(24 * S), fontWeight: 700, letterSpacing: 1, color: "#fff" } }, SITE_NAME)),
    // 顶部居中分类胶囊
    e("div", { style: { position: "absolute", top: Math.round(H * 0.085), left: 0, width: W, display: "flex", justifyContent: "center" } },
      e("div", { style: { fontSize: catSize, fontWeight: 700, padding: `${Math.round(10 * S)}px ${Math.round(24 * S)}px`, borderRadius: 999, background: accent, color: "#0b1020" } }, cat)),
    // 中央文字安全带（占 16%~82% 高度，垂直居中），左右 13% 边距
    // 注意：satori 在 flex 容器上设 textAlign 会右移文字，故 textAlign 必须下放到每个文字元素；
    // 且容器不能用 padding 缩窄内容区（satori 的 width:100% 会按父级全宽算），必须用 left+width 定位内容区
    e("div", { style: { position: "absolute", top: Math.round(H * 0.16), left: MX, width: W - MX * 2, height: Math.round(H * 0.64), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } },
      e("div", { style: { width: Math.round(64 * S), height: Math.round(7 * S), borderRadius: 3, background: YELLOW, marginBottom: Math.round(H * 0.035) } }),
      e("div", { style: { width: "100%", textAlign: "center", fontSize: hSize, fontWeight: 700, lineHeight: 1.2, color: "#fff", textShadow: "0 2px 30px rgba(0,0,0,0.6)" } }, title),
      sub ? e("div", { style: { width: "100%", textAlign: "center", marginTop: Math.round(H * 0.04), fontSize: subSize, fontWeight: 700, lineHeight: 1.25, color: YELLOW, textShadow: "0 2px 20px rgba(0,0,0,0.5)" } }, sub) : null),
    // 底部居中标签
    e("div", { style: { position: "absolute", top: Math.round(H * 0.86), left: 0, width: W, display: "flex", justifyContent: "center", gap: Math.round(14 * S) } },
      ...chips.map((t, i) => e("div", { style: { display: "flex", alignItems: "center", gap: Math.round(10 * S), fontSize: chipSize, fontWeight: 700, padding: `${Math.round(9 * S)}px ${Math.round(18 * S)}px`, borderRadius: 999, background: hexA(accent, 0.14), border: `1.5px solid ${hexA(accent, 0.55)}`, color: i === 0 ? YELLOW : accent } },
        e("div", { style: { width: Math.round(11 * S), height: Math.round(11 * S), borderRadius: 999, background: i === 0 ? YELLOW : accent } }), t))),
    // 右下水印（右对齐，离右边 10%）
    e("div", { style: { position: "absolute", top: Math.round(H * 0.9), left: 0, width: W, display: "flex", justifyContent: "flex-end", paddingRight: Math.round(W * 0.1) } },
      e("div", { style: { fontSize: Math.round(19 * S), fontWeight: 700, color: "rgba(255,255,255,0.8)" } }, SITE_URL))
  );
}

async function renderCover(fm, accent, kind, text, W, H) {
  const svg = await satori(buildKV(fm, accent, kind, text || {}, W, H), { width: W, height: H, fonts: FONTS });
  return await new (await import("@resvg/resvg-js")).Resvg(svg, {
    fitTo: { mode: "width", value: W },
    font: { fontFiles: [REG, BOLD], loadSystemFonts: false, defaultFontFamily: "Noto Sans SC" },
  }).render().asPng();
}

async function genOne(slug, fm, outSlug) {
  if (!fm.title) return false;
  const kind = kindOf(fm.category, fm.tags);
  const accent = ACCENT[kind] || ACCENT.default;
  const text = TEXT[outSlug] || {};
  // hero：16:9（文章页真实比例），供 ogImage / -real.webp
  const heroPng = await renderCover(fm, accent, kind, text, 1200, 675);
  fs.writeFileSync(path.join(OUT, `${outSlug}-real.webp`), await sharp(heroPng).webp({ quality: 84 }).toBuffer());
  // 缩略图：16:10（卡片真实比例），零裁切；再缩到 640×400 减小体积
  const thumbPng = await renderCover(fm, accent, kind, text, 1200, 750);
  const thumbBuf = await sharp(thumbPng).resize(640, 400, { fit: "fill" }).webp({ quality: 80 }).toBuffer();
  fs.writeFileSync(path.join(OUT, `${outSlug}-real-thumb.webp`), thumbBuf);
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
