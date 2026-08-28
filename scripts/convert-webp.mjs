/**
 * 批量把 public/images/ 下的 JPEG 转为 WebP
 * 运行: node scripts/convert-webp.mjs
 *
 * 生成同名 .webp 文件（保留原 .jpg），质量 78（视觉无损，体积减小 40-60%）
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const IMG_DIR = path.resolve(process.cwd(), "public", "images");

if (!fs.existsSync(IMG_DIR)) {
  console.error(`[webp] 目录不存在: ${IMG_DIR}`);
  process.exit(1);
}

const files = fs
  .readdirSync(IMG_DIR)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .filter((f) => {
    // 跳过已有 webp 的同名文件
    const webpName = f.replace(/\.(jpe?g|png)$/i, ".webp");
    return !fs.existsSync(path.join(IMG_DIR, webpName));
  });

if (files.length === 0) {
  console.log("[webp] 所有图片已有 WebP 版本，跳过");
  process.exit(0);
}

console.log(`[webp] 开始转换 ${files.length} 张图片...`);

let totalOriginal = 0;
let totalWebp = 0;

for (const file of files) {
  const src = path.join(IMG_DIR, file);
  const dst = path.join(IMG_DIR, file.replace(/\.(jpe?g|png)$/i, ".webp"));
  const originalSize = fs.statSync(src).size;

  try {
    await sharp(src)
      .resize(440, null, { withoutEnlargement: true }) // 卡片缩略图最大 220px 宽，2x=440
      .webp({ quality: 72 })
      .toFile(dst);

    const webpSize = fs.statSync(dst).size;
    totalOriginal += originalSize;
    totalWebp += webpSize;
    const saved = ((1 - webpSize / originalSize) * 100).toFixed(0);
    console.log(`  ✓ ${file} → ${path.basename(dst)}  ${(originalSize / 1024).toFixed(0)}KB → ${(webpSize / 1024).toFixed(0)}KB (省 ${saved}%)`);
  } catch (err) {
    console.error(`  ✗ ${file} 转换失败: ${err.message}`);
  }
}

console.log(`\n[webp] 完成！总计 ${(totalOriginal / 1024 / 1024).toFixed(1)}MB → ${(totalWebp / 1024 / 1024).toFixed(1)}MB (省 ${((1 - totalWebp / totalOriginal) * 100).toFixed(0)}%)`);
