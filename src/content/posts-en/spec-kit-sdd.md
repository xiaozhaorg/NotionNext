---
title: "Spec Kit in Practice: Specify Before You Code, Stop Vibe Coding"
pubDatetime: "2026-11-24T00:00:00.000Z"
description: "GitHub's official Spec Kit has passed 151k stars. It is no longer just the five-step SDD workflow most tutorials describe - bug fixing and idea assessment are now separate entry points. What it solves, how to use it, and when to skip it."
author: "Xiaozha"
tags: ["AI Coding", "Open Source", "Tutorial"]
draft: false
ogImage: "/images/spec-kit-sdd-en-real.webp"
coverAlt: "A terminal showing a specification document beside the generated code"
zhSlug: "spec-kit-sdd"
---

The most frustrating thing about coding with AI is rarely that it cannot write code. It is that it writes the wrong code.

You describe a feature, the agent faithfully produces three thousand lines, and it went off the rails at step two. You rewrite the prompt, regenerate, drift again. That is the real cost of vibe coding.

**Garbage in, garbage out.** Feed it an ambiguous requirement and it will faithfully ship the garbage you asked for.

[Spec Kit](https://github.com/github/spec-kit) is GitHub's official open-source answer to that problem, now at **151k stars**. It is the spec-driven development (SDD) toolkit GitHub uses itself.

One correction first: **most tutorials still teach the old five-step SDD flow, and the tool has moved well past it.**

## What it actually is

In one line: a structured process, reusable templates, and **traceable outcomes** for your AI coding agent.

Traceability is the point. A traditional PRD is a reference document written for humans — often read once and forgotten. A Spec Kit spec is the **source of truth** the agent executes against: numbered, with acceptance criteria, diffable, and traceable. Change the code without changing the spec and the consistency check keeps reporting a gap.

It does three jobs through three **independent entry points**, not mandatory sequential phases:

| What you need | Entry point | Outcome |
| --- | --- | --- |
| Build a feature from scratch | Spec-Driven Development | A spec carried through planning, implementation, and convergence |
| Diagnose and repair broken behavior | Bug fixing (extension) | An assessed cause, a scoped fix, and recorded verification |
| Decide if an idea deserves investment | Idea assessment (extension) | An evidence-backed go, clarify, or stop decision |

The last two are **extensions you install on demand** — you do not have to run SDD first. That design only landed after v1.4, which is why older tutorials rarely mention it.

## Installation

You need Python 3.11+ and [uv](https://docs.astral.sh/uv/), on Linux, macOS, or Windows.

```bash
uv tool install specify-cli
specify init my-project --integration copilot
cd my-project
```

`--integration` selects your coding agent. The toolkit is agent-neutral — GitHub Copilot, Claude Code, Codex, Cursor, Gemini CLI, OpenCode and 20+ others work, with no subscription lock-in.

For an **existing project**, run `specify init .` inside it instead of creating a new one.

## The core flow: SDD

Establish a constitution once per project, then repeat the rest for each feature.

**These slash commands run in your agent's chat, not your terminal.** The examples use GitHub Copilot's default syntax; see the [integration docs](https://github.github.io/spec-kit/integrations/cli.html#command-invocation) for other agents.

```text
/speckit-constitution Create principles focused on code quality, testing, and maintainability.
/speckit-specify Build a photo organizer with albums grouped by date and a tile preview of each album.
/speckit-plan Use Vite with vanilla JavaScript. Keep images local and store metadata in SQLite.
/speckit-tasks
/speckit-implement
/speckit-converge
```

Each artifact feeds the next:

- **Constitution** (once): written to `.specify/memory/constitution.md` — the non-negotiable technical principles: stack conventions, code style, testing standards, security boundaries. Every later plan must pass this gate.
- **Specify**: what and why only, never how. Produces `specs/001-xxx/spec.md` with goals, scope, constraints, and acceptance criteria.
- **Clarify** (strongly recommended): the agent asks about ambiguous points and writes the answers back into the spec. **This is the highest-value step** — it surfaces boundaries, permissions, and data formats you had not thought through.
- **Plan**: now the technical details arrive. Architecture, stack choices, component structure, interface contracts. You can hand it direct constraints: use Vite with vanilla JS, keep images local, store metadata in SQLite.
- **Tasks**: an ordered, dependency-aware task list, each item small enough to hand to an agent and carrying verifiable acceptance criteria.
- **Implement**: execute item by item, ticking each off in `tasks.md`. Review the diff at every checkpoint.
- **Converge**: scans code against the spec. Only `Converged` means done; otherwise it lists the gaps and you loop back to implement.

A spec an agent can execute reliably has at least four parts: **goals and non-goals** (stating what you are *not* doing prevents drift better than listing features), **user journeys** (real usage steps rather than a feature inventory), **quantifiable acceptance criteria** (`P95 < 200ms`, not "fast"), and **edges and failures** (invalid input, unavailable dependency, missing data — what the agent most often forgets).

## The other two entry points

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

Reports land in `.specify/bugs/login-crash/`. The verdict is `verified`, `partial`, or `failed` — **only `verified` counts as a real fix**.

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

## When not to use it

This is the part that matters most and gets written about least. Spec Kit has a cost — a feature produces a dozen or so documentation files, and ceremony is not free.

| Scenario | Recommendation |
| --- | --- |
| Exploratory scripts, one-off data processing | Skip it — just let the AI write |
| Fixes you can finish within an hour | Skip it — explain it in plain words |
| Parallel agent work, production business logic | Worth it — focus on specify + tasks + converge |
| Greenfield projects | Full flow, with the constitution written once |

The rule: **use the minimum rigor needed to remove ambiguity**. Do not write a constitution for a throwaway script.

## Common questions

**Do I need GitHub Copilot?** No. It is agent-neutral.

**How does this relate to a PRD?** A PRD is for humans; an SDD spec is the source of truth the agent executes, diffable and traceable.

**Does the spec need ongoing maintenance?** Yes. Change the code without the spec and converge keeps flagging gaps. Treat it like a test: change the requirement first, then the spec.

**Can I install community extensions directly?** Spec Kit ships community catalogs, but the maintainers explicitly warn that listings are neither audits nor endorsements — review the source before installing or running it.

## Verdict

Spec Kit cannot tell you what you actually want. What it can do is make sure what the agent delivers matches exactly what you said.

If your pain has shifted from "it cannot write code" to "it writes the wrong code", this workflow is worth one full trial. If you only occasionally ask AI for a small tool, explaining it in plain words is still faster.

---

**References**

- [github/spec-kit — official repository and docs](https://github.com/github/spec-kit)
- [Spec Kit documentation site](https://github.github.io/spec-kit/)
- [Juejin: Getting started with GitHub Spec Kit](https://juejin.cn/post/7705577542891421706)
