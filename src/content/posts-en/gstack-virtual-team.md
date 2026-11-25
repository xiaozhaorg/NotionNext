---
title: "Give Claude Code a few extra hands: gstack from install to use"
pubDatetime: "2026-11-24T00:00:00.000Z"
description: "Your AI writes a feature, every test passes, then it breaks in production — because it reviewed its own work. gstack is a workflow for Claude Code that splits design, review, testing, and shipping into 23 commands done one step at a time. Starting with a real mess, this walks you through the install, the four commands to try first, and the gotchas on Windows."
author: "Xiaozha"
tags: ["AI Coding", "Open Source", "Tutorial"]
draft: false
ogImage: "/images/gstack-virtual-team-en-real.webp"
coverAlt: "Multiple AI role icons forming a virtual engineering team"
zhSlug: "gstack-virtual-team"
---

Have you ever had AI write you a feature that looked fine — then it broke the moment it hit production, even though every test passed green? You ask it to review its own code, and it sings its own praises.

[gstack](https://github.com/garrytan/gstack) is built for exactly that mess. Its author is a founder who open-sourced the Claude Code workflow he uses every day: 23 slash commands, all Markdown, MIT licensed, free. In plain terms, it gives AI a small team with clearly split jobs.

One thing worth saying up front: it won't make you fix more bugs. The project ran its own test — in November 2026, on 100 common GitHub bugs and features, Claude Opus 5.5 fixed 58 with gstack installed and 61 without it, basically no difference. So it doesn't solve "make the AI smarter." It solves something else.

It's a bit like running a race: you wouldn't let one person be both referee and runner — they want to win and also have to judge their own fouls, so nobody trusts the result. Same with code: ask one prompt to be product manager and QA at once, and you usually get neither. gstack splits the roles and feeds each step's output into the next:

```
Think → Plan → Build → Review → Test → Ship → Reflect
```

The design doc from `/office-hours` is read by `/plan-ceo-review`. The test plan from `/plan-eng-review` is picked up by `/qa`. Findings from `/review` are checked as resolved by `/ship` before the PR. Individual commands have limited value; chained together is where it earns its keep.

## Install it, then try four commands

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

The official advice is to start with four commands and stop there — see if it fits you before installing everything.

**1. `/office-hours`** — start here. It asks six forcing questions and challenges your framing instead of accepting your feature request at face value. The example in the official docs makes the point: you say you want a "daily briefing app for my calendar," and after hearing your pain it says you're actually building a "personal chief of staff AI" — then pulls out five capabilities you didn't realize you'd described, challenges four premises, and offers three implementation approaches. The design doc automatically feeds every downstream skill.

**2. `/review`** — run it on any branch with changes. It looks for bugs that pass CI but blow up in production: race conditions, N+1 queries, broken trust boundaries. It auto-fixes the obvious ones and asks you about the rest. One mechanism I particularly like: every weakened test, timeout, snapshot, or suppression is escalated to a named human. Nothing slips through silently.

**3. `/qa`** — give it a staging URL, or an isolated local API, CLI, job, or webhook. It opens a real browser, reproduces bugs, writes failing regressions, fixes the cause, re-verifies, and commits.

**4. `/ship`** — syncs main, runs tests, audits coverage and gate integrity, then verifies, pushes, and opens a PR whose body opens with three plain lines stating exactly what was tested and reviewed.

For a full sprint, add `/autoplan` (CEO → design → DX → engineering review) and `/ship`.

`./setup` installs for Claude Code only by default, but it supports plenty more agents: `--host codex` is OpenAI Codex CLI (experimental); `--host opencode`, `cursor`, `copilot`, `gemini` map to those CLIs; `--host auto` detects and installs for every agent it can find on your machine.

## Where it actually saves you grief

What saves you isn't "more code" — it's "safer shipping." Concretely:

- `/review` finds the production-grade issues tests miss
- `/ship` records exactly what was verified in the PR, so it can be traced back
- `/careful` intercepts `rm -rf`, `DROP TABLE`, and force-pushes; root/home recursive deletes and default-branch force-pushes are hard-denied
- `/freeze` restricts edits to one directory so debugging can't spill into unrelated files

A few defaults you can rely on: telemetry is off by default; the update check is on but can be disabled; outside reviews are on by default (code goes to Codex or Claude Code under your own login) and can be turned off too. Every off-machine send writes an auditable receipt.

## A few things you'll run into

**Switching agents doesn't mean equal protection.** The safety tiers differ: Claude Code is full (certified by a real workflow run, hooks enforce blocks), while most others are experimental (safety rules advisory, not enforced). Worth knowing.

**Windows users, pay extra attention.** With Windows 11 Smart App Control on, gstack's compiled binaries are refused — Git Bash shows `Permission denied` — because the binaries are built locally and unsigned (official issue #2595). Either run it inside WSL or turn Smart App Control off. Windows also needs Node.js alongside Bun — Bun has a known Playwright pipe-transport bug there. The native `/cso` security audit additionally needs PowerShell 7 and the VS2022 C++ desktop workload; setup finishes cleanly and tells you explicitly which skill is unavailable. macOS and Linux get full support.

## When not to use it

If you only occasionally ask AI for a small tool, this ceremony is overkill — no need for it. If you maintain something that goes to production, `/review` + `/qa` + `/ship` are worth trying on their own, without installing the whole thing.

## Bottom line

It won't help you fix more bugs, but it makes the code you write easier to review, trace, and ship safely. A bit slower, a bit steadier — whether that trade is worth it depends on how much what you maintain matters.

---

**References**

- [garrytan/gstack — official repository](https://github.com/garrytan/gstack)
- [Official eval results and correction](https://github.com/garrytan/gstack-evals)
- [Installation and platform notes](https://github.com/garrytan/gstack/blob/main/docs/install.md)
