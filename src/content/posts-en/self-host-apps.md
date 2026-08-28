---
title: "20 Essential Self-Hosted Open Source Apps: Ditch Paid Cloud Subscriptions"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "The 20 best open-source apps worth self-hosting to replace paid cloud services. From notes, cloud storage, media to collaboration tools. Take control of your data."
author: "Xiaozha"
tags: ["Self-Hosting", "Open Source", "Tutorial", "Free Tools"]
featured: false
draft: false
ogImage: "/images/self-host-apps-real.jpg"
coverAlt: "Laptop with data charts on office desk"
zhSlug: "self-host-apps"
---

Somewhere between your streaming bill, your cloud storage subscription, your password manager, your note-taking app, and your team chat tool, a pile of monthly payments quietly adds up to more than your electricity bill. **Self-hosting is the counter-move**: run the same class of software on hardware you own, under a license that never expires, with data that never leaves your control.

This guide collects **20 open-source applications that are genuinely worth self-hosting** in 2026. They're organized by category — notes, cloud storage, media, passwords, automation, monitoring, file sync, collaboration, and bookmarks — and every single one can be deployed in minutes with Docker on any Linux box, a Raspberry Pi, or a cheap VPS.

---

## Why Self-Host at All?

Three reasons keep coming up again and again:

- **Privacy.** Your notes, photos, passwords, and chat logs are the most sensitive data you own. Self-hosting means the people who see them are the people you choose.
- **Cost.** A $5/month VPS or a one-time $200 mini-PC replaces a stack of $5–$15/month subscriptions. The break-even point is usually a few months.
- **Control and longevity.** Open source software doesn't get bought, renamed, or shut down overnight. When a project you depend on disappears, you keep the code.

The tool that makes all of this pleasant is Docker Compose. If you're new to it, our [Docker Compose tutorial](/en/articles/docker-compose-tutorial) is the prerequisite reading — every app below assumes you have Docker installed.

---

## 1. Note-Taking Apps (Replaces Evernote, OneNote, Notion)

### Joplin — Replaces Evernote / OneNote

**Joplin** is a free, open-source note-taking app with Markdown support, end-to-end encryption, and sync across desktop, mobile, and terminal. It keeps your notes in plain Markdown files, so there's zero lock-in — stop using Joplin and your data is just files.

The desktop and mobile apps are the star, but you can self-host **Joplin Server** for sync so your phone and laptop stay in sync without touching a third-party cloud:

```bash
docker run -d --name joplin \
  -p 22300:22300 \
  -e APP_BASE_URL=https://notes.example.com \
  -e APP_PORT=22300 \
  -v joplin-data:/home/joplin \
  joplin/server:latest
```

Then point your apps at the server URL. E2E encryption means even the server can't read your notes.

### Trilium — Replaces Notion / Obsidian

**Trilium** is a hierarchical note-taking app for building large personal knowledge bases. Notes nest infinitely, you can render notes as books or mind-map-style layouts, link between notes with a graph view, and even run small scripts inside notes. It's the closest thing to "personal Notion" that runs on your own server.

```bash
docker run -d --name trilium \
  -p 8080:8080 \
  -v trilium-data:/home/node/trilium-data \
  zadam/trilium:latest
```

Open `http://localhost:8080`, set a password, and start building your second brain.

### AppFlowy — Replaces Notion (Team Workspaces)

**AppFlowy** is an open-source Notion alternative with a Rust core and Flutter UI. It's local-first by default — your data lives in a local database and works offline — and it now ships a self-hosted **AppFlowy Cloud** server for syncing across devices and collaborating in teams.

For a single user, just install the desktop app: no server needed. For team sync, run the **AppFlowy Cloud** server (which needs PostgreSQL, Redis, and an S3-compatible store behind it) via Docker:

```bash
docker run -d --name appflowy \
  -p 8000:8000 \
  -e APPFLOWY_DATABASE_URL=postgres://appflowy:change-me@postgres-host:5432/appflowy \
  appflowyinc/appflowy_server:latest
```

It's the most actively developed Notion alternative in the open-source world.

---

## 2. Cloud Storage (Replaces Dropbox, Google Drive)

### Nextcloud — Replaces Dropbox / Google Drive / iCloud

**Nextcloud** is the Swiss-army knife of self-hosted file storage: files, calendar, contacts, mail, office documents (via Collabora or OnlyOffice), Talk video chat, and hundreds of apps — all in one deploy. If you only self-host one thing, make it Nextcloud.

The full stack needs a database, but the simplest production-ish setup is Nextcloud + MariaDB:

```yaml
services:
  db:
    image: mariadb:11
    restart: unless-stopped
    command: --transaction-isolation=READ-COMMITTED --log-bin=binlog
    environment:
      MYSQL_ROOT_PASSWORD: change-me
      MYSQL_PASSWORD: change-me
      MYSQL_DATABASE: nextcloud
      MYSQL_USER: nextcloud
    volumes:
      - db:/var/lib/mysql

  nextcloud:
    image: nextcloud:stable
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      MYSQL_HOST: db
      MYSQL_PASSWORD: change-me
      MYSQL_DATABASE: nextcloud
      MYSQL_USER: nextcloud
    volumes:
      - nextcloud:/var/www/html
    depends_on:
      - db

volumes:
  db:
  nextcloud:
```

The Nextcloud mobile apps (files, photos auto-upload, notes) are excellent and make it a true Dropbox replacement.

### Seafile — Replaces Dropbox (Performance-First)

**Seafile** focuses on one thing and does it brilliantly: fast, reliable file sync. Its client is the fastest open-source sync client you'll find, file locking works for teams, and the server supports built-in file encryption. It's lighter than Nextcloud when you only need file sync, not the whole suite.

```bash
docker run -d --name seafile \
  -p 8080:80 \
  -e SEAFILE_SERVER_HOSTNAME=files.example.com \
  -e SEAFILE_ADMIN_EMAIL=admin@example.com \
  -e SEAFILE_ADMIN_PASSWORD=change-me \
  -v seafile-data:/shared \
  seafile/seafile:latest
```

Pick Nextcloud for an all-in-one workspace; pick Seafile for pure, fast file sync at scale.

---

## 3. Media (Replaces Netflix, Spotify, Google Photos)

### Jellyfin — Replaces Plex / Emby / Netflix

**Jellyfin** is the leading free and open-source media server. Organize your movies and TV shows, stream to every device in your home, and transcode on the fly to match the screen. Unlike Plex, there are no premium features locked behind a paywall — everything is free. Full guide here: [Jellyfin media server setup](/en/articles/jellyfin-media-server).

```bash
docker run -d --name jellyfin \
  -p 8096:8096 \
  -v jellyfin-config:/config \
  -v jellyfin-cache:/cache \
  -v /path/to/media:/media \
  linuxserver/jellyfin:latest
```

Point it at your media folder, and the Jellyfin apps on your TV, phone, and browser just work.

### Navidrome — Replaces Spotify / Apple Music

**Navidrome** is a modern music streaming server for your own library. It's compatible with the Subsonic API, which means dozens of client apps work with it out of the box — including Finamp and Sonixd. Stream your lossless FLACs anywhere, with scrobbling, smart playlists, and a beautiful web UI.

```bash
docker run -d --name navidrome \
  -p 4533:4533 \
  -v navidrome-data:/data \
  -v /path/to/music:/music:ro \
  -e ND_BASEURL=http://localhost:4533 \
  deluan/navidrome:latest
```

### PhotoPrism — Replaces Google Photos (Management)

**PhotoPrism** is a self-hosted photo manager with AI-powered tagging and classification. It detects faces and objects, maps geo-tagged photos on a world map, and applies filters to clean up your library. Great for the "organize 10 years of photos" job.

```bash
docker run -d --name photoprism \
  -p 2342:2342 \
  -e PHOTOPRISM_ADMIN_PASSWORD=change-me \
  -v photoprism:/photoprism/storage \
  -v /path/to/photos:/photoprism/originals \
  photoprism/photoprism:latest
```

### Immich — Replaces Google Photos (Backup + AI)

**Immich** is the closest thing to a real Google Photos replacement: automatic mobile backup, AI face recognition, CLIP semantic search, shared albums, and a world map. We have a complete deployment guide here: [Immich self-hosted photo backup](/en/articles/immich-photo-backup).

The tl;dr is a Docker Compose stack with `ghcr.io/immich-app/immich-server` plus PostgreSQL and Redis. Install the mobile app, enable auto-upload, and your photos stop going to Google.

PhotoPrism vs Immich: PhotoPrism is better for managing and curating an existing library; Immich is better for ongoing automatic backup from phones.

---

## 4. Password Managers (Replaces 1Password, LastPass)

### Vaultwarden — Replaces 1Password / LastPass / Bitwarden Cloud

**Vaultwarden** is a lightweight, community-written reimplementation of the Bitwarden server, written in Rust. The best part: it's a **drop-in replacement for the official Bitwarden server**, so all official Bitwarden clients (desktop, mobile, browser extension, CLI) work with it unchanged — you keep the polished Bitwarden apps and simply point them at your own server.

```bash
docker run -d --name vaultwarden \
  -p 8080:80 \
  -e DOMAIN=https://vault.example.com \
  -e SIGNUPS_ALLOWED=false \
  -v vaultwarden-data:/data \
  vaultwarden/server:latest
```

Set `SIGNUPS_ALLOWED=false` after creating your account, and enable the admin panel to manage users. Put it behind HTTPS immediately — this one holds every password you own.

### Passbolt — Replaces TeamPassword / 1Password Teams

**Passbolt** is an open-source password manager designed for teams. It uses OpenPGP for encryption (each secret is encrypted with the recipient's public key), supports granular folder sharing and permissions, and ships a browser extension and mobile app. The self-hosted community edition supports up to 10 users for free.

```yaml
services:
  db:
    image: mariadb:11
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: change-me
      MYSQL_DATABASE: passbolt
      MYSQL_USER: passbolt
      MYSQL_PASSWORD: change-me
    volumes:
      - db:/var/lib/mysql

  passbolt:
    image: passbolt/passbolt:latest
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      DATASOURCES_DEFAULT_HOST: db
      DATASOURCES_DEFAULT_DATABASE: passbolt
      DATASOURCES_DEFAULT_USERNAME: passbolt
      DATASOURCES_DEFAULT_PASSWORD: change-me
      APP_FULL_BASE_URL: https://pass.example.com
    volumes:
      - gpg:/var/www/passbolt/config/gpg
    depends_on:
      - db

volumes:
  db:
  gpg:
```

Vaultwarden is the go-to for individuals and small families; Passbolt shines when you need team sharing with real permission controls.

---

## 5. Workflow Automation (Replaces Zapier, IFTTT)

### n8n — Replaces Zapier / Make

**n8n** is a fair-code, self-hostable workflow automation tool with **400+ integrations** and a visual, drag-and-drop editor. The killer advantage over Zapier: no per-workflow task limits and no "50 workflows" ceiling — you're only limited by your own server. We have a complete tutorial here: [n8n workflow automation guide](/en/articles/n8n-workflow-automation).

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n-data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

### Node-RED — Replaces IFTTT (IoT / Hardware)

**Node-RED** is IBM's low-code visual flow editor, originally built for wiring together IoT devices and APIs. You drag nodes onto a canvas — MQTT, HTTP, WebSocket, GPIO, email, databases — and connect them with wires. It's more technical than IFTTT but infinitely more powerful, especially for home automation and hardware.

```bash
docker run -d --name nodered \
  -p 1880:1880 \
  -v nodered-data:/data \
  nodered/node-red:latest
```

### Huginn — Replaces IFTTT / RSS Monitoring

**Huginn** is a system of "agents" that watch the web for you: monitor RSS feeds, scrape websites, check prices, and react with notifications or HTTP calls. It's like IFTTT with a real programming brain — you can chain agents, filter with Liquid templates, and build surprisingly complex watchdogs.

```bash
docker run -d --name huginn \
  -p 3000:3000 \
  -v huginn-data:/var/lib/mysql \
  ghcr.io/huginn/huginn:latest
```

---

## 6. Monitoring & Dashboards (Replaces UptimeRobot, Datadog)

### Uptime Kuma — Replaces UptimeRobot / StatusPage

**Uptime Kuma** is a self-hosted uptime monitor with a beautiful dashboard and public status pages. It checks HTTP(S), TCP, ping, DNS, and even Kubernetes or Docker containers, and notifies you via Telegram, Discord, Slack, email, and 90+ other channels. Free and unlimited monitors — UptimeRobot's free tier only gives you 50. Full setup here: [Uptime Kuma monitoring guide](/en/articles/uptime-kuma-monitor).

```bash
docker run -d --name uptime-kuma \
  -p 3001:3001 \
  -v uptime-kuma-data:/app/data \
  louislam/uptime-kuma:latest
```

### Grafana — Replaces Datadog / New Relic Dashboards

**Grafana** is the industry-standard open-source observability platform. Pair it with Prometheus to collect metrics from your servers, containers, and apps, then visualize everything in gorgeous dashboards with alerting. It replaces a big chunk of what you'd pay Datadog or New Relic for.

```bash
docker run -d --name grafana \
  -p 3000:3000 \
  -v grafana-data:/var/lib/grafana \
  grafana/grafana-oss:latest
```

For a full stack, add `prom/prometheus` and a `node-exporter` — Grafana connects to Prometheus as a data source and you have a self-hosted Datadog.

---

## 7. File Sync (Replaces Dropbox / Synology Drive)

### Syncthing — Replaces Dropbox / Google Drive Sync

**Syncthing** is a continuous, peer-to-peer file synchronization tool. There's no central server at all — your devices connect directly and sync encrypted over the internet. It's the purest replacement for "keep these folders identical across my machines," with a web UI, mobile apps, and versioning built in.

```bash
docker run -d --name syncthing \
  -p 8384:8384 -p 22000:22000/tcp -p 22000:22000/udp -p 21027:21027/udp \
  -v syncthing-data:/var/syncthing \
  syncthing/syncthing:latest
```

Open the web UI at `http://localhost:8384`, add devices by their IDs, and folders replicate instantly. No account, no quota, no middleman.

---

## 8. Team Collaboration (Replaces Slack, Notion, Confluence)

### Mattermost — Replaces Slack / Microsoft Teams

**Mattermost** is a self-hostable team chat platform with channels, direct messages, threads, file sharing, voice calls, and an extensive plugin ecosystem. The Team Edition is free for unlimited users. It's a genuine Slack replacement for teams that care where their conversations live.

```bash
docker run -d --name mattermost \
  -p 8065:8065 \
  -v mattermost-data:/mm/mattermost-data \
  mattermost/mattermost-team-edition:latest
```

For production you'll want the Docker Compose setup with PostgreSQL (which the official docs provide), but the single container gets you evaluating in minutes.

### Outline — Replaces Notion / Confluence (Team Wiki)

**Outline** is a beautiful, collaborative knowledge base for teams — think Notion or Confluence but open source and self-hostable. It supports real-time collaborative Markdown editing, nested collections, search, and an excellent editor experience. It's the best-looking self-hosted wiki you'll find in 2026.

Outline needs PostgreSQL, Redis, and an S3-compatible storage backend (MinIO works great):

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: outline
      POSTGRES_USER: outline
      POSTGRES_PASSWORD: change-me
    volumes:
      - db:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  minio:
    image: minio/minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: outline
      MINIO_ROOT_PASSWORD: change-me
    volumes:
      - minio:/data

  outline:
    image: docker.getoutline.com/outlinewiki/outline:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://outline:change-me@postgres:5432/outline
      REDIS_URL: redis://redis:6379
      SECRET_KEY: generate-a-long-random-string
      UTILS_SECRET: generate-another-long-random-string
      FILE_STORAGE: s3
      AWS_S3_UPLOAD_BUCKET_URL: http://minio:9000
      AWS_S3_UPLOAD_BUCKET_NAME: outline
      AWS_ACCESS_KEY_ID: outline
      AWS_SECRET_ACCESS_KEY: change-me
      AWS_S3_FORCE_PATH_STYLE: "true"
      URL: https://docs.example.com
    depends_on:
      - postgres
      - redis
      - minio

volumes:
  db:
  minio:
```

Mattermost is your Slack; Outline is your company wiki. Together they cover most internal communication.

---

## 9. Bookmarks (Replaces Pocket / Browser Bookmarks)

### Linkwarden — Replaces Pocket / Raindrop.io

**Linkwarden** is a collaborative bookmark manager with archiving and tagging. When you save a link it can take a **screenshot and a full text snapshot** (using its archiving engine), so the content is preserved even if the original page dies. Organize with collections, search everything, and share public collections with the world.

```bash
docker run -d --name linkwarden \
  -p 3000:3000 \
  -v linkwarden-data:/data/data \
  ghcr.io/linkwarden/linkwarden:latest
```

It comes with a built-in browser extension and mobile-optimized web app, making it a true Pocket replacement you own.

---

## Putting It All Together

If the list feels overwhelming, here's a suggested order for a beginner:

1. **Start small** — Uptime Kuma (monitoring) and Vaultwarden (passwords) are single containers with instant payoff.
2. **Add the media trio** — Jellyfin + Navidrome + Immich replace your biggest subscriptions.
3. **Replace your workspace** — Nextcloud for files, Joplin or Trilium for notes.
4. **Automate** — n8n ties everything together once you have data flowing.

A single 2-core, 8 GB mini-PC or a $5/month VPS running Docker Compose can host every app in this list. The only real cost is time — and the payoff is a stack of canceled subscriptions, your data on your hardware, and software that can't be taken away from you.

For the deployment mechanics, our [Docker Compose tutorial](/en/articles/docker-compose-tutorial) covers everything from installation to production best practices. If you're new to remote servers, start with the [Ubuntu server setup guide](/en/articles/ubuntu-server-setup). Happy self-hosting! 🐳
