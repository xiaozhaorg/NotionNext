/**
 * 扫描 src/content/posts 和 posts-en 下所有 md 文件
 * 检测排版问题：空标题、标题无#、疑似损坏表格、损坏内联图片链接
 * 用法：node scripts/check-format.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const BASES = [
  join(process.cwd(), "src", "content", "posts"),
  join(process.cwd(), "src", "content", "posts-en"),
];

let total = 0;
const issues = [];

for (const base of BASES) {
  const locale = base.endsWith("posts-en") ? "en" : "zh";
  const files = (await readdir(base)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const path = join(base, file);
    const content = await readFile(path, "utf8");
    const lines = content.split("\n");
    total++;

    // 跳过 frontmatter
    const startIdx = content.indexOf("\n---", content.indexOf("---") + 3) + 1;
    const bodyLines = content.substring(startIdx).split("\n");

    // 检测 1: 空的 #### 标题
    const emptyHeadings = bodyLines
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => /^#{2,6}\s*$/.test(l));
    if (emptyHeadings.length > 0) {
      issues.push({
        locale, slug, severity: "HIGH",
        type: "empty-heading",
        count: emptyHeadings.length,
        lines: emptyHeadings.map(({ i }) => i + 1).slice(0, 5).join(","),
      });
    }

    // 检测 2: 疑似损坏表格（连续短行，无 | 分隔符，3+ 行）
    const tableCandidates = [];
    let run = [];
    for (let i = 0; i < bodyLines.length; i++) {
      const l = bodyLines[i].trim();
      // 短行（<= 20 字符）、非空、非标题、非列表、非代码、非表格
      if (l.length > 0 && l.length <= 25 &&
          !/^#{1,6}\s/.test(l) && !/^[-*]\s/.test(l) &&
          !/^\d+\.\s/.test(l) && !/^[|>]/.test(l) && !/^```/.test(l)) {
        run.push({ line: l, idx: i });
      } else {
        if (run.length >= 3) tableCandidates.push(run);
        run = [];
      }
    }
    if (run.length >= 3) tableCandidates.push(run);
    if (tableCandidates.length > 0) {
      issues.push({
        locale, slug, severity: "HIGH",
        type: "broken-table",
        count: tableCandidates.length,
        lines: tableCandidates.flat().map(r => r.idx + 1).slice(0, 5).join(","),
      });
    }

    // 检测 3: 标题与正文挤在同一行
    const mergedHeading = bodyLines
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => {
        // 形如 "前言Cloudflare" "为什么需要优选 IPCloudflare" 的行
        const trimmed = l.trim();
        return /^(前言|方案|第一步|第二步|第三步|第四步|为什么|推荐|前提|效果|下载|运行|选择|配置|验证|监控|核心|总结|常见|避坑|检查|测试|关闭|设置|如何|使用|Q\d|A：|\**)/.test(trimmed) &&
          trimmed.length > 15 && !/^#{1,6}/.test(trimmed);
      });
    if (mergedHeading.length > 0) {
      issues.push({
        locale, slug, severity: "HIGH",
        type: "heading-merged",
        count: mergedHeading.length,
        lines: mergedHeading.map(({ i }) => i + 1).slice(0, 5).join(","),
      });
    }

    // 检测 4: 损坏的内联图片链接（文末相关推荐）
    const brokenInlineImgs = bodyLines
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => /\!\[image\]\(\/images\//.test(l) && /\[.*?\!image.*?\]/.test(l));
    if (brokenInlineImgs.length > 0) {
      issues.push({
        locale, slug, severity: "MEDIUM",
        type: "broken-related",
        count: brokenInlineImgs.length,
        lines: brokenInlineImgs.map(({ i }) => i + 1).slice(0, 5).join(","),
      });
    }

    // 检测 5: 正文有代码/命令但无 ``` 包裹
    const bareCode = bodyLines
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => {
        const trimmed = l.trim();
        return trimmed.length > 5 && trimmed.length < 120 &&
          !/#{1,6}\s/.test(trimmed) &&
          !/\*\*/.test(trimmed) &&
          !trimmed.startsWith("-") &&
          !trimmed.startsWith(">") &&
          !trimmed.startsWith("[") &&
          !/\s{2,}/.test(trimmed) &&
          (/^(\$\s|npm\s|git\s|pip\s|docker\s|curl\s|crontab|SECRET_|104\.|172\.)/.test(trimmed) ||
           (/^@?[A-Za-z0-9._]+$/.test(trimmed) && trimmed.length > 8 && trimmed.includes(".")));
      });
    if (bareCode.length >= 3) {
      issues.push({
        locale, slug, severity: "LOW",
        type: "bare-code",
        count: bareCode.length,
      });
    }
  }
}

console.log(`\n📊 扫描完成：${total} 篇文章`);
console.log(`\n🚨 发现 ${issues.length} 个问题\n`);

const byLocale = issues.reduce((g, i) => { g[i.locale] = (g[i.locale] || 0) + 1; return g; }, {});
console.log(`按语言分布:`, byLocale);

const byType = issues.reduce((g, i) => { g[i.type] = (g[i.type] || 0) + 1; return g; }, {});
console.log(`按类型分布:`, byType);

const highSeverity = issues.filter(i => i.severity === "HIGH");
console.log(`\n🔴 严重问题 (${highSeverity.length} 篇):`);
highSeverity.forEach(i => {
  console.log(`  [${i.locale}] ${i.slug}: ${i.type} × ${i.count} (L${i.lines})`);
});

const mediumSeverity = issues.filter(i => i.severity === "MEDIUM");
if (mediumSeverity.length) {
  console.log(`\n🟡 中等问题 (${mediumSeverity.length} 篇):`);
  mediumSeverity.forEach(i => {
    console.log(`  [${i.locale}] ${i.slug}: ${i.type} × ${i.count}`);
  });
}

const lowSeverity = issues.filter(i => i.severity === "LOW");
if (lowSeverity.length) {
  console.log(`\n🟢 轻微问题 (${lowSeverity.length} 篇):`);
  lowSeverity.slice(0, 15).forEach(i => {
    console.log(`  [${i.locale}] ${i.slug}: ${i.type} × ${i.count}`);
  });
  if (lowSeverity.length > 15) console.log(`  ...还有 ${lowSeverity.length - 15} 篇`);
}
