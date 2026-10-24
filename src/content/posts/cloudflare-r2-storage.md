---
title: Cloudflare R2 对象存储完全指南：10GB 免费存储，替代 S3 的最佳选择
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Cloudflare R2 提供 10GB 免费存储且不收出口流量费。本文详解创建存储桶、S3 兼容 API、rclone 与 AWS CLI 用法、自定义域名、公开与私有桶、Workers 图片处理，以及从 S3 迁移。
author: 小吒
tags:
  - Cloudflare
  - 教程
  - 免费工具
draft: false
sourceUrl: "https://xiaozha.org/article/cloudflare-r2-storage"
ogImage: "/images/cloudflare-r2-storage-real.jpg"
coverAlt: "云端服务器机房的蓝色存储阵列灯光"
enSlug: "cloudflare-r2-storage"
---

Cloudflare R2 提供 **10GB 免费存储 + 零出口流量费**，是目前个人开发者能拿到的最良心的对象存储。这篇把创建、API 访问、客户端工具、自定义域名、公开/私有、图片处理到迁移一次讲完。

## R2 是什么，为什么用它

对象存储就是"网盘级"的文件存取服务：上传文件、按 key 取文件、配 CDN 加速。AWS S3 是这个领域的标准，但它有个坑。

### S3 的出口流量费

S3 的收费分两块：**存储费**（每 GB 每月几分钱，便宜）和**出口流量费**（每 GB 九分钱起，贵）。一个日访问一万的图片站，光流量费一个月就能上百块——而且访问量涨它跟着涨，没有上限。

### R2 的不同

| | AWS S3 | Cloudflare R2 |
|---|---|---|
| 存储 | $0.023/GB/月 | $0.015/GB/月 |
| **出口流量** | **$0.09/GB 起** | **免费** |
| 免费额度 | 5GB/12 个月 | **10GB 永久** |
| API | S3 原生 | S3 兼容 |
| CDN | CloudFront 另收费 | 自带 |

R2 的零出口费不是促销，是它商业模式决定的：Cloudflare 靠的是整体网络，不指望在流量上挣钱。对小站、个人项目、备份用途，这就是降维打击。

## 定价：10GB 免费，超出部分

- 存储：$0.015/GB/月（10GB 以内免费）
- A 类操作（写入、列举）：$4.50/百万次
- B 类操作（读取）：$0.36/百万次
- **出口流量：$0**

超出免费额度需要绑卡，但个人用量基本都在免费区间内。10GB 存图片能放几千张，存备份也够放不少东西。

## 创建 R2 存储桶

登录 Cloudflare Dashboard → 左侧 **R2** → **Create Bucket**。

- **Bucket 名称**：全局唯一，小写字母数字连字符，比如 `my-blog-images`
- **位置**：选自动（Automatic）即可，R2 会自动分布到离用户近的节点
- **存储类**：Standard 就行，Infrequent Access 是给长期不读的冷数据用的，有取回费

创建完进 Bucket 详情页，可以直接在网页上拖拽上传文件——适合临时传几个文件，批量还是用客户端。

## S3 兼容 API 访问

R2 的 API 完全兼容 S3 协议，所以任何支持 S3 的工具都能直接用，只改 endpoint 和密钥。

### 创建 API Token

R2 → **Manage R2 API Tokens** → **Create API Token**。

- **Token 名称**：随意，比如 `rclone-backup`
- **权限**：按需选。只读用 `Object Read Only`；要上传用 `Object Read & Write`；要管理桶用 `Admin Read & Write`
- **TTL**：默认永久。介意的话设个过期时间

创建后**立刻保存 Access Key ID 和 Secret Access Key**——Secret 只显示这一次，关掉页面就再也看不到了。

### 拼 Endpoint URL

R2 的 endpoint 格式：

```
https://<account-id>.r2.cloudflarestorage.com
```

`<account-id>` 在 Dashboard 右侧栏能看到。记住这个，下面所有客户端配置都要用。

## 用 rclone 操作 R2

rclone 是命令行里的"网盘瑞士军刀"，同步、挂载、校验都能干，配 R2 最顺手。

### 安装

```bash
# Linux
sudo apt install rclone     # 或 curl https://rclone.org/install.sh | sudo bash

# macOS
brew install rclone

# Windows
scoop install rclone
```

### 配置 R2 remote

```bash
rclone config
```

按提示走：选 `n`（new remote）→ 起名 `r2` → 存储类型选 `AWS S3`（R2 兼容它，没有专门的 R2 类型）→ provider 选 `Cloudflare`。

关键几项：

```text
access_key_id: <你的 R2 Access Key ID>
secret_access_key: <你的 R2 Secret Access Key>
region: auto
endpoint: https://<account-id>.r2.cloudflarestorage.com
```

其余保持默认，保存退出。

### 常用命令

```bash
# 列出所有桶
rclone lsd r2:

# 列出桶内文件
rclone ls r2:my-bucket

# 本地目录同步到 R2
rclone sync /path/to/local r2:my-bucket/path --progress

# 从 R2 拉回本地
rclone copy r2:my-bucket/path /path/to/local --progress

# 把桶挂载成本地目录（Linux/macOS）
rclone mount r2:my-bucket /mnt/r2 --vfs-cache-mode writes
```

`sync` 是镜像同步（删本地也删远端），`copy` 是单向复制（不删远端）。做备份用 `sync` 要谨慎，先 `--dry-run` 看一眼。

## 用 AWS CLI 操作 R2

已经习惯 AWS CLI 的话，加个 profile 就行，不用装新工具。

```bash
aws configure --profile r2
```

```text
AWS Access Key ID: <你的 R2 Access Key ID>
AWS Secret Access Key: <你的 R2 Secret Access Key>
Default region name: auto
Default output format: json
```

注意：**必须加 `--endpoint-url`**，否则 AWS CLI 会去连真正的 S3。

```bash
# 列出桶
aws s3 ls --endpoint-url https://<account-id>.r2.cloudflarestorage.com --profile r2

# 列出对象
aws s3 ls s3://my-bucket/ --endpoint-url https://<account-id>.r2.cloudflarestorage.com --profile r2

# 上传文件并设为公开可读
aws s3 cp local-file.jpg s3://my-bucket/ \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile r2 --acl public-read

# 递归同步
aws s3 sync ./dist s3://my-bucket/ \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com --profile r2
```

## 自定义域名（公开访问）

R2 桶默认**私有**，直接用 API 才能访问。想让文件能通过 URL 公开下载，两条路：

### 方案 A：r2.dev 公共域名

Bucket → **Settings** → **Public Access** → 开启 `r2.dev` 域名。

会得到一个 `https://pub-<hash>.r2.dev` 地址，桶内所有文件公开可访问。

**缺点**：Cloudflare 已经**停止给新桶签发 r2.dev 域名**（滥用太多），且现有域名随时可能被收回。只适合临时测试。

### 方案 B：绑定自定义域名（推荐）

Bucket → **Settings** → **Public Access** → **Connect Domain** → 输入子域名，比如 `cdn.example.com`。

Cloudflare 会自动配上 DNS 和 SSL。之后文件地址就是：

```
https://cdn.example.com/文件路径
```

这个域名走的是 Cloudflare 全球 CDN，国内访问速度取决于 Cloudflare 对你的线路优化情况（见《Cloudflare 国内加速实战》）。

**建议**：生产用途一定绑自己的域名，别用 r2.dev。

## 公开桶 vs 私有桶

### 完全公开桶

适合：博客图片、静态资源、前端打包产物。

配好自定义域名后，任何人拿到 URL 都能下载。别放敏感文件——URL 泄露就等于文件泄露。

### 私有桶 + 签名访问

适合：用户上传的文件、备份数据、付费内容。

桶保持私有，需要访问时用 R2 的 S3 API 生成**预签名 URL**，带过期时间：

```bash
aws s3 presign s3://my-bucket/private-file.jpg \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --expires-in 3600     # 一小时后失效
```

生成一个临时链接发给用户，过期自动作废。这是对接"用户头像""付费下载"这类场景的正确做法。

## R2 + Workers 做图片处理

R2 存原图，Workers 在边缘做缩放裁剪，按需返回。这是把 R2 当图床用的完整方案，省掉自己搭图片服务的麻烦。

典型场景：文章里存一张 4000×3000 的原图，列表页要 400px 缩略图，详情页要 1200px，分享卡片要 630px。用 Workers 一个路由全搞定。

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // /images/photo.jpg?w=400&h=300
    const key = url.pathname.replace(/^\//, "");
    if (!key) return new Response("Not found", { status: 404 });

    const object = await env.MY_BUCKET.get(key);
    if (!object) return new Response("Not found", { status: 404 });

    // 带缩放参数才走图片处理，原图直接返回
    const w = url.searchParams.get("w");
    const h = url.searchParams.get("h");
    if (!w && !h) {
      return new Response(object.body, {
        headers: { "Content-Type": object.httpMetadata?.contentType || "application/octet-stream" },
      });
    }

    const image = object.body;
    const transformed = await env.IMAGES
      .input(image)
      .transform({ width: w ? Number(w) : undefined, height: h ? Number(h) : undefined, fit: "cover" })
      .output({ format: "image/webp", quality: 82 });

    return new Response(transformed, {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  },
};
```

在 Worker 的 R2 绑定里把桶绑成 `MY_BUCKET`，配好自定义域名，就能用：

```
https://cdn.example.com/images/photo.jpg?w=400&h=300
```

返回自动裁剪 + 转 WebP 的缩略图。原图不动，一份存储多种尺寸。

## 从 AWS S3 迁移

已经在用 S3 的话，迁过去就是改 endpoint 的事。

### 方案一：rclone 直接搬

先在 `rclone config` 里配好源（`s3`）和目标（`r2`）两个 remote，然后：

```bash
# 先 dry-run 看看会传多少文件
rclone copy s3:old-bucket r2:new-bucket --dry-run

# 确认无误正式跑，多线程 + 断点续传
rclone copy s3:old-bucket r2:new-bucket --transfers 16 --checksum --progress
```

几十 GB 的数据建议挂 `screen` 或 `nohup` 跑，网络断了重跑同一条命令，rclone 会跳过已传完的。

### 方案二：Cloudflare 官方迁移工具

Dashboard → R2 → **Migrate from S3**，填源桶和凭证，Cloudflare 后台帮你搬。适合不想在命令行折腾的，但可控性差一些。

### 改应用代码

只需要改 SDK 配置里的 endpoint 和密钥，代码逻辑不用动：

```javascript
// 旧（AWS S3）
const s3 = new S3Client({ region: "us-east-1" });

// 新（Cloudflare R2）
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://<account-id>.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});
```

`region` 固定填 `auto`，这是 R2 的特殊要求。

## R2 vs S3 vs GCS vs Azure Blob

| | R2 | AWS S3 | Google GCS | Azure Blob |
|---|---|---|---|---|
| 免费额度 | **10GB 永久** | 5GB / 12 月 | 5GB / 12 月 | 5GB / 12 月 |
| 存储单价 | $0.015 | $0.023 | $0.020 | $0.018 |
| **出口流量** | **免费** | $0.09/GB | $0.12/GB | $0.087/GB |
| S3 兼容 | 是 | 原生 | 部分 | 部分 |
| 自带 CDN | 是 | 否 | 是 | 否 |
| 冷存储选项 | 有 | 有（Glacier） | 有 | 有 |

结论很直接：**个人项目、小站、备份场景选 R2**，没有第二个选项。只有当你的应用深度绑定 AWS 生态（Lambda、SQS、DynamoDB 那一套）时，留在 S3 才合理。

## 小结

R2 的关键价值是**零出口流量费**——这一项就把它和 S3 拉开了代差。对小站长来说，流量费从"随访问量线性增长的恐惧"变成"不需要考虑的事"。

用起来的路径：建桶 → 拿 API Token → 配 rclone → 绑自定义域名 → （可选）接 Workers 做图片处理。半小时能跑通，之后就是一个免费、不限流量、全球 CDN 加速的存储服务。

接着可以看《Cloudflare 数据层三件套》给 Workers 应用加数据库，或者《Cloudflare Tunnel 免费内网穿透》把本地服务暴露到公网。
