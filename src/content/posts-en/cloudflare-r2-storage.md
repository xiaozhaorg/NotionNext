---
title: "Cloudflare R2 Object Storage Guide: 10GB Free, Best S3 Alternative"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Complete guide to Cloudflare R2 object storage. Learn S3-compatible API, CDN integration, custom domain setup, and zero egress fees. The best free AWS S3 alternative."
author: "Xiaozha"
tags: ["Cloudflare", "Tutorial", "Free Tools", "Storage"]
featured: false
draft: false
ogImage: "/images/cloudflare-r2-storage-real.jpg"
coverAlt: "Blue storage array lights in a cloud server room"
zhSlug: "cloudflare-r2-storage"
---

If you have ever shipped an application that stores user uploads, you already know the surprise bill story: storage is cheap, but **egress traffic is what hurts**. A viral image, a popular video, a sudden spike in downloads — and your AWS bill jumps from $5 to $500 overnight.

**Cloudflare R2** is the storage service that flips that model on its head. It is S3-compatible, fast, and — most importantly — charges **zero egress fees**. On top of that, the free tier gives you **10 GB of storage and 10 million Class B operations per month**, which is enough to host a small static site, a photo gallery, or backup files for a side project.

This guide walks through everything you need to know to ship R2 in production: pricing, creating buckets, S3 API access, rclone and aws CLI usage, custom domains, public vs private buckets, R2 + Workers for image transformation, and migration from AWS S3.

---

## What Is Cloudflare R2 and Why Use It?

Cloudflare R2 is an S3-compatible object storage service that runs on Cloudflare's global network. "S3-compatible" means any tool that speaks the AWS S3 API — `aws` CLI, `rclone`, Boto3, the JS SDK, MinIO clients — can talk to R2 with minimal changes.

The single biggest reason people move to R2 is the **zero egress fee** policy.

### The Egress Problem with AWS S3

AWS S3 itself is inexpensive for storage — about $0.023 per GB / month on the Standard tier. The catch is in **data transfer out (egress)**:

| AWS S3 (us-east-1) | Price |
| --- | --- |
| Storage | $0.023 / GB / month |
| PUT / COPY / POST / LIST (Class A) | $0.005 per 1,000 |
| GET / SELECT (Class B) | $0.0004 per 1,000 |
| **Data transfer OUT to internet** | **$0.09 / GB** |

If you serve 100 GB of files per month, AWS charges you **$9 just for egress**. At 1 TB it becomes $90. At 10 TB it becomes $900. R2 charges $0 for the same traffic.

### Why R2 Is Different

R2 sits behind Cloudflare's edge network. When you put a custom domain on a public bucket, requests are served from Cloudflare's CDN — and CDN-to-origin traffic inside Cloudflare is free. That means:

- **Zero egress fees**, no matter how much you serve.
- **Free CDN** — global edge caching with no extra configuration.
- **S3-compatible API** — drop-in replacement for most S3 code.
- **Free tier** — generous limits for hobby projects.

---

## R2 Pricing: 10 GB Free, No Egress Fees

R2's pricing is intentionally simpler than S3.

| R2 | Price |
| --- | --- |
| Storage (Standard) | $0.015 / GB / month |
| Storage (Infrequent Access) | $0.01 / GB / month |
| Class A operations (PUT, COPY, POST, LIST) | $4.50 / million |
| Class B operations (GET, SELECT) | $0.36 / million |
| **Egress to internet** | **$0** |
| **Free tier (per month)** | **10 GB storage, 1M Class A, 10M Class B operations** |

Compared to S3:

- Storage: ~35% cheaper ($0.015 vs $0.023 / GB).
- Class A operations: 10% cheaper ($4.50 vs $5.00 / million).
- Class B operations: 10% cheaper ($0.36 vs $0.40 / million).
- **Egress: 100% cheaper** ($0 vs $0.09 / GB).

For a content-heavy app (images, videos, downloads), the egress savings alone are usually the reason to switch.

---

## Creating an R2 Bucket

To use R2, you need a Cloudflare account (the free tier works). Once you are logged in:

1. Open the Cloudflare dashboard.
2. In the left sidebar, click **R2 Object Storage**.
3. If it is your first time, you'll be asked to add a payment method (required even for the free tier, to verify identity — you won't be charged as long as you stay within free limits).
4. Click **Create bucket**.
5. Fill in:
   - **Bucket name**: must be DNS-safe (lowercase, no underscores, e.g. `my-app-uploads`).
   - **Location hint**: `Automatic` (recommended), `North America`, or `Europe / Middle East / Africa` (EMEA). Pick the region closest to most of your users.
6. Click **Create**.

You now have a bucket. Next, you need API credentials to talk to it.

---

## S3-Compatible API Access

R2 speaks the AWS S3 API, but you need **account-specific S3 credentials** to authenticate. Generate them once per project.

### Create an API Token

1. In the R2 dashboard, click **Manage R2 API Tokens** (top right).
2. Click **Create API Token**.
3. Configure:
   - **Token name**: e.g. `my-app-r2`.
   - **Permissions**: **Admin Read & Write** for full access, or **Object Read & Write** scoped to a single bucket.
   - **Specify bucket**: optional, recommended for least-privilege.
   - **TTL**: leave empty for a non-expiring token, or set a date.
4. Click **Create API Token**.

You will get a one-time view of:

- **Access Key ID** (e.g. `a1b2c3d4...`)
- **Secret Access Key** (e.g. `e5f6g7h8...`)
- **Endpoint URL** (e.g. `https://<accountid>.r2.cloudflarestorage.com`)
- **Jurisdiction-specific endpoint** for EU/US if applicable.

Save these — Cloudflare will not show the secret again.

### Build the S3 Endpoint URL

The S3 endpoint always follows the pattern:

```
https://<account_id>.r2.cloudflarestorage.com
```

You can read the `<account_id>` from the endpoint Cloudflare gives you. Every bucket you own lives under the same endpoint, distinguished by the bucket name.

---

## Using rclone with R2

[`rclone`](https://rclone.org) is the Swiss Army knife of cloud storage. It speaks R2 (and S3, GCS, Azure, Backblaze, etc.) and lets you sync, copy, mount, and encrypt files between any two backends.

### Install rclone

```bash
# Linux / macOS
curl https://rclone.org/install.sh | sudo bash

# Windows (Scoop)
scoop install rclone
```

### Configure the R2 remote

```bash
rclone config
```

Walk through the prompts:

```
n) New remote
name> r2
Storage> s3
provider> Cloudflare
env_auth> false
access_key_id> <your R2 Access Key ID>
secret_access_key> <your R2 Secret Access Key>
endpoint> https://<account_id>.r2.cloudflarestorage.com
acl> (leave blank)
```

### Common rclone commands

```bash
# List all R2 buckets
rclone lsd r2:

# List files in a bucket
rclone ls r2:my-app-uploads

# Sync a local directory to R2
rclone sync ./local-images r2:my-app-uploads/images --progress

# Copy an R2 file back to local
rclone copy r2:my-app-uploads/images/cat.jpg ./downloads/

# Mount a bucket as a local filesystem (Linux/macOS)
mkdir ~/r2-mount
rclone mount r2:my-app-uploads ~/r2-mount --vfs-cache-mode writes
```

`--progress` is great for large uploads, and `rclone bisync` lets you keep two locations truly two-way synchronized.

---

## Using the AWS CLI with R2

Because R2 is S3-compatible, you can use the official `aws` CLI. Configure a **named profile** so you don't overwrite your AWS credentials.

### Install the AWS CLI

```bash
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip awscliv2.zip
sudo ./aws/install

# macOS
brew install awscli

# Windows
winget install Amazon.AWSCLI
```

### Configure the r2 profile

```bash
aws configure --profile r2
# AWS Access Key ID: <your R2 Access Key ID>
# AWS Secret Access Key: <your R2 Secret Access Key>
# Default region name: auto
# Default output format: json
```

Then edit `~/.aws/credentials` and add the endpoint:

```ini
[r2]
aws_access_key_id = <your R2 Access Key ID>
aws_secret_access_key = <your R2 Secret Access Key>
```

Add the endpoint via a profile in `~/.aws/config`:

```ini
[profile r2]
region = auto
s3 =
  endpoint_url = https://<account_id>.r2.cloudflarestorage.com
  addressing_style = path
```

The `addressing_style = path` is important — R2 uses path-style URLs (`/bucket/key`), not virtual-hosted-style (`bucket.host`).

### Use it

```bash
# List buckets
aws --profile r2 s3 ls

# List objects in a bucket
aws --profile r2 s3 ls s3://my-app-uploads/

# Upload a file (set public-read on the object)
aws --profile r2 s3 cp cat.jpg s3://my-app-uploads/images/ \
  --acl public-read \
  --content-type "image/jpeg"

# Recursive sync
aws --profile r2 s3 sync ./local-folder s3://my-app-uploads/ --delete
```

That's it — the same commands you used against S3 work against R2.

---

## Custom Domain Setup for Public Access

R2 buckets are private by default. To serve files publicly, you have two options: a **public bucket URL** (`*.r2.dev`) or a **custom domain** (your own domain).

### Option A: Public bucket URL (r2.dev)

The fast path:

1. Open your bucket in the R2 dashboard.
2. Go to **Settings** → **Public access** → **R2.dev subdomain**.
3. Click **Allow Access**.
4. You'll get a URL like `https://pub-abc123.r2.dev`.

This works immediately, but `r2.dev` is intended for testing and is rate-limited. For production, use a custom domain.

### Option B: Custom domain (recommended)

R2 + Cloudflare's CDN = your domain, served from the global edge.

1. Open your bucket → **Settings** → **Public access** → **Custom domains**.
2. Click **Connect Domain**.
3. Enter your domain (e.g. `cdn.example.com`). It must be a domain already added to your Cloudflare account.
4. Cloudflare adds the necessary DNS record automatically.
5. Wait ~30 seconds — your bucket is now reachable at `https://cdn.example.com/<key>`.

To upload a publicly readable file via the S3 API, set the `Content-Type` and `x-amz-acl: public-read` headers. With `aws` CLI:

```bash
aws --profile r2 s3 cp cat.jpg s3://my-app-uploads/images/cat.jpg \
  --acl public-read \
  --content-type "image/jpeg"
```

It is now accessible at `https://cdn.example.com/images/cat.jpg`, cached at the edge.

---

## Public Bucket vs Private Bucket

Most apps need both:

- **Public bucket** for static assets served to the world (images, CSS, JS, downloads).
- **Private bucket** for user data that requires signed URLs or per-request authorization.

### Make a Bucket Fully Public

R2 doesn't have an "S3 bucket policy" exactly like AWS, but with a custom domain you effectively make the bucket public — anyone with a URL can read an object. Use this only for assets that are meant to be public.

### Keep a Bucket Private

A bucket with no public access configured remains private. To grant temporary access to a private object, generate a **presigned URL**:

```bash
aws --profile r2 s3 presign s3://private-bucket/invoices/user-42.pdf \
  --expires-in 3600
```

This returns a URL that works for one hour. Use it to let a logged-in user download a private file without exposing the bucket publicly.

For Node.js apps, the same presign logic works with the AWS SDK v3:

```typescript
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: "https://<account_id>.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const url = await getSignedUrl(
  r2,
  new GetObjectCommand({ Bucket: "private-bucket", Key: "invoices/user-42.pdf" }),
  { expiresIn: 3600 }
);
```

This pattern keeps your bucket fully private while still letting users download their own files.

---

## R2 + Cloudflare Workers for Image Transformation

R2 alone is just storage. Pair it with **Cloudflare Workers** and you get a powerful, free image transformation pipeline.

### Use Case

Store original images in R2. Use a Worker to:

- Resize images on the fly.
- Convert to WebP/AVIF.
- Serve a CDN-cached thumbnail for performance.

### Sample Worker

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    if (!key) return new Response("Not found", { status: 404 });

    // Pull the original image from R2
    const object = await env.MY_BUCKET.get(key);
    if (!object) return new Response("Not found", { status: 404 });

    // Cloudflare's image resizing (requires Pro/Biz plan)
    const options = { cf: { image: { width: 400, height: 400, format: "webp" } } };
    return new Response(object.body, {
      headers: { "content-type": object.httpMetadata?.contentType || "image/jpeg" },
      ...options,
    });
  },
};
```

Bind R2 to the Worker via `wrangler.toml`:

```toml
name = "r2-images"
main = "src/index.ts"
compatibility_date = "2024-09-01"

[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-app-uploads"
```

Deploy:

```bash
npx wrangler deploy
```

Now `https://r2-images.<subdomain>.workers.dev/images/cat.jpg` serves the R2 object directly, and the Worker can sit in front of it to resize, watermark, or rewrite responses — all on the edge, in single-digit milliseconds of latency.

---

## Migration from AWS S3 to R2

Moving data from S3 to R2 is straightforward. The two main options:

### Option 1: rclone copy

The simplest one-liner:

```bash
# Configure both remotes first (rclone config)
rclone copy s3:my-old-bucket r2:my-new-bucket --progress --transfers 32
```

`--transfers 32` runs 32 parallel uploads, dramatically speeding up large migrations. Add `--checkers 16` to parallelize listings too.

### Option 2: Cloudflare's official migration tool

Cloudflare provides an in-dashboard migration tool:

1. Open your R2 bucket.
2. Go to **Settings** → **Data Transfer** → **Migrate from AWS S3**.
3. Provide AWS credentials scoped to the source bucket.
4. Cloudflare copies objects for you, in the background, without consuming your bandwidth.

Use this if you have hundreds of GBs and don't want to babysit the transfer.

### Update your application

After the data is moved, update your app's environment variables:

```env
# Old (AWS S3)
AWS_ENDPOINT=https://s3.us-east-1.amazonaws.com
AWS_BUCKET=my-old-bucket

# New (Cloudflare R2)
AWS_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
AWS_BUCKET=my-new-bucket
AWS_REGION=auto
S3_FORCE_PATH_STYLE=true
```

Most S3-compatible SDKs only need the endpoint changed. Path-style addressing is required, so enable it (the `aws` CLI does so via the profile setting `addressing_style = path`).

---

## R2 vs S3 vs GCS vs Azure Blob — Comparison

| Feature | Cloudflare R2 | AWS S3 | Google Cloud Storage | Azure Blob Storage |
| --- | --- | --- | --- | --- |
| Storage (Standard) | $0.015 / GB | $0.023 / GB | $0.020 / GB | $0.018 / GB |
| Egress to internet | **$0** | $0.09 / GB | $0.12 / GB | $0.087 / GB |
| Free tier | 10 GB + 10M GET/mo | 5 GB / 12 months | 5 GB / 90 days | 5 GB / 12 months |
| S3-compatible API | Yes | Native | Yes (interoperability) | Yes (with v2 API) |
| Built-in CDN | Yes (Cloudflare edge) | Only via CloudFront (paid) | Only via Cloud CDN (paid) | Only via Front Door (paid) |
| Custom domain | Free, easy | Extra config + CloudFront | Extra config + Cloud CDN | Extra config + Front Door |
| Infrequent access tier | Yes | Yes (Glacier, IA) | Yes (Nearline, Coldline) | Yes (Cool, Archive) |
| Object versioning | Yes | Yes | Yes | Yes |
| Edge compute (Workers) | Yes | Lambda@Edge | Cloud Run on GCP | Azure Functions |

The pattern is clear: if you serve a lot of traffic, R2 is almost always the cheapest. If you need Glacier-style archival or long-term compliance storage, AWS S3 still has more depth.

---

## Summary

Cloudflare R2 is the most cost-effective object storage on the market for any application that serves content to users. In this guide you learned:

1. **Why R2 wins**: zero egress fees, cheaper storage than S3, free CDN.
2. **Pricing**: 10 GB free, then $0.015 / GB / month, with operation costs slightly below S3.
3. **How to create a bucket** in the Cloudflare dashboard.
4. **S3-compatible API access** via account-specific endpoint, access key, and secret.
5. **rclone** to sync, copy, and mount buckets from any local machine.
6. **AWS CLI** with a dedicated `r2` profile and path-style addressing.
7. **Custom domains** to serve public objects from `cdn.example.com` on the edge.
8. **Public vs private buckets** and how to issue presigned URLs for temporary access.
9. **R2 + Workers** for on-the-fly image resizing and transformation.
10. **Migration from S3** with `rclone copy` or Cloudflare's built-in migration tool.

The free tier alone is enough to host a portfolio site, a personal photo gallery, or backups for a side project. Sign up, create a bucket, and try it — the whole setup takes under five minutes.

If you found this R2 tutorial useful, you might also enjoy our guides on [Cloudflare Tunnel for exposing local services](/en/articles/cloudflare-tunnel-tutorial) and [Docker Compose for multi-container apps](/en/articles/docker-compose-tutorial). Happy storing! 🚀
