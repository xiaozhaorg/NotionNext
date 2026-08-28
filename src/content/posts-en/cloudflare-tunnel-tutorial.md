---
title: "🚀 Free Tunneling! Cloudflare Tunnel Tutorial — Expose Local Services to the World"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Step-by-step guide to using Cloudflare Tunnel for free. Expose local AI services, NAS, and dev environments to the internet without a public IP."
author: "Xiaozha"
tags: ["Cloudflare", "Tutorial", "Free Tools", "Tunneling"]
featured: false
draft: false
ogImage: "/images/cloudflare-tunnel-tutorial-real.jpg"
coverAlt: "Data center server rack with blinking network LEDs"
zhSlug: "cloudflare-tunnel-tutorial"
---

![image](/images/remote/1558494949-ef010cbdcc31.webp)

In 2026, more and more developers are running large language models, AI coding assistants, and tools like NextChat on their own machines. But a question quickly follows:

**How do you let the outside world reach services running on your local machine?**

The traditional answers are either buy a public IP address or pay for frp / ngrok. Both cost money and require maintenance.

This post walks through a completely free solution: **Cloudflare Tunnel**.

## Why Cloudflare Tunnel?

Cloudflare Tunnel (formerly Argo Tunnel) is a free tunneling service from Cloudflare. The idea is elegant:

You don't need a public IP, and you don't need to open ports on your router. You just run a `cloudflared` client on your machine. It opens a long-lived outbound connection to Cloudflare, which reverse-proxies external requests back to your local service.

Compared to traditional tunneling tools, it has several decisive advantages:

- **Completely free** — No traffic or bandwidth limits, zero cost for personal use.
- **No public IP required** — Works on home broadband, mobile networks, and office connections alike.
- **HTTPS included** — Cloudflare automatically issues certificates. No more fiddling with Let's Encrypt.
- **Secure** — Your real IP is never exposed. All traffic goes through Cloudflare's WAF and DDoS protection.
- **Global acceleration** — Built on Cloudflare's 300+ edge locations, access is fast worldwide.
- **Custom domain** — Bind it to your own domain for a professional look.

## Prerequisites

Before you start, you'll need:

- A Cloudflare account (free signup is fine).
- A domain hosted on Cloudflare (a free domain works too).
- A local service already running — for example, NextChat on `localhost:3000`.

## Install the `cloudflared` Client

### Windows

The easiest way on Windows is to use `winget`:

```bash
winget install --id Cloudflare.cloudflared
```

Alternatively, download the `.msi` installer from the [GitHub Releases page](https://github.com/cloudflare/cloudflared/releases) and install it with a double-click.

### macOS

On macOS, use Homebrew:

```bash
brew install cloudflared
```

### Linux

On Debian / Ubuntu, install from Cloudflare's apt repository:

```bash
# Add the cloudflare gpg key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

# Add the repo
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Install
sudo apt-get update && sudo apt-get install cloudflared -y
```

### Verify the installation

```bash
cloudflared --version
```

## Quick Tunnel — A Temporary URL in One Command

If you just need to show a local project to a coworker and don't want to set up a domain, use Quick Tunnel. One command does it:

```bash
cloudflared tunnel --url http://localhost:3000
```

The terminal will print a temporary URL that looks something like `https://random-words-xxx.trycloudflare.com`. Send that URL to anyone and they can reach your local service.

> ⚠️ **Note**: Quick Tunnel is temporary. The URL stops working the moment the client closes, and the domain is randomly assigned each time. For long-term use, configure a named tunnel as described below.

## Named Tunnel Setup — For Long-Term Use

### 1. Log in to Cloudflare

```bash
cloudflared tunnel login
```

A browser window opens to the authorization page. Pick the domain you want to use (for example, `example.com`) and authorize. A `cert.pem` credential file is written to `~/.cloudflared/`.

### 2. Create the tunnel

```bash
cloudflared tunnel create ai-tunnel
```

This prints a tunnel UUID and writes a `<UUID>.json` credential file to `~/.cloudflared/`. Keep this file safe.

### 3. Route DNS to the tunnel

You don't need to add the DNS record manually in the Cloudflare dashboard — the following command configures it for you:

```bash
cloudflared tunnel route dns ai-tunnel ai.example.com
```

Cloudflare automatically creates a CNAME record for `ai.example.com` pointing to `<UUID>.cfargotunnel.com`.

### 4. Write the config file

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <UUID>
credentials-file: /root/.cloudflared/<UUID>.json

ingress:
  - hostname: ai.example.com
    service: http://localhost:3000
  - service: http_status:404
```

Replace `<UUID>` with your tunnel's UUID, and adjust the `service` to match your local app.

### 5. Start the tunnel

```bash
cloudflared tunnel run ai-tunnel
```

Open `https://ai.example.com` in your browser — your local service is now reachable from the public internet, with HTTPS already enabled.

## Auto-Start on Boot

For production, you don't want to leave a terminal window open. Register `cloudflared` as a system service instead.

### Linux (systemd)

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

Manage it like any other systemd unit:

```bash
sudo systemctl status cloudflared
sudo systemctl restart cloudflared
```

### Windows

Open PowerShell as Administrator:

```powershell
cloudflared service install
```

The service is registered as `Cloudflared` and you can manage its startup type in `services.msc`.

## Real Example — Expose a Local Ollama LLM API

Here's a real-world scenario: expose your local Ollama LLM API to the internet so you can call it from your phone while you're out.

### Step 1 — Start Ollama on all interfaces

By default Ollama listens on `127.0.0.1:11434`. To make it reachable from the tunnel, set the host environment variable so it listens on all interfaces:

```bash
# Linux / macOS
export OLLAMA_HOST=0.0.0.0:11434
ollama serve

# Windows (PowerShell)
$env:OLLAMA_HOST="0.0.0.0:11434"
ollama serve
```

### Step 2 — Add an ingress rule

Update `~/.cloudflared/config.yml`:

```yaml
tunnel: <UUID>
credentials-file: /root/.cloudflared/<UUID>.json

ingress:
  - hostname: ai.example.com
    service: http://localhost:3000
  - hostname: llm.example.com
    service: http://localhost:11434
  - service: http_status:404
```

### Step 3 — Restart cloudflared and test

```bash
sudo systemctl restart cloudflared

curl https://llm.example.com/api/tags
```

That's it. You can now call your home-hosted LLM from anywhere in the world.

## Security Hardening

Once a service is on the public internet, security has to keep up:

- **Enable Cloudflare Access** — In the Zero Trust dashboard, attach an authentication policy to the tunnel (email OTP, GitHub login, SSO, etc.). Only authorized users will reach the service.
- **Restrict exposed paths** — Use `originRequest` and application-level rules so only the API paths you actually need are reachable.
- **Enable rate limiting** — In the Cloudflare dashboard, configure WAF rules to prevent abuse of your endpoints.
- **Review logs regularly** — Use `cloudflared tunnel list` and the Cloudflare dashboard audit log to monitor access.

## Troubleshooting

### Q1: 502 Bad Gateway

Check that the local service is actually running and that the port in `config.yml` is correct. `cloudflared` must be able to reach the `service` address from the machine it runs on. A common mistake is pointing `service` at `localhost` when the app is bound to a different interface.

### Q2: DNS not resolving

Cloudflare DNS usually propagates within a minute. Verify the record with:

```bash
nslookup ai.example.com
```

The response should resolve to `<UUID>.cfargotunnel.com`.

### Q3: Running multiple tunnels

You don't need to. A single tunnel can proxy multiple services — just add more `ingress` rules in `config.yml` with different `hostname` values. One tunnel, many hostnames.

## Summary

Cloudflare Tunnel is currently the best tunneling option for individual developers: free, secure, stable, and easy to configure.

Whether you're exposing a local AI service, accessing a NAS remotely, or demoing a local project to a client, it handles the job effortlessly. Combined with Cloudflare Workers for hosting and Cloudflare email routing, you can build a complete personal cloud infrastructure entirely on Cloudflare's free tier.
