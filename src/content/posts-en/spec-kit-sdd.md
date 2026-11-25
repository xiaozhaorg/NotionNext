---
title: "Get clear on what you want before AI writes code: Spec Kit from install to use"
pubDatetime: "2026-11-24T00:00:00.000Z"
description: "You describe a feature, the AI writes a pile of code, and it goes off track at step two. Spec Kit has you write the spec down first, so the AI builds against it and you can check the result for drift. This walks you through install, one full run, and when the whole ritual isn't worth it."
author: "Xiaozha"
tags: ["AI Coding", "Open Source", "Tutorial"]
draft: false
ogImage: "/images/spec-kit-sdd-en-real.webp"
coverAlt: "A terminal showing a specification document beside the generated code"
zhSlug: "spec-kit-sdd"
---

You've probably had this happen: you describe a feature, the AI dutifully writes three thousand lines, and it went off the rails at step two. You rewrite the prompt, try again, and drift again. Before you know it, the afternoon is gone and all you've done is wonder why it keeps getting you wrong.

In plain terms: ambiguous requirements in, faithfully wrong code out. The problem usually isn't that the AI can't write code — it's that it doesn't know what you actually want.

[Spec Kit](https://github.com/github/spec-kit) is built for exactly that: before a single line of code, you and the AI write down, in black and white, what you're building and what "done" looks like.

It's a lot like renovating a house. You don't tell the crew "make it look nice" and walk away — you hand them a drawing first: how many rooms, where the outlets go, which materials, and how you'll sign off on the job. They work from the drawing, you check against the drawing. If you change your mind, you change the drawing, not knock down a wall after it's built. Spec Kit does that for AI: it gives it a drawing to work from. That drawing is called a spec.

It handles three jobs, and the three entry points are independent — you don't have to run them in order:

| What you need | Entry point | Outcome |
| --- | --- | --- |
| Build a feature from scratch | Spec-Driven Development | A spec carried through planning, implementation, and convergence |
| Diagnose and repair broken behavior | Bug fixing (extension) | An assessed cause, a scoped fix, and recorded verification |
| Decide if an idea deserves investment | Idea assessment (extension) | An evidence-backed go, clarify, or stop decision |

The last two are extensions you install on demand — you do not have to run SDD first. That design only landed after v1.4, which is why older tutorials rarely mention it.

## Get started

You need Python 3.11+ and [uv](https://docs.astral.sh/uv/), on Linux, macOS, or Windows.

```bash
uv tool install specify-cli
specify init my-project --integration copilot
cd my-project
```

`--integration` tells it which coding agent you use. It isn't picky — GitHub Copilot, Claude Code, Codex, Cursor, Gemini CLI, OpenCode and 20+ others work, with no subscription lock-in.

For an **existing project**, run `specify init .` inside it instead of creating a new one.

## Run the core flow once

Set up a constitution once per project, then repeat the rest for each feature.

**These slash commands run in your agent's chat, not your terminal.** The examples use GitHub Copilot's syntax; see the [integration docs](https://github.github.io/spec-kit/integrations/cli.html#command-invocation) for other agents.

```text
/speckit-constitution Create principles focused on code quality, testing, and maintainability.
/speckit-specify Build a photo organizer with albums grouped by date and a tile preview of each album.
/speckit-plan Use Vite with vanilla JavaScript. Keep images local and store metadata in SQLite.
/speckit-tasks
/speckit-implement
/speckit-converge
```

Each artifact feeds the next:

- **Constitution** (once per project): written to `.specify/memory/constitution.md` — the non-negotiable principles: stack conventions, code style, testing standards, security boundaries. Every later plan has to pass this gate.
- **Specify**: what and why only, never how. Produces `specs/001-xxx/spec.md` with goals, scope, constraints, and acceptance criteria.
- **Clarify** (strongly recommended): the agent asks about the fuzzy bits and writes the answers back into the spec. This is the highest-value step — it surfaces boundaries, permissions, and data formats you hadn't thought through.
- **Plan**: now the technical details arrive. Architecture, stack choices, component structure, interface contracts. You can hand it direct constraints: use Vite with vanilla JS, keep images local, store metadata in SQLite.
- **Tasks**: an ordered, dependency-aware task list, each item small enough to hand to an agent and carrying verifiable acceptance criteria.
- **Implement**: execute item by item, ticking each off in `tasks.md`. Review the diff at every checkpoint.
- **Converge**: scans code against the spec. Only `Converged` means done; otherwise it lists the gaps and you loop back to implement.

A spec an agent can execute reliably has at least four parts: **goals and non-goals** (stating what you are *not* doing prevents drift better than listing features), **user journeys** (real usage steps rather than a feature inventory), **quantifiable acceptance criteria** (`P95 < 200ms`, not "fast"), and **edges and failures** (invalid input, unavailable dependency, missing data — what the agent most often forgets).

## Where it actually saves you trouble

Two places. First, that Clarify step — it keeps asking until it drags out the things you hadn't figured out yourself, so you don't discover at the end that it built the wrong thing. Second, Converge — change the code without the spec and it keeps flagging the gap, so the spec never quietly goes stale. In other words, the spec isn't a reference doc you read once and forget; it's the source of truth the agent executes against: numbered, with acceptance criteria, diffable, and traceable.

The other two entry points are on-demand too — you don't have to run the whole SDD flow just to fix a small bug.

**Bug fixing** — install the extension first:

```bash
specify extension add bug
```

Then, in your agent:

```text
/speckit-bug-assess "Submitting an empty password crashes the login form." slug=login-crash
/speckit-bug-fix slug=login-crash
/speckit-bug-test slug=login-crash
```

Reports land in `.specify/bugs/login-crash/`. The verdict is `verified`, `partial`, or `failed` — only `verified` counts as a real fix.

**Idea assessment** — same pattern:

```bash
specify extension add assess
```

```text
/speckit-assess-intake "Let users work offline and sync when they reconnect." slug=offline-mode
/speckit-assess-research slug=offline-mode
/speckit-assess-define slug=offline-mode
/speckit-assess-shape slug=offline-mode
/speckit-assess-decide slug=offline-mode
```

You get `go`, `needs-clarification`, or `kill`. Deciding not to build something, with the reasoning recorded, is a useful outcome too. If you get a `go`, pass the handoff summary from `decision.md` to `/speckit-specify`.

## Things you'll run into

**Do I need GitHub Copilot?** No. It's agent-neutral — use whichever you like.

**Is this the same as a PRD?** No. A PRD is for humans; an SDD spec is the source of truth the agent executes, diffable and traceable. You read a PRD once and set it down; a spec has to keep up with the code.

**Does the spec need ongoing maintenance?** Yes. Change the code without the spec and converge keeps flagging gaps. Treat it like a test: change the requirement first, then the spec.

**Can I install community extensions directly?** Spec Kit ships community catalogs, but the maintainers say it plainly: the listings are neither audits nor endorsements — review the source before installing or running anything.

## When to skip it

Spec Kit isn't free — a feature produces a dozen or so documentation files, and that ceremony has a cost. Here's how I draw the line:

| Scenario | Recommendation |
| --- | --- |
| Exploratory scripts, one-off data processing | Skip it — just let the AI write |
| Fixes you can finish within an hour | Skip it — explain it in plain words |
| Parallel agent work, production business logic | Worth it — focus on specify + tasks + converge |
| Greenfield projects | Full flow, with the constitution written once |

The rule is simple: **use the minimum rigor needed to remove ambiguity**. Don't write a constitution for a throwaway script.

## Bottom line

It can't tell you what you actually want. What it can do is make sure what the AI delivers matches exactly what you said.

If your pain has shifted from "it can't write code" to "it writes the wrong code", this workflow is worth one full trial. If you only occasionally ask AI for a small tool, explaining it in plain words is still faster.

---

**References**

- [github/spec-kit — official repository and docs](https://github.com/github/spec-kit)
- [Spec Kit documentation site](https://github.github.io/spec-kit/)
- [Juejin: Getting started with GitHub Spec Kit](https://juejin.cn/post/7705577542891421706)
