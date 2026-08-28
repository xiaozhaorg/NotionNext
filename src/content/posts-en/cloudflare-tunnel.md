---
title: "Cloudflare Tunnel: Expose Your Home NAS and Raspberry Pi to the Internet for Free"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Use Cloudflare Tunnel to expose your local services to the public internet for free — no public IP or port forwarding needed. Get a secure tunnel running in about five minutes."
author: "Xiaozha"
tags: ["Cloudflare", "Tunnel", "Self-Hosting", "Tutorial"]
featured: false
draft: false
ogImage: "/images/cloudflare-tunnel-real.jpg"
coverAlt: "Data center server rack with blinking network LEDs"
zhSlug: "cloudflare-tunnel"
---

![image](/images/remote/1558494949-ef010cbdcc31.webp)

Cloudflare Tunnel (formerly Argo Tunnel) is the best free way to expose your local network services to the public internet. You don't need a public IP address, and you don't need to set up port forwarding on your router — you can have it up and running in about five minutes.

## What Is Cloudflare Tunnel?

By running the `cloudflared` daemon on your local machine, Cloudflare Tunnel establishes an encrypted tunnel between your device and Cloudflare's edge network, letting anyone on the public internet reach your local services through your domain name.

## Installing cloudflared

### Windows

Download the installer from https://github.com/cloudflare/cloudflared/releases

### macOS

### Linux

## Log In and Create a Tunnel

Here's an example `config.yml`:

## Configure DNS

## Start the Tunnel

## Typical Use Cases

- Remote access to your NAS (Synology, QNAP)
- Raspberry Pi services
- HomeAssistant smart home automation
- Game servers
- Debugging a development environment
