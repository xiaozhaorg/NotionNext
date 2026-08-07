/**
 * 为 22 篇无正文配图的文章手动指定 Unsplash 主题封面
 * 下载图片到 public/images/ 并更新 frontmatter 的 ogImage
 * 用法：node scripts/assign-covers.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const POSTS_DIR = join(process.cwd(), "src", "content", "posts");
const IMAGES_DIR = join(process.cwd(), "public", "images");
const CONCURRENCY = 6;

await mkdir(IMAGES_DIR, { recursive: true });

// slug → Unsplash photo ID 映射（所有 photo ID 均从已有文章正文中验证可访问）
const COVERS = {
  "hello-astro":               "photo-1499750310107-5fef28a66643", // MacBook / 博客写作
  "hi-welcome":                "photo-1522202176988-66273c2fd55f", // 团队协作 / 欢迎
  "shawn-ai-free-api":         "photo-1677442136019-21780ecad995", // AI 概念
  "claude-code-tutorial":      "photo-1516321318423-f06f85e504b3", // 编程 / 笔记本
  "chatgpt-vs-claude-vs-gemini":"photo-1707343843982-f8275f3994c5", // AI / 技术
  "astro-vs-nextjs":           "photo-1498050108023-c5249f4df085", // 编程 / Mac
  "atomcode-intro":            "photo-1620712943543-bcc4688e7485", // 代码 / 编辑器
  "cloudflare-cloud-mail":     "photo-1563986768609-322da13575f3", // 存储 / 云
  "cloudflare-ip-optimization":"photo-1558494949-ef010cbdcc31",    // 服务器 / 网络
  "dbx-intro":                 "photo-1518770660439-4636190af475", // 数据 / 电路
  "github-copilot-free":       "photo-1461749280684-dccba630e2f6", // 编程 / 代码
  "gname-eucc-free":           "photo-1531403009284-440f080d1e12", // 网络 / 域名
  "idm-activation-tutorial-2026":"photo-1434030216411-0b793f4b4173", // 服务器 / 下载
  "mineradio-tutorial":        "photo-1516116216624-53e697fedbea", // Mac / 效率
  "monkeycode-intro":          "photo-1555255707-c07966088b7b",    // AI / 技术
  "nextchat-deploy-guide":     "photo-1655720828018-edd2daec9349", // AI / 聊天
  "rust-vs-go":                "photo-1484480974693-6ca0a78fb36b", // 服务器 / 后端
  "siliconflow-intro":         "photo-1504639725590-34d0984388bd", // 工作 / 技术
  "tencent-edgeone":           "photo-1518432031352-d6fc5c10da5a", // 云 / CDN
  "tencent-marvis":            "photo-1556761175-5973dc0f32e7",    // 办公 / AI助手
  "vercel-vs-cloudflare":      "photo-1460925895917-afdab827c52f", // 云 / 部署
  "zed-vs-vscode":             "photo-1620712943543-bcc4688e7485", // 编辑器 / 代码
};

const slugs = Object.keys(COVERS);
console.log(`[assign] 共 ${slugs.length} 篇文章需要指定封面`);

async function downloadImage(photoId, destPath) {
  const url = `https://images.unsplash.com/${photoId}?w=1200&h=630&fit=crop&q=80&fm=jpg`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${photoId}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
  return buffer.length;
}

async function processSlug(slug) {
  const photoId = COVERS[slug];
  const filePath = join(POSTS_DIR, `${slug}.md`);
  const localFileName = `${slug}-real.jpg`;
  const localPath = join(IMAGES_DIR, localFileName);
  const publicPath = `/images/${localFileName}`;

  try {
    const size = await downloadImage(photoId, localPath);
    console.log(`  ✅ ${slug}: ${(size / 1024).toFixed(1)}KB (${photoId})`);

    const content = await readFile(filePath, "utf8");
    const newContent = content.replace(
      /^ogImage:\s*.+$/m,
      `ogImage: "${publicPath}"`
    );
    if (newContent !== content) {
      await writeFile(filePath, newContent, "utf8");
    }
    return { slug, ok: true, publicPath };
  } catch (e) {
    return { slug, ok: false, reason: e.message };
  }
}

// 并发控制
async function runPool(items, worker, concurrency) {
  const results = [];
  let index = 0;
  const executing = [];
  async function next() {
    if (index >= items.length) return;
    const i = index++;
    const item = items[i];
    const p = Promise.resolve().then(() => worker(item, i));
    results[i] = p;
    const e = p.finally(() => {
      const idx = executing.indexOf(e);
      if (idx >= 0) executing.splice(idx, 1);
    });
    executing.push(e);
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
    await next();
  }
  await next();
  return Promise.all(results);
}

const results = await runPool(slugs, processSlug, CONCURRENCY);
const ok = results.filter((r) => r.ok);
const fail = results.filter((r) => !r.ok);

console.log(`\n[assign] 成功 ${ok.length}，失败 ${fail.length}`);
if (fail.length > 0) {
  console.log("\n❌ 失败列表：");
  fail.forEach((r) => console.log(`   ${r.slug}: ${r.reason}`));
}
