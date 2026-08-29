/**
 * 为新文章的渐变封面替换为 unsplash 真实照片封面（与旧文章 real.jpg 风格一致）
 * 1. 下载照片 → public/images/{slug}-real.jpg
 * 2. 更新 zh/en frontmatter 的 ogImage 指向 real.jpg
 * 用法：node scripts/new-real-covers.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IMG_DIR = path.join(ROOT, "public/images");
const DIRS = ["src/content/posts", "src/content/posts-en"];

// slug → unsplash photo ID（均取自 assign-covers.mjs 已验证可访问的 ID）
const COVERS = {
  "cline-tutorial": "photo-1516321318423-f06f85e504b3",        // 编程 / 笔记本
  "mcp-ecosystem": "photo-1620712943543-bcc4688e7485",          // 代码 / 编辑器
  "cloudflare-data-layer": "photo-1558494949-ef010cbdcc31",     // 服务器 / 网络
};

async function download(photoId, destPath) {
  const url = `https://images.unsplash.com/${photoId}?w=1200&h=630&fit=crop&q=80&fm=jpg`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${photoId}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  for (const [slug, photoId] of Object.entries(COVERS)) {
    // 1. 下载照片
    const realPath = path.join(IMG_DIR, `${slug}-real.jpg`);
    const size = await download(photoId, realPath);
    console.log(`✅ 下载 ${slug}-real.jpg (${(size / 1024).toFixed(0)}KB)`);

    // 2. 更新 zh + en frontmatter 的 ogImage
    for (const dir of DIRS) {
      const fp = path.join(ROOT, dir, `${slug}.md`);
      if (!fs.existsSync(fp)) continue;
      const raw = fs.readFileSync(fp, "utf8");
      const out = raw.replace(
        new RegExp(`(^ogImage:\\s*")[^"]*${slug}-cover\\.jpg(")`, "m"),
        `$1/images/${slug}-real.jpg$2`
      );
      if (out !== raw) {
        fs.writeFileSync(fp, out, "utf8");
        console.log(`  📝 ${dir}/${slug}.md ogImage → real.jpg`);
      } else {
        console.log(`  ⚠ ${dir}/${slug}.md 未找到 cover.jpg 引用`);
      }
    }
  }
  console.log("\n完成。下一步：删除旧 cover 文件 + 重新生成缩略图");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
