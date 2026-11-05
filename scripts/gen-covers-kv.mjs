import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createElement as e } from "react";
import satori from "satori";
import sharp from "sharp";
import { SITE_HOST, SITE_TITLE } from "./site-meta.mjs";

const ROOT = process.cwd();
const FONTDIR = path.join(process.env.SystemRoot || "C:/Windows", "Fonts");
const BOLD = path.join(FONTDIR, "Noto Sans SC Bold (TrueType).otf");
// 900 字重字体不入库：固定放仓库外，可用环境变量 / CLI 参数覆盖
const BLACK_DEFAULT = "F:/AppData/Temp/covers-sample/fonts/NotoSansSC-Black.otf";
const ARGS = process.argv.slice(2);
const FONT_ARG = (ARGS.find((a) => a.startsWith("--font=")) || "").split("=")[1];
const BLACK = FONT_ARG || process.env.COVER_FONT_BLACK || BLACK_DEFAULT;

const SRC = path.join(ROOT, "src", "content");
const OUT = path.join(ROOT, "public", "images");
const REPORT = "F:/AppData/Temp/covers-sample/cover-report.json";
fs.mkdirSync(OUT, { recursive: true });

const SITE_NAME = SITE_TITLE;
const SITE_URL = SITE_HOST;
const YELLOW = "#ffd23f";
const CYAN = "#35e0f0";
const BASE = "#030917";

// AI 提炼的大小标题：{ [outSlug]: { headline, subhead } }
let TEXT = {};
try { TEXT = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "_covers-text.json"), "utf8")); } catch {}

const hasBlack = fs.existsSync(BLACK);
const fontBold = fs.readFileSync(BOLD);
const fontBlack = hasBlack ? fs.readFileSync(BLACK) : null;
const WEIGHT = hasBlack ? 900 : 700;
const FONT_FILES = hasBlack ? [BOLD, BLACK] : [BOLD];
const FONTS = hasBlack
  ? [{ name: "Noto Sans SC", data: fontBold, weight: 700, style: "normal" }, { name: "Noto Sans SC", data: fontBlack, weight: 900, style: "normal" }]
  : [{ name: "Noto Sans SC", data: fontBold, weight: 700, style: "normal" }];

const ACCENT = {
  code: "#3b82f6", server: "#10b981", cloud: "#0ea5e9", ai: "#a855f7",
  security: "#f43f5e", image: "#f59e0b", default: "#6366f1",
};
function kindOf(cat, tags) {
  const s = (cat + " " + tags.join(" ")).toLowerCase();
  if (/cloudflare|cdn|云|cloud|边缘|dns|pages|workers|vercel/.test(s)) return "cloud";
  if (/ai|gpt|claude|gemini|大模型|机器|神经|智能|llm|agi|deepseek|kimi|agent|代理/.test(s)) return "ai";
  if (/自托管|self|host|服务器|server|nas|部署|deploy|docker|k8s|运维|r2|tunnel/.test(s)) return "server";
  if (/安全|锁|隐私|密码|security|privacy|vpn|防护|盾|backup|邮箱|email/.test(s)) return "security";
  if (/图|image|设计|design|视频|video|摄影|photo|媒/.test(s)) return "image";
  if (/开发|工具|code|编程|ide|编辑器|框架|前端|后端|教程|tutorial|程序|cursor|vscode|trae|rust|go\b/.test(s)) return "code";
  return "default";
}

function parseFrontmatter(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const block = raw.split("---")[1] ?? "";
  const get = (k) => {
    const m = new RegExp(`^${k}:\\s*["']?([^"'\\n]+)`, "m").exec(block);
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  let tags = [];
  const tb = /^tags:\n((?:[ \t]*-[ \t]*.+\n?)+)/m.exec(block);
  if (tb) tags = tb[1].split("\n").filter(Boolean).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  else {
    const tf = /^tags:\s*\[([^\]]*)\]/m.exec(block);
    if (tf) tags = tf[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  return { title: get("title"), category: get("category"), tags };
}

/* ---------- 精确字宽（直接读入字体的字距）+ 断行 ---------- */
// 字宽直接取字体真实字距（opentype.js 是 satori 自带的传递依赖，未新增依赖）
let measureFont = null, UPM = 1000;
try {
  const opentype = createRequire(import.meta.url)("@shuding/opentype.js");
  const buf = fs.readFileSync(hasBlack ? BLACK : BOLD);
  measureFont = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  UPM = measureFont.unitsPerEm;
} catch { measureFont = null; }
const ADV = new Map();
const FALLBACK_W = (ch) => (/[\u2e80-\u9fff\uff00-\uffef\u3000-\u303f]/.test(ch) ? 1 : ch === " " ? 0.3 : /[A-Z]/.test(ch) ? 0.68 : /[a-z]/.test(ch) ? 0.55 : /[0-9]/.test(ch) ? 0.6 : 0.4);
function emOf(s) {
  let adv = 0;
  for (const ch of s) {
    let a = ADV.get(ch);
    if (a === undefined) {
      a = measureFont ? (measureFont.charToGlyph(ch).advanceWidth || UPM * 0.5) / UPM : FALLBACK_W(ch);
      ADV.set(ch, a);
    }
    adv += a;
  }
  return adv;
}
function measure(s, size) { return emOf(s) * size * 1.02; } // 2% 安全余量，避免贴着站徽

function tokenize(text) {
  const tokens = [];
  let buf = "";
  for (const ch of text) {
    if (/[A-Za-z0-9+.#/–-]/.test(ch)) buf += ch;
    else {
      if (buf) { tokens.push(buf); buf = ""; }
      tokens.push(ch === " " ? " " : ch);
    }
  }
  if (buf) tokens.push(buf);
  return tokens;
}

function partition(tokens, avail, size, N) {
  const n = tokens.length;
  const w = (i, j) => measure(tokens.slice(i, j).join(""), size);
  const cost = [], prev = [];
  for (let k = 0; k <= N; k++) { cost.push(new Array(n + 1).fill(Infinity)); prev.push(new Array(n + 1).fill(-1)); }
  cost[0][0] = 0;
  for (let k = 1; k <= N; k++) {
    for (let j = 1; j <= n; j++) {
      for (let i = k - 1; i < j; i++) {
        if (cost[k - 1][i] === Infinity) continue;
        const width = w(i, j);
        if (width > avail) continue;
        const c = cost[k - 1][i] + width * width;
        if (c < cost[k][j]) { cost[k][j] = c; prev[k][j] = i; }
      }
    }
  }
  if (cost[N][n] === Infinity) return null;
  const lines = [];
  let j = n;
  for (let k = N; k > 0; k--) { const i = prev[k][j]; lines.unshift(tokens.slice(i, j).join("").trim()); j = i; }
  return lines;
}

function stripEdge(l) { return l.replace(/^[，。、；：）】」』｜|,.!?]+/, "").replace(/[｜|]+$/, ""); }

function scanFit(tokens, avail, maxSize, minSize, N) {
  for (let size = maxSize; size >= minSize; size--) {
    const lines = partition(tokens, avail, size, N)?.map(stripEdge);
    if (!lines) continue;
    const widths = lines.map((l) => measure(l, size));
    if (!widths.every((w) => w <= avail)) continue;
    if (N > 1 && widths.at(-1) < avail * 0.3) continue;
    return { size, lines, N };
  }
  return null;
}

function fitOne(text, avail, maxSize, minSize) {
  const size = Math.min(maxSize, Math.floor(avail / measure(text, 1)));
  return size >= minSize ? { size, lines: [text], N: 1 } : null;
}

/** 多个候选取字号最大者；行数更多但涨幅不足 25% 时保留行数少的 */
function pickBest(cands) {
  let best = null;
  for (const c of cands) {
    if (!c) continue;
    if (!best) { best = c; continue; }
    if (c.size > best.size && (c.N <= best.N || c.size >= best.size * 1.25)) best = c;
    else if (c.size === best.size && c.N < best.N) best = c;
  }
  return best;
}

/**
 * 字号分档（上限，再按可用宽度自适应收缩）：
 * 短标题给足气势，长标题保可读；任意长度最多 3 行。
 */
function tierMax(units, hero) {
  const t = units <= 10 ? 96 : units <= 16 ? 90 : units <= 24 ? 80 : units <= 34 ? 70 : units <= 46 ? 60 : units <= 60 ? 54 : 46;
  return hero ? t : Math.round(t * 0.65);
}

function bestFit(text, avail, maxSize, minSize) {
  // 1) 按中文标点断句，避免把词劈开
  const phrases = text.split(/([，,：:；;｜|、])/).reduce((arr, s) => {
    if (!s) return arr;
    if (/^[，,：:；;｜|、]$/.test(s) && arr.length) arr[arr.length - 1] += s;
    else arr.push(s);
    return arr;
  }, []).map((s) => s.trim()).filter(Boolean).map((p) => p.replace(/[｜|]+$/, ""));

  let phrase = null;
  if (phrases.length >= 2 && phrases.length <= 3) {
    for (let size = maxSize; size >= minSize; size--) {
      const ws = phrases.map((p) => measure(p, size));
      const wide = Math.max(...ws);
      if (ws.every((w) => w <= avail) && ws.every((w) => w >= avail * 0.22 && w >= wide * 0.42)) {
        phrase = { size, lines: phrases, N: phrases.length };
        break;
      }
    }
  }

  // 2) 单行 / 两行 / 三行候选：取字号最大者（行数多但提升不足 12% 时不换）
  const tokens = tokenize(text);
  const dp = pickBest([
    fitOne(text, avail, maxSize, minSize),
    scanFit(tokens, avail, maxSize, minSize, 2),
    scanFit(tokens, avail, maxSize, minSize, 3),
  ]);
  // 标点断句只有在字号不明显吃亏时才采用（保住自然断句）
  if (phrase && (!dp || phrase.size >= dp.size * 0.78)) return phrase;
  if (dp) return dp;
  // 兜底：继续缩小直到能塞进 3 行（极端长标题）
  for (let size = minSize - 1; size >= 10; size--) {
    const lines = partition(tokens, avail, size, 3);
    if (lines) return { size, lines: lines.map(stripEdge), N: 3 };
  }
  return { size: 10, lines: partition(tokens, avail, 10, 3) || [text], N: 3, overflow: true };
}

/* ---------- 关键词跳色 ---------- */
const KW = /(免费|开源|部署|教程|指南|实测|评测|对比|完全|一键|专属|搭建|必看|零成本|本地|自托管)/;
function colorize(line, state) {
  const segs = [];
  let rest = line;
  const push = (t, c) => { if (t) segs.push({ t, c }); };
  if (!state.kwUsed) {
    const m = KW.exec(rest);
    if (m) { push(rest.slice(0, m.index), "#ffffff"); push(m[0], YELLOW); state.kwUsed = true; rest = rest.slice(m.index + m[0].length); }
  }
  if (rest && !state.latinUsed) {
    const m = /[A-Za-z][A-Za-z0-9+.#:/-]*/.exec(rest);
    if (m) { push(rest.slice(0, m.index), "#ffffff"); push(m[0], CYAN); state.latinUsed = true; rest = rest.slice(m.index + m[0].length); }
  }
  if (rest && !state.numUsed) {
    const m = /[0-9]+[+A-Za-z%]*/.exec(rest);
    if (m) { push(rest.slice(0, m.index), "#ffffff"); push(m[0], YELLOW); state.numUsed = true; rest = rest.slice(m.index + m[0].length); }
  }
  push(rest, "#ffffff");
  return segs.length ? segs : [{ t: line, c: "#ffffff" }];
}

/* ---------- 背景与站徽 ---------- */
function glow(size, color, a, top, left) {
  return e("div", { style: { position: "absolute", top, left, width: size, height: size, borderRadius: 999, background: `radial-gradient(circle, ${color} 0%, transparent 68%)`, opacity: a } });
}
function grid(W, H) {
  const out = [];
  const step = Math.round(W / 26);
  for (let x = W * 0.55; x < W; x += step) out.push(e("div", { style: { position: "absolute", left: Math.round(x), top: 0, width: 1, height: H, background: "rgba(88,166,255,0.13)" } }));
  for (let y = 0; y < H; y += step) out.push(e("div", { style: { position: "absolute", left: Math.round(W * 0.52), top: y, width: Math.round(W * 0.48), height: 1, background: "rgba(88,166,255,0.10)" } }));
  [[0.62, 0.18], [0.74, 0.34], [0.86, 0.62], [0.68, 0.82], [0.9, 0.24]].forEach(([x, y]) => {
    out.push(e("div", { style: { position: "absolute", left: Math.round(W * x), top: Math.round(H * y), width: 5, height: 5, borderRadius: 999, background: "rgba(53,224,240,0.5)" } }));
  });
  return out;
}
function emblem(kind, accent, s) {
  const ring = (d, w, op) => e("div", { style: { position: "absolute", left: (s - d) / 2, top: (s - d) / 2, width: d, height: d, borderRadius: 999, border: `${w}px solid ${accent}`, opacity: op } });
  const base = { position: "relative", width: s, height: s, opacity: 0.9 };
  if (kind === "ai" || kind === "default") {
    return e("div", { style: base },
      ring(s * 0.86, 3, 0.75), ring(s * 0.6, 2, 0.5),
      e("div", { style: { position: "absolute", left: s * 0.42, top: s * 0.42, width: s * 0.16, height: s * 0.16, borderRadius: 999, border: `3px solid ${accent}`, opacity: 0.9 } }),
      e("div", { style: { position: "absolute", left: s * 0.15, top: s * 0.15, width: s * 0.05, height: s * 0.05, borderRadius: 999, background: "#fff" } }),
      e("div", { style: { position: "absolute", left: s * 0.79, top: s * 0.4, width: s * 0.04, height: s * 0.04, borderRadius: 999, background: YELLOW } }));
  }
  if (kind === "cloud") {
    return e("div", { style: base }, ring(s * 0.8, 3, 0.6),
      e("div", { style: { position: "absolute", left: s * 0.32, top: s * 0.32, width: s * 0.36, height: s * 0.36, borderRadius: 999, background: "rgba(255,255,255,0.85)" } }),
      e("div", { style: { position: "absolute", left: s * 0.2, top: s * 0.2, width: s * 0.23, height: s * 0.23, borderRadius: 999, background: "rgba(191,233,255,0.7)" } }),
      e("div", { style: { position: "absolute", left: s * 0.6, top: s * 0.6, width: s * 0.19, height: s * 0.19, borderRadius: 999, background: `${accent}88` } }));
  }
  if (kind === "server") {
    const bar = (t) => e("div", { style: { position: "absolute", left: s * 0.1, top: s * t, width: s * 0.8, height: s * 0.13, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: `2px solid ${accent}`, display: "flex", alignItems: "center", padding: "0 12px", gap: 10 } },
      e("div", { style: { width: 12, height: 12, borderRadius: 999, background: accent } }),
      e("div", { style: { flex: "1 1 auto", height: 8, borderRadius: 4, background: "rgba(255,255,255,0.28)" } }));
    return e("div", { style: base }, ring(s * 0.9, 2, 0.4), bar(0.37), bar(0.55), bar(0.73));
  }
  if (kind === "security") {
    return e("div", { style: base }, ring(s * 0.84, 3, 0.6),
      e("div", { style: { position: "absolute", left: s * 0.37, top: s * 0.24, width: s * 0.27, height: s * 0.27, borderRadius: 999, border: `${Math.round(s * 0.05)}px solid ${accent}` } }),
      e("div", { style: { position: "absolute", left: s * 0.45, top: s * 0.47, width: s * 0.1, height: s * 0.1, borderRadius: 999, background: "rgba(255,255,255,0.9)" } }));
  }
  if (kind === "code") {
    return e("div", { style: base }, ring(s * 0.9, 2, 0.4),
      e("div", { style: { position: "absolute", left: s * 0.13, top: s * 0.27, width: s * 0.74, height: s * 0.5, borderRadius: 16, background: "#0b1020", border: `2px solid ${accent}`, display: "flex", flexDirection: "column", padding: "16px 18px", gap: 12 } },
        e("div", { style: { display: "flex", gap: 8 } },
          e("div", { style: { width: 12, height: 12, borderRadius: 999, background: "#ff5f57" } }),
          e("div", { style: { width: 12, height: 12, borderRadius: 999, background: "#febc2e" } }),
          e("div", { style: { width: 12, height: 12, borderRadius: 999, background: "#28c840" } })),
        e("div", { style: { marginTop: 6, height: 9, width: "80%", borderRadius: 5, background: `${accent}b3` } }),
        e("div", { style: { height: 9, width: "92%", borderRadius: 5, background: "rgba(255,255,255,0.28)" } }),
        e("div", { style: { height: 9, width: "70%", borderRadius: 5, background: "rgba(255,255,255,0.22)" } })));
  }
  if (kind === "image") {
    return e("div", { style: base }, ring(s * 0.84, 3, 0.6),
      e("div", { style: { position: "absolute", left: s * 0.27, top: s * 0.3, width: s * 0.46, height: s * 0.37, borderRadius: 16, border: `3px solid ${accent}`, background: "rgba(255,255,255,0.05)" } }),
      e("div", { style: { position: "absolute", left: s * 0.6, top: s * 0.2, width: s * 0.17, height: s * 0.17, borderRadius: 999, background: YELLOW } }));
  }
  return e("div", { style: base }, ring(s * 0.8, 3, 0.6));
}

/* ---------- 标签：按可用宽度降字号，再缩写，绝不省略号截断 ---------- */
function abbreviate(t) {
  if (/^[A-Za-z0-9 .#+-]+$/.test(t)) {
    const words = t.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const acr = words.map((w) => (w.length <= 4 ? w : w[0].toUpperCase())).join(" ");
      return acr.length <= 12 ? acr : words.map((w) => w[0].toUpperCase()).join("");
    }
    return t.length <= 12 ? t : t.slice(0, 12);
  }
  return t.length <= 12 ? t : t.slice(0, 12);
}
function layoutChips(labels, areaW, baseFs, padX, dot) {
  const out = [];
  let remaining = areaW;
  labels.forEach((label, idx) => {
    const slots = labels.length - idx;
    const alloc = remaining / slots;
    let text = label, fs = baseFs;
    const width = () => measure(text, fs) + padX * 2 + (dot ? 18 : 0);
    while (width() > alloc && fs > 10) fs -= 1;
    if (width() > alloc) { text = abbreviate(text); }
    const finalW = Math.min(width(), alloc);
    remaining -= finalW + 10;
    out.push({ text, fs, w: finalW });
  });
  return out;
}

/* ---------- 版面 ---------- */
function buildCover({ title, sub, cat, tags, kind, accent, W, H, variant }) {
  const hero = variant === "hero";
  const scale = hero ? W / 1200 : W / 800;
  const pad = Math.round(W * (hero ? 0.07 : 0.055));
  const empSize = Math.round(W * (hero ? 0.3 : 0.28));
  const empLeft = W - empSize - Math.round(W * 0.03);
  // 文本区：与样张一致的 0.6W，同时不超过站徽方框左缘
  const textW = Math.min(Math.round(W * 0.6), empLeft - pad);
  const ringLeft = empLeft + Math.round(empSize * 0.07);
  const empTop = Math.round(H * (hero ? 0.19 : 0.1));
  const titleTop = Math.round(H * (hero ? 0.235 : 0.24));
  const lineH = 1.12;
  const subSize = Math.round((hero ? 27 : 21) * scale);
  const siteSize = Math.round((hero ? 24 : 19) * scale);
  const badgeSize = Math.round((hero ? 21 : 17) * scale);
  const stroke = (hasBlack ? (hero ? 2 : 1.5) : (hero ? 3 : 2.2));

  // 分档字号上限 + 宽度自适应（用“视觉宽度单位”而非字符数，中英一致）
  const units = Math.round(measure(title, 1));
  const maxSize = tierMax(units, hero);
  const minSize = Math.max(14, Math.round(maxSize * 0.38));
  let t = bestFit(title, textW, maxSize, minSize);
  // 纵向兜底：标题块 + 副标题不得顶到角标行
  const badgeTop = H - (hero ? 96 : 62);
  const subGap = hero ? 20 : 12;
  for (let guard = 0; guard < 10; guard++) {
    const blockH = t.lines.length * t.size * lineH + (sub ? subGap + subSize * 1.35 : 0);
    if (titleTop + blockH <= badgeTop - 10) break;
    const next = bestFit(title, textW, t.size - 1, minSize);
    if (next.size >= t.size) break;
    t = next;
  }
  const overflow = t.lines.length > 3 || t.lines.some((l) => measure(l, t.size) > textW + 1);

  const colorState = { kwUsed: false, latinUsed: false, numUsed: false };
  const titleNodes = t.lines.map((line) => {
    const segs = colorize(line, colorState);
    return e("div", {
      style: {
        whiteSpace: "nowrap", fontSize: t.size, fontWeight: WEIGHT,
        lineHeight: lineH, color: "#ffffff", fontFamily: "Noto Sans SC",
        "-webkit-text-stroke": `${stroke}px #000000`,
        textShadow: "0 6px 30px rgba(0,0,0,0.55)",
      },
    }, ...segs.map((s) => e("span", { style: { color: s.c } }, s.t)));
  });

  const chipLabels = [cat, ...tags.filter((x) => x !== cat).slice(0, hero ? 2 : 1)];
  const chipArea = empLeft - pad - 8;
  const chips = layoutChips(chipLabels, chipArea, badgeSize, hero ? 20 : 14, true);

  const maxLine = Math.max(...t.lines.map((l) => measure(l, t.size)));
  const metrics = {
    titleLen: title.length, font: t.size, lines: t.lines.length, maxLine: Math.round(maxLine),
    avail: textW, rightGap: Math.round(ringLeft - (pad + maxLine)), overflow, chips: chips.map((c) => c.text), weight: WEIGHT,
  };

  return {
    metrics,
    el: e("div", {
      style: {
        display: "flex", width: W, height: H, position: "relative", overflow: "hidden",
        fontFamily: "Noto Sans SC", color: "#fff",
        background: `linear-gradient(135deg, ${BASE} 0%, #061226 58%, #040c1c 100%)`,
      },
    },
      glow(Math.round(W * 0.55), accent, 0.3, -Math.round(H * 0.35), Math.round(W * 0.55)),
      glow(Math.round(W * 0.42), "#22d3ee", 0.16, Math.round(H * 0.5), -Math.round(W * 0.12)),
      glow(Math.round(W * 0.4), "#7c3aed", 0.2, Math.round(H * 0.2), Math.round(W * 0.45)),
      ...grid(W, H),
      e("div", { style: { position: "absolute", left: empLeft, top: empTop, width: empSize, height: empSize, opacity: 0.55, zIndex: 1 } }, emblem(kind, accent, empSize)),
      e("div", { style: { position: "absolute", left: pad, top: Math.round(H * 0.07), display: "flex", alignItems: "center", gap: 12 } },
        e("div", { style: { width: 12, height: 12, borderRadius: 999, background: YELLOW } }),
        e("div", { style: { fontSize: siteSize, fontWeight: 700, letterSpacing: 1 } }, SITE_NAME)),
      e("div", { style: { position: "absolute", left: pad, top: Math.round(H * (hero ? 0.1 : 0.09)), width: textW } },
        e("div", { style: { width: Math.round(W * 0.05), height: hero ? 6 : 5, borderRadius: 3, background: YELLOW, marginBottom: hero ? 26 : 18 } })),
      e("div", { style: { position: "absolute", left: pad, top: titleTop, width: textW, display: "flex", flexDirection: "column" } },
        ...titleNodes,
        sub ? e("div", {
          style: {
            marginTop: hero ? 20 : 12, fontSize: subSize, fontWeight: 700, lineHeight: 1.35,
            color: YELLOW, maxWidth: textW,
            "-webkit-text-stroke": `${Math.max(1, stroke * 0.6)}px rgba(0,0,0,0.9)`,
            textShadow: "0 3px 18px rgba(0,0,0,0.5)",
          },
        }, sub) : null),
      e("div", { style: { position: "absolute", left: pad, top: H - (hero ? 96 : 62), display: "flex", alignItems: "center", gap: 10 } },
        ...chips.map((c, i) => e("div", {
          style: {
            display: "flex", alignItems: "center", gap: 8, fontSize: c.fs, fontWeight: 700,
            padding: `${hero ? 9 : 7}px ${hero ? 20 : 14}px`, borderRadius: 999,
            border: i === 0 ? `2px solid ${accent}` : "1px solid rgba(255,255,255,0.28)",
            color: i === 0 ? "#fff" : "rgba(255,255,255,0.82)", background: i === 0 ? "rgba(3,9,23,0.55)" : "transparent",
          },
        }, i === 0 ? e("div", { style: { width: 9, height: 9, borderRadius: 999, background: accent } }) : null, c.text))),
      e("div", { style: { position: "absolute", right: pad, top: H - (hero ? 58 : 40), fontSize: Math.round((hero ? 19 : 15) * scale), fontWeight: 700, color: "rgba(255,255,255,0.55)" } }, SITE_URL),
    ),
  };
}

async function render(el, W, H) {
  const svg = await satori(el, { width: W, height: H, fonts: FONTS });
  const { Resvg } = await import("@resvg/resvg-js");
  return new Resvg(svg, {
    fitTo: { mode: "width", value: W },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "Noto Sans SC" },
  }).render().asPng();
}

const records = [];
async function genOne(dir, slug, fm, outSlug) {
  if (!fm.title) return false;
  const kind = kindOf(fm.category, fm.tags);
  const accent = ACCENT[kind] || ACCENT.default;
  const ct = TEXT[outSlug] || {};
  // 中文用正题（与已验收样张一致）；英文正题过长，用 AI headline
  const isEn = outSlug.endsWith("-en");
  const title = isEn ? (ct.headline || fm.title) : fm.title;
  const sub = ct.subhead || "";
  const cat = fm.category || fm.tags[0] || "技术";

  for (const [variant, W, H] of [["hero", 1200, 675], ["thumb", 640, 400]]) {
    const built = buildCover({ title, sub, cat, tags: fm.tags || [], kind, accent, W, H, variant });
    const png = await render(built.el, W, H);
    const buf = await sharp(png).webp({ quality: variant === "hero" ? 86 : 80 }).toBuffer();
    const name = `${outSlug}-${variant === "hero" ? "real" : "real-thumb"}.webp`;
    fs.writeFileSync(path.join(OUT, name), buf);
    const meta = await sharp(buf).metadata();
    const rec = { dir, slug, outSlug, variant, file: name, w: meta.width, h: meta.height, bytes: buf.length, ...built.metrics };
    records.push(rec);
    if (built.metrics.overflow || meta.width !== W || meta.height !== H) {
      console.error(`CHECK-FAIL ${name} ${meta.width}x${meta.height} font=${built.metrics.font} lines=${built.metrics.lines} max=${built.metrics.maxLine}/${built.metrics.avail}`);
    }
  }
  return true;
}

async function checkAll() {
  const fails = [];
  let expected = 0;
  for (const d of ["posts", "posts-en"]) {
    const base = path.join(SRC, d);
    if (fs.existsSync(base)) expected += fs.readdirSync(base).filter((f) => f.endsWith(".md")).length * 2;
  }
  for (const r of records) {
    const p = path.join(OUT, r.file);
    if (!fs.existsSync(p)) { fails.push(`${r.file}: missing`); continue; }
    const st = fs.statSync(p);
    if (!st.size) fails.push(`${r.file}: empty`);
    const meta = await sharp(p).metadata();
    const wantW = r.variant === "hero" ? 1200 : 640;
    const wantH = r.variant === "hero" ? 675 : 400;
    if (meta.width !== wantW || meta.height !== wantH) fails.push(`${r.file}: ${meta.width}x${meta.height} != ${wantW}x${wantH}`);
    if (r.overflow || r.lines > 3 || r.maxLine > r.avail + 1 || r.rightGap < 2) fails.push(`${r.file}: text overflow/font=${r.font}/lines=${r.lines}/max=${r.maxLine}/${r.avail}/gap=${r.rightGap}`);
  }
  if (!ARGS.some((a) => !a.startsWith("--")) && records.length !== expected) fails.push(`generated=${records.length} expected=${expected}`);
  return fails;
}

async function main() {
  const flags = ARGS.filter((a) => a.startsWith("--"));
  const only = ARGS.find((a) => !a.startsWith("--"));
  const mode = flags.includes("--check") ? "check" : "gen";
  let made = 0, failed = [], skipped = 0;

  if (mode === "check") {
    // 只读校验：复用上次生成报告里的量测结果，逐张核对磁盘产物
    if (!fs.existsSync(REPORT)) { console.error(`缺少 ${REPORT}，先跑一次生成`); process.exit(1); }
    records.push(...JSON.parse(fs.readFileSync(REPORT, "utf8")).records);
  } else {
    for (const [dir, suffixed] of [["posts", false], ["posts-en", true]]) {
      const base = path.join(SRC, dir);
      if (!fs.existsSync(base)) continue;
      for (const f of fs.readdirSync(base)) {
        if (!f.endsWith(".md")) continue;
        const slug = f.replace(/\.md$/, "");
        if (only && slug !== only && `${slug}-en` !== only) continue;
        const outSlug = suffixed ? `${slug}-en` : slug;
        try {
          const ok = await genOne(dir, slug, parseFrontmatter(path.join(base, f)), outSlug);
          ok ? made++ : skipped++;
        } catch (err) {
          failed.push(`${dir}/${slug}`);
          console.error(`FAIL ${dir}/${slug}:`, err && err.message ? err.message : err);
        }
      }
    }
  }

  const checks = await checkAll();
  if (checks.length) failed.push(...checks);
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify({ font: hasBlack ? "Black(900)" : "Bold(700)+stroke", generated: made, failed, records }, null, 2));

  const font = hasBlack ? `Black(900) ${path.basename(BLACK)}` : `Bold(700) fallback (+stroke)`;
  console.log(`covers: made=${made} skipped=${skipped} failed=${checks.length} font=${font}`);
  const worst = records.slice().sort((a, b) => b.titleLen - a.titleLen).slice(0, 6);
  for (const r of worst) console.log(`  long: ${r.file} len=${r.titleLen} font=${r.font} lines=${r.lines} ${r.maxLine}/${r.avail} gap=${r.rightGap}`);
  if (failed.length) { console.log("FAILED:", failed.slice(0, 20).join(", ")); process.exit(1); }
}

main().catch((err) => { console.error(err); process.exit(1); });
