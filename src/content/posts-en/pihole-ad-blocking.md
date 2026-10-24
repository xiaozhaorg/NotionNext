---
title: "Pi-hole Network-Wide Ad Blocking: One DNS Black Hole for Every Device"
pubDatetime: "2026-10-24T00:00:00.000Z"
description: "Pi-hole blocks ads at the DNS level for your entire network with nothing installed on any device. Covers how DNS sinkholing works, Pi-hole v6 Docker deployment, router DNS setup, blocklists, groups, encrypted DNS, and redundancy."
author: "Xiaozha"
tags: ["Self-Hosting", "Open Source", "Tutorial", "Free Tools"]
draft: false
ogImage: "/images/pihole-ad-blocking-real.jpg"
coverAlt: "Dense network cabling and blinking lights in a data center rack"
zhSlug: "pihole-ad-blocking"
---

You install an ad blocker on your phone, a browser extension on your laptop, and then give up on the TV box. Meanwhile those devices keep phoning home in the background and you have no idea where to.

**Pi-hole** takes a different angle: leave every device alone, change your network's DNS instead. One configuration and everything behind the router — phones, tablets, TVs, IoT speakers, robot vacuums — is covered.

This post covers the principle, Pi-hole v6 deployment, and the places where most online tutorials are still stuck on the v5 architecture and will send you into a wall.

## How DNS Ad Blocking Works

Every request starts with a **DNS query**: translating a domain like `ads.doubleclick.net` into an IP address.

What Pi-hole does: when a device on your network queries a known ad or tracking domain, it **does not return the real IP — it returns `0.0.0.0`**, a black hole. The ad request never leaves your network, and the ad slot on the page stays empty.

The interception happens at the **DNS layer, earlier than any browser**:

| | Browser extension | Pi-hole |
|---|---|---|
| Scope | That browser only | Every device on the network |
| TV boxes / IoT | Cannot install | Works automatically |
| In-app ads | Partially blocked | Mostly blocked |
| Overhead | One per browser | One for the whole network |

A side benefit: **you can finally see what your devices talk to**. Which domains your smart TV has contacted is right there in the query log — the most direct evidence of what your "smart" appliances are doing.

## Pi-hole or AdGuard Home

These are the two mainstream choices. The state of things in 2026:

| | Pi-hole v6 | AdGuard Home |
|---|---|---|
| Open source | Pure community | AdGuard (company) |
| GitHub stars | ~50k | ~26k |
| Encrypted DNS (DoH/DoT) | Needs cloudflared or Unbound | **Built in** |
| Rule syntax | Lists + regex | Adblock syntax (`$client` modifier) |
| Group management | Strong (by IP/MAC) | Yes, per client |
| Parental controls | None | Built-in SafeSearch |
| Interface | Rebuilt in v6, functional | More modern |

**Choose Pi-hole** for maximum control, Unbound recursive resolution, and the largest community and documentation base.
**Choose AdGuard Home** for out-of-the-box encrypted DNS and fast per-device parental controls.

Honestly the blocking power is nearly identical — both use the same community blocklists. The difference is management style. This post focuses on Pi-hole; AdGuard Home deploys the same way.

## What Changed in Pi-hole v6

**If you follow a tutorial written before 2024, you will get stuck.** v6 (February 2025) was an architectural overhaul:

- **Web server and REST API embedded directly in the pihole-FTL binary** — lighttpd and PHP are gone
- Configuration moved to a **TOML file** (`/etc/pihole/pihole.toml`), replacing `setupVars.conf`
- The admin interface gained native **HTTPS**
- Four components collapsed into one: faster upgrades, fewer failure points

Docker deployment is largely insulated from this (the image packages everything), but **how you change configuration is different** — the old `pihole -a -i` command set is largely replaced by the web UI and TOML.

## Docker Compose Deployment

### Directory layout

```
/opt/pihole/
├── docker-compose.yml
├── etc-pihole/      # Pi-hole configuration
└── etc-dnsmasq.d/   # Custom DNS configuration
```

### `docker-compose.yml`

```yaml
services:
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    restart: unless-stopped
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "80:80/tcp"          # Admin UI, can be changed
    environment:
      # Timezone, affects log timestamps
      TZ: "Asia/Shanghai"
      # Web UI password, required, use something strong
      FTLCONF_webserver_api_password: "replace-with-strong-password"
      # Upstream DNS servers, multiple allowed
      FTLCONF_dns_upstreams: "223.5.5.5;119.29.29.29"
      # Listen on all interfaces (needed for container networking)
      FTLCONF_dns_listeningMode: "all"
      # Whether to fall back to upstream on NXDOMAIN, default no
      FTLCONF_dns_revServer_active: "false"
    volumes:
      - ./etc-pihole:/etc/pihole
      - ./etc-dnsmasq.d:/etc/dnsmasq.d
    cap_add:
      - NET_ADMIN           # Required for network config and DHCP
```

### Three things that trip people up

**Port 53 conflicts**: if systemd-resolved is running (default on Ubuntu), it holds port 53. Release it first:

```bash
sudo systemctl stop systemd-resolved
sudo systemctl disable systemd-resolved
# Point /etc/resolv.conf at a real DNS instead of 127.0.0.53
```

**Upstream DNS choice**: for China, Alibaba `223.5.5.5` or Tencent `119.29.29.29`; `1.1.1.1` gives cleaner answers but can mis-resolve domestic CDNs, making video and downloads slower. **Default to domestic public DNS and let the encrypted-DNS layer handle privacy.**

**The `FTLCONF_` prefix**: v6 environment variables all carry it, mapping to TOML keys. This is new in v6 — plenty of tutorials still use `ServerIP`, `WEBPASSWORD` and friends, which are **deprecated**.

### Start it

```bash
cd /opt/pihole
docker compose up -d
docker compose logs -f pihole    # Watch the gravity pull
```

On first boot Pi-hole downloads your blocklists and compiles them into a local database called **gravity** — tens of thousands to hundreds of thousands of domains, a minute or two. Once you see `Compiled allowlist` and `Building gravity` finish, it is ready.

Visit `http://server-ip/admin` and log in with the password you set.

## Pointing Your Network at It

Pi-hole is installed, but no device knows to ask it. Two approaches:

### Option A: Change router DNS (recommended)

Log into your router, find **DHCP settings** (or LAN settings), and set the **DNS server** to Pi-hole's IP.

Every device picks it up automatically, including new ones. **This is the only way to cover TVs and IoT devices that cannot change their own DNS.**

Downside: some routers lock DNS configuration, and if your optical modem does the PPPoE dialing you may have to change it there.

### Option B: Per-device

Good when only some devices should use it:

- **Computers**: manual DNS in network settings
- **Phones**: Wi-Fi advanced settings (mobile data cannot be changed without private DNS)
- **TV boxes**: most Android boxes allow it; Apple TV needs a configuration profile

Tedious but precise.

### Verify it works

```bash
# On any device
nslookup ads.doubleclick.net
# Should return 0.0.0.0, not a real IP
```

Or open a page with ads and check whether the slots are empty.

## Blocklists: the Gravity System

Blocking power comes from blocklists. Pi-hole ships one official list, but **add a few of your own**:

| List | Purpose |
|---|---|
| StevenBlack unified | General: ads + malware + tracking |
| AdGuard DNS filter | Broad coverage, fast updates |
| EasyList / EasyPrivacy | Classic ads + tracking |
| OISD Big | Curated, few false positives |
| Chengfeng ad rules | **Chinese ad specialist** |
| anti-AD | Chinese site ads, high hit rate |

Add them at **Adlists** in the web UI, paste the URL, save, then:

```bash
pihole updateGravity
# In Docker
docker exec pihole pihole updateGravity
```

**For Chinese sites, Chengfeng or anti-AD is essential** — international lists cover domestic ad networks poorly. These two are the key addition for a Chinese-language environment.

More lists is not better. Every list risks false positives, and too many will break working features. **Five to eight curated lists beat thirty random ones.**

## Groups and Per-Device Control

Different devices need different policies: strict for the kids' tablet, loose for your laptop, and the TV may need ads enabled because some video apps blank out when they detect blocking.

Pi-hole manages this with **Groups**:

1. **Group Management → Groups** → create groups like `Kids` and `NoFilter`
2. In **Adlists**, assign each list to the groups it applies to
3. In **Clients**, assign device IPs to groups

The kids' tablet gets strict lists, the TV gets an empty group with no filtering at all.

**Identifying clients by MAC address beats IP** — IPs change with DHCP leases, MACs do not. But MAC-based identification requires Pi-hole to be the DHCP server (disabling the router's), which adds complexity. For home use, IP-based is usually enough.

## Whitelisting: When Something Breaks

On day one something will probably stop working — an app, an image, a page. Nine times out of ten it is a false positive.

**Troubleshooting flow**:

1. Web UI → **Query Log**, sorted newest first
2. Spot the suspicious blocked domain, click **Whitelist**
3. Refresh and verify recovery

Common whitelist candidates: analytics domains (Google Analytics, Baidu Tongji), certain app API domains, and ad-network tracking domains whose absence triggers "disable your ad blocker and retry".

**Build the habit**: when a site misbehaves, check the Query Log first. Do not uninstall Pi-hole.

## Encrypted DNS: Hiding Your Queries from the ISP

By default Pi-hole forwards surviving queries to an upstream DNS (Alibaba, Cloudflare) — **in plaintext**. Your ISP still sees every domain you look up.

Two fixes:

### Option A: cloudflared (simple)

Run a cloudflared container that encrypts queries to Cloudflare:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: proxy-dns
    environment:
      TZ: "Asia/Shanghai"
      PORT: "5053"
    ports:
      - "5053:5053/tcp"
      - "5053:5053/udp"
```

Then point Pi-hole's upstream at `172.17.0.1#5053` (cloudflared's address, adjust for your container network).

### Option B: Unbound (thorough)

Unbound resolves recursively against root and authoritative servers, **depending on no third-party resolver at all**. Best privacy, slightly more setup:

```yaml
services:
  unbound:
    image: mvance/unbound:latest
    restart: unless-stopped
    ports:
      - "5335:5335/tcp"
      - "5335:5335/udp"
    volumes:
      - ./unbound.conf:/etc/unbound/unbound.conf:ro
```

`unbound.conf`:

```text
server:
  verbosity: 0
  interface: 0.0.0.0
  port: 5335
  do-ip4: yes
  do-udp: yes
  do-tcp: yes
  access-control: 0.0.0.0/0 refuse
  access-control: 127.0.0.0/8 allow
  access-control: 172.16.0.0/12 allow   # Docker subnet
```

Point Pi-hole's upstream at Unbound.

**Option A is enough for home use.** Option B is for the privacy-obsessed.

## Redundancy: One DNS Server Is Not Enough

DNS is the network's throat. **If Pi-hole dies, the whole house goes offline.** Production practice is two instances:

- Primary: normal Pi-hole on port 53
- Secondary: identical setup, different ports (e.g. `5380:80`; the DNS port cannot be shared, so use a second IP or `network_mode: host` with a changed port)
- Router DHCP lists both DNS servers: primary IP and secondary IP

Devices prefer the primary and fail over automatically. Sync lists with [Gravity Sync](https://github.com/vmstan/gravity-sync), which replicates the primary's whitelist and lists to the secondary.

## What It Cannot Block

Set expectations up front:

- **YouTube / Twitch ads**: ads and video share a domain, so blocking by DNS kills the video too. These need a browser extension (uBlock Origin)
- **In-app ads**: some apps use built-in DoH or hardcoded IPs, bypassing DNS entirely. The YouTube app is the classic case
- **Search result promotions**: search ads share the domain with organic results
- **Phones with "Private DNS" enabled**: Android's Private DNS forces encrypted DNS and bypasses Pi-hole. Turn it off if you want Pi-hole coverage

The realistic setup is **two layers**: Pi-hole for network-level coverage (IoT, TV, system level) plus uBlock Origin in the browser for in-page content. Together they are complete.

## Remote Access and Backup

**Never expose the Pi-hole admin UI raw to the internet** — the query log is your browsing history. Use Cloudflare Tunnel:

```bash
cloudflared tunnel route dns pihole pihole.example.com
```

Same configuration as in [Cloudflare Tunnel free internal network penetration](#), with the ingress pointed at `http://localhost:80`. Cloudflare Access in front gives you "only my email can log in".

**Backup**: Pi-hole's configuration lives in `etc-pihole`, so tar it periodically and sync to R2 or an external drive:

```bash
tar czf pihole-$(date +%F).tar.gz etc-pihole/ etc-dnsmasq.d/
```

You do not need to back up the gravity database (it regenerates). What matters is the whitelist, groups, and client assignments you tuned by hand.

## Summary

Pi-hole is the **most immediately rewarding** self-hosted service: install once, every device benefits, and you instantly gain visibility into your own network.

Suggested path for beginners: Docker deploy → change router DNS → add Chinese blocklists → run for a week, whitelisting as needed → add cloudflared for encrypted upstream → finally consider redundancy.

Next, read [Tailscale vs Cloudflare Tunnel](#) to decide on remote access, or [Uptime Kuma self-hosted monitoring](#) to monitor Pi-hole itself — DNS going down is no small matter.
