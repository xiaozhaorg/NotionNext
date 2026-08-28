---
title: "NextChat Deployment Guide: One-Click AI Chat Assistant on Vercel"
pubDatetime: "2026-06-03T00:00:00.000Z"
description: "Deploy your own private AI chat assistant with NextChat. Supports OpenAI, Claude, DeepSeek, Gemini and 16+ LLMs. Local storage for privacy. Zero-cost deployment."
author: "Xiaozha"
tags: ["AI", "Tutorial", "Free Tools", "LLM"]
featured: false
draft: false
ogImage: "/images/nextchat-deploy-guide-real.jpg"
coverAlt: "Glowing AI chat interface on screen"
zhSlug: "nextchat-deploy-guide"
---

You use ChatGPT, Claude, and Gemini — but each has its own website, its own login, and its own $20/month subscription. Switching between them is a chore, and everything you type lives on someone else's server.

**NextChat** (formerly ChatGPT-Next-Web) fixes all of that. It is a lightweight, open-source AI chat client that unifies **16+ major LLM providers** — OpenAI, Claude, DeepSeek, Gemini, and more — behind a single, clean interface. Your conversations are stored **locally** in your browser, your API keys stay in your own deployment, and the whole thing runs for free on Vercel's free tier.

This complete deployment guide covers what NextChat is, its core features, one-click Vercel deployment, Docker deployment to your own server, every important environment variable, connecting DeepSeek/Claude/Gemini/SiliconFlow, custom domains with Cloudflare, data backup, and the most common pitfalls.

---

## What Is NextChat and Why Self-Deploy It?

NextChat is an open-source web client for large language models. Instead of a "one provider" interface, it is a universal remote control for AI: pick a model from a dropdown and chat — same UI, same history, zero learning curve.

| Concern | Official ChatGPT | NextChat |
| --- | --- | --- |
| Monthly fee | $20/month | Free (you only pay API usage) |
| Deployment difficulty | None (hosted) | ~1 minute on Vercel |
| Model selection | GPT series only | 16+ providers, freely switchable |
| Data privacy | Cloud storage | Local browser storage |
| Custom domain | Not supported | Supported |
| API keys | Handled by OpenAI | You control them |

### Why self-deploy?

- **Privacy** — conversations live in your browser's `localStorage`, not in a third-party cloud.
- **Cost** — you pay only for actual API usage; a personal DeepSeek or Gemini setup costs pennies a month.
- **Freedom** — switch models mid-conversation and use the same client for OpenAI, Claude, DeepSeek, and Gemini.
- **No subscriptions** — never pay a flat monthly fee for chat again.

---

## Core Features

NextChat is deceptively full-featured. The features you will actually use:

| Feature | What it does |
| --- | --- |
| **16+ model providers** | OpenAI, Claude, DeepSeek, Gemini, and domestic Chinese models (Ernie, Qwen, Hunyuan, Doubao) |
| **Local storage** | All chats and settings saved in `localStorage`; nothing leaves your browser except API calls |
| **Markdown & code rendering** | Full Markdown, syntax-highlighted code blocks, LaTeX |
| **Masks (prompt presets)** | Dozens of role templates — copywriter, code reviewer, translator — out of the box |
| **Artifacts preview** | Live preview of generated HTML/web pages inside the chat |
| **Voice input** | Speak instead of type with voice-capable models |
| **MCP support** | Model Context Protocol plugins: web search, calculators, custom APIs |
| **Sync** | Optional WebDAV / Upstash backup so history survives browser wipes |
| **Multi-platform** | Web, PWA (installable), and a tiny desktop client |

---

## Method 1: One-Click Deploy on Vercel

This is the fastest path — no server, no Docker, no terminal required.

### Step 1 — Fork the repository

Open the official repo and click **Fork** in the top-right corner:

- GitHub: [ChatGPTNextWeb/NextChat](https://github.com/ChatGPTNextWeb/NextChat)

Wait a few seconds for the fork to complete.

### Step 2 — Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your fork.
2. Vercel auto-detects the project; leave the build settings at their defaults.
3. Before clicking **Deploy**, add the two key environment variables:

| Variable | Value | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | `sk-...` | Your API key (OpenAI, DeepSeek, or any compatible provider) |
| `CODE` | e.g. `my-secret-password` | Access password so strangers can't burn your API credits |

4. Click **Deploy**. After ~5 minutes the status flips to **Deployed**.

### Step 3 — Open your assistant

Vercel assigns you a URL like `https://nextchat-yourname.vercel.app`. Open it, enter the `CODE` password you set, and you're chatting.

> **Note:** If you skip `CODE`, the deployment is publicly accessible and anyone who finds the URL can use your API credits. Always set a password, even for personal use.

---

## Method 2: Docker Deployment to Your Own Server

Prefer full control? Run NextChat on your own machine or VPS with a single `docker run`:

```bash
docker run -d --name nextchat \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-your-key \
  -e CODE=my-secret-password \
  -e BASE_URL=https://api.deepseek.com \
  --restart unless-stopped \
  yidadaa/chatgpt-next-web
```

Or with Docker Compose — cleaner and easier to update:

```yaml
services:
  nextchat:
    image: yidadaa/chatgpt-next-web
    container_name: nextchat
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      OPENAI_API_KEY: sk-your-key
      CODE: my-secret-password
      BASE_URL: https://api.deepseek.com
```

```bash
docker compose up -d
```

Open `http://localhost:3000` (or `http://server-ip:3000`). To update:

```bash
docker compose pull
docker compose up -d
```

> The image is also published as `ghcr.io/chatgpt-next-web/chatgpt-next-web` if you prefer GitHub Container Registry.

---

## Environment Variables You Should Know

Beyond the two basics, these variables give you real control:

| Variable | Purpose | Example |
| --- | --- | --- |
| `OPENAI_API_KEY` | Default API key | `sk-...` |
| `CODE` | Access password (comma-separated for multiple users) | `pass1,pass2` |
| `BASE_URL` | API base URL (defaults to `https://api.openai.com/v1`) | `https://api.deepseek.com` |
| `ANTHROPIC_API_KEY` | Claude's key | `sk-ant-...` |
| `ANTHROPIC_BASE_URL` | Claude API endpoint override | `https://api.anthropic.com` |
| `OPENAI_MODEL_LIST` | Visible model list (defaults to all) | `-all,+gpt-4o,+gpt-4o-mini` |
| `CUSTOM_MODELS` | Add models beyond the default list | `+deepseek-chat=>DeepSeek V3` |
| `DEFAULT_MODEL` | Model preselected at startup | `gpt-4o` |
| `ENABLE_MCP` | Turn on MCP plugin support | `true` |

The model-list syntax deserves attention. `-all,+gpt-4o` means "hide everything except gpt-4o". A common pattern is to expose only the models you actually have access to:

```
OPENAI_MODEL_LIST=-all,+gpt-4o,+gpt-4o-mini,+deepseek-chat,+deepseek-reasoner
```

---

## Connecting DeepSeek

DeepSeek's API is OpenAI-compatible, which makes it a drop-in replacement. This is the most popular integration because DeepSeek is dramatically cheaper than OpenAI while being excellent at coding and reasoning.

Set these environment variables (Vercel: **Project → Settings → Environment Variables**; Docker: the `environment:` block):

```
OPENAI_API_KEY=sk-deepseek-your-key
BASE_URL=https://api.deepseek.com
OPENAI_MODEL_LIST=-all,+deepseek-chat,+deepseek-reasoner
```

Then, in the chat UI (bottom-right settings):

1. Scroll to **Custom Interface** and enable it.
2. **AI provider**: DeepSeek (or keep OpenAI-compatible with the `BASE_URL` above).
3. **API key**: your DeepSeek key.
4. **Model**: `deepseek-chat` (fast, general) or `deepseek-reasoner` (reasoning).
5. Click back and send a message — replies now come from DeepSeek.

### Why DeepSeek is a great default

- **Pricing** — a fraction of OpenAI's per-token rates.
- **OpenAI-compatible API** — zero code changes, just a different `BASE_URL` and key.
- **Free credits on signup** — new accounts get promotional credit, so you can test the whole setup for free.

---

## Connecting Claude and Gemini

NextChat treats each provider as a selectable option in the UI, but you can also wire the keys through environment variables.

### Claude (Anthropic)

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
ANTHROPIC_BASE_URL=https://api.anthropic.com
OPENAI_MODEL_LIST=-all,+claude-3-7-sonnet,+claude-sonnet-4
```

Or configure entirely in the UI: settings → choose **Claude** as the provider, paste the key, pick a model like `claude-sonnet-4`.

### Gemini (Google)

Gemini's API also speaks the OpenAI protocol through a compatibility endpoint, so you can point NextChat at it directly:

```env
OPENAI_API_KEY=AIza-your-gemini-key
BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
OPENAI_MODEL_LIST=-all,+gemini-2.0-flash,+gemini-2.5-pro
```

Gemini's free tier is generous — for many users it becomes the default model.

### Model switching in practice

Once multiple providers are configured, the model dropdown in the top-left lists everything. You can switch mid-conversation: the same chat thread continues with a different underlying model.

---

## Connecting a Domestic Relay API (SiliconFlow)

For users who need fast access in China — or simply want cheap, aggregated access to many models — relay services are the answer. **SiliconFlow (硅基流动)** is a popular one: it hosts open models (Qwen, DeepSeek, GLM, Llama) behind an OpenAI-compatible API and offers free starter credits.

Set:

```
OPENAI_API_KEY=sk-siliconflow-your-key
BASE_URL=https://api.siliconflow.cn/v1
OPENAI_MODEL_LIST=-all,+Qwen/Qwen2.5-72B-Instruct,+deepseek-ai/DeepSeek-V3
```

1. Register at SiliconFlow, grab an API key from the console.
2. Pick a model slug from their model list (e.g. `Qwen/Qwen2.5-72B-Instruct`).
3. Paste key + base URL into NextChat (env vars or the UI).
4. Model names in `OPENAI_MODEL_LIST` must match the provider's exact slugs.

The same pattern works with any other OpenAI-compatible relay — shaw-openai-style free relays, corporate gateways, or self-hosted gateways like one-api/new-api. Just change `BASE_URL` and the key.

---

## Custom Domain and Cloudflare Proxy

Vercel's `*.vercel.app` URL works, but a custom domain looks professional and is more reliable.

### Bind a domain in Vercel

1. Open the project → **Settings → Domains**.
2. Enter your domain, e.g. `ai.example.com`.
3. Vercel shows you a DNS record to add (usually a CNAME or A record).
4. If the domain is on Cloudflare, Vercel's auto-config flow can set it up for you after authorization.

### Or front it with Cloudflare (recommended)

Using Cloudflare DNS in front of Vercel gives you caching, DDoS protection, and your whole zone in one place:

```
ai.example.com  CNAME  cname.vercel-dns.com   (Proxied, orange cloud)
```

Once DNS propagates and the certificate issues, `https://ai.example.com` opens your assistant.

> **For China access:** `vercel.app` is blocked in some regions. A custom domain via Cloudflare (or a relay/edge proxy) is the standard workaround. Note that for Chinese mainland endpoints, a domain on a mainland-CDN-friendly provider or a domestic relay backend is often smoother than going through Cloudflare's overseas edge.

---

## Data Backup: Exporting Your localStorage

NextChat stores everything — conversations, settings, masks — in your browser's `localStorage`. That means clearing your browser data wipes your history. Back it up.

### Manual export

1. Open **Settings → Data**.
2. Click **Export All Data** → download the JSON file.
3. Keep it somewhere safe (a password manager, encrypted drive, or your NAS).
4. To restore, **Import Data** and select the file.

### Automatic sync

Enable **WebDAV** or **Upstash** sync in Settings → Data:

- **WebDAV** — point it at any WebDAV server (Nextcloud, Synology) for seamless cross-device sync.
- **Upstash Redis** — a free hosted Redis for syncing chat state across devices.

With either enabled, you can wipe your browser, log back in, and your full history returns.

---

## Common Problems and Fixes

### Q1: CORS errors when calling the API

If you use a **relay** or a non-official `BASE_URL`, the browser may block the API call with a CORS error. Fixes, in order:

1. Switch the provider to run through NextChat's **server-side** proxy (env-var config rather than browser-only settings).
2. Ensure the relay explicitly allows your origin (most OpenAI-compatible relays do).
3. As a last resort, proxy through your own reverse proxy that adds CORS headers.

### Q2: Forgot the access password (`CODE`)

- **Vercel**: Settings → Environment Variables → update `CODE` → **Redeploy** (a new deployment applies env changes).
- **Docker**: edit the `environment:` block, then `docker compose up -d`.
- The password applies at login; changing it kicks everyone and forces a fresh login.

### Q3: Models don't show in the dropdown

The model list is controlled by `OPENAI_MODEL_LIST` / `CUSTOM_MODELS`. If you set `-all`, every model is hidden and only the ones you explicitly `+`-prefixed appear. Fix: list exactly the models you have access to.

### Q4: "Error: OPENAI_API_KEY is not set"

The key is missing or empty in your deployment env. Also confirm `BASE_URL` matches the provider — many relays use a different path (`/v1` suffix matters).

### Q5: Messages fail after a while

Usually one of: API credits exhausted (check your provider dashboard), a free-tier rate limit, or a relay outage. Try switching to a different model or provider to isolate the cause.

---

## Summary

NextChat is the fastest way to own a private, multi-model AI chat assistant at zero deployment cost. In this guide you learned how to:

1. **Understand what NextChat is** — an open-source client unifying 16+ LLM providers.
2. **Use the core features** — local storage, Markdown, Masks, Artifacts, MCP.
3. **Deploy on Vercel in one click** — fork, import, add `OPENAI_API_KEY` + `CODE`.
4. **Deploy with Docker** — `docker run` or Compose on your own server.
5. **Configure environment variables** — `OPENAI_API_KEY`, `CODE`, `BASE_URL`, model lists.
6. **Connect DeepSeek** — an OpenAI-compatible, budget-friendly default.
7. **Connect Claude and Gemini** — including Gemini's free tier.
8. **Use domestic relays like SiliconFlow** — cheap aggregated model access.
9. **Bind a custom domain** and front it with Cloudflare.
10. **Back up chat data** — manual export and WebDAV/Upstash sync.
11. **Fix common issues** — CORS, passwords, model lists, missing keys.

The quickest way to try it: fork the repo, deploy on Vercel with `OPENAI_API_KEY` and `CODE`, and start a conversation with DeepSeek within ten minutes. If you found this useful, you might also enjoy our guides on [running LLMs locally with Ollama](/en/articles/ollama-local-llm) and [exposing local AI services with Cloudflare Tunnel](/en/articles/cloudflare-tunnel-tutorial). Happy chatting! 🤖
