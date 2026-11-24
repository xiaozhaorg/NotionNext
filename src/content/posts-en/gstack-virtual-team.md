---
title: "gstack Reviewed: A Virtual Engineering Team for Claude Code"
pubDatetime: "2026-11-24T00:00:00.000Z"
description: "Garry Tan's open-source gstack has 142k stars and turns Claude Code into a 23-command team of CEO, architect, QA and security officer. Its own eval says it does not fix more bugs. Here is where the real value is, plus the Windows gotcha."
author: "Xiaozha"
tags: ["AI Coding", "Open Source", "Tutorial"]
draft: false
ogImage: "/images/gstack-virtual-team-en-real.webp"
coverAlt: "Multiple AI role icons forming a virtual engineering team"
zhSlug: "gstack-virtual-team"
---

Giving AI coding agents a "team" is the trend du jour, and [gstack](https://github.com/garrytan/gstack) is the project driving it.

Its author is Garry Tan, president and CEO of Y Combinator. He open-sourced the Claude Code workflow he uses daily — **23 slash commands, all Markdown, MIT licensed, free** — now at **142k stars**.

But let's start with cold water, poured by the project itself:

> In a November 2026 test on 100 everyday GitHub bugs and features, Claude Opus 5.5 fixed 58 with gstack installed and 61 of 99 without it. gstack gave no gain.

So this article will not claim it makes your AI smarter. It does not solve that. It solves something else.

## What it actually solves

One developer has to make product calls, design architecture, review code, run QA, audit security, and ship — roles that conflict, and that one person cannot all excel at simultaneously. An AI agent is no different: ask one prompt to be product manager and QA at once and you usually get neither.

gstack **splits those roles into separate skills and makes each step consume the previous step's output**:

```
Think → Plan → Build → Review → Test → Ship → Reflect
```

The design doc from `/office-hours` is read by `/plan-ceo-review`. The test plan from `/plan-eng-review` is picked up by `/qa`. Findings from `/review` are checked as resolved by `/ship` before the PR.

That is a *process*, not a bag of tools. Individual commands have limited value; chained together is where it earns its keep.

## Install (about 30 seconds)

You need Claude Code, Git, and Bun v1.4.2+. Windows also needs Node.js.

Paste this into Claude Code and let it do the rest:

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

Then add this to `CLAUDE.md` — no skill list needed, Claude Code discovers them:

```markdown
## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
```

Team mode is recommended — automatic updates, no version drift:

```bash
(cd ~/.claude/skills/gstack && ./setup --team) && ~/.claude/skills/gstack/bin/gstack-team-init required && git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

Swap `required` for `optional` if you would rather nudge teammates than block them.

## Four commands to start

The official advice is **stop here** and see if it fits you before installing everything.

**1. `/office-hours`** — start here. It asks six forcing questions and challenges your framing instead of accepting your feature request at face value.

The example in the official docs makes the point: you say you want a "daily briefing app for my calendar." After hearing your pain, it says you are actually building a "personal chief of staff AI" — then extracts five capabilities you did not realize you had described, challenges four premises, and offers three implementation approaches.

The design doc automatically feeds every downstream skill.

**2. `/review`** — run it on any branch with changes. It looks for bugs that **pass CI but blow up in production**: race conditions, N+1 queries, broken trust boundaries. It auto-fixes the obvious ones and asks you about the rest.

One mechanism I particularly like: every weakened test, timeout, snapshot, or suppression is escalated **to a named human**. Nothing slips through silently.

**3. `/qa`** — give it a staging URL, or an isolated local API, CLI, job, or webhook. It opens a real browser, reproduces bugs, writes failing regressions, fixes the cause, re-verifies, and commits.

**4. `/ship`** — syncs main, runs tests, audits coverage and gate integrity, then verifies, pushes, and opens a PR whose body opens with three plain lines stating exactly what was tested and reviewed.

For a full sprint, add `/autoplan` (CEO → design → DX → engineering review) and `/ship`.

## More than Claude Code

`./setup` installs for Claude Code only by default, but it supports many agents:

- `--host codex`: OpenAI Codex CLI (experimental)
- `--host opencode`, `cursor`, `copilot`, `gemini`: the corresponding CLIs
- `--host auto`: detect and install for every supported agent on this machine

Safety tiers differ: Claude Code is **full** (certified by a real workflow run, hooks enforce blocks), while most others are **experimental** (safety rules advisory, not enforced). Switching agents does not give you equivalent protection — worth knowing.

## Windows users, read this

Important, since a large share of Chinese readers are on Windows:

**With Windows 11 Smart App Control enabled, gstack's compiled binaries are refused** — Git Bash shows `Permission denied`. The binaries are built locally and unsigned (official issue #2595).

Two workarounds: run it inside WSL, or turn Smart App Control off.

Windows also needs Node.js alongside Bun — Bun has a known Playwright pipe-transport bug on Windows. The native `/cso` security audit additionally needs PowerShell 7 and the VS2022 C++ desktop workload; setup finishes cleanly and tells you explicitly which skill is unavailable.

macOS and Linux get full support.

## How to position it

Back to that eval result.

**If gstack does not increase the bug-fix hit rate, what is it worth?**

The workflow, the reviews, the shipping steps, and the safety guards. Concretely:

- `/review` finds the production-grade issues tests miss
- `/ship` records exactly what was verified in the PR, auditably
- `/careful` intercepts `rm -rf`, `DROP TABLE`, and force-pushes; root/home recursive deletes and default-branch force-pushes are **hard-denied**
- `/freeze` restricts edits to one directory so debugging cannot spill into unrelated files

It is for people **already doing serious engineering** — not to make AI write more code, but to make the code it writes reviewable, traceable, and safely shippable.

If you only occasionally ask AI for a small tool, this ceremony is overkill. If you maintain something that goes to production, `/review` + `/qa` + `/ship` are worth trying on their own.

Telemetry is off by default; the update check is on but can be disabled; outside reviews are on by default (code goes to Codex or Claude Code under your own login) and can be turned off. Every off-machine send writes an auditable receipt.

---

**References**

- [garrytan/gstack — official repository](https://github.com/garrytan/gstack)
- [Official eval results and correction](https://github.com/garrytan/gstack-evals)
- [Installation and platform notes](https://github.com/garrytan/gstack/blob/main/docs/install.md)
