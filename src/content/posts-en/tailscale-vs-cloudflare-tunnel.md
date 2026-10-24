---
title: "Tailscale vs Cloudflare Tunnel: Which One for Self-Hosted Remote Access?"
pubDatetime: "2026-10-24T00:00:00.000Z"
description: "Tailscale and Cloudflare Tunnel solve two different problems: one builds a private mesh network between your devices, the other publishes web services to the internet. Covers architecture, privacy boundaries, the Cloudflare terms restriction on video, and running both together."
author: "Xiaozha"
tags: ["Self-Hosting", "Open Source", "Tutorial", "Free Tools"]
draft: false
ogImage: "/images/tailscale-vs-cloudflare-tunnel-real.jpg"
coverAlt: "Numbered ports and dense blue and gray cables on a network patch panel"
zhSlug: "tailscale-vs-cloudflare-tunnel"
---

Reaching home services from outside used to mean port forwarding on your router. Doing that in 2026 is like hanging your internal IP on a scanner's wall — bots will brute-force your SSH within hours.

Two mainstream approaches now both deliver **zero open inbound ports**: Tailscale and Cloudflare Tunnel.

Plenty of articles online treat them as competitors. They actually **solve two different problems**. Picking the wrong one is something you regret at 2 a.m. when you cannot get home.

## First: Publishing or Connecting?

This is where every decision starts.

**Publishing**: exposing a web service to *anyone* — friends, family, colleagues who will not install anything for you. They open a URL in a browser.

**Connecting**: making your own devices behave abroad as if on the same LAN — SSH, databases, admin panels across every machine at home.

The first needs **Cloudflare Tunnel**. The second needs **Tailscale**.

The classic mix-up: you want to show parents a photo album, install Tailscale, then spend two hours teaching them to install a client — something Cloudflare Tunnel does in five minutes. Conversely, you want SSH from outside, pick Cloudflare Tunnel, then discover it only proxies HTTP and SSH will not go through.

## How the Architectures Differ

### How Cloudflare Tunnel works

Run a `cloudflared` daemon on any machine at home. It **initiates an outbound** encrypted tunnel to Cloudflare's edge network.

When someone visits `jellyfin.example.com`: the request hits a Cloudflare edge node → Cloudflare performs DDoS scrubbing, WAF filtering, and TLS termination → then forwards it through the tunnel to your home service.

No inbound connection ever opens, and your home IP stays invisible.

### How Tailscale works

Tailscale uses WireGuard to form an encrypted mesh network (a "tailnet") of all your devices. Each device gets a stable `100.x.x.x` address and connects peer-to-peer with the others.

The **Subnet Router** is the key piece: a Tailscale node that additionally advertises your entire home subnet (say `192.168.1.0/24`) to the rest of the tailnet. Your phone on cellular can then reach `192.168.1.10` directly — as if actually on home WiFi.

When hole punching fails (symmetric NAT, strict firewalls) traffic falls back to a DERP relay, still end-to-end encrypted, with the relay unable to see contents.

## Head to Head

| | Cloudflare Tunnel | Tailscale |
|---|---|---|
| Essence | Reverse proxy for publishing | Private mesh VPN |
| Protocols | HTTP/HTTPS (SSH/RDP need extra setup) | **Full layer 3, all of TCP/UDP/ICMP** |
| Encryption boundary | TLS terminates at Cloudflare's edge | **End-to-end, WireGuard keys** |
| Third-party visibility | Cloudflare can see decrypted traffic | Metadata only |
| Client requirement | Zero for visitors | Client on every device |
| Domain | Required (DNS on Cloudflare) | Not needed, MagicDNS assigns names |
| Latency | +10-30ms (edge hop) | +2-8ms (P2P direct) |
| Public sharing | **Strength** — WAF/DDoS/cache free | Weak (Funnel is still experimental) |
| Private access | Weak, needs Access rules | **Strength** — feels like the LAN |
| Self-hosted alternative | None | **Headscale** (self-hosted control server) |
| Cost | Free, needs a domain | Generous free tier for home |

## The Privacy Boundary People Miss

**Cloudflare Tunnel terminates TLS at Cloudflare's edge.** Your traffic exists in plaintext inside Cloudflare facilities — that is what enables WAF filtering, bot detection, and Access authentication.

Technically Cloudflare *can* read your traffic content. For public services that is a reasonable trade: free DDoS protection and application-layer filtering in exchange.

**Tailscale is end-to-end encrypted.** Each packet is encrypted on your device with the peer's public key and decryptable only by the target host. Even DERP relays cannot see payloads.

So the rule is simple: **public services via Cloudflare, private administration via Tailscale.** Do not publish your password manager's admin UI through Cloudflare Tunnel — that trades privacy for convenience you did not need.

## The Cloudflare Terms Gotcha: Video

This one catches a lot of people, so it gets its own section.

**Cloudflare's self-serve terms of service (section 2.8) restrict serving large volumes of non-HTML content through the CDN** — video streaming being the classic case. Exposing Jellyfin or Plex through a Cloudflare Tunnel and then playing 4K remotely sits in a gray zone.

Enforcement against small personal setups is rare, but **it is Cloudflare's call, not yours**. If judged in violation, the outcome can be domain suspension.

So:

- **Jellyfin / Plex / Emby remote playback → Tailscale.** WireGuard P2P has no such restriction
- **Blogs, docs, navigation sites, APIs, webhooks, family photo album share links → Cloudflare Tunnel** is fine
- Images, documents, small files → Cloudflare Tunnel is fine

My own setup: Jellyfin hangs off Tailscale only; the Uptime Kuma status page goes through a Cloudflare Tunnel publicly.

## Getting Started with Tailscale

Three steps, five minutes:

**1. Register and install**

Sign up at [tailscale.com](https://tailscale.com) and install the client on each device (Windows/macOS/Linux/iOS/Android). Sign in with the same account and you are in the same tailnet.

**2. Set up a Subnet Router**

On any always-on machine at home (a dedicated mini-PC works), install Tailscale then:

```bash
sudo tailscale up --advertise-routes=192.168.1.0/24 --accept-dns=false
```

`--advertise-routes` takes your home subnet. Then in the admin console go to **Machines → that machine → Edit route settings** and approve the route.

**3. Enable IP forwarding (required for a Subnet Router)**

```bash
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
sudo sysctl -p /etc/sysctl.d/99-tailscale.conf
```

Done. From your phone on cellular, `ssh 192.168.1.10` reaches home, and `http://192.168.1.50:8096` is Jellyfin.

With **MagicDNS** you can also use hostnames — `ssh proxmox`, `http://pihole/admin` — no IPs to remember.

## Getting Started with Cloudflare Tunnel

Full steps are in our [Cloudflare Tunnel guide](#); here is the skeleton:

```bash
# Install and log in
cloudflared tunnel login

# Create a named tunnel
cloudflared tunnel create homeserver

# Point a hostname at it
cloudflared tunnel route dns homeserver jellyfin.example.com
```

`config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: status.example.com
    service: http://localhost:3001
  - hostname: photos.example.com
    service: http://localhost:2283
  - service: http_status:404
```

```bash
sudo cloudflared service install
```

**Prerequisites**: a domain with DNS hosted on Cloudflare. Without a domain the Tunnel is not usable (Tailscale needs no domain).

## The Hybrid: Where Most People End Up

If you run both, the division of labor looks like this:

```
                        ┌─ Public services ─→ Cloudflare Tunnel ─→ internet-reachable
                        │   (status page, shared albums, APIs, webhooks)
Remote device ── Tailscale ┤
                        └─ Private admin ── direct mesh ── SSH/Proxmox/DB/NAS/monitoring
```

Device by device:

| Service | Which | Why |
|---|---|---|
| SSH to any machine | Tailscale | Non-HTTP, needs IP-level access |
| Proxmox / TrueNAS panels | Tailscale | Admin panels should not be public |
| Databases | Tailscale | Do not expose 5432 |
| Pi-hole admin UI | Tailscale | The query log is your browsing history |
| Grafana monitoring | Tailscale | Contains network topology |
| Jellyfin / Plex | Tailscale | Avoids the Cloudflare video clause |
| Blog, docs, navigation site | Cloudflare Tunnel | Meant to be public |
| Uptime Kuma status page | Cloudflare Tunnel | For others to self-check |
| Webhooks, APIs | Cloudflare Tunnel | Third parties must reach it |
| Public photo album share | Cloudflare Tunnel | Family will not install clients |

Maintenance cost is real but small: a new machine gets Tailscale, and if it needs public access you add one tunnel route. Two actions, not a burden.

## If You Only Pick One?

Pick **Tailscale**.

Reasoning: private access covers far more scenarios than publishing does — SSH, admin panels, databases, monitoring, media playback are daily drivers, while "share a service with someone who will not install a client" is occasional. Tailscale also has no domain requirement, no terms-of-service gray zone, and no third party decrypting your traffic.

When the day comes that you truly need it, add a single cloudflared container — one domain, one tunnel.

## Want to Drop the Third Party Entirely?

Both have self-hosted alternatives, sort of:

- **Headscale**: an open-source Tailscale control server. Self-host it and you no longer depend on Tailscale's coordination servers; clients work unchanged. All data stays yours.
- Cloudflare Tunnel has **no** self-hosted alternative — its value lives in Cloudflare's edge network. Self-hosting that equivalent means building your own reverse proxy plus your own CDN, a different order of engineering.

If third-party visibility is a hard line for you, Tailscale + Headscale is the complete answer.

## Summary

One-line decision:

> **For you and your devices → Tailscale. For everyone else and people who will not install software → Cloudflare Tunnel.**

Install both and draw the boundary along public/private — that is the standard shape of self-hosted remote access in 2026. Zero monthly cost, near-zero attack surface, safer than any port mapping scheme.

Next, read our [Cloudflare Tunnel guide](#) to finish the public half, or [Ubuntu server setup](#) to lay the server foundation first.
