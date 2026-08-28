---
title: "Immich Self-Hosted Photo Backup: Google Photos Alternative with AI"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Immich is the best open-source self-hosted photo backup app with AI face recognition, auto-tagging, and map view. A complete Google Photos alternative."
author: "Xiaozha"
tags: ["Self-Hosting", "Open Source", "Tutorial", "Free Tools"]
featured: false
draft: false
ogImage: "/images/immich-photo-backup-real.jpg"
coverAlt: "Green circuit board with chips and data lines close-up"
zhSlug: "immich-photo-backup"
---

If you have ever opened Google Photos and realized the company knows every face in your life, every place you have ever been, and every picture you have ever taken, you have probably asked the obvious question: **"Can I run my own Google Photos?"**

The answer is **Immich** — an open-source, self-hosted photo and video backup solution that comes shockingly close to the Google Photos experience. It has AI face recognition, automatic object tagging, a world map view, shared albums, and polished iOS / Android apps with auto-upload. The big difference is that your photos live on your own server, behind your own firewall, under your own control.

This guide walks through deploying Immich with Docker Compose, configuring it, setting up the mobile app for auto-upload, migrating from Google Photos, and tuning performance for large libraries.

---

## What Is Immich and Why Self-Host Your Photos?

Immich is a self-hosted, high-performance photo and video backup server. It is written in TypeScript (backend + web) and Python (machine learning), uses PostgreSQL for metadata, Redis for caching and queues, and ships native mobile clients for iOS and Android.

The motivation for self-hosting photos is simple:

- **Privacy.** Your photos contain the most sensitive data in your digital life — faces of family members, your home, your kids, your travel patterns. Uploading that to a third party is a privacy decision, not a technical one.
- **Cost.** Google Photos offers 15 GB free; after that you pay Google One. A 1 TB plan is around $10 / month. A $5 / month home server with a 4 TB drive holds 10× the photos for the same price.
- **No compression.** Google Photos in "Storage Saver" quality recompresses your media. Immich stores the original file byte-for-byte.
- **AI features that stay private.** Face recognition and CLIP-powered semantic search run on your own hardware. No face embeddings leave your server.
- **No lock-in.** Files live on your filesystem in their original filenames. Stop using Immich tomorrow? `rsync` your library out and you're done.

---

## Immich Features

What you get out of the box:

- **Auto-upload from mobile** — background upload of new photos the moment they are taken, on Wi-Fi or cellular.
- **AI face recognition** — every person detected becomes a "People" tile you can name; Immich groups all photos of that person.
- **CLIP semantic search** — search "sunset over the ocean" and get relevant photos even if no file is tagged that way.
- **Object / scene tagging** — automatic tags for "beach", "dog", "snow", "food".
- **Map view** — a world map showing where every geo-tagged photo was taken.
- **Shared albums** — share albums with other Immich users or external people via link.
- **Read-only public sharing** — expose an album via a public URL.
- **Web uploader** — drag-and-drop bulk upload from a desktop browser.
- **Timeline / Memory** — Google Photos-style "On this day" memories.
- **Native iOS and Android apps** — fully featured, not a web wrapper.
- **Video transcoding** — on-the-fly transcoding for streaming to mobile.
- **OAuth / OIDC** — integrate with Authentik, Authelia, Keycloak.

---

## Prerequisites: Docker and Docker Compose

Immich is a multi-container application. You need:

- A Linux server (Ubuntu 22.04+, Debian 12+, or any distro with Docker support). macOS works for testing; Windows works via WSL2.
- At least 2 GB RAM (4+ GB if you run machine-learning features).
- Docker Engine 24+ and the Docker Compose plugin v2. See our [Docker Compose tutorial](/en/articles/docker-compose-tutorial) if you need to install them.
- A domain or subdomain (recommended) so you can put Immich behind HTTPS. A free [Cloudflare Tunnel](/en/articles/cloudflare-tunnel-tutorial) works perfectly.

Verify your setup:

```bash
docker --version
docker compose version
```

---

## Docker Compose Deployment

Immich ships an official `docker-compose.yml`. We'll use a copy you can adapt.

### Directory layout

```
immich/
├── docker-compose.yml
├── .env
└── library/         # photos will land here
```

### `.env`

```env
# === Upload location ===
UPLOAD_LOCATION=./library

# === Database ===
DB_HOST_NAME=immich-postgres
DB_USERNAME=immich
DB_PASSWORD=ChangeMe-Strong-Password
DB_DATABASE_NAME=immich
DB_DATA_LOCATION=./postgres

# === Redis ===
REDIS_HOSTNAME=immich-redis

# === Immich versions ===
IMMICH_VERSION=release
```

Pick a strong password for `DB_PASSWORD`. This is your database — it stores all metadata, faces, and tags.

### `docker-compose.yml`

```yaml
name: immich

services:
  immich-server:
    container_name: immich_server
    image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION}
    restart: unless-stopped
    command: ["start.sh", "immich"]
    volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
      - /etc/localtime:/etc/localtime:ro
    env_file: .env
    depends_on:
      redis:
        condition: service_healthy
      database:
        condition: service_healthy
    ports:
      - "2283:2283"

  immich-machine-learning:
    container_name: immich_machine_learning
    image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION}
    restart: unless-stopped
    volumes:
      - ./model-cache:/cache
    env_file: .env

  immich-redis:
    container_name: immich_redis
    image: redis:6.2-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  immich-database:
    container_name: immich_postgres
    image: tensorchord/pgvecto-rs:pg14-v0.2.0
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_DB: ${DB_DATABASE_NAME}
      POSTGRES_INITDB_ARGS: "--data-checksums"
    volumes:
      - ${DB_DATA_LOCATION}:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready --username='${DB_USERNAME}' || exit 1; Chksum=\"$(psql --username='${DB_USERNAME}' --dbname='${DB_DATABASE_NAME}' --no-align --tuples-only --command='SELECT coalesce(ss.checksum_failures, 0) FROM (SELECT count(*) AS checksum_failures FROM pg_stat_database WHERE datname = current_database() AND checksum_failure IS true) ss)\"; echo \"checksum failures: ${Chksum}\"; if [ ${Chksum} -gt 0 ]; then exit 1; fi"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 5m

volumes:
  model-cache:
```

A few notes:

- **`pgvecto-rs`** is a Postgres image with the `pgvector` extension bundled. Immich uses it to store face and CLIP embedding vectors. Don't swap in plain `postgres:16` — Immich won't start.
- **`UPLOAD_LOCATION`** is where original photos live on disk. Mount a real disk with the space you need; don't use the OS disk.
- **`model-cache`** holds the ML models (face recognition, CLIP). Cache it on the host so it survives container recreation.
- The default **port 2283** is exposed on the host. Use a reverse proxy (Nginx, Caddy, or Cloudflare Tunnel) to put HTTPS in front.

### Bring it up

```bash
docker compose up -d
docker compose logs -f
```

Wait for the first run to finish (machine learning models download on first boot — about 1 GB of weights). When the logs say "Immich is running on port 3000", open `http://<server-ip>:2283`.

---

## Configuration: First Boot

The first user you create becomes the **admin**. After that you can invite other users, set quotas, and configure storage and machine-learning features.

### Initial Admin Setup

1. Open `http://<server-ip>:2283` in a browser.
2. Click **Get Started**.
3. Fill in admin email, name, password.
4. Log in.

### Storage Templates

Immich stores files using a templated path. The default template is just `YYYY/MM/YYYY-MM-DD/`, but you can customize it under **Administration → Settings → Storage Template**.

A useful template for chronological browsing:

```
{{y}}/{{MM}}/{{filename}}
```

For per-user libraries:

```
{{y}}/{{MM}}/{{filename}}
```

### Machine Learning Settings

Go to **Administration → Settings → Machine Learning**.

- **Smart Search**: enable CLIP-based semantic search.
- **Face Detection**: enables the People view.
- **Facial Recognition**: pairs detected faces across photos.
- **Model**: `buffalo_l` is the default face model. `antelopev2` is more accurate but slower.

If you have a GPU, enable it under the same settings — Immich will use ONNX Runtime with CUDA / CoreML / OpenVINO depending on your platform.

### Library Scan

Immich doesn't scan continuously; it triggers scans when:

- A file is uploaded via the mobile app or web.
- You trigger **Admin → Jobs → Library → Scan**.
- A cron schedule runs.

You can also point Immich at an existing folder of photos (called an **External Library**) and it will index them without copying. This is the fastest way to onboard an existing photo collection.

---

## Mobile App Setup (iOS and Android)

Immich has first-class native mobile apps. Both are free and open source — search "Immich" in the App Store or Play Store.

### Connect to Your Server

1. Open the app.
2. Enter your server URL, e.g. `https://photos.example.com` (recommended over HTTPS) or `http://<server-ip>:2283`.
3. Log in with your admin / user credentials.

### Background Auto-Upload

The killer feature is **background upload**. To enable:

1. Tap **Backup** (iOS) or **Settings → Backup** (Android).
2. Toggle **Auto Backup**.
3. Pick which device albums to include.
4. Choose the upload network rule: **Wi-Fi only** or **Wi-Fi or Cellular**.
5. Grant the necessary background permissions (iOS Background App Refresh, Android battery optimization exceptions).

Once enabled, every new photo you take is silently uploaded within seconds of the next background slot. You can also tap **Back up all** to upload existing photos from the camera roll.

### Background Foreground Limitations (iOS)

iOS limits background time aggressively. Immich handles this by:

- Scheduling short background tasks.
- Using **Push notifications** to wake the app on a real-time schedule (configure under **Admin → Settings → Notifications** if you want this).

In practice the upload delay is at most a few minutes — totally fine for daily use.

---

## Migration from Google Photos (Google Takeout)

If you already have years of photos in Google Photos, migrating them is a two-step process: export via Google Takeout, then ingest via Immich.

### Step 1: Export via Google Takeout

1. Go to [https://takeout.google.com](https://takeout.google.com).
2. Deselect everything, then select **Google Photos**.
3. Choose export format — keep .jpg / .heic / .mp4 originals.
4. Set delivery method: **Send download link via email** or **Add to Drive**.
5. Set archive size to 50 GB to keep file counts manageable.
6. Click **Create Export**. It can take hours or days depending on library size.

You will receive one or more `.zip` files. Each zip contains folders by year (e.g. `Photos from 2023/`) with both media files and a sidecar `JSON` for each — these sidecars hold metadata like dateTaken, geo, and description.

### Step 2: Ingest into Immich

Immich understands Google Takeout's structure. The recommended flow:

1. Unzip all archives into a single folder.
2. Drag the unzipped folder into the **Immich web upload** page (it supports recursive folder upload).
3. Or place the folder in an **external library** path and trigger a scan.

Immich will read the sidecar `.json` files to restore original capture dates and EXIF. Files without sidecars are sorted by file-modification time.

If you have hundreds of GBs, prefer the **external library** route — copying through the browser is slow and may stall.

### Verifying Migration

After the scan completes, go to **Statistics** (your user profile). You should see the total count of assets, the time range, and the space used. Cross-check these against your Google Photos library size to confirm everything moved.

---

## Backup Strategy: External Drive, S3 / R2 Sync

Immich is your primary photo storage. **Primary storage is not backup.** A drive failure should never take your photos with it.

### 1. Local Mirror to an External Drive

The simplest form of backup is to mirror `UPLOAD_LOCATION` to an external USB drive weekly:

```bash
rsync -aP --delete /srv/immich/library/ /mnt/usb-drive/immich-backup/
```

Schedule it with cron:

```cron
0 3 * * 1 rsync -aP --delete /srv/immich/library/ /mnt/usb-drive/immich-backup/ >> /var/log/immich-backup.log 2>&1
```

### 2. Off-site Mirror to S3 or R2

For off-site, push a copy of `UPLOAD_LOCATION` to an S3-compatible bucket. **Cloudflare R2** is ideal — see our [Cloudflare R2 guide](/en/articles/cloudflare-r2-storage) for setup.

Configure rclone with an R2 remote, then schedule a nightly sync:

```bash
rclone sync /srv/immich/library r2:immich-backup --transfers 16 --progress
```

### 3. Database Backup

Don't forget the Postgres database — it stores face clusters, album structures, and tags. Dump it nightly:

```bash
docker exec immich_postgres pg_dump -U immich immich | gzip > /srv/backups/immich-$(date +%F).sql.gz
```

Keep at least 7 days of database dumps off-site as well.

---

## Performance Tips: GPU Acceleration for Face Recognition

Face recognition and CLIP embedding are the most CPU-heavy operations in Immich. On a CPU-only machine, scanning 100k photos can take days.

### Enable GPU in Docker

#### NVIDIA (CUDA)

Install the NVIDIA Container Toolkit on the host:

```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID) \
  && curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
     sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
     sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

Then patch your `docker-compose.yml`:

```yaml
  immich-machine-learning:
    container_name: immich_machine_learning
    image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION}
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ./model-cache:/cache
    env_file: .env
```

Restart the ML container:

```bash
docker compose up -d immich-machine-learning
```

In **Admin → Settings → Machine Learning**, ensure **Face Detection** is still on. Re-run the face detection job — you'll see dramatic speed-ups.

#### Intel (OpenVINO)

For Intel iGPU or Arc, use the OpenVINO image. Replace the image tag:

```yaml
image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION}-openvino
```

And add `/dev/dri` to devices:

```yaml
    devices:
      - /dev/dri:/dev/dri
```

#### macOS (CoreML / Metal)

On Apple Silicon, Immich uses CoreML automatically when you mount `/dev/dri`-equivalent — actually, no extra config is required on macOS, but production Immich deployments are almost always Linux.

### Use Infrequent Background Scans

Even with a GPU, scanning an existing library of 100k+ photos takes hours. Run it once on initial ingest, then leave the **Library Scan** job on a low-frequency schedule (e.g. once per hour) so it doesn't compete with live uploads.

---

## Immich vs Google Photos vs Nextcloud Photos vs PhotoPrism

| Feature | Immich | Google Photos | Nextcloud Photos | PhotoPrism |
| --- | --- | --- | --- | --- |
| Self-hosted | Yes | No | Yes | Yes |
| Open source | Yes | No | Yes | Yes (mostly) |
| Mobile auto-upload | Yes (native app) | Yes | Yes (3rd-party) | No (web only) |
| AI face recognition | Yes (private) | Yes (cloud) | No | Yes |
| Semantic search | Yes (CLIP) | Yes | No | Yes |
| Map view | Yes | Yes | No | Yes |
| Video transcoding | Yes | Yes | Limited | Limited |
| Free tier | Unlimited (your hardware) | 15 GB | Unlimited (your hardware) | Unlimited (your hardware) |
| Originals preserved | Yes | Optional (pay) | Yes | Yes |
| Setup complexity | Medium | N/A | High | Medium |
| Maturity | Active, fast-moving | Mature | Mature | Mature |

Immich wins for users who want the Google Photos UX, the privacy of self-hosting, and modern AI features that run entirely on their own hardware. Nextcloud is more general-purpose (it's a full file-sync suite), and PhotoPrism is strong on static library browsing but lacks a native mobile auto-upload experience.

---

## Summary

Immich is the closest open-source analog to Google Photos, with the privacy and cost benefits of self-hosting. In this tutorial you learned how to:

1. **Understand what Immich is** — a self-hosted photo server with AI face recognition, semantic search, and native mobile apps.
2. **Install prerequisites** — Docker Engine and the Compose plugin.
3. **Deploy with Docker Compose** — Postgres (with pgvector), Redis, server, machine learning, and web, all wired together.
4. **Configure first-run settings** — admin user, storage templates, machine learning models.
5. **Set up the mobile app** for background auto-upload on iOS and Android.
6. **Migrate from Google Photos** via Google Takeout and Immich's Takeout-aware ingestion.
7. **Back up your library** — local mirror, off-site mirror to R2, nightly database dumps.
8. **Accelerate face recognition** with NVIDIA CUDA, Intel OpenVINO, or Apple CoreML.
9. **Compare Immich to alternatives** — Google Photos, Nextcloud Photos, PhotoPrism.

The next step is to do the migration with your own library — there's nothing quite like the moment your last 10 years of photos load in your own timeline, on your own server, fully searchable, with zero data leaving your home. If you found this guide useful, you might also enjoy our tutorials on [Ubuntu Server initial setup](/en/articles/ubuntu-server-setup) and [Cloudflare R2 object storage](/en/articles/cloudflare-r2-storage). Happy photographing! 📸
