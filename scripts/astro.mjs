import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "node_modules", "astro", "bin", "astro.mjs");

const MIN_MAJOR = 22;
const MIN_MINOR = 23;
const MIN_PATCH = 4;

function satisfies(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v);
  if (!m) return false;
  const [a, b, c] = m.slice(1).map(Number);
  if (a !== MIN_MAJOR) return a > MIN_MAJOR;
  if (b !== MIN_MINOR) return b > MIN_MINOR;
  return c >= MIN_PATCH;
}

const args = process.argv.slice(2);

function run(nodeBin, nodeArgs) {
  const r = spawnSync(nodeBin, [...nodeArgs, CLI, ...args], { cwd: ROOT, stdio: "inherit" });
  if (r.error) {
    console.error(`[astro] 无法执行 ${nodeBin}: ${r.error.message}`);
    process.exit(1);
  }
  process.exit(r.status ?? 1);
}

if (satisfies(process.version)) {
  run(process.execPath, []);
}

const CANDIDATES = [
  process.env.ASTRO_NODE_BIN,
  "D:\\Tools\\Node\\node.exe",
  "C:\\Program Files\\nodejs\\node.exe",
].filter(Boolean);

for (const cand of CANDIDATES) {
  if (!fs.existsSync(cand)) continue;
  const probe = spawnSync(cand, ["-v"], { encoding: "utf8" });
  const v = probe.stdout?.trim() ?? "";
  if (probe.status === 0 && satisfies(v)) {
    run(cand, []);
  }
  console.error(`[astro] ${cand} 版本 ${v || "未知"} 不满足 >=22.23.4`);
}

console.error(
  `[astro] 当前 Node 为 ${process.version}，Astro 7.4+ 需要 >=22.23.4。\n` +
    `[astro] 请升级 Node，或设置 ASTRO_NODE_BIN 指向新版 node.exe 路径。`
);
process.exit(1);
