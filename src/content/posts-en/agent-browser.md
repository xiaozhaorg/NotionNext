---
title: "Letting AI Learn to Click Web Pages Itself: agent-browser, From Install to Use"
pubDatetime: "2026-11-25T00:00:00.000Z"
description: "Ever ask AI to do something online for you, only to find it can't read the page? agent-browser compresses tens of thousands of lines of web code into a single 'what you can click right now' list, and the AI just clicks by number. Starting from a real task, this walks you through how to install it, how to run it, and the four things you're bound to run into once you actually start."
author: "Xiaozha"
tags: ["AI Coding", "Open Source", "Tool"]
draft: false
ogImage: "/images/agent-browser-en-real.webp"
coverAlt: "Shell commands driving a browser, page elements tagged with @e1 refs"
zhSlug: "agent-browser"
---

Have you ever asked AI to handle something online for you — check an order status that's buried three clicks deep, or find the real button in a pile of pop-ups and "Accept Cookies" banners?

Most of the time it gets stuck at step one: it knows words, but can't "see" a web page. Tell it to click "Submit" and it has no idea where that button is hiding.

The old approach was to dump the whole page source into it at once. An ordinary page is tens of thousands of lines — expensive and messy. And even when it finally writes a precise selector like `.RepoList-item .f3 a`, the next site redesign breaks it completely.

[agent-browser](https://github.com/vercel-labs/agent-browser) takes a different approach. It's a lot like showing a new colleague the ropes:

You wouldn't print out the whole site source for them. You'd say — "I've listed everything you can click on this page, five things in total. Number one is Log in, number two is Search. Just tell me the number of the one you want."

That's exactly what it does: **it doesn't read the source, it reads a list of "what you can click right now"; it doesn't write fancy selectors, it works by number.**

## Start by just running it

Two commands to install it:

```bash
npm install -g agent-browser
agent-browser install
```

The second command is only needed the first time — it downloads a dedicated Chrome. (On macOS you can also use `brew install`; on Linux, adding `--with-deps` installs the missing system libraries too; if you just want to try it out, run `npx agent-browser open example.com` and you don't have to install anything.)

Then you can give it instructions one at a time, like you would to a person:

```bash
agent-browser open example.com
agent-browser snapshot -i       # 列出这页上所有能点的东西，每个带一个编号
agent-browser click @e1         # 点清单里的第 1 个
agent-browser get url           # 看看点完到哪了
agent-browser close
```

Here's what `snapshot -i` gives back:

```text
- link "Learn more" [ref=e1]
```

In plain terms: "There's a link on this page that says Learn more, and it's number e1."

The AI gets it, clicks `@e1`, takes a fresh list to see what changed, then clicks the next one. The browser stays open the whole time — a background process drives it for you, so it doesn't relaunch on every command.

That's the whole core. Everything else is detail.

## You don't have to teach it how to use the tool every time

Here's the part that really saves you trouble: let it fetch its own instruction manual.

```bash
agent-browser skills get core
```

This command spits out a usage guide that matches the version you have installed exactly — how to take a list, how to wait for things, how common flows go. Hand it to your AI framework and it knows how to use the tool:

```bash
npx skills add vercel-labs/agent-browser
```

Or put this in `AGENTS.md`:

```markdown
Use `agent-browser` for browser automation. Before the first use, run
`agent-browser skills get core` and follow it.
```

No need to copy out a huge prompt by hand, and no need to worry about the manual not matching the tool version — it fetches it at runtime, so it's always the right one.

## Once you actually start using it, you'll run into these four things

Most online tutorials skip this part, but these are what decide whether it works smoothly for you.

**1. The numbered refs only work with Chrome.**

Switch to Safari or another engine and the list and numbers stop working — you fall back to the old way (CSS selectors). This is a stated fact in the official changelog, not a bug: for now it only works with the Chrome family.

**2. The moment the page changes, the numbers you're holding are dead.**

The numbers match the page at the moment you took the list. After a click takes you to a new page, you're still holding the old numbers, but they may no longer point at the same things. Older versions would silently click the wrong thing; since 0.44 it throws an error and tells you to take a fresh list. If you copy a really old script off the internet, it'll click the wrong place for no obvious reason.

**3. If a button is covered, it really can't click it.**

A Cookie banner covering the page, a button off-screen, or one that's simply grayed out — `click` fails honestly instead of pretending it worked. That's a good thing. But it means your AI has to handle failure: close the overlay, take a new list, click again. A script that assumes "one click and done" will break all the time.

**4. The browser closes itself if it sits idle too long.**

An hour with no commands and the background process quits, taking the browser with it. If your tasks are far apart, wake it up yourself or use `--session` to save state.

Putting these four things into your error handling up front is more useful than memorizing the step-by-step flow ten times.

## One more thing about a number

You've probably seen the claim that it "saves 93% of tokens" — nearly every Chinese article says it. I went through the official README and docs and couldn't find where that number comes from.

It's probably a rough sense of scale inferred from "read only a list of clickable things, not the whole page source." Fine as a gut feeling, but don't treat it as an official promise — the number you measure on your own pages is the one you can actually use.

## When not to use it

- **Fixed-flow scraping or regression tests you'll run thousands of times**: use Playwright. This tool is for tasks where you need to decide what to click next, not for replacing a hardcoded script.
- **You just want the page text and won't click anything**: parse the page directly. Starting a browser is overkill.
- **You want the numbered refs but also want to switch browser engines**: run `agent-browser doctor` first so you don't waste your time.

## Bottom line

It solves one thing: helping AI understand "what can be clicked on this page right now," then move forward step by step using the numbers.

It's useful, but it isn't magic. Refs tied to Chrome, dead on page change, blocked clicks fail, idle browser closes — build those four into your plan up front and it'll be solid.

---

**References**

- [agent-browser official repo](https://github.com/vercel-labs/agent-browser)
- [Official docs](https://agent-browser.dev)
- [Official changelog](https://github.com/vercel-labs/agent-browser/blob/main/CHANGELOG.md)
