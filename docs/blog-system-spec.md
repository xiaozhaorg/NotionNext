# 博客系统建设方案 Spec（方案 A：渐进增强 · 修订版）

> 状态：已确认 · 日期：2026-08-08 · 底座：Astro 6 + Cloudflare Pages（保持不变）
> 修订：2026-08-08 取消阅读量 Worker/KV 与 Web 后台，范围收敛为纯静态增强 + 本地写作工具

## 1. 目标与原则

- 在现有 Astro 静态博客（xiaozha-blog）基础上"把系统做厚"，打造适合自己、低维护的博客系统。
- **原则**：静态优先、零额外部署依赖（不引入 Worker/KV 等云资源）、SEO 不降级、渐进式落地。
- 已取消：阅读量统计（需 Cloudflare Worker + KV）、Web 写作后台（需 GitHub Token）。

## 2. 架构总览

```
┌────────────────────────────────────────────────────┐
│  静态层：Astro + Cloudflare Pages（现状不变）        │
│  ├── 文章页 /article/[slug]（现状）                 │
│  ├── 归档页 /archive/（新增，时间线列表）            │
│  ├── 关于页 /about/（新增）                         │
│  └── Header 导航修正（归档/关于指向真实页面）        │
├────────────────────────────────────────────────────┤
│  写作层：本地脚本（Markdown + Git，无额外服务）       │
│  └── scripts/new-post.mjs 生成文章模板              │
└────────────────────────────────────────────────────┘
```

## 3. 模块一：页面补全

### 3.1 归档页 `/archive/`

- `src/pages/archive.astro`，纯静态生成。
- 形式：**时间线列表**——按发布时间倒序，按年份 → 月份分组标记，每条含日期、标题、标签。
- 数据源：`getCollection("posts")` 过滤 draft。

### 3.2 关于页 `/about/`

- `src/pages/about.astro`，纯静态。
- 内容：站长简介、站点定位、联系方式（邮箱 mail@xiaozha.org、GitHub）、社交链接（复用 `SITE.social`）。

### 3.3 Header 导航修正

- `src/components/Header.astro`：归档 `href` 由 `/tags/` 改为 `/archive/`；关于保持 `/about/`（页面将真实存在）。

## 4. 模块二：写作工作流（本地为主）

- `scripts/new-post.mjs`：交互式生成新文章——
  - 输入标题 → 自动 slug（英文/拼音，小写连字符；中文标题要求手动指定英文 slug）
  - 生成 frontmatter（title/description/pubDatetime/tags/author，默认小吒）
  - slug 冲突检查，落盘 `src/content/posts/{slug}.md`
- 使用：`npm run new-post`；写完 `npm run typecheck` 校验 schema。

## 5. 数据形态与边界

- 文章内容仍在 md + Git；无任何运行时依赖、无数据库/云服务。
- 归档/关于为构建期静态页，构建产物直接部署到 Cloudflare Pages。

## 6. 范围裁剪（YAGNI，不做）

- ❌ 阅读量统计 / 热门排序（需 Worker + KV，已取消）
- ❌ Web 写作后台（需 GitHub Token，已取消）
- ❌ 评论系统、多作者、草稿系统、图片上传、阅读量防刷

## 7. 测试与验证

- `npm run typecheck` + `npm run build` 全绿。
- 归档/关于页：构建产物中存在对应 HTML，导航指向正确。

## 8. 实施顺序

1. **页面补全**（纯静态）：归档页 + 关于页 + Header 导航修正 ✅ 已完成
2. **写作流**：new-post.mjs 本地脚本 ✅ 已完成
