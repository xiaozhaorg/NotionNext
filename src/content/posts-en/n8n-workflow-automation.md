---
title: "n8n Self-Hosted Workflow Automation: Open Source Zapier Alternative"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Complete n8n tutorial. The open-source workflow automation tool with 400+ integrations. Visual drag-and-drop workflow building. Docker deployment and practical examples."
author: "Xiaozha"
tags: ["Self-Hosting", "Open Source", "Tutorial", "Automation"]
featured: false
draft: false
ogImage: "/images/n8n-workflow-automation-real.jpg"
coverAlt: "Laptop with data charts on office desk"
zhSlug: "n8n-workflow-automation"
---

You've probably built a Zapier automation before: "When I get an email → create a row in a spreadsheet." It works — until you hit the free tier's 100-task limit, run up against the 50-workflow cap on the paid plan, or wonder why a third-party SaaS needs to see every piece of data flowing through your business.

**n8n** is the answer to all of those complaints: a fair-code, self-hostable workflow automation tool with **400+ integrations**, a visual drag-and-drop editor, and — because it runs on your own server — **no per-workflow task limits and no data that leaves your infrastructure**. It's the open-source Zapier alternative that developers actually enjoy using.

This complete tutorial covers what n8n is, the core concepts, Docker deployment with PostgreSQL and Redis, and three real-world workflow examples you can build today: scheduled RSS to Telegram, a webhook that writes form data to a database, and an AI-powered article summarizer.

---

## What Is n8n and Why Self-Host It?

n8n (pronounced "n-eight-n", from the expression "n8n = nothing to lose / node-based") is a workflow automation platform. You build automations by connecting **nodes** on a canvas — a trigger node fires, and data flows through processing nodes to action nodes.

It's the direct competitor to Zapier and Make, with a critical difference: **you can run the entire platform on your own hardware** under the permissive n8n "Sustainable Use License" (free for individuals and small teams; you pay only if you resell it as a SaaS).

### n8n vs. Zapier: Why Self-Host

| Concern | Zapier | n8n (self-hosted) |
| --- | --- | --- |
| Task limits | 100 tasks/month free; paid tiers still cap tasks | None — limited only by your server |
| Workflow limits | Capped by plan (50–250+ workflows) | Unlimited |
| Data residency | Your data passes through Zapier's cloud | Stays on your server |
| Cost at scale | Gets expensive fast | Your VPS cost, flat |
| Integrations | 7,000+ | 400+ (covers the important ones) |
| Extensibility | Limited by Zapier's app model | Write custom nodes in JavaScript |

The privacy argument is the big one: when n8n moves data between your CRM, your database, and your AI API, it does so from your own server. Nobody in the middle sees your contacts, your leads, or your internal notes.

---

## Core Concepts: Nodes, Workflows, Triggers, Credentials

Before building workflows, you need four mental models.

### 1. Nodes

A **node** is a single step in a workflow. There are three kinds:

- **Trigger nodes** — start the workflow (Webhook, Schedule, Manual, or an event from an app).
- **Regular nodes** — process or act (HTTP Request, Code, Set, Postgres, Telegram, etc.).
- **AI/LangChain nodes** — chat models, agents, memory, tools.

### 2. Workflows

A **workflow** is a canvas of connected nodes. Data flows along the connections from node to node, and each node's output becomes the input for the next. You can chain, branch, merge, and loop — n8n supports full conditional logic with IF, Switch, Merge, and Loop nodes.

### 3. Triggers

Workflows are activated by **triggers**. Common ones in this tutorial:

- **Manual Trigger** — start by clicking "Execute Workflow" (good for testing).
- **Schedule Trigger** — run on a cron schedule.
- **Webhook** — start when an HTTP request hits a URL.
- **App event triggers** — e.g., new email, new row, new GitHub issue.

### 4. Credentials

Every external service needs **credentials**: API keys, OAuth tokens, database passwords. n8n stores them encrypted (using your `N8N_ENCRYPTION_KEY` — see Security below), and you manage them once under *Credentials* then reuse them across workflows. You can also share credentials with other users, and set permissions for who can use them.

---

## Deploying n8n with Docker Compose (PostgreSQL + Redis)

For anything beyond a quick test, run n8n with a real database. The officially recommended setup is **PostgreSQL** for workflow storage and **Redis** for queue/cache, which keeps things fast even with many workflows and enables multi-instance scaling later.

### Directory and `.env`

```
n8n/
├── docker-compose.yml
├── .env
└── backups/
```

`.env`:

```env
# n8n
N8N_HOST=n8n.example.com
N8N_PROTOCOL=https
N8N_PORT=5678
N8N_ENCRYPTION_KEY=change-me-to-a-long-random-string

# Postgres
POSTGRES_PASSWORD=change-me-db-password
POSTGRES_USER=n8n
POSTGRES_DB=n8n
```

Generate a strong encryption key first:

```bash
openssl rand -hex 24
```

Paste the output into `N8N_ENCRYPTION_KEY`. This key encrypts your stored credentials — lose it and n8n cannot decrypt them.

### `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - n8n_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - n8n_redis_data:/data

  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      N8N_HOST: ${N8N_HOST}
      N8N_PROTOCOL: ${N8N_PROTOCOL}
      N8N_PORT: ${N8N_PORT}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_EDITOR_BASE_URL: https://${N8N_HOST}
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: ${POSTGRES_DB}
      DB_POSTGRESDB_USER: ${POSTGRES_USER}
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_REDIS_ENABLED: "true"
      DB_REDIS_HOST: redis
      DB_REDIS_PORT: 6379
      GENERIC_TIMEZONE: Asia/Shanghai
      TZ: Asia/Shanghai
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

volumes:
  n8n_pg_data:
  n8n_redis_data:
  n8n_data:
```

Start it:

```bash
docker compose up -d
```

Wait a few seconds, then open `http://localhost:5678`, create your admin account, and you're in the editor. For a domain, put n8n behind a reverse proxy or a [Cloudflare Tunnel](/en/articles/cloudflare-tunnel-tutorial) so you reach it over HTTPS at `https://n8n.example.com`.

### Backup Strategy (Don't Skip This)

Your workflows are valuable and your credentials are irreplaceable. Two things to back up:

1. **The PostgreSQL database** — contains workflows, users, and settings.
2. **`N8N_ENCRYPTION_KEY`** — without it, the backup is unreadable.

Back up the database with a cron job:

```bash
docker compose exec postgres pg_dump -U n8n n8n | gzip > backups/n8n-$(date +%F).sql.gz
```

Keep the encryption key safe (in a password manager) and rotate backups off-box. Restoring is `gunzip | psql` into a fresh Postgres volume plus the same env vars.

---

## The 400+ Integrations, By Category

n8n's native nodes cover the tools people actually use:

- **Communication** — Telegram, Slack, Discord, Email (SMTP/IMAP), WhatsApp, Twilio, Matrix.
- **Databases** — PostgreSQL, MySQL, MariaDB, SQLite, MongoDB, Redis, Supabase, Airtable, Google Sheets.
- **AI** — OpenAI, Anthropic Claude, Google Gemini, Ollama, Hugging Face, LangChain agents, vector stores.
- **Cloud & DevOps** — AWS, GCP, Azure, GitHub, GitLab, Docker, Kubernetes, Terraform.
- **Files** — Read/Write Files, Spreadsheets (XLSX/CSV), PDF, FTP, Google Drive, Dropbox, S3.
- **Web** — HTTP Request, Webhook, RSS, HTML Extract, GraphQL, Convert to JSON.

Plus **HTTP Request** and **Webhook** nodes mean that even if a service has no native node, you can call its REST API with a few clicks. Between native nodes and generic HTTP, 400+ integrations covers virtually every real-world automation.

---

## Practical Scenario 1: Scheduled RSS → Telegram

The classic first automation: every 6 hours, fetch the latest Hacker News front page and post each story to a Telegram channel.

### What you need

- A Telegram bot (create one with **@BotFather**, get the bot token, and get your channel's `@channel` ID or your chat ID).
- Add the Telegram credentials in n8n (*Credentials → New → Telegram*).

### Build the workflow

Add three nodes and connect them in a line:

1. **Schedule Trigger** (`Every 6 hours`)
2. **RSS Read** (URL: `https://hnrss.org/frontpage`)
3. **Telegram** (Send Message)

The exported workflow JSON looks like this:

```json
{
  "name": "Daily RSS Digest to Telegram",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            { "field": "hours", "hoursInterval": 6 }
          ]
        }
      },
      "id": "sched-1",
      "name": "Every 6 hours",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [0, 0]
    },
    {
      "parameters": {
        "url": "https://hnrss.org/frontpage",
        "options": {}
      },
      "id": "rss-1",
      "name": "Hacker News RSS",
      "type": "n8n-nodes-base.rssFeedRead",
      "typeVersion": 2,
      "position": [240, 0]
    },
    {
      "parameters": {
        "chatId": "@my_channel",
        "text": "=New: {{ $json.title }}\n{{ $json.link }}",
        "additionalFields": {}
      },
      "id": "tg-1",
      "name": "Send to Telegram",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.1,
      "position": [480, 0],
      "credentials": {
        "telegramApi": { "id": "tg-cred", "name": "Telegram Bot" }
      }
    }
  ],
  "connections": {
    "Every 6 hours": { "main": [[{ "node": "Hacker News RSS", "type": "main", "index": 0 }]] },
    "Hacker News RSS": { "main": [[{ "node": "Send to Telegram", "type": "main", "index": 0 }]] }
  }
}
```

Note the `=...` prefix on the Telegram text: it marks the field as an **expression** so `{{ $json.title }}` and `{{ $json.link }}` are evaluated against the RSS item data instead of being sent literally.

Click **Execute Workflow** to test — every RSS item will be sent to your Telegram channel. Then activate the workflow and the schedule takes over.

### Bonus: swap Telegram for email

Replace the Telegram node with an **Email Send (SMTP)** node and the same workflow becomes "send me the day's top stories by email." The trigger and data flow don't change at all — which is the whole point of visual automation.

---

## Practical Scenario 2: Webhook → Write to Database

A common backend task: a landing page form POSTs JSON to a URL, and you want each submission stored in PostgreSQL.

### The webhook node

Add a **Webhook** node with:

- HTTP Method: `POST`
- Path: `lead-form`
- Response Mode: `On Received`

n8n gives you a public URL like `https://n8n.example.com/webhook/lead-form` (or `http://localhost:5678/webhook/lead-form` when testing). The incoming JSON body becomes `{{ $json }}` for the next node.

Sample form payload:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "Interested in a demo"
}
```

### The Postgres node

Add a **Postgres** node (create Postgres credentials pointing at a database you own) configured for insert:

```json
{
  "parameters": {
    "operation": "insert",
    "schema": "public",
    "table": "leads",
    "columns": "name,email,message",
    "values": "={{ $json.name }},={{ $json.email }},={{ $json.message }}",
    "options": {}
  },
  "id": "pg-1",
  "name": "Insert lead",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2.3,
  "position": [240, 0],
  "credentials": {
    "postgres": { "id": "pg-cred", "name": "Postgres" }
  }
}
```

In the visual editor, you'd pick **Table → leads**, then map each column to the corresponding field from the webhook body using expressions. The JSON above shows the result.

### Test it end to end

```bash
curl -X POST https://n8n.example.com/webhook/lead-form \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","message":"Hi!"}'
```

Check your database:

```bash
docker compose exec postgres psql -U n8n -d n8n -c "SELECT * FROM leads ORDER BY id DESC LIMIT 5;"
```

If the row appears, you've built a serverless-style form backend with zero application code. Add an IF node to validate the email, or a second branch that emails you a notification — the possibilities compound.

---

## Practical Scenario 3: AI Node — Automatically Summarize Articles

n8n ships first-class AI nodes (powered by the LangChain integration), so you can build LLM pipelines visually without writing glue code.

### Workflow: Fetch article → OpenAI summary → save/notify

The nodes:

1. **HTTP Request** — GET the article (or pull text via RSS/HTML Extract from a URL).
2. **OpenAI** (chat model node) — summarize the content.
3. **Telegram / Notion / Google Sheets** — send or store the result.

The AI node JSON:

```json
{
  "parameters": {
    "modelId": {
      "__rl": true,
      "value": "gpt-4o-mini",
      "mode": "list"
    },
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "You are a concise editor. Summarize the article into 3 bullet points."
        },
        {
          "role": "user",
          "content": "={{ $json.content }}"
        }
      ]
    },
    "options": {
      "temperature": 0.3
    }
  },
  "id": "ai-1",
  "name": "OpenAI",
  "type": "@n8n/n8n-nodes-langchain.openAi",
  "typeVersion": 2,
  "position": [240, 0],
  "credentials": {
    "openAiApi": { "id": "oa-cred", "name": "OpenAI account" }
  }
}
```

The system prompt sets the behavior; `={{ $json.content }}` injects the article text from the previous node into the user message. Set `gpt-4o-mini` (or any model) and add your OpenAI API key under Credentials.

### Going further with AI Agents

For more advanced use, the **AI Agent** node lets you build an agent with **tools** — e.g., give it a web search tool and a vector store, and ask questions in natural language. The agent decides when to call tools, which makes for surprisingly capable assistants running entirely from your n8n instance.

Combine this with the RSS workflow and you get "every morning, summarize the 5 top stories from my feeds and send them to my inbox" — fully automated, fully private.

---

## Execution Modes: How Workflows Run

- **Manual** — the Manual Trigger, or the "Execute Workflow" button. Perfect for testing and one-off jobs.
- **Schedule** — the Schedule Trigger runs on a cron pattern (every X minutes/hours, or a custom cron like `0 8 * * 1` for Mondays at 8am).
- **Webhook** — starts instantly when an HTTP request arrives, so external systems (forms, GitHub, Stripe) can fire it.
- **App event** — n8n listens for events from connected apps (new email, new row, new webhook from Telegram, etc.).
- **Sub-workflow** — the "When Called by Another Workflow" trigger lets one workflow invoke another, so you can build reusable units.

---

## Security Best Practices

n8n is a powerful automation hub — treat it like the crown jewels it processes.

1. **Set a strong `N8N_ENCRYPTION_KEY`** — without it, stored credentials can't be decrypted. Use `openssl rand -hex 24` and keep it safe.
2. **Enable basic auth or SSO** — either run n8n behind an authenticating reverse proxy (Authelia, Authentik, Cloudflare Access) or set:
   ```env
   N8N_BASIC_AUTH_ACTIVE=true
   N8N_BASIC_AUTH_USER=admin
   N8N_BASIC_AUTH_PASSWORD=change-me
   ```
3. **Never expose the editor publicly without HTTPS + auth.** If you need it reachable from the internet, put it behind a tunnel or proxy with TLS and a login wall.
4. **Limit webhook exposure** — public webhooks are endpoints anyone can hit. Add a secret header check in the workflow (IF node comparing a header to a value) so only your forms can trigger it.
5. **Rotate and scope credentials** — give n8n least-privilege API keys and database users, not your root admin token.
6. **Back up the DB + encryption key** on a schedule (see Backup Strategy above).

---

## n8n vs Zapier vs Make vs Node-RED

| Aspect | n8n | Zapier | Make | Node-RED |
| --- | --- | --- | --- | --- |
| License | Fair-code (free to self-host) | Proprietary SaaS | Proprietary SaaS | Apache 2.0 |
| Self-hostable | ✅ | ❌ | ❌ | ✅ |
| Pricing | Free self-host | From ~$19.99/mo + task limits | Free tier + paid plans | Free |
| Integrations | 400+ | 7,000+ | 2,000+ | 2,000+ (community nodes) |
| Visual editor | Drag & drop canvas | Wizard + canvas | Drag & drop canvas | Node-graph (more technical) |
| Task/workflow limits | None (self-hosted) | Yes | Yes | None |
| Custom code | Function nodes + expressions | "Code by Zapier" (JS) | Limited | Full Node.js |
| AI / LLM nodes | Native (LangChain, agents) | Via app nodes | Via app nodes | Community |
| Best for | Developers & teams wanting control | Non-technical users on popular apps | Non-technical users, richer UI | IoT, hardware, edge automation |

**The TL;DR:** Zapier and Make are the easiest for non-developers but cap you and see your data. Node-RED is fantastic for IoT and hardware but is more of a coding canvas than an automation SaaS. **n8n hits the sweet spot** — SaaS-like DX, developer-grade power, self-hosted privacy, and no artificial limits.

---

## Summary

By now you can:

1. **Explain what n8n is** and why self-hosting beats Zapier (no task limits, data stays yours).
2. **Deploy it properly** with Docker Compose + PostgreSQL + Redis, including backups and the all-important `N8N_ENCRYPTION_KEY`.
3. **Build three real workflows** — scheduled RSS → Telegram, webhook → Postgres, and AI-powered article summarization.
4. **Understand execution modes** (manual, schedule, webhook, events, sub-workflows).
5. **Harden your instance** against the internet.

The fastest way to learn is to pick one boring task you do by hand every week — copying data between apps, checking a feed, forwarding notifications — and automate it in n8n tonight. Start with the RSS → Telegram example; it's the smallest workflow that teaches you triggers, expressions, and credentials in one go.

n8n is one of the stars of the [self-hosted app ecosystem](/en/articles/self-host-apps). If you're deploying it on a fresh server, our [Ubuntu setup guide](/en/articles/ubuntu-server-setup) and [Docker Compose tutorial](/en/articles/docker-compose-tutorial) will get you to the finish line, and a [Cloudflare Tunnel](/en/articles/cloudflare-tunnel-tutorial) gives you a safe public URL. Happy automating! ⚙️
