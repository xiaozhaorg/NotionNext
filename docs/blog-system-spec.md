# 博客系统建设方案 Spec（方案 A：渐进增强）

> 状态：已确认 · 日期：2026-08-08 · 底座：Astro 6 + Cloudflare Pages（保持不变）

## 1. 目标与原则

- 在现有 Astro 静态博客（xiaozha-blog）基础上"把系统做厚"，打造适合自己、低维护的博客系统。
- **原则**：静态优先、SEO 不降级、免费层够用、渐进式落地、评论/多作者等复杂能力本期不做（架构预留）。

## 2. 架构总览

```
┌────────────────────────────────────────────────────┐
│  静态层：Astro + Cloudflare Pages（现状不变）        │
│  ├── 文章页 /article/[slug]（新增阅读量展示）        │
│  ├── 归档页 /archive/（新增，时间线列表）            │
│  ├── 关于页 /about/（新增）                         │
│  └── Header 导航修正（归档/关于指向真实页面）        │
├────────────────────────────────────────────────────┤
│  动态层：Cloudflare Worker + KV（新增）             │
│  ├── GET/POST /api/views/[slug] → 阅读量计数        │
│  └── 部署：wrangler 发布，KV 绑定                   │
├────────────────────────────────────────────────────┤
│  写作层：本地脚本（主）+ 极简 Web 后台（辅）          │
│  └── scripts/new-post.mjs 生成文章模板              │
└────────────────────────────────────────────────────┘
```

## 3. 模块一：阅读量系统

### 3.1 Worker 接口

| 方法 | 路由 | 行为 |
|---|---|---|
| GET | `/api/views/[slug]` | 返回 `{ slug, views }`（无记录返回 0） |
| POST | `/api/views/[slug]` | 自增计数，返回新值；幂等由前端控制（每页加载只调一次） |

- KV key 设计：`views:{slug}`，value 为数字字符串。
- 跨域：允许 GET（文章页运行时读取）；POST 带简单同源校验（Referer 以站点域开头），不做复杂防刷（YAGNI）。
- 失败降级：前端 fetch 失败时静默隐藏阅读量，不影响页面。

### 3.2 前端展示

- 文章页 `src/pages/article/[...slug].astro` meta 区新增「N 次阅读」。
- 实现：页面加载后 fetch `GET /api/views/{slug}` 显示 → 再 POST 一次自增。用 `<script>`（非 is:inline，走 Astro 打包）或 is:inline 均可，取实现方便。
- 热门文章：**维持按发布时间排序**（已确认），阅读量不做排序入口。

### 3.3 部署

- Worker 源码放 `worker/` 目录（与 Astro 工程分离），`wrangler.toml` 配置 KV namespace。
- CF 控制台创建 KV（如 `BLOG_VIEWS`），绑定到 Worker。
- 提供 `npm run deploy:worker` 脚本（wrangler deploy）。

## 4. 模块二：页面补全

### 4.1 归档页 `/archive/`

- `src/pages/archive.astro`，纯静态生成。
- 形式：**时间线列表**（已确认）——按发布时间倒序，每条含日期、标题、标签，按月做分组标记，不做折叠交互。
- 数据源：`getCollection("posts")` 过滤 draft。

### 4.2 关于页 `/about/`

- `src/pages/about.astro`，纯静态。
- 内容：站长简介、站点定位、联系方式（邮箱 mail@xiaozha.org、GitHub）、社交链接（复用 `SITE.social`）。

### 4.3 Header 导航修正

- `src/components/Header.astro`：归档 `href` 由 `/tags/` 改为 `/archive/`；关于保持 `/about/`（页面将真实存在）。
- `isActive` 逻辑不变。

## 5. 模块三：写作工作流

### 5.1 本地脚本（主）

- `scripts/new-post.mjs`：交互式生成新文章——
  - 输入标题 → 自动 slug（拼音/英文输入，小写连字符）
  - 生成 frontmatter（title/description/pubDatetime/tags/author，默认小吒）
  - 落盘 `src/content/posts/{slug}.md`，无 ogImage（走渐变占位）
- 复用现有校验逻辑：`npm run typecheck` 保证 schema 合法。

### 5.2 极简 Web 后台（辅，已确认）

- 范围：网页端**新建文章**（编辑 markdown 正文 + frontmatter），提交后写入仓库触发 CF Pages 自动部署。
- 实现选择：**调 GitHub API 直接写仓库 `src/content/posts/`**（仓库已接入 CF Pages Git 集成，push 即自动构建发布），无需额外服务器。
- 鉴权：GitHub Personal Access Token（只读 + 内容写权限），存储于 Worker 环境变量或页面 localStorage（本地自用，不做多用户）。
- 位置：`src/pages/admin/index.astro`（站点内隐藏入口）或独立静态页，取实现方便。
- 本期为"能用"级别：单用户、无草稿、无图片上传（图片仍走本地脚本/手动）。

## 6. 数据形态与边界

- 阅读量数据在 KV，与文章内容分离；文章内容仍在 md + Git。
- 归档/关于为构建期静态页，无运行时依赖。
- 所有动态能力失败都必须**静默降级**，不影响静态站可用性。

## 7. 范围裁剪（YAGNI，本期不做）

- ❌ 评论系统（架构预留：模块间不耦合，未来可加第三方或自研）
- ❌ 阅读量防刷/去重、多作者、草稿系统、图片上传
- ❌ 热门文章按阅读量排序
- ❌ 构建期阅读量注入（对 SEO 无意义）

## 8. 测试与验证

- 每模块落地后：`npm run typecheck` + `npm run build` 全绿。
- 归档/关于页：构建产物中存在对应 HTML，导航指向正确。
- Worker：本地 `wrangler dev` 冒烟（GET/POST 计数），部署后 curl 验证。
- 文章页：构建产物包含阅读量展示容器；无 Worker 时页面正常（降级验证）。

## 9. 实施顺序

1. **P1 页面补全**（纯静态，零风险）：归档页 + 关于页 + Header 导航修正
2. **P2 阅读量**：Worker + KV + 文章页展示 + 部署脚本
3. **P3 写作流**：new-post.mjs 本地脚本 → 极简 Web 后台
4. 每阶段独立提交 + 推送，随时可上线
