/**
 * 为所有封面图生成 480w 的 WebP 缩略图（列表卡片用，减少带宽）
 * 输出：public/images/{原名}.jpg → {原名}-thumb.webp
 * 用法：node scripts/gen-thumbs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.resolve(__dirname, "..", "public/images");

async function main() {
  const files = fs.readdirSync(IMG_DIR).filter((f) => /\.(jpe?g)$/i.test(f));
  let made = 0,
    skipped = 0;
  for (const file of files) {
    const out = path.join(IMG_DIR, file.replace(/\.(jpe?g)$/i, "-thumb.webp"));
    if (fs.existsSync(out)) {
      skipped++;
      continue;
    }
    await sharp(path.join(IMG_DIR, file))
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(out);
    made++;
  }
  console.log(`✅ 生成缩略图 ${made} 张（跳过已存在 ${skipped} 张）`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
