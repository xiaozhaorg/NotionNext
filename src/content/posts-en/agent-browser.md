---
title: "agent-browser Reviewed: Give AI a Browser It Can Actually Drive (and 4 Gotchas)"
pubDatetime: "2026-11-25T00:00:00.000Z"
description: "Vercel's agent-browser has 53k stars and a neat snapshot + @e1 ref loop. But Chinese tutorials all skip the same facts: refs are Chrome-only, they break on navigation, and blocked clicks really fail. Official commands and the honest boundary."
author: "Xiaozha"
tags: ["AI Coding", "Open Source", "Tool"]
draft: false
ogImage: "/images/agent-browser-en-real.webp"
coverAlt: "Shell commands driving a browser, page elements tagged with @e1 refs"
zhSlug: "agent-browser"
---

The usual way to make an AI use a web page is crude: dump the entire HTML into context, then have it write a CSS selector and click.

An ordinary page is tens of thousands of lines of DOM. Feed all of it in and your token budget explodes. The selector it finally writes — `.RepoList-item .f3 a` — breaks the next time the site ships a redesign.

[agent-browser](https://github.com/vercel-labs/agent-browser) is Vercel Labs' answer: **don't read the DOM, read a snapshot; don't write selectors, use numbered refs.** It sits at **53.7k stars** today, a native Rust CLI under Apache-2.0.

The idea is simple and the result is elegant. But almost every tutorial repeats the same four-step workflow and skips the limitations that actually decide whether this works for you. This one fills the gaps.

## The core loop: snapshot → act on a ref → snapshot again

```bash
agent-browser open example.com
agent-browser snapshot -i       # interactive elements only, each with a ref
agent-browser click @e1         # act on a ref from that snapshot
agent-browser get url           # check the result
agent-browser close
```

`snapshot` returns not the DOM but a compact accessibility tree:

```text
- link "Learn more" [ref=e1]
```

The agent sees "there's a link called Learn more, it's e1" — close to what a human sees. It clicks `@e1`, takes another snapshot to confirm, and repeats.

**The browser stays open between commands.** A background daemon controls it over the Chrome DevTools Protocol, so each step is one short shell call. That is what makes step-by-step driving possible at all.

## Install

```bash
npm install -g agent-browser
agent-browser install           # download Chrome for Testing, first time only
```

Also `brew install agent-browser` (still run `agent-browser install` once), `agent-browser install --with-deps` on Linux for system libraries, or no install at all with `npx agent-browser open example.com`.

Native binaries ship for macOS (ARM64, x64), Linux (ARM64, x64, glibc and musl), and Windows (x64); the npm package picks the right one.

## Refs aren't the only way

`-i` gives you numbered refs, but CSS selectors, text, XPath, and semantic locators all work too — for example, by role:

```bash
agent-browser find role button click --name "Submit"
```

Take a fresh snapshot before reusing a ref: it describes the page **at snapshot time**. After navigation or a DOM change, old refs aren't reliable.

## Four gotchas nobody mentions

**1. Ref snapshots are Chrome-only.** The official changelog is explicit — when adding the Ladybird engine it says "Snapshots and refs stay Chrome-only, as with Safari." Switch to Safari or Ladybird and the numbered-ref system, the headline feature, is gone; you're back to selectors. Tutorials present refs as a universal capability. They aren't.

**2. Refs go stale on navigation.** Older versions would take a stale ref after a full page load or iframe navigation and click whatever happened to be there — silently doing the wrong thing. Version 0.44.0 changed this to a "no longer loaded" error that forces a fresh snapshot. Old scripts copied from blog posts can click the wrong element for no obvious reason.

**3. Blocked clicks genuinely fail.** If the target is hidden, disabled, outside the viewport, or covered by a consent banner, `click` fails rather than reporting success. That's the right behavior, but it means your agent must handle the failure: dismiss the overlay, take a new snapshot, retry. Fire-and-forget scripts will break often.

**4. The daemon exits after an hour idle.** With no commands, the headless browser closes and the daemon exits (session persistence saves state first). Long-gap tasks need to wake it or manage sessions explicitly. Each `--session` gets its own daemon and browser.

## Built for agents, not just humans

It ships skills that match the installed CLI version — a neat trick: the installed skill is a thin stub that loads `skills get core` at runtime, so instructions can never drift from the binary.

```bash
agent-browser skills get core                 # core loop, refs, waiting, common workflows
agent-browser skills get core --ref commands  # one reference, e.g. the full command list
agent-browser skills get core --full          # adds full command reference and templates
agent-browser skills list                     # specialized skills: electron, slack, dogfood
```

Install the discovery skill into an agent harness:

```bash
npx skills add vercel-labs/agent-browser
```

Or drop this into `AGENTS.md`:

```markdown
Use `agent-browser` for browser automation. Before the first use, run
`agent-browser skills get core` and follow it.
```

MCP clients can start a stdio MCP server with `agent-browser mcp`. There's also `batch`, `record`, `diff`, `trace` / `profiler` / `vitals`, plus agent-facing commands like `webmcp`, `flow`, and `chat` — `agent-browser --help` lists nine groups.

Engines go beyond Chrome for Testing: `--cdp` or `--auto-connect` attaches to a running Chrome, `--engine` selects Lightpanda or Obscura, Mobile Safari runs in the iOS Simulator, and cloud providers include Browserbase, Browserless, Browser Use, Kernel, and AgentCore. The trade-off: with alternate engines and cloud providers, the ref snapshot above may not be available.

## About that "93% fewer tokens" claim

Chinese tutorials nearly all say "official data shows about 93% less context consumption." I checked the official README and docs home page — **that number appears nowhere.**

It's probably an estimate or a retelling of the underlying idea: read an interactive-elements snapshot instead of the whole DOM. Fine as a sense of scale. Don't treat it as a vendor guarantee — measure it on your own pages.

## When not to use it

**Fixed-flow scraping and regression tests: use Playwright.** agent-browser was never meant to replace Puppeteer/Playwright. It's a low-context interface for agents that must decide what to click next. If the flow is fixed and you'll run it thousands of times, a Playwright script is faster and more deterministic.

**If you need ref snapshots but don't want to be tied to Chrome, run `agent-browser doctor` first.** Multi-engine support looks impressive, but snapshots and refs only work on Chrome. Check that your flow doesn't depend on them before switching.

**Pure extraction, no clicking.** If you just want the article text, a lightweight HTML parser plus a readability extractor is far cheaper than starting a browser.

## Bottom line

agent-browser solves "how does an AI see a page and click things": it compresses tens of thousands of DOM lines into a short numbered snapshot and lets the agent advance one shell command at a time.

It works — but it isn't magic. Refs are Chrome-only, they break on navigation, blocked clicks fail, and the daemon times out. Building those four facts into your error handling is worth more than memorizing the four-step workflow one more time.

---

**References**

- [vercel-labs/agent-browser on GitHub](https://github.com/vercel-labs/agent-browser)
- [Official docs at agent-browser.dev](https://agent-browser.dev)
- [Official CHANGELOG](https://github.com/vercel-labs/agent-browser/blob/main/CHANGELOG.md)
- [Juejin: agent-browser lets AI browse like a human](https://juejin.cn/post/7594662879201460250)
