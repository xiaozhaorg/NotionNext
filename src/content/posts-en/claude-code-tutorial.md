---
title: "Claude Code 2026 Practical Guide: How to Use Anthropic's Terminal-Native AI Coding Agent (China Edition)"
pubDatetime: "2026-07-30T06:18:32.994Z"
description: "Claude Code is Anthropic's terminal-native AI coding agent. From installation and configuration to real-world commands, this guide shows Chinese developers how to use it without barriers via CC Switch, Alibaba Cloud Bailian, QuickRouter, and other solutions — including 5 real-world scenarios."
author: "Xiaozha"
tags: ["AI", "Claude", "Tutorial", "AI Coding", "Development Tools", "ccswitch"]
featured: false
draft: false
ogImage: "/images/claude-code-tutorial-real.jpg"
coverAlt: "Close-up of a developer's hands typing code on a laptop keyboard"
zhSlug: "claude-code-tutorial"
---

⚡

This guide was written specifically for developers in mainland China.

Beyond the usual installation and usage walkthrough, it focuses on how to use Claude Code smoothly — no circumvention tools, no overseas accounts — through solutions like CC Switch, Alibaba Cloud Bailian, and QuickRouter.

In 2026, AI coding tools have evolved from "autocomplete" to "autonomous execution."

Beyond GUI tools like Cursor and Trae IDE, Anthropic's Claude Code has gone a completely different route:

It abandons the graphical interface, returns to the terminal, and reshapes the paradigm of human-AI pair programming through the command line.

But does it work in China?

How do you use it?

This article gives you the complete answer.

## 1. What Is Claude Code?

Claude Code is Anthropic's official command-line AI coding agent.

Unlike VS Code extensions or web chat interfaces, it runs directly in your terminal and works around your local project directory.

Core features:

- **Terminal-native** — no GUI; you talk to it in natural language right in the terminal.
- **Project-level understanding** — it can read the entire project structure and understand cross-file dependencies.
- **Autonomous execution** — it can break down tasks on its own, read and write files, run commands, run tests, and fix bugs.
- **Million-token context** — it can handle projects with 500K+ lines.
- **Not tied to a single model** — you can plug in Claude, GPT, DeepSeek, Qwen, and more.

> In one sentence: Claude Code is not an IDE plugin — it's an "AI engineer" that does real work on its own.

You describe the goal, and it autonomously completes the whole flow of reading code, modifying files, and running tests.

## 2. Claude Code vs Cursor vs Cline: How to Choose

In 2026, AI coding tools form a three-way standoff, and each represents a fundamentally different philosophy:

| Dimension | Claude Code | Cursor | Cline |
| --- | --- | --- | --- |
| Positioning | Terminal-native agent | AI-native IDE | VS Code extension |
| Interaction | Command line | GUI | Inside VS Code |
| Autonomous execution | ⭐⭐⭐⭐⭐ Top-tier | ⭐⭐⭐ Moderate | ⭐⭐⭐⭐ Strong (requires approval) |
| Open source | No | No | Yes (MIT) |
| Cost | Pro from $20/month | Pro $20/month | Free + API costs |

Recommendations:

- If you chase maximum efficiency and are comfortable in the terminal, choose **Claude Code**.
- If you do everyday coding and prefer a GUI, choose **Cursor**.
- If you're budget-sensitive and need your data to stay onshore, choose **Cline** (it supports local deployment).

## 3. Installing Claude Code (China Mirror Acceleration)

Claude Code requires a Node.js 18+ runtime.

Windows users are also recommended to install Git for Windows.

### 3.1 Install Node.js

Windows users can install Node.js in one command with winget, macOS users can use Homebrew, and then verify that the installation succeeded.

### 3.2 Install Claude Code (China Mirror)

> ⚠️ Users in mainland China must use a mirror source, otherwise the download will time out.

This is the first step — and the most commonly skipped one. Verify the installation afterward.

## 4. Using Claude Code in China (Key Section) 🎯

Claude Code calls the official Anthropic API by default, and a direct connection from mainland China will fail.

Here are three mainstream solutions, ordered by how strongly we recommend them.

### Solution 1: CC Switch — Visual Management (⭐⭐⭐⭐⭐ Recommended)

CC Switch is an open-source desktop tool built specifically to manage API configuration across multiple AI coding tools.

It supports unified management of Claude Code, Codex, Gemini CLI, OpenCode, and many others.

Key advantages:

- Graphical interface — usable even with zero command-line experience.
- Built-in presets for 50+ providers (DeepSeek, Qwen, Kimi, Zhipu GLM, MiniMax, etc.).
- One-click provider switching — no need to hand-edit JSON config.
- Built-in local API proxy with automatic failover.
- Usage statistics — see token consumption and cost in real time.
- WebDAV auto-sync — share config across devices.

Installation steps:

- Visit the GitHub Releases page: https://github.com/farion1231/cc-switch
- Download the package for your system: Windows users grab the .msi or portable ZIP; macOS users install via Homebrew; Linux users pick the .deb/.rpm/.AppImage.
- macOS users can also use a one-liner:
  `brew tap farion1231/ccswitch && brew install --cask cc-switch`

Taking DeepSeek as an example:

- Register an account on the DeepSeek open platform and create an API Key (it starts with `sk-`; note that it's only shown once).
- Open CC Switch and select Claude in the top app bar.
- Click "Add Provider" and pick DeepSeek from the preset list.
- Paste your API Key; leave the other fields at their defaults (DeepSeek-V4-Pro and Flash are already configured).
- If you need million-token long context, you can enable 1M mode.
- Click "Add" — CC Switch automatically updates Claude Code's config file.

CC Switch config example (DeepSeek):

### Solution 2: Alibaba Cloud Bailian Token Plan (⭐⭐⭐⭐ First Choice for Teams/Enterprises)

The Alibaba Cloud Bailian platform provides an Anthropic protocol-compatible interface that supports flagship models such as Qwen3.6-plus and Qwen3.7-max, with two billing modes — a fixed Coding Plan subscription and a team Token Plan — making it well suited to team-scale usage.

Setup steps:

- Subscribe to the Alibaba Cloud Bailian Token Plan (team edition).
- Get your dedicated API Key.
- Edit the `~/.claude/settings.json` config file.

Config file example:

> ⚠️ You must map every model slot (Haiku/Sonnet/Opus) to a domestic model, otherwise Claude Code will try to call Anthropic's official models and the request will fail.

### Solution 3: Direct Connection via Environment Variables (⭐⭐⭐ Simple)

If you'd rather not install extra tools, you can simply set environment variables.

It's perfect for "let's just get it running and see" situations.

- Windows PowerShell (temporary).
- Windows (permanent).
- macOS/Linux.

### Solution Comparison and Recommendations

| Solution | Difficulty | Cost | Best for |
| --- | --- | --- | --- |
| CC Switch | Low | Pay per API usage | Individual developers; people who want to try multiple models |
| Alibaba Cloud Bailian | Medium | Subscription / team token plan | Teams and enterprises that need stable SLAs |
| Environment variables | Low | Pay per API usage | Quick verification; no extra tools wanted |

## 5. CLAUDE.md: Your Project's "Memory File"

CLAUDE.md is Claude Code's project-level config file, used to define the collaboration rules between you and the AI.

It comes in two flavors:

- **Global**: `~/.claude/CLAUDE.md` — applies to all projects.
- **Project-level**: a `CLAUDE.md` in the project root — applies only to the current project.

Recommended template:

> 💡 CLAUDE.md is the file beginners overlook the most.
> Write it on day one and you'll save yourself endless trouble later — the AI will automatically follow your rules, no need to remind it every time.

## 6. Five Real-World Scenarios

### Scenario 1: Quickly Understanding a New Project

When taking over an unfamiliar project, use Claude Code to map out the architecture first:

Claude Code scans the entire project, generates a CLAUDE.md file, and outputs a module dependency graph.

### Scenario 2: Intelligent Code Refactoring

Refactor a messy chunk of code:

### Scenario 3: Cross-File Batch Edits

Migrate all API calls from `fetch` to `axios`:

Claude Code produces the changes for every file at once, shows the diff grouped by file, and applies them all in one click after you confirm.

### Scenario 4: Bug Hunting and Fixing

Claude Code autonomously runs tests, reads logs, pinpoints the problem, modifies the code, and reruns the tests to verify — a complete closed loop.

### Scenario 5: Automated Test Generation

## 7. Handy Slash Commands Quick Reference

Claude Code ships with a large number of slash commands that start with `/`. Mastering these can dramatically improve your efficiency:

| Command | What it does |
| --- | --- |
| `/clear` | Clear the current conversation and start a new session |
| `/compact` | Compress the historical context, keeping key information |
| `/init` | Generate a project CLAUDE.md file |
| `/plan` | Enter planning mode — plan first, then execute |
| `/context` | Check current context usage |
| `/branch` | Fork the current conversation as a branch |
| `/fork` | Start a sub-agent in the background for auxiliary tasks |
| `/status` | View model, Base URL, and API Key configuration |
| `/memory` | Edit the project memory file |

## 8. Advanced Tips and Pitfalls to Avoid

### 8.1 Enabling Web Search in China

Claude Code's built-in `web_search` tool is often restricted in mainland China.

The recommended alternative is to install the Fetch MCP server:

Fetch MCP advantages:
- Not subject to Anthropic's policy restrictions
- Automatic HTML → Markdown conversion
- Proxy support
- Built-in 15-minute cache

### 8.2 Avoid Context Pollution

> ⚠️ Never launch Claude Code from your computer's root directory (e.g., `C:\`)!

Otherwise it will scan your entire disk — slow, and potentially destructive.

The right way: create a separate folder for each project, `cd` into it, and then launch `claude`.

### 8.3 VS Code Integration

Claude Code offers an official VS Code extension — search for it in the extensions marketplace and install it.

Combined with the "Enable Claude Code plugin" option in CC Switch, you can invoke it directly from inside VS Code.

### 8.4 Cost Control Tips

- Use `/compact` to compress context and reduce token consumption.
- Use DeepSeek/Qwen for everyday tasks, and switch to Claude Opus only for complex ones.
- Set usage-threshold alerts in CC Switch to avoid bill shock.
- For long-running tasks, use `--dangerously-skip-permissions` to cut down on interaction (only in a trusted sandbox environment).

## 9. Conclusion: Should You Switch to Claude Code?

Claude Code isn't a replacement for your IDE — it's a complement to it.

Its real value lies in "agent mode": you describe the goal, and it completes the entire flow on its own.

Scenarios where switching makes sense:

- You need large-scale cross-file refactoring.
- You're taking over an unfamiliar project and want to understand its architecture quickly.
- You work in DevOps/CI-CD scenarios that require GUI-less operation on the server side.
- You chase maximum efficiency and are willing to learn a terminal workflow.

Scenarios where switching doesn't make sense:

- You don't know the command line at all and have no interest in learning.
- You only write small scripts or fix small bugs (Cursor is handier).
- Your project depends heavily on the IDE's visual debugging.

> Models will be replaced, but a good agent framework is more durable infrastructure.

Claude Code is the one most worth mastering in 2026.

🌟

The CC Switch project referenced in this article:

https://github.com/farion1231/cc-switch — completely open source and free; give the author a Star to support this domestic open-source project.

Next up, I'll write *Cline in Practice: The Open-Source Free Version of Claude Code* — focusing on local deployment and data-stays-onshore solutions. Stay tuned.
