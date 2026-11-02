import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src", "content");
const OUT = path.join(ROOT, "scripts", "_articles.json");

function parseFrontmatter(raw) {
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

function plainBody(raw) {
  let b = raw.split("---").slice(2).join("---");
  b = b.replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|]/g, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return b.slice(0, 700);
}

const out = [];
for (const [dir, suffixed] of [["posts", false], ["posts-en", true]]) {
  const base = path.join(SRC, dir);
  if (!fs.existsSync(base)) continue;
  for (const f of fs.readdirSync(base)) {
    if (!f.endsWith(".md")) continue;
    const slug = f.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(base, f), "utf8");
    const fm = parseFrontmatter(raw);
    if (!fm.title) continue;
    out.push({
      outSlug: suffixed ? `${slug}-en` : slug,
      lang: suffixed ? "en" : "zh",
      title: fm.title,
      category: fm.category,
      tags: fm.tags,
      excerpt: plainBody(raw),
    });
  }
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`extracted ${out.length} articles -> ${OUT}`);
