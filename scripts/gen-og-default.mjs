// 下载一张 Unsplash 技术/AI 主题图作为默认 og 图 (1200x630 JPG)
import { writeFile } from "node:fs/promises";
const url = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop&q=85&fm=jpg";
const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
const buf = Buffer.from(await res.arrayBuffer());
await writeFile("public/og-default.jpg", buf);
console.log(`og-default.jpg: ${(buf.length / 1024).toFixed(1)}KB`);
