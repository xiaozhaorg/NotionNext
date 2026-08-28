---
title: "Jellyfin Media Server Guide: Free Plex Alternative with 4K Transcoding"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Complete Jellyfin setup guide. Docker deployment, metadata scraping, hardware transcoding, client apps. The best free open-source media server."
author: "Xiaozha"
tags: ["Self-Hosting", "Open Source", "Tutorial", "Media Server"]
featured: false
draft: false
ogImage: "/images/jellyfin-media-server-real.jpg"
coverAlt: "Clean office desk with laptop and work notes"
zhSlug: "jellyfin-media-server"
---

If you have ever tried to watch a movie on your own server through Plex, you have probably hit the paywall: free tier limits on mobile apps, hardware transcoding behind a Plex Pass subscription, and a growing list of features locked behind paid plans. **Jellyfin** is the open-source, fully free answer to that.

Jellyfin is a self-hosted media server that streams your movies, TV shows, music, and photos to any device — web browser, phone, tablet, smart TV. There is no premium tier, no feature gating, no telemetry. You install it, point it at your media, and it just works.

This guide walks through deploying Jellyfin with Docker Compose, completing the initial setup wizard, building libraries, scraping metadata, enabling hardware transcoding for 4K streaming, choosing client apps, and exposing the server to the internet safely.

---

## What Is Jellyfin?

Jellyfin is a free, open-source media server licensed under the GPL. It is a fork of Emby (which itself was a fork of MediaBrowser) and has been under active development since 2018.

In short, Jellyfin does for media what Plex does — but:

- **No paywalls.** Every feature is free, including hardware transcoding and mobile playback.
- **No telemetry.** Jellyfin does not phone home, does not track what you watch, and does not require an account on a third-party server.
- **No server required.** Your data stays on your own hardware.
- **Fully open source.** The server and all official clients are GPL-licensed; you can audit, modify, and self-host everything.

Jellyfin works with: movies (`.mkv`, `.mp4`, `.avi`, etc.), TV shows (with season/episode organization), music (`.flac`, `.mp3`, etc., with ID3 tag reading), photos, audiobooks, and live TV (with an IPTV or tuner source).

---

## Why Choose Jellyfin Over Plex?

Plex remains the most polished commercial media server, but it has accumulated a list of constraints that annoy self-hosters:

| Concern | Plex | Jellyfin |
| --- | --- | --- |
| Hardware transcoding | Plex Pass required ($150 lifetime) | Free |
| Mobile app playback | Limited / ads on free tier | Free, ad-free |
| Server account | Requires plex.tv login | Optional |
| Telemetry | Yes | None |
| Live TV | Plex Pass | Free |
| Client count / multi-user | Restrictions | Unlimited |
| Source code | Closed | GPL |

For most home users with their own server, Jellyfin now matches Plex feature-for-feature on what matters: 4K streaming, hardware transcoding, metadata scraping, mobile apps, and TV apps. The biggest trade-off is that Plex's commercial polish (UI polish, large app ecosystem, hosted metadata) is a little ahead — but Jellyfin closes the gap every release.

---

## Docker Deployment

The cleanest install path is Docker Compose. It keeps Jellyfin and its data isolated, makes upgrades trivial, and lets you define volume mounts in one place.

### Directory layout

```
jellyfin/
├── docker-compose.yml
├── config/         # jellyfin config (db, metadata)
├── cache/          # transcode cache
└── media/
    ├── movies/
    ├── tv/
    └── music/
```

### `docker-compose.yml`

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./config:/config
      - ./cache:/cache
      - ./media:/media:ro
    environment:
      - JELLYFIN_PublishedServerUrl=https://jellyfin.example.com
      - TZ=Asia/Shanghai
```

A few notes:

- **`network_mode: host`** — recommended for Jellyfin, because host networking simplifies DLNA / auto-discovery on the LAN. If you prefer bridge networking, drop `network_mode: host` and add `ports: ["8096:8096", "8920:8920"]`.
- **`media` is mounted read-only** (`:ro`) so Jellyfin can't accidentally modify your originals.
- **`config`** holds `metadata.db`, `jellyfin.db`, and XML config files. Back this up.
- **`cache`** is where transcoded chunks are written; size it for at least a few GB if you stream 4K.
- **`JELLYFIN_PublishedServerUrl`** is what Jellyfin advertises to clients. Set this to your reverse-proxy hostname.

### Start it

```bash
docker compose up -d
docker compose logs -f
```

The first boot is fast — no models to download. After ~5 seconds you'll see `Listening on http://0.0.0.0:8096`. Open `http://<server-ip>:8096` in a browser.

---

## Initial Setup Wizard

The first time you open Jellyfin, you are walked through a setup wizard.

### Step 1: Create the admin user

Pick a username and password. This is your master account — additional users can be created later, with per-library permissions.

### Step 2: Add your first libraries

You can add libraries now or skip and add them later. For a quick start, add three:

1. **Movies** — content type `Movies`, folder `/media/movies`.
2. **TV Shows** — content type `Shows`, folder `/media/tv`.
3. **Music** — content type `Music`, folder `/media/music`.

### Step 3: Set the language and region

Choose your metadata language (e.g. English) and country. This affects which TMDB / TVDB metadata is preferred when several are available.

### Step 4: Optional: configure remote access

Skip if you'll expose Jellyfin through a reverse proxy (recommended). Otherwise, allow remote IP access and set a public hostname.

After the wizard completes, you'll land on the dashboard with empty libraries — time to populate them.

---

## Library Setup: Movies, TV, Music

Jellyfin recognizes libraries by directory structure. Get the structure right and metadata scraping "just works".

### Movies

```
/movies/
├── The Matrix (1999) [1080p].mkv
├── Inception (2010) {
        'tmdbid':'27205'
    }.mp4
└── The Lord of the Rings - The Fellowship of the Ring (2001) [Extended]/
    ├── The Lord of the Rings - The Fellowship of the Ring (2001) [Extended].mkv
    └── poster.jpg
```

The pattern Jellyfin expects:

- `Title (Year).ext` — minimum.
- Year is the release year.
- Optional: `[1080p]`, `[Extended]`, `{tmdbid:27205}` to force a specific TMDB ID (useful when the title is ambiguous).

### TV Shows

```
/tv/
└── Breaking Bad (2008)/
    ├── Season 01/
    │   ├── Breaking Bad - S01E01 - Pilot.mkv
    │   ├── Breaking Bad - S01E02 - Cat's in the Bag.mkv
    │   └── ...
    ├── Season 02/
    └── ...
```

The pattern:

- `Show Name (Year)/Season XX/Show Name - SxxExx - Episode Title.ext`.
- Season folders are optional but recommended.
- Special episodes use `S00E01`.

### Music

```
/music/
└── Daft Punk/
    └── Discovery (2001)/
        ├── 01 - One More Time.flac
        ├── 02 - Aerodynamic.flac
        └── cover.jpg
```

Pattern: `Artist/Album (Year)/Track.ext`. Tagging via ID3 / Vorbis / FLAC is read from the file itself — directory structure mainly helps with cover art.

After files are in place, go to **Dashboard → Libraries → Scan All Libraries**. Jellyfin will scan and pull metadata.

---

## Metadata Scraping (TMDB, TVDB)

Jellyfin ships with multiple metadata providers:

- **TheMovieDb (TMDB)** — movies and TV.
- **TheTvDb (TVDB)** — TV shows (English fallback).
- **The Open Movie Database (OMDb)** — additional movie data.
- **Fanart.tv** — backdrops, logos, banners.
- **MusicBrainz** — music metadata.

To configure them:

1. Go to **Dashboard → Plugins → Catalog**.
2. Install the ones you want (TMDB is enabled by default).
3. For some providers, you need a free API key — visit their site, sign up, paste the key under **Dashboard → Plugins → [Provider] → Settings**.

### Force-scrape a single item

When you fix a naming problem, you don't want to wait for the next scan. Open the item's detail page → **Edit → Identify** → search the title → **Replace**. Jellyfin re-pulls metadata and replaces the entry.

### NFO files (local metadata)

For offline or privacy-conscious setups, you can store metadata as NFO XML files alongside media:

```
/movies/The Matrix (1999)/
├── The Matrix (1999).mkv
└── The Matrix (1999).nfo
```

A minimal NFO:

```xml
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<movie>
  <title>The Matrix</title>
  <year>1999</year>
  <plot>A computer hacker learns from mysterious rebels...</plot>
  <uniqueid type="tmdb">603</uniqueid>
</movie>
```

Jellyfin reads NFOs and skips network fetches for that item, useful when you want full control over the data.

---

## Hardware Transcoding: Intel QuickSync, NVIDIA NVENC, AMD AMF

If you only ever stream files that your clients can play natively, you don't need transcoding. But most homes have at least one mismatch — a 4K HEVC file streamed to a phone that can't decode HEVC, or a 1080p file sent over a slow cellular link.

Jellyfin can transcode on the fly using the CPU, but that pegs the CPU and chews power. **Hardware transcoding** hands off encoding to a GPU, running 4K transcodes at 10× the speed with 10× less power.

### Enable hardware transcoding

1. Open **Dashboard → Playback → Transcoding**.
2. Under **Hardware acceleration**, pick your hardware:
   - **Intel/AMD** integrated graphics → `Intel QuickSync` or `AMD AMF`.
   - **NVIDIA** discrete GPU → `NVIDIA NVENC`.
   - **VAAPI** for older Intel / AMD open-source stacks.
3. Pick the encoder (`H264`, `HEVC`, `AV1` if supported).
4. Check **Enable hardware decoding** for the codecs you commonly see (H264, HEVC, MPEG2, VC1, VP9).
5. Save.

### Pass the GPU to the Docker container

The container needs access to the GPU device. Edit `docker-compose.yml`:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    restart: unless-stopped
    network_mode: host
    devices:
      - /dev/dri:/dev/dri          # Intel / AMD iGPU
    # OR for NVIDIA:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]
    volumes:
      - ./config:/config
      - ./cache:/cache
      - ./media:/media:ro
    environment:
      - JELLYFIN_PublishedServerUrl=https://jellyfin.example.com
```

For NVIDIA, install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) on the host first.

### Verify hardware is being used

While a transcode session runs, on the host:

```bash
# Intel
sudo intel_gpu_top

# NVIDIA
nvidia-smi
```

You should see GPU usage spike when a client requests a transcode. On the Jellyfin side, check **Dashboard → Active Devices** — the playback info shows "Transcoding (QuickSync)" or similar.

### VAAPI / QuickSync specific

Some Intel CPUs (older i3/i5) lack a fully licensed QuickSync encoder. Test with a real transcode session; if you see "Driver does not support the required codec", you may need to switch from `Intel QuickSync` to `VAAPI` or upgrade the kernel's media driver.

---

## Client Apps: Web, Mobile, TV

Jellyfin has official clients on every major platform. All are free.

### Web (default)

Just open `http://<server-ip>:8096` in any modern browser. The web UI is feature-complete (browse, play, queue, watch history).

### Mobile — iOS / Android

Search "Jellyfin" in the App Store or Play Store. The official app supports:

- Direct play / transcode fallback.
- Background audio.
- Picture-in-picture.
- Download for offline (yes — fully offline content, no paywall).

iOS tip: AVPlayer on iOS does not natively support some codecs (e.g. FLAC audio in MKV). For those files Jellyfin auto-transcodes; if you find this annoying, install **Infuse 7** (paid one-time, free trial), which integrates with Jellyfin via the API and has broader codec support.

### TV — Android TV, Fire TV, Roku

- **Android TV / Google TV** — official Jellyfin app in the Play Store.
- **Amazon Fire TV** — sideload the Android TV APK, or use the Fire TV appstore listing.
- **Roku** — official Jellyfin channel in the Roku Channel Store.
- **Apple TV** — third-party Swiftfin app is the best Apple TV client.

The TV apps support direct play for the codecs your TV supports; everything else is transcoded server-side.

---

## Remote Access: Cloudflare Tunnel or Reverse Proxy

You shouldn't open port 8096 to the public internet. The two recommended options:

### Option A: Reverse Proxy with Caddy + Let's Encrypt

Caddy gets HTTPS automatically. Put this in your `Caddyfile`:

```caddy
jellyfin.example.com {
    reverse_proxy 127.0.0.1:8096
}
```

Run `caddy` and you have HTTPS at `https://jellyfin.example.com` automatically.

### Option B: Cloudflare Tunnel (no public IP required)

If your server is behind a NAT, use Cloudflare Tunnel — it's free, automatic HTTPS, and protects the origin IP. See our [Cloudflare Tunnel tutorial](/en/articles/cloudflare-tunnel-tutorial) for full setup.

The short version:

```bash
# Install cloudflared
cloudflared tunnel login
cloudflared tunnel create jellyfin
cloudflared tunnel route dns jellyfin jellyfin.example.com
```

`config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: jellyfin.example.com
    service: http://localhost:8096
  - service: http_status:404
```

```bash
cloudflared tunnel run jellyfin
```

You now have a public HTTPS URL pointing at your home server, with no router ports opened.

---

## Tips: Naming Conventions, NFO Files, Subtitles

### Naming Conventions

- Use the year in parentheses for movies: `Inception (2010).mkv`.
- Use `SxxExx` for TV: `Show - S01E01 - Pilot.mkv`.
- For multi-part movies, use `pt1` / `pt2` (e.g. `Kill Bill (2003) - pt1.mkv`).
- Avoid special characters in filenames: `:` and `?` are illegal on Windows.

### NFO Files for Custom Metadata

NFOs let you bypass scraping entirely. They're plain XML — edit them by hand or use a tool like tinyMediaManager to generate them.

### Subtitles

Jellyfin auto-detects subtitles placed alongside video:

```
/movies/The Matrix (1999)/
├── The Matrix (1999).mkv
├── The Matrix (1999).en.srt       # English
├── The Matrix (1999).zh.srt       # Chinese
└── The Matrix (1999).ja.srt       # Japanese
```

Two-letter language codes follow ISO 639-1. You can also embed subtitles inside MKV containers (`mkvmerge` is your friend for this).

For movies missing subtitles, **OpenSubtitles** plugin (install under Plugins → Catalog) automatically fetches them.

---

## Jellyfin vs Plex vs Emby

| Feature | Jellyfin | Plex | Emby |
| --- | --- | --- | --- |
| License | GPL (open source) | Closed | Closed (Premier) |
| Free tier | Full | Limited | Limited |
| Hardware transcoding | Free | Plex Pass ($150) | Emby Premiere |
| Mobile apps (free) | Yes | Limited / ads | Limited |
| Self-hosted server | Yes | Optional | Yes |
| Live TV / DVR | Free | Plex Pass | Emby Premiere |
| Plugins | Open ecosystem | Curated | Curated |
| Polished UI | Good | Excellent | Good |
| Customer support | Community | Email + forums | Email + forums |

If you value free and open, Jellyfin is the answer. If you want maximum polish and don't mind paying, Plex remains the most refined. Emby sits in between — it's the proprietary fork that Jellyfin originally split from.

---

## Summary

Jellyfin is the best free, open-source media server in 2026. In this guide you learned how to:

1. **Understand what Jellyfin is** — a self-hosted, GPL media server with no paywalls.
2. **Why pick Jellyfin over Plex** — no premium tier, no telemetry, free hardware transcoding.
3. **Deploy with Docker Compose** — single container with config, cache, and media mounts.
4. **Complete the initial setup wizard** — admin user, libraries, language.
5. **Build libraries** with the right folder structures for movies, TV, and music.
6. **Scrape metadata** via TMDB / TVDB / MusicBrainz, with NFO fallbacks for offline.
7. **Enable hardware transcoding** — Intel QuickSync, NVIDIA NVENC, AMD AMF, with the right `devices:` mapping.
8. **Pick clients** — web, iOS/Android native apps, Android TV, Fire TV, Roku, Apple TV.
9. **Expose safely** — Caddy reverse proxy or Cloudflare Tunnel, no public IP needed.
10. **Apply tips** for naming, NFOs, and subtitles.

The next step is to copy some media onto your server, scan the library, and start watching. If you found this guide useful, you might also enjoy our tutorials on [Immich self-hosted photo backup](/en/articles/immich-photo-backup) and [Ubuntu Server initial setup](/en/articles/ubuntu-server-setup). Happy streaming! 🎬
