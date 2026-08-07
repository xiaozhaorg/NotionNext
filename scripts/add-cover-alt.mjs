/**
 * 为所有文章的封面图添加描述性 coverAlt（用于 SEO 的 img alt 属性）
 * 用法：node scripts/add-cover-alt.mjs
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const POSTS_DIR = join(process.cwd(), "src", "content", "posts");

// slug → 描述性 alt 文本（描述图片内容，而非文章标题）
const COVER_ALTS = {
  // —— 22 篇手动指定 Unsplash 封面 ——
  "hello-astro":               "MacBook 笔记本上的博客写作场景，旁边放有咖啡杯",
  "hi-welcome":                "团队成员在桌前协作交流的温馨工作场景",
  "shawn-ai-free-api":         "蓝色光晕中的人工智能神经网络概念图",
  "claude-code-tutorial":      "开发者双手放在笔记本键盘上编写代码的特写",
  "chatgpt-vs-claude-vs-gemini":"发光的 AI 芯片与电路板特写，象征大模型算力",
  "astro-vs-nextjs":           "MacBook 屏幕上显示着编程代码的编辑器界面",
  "atomcode-intro":            "深色主题代码编辑器中色彩高亮的程序源码",
  "cloudflare-cloud-mail":     "云端服务器机房的蓝色存储阵列灯光",
  "cloudflare-ip-optimization":"数据中心服务器机架上闪烁的网络指示灯",
  "dbx-intro":                 "绿色电路板上密布的芯片与数据线特写",
  "github-copilot-free":       "程序员在双显示器上编写代码的俯拍工作台",
  "gname-eucc-free":           "网络域名解析与全球互联网连接的概念图",
  "idm-activation-tutorial-2026":"服务器机房中排列整齐的机柜与网线",
  "mineradio-tutorial":        "MacBook 旁摆放着耳机与音乐播放器界面",
  "monkeycode-intro":          "蓝紫渐变光效中的 AI 技术抽象概念图",
  "nextchat-deploy-guide":     "屏幕上发光的 AI 对话聊天界面",
  "rust-vs-go":                "数据中心服务器机房内排列整齐的机柜",
  "siliconflow-intro":         "办公桌上笔记本电脑与数据图表的工作场景",
  "tencent-edgeone":           "云层之上的 CDN 内容分发网络抽象图",
  "tencent-marvis":            "整洁办公桌面上的笔记本电脑与工作笔记",
  "vercel-vs-cloudflare":      "云朵与服务器机房的云计算部署概念图",
  "zed-vs-vscode":             "深色主题代码编辑器中色彩高亮的程序源码",

  // —— 36 篇从正文提取的 Unsplash 封面 ——
  "astro-vs-nextjs":           "MacBook 屏幕上显示着编程代码的编辑器界面",
  "bitwarden-self-host":       "云计算与服务器机房的蓝色科技灯光",
  "bt-panel-404":              "服务器机房中排列整齐的机柜与网络设备",
  "claude-sonnet-4":           "发光的 AI 芯片与电路板特写，象征大模型算力",
  "cloudflare-drop-guide":     "云端服务器机房的蓝色存储阵列灯光",
  "cloudflare-r2-storage":     "云端服务器机房的蓝色存储阵列灯光",
  "cloudflare-tunnel":         "数据中心服务器机架上闪烁的网络指示灯",
  "cloudflare-tunnel-tutorial":"数据中心服务器机架上闪烁的网络指示灯",
  "cloudflare-workers-blog":   "云端服务器机房的蓝色存储阵列灯光",
  "codebase-memory-mcp":       "MacBook 屏幕上显示着编程代码的编辑器界面",
  "com-domain-deal":           "网络域名解析与全球互联网连接的概念图",
  "cursor-vs-vscode":          "蓝色光晕中的人工智能神经网络概念图",
  "deepseek-v4-coding":        "发光的 AI 芯片与电路板特写，象征大模型算力",
  "docker-compose-tutorial":   "开发者双手放在笔记本键盘上编写代码的特写",
  "docker-mirror-2026":        "云层与服务器机房的云计算抽象图",
  "free-ai-coding-tools-2026": "蓝色光晕中的人工智能神经网络概念图",
  "gemma-4-local-deploy":      "蓝色光晕中的人工智能神经网络概念图",
  "git-advanced-tips":         "程序员在双显示器上编写代码的俯拍工作台",
  "github-actions-advanced":   "团队成员在桌前协作交流的温馨工作场景",
  "github-student-pack":       "绿色电路板上密布的芯片与数据线特写",
  "gpt56-release":             "蓝色光晕中的人工智能神经网络概念图",
  "immich-photo-backup":       "绿色电路板上密布的芯片与数据线特写",
  "jellyfin-media-server":     "整洁办公桌面上的笔记本电脑与工作笔记",
  "kimi-k3-open-source":       "蓝色光晕中的人工智能神经网络概念图",
  "mealie-recipe-app":         "云计算与服务器机房的蓝色科技灯光",
  "n8n-workflow-automation":   "办公桌上笔记本电脑与数据图表的工作场景",
  "nas-diy-guide":             "团队成员在桌前协作交流的温馨工作场景",
  "ollama-local-llm":          "发光的 AI 芯片与电路板特写，象征大模型算力",
  "raycast-productivity":      "MacBook 旁摆放着耳机与音乐播放器界面",
  "self-host-apps":            "办公桌上笔记本电脑与数据图表的工作场景",
  "trae-ide-review":           "深色主题代码编辑器中色彩高亮的程序源码",
  "ubuntu-server-setup":       "服务器机房中排列整齐的机柜与网络设备",
  "uptime-kuma-monitor":       "整洁办公桌面上的笔记本电脑与工作笔记",
  "vscode-codex-integration":  "发光的 AI 芯片与电路板特写，象征大模型算力",
  "vscode-extensions-2026":    "MacBook 旁摆放着耳机与音乐播放器界面",
  "winget-windows-tools":      "绿色电路板上密布的芯片与数据线特写",
  "xunfei-coding-plan":        "蓝色光晕中的人工智能神经网络概念图",
  "zed-vs-vscode":             "深色主题代码编辑器中色彩高亮的程序源码",
};

const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md"));
console.log(`[coverAlt] 发现 ${files.length} 篇文章`);

let added = 0;
let skipped = 0;
let noMatch = 0;

for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const filePath = join(POSTS_DIR, file);
  const content = await readFile(filePath, "utf8");

  const alt = COVER_ALTS[slug];
  if (!alt) {
    noMatch++;
    continue;
  }

  // 如果已有 coverAlt 字段则跳过
  if (/^coverAlt:\s*.+$/m.test(content)) {
    skipped++;
    continue;
  }

  // 在 ogImage 行后插入 coverAlt
  const newContent = content.replace(
    /^(ogImage:\s*.+)$/m,
    `$1\ncoverAlt: "${alt.replace(/"/g, '\\"')}"`
  );

  if (newContent === content) {
    console.log(`  ⚠️ ${slug}: ogImage 行未找到，跳过`);
    continue;
  }

  await writeFile(filePath, newContent, "utf8");
  added++;
}

console.log(`\n[coverAlt] 完成：添加 ${added}，跳过 ${skipped}，无映射 ${noMatch}`);
