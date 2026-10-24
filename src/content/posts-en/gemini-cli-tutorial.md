---
title: "Gemini CLI in Practice: The Free Terminal AI Coding Agent"
pubDatetime: "2026-10-25T00:00:00.000Z"
description: Sign in with a personal Google account and you get 1,000 requests a day and a 1M-token context window. This covers installing Gemini CLI, its three auth modes, hierarchical GEMINI.md context, sandbox and YOLO modes, MCP setup, and how it actually differs from Claude Code.
author: 小吒
tags:
  - Tutorial
  - AI Coding
  - Free Tools
draft: false
ogImage: "/images/gemini-cli-tutorial-real.jpg"
coverAlt: "Close-up of an Ubuntu terminal screen showing a green command prompt and a white sudo command on a black background"
zhSlug: "gemini-cli-tutorial"
---

The terminal AI coding space got crowded in 2026, with Claude Code, Codex CLI, and Gemini CLI as the main three. The first two have an entry fee — Claude Code needs a paid Claude subscription, Codex needs a ChatGPT account or API access.

Gemini CLI is the exception: **sign in with a personal Google account and you get 1,000 free requests per day, a 1M-token context window, and it is open source.**

This article covers getting productive with it, plus how it actually differs from Claude Code — not "which is stronger," but "which for which job."

## The free tier: what you actually get

Gemini CLI runs two quota systems:

**Google account sign-in (recommended)**

- 60 requests per minute
- 1,000 requests per day
- No card required

**API key (Google AI Studio)**

- A free daily quota, plus metered billing beyond it
- The upside: you pick the model and can call it from scripts

For individual use, Google sign-in is the right default. 1,000/day sounds generous until you realize one agent task routinely burns a dozen-plus requests (read files, plan, edit, run tests, read the failure, fix again). It suits **interactive development**, not unattended batch jobs running in the background.

## Install: one command

You need Node.js 20+. Check:

```bash
node --version
```

Upgrade Node if it is older. Then pick one of three:

```bash
# Option 1: npx, run without installing (good for a first look)
npx @google/gemini-cli

# Option 2: global install, the daily driver
npm install -g @google/gemini-cli

# Option 3: Homebrew (macOS/Linux)
brew install gemini-cli
```

Launch it from any project directory:

```bash
cd ~/projects/my-app
gemini
```

First run asks for a theme color, then authentication. A browser opens the Google sign-in page; credentials cache locally so you only do it once.

## Three auth modes, by scenario

`/auth` switches between them at any time:

| Mode | Use case | Quota |
|---|---|---|
| **Personal Google account** | Daily interactive development | 60/min, 1,000/day, free |
| **API key** | Pinning a model, scripting calls | Free tier + metered |
| **Vertex AI** | Enterprise GCP projects, audit logs | Billed through GCP |

API key setup:

```bash
# Generate at https://aistudio.google.com/app/apikey
export GEMINI_API_KEY="your-key"
# Persist it so you stop retyping
echo 'export GEMINI_API_KEY="your-key"' >> ~/.bashrc
```

**One security note**: an API key is ownership of your quota. Never commit it. Use a `.env` file with `.gitignore`, not hardcoded values.

## Core interactions: three to memorize

Inside `gemini`, the interaction model resembles Claude Code, with a few of its own conventions:

**`@` references a file** — feeds it into context without copy-paste:

```
> Look at the performance issues in @src/main.py
```

**`!` runs a shell command** — no need to exit the session:

```
> !ls -la
```

**Plain conversation** — it reads files, proposes changes, and shows a diff for confirmation before editing.

There is also built-in Google Search grounding: ask about an API that changed last week and it searches live instead of answering from stale training data. That alone removes a whole class of wrong answers.

## GEMINI.md: hierarchical context, finer-grained than CLAUDE.md

Gemini CLI stores project instructions in `GEMINI.md`, analogous to Claude Code's `CLAUDE.md`. Its loading mechanism is **hierarchical**:

| Location | Scope |
|---|---|
| `~/.gemini/GEMINI.md` | Global, applies to every project |
| Project root `GEMINI.md` | Applies to that project |
| Subdirectory `GEMINI.md` | Applies once you enter that subdirectory |

So general preferences ("comments in Chinese," "no `any` types") go in the global file, project stack and test commands go in the project file, and module-specific conventions go in the subdirectory file. Instructions get more specific the deeper you go.

A practical project-level GEMINI.md:

```markdown
# Project Context

## Stack
- Python 3.12 + FastAPI + PostgreSQL
- Package management with uv, not pip

## Common commands
- Tests: uv run pytest -q
- Lint: uv run ruff check .
- Migrations: uv run alembic upgrade head

## Conventions
- Never hand-edit migrations; always generate with alembic
- Every function needs type annotations
- Commit messages in Chinese
```

Have the AI draft the first version: inside `gemini`, say "read this project and generate a GEMINI.md for it" — it scans the code and fills in the structure, then you hand-edit.

## Two modes: the line for safe automation

This is Gemini CLI's most practical feature, and the one most people miss:

**Sandbox mode** — restricts file access to the project directory and blocks system-level commands. Use it on codebases you do not fully trust, or when you would rather it never touch `~/.ssh`.

**YOLO mode** — auto-accepts all file edits and runs shell commands without asking. Fully hands-off, good for batch jobs, but **only in scenarios you completely trust** — like asking the AI to add a header to 50 files.

They stack:

```bash
# Confined to the directory AND fully automatic
gemini --sandbox --yolo
```

For daily development: leave both off (confirm each step). Turn on sandbox for bulk refactors. Consider yolo only for unattended runs — and always on a clean git branch first.

## MCP: extending tool capability

Gemini CLI supports MCP, configured in `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}
```

Restart `gemini` and the tools appear. For the full MCP workflow and server list, see this site's [MCP ecosystem and practice](/en/article/mcp-ecosystem/).

## Real differences from Claude Code

The internet is full of "Gemini CLI vs Claude Code" posts that all conclude "it depends." Here is the specific version:

| Dimension | Gemini CLI | Claude Code |
|---|---|---|
| Entry cost | Google account, free | Claude subscription (~$20/mo) |
| Free quota | 1,000 requests/day | Usage window inside the subscription |
| Context | 1M tokens | 200K (long context priced separately) |
| Code quality (complex refactors) | Usable, occasional rework | Steadier, higher first-pass success |
| Search grounding | Built-in Google Search | None; training data only |
| Editor independence | Terminal-native | Terminal-native |

**How I actually use it**: both installed. Small edits, lookups, and reading unfamiliar codebases go to Gemini CLI — the free quota means I do not think about cost. Cross-file refactors and anything needing rigorous reasoning go to Claude Code.

The 1M context is a genuine advantage: hand it a mid-sized repo plus docs and it really does read all of it. Google Search grounding is unique too — ask about a library's breaking change from last month and it searches before answering instead of guessing.

## Tips for stretching the quota

1,000/day goes fast if you are careless:

1. **Split tasks.** "Analyze first, then change" costs roughly half of "refactor this whole module" — failed retries burn the most.
2. **Feed files precisely with `@`.** Do not say "look at that config file"; use `@config.yaml`.
3. **Write a good GEMINI.md.** Fewer repeated file reads to reconstruct context.
4. **Batch work via scripts, not interactive agents.** A direct API call is far cheaper than an agent loop.

## Summary

Gemini CLI is the most generous free option in 2026's terminal AI coding field: Google sign-in, 1,000 requests/day, 1M context, open source. It is not a full replacement for Claude Code — complex reasoning and refactor quality still lag — but as a **daily partner and second opinion**, the free quota has no equal.

Install it and start with a zero-risk task like "summarize this project's structure."

---

**Related reading**: for the other terminal agent, see [Claude Code walkthrough](/en/article/claude-code-tutorial/). For the full landscape, read [2026 free AI coding tools compared](/en/article/free-ai-coding-tools-2026/) and [ChatGPT vs Claude vs Gemini](/en/article/chatgpt-vs-claude-vs-gemini/). To extend agent capabilities, see [MCP ecosystem and practice](/en/article/mcp-ecosystem/).
