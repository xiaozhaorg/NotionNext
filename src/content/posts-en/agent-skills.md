---
title: "Agent Skills, Written to Spec: That Tutorial You Copied Has Invalid Fields"
pubDatetime: "2026-11-28T00:00:00.000Z"
description: "Anthropic's skills repo has 199k stars and Agent Skills is now an open standard. But Chinese tutorials use name fields with spaces and descriptions that only say what a skill does — both wrong per spec. Here's the official field constraints, progressive disclosure, and the validation command."
author: "Xiaozha"
tags: ["AI", "Open Source", "Tutorial"]
draft: false
ogImage: "/images/agent-skills-en-real.webp"
coverAlt: "A SKILL.md folder expanding into metadata, instructions and scripts"
zhSlug: "agent-skills"
---

If you've done the same task five times or more — a weekly report in a fixed format, a debugging flow for a certain API, the layout rules for a doc type — you've probably heard this: **write it as a Skill**.

[Anthropic's skills repository](https://github.com/anthropics/skills) now has **199k stars**, one of the most-starred projects on GitHub. More importantly, what's behind it is no longer Claude-only: **Agent Skills is an open standard** ([agentskills.io](https://agentskills.io)), supported by dozens of clients including Cursor, VS Code, GitHub Copilot, Gemini CLI, OpenCode, TRAE and Codex. Write once, use everywhere.

Chinese tutorials have covered "what is a skill" and "your first skill" thoroughly. This one won't repeat that. It does one thing: **calibrates against the official spec** — because several high-upvote tutorials I read contain writing that plainly violates it.

## Three high-frequency mistakes, corrected

**1. `name` is not a display title.** One tutorial uses `name: "Product Bullet Extractor"` — capitals, spaces, quotes. Per spec, **all invalid**. Rules: 1–64 characters, lowercase letters/digits/hyphens only, no leading or trailing hyphen, no consecutive hyphens, and it **must match the parent directory name exactly**. If the folder is `product-bullet-extractor`, the name must be exactly that.

**2. `description` isn't just a summary — it's the trigger.** Tutorials often write `description: helps with PDFs` — too vague. The spec requires 1–1024 characters and says it should describe **both what the skill does and when to use it**, including keywords that help the agent identify the task. Better: `Extracts text and tables from PDFs, fills forms. Use when working with PDF documents or when the user mentions PDFs, forms, or extraction.` Only this field is preloaded into the system prompt; the agent uses it to decide whether to activate. Get it wrong and your skill never runs.

**3. Skills aren't "longer prompts," and they don't replace MCP.** A skill is a **folder**: `SKILL.md` is the entry point, with `scripts/`, `references/` and `assets/` mounted on demand. Anthropic's own wording about MCP is that Skills can **complement** MCP servers — teaching agents complex workflows that involve external tools. Not a replacement.

## Every field in the official spec

`SKILL.md` must have YAML frontmatter followed by Markdown. The fields:

| Field | Required | Constraints |
| --- | --- | --- |
| `name` | Yes | 1–64 chars, lowercase letters/digits/hyphens, must match directory name |
| `description` | Yes | 1–1024 chars, non-empty, states what + when |
| `license` | No | License name or reference to a bundled license file |
| `compatibility` | No | ≤500 chars; include only if there are environment requirements |
| `metadata` | No | Arbitrary string-to-string mapping |
| `allowed-tools` | No | Space-separated pre-approved tools; **experimental**, support varies |

A minimal working example:

```markdown
---
name: pdf-processing
description: Extracts text and tables from PDFs, fills PDF forms, merges files. Use when working with PDF documents or when the user mentions PDFs, forms, or extraction.
---

# PDF Processing

## Overview
[Goal, one or two sentences]

## Steps
1. Run `scripts/extract.py <pdf>` to extract text
2. For form filling, see [forms.md](references/forms.md)
3. Verify output fields

## Edge cases
- Scanned PDF with no text layer: run OCR first
```

Directory structure:

```text
pdf-processing/
├── SKILL.md          # required
├── scripts/          # optional: executable code
├── references/       # optional: documentation
└── assets/           # optional: templates, images, data
```

## The core mechanism: progressive disclosure

A skill can carry an encyclopedia without blowing up context because of three loading stages:

1. **Metadata (~100 tokens)**: at startup only every skill's `name` + `description` enter the system prompt — enough to decide "when to use," without loading the body.
2. **Instructions (< 5000 tokens recommended)**: the agent reads the full `SKILL.md` only when a task matches. The spec recommends keeping the main file **under 500 lines**.
3. **Resources (as needed)**: files under `scripts/`, `references/`, `assets/` are read or executed only when required.

Anthropic's engineering blog makes a key point: an agent with a filesystem and code execution **doesn't need to read a whole skill into context** — scripts can be executed and PDFs parsed directly, with neither entering the context window. So "the amount of context that can be bundled into a skill is effectively unbounded" by a single window.

One easily missed token principle: **running code is far cheaper than generating tokens**. Their example: sorting a list via token generation is much more expensive than running a sorting algorithm. A script in a skill isn't just documentation — it's a deterministic tool. Sorting, parsing and format checks belong in code.

**Note**: Anthropic never published a "skills save X% tokens" number. Treat any percentage you find online as unofficial — same logic as [the previous LightRAG piece debunking the "30% accuracy boost"](/en/article/lightrag-rag).

## Writing a description that actually triggers

This is the make-or-break step. Per the official advice:

- **Cover the trigger scenarios**: say what it does *and* "use when the user mentions X or asks for Y."
- **Be concrete with keywords**: include words users actually type (PDF, form, extract, merge), not abstract descriptions.
- **Don't stuff it**: piling on trigger phrases dilutes semantic matching and causes false triggers.
- **Test with manual triggering**: type `/skill-name` to bypass semantic matching and verify the body flow first; then check whether natural language hits the description.

The debug loop is simple: not triggering → fix the description; triggering but doing it wrong → fix the body steps.

## When to split the body out

The test: **is this content needed on every activation?**

Yes → keep it in `SKILL.md`. No (only relevant in specific cases, or it's a long API reference/template/checklist) → move it to `references/` or `scripts/` and leave a relative-path link. The docs say directly: if chunks of context are mutually exclusive or rarely used together, **separating them reduces token usage**.

Use relative paths from the skill root and keep references **one level deep** — no A-links-B-links-C chains; agents won't navigate a maze.

## Validate before shipping

The official reference library provides `skills-ref`:

```bash
skills-ref validate ./my-skill
```

It checks frontmatter validity and naming conventions. Run it before dropping a skill into a client — it catches most of the dumb "I wrote it but it never triggers" problems.

Anthropic's own [`skills`](https://github.com/anthropics/skills) repo is the best sample library — from document handling (docx/pdf/pptx/xlsx, Apache-2.0) to web app testing and MCP server generation. But read the disclaimer: these are for **demonstration and educational purposes**, your actual behavior from Claude may differ, and you should test thoroughly before relying on them for critical work.

## When not to write a skill

- **One-off tasks**: writing the skill costs more than just doing it.
- **Anything a single prompt explains cleanly**: don't build a folder just to look rigorous.
- **Anything needing live data or heavy state**: skills package procedural knowledge — flows, rules, templates — not databases. Use MCP or a real backend.
- **Before observing where your agent struggles**: the official first principle is "start with evaluation" — run real tasks, see where it lacks context, then write a skill to fill that gap. Don't pre-stuff knowledge on speculation.

## Bottom line

A skill isn't "a longer prompt." It's a reusable workflow organized in three layers — **trigger (description) → instructions (SKILL.md) → resources (on-demand files)** — so the agent uses the right small piece at the right moment.

Write to spec: `name` matches the directory, `description` says when to use, body stays under 500 lines, details move to references, and validate with `skills-ref`. That's a lot more useful than a headline about "20 lines doubling code quality."

---

**References**

- [Agent Skills official specification](https://agentskills.io/specification)
- [Agent Skills site and supported clients](https://agentskills.io/)
- [anthropics/skills repository](https://github.com/anthropics/skills)
- [Anthropic Engineering: Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
