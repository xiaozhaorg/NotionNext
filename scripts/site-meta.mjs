/**
 * 从 src/config.ts 读取站点元数据，供 scripts 下的生成/迁移脚本共用，
 * 避免域名与站名在多个脚本里各写一份。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "config.ts");
const text = fs.readFileSync(CONFIG, "utf8");

function pick(key) {
  const match = new RegExp(`^\\s*${key}:\\s*"([^"]+)"`, "m").exec(text);
  if (!match) throw new Error(`无法从 src/config.ts 读取 ${key}`);
  return match[1];
}

export const SITE_TITLE = pick("title");
export const SITE_URL = pick("url");
export const SITE_HOST = new URL(SITE_URL).host;
