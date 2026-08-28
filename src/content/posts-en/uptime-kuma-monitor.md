---
title: "Uptime Kuma: Self-Hosted Monitoring — Free UptimeRobot Alternative"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Complete Uptime Kuma tutorial. Self-hosted uptime monitoring with HTTP, TCP, Ping, DNS checks. Beautiful UI + alert notifications. Free replacement for UptimeRobot."
author: "Xiaozha"
tags: ["Self-Hosting", "Open Source", "Tutorial", "Monitoring"]
featured: false
draft: false
ogImage: "/images/uptime-kuma-monitor-real.jpg"
coverAlt: "Clean office desk with laptop and work notes"
zhSlug: "uptime-kuma-monitor"
---

You deploy a blog, a NAS, or an API — and then it goes down at 3 a.m. without you noticing. Downtime is invisible until a user complains, and by then it has already cost you trust. The classic fix, UptimeRobot, is fine — until you hit its free-tier ceiling: limited monitor count, limited check intervals, and no SSL expiry tracking.

**Uptime Kuma** is the self-hosted answer. It is a beautiful, open-source monitoring tool with 60k+ GitHub stars, a real-time status dashboard, and 90+ notification channels. You run it on your own server, so there are no monitor limits, no paid tiers, and no third-party account between you and your data.

This complete tutorial covers Docker deployment, every important monitor type, notification setup (Telegram, Discord, Slack, email, webhooks, Ntfy), public status pages, SSL certificate monitoring, exposing it safely through Cloudflare Tunnel, backup and migration, and a final comparison against UptimeRobot, StatusCake, and other tools.

---

## What Is Uptime Kuma and Why Self-Host It?

Uptime Kuma is a free, open-source (MIT-licensed) monitoring application written in Node.js + Vue, with data stored in an embedded SQLite database. You install it, add monitors, and it periodically checks your services, records uptime history, notifies you on failure, and can expose a public status page.

### Why not just use UptimeRobot?

| Concern | UptimeRobot (free) | Uptime Kuma (self-hosted) |
| --- | --- | --- |
| Monitor limit | 50 monitors | Unlimited |
| Check interval | 5 minutes minimum | 20 seconds minimum |
| SSL certificate checks | Paid plan | Free |
| Status page customization | Limited | Full control |
| Notification channels | ~15 | 90+ |
| Data ownership | Third-party cloud | Your server |
| Price | Free / $7+ mo for limits | Free (self-host) |

The deciding factors for most self-hosters: **unlimited monitors**, **faster check intervals**, **free SSL monitoring**, and **full data ownership**.

---

## Docker Compose Deployment

The cleanest install path is Docker Compose. It keeps Uptime Kuma and its data isolated, makes upgrades trivial, and lets you define the volume and ports in one place.

### Directory layout

```
uptime-kuma/
├── docker-compose.yml
└── data/            # SQLite database + config live here
```

### `docker-compose.yml`

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    restart: unless-stopped
    ports:
      - "3001:3001"       # host 3001 -> container 3001
    volumes:
      - ./data:/app/data  # persistence for kuma.db
    environment:
      - TZ=Asia/Shanghai
      # - UPTIME_KUMA_DISABLE_FRAME_SAMEORIGIN=true  # optional
```

A few notes on the important pieces:

- **`image: louislam/uptime-kuma:1`** — the `:1` tag tracks the 1.x line and stays stable. Avoid `:latest` for a monitoring tool; you want reproducible updates.
- **`ports: "3001:3001"`** — the web UI. Change the left number if 3001 is taken on your host (e.g. `"8080:3001"`).
- **`volumes: ./data:/app/data`** — everything (the SQLite database `kuma.db`, settings, themes) lives here. **Back this directory up** — it *is* your monitoring configuration.
- **`restart: unless-stopped`** — the monitor comes back automatically after a reboot or crash.

### Start it

```bash
docker compose up -d
docker compose logs -f
```

Open `http://localhost:3001`, and the setup screen asks you to create an admin account. After that you land on the dashboard — empty, waiting for your first monitor.

### Updating

Updating is a pull-and-recreate:

```bash
docker compose pull
docker compose up -d
```

Or automate it with Watchtower:

```bash
docker run -d --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 86400 --cleanup
```

---

## Adding Your First Monitor

Click **Add New Monitor**. Pick a type, fill in the target, and configure the heartbeat interval.

For a basic HTTP check:

1. **Monitor Type**: HTTP(s)
2. **Friendly Name**: `My Blog`
3. **URL**: `https://example.com`
4. **Heartbeat Interval**: `60` seconds (the sweet spot for most services)
5. **Retries**: `2` (only alert after 2 consecutive failures — avoids false alarms during brief blips)
6. **Notification**: pick your channel (see the notifications section)
7. Save.

The card turns green when the check passes. Uptime Kuma immediately starts recording uptime history, response time, and events — all in a per-monitor graph you can inspect by clicking the monitor.

> **Pro tip:** Set **Retries ≥ 2** and a reasonable timeout on web checks. A single slow request that trips a timeout is not an outage; Uptime Kuma should only page you when the service is genuinely gone.

---

## Monitor Types Explained

Uptime Kuma supports far more than HTTP. Here are the ones you will actually use:

| Type | What it checks | Typical use |
| --- | --- | --- |
| **HTTP(s)** | Status code, keyword, response time | Websites, APIs, reverse proxies |
| **TCP Port** | A TCP port accepts connections | SSH (22), Postgres (5432), Redis (6379) |
| **Ping** | ICMP reachability | Your router, NAS, home server |
| **DNS** | Resolves a hostname, optionally validates the result | Check your DNS records answer correctly |
| **Keyword** | Searches for a word in an HTTP response | Verify a page contains "Deployed" or "Login" |
| **Docker** | A container is running / healthy | Watch your own containers |
| **MySQL / PostgreSQL / Redis / MongoDB** | Service-specific queries | Database health beyond "port is open" |
| **Game Server** | Queries game server APIs (Minecraft, Valve, etc.) | Minecraft / Steam servers |
| **Push** | You send a heartbeat to Uptime Kuma's push URL | Cron jobs and backup scripts |
| **Certificate** | SSL/TLS certificate expiry and validity | All your HTTPS endpoints |

### The ones worth a closer look

**Keyword** — add the keyword `200 OK` or a marker string in your homepage; if the marker disappears, the site is broken even though HTTP still returns 200.

**Docker** — point it at your Docker socket to watch container state. Be careful exposing the socket; on a LAN-only install it's fine, but never expose it publicly.

**Push** — perfect for backups and cron jobs that should run on a schedule. Uptime Kuma gives you a unique push URL; your script `curl`s it when it succeeds, and the monitor alerts if the heartbeat goes silent:

```bash
# in your nightly backup cron job
curl -fsS -m 10 --retry 5 -o /dev/null "https://kuma.example.com/api/push/<your-token>?status=up&msg=OK&ping="
```

**Certificate** — set this on every HTTPS endpoint you own; it alerts you 14/7/3 days before expiry (configurable) so you never hit a browser warning again.

---

## Notifications: Telegram, Discord, Slack, Email, Webhook, Ntfy

Uptime Kuma ships with **90+ notification providers**. Under **Settings → Notifications → Setup Notification**, you add a notification and then attach it to monitors (or set it as a **default** so every new monitor uses it).

The most common setups:

### Telegram (bot)

1. Talk to [@BotFather](https://t.me/BotFather) and run `/newbot` to get a bot token.
2. Add the bot to a channel/group, or message it directly to get your chat ID (use `@userinfobot` to find it).
3. In Uptime Kuma: provider **Telegram**, paste `Bot Token` and `Chat ID`, save.

### Discord / Slack (webhook)

1. Create an incoming webhook in Discord (**Server Settings → Integrations → Webhooks**) or Slack (**Incoming Webhooks**).
2. In Uptime Kuma: provider **Discord** or **Slack**, paste the webhook URL.

### Email (SMTP)

1. Provider **Email (SMTP)**, fill in your SMTP host, port, username, password, and the `From`/`To` addresses.
2. For Gmail you need an App Password, not your regular password.

### Generic Webhook

For anything else (custom bots, n8n, home automation):

```json
{
  "name": "My Webhook",
  "type": "webhook",
  "webhookURL": "https://hooks.example.com/alert",
  "body": "{\"service\":\"{{name}}\",\"status\":\"{{status}}\"}",
  "contentType": "application/json"
}
```

The `{{name}}` and `{{status}}` placeholders are substituted at send time.

### Ntfy — push notifications to your phone (free)

[Ntfy](https://ntfy.sh) is a free, open-source push service. You don't even need an account to receive:

1. Install the ntfy app on your phone.
2. In Uptime Kuma, add provider **Ntfy** with topic `your-topic-name`.
3. Every alert pushes straight to your phone.

No subscriptions, no push gateways, no cost.

---

## Public Status Page

One of Uptime Kuma's best features is a **public status page** — a real-time, always-on dashboard you can share with users or clients.

1. Go to **Status Pages → New Status Page**.
2. Give it a name (e.g. "Our Services") and pick a slug (`https://kuma.example.com/status/our-services`).
3. Choose a **Group** and add the monitors you want to display.
4. Toggle **Show tags**, **Show uptime percent**, **Show certificate expiry** as you prefer.
5. Save, then share the link.

You can set it **public** (no login) or **password-protected**. The page automatically renders a live-updating grid of green/red cards with uptime history, response times, and a 90-day overview. It doubles as a lightweight marketing asset — many self-hosters expose it on `status.example.com` as a sign of transparency.

---

## SSL/TLS Certificate Monitoring

Forgetting to renew a certificate is one of the most common (and most embarrassing) outages. Uptime Kuma's **Certificate** monitor type checks expiry and validity for you.

1. **Add New Monitor → Certificate**.
2. Enter the domain, e.g. `example.com`.
3. Set **Alert when certificate is about to expire in less than**: `14` days.
4. Set **Alert when certificate is invalid / expired**: on.

Uptime Kuma checks the certificate over the network and pings you via your configured notifications when the expiry window closes in. This single feature replaces a paid UptimeRobot tier by itself.

---

## Exposing It Safely: Cloudflare Tunnel

Uptime Kuma runs on your server and you don't want to open port 3001 to the public internet. Two options:

### Option A: Reverse proxy (Caddy + HTTPS)

```caddy
kuma.example.com {
    reverse_proxy 127.0.0.1:3001
}
```

Caddy issues and renews the certificate automatically.

### Option B: Cloudflare Tunnel (no public IP needed)

If your server is behind NAT, Cloudflare Tunnel gives you HTTPS without opening any port. See our full [Cloudflare Tunnel tutorial](/en/articles/cloudflare-tunnel-tutorial) for the complete walkthrough. The short version:

```bash
cloudflared tunnel login
cloudflared tunnel create uptime
cloudflared tunnel route dns uptime kuma.example.com
```

`~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: kuma.example.com
    service: http://localhost:3001
  - service: http_status:404
```

```bash
cloudflared tunnel run uptime
```

Now `https://kuma.example.com` is your public monitoring dashboard — and since Uptime Kuma is itself monitoring that endpoint, a failure alert is also your first line of defense against your own tunnel going down.

> **Security note:** Put Cloudflare Access (or at least Uptime Kuma's login) in front of the dashboard. Make the **status page** public and keep the **admin dashboard** private.

---

## Backup and Migration

Your monitoring setup lives in the `./data` directory. Back it up regularly — it's a small, portable set of files.

### Backup the data directory

```bash
# stop the container to get a consistent snapshot
docker compose stop

# tar the data directory
tar -czf uptime-kuma-backup-$(date +%F).tar.gz data

# start again
docker compose start
```

### Built-in backup script

Uptime Kuma ships a helper inside the image:

```bash
docker compose exec uptime-kuma ./extra/backup.sh
```

It dumps the SQLite database to a timestamped file under `/app/data/`.

### Migrate to another machine

1. On the new host, create the same `docker-compose.yml`.
2. Copy the `data/` directory (or restore your tarball) into place.
3. `docker compose up -d`.

Everything — monitors, notifications, status pages, settings — comes back exactly as it was, because it all lives in `kuma.db`. Point that directory at a backup job (Borg, restic, or your NAS) and you're disaster-proof.

---

## Advanced: API, Maintenance Mode, Groups

### Prometheus API

Uptime Kuma exposes a Prometheus metrics endpoint at `/metrics`. Set an API key first, then scrape it from Grafana/Prometheus:

```bash
curl -H "Authorization: Bearer <your-api-key>" http://localhost:3001/metrics
```

This gives you machine-readable uptime metrics for dashboards and external alerting.

### Maintenance Mode

Under **Settings → Maintenance**, you can schedule maintenance windows (e.g. "every Sunday 02:00–04:00"). During those windows, monitors are paused and the status page shows the services as in maintenance rather than down — so your weekly server reboots don't spam your phone with false alarms.

### Groups and Tags

As your monitor list grows, organize it:

- **Groups** (in each monitor's settings) let the status page render services in logical sections: "Web", "API", "Infrastructure".
- **Tags** let you filter the dashboard and apply notification rules to many monitors at once (e.g. tag every production endpoint with `prod`).

A tidy setup makes real incidents obvious at a glance instead of blending into a wall of green cards.

---

## Uptime Kuma vs. UptimeRobot vs. StatusCake vs. Heartbeat

How does Uptime Kuma stack up against the field?

| Feature | Uptime Kuma | UptimeRobot | StatusCake | Heartbeat (self-hosted agents) |
| --- | --- | --- | --- | --- |
| Hosting | Self-hosted (free) | SaaS free/paid | SaaS paid | Self-hosted agents |
| Monitor limit | Unlimited | 50 (free) | 10 (entry plan) | Unlimited |
| Check interval | 20s min | 5 min (free) | 1 min | 10s min |
| SSL monitoring | Free | Paid plan | Paid plan | Depends |
| Notifications | 90+ channels | ~15 | ~10 | Configurable |
| Public status page | Yes, full control | Limited | Yes | Yes |
| Data ownership | You | Third party | Third party | You |
| Cost | $0 | $0–$7+/mo | $24+/mo | $0 (self-hosted) |

- **UptimeRobot** — great when you want zero maintenance and don't mind the 50-monitor cap. But the paid tiers cost real money for things Uptime Kuma does free.
- **StatusCake** — a solid commercial product with nice global check locations, but you pay per feature.
- **Heartbeat** (self-hosted agent model, e.g. Elastic Agent / custom heartbeat daemons) — powerful for fleet monitoring, but much more complex to run than Uptime Kuma's turnkey UI.
- **Uptime Kuma** — the best balance for individuals and small teams who already run a server: everything in one place, unlimited, free, and self-contained.

If you don't already have a server, the [Ubuntu Server setup guide](/en/articles/ubuntu-server-setup) is the perfect place to start — then deploy Uptime Kuma as your first service.

---

## Summary

Uptime Kuma is the best free, self-hosted monitoring tool in 2026. In this guide you learned how to:

1. **Understand what Uptime Kuma is** — a free, open-source, self-hosted uptime monitor with 60k+ stars.
2. **Deploy it with Docker Compose** — volume for data, port 3001, easy updates.
3. **Add your first monitor** — HTTP check with sensible heartbeat and retries.
4. **Use all the monitor types** — HTTP, TCP, Ping, DNS, Keyword, Docker, databases, game servers, Push, and Certificate.
5. **Configure notifications** — Telegram, Discord, Slack, email, webhook, Ntfy.
6. **Publish a public status page** for transparency with users.
7. **Track SSL/TLS expiry** automatically.
8. **Expose it safely** via Cloudflare Tunnel or a Caddy reverse proxy.
9. **Back up and migrate** the SQLite `data/` directory.
10. **Apply advanced features** — Prometheus API, maintenance mode, groups and tags.
11. **Compare it** with UptimeRobot, StatusCake, and Heartbeat — and know when self-hosting wins.

Your next step is simple: `docker compose up -d`, add your blog, your API, and your home server, and set up Telegram or Ntfy notifications. Then go get some sleep — Uptime Kuma will watch the lights for you. If you found this useful, you might also like our [Docker Compose tutorial](/en/articles/docker-compose-tutorial) and [Cloudflare Tunnel guide](/en/articles/cloudflare-tunnel-tutorial). Happy monitoring! 📡
