---
title: "Get AI to Follow Your Rules: Agent Skills from Writing to Using"
pubDatetime: "2026-11-28T00:00:00.000Z"
description: "Once you've done the same thing five times, it's time to write it as a Skill. A Skill is a job manual for your AI: it says how the job is done and when to step in. This starts from that repetitive moment and walks you through writing one, what to watch out for, and when you don't need one at all."
author: "Xiaozha"
tags: ["AI", "Open Source", "Tutorial"]
draft: false
ogImage: "/images/agent-skills-en-real.webp"
coverAlt: "A SKILL.md folder expanding into metadata, instructions and scripts"
zhSlug: "agent-skills"
---

When you're doing the same thing for the fifth time, you probably think: not this again. A weekly report in a fixed format, a debugging flow for a certain API, the layout of a doc type you keep tweaking — every time you have to explain the rules to your AI from scratch, and it still may not follow them.

There's an easier way: write it as a Skill.

A Skill is a job manual for your AI. Think of it like onboarding a new colleague: you don't retell the whole company history every time you hand over a task. You write a manual and put it on their desk — what this job is, when to pick it up, the steps to take, and which page to flip to when something unusual comes up. A Skill works the same way for an AI: it doesn't memorise the whole manual, it just turns to the right page when needed.

## Write one right now

A Skill is a folder with a `SKILL.md` inside: a YAML frontmatter at the top saying "what this is and when to use it," followed by Markdown steps. The `scripts/`, `references/` and `assets/` folders are all optional — add them when you need them.

The frontmatter fields are just these:

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | 1–64 chars, lowercase letters/digits/hyphens, must match directory name |
| `description` | Yes | 1–1024 chars, non-empty, states what + when |
| `license` | No | License name or reference to a bundled license file |
| `compatibility` | No | ≤500 chars; include only if there are environment requirements |
| `metadata` | No | Arbitrary string-to-string mapping |
| `allowed-tools` | No | Space-separated pre-approved tools; experimental, support varies |

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

The directory looks like this:

```text
pdf-processing/
├── SKILL.md          # required
├── scripts/          # optional: executable code
├── references/       # optional: documentation
└── assets/           # optional: templates, images, data
```

## Where it really saves you effort

A Skill can "carry an encyclopedia without blowing up the context window" because it loads in three layers. A bookshelf is a good way to picture it:

1. **Metadata (~100 tokens)**: at startup only every skill's `name` + `description` come up — like glancing at the titles on the book spines, enough to judge "which one might be useful," without pulling any book off the shelf.
2. **Instructions (< 5000 tokens recommended)**: only when a task looks relevant do you take the whole `SKILL.md` off the shelf and read it. The spec recommends keeping the main file **under 500 lines**.
3. **Resources (as needed)**: files under `scripts/`, `references/` and `assets/` are opened or run only when required.

Anthropic's engineering blog makes a key point: an AI with a filesystem and code execution doesn't need to read a whole Skill into context — scripts can be executed and PDFs parsed directly, with neither taking up context. So the amount of context you can bundle into a Skill isn't capped by a single window.

One easily missed point: **running code is far cheaper than having the model generate tokens**. Their example is sorting — generating tokens to sort a list costs much more than just running a sorting algorithm. So a script in a Skill isn't just "documentation," it's a deterministic tool. Sorting, parsing and format checks — leave that work to code.

## A few things to watch out for when you write

**Match the `name` to the directory — don't treat it as a title.** It can only contain lowercase letters, digits and hyphens, 1–64 characters, with no leading or trailing hyphen and no consecutive hyphens. If the folder is `product-bullet-extractor`, the `name` should be written exactly as `product-bullet-extractor` — not something like `Product Bullet Extractor` with capitals and spaces.

**`description` should say both "what it does" and "when to use it."** It isn't just an intro — it's the trigger. Only this field is loaded into the system prompt, and the AI uses it to decide whether to activate. Something like "helps with PDFs" is too vague. A good, concrete version is `Extracts text and tables from PDFs, fills forms. Use when handling PDF documents or when the user mentions PDFs, forms, or document extraction.` Include the words users actually type (PDF, form, extract, merge), but don't stuff it — too many trigger words cause false activations.

**It complements MCP, it doesn't replace it.** A Skill is a folder, not "a longer prompt." Anthropic's wording is that Skills can complement MCP servers — teaching the AI how to chain complex workflows that involve external tools. They work together; neither replaces the other.

**Don't cram everything into the body.** The test is simple: do you need this content on every activation? If yes, keep it in `SKILL.md`. If it's only relevant in specific cases, or it's a long API reference, template or checklist, move it to `references/` or `scripts/` and leave a relative-path link in the body. References use paths from the Skill root and go **only one level deep** — no A-links-B-links-C chains; the AI won't navigate a maze.

**Run a validation before shipping.** The official reference library provides `skills-ref`:

```bash
skills-ref validate ./my-skill
```

It checks frontmatter validity and naming conventions. Run it before dropping a Skill into a client — it catches most of the "I wrote it but it never triggers" headaches. You can also trigger manually with `/skill-name` to skip semantic matching and check the body flow first, then go back to natural language to see whether the description hits. If it doesn't trigger, fix the description; if it triggers but does the wrong thing, fix the body steps.

## When not to write a Skill

- **One-off tasks**: writing the Skill costs more than just doing it once.
- **Anything a single prompt explains cleanly**: don't build a folder just to look rigorous.
- **Anything needing live data or heavy state**: Skills are good at packaging procedural knowledge — flows, rules, templates — not databases. Use MCP or a real backend for those.
- **Before you've seen where your AI struggles**: the official first principle is "start with evaluation" — run real tasks, see where it lacks context, then write a Skill to fill that gap. Don't pre-stuff knowledge on speculation.

## Bottom line

A Skill isn't "a longer prompt for the AI." It's a reusable workflow packed into three layers — trigger (description) → instructions (SKILL.md) → resources (on-demand files) — so the right small piece shows up at the right moment.

Match `name` to the directory, say when to use it in `description`, keep the body under 500 lines, move details into references, and run `skills-ref` before shipping — these matter far more than any "20 lines that double your AI quality" headline.

---

**References**

- [Agent Skills official specification](https://agentskills.io/specification)
- [Agent Skills site and supported clients](https://agentskills.io/)
- [anthropics/skills repository](https://github.com/anthropics/skills)
- [Anthropic Engineering: Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
