/**
 * 把 src/content 下的 md 文件恢复为 git HEAD 版本（撤销 localize 脚本的错误替换）
 * 用法：node scripts/restore-md.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIRS = ["src/content/posts", "src/content/posts-en"];

let n = 0;
for (const dir of DIRS) {
  const abs = path.join(ROOT, dir);
  for (const file of fs.readdirSync(abs).filter((f) => f.endsWith(".md"))) {
    const rel = `${dir}/${file}`;
    const head = execSync(`git show HEAD:${rel}`, { cwd: ROOT, encoding: "utf8" });
    fs.writeFileSync(path.join(abs, file), head, "utf8");
    n++;
  }
}
console.log(`✅ 已恢复 ${n} 个 md 文件到 HEAD`);
