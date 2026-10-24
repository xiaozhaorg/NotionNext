// 生成 public/llms-full.txt：核心文章全文整合版，供长上下文 AI 一次性读取。
// 内容有增删后重新运行：npm run gen:llms
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://xiaozha.org";
const POSTS_DIR = path.join(root, "src/content/posts");
const OUT = path.join(root, "public/llms-full.txt");
const MAX_POSTS = 20;

const entries = [];
for (const f of fs.readdirSync(POSTS_DIR)) {
  if (!f.endsWith(".md")) continue;
  const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf8").replace(/\r\n/g, "\n");
  const fm = /^---\n([\s\S]*?)\n---/.exec(raw)?.[1] ?? "";
  const title = (/^title:\s*"?([^"\n]+)/m.exec(fm) || [])[1] || f;
  const draft = /^draft:\s*true/m.test(fm);
  const body = raw.replace(/^---\n[\s\S]*?\n---/, "").trim();
  entries.push({ title, slug: f.replace(/\.md$/, ""), url: `${SITE}/article/${f.replace(/\.md$/, "")}/`, w: body.length, body, draft });
}

// 过滤草稿，按篇幅取前 MAX_POSTS 篇（长文信息密度更高）
const picked = entries
  .filter((e) => !e.draft)
  .sort((a, b) => b.w - a.w)
  .slice(0, MAX_POSTS);

const lines = [
  `# ${SITE} — Full Content`,
  "",
  `> 本站 ${picked.length} 篇核心文章全文，供 AI 一次性读取。生成时间：${new Date().toISOString().slice(0, 10)}`,
  "",
  `> Full text of ${picked.length} core articles from ${SITE}, for one-shot AI ingestion.`,
  "",
];
for (const e of picked) {
  lines.push(`## ${e.title}`, `URL: ${e.url}`, "", e.body, "", "---", "");
}

fs.writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(`llms-full.txt 生成完成：${picked.length} 篇，${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
