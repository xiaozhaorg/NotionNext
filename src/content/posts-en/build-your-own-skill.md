---
title: "Build Your Own Agent Skill: From Definition to Testing, Step by Step"
pubDatetime: "2026-11-29T00:00:00.000Z"
description: "What exactly is an AI agent Skill, and how is it different from a prompt, MCP, or rules? This guide explains the concept with a plain-language analogy, then builds one real Skill — a commit message generator — from directory layout and SKILL.md authoring to progressive disclosure, test cases, baseline comparisons, trigger tuning, and packaging."
author: "Xiaozha"
tags: ["AI", "Open Source", "Tutorial"]
draft: false
ogImage: "/images/build-your-own-skill-en-real.webp"
coverAlt: "A SKILL.md folder going from definition and writing to testing and packaging"
zhSlug: "build-your-own-skill"
---

Ever had this happen: you taught the AI the same thing eight times, and the next conversation it forgot everything again? Or you keep pasting the same giant prompt block every single time?

That's exactly what Skills solve. No jargon here — this guide uses one example all the way through, **building a "generate my git commit message" Skill**, starting from what a Skill even is, all the way to testing it and packaging it for someone else. By the end you'll be able to build your own first Skill by following along.

If you've already read my piece on [writing Agent Skills to the official spec](./agent-skills/), that one is the "error-correction manual" and this one is the "from-zero hands-on course" — they pair nicely.

## 1. What exactly is a Skill?

In one line: **a Skill is a folder containing an instruction manual that teaches the AI how to do a specific task — and the AI only opens it when it needs to.**

Here's the analogy. Picture the AI as a new intern:

- **A prompt** is something you say out loud, in the moment. Done and gone; you'll have to say it again next time.
- **A Skill** is a job manual you wrote for them, sitting on a bookshelf (the Skill directory). The spine has a title and a one-line summary (`name` and `description`). They glance at the shelf, and if the summary looks relevant to the task at hand, they pull the whole book out to read it.
- **MCP** is the tools and systems you hook them up to — your Git system, a database. The manual (Skill) teaches them **how to use** those tools to finish a complex task. The two complement each other; neither replaces the other.

The magic is in that "glance at the summary" step. At startup, the AI **reads only the name and summary of every Skill**, not the full text. When a task actually matches, it loads the whole manual. This is called **progressive disclosure** — which is why you can install dozens or hundreds of Skills with almost no cost to its working memory (context).

A Skill's folder looks like this:

```
commit-message-writer/        <- folder name = Skill name
├── SKILL.md                  <- required: the manual itself (metadata + body)
├── scripts/                  <- optional: executable code
├── references/               <- optional: detailed docs read only when needed
└── assets/                   <- optional: templates, images, other assets
```

**When is it worth making a Skill?** A practical rule of thumb: **once you've done the same thing five or more times**, and the steps, format, and rules are roughly the same each time — a weekly report in a fixed format, a debugging flow for a certain class of bug, your team's code-review checklist — that's a Skill. One-off, free-form tasks ("write me a poem about summer") aren't.

## 2. The rules of the road

Before you write anything, lock in a few hard rules. They'll save you 90% of beginner mistakes.

### 2.1 The folder name is the Skill name

Whatever the folder is called, the `name` inside `SKILL.md` must match exactly. Rules: **1–64 characters, lowercase letters, digits, and hyphens only; cannot start or end with a hyphen; no consecutive hyphens.**

So `Commit Message Writer`, `-commit`, and `commit--writer` are all invalid. `commit-message-writer` is correct.

### 2.2 Two required frontmatter fields, the rest optional

`SKILL.md` starts with a YAML frontmatter block wrapped in `---`. Only two fields are required:

```yaml
---
name: commit-message-writer
description: Generates commit messages that follow Conventional Commits based on staged git changes. Use when the user needs to write a commit message, commit code, describe a change, or mentions git commit.
---
```

- `name`: covered above.
- `description`: **the single most important field** — we'll come back to it. It decides whether the AI ever uses your Skill.

Optional fields: `license`, `compatibility` (environment requirements, e.g. "requires Python 3.14 and uv"), `metadata` (custom key-values), and `allowed-tools` (pre-approved tools; experimental, support varies). **Most Skills need none of these — don't pad it out.**

### 2.3 description is the trigger switch, not a feature blurb

The classic beginner mistake is writing a dry feature line like `description: generates commit messages`. Then the AI never thinks to use it.

A good description answers three things: **what it does + when to use it + how the user will phrase it.** And the official docs are blunt about a known AI weakness called "undertriggering" — it fails to use a Skill when it should. So write the description a little "sticky," listing the various phrasings:

```yaml
description: Generates commit messages that follow Conventional Commits based on staged git changes. Use when the user needs to write a commit message, commit code, describe a change, or mentions git commit. Even if the user doesn't say "follow the format," trigger this whenever they say "help me commit" or "write a commit message."
```

One official caveat: **for very simple one-step tasks like "read this file," the AI usually won't trigger a Skill** — it can just do it directly. That doesn't mean your Skill is broken; complex, multi-step tasks trigger reliably. Pick substantial tasks when you test.

### 2.4 How to write the body: explain the why, don't stack MUSTs

Below the frontmatter is a Markdown body of written instructions. A few battle-tested habits:

- **Use the imperative**: "Run `git diff`," "determine the change type" — not "you should run...".
- **Explain the reason instead of piling on MUSTs.** Modern models are smart; telling them *why* beats ten bolded "MUST"s. A page full of `ALWAYS`/`NEVER` is a red flag.
- **Give input/output examples.** One good example beats three paragraphs.
- **Write fixed outputs as a template** for the model to copy.

### 2.5 Three loading levels — don't bloat the manual

Progressive disclosure has three tiers, with rough "weights":

| Tier | Content | When loaded | Budget |
| --- | --- | --- | --- |
| 1 | `name` + `description` | Always, at startup | ~100 tokens |
| 2 | `SKILL.md` body | On a match, loaded in full | < 5000 tokens recommended |
| 3 | `scripts/`, `references/`, `assets/` | Read/run only when needed | On demand, effectively unlimited |

Hence the hard advice: **keep `SKILL.md` under 500 lines.** Past that, move detail into `references/` and leave a pointer in the body: "see [references/conventions.md](references/conventions.md) for team conventions." Use relative paths from the Skill root, and **keep references one level deep — no chains**.

For big files (> 300 lines), add a table of contents. For multi-framework or multi-domain Skills, split by variant — a cloud-deploy Skill might have `references/aws.md`, `gcp.md`, `azure.md`, and the AI reads only the relevant one.

## 3. Full example: building commit-message-writer from scratch

Enough rules. Let's build for real. Follow along and it'll click.

### Step 1: Get clear first (don't start writing yet)

Answer four questions before you touch a file. This is the official skill-creator's first move, "capture intent":

1. **What should it do?** — Generate a commit message from git changes.
2. **When should it trigger?** — When the user says "help me commit," "write a commit," or "describe this change."
3. **What should the output look like?** — A block of text following Conventional Commits.
4. **Should we test it?** — Yes. The output is objectively checkable (valid prefix, under 50 chars), which makes it ideal for testing.

Think through edge cases too: what if nothing is staged? What if one commit mixes unrelated changes? Those go into the body.

### Step 2: Create the folder, write SKILL.md

Create `commit-message-writer/` with a `SKILL.md` inside. Here's the complete content:

```markdown
---
name: commit-message-writer
description: Generates commit messages that follow Conventional Commits based on staged git changes. Use when the user needs to write a commit message, commit code, describe a change, or mentions git commit. Even if the user doesn't say "follow the format," trigger this whenever they say "help me commit" or "write a commit message."
---

# Commit Message Generator

Generate one clear, conventional commit message from the current git changes.

## Steps

1. First run `git diff --staged` to see staged changes. If the staging area is empty, run `git diff` and remind the user to `git add` first.
2. Determine the change type and pick a prefix:
   - `feat`: new feature
   - `fix`: bug fix
   - `docs`: documentation only
   - `refactor`: restructuring with no behavior change
   - `chore`: build, dependencies, miscellany
3. Write the subject: `<type>(<scope>): <short description>`, under 50 characters, starting with a verb, no trailing period.
4. If a body is needed, leave a blank line and explain *why* the change was made — don't repeat *what* changed.
5. For team-specific conventions see [references/conventions.md](references/conventions.md).

## Output format

Output only the commit message, wrapped in a code block, with no extra explanation:

    feat(auth): add JWT token refresh

    Refresh tokens 30 minutes before expiry so users aren't logged out mid-form.

## Common cases

- Several unrelated changes in one go: suggest splitting into multiple commits rather than cramming them together.
- Pure formatting changes: use `style`, don't disguise them as `refactor`.
```

Notice the details: imperative sentences; a complete input/output example; the output format written as a copy-able template; and each rule carrying its implicit *why* (e.g. "under 50 characters" reads well in `git log`).

### Step 3: Add references and scripts as needed

Team conventions vary by project; stuffing them into the body bloats `SKILL.md`. Move them to `references/conventions.md`:

```markdown
# Team commit conventions

- Use the module name as scope, e.g. `auth`, `api`, `ui`; use `core` for cross-module changes.
- For breaking changes, add `!` after the type, e.g. `feat(api)!: drop v1 endpoint`, and include migration notes in the body.
- Put the linked ticket on its own line at the end of the body: `Refs: #1234`.
```

If a step is **deterministic, repetitive work** — formatting output, parsing a diff — write it as a script in `scripts/` and let the AI run it, rather than generating it token by token. The official docs are emphatic: executing code is cheaper, more reliable, and more deterministic than asking a language model to produce the same text. Such scripts should be self-contained, have helpful error messages, and handle edge cases gracefully.

Your folder now looks like this:

```
commit-message-writer/
├── SKILL.md
└── references/
    └── conventions.md
```

That's a minimal, well-structured, usable Skill. But **don't ship it yet — test it.**

## 4. Testing: how do you know it actually works?

This is the step most people skip and the one they least should. Testing answers two questions: **did it trigger when it should?** (trigger accuracy) and **once triggered, did it do a good job?** (output quality).

### Step 1: Write a few real test cases

Think of 2–3 things a real user would actually say — not abstract commands like "format this data," but specific scenarios with detail. Save them to `evals/evals.json`:

```json
{
  "skill_name": "commit-message-writer",
  "evals": [
    {
      "id": 1,
      "prompt": "I just added JWT refresh to the login module, changes are staged, help me write a commit message",
      "expected_output": "A single feat(auth) commit message, under 50 characters",
      "files": []
    },
    {
      "id": 2,
      "prompt": "This change is really just me reformatting half the project by accident, commit it for me",
      "expected_output": "Recognizes this as pure formatting and uses the style prefix",
      "files": []
    }
  ]
}
```

**Write only the prompts at first, not the assertions.** That's the next step.

### Step 2: Run each case twice, with a control

The key move: **run every test case twice** — once with your Skill, once without (the "baseline"). **Launch both batches at the same time**, not one after the other.

Why the control? If "without the Skill" does just as well, your Skill adds nothing. It only passes if having it is clearly better.

(If you're improving an existing Skill, the baseline should be the **old version** — snapshot it before you edit.)

In Claude Code, the official skill-creator spins these up for you. In an environment without subagents like Claude.ai, run them by hand: read through `SKILL.md`, complete the test task following its instructions, and save results to a workspace.

### Step 3: Draft assertions while runs are in progress

Don't idle while tasks run in the background — write **objectively checkable assertions** for each case:

- Does the message start with a valid prefix like `feat(` or `fix(`?
- Is the subject ≤ 50 characters?
- Is it wrapped in a code block with no extra explanation?

Assertions should be machine-checkable with descriptive names. Don't force assertions onto subjective things (is the tone good?) — leave those to human review.

### Step 4: Grade, aggregate, and let a human look

Once runs finish:

1. **Grade each one**: mark each assertion pass/fail with evidence. If it can be checked programmatically, write a script — faster and more reliable than eyeballing.
2. **Aggregate into a benchmark**: use the aggregation script to produce `benchmark.json` comparing pass rate, time, and token usage for "with Skill" vs "without."
3. **Generate a review page**: the official `generate_review.py` builds a web page with outputs and feedback on one side, quantitative comparison on the other. From iteration two onward it also shows the previous round.
4. **Read feedback, improve, rerun** into `iteration-2/`, `iteration-3/`, and so on. Repeat until you're satisfied.

The official docs stress one mindset here: **generalize from concrete feedback instead of patching individual tests.** A Skill is meant to be used thousands of times — if it only works for your handful of cases, it's useless. Did the AI independently write the same helper script in every test? Bake it into `scripts/`. Did a certain instruction make it take a detour? Delete that instruction.

### Step 5: Tune trigger accuracy separately

Once quality is good, there's one more dedicated job: **optimizing the description's trigger accuracy**.

Create **20 queries**, half "should trigger" and half "should not" (official guidance: 8–10 each). The trick is to pick **near misses** for the negatives — queries that share keywords with your Skill but actually need something else. For the commit-message Skill, a good negative: "show me who changed this git log the most" — it mentions git but doesn't need a commit message. An absurd negative ("write a Fibonacci function") tests nothing.

Split the set **60% train / 40% held-out**, run each query 3 times for a reliable trigger rate, let the AI rewrite the description based on failures, iterate up to 5 rounds, and finally **pick the best description by the held-out score** to avoid overfitting. In Claude Code this whole loop runs automatically via the `run_loop` script.

### When you can skip testing

If your Skill's output is **subjective** — writing style, design taste — objective assertions add little; human feedback is enough. But whenever output is verifiable (file transforms, data extraction, code generation, fixed workflows), testing is worth it.

## 5. Validate, package, install

Finish strong:

**Validate the format.** Use the official `skills-ref` library to check that the frontmatter is valid and the naming is compliant:

```bash
skills-ref validate ./commit-message-writer
```

**Package it.** Use the skill-creator packaging script to zip the folder into a `.skill` file for distribution:

```bash
python -m scripts.package_skill ./commit-message-writer
```

**Audit before installing.** The official docs are firm on this: Skills can carry instructions *and* code, so a malicious Skill could introduce vulnerabilities or quietly exfiltrate data. **Install only from trusted sources**, and before installing, read through the files — especially code dependencies, bundled scripts, and any instruction to connect to external network addresses.

## Final thoughts

The main line of building a Skill from zero:

1. **Get clear** — what it does, when it triggers, output shape, whether to test;
2. **Write `SKILL.md`** — compliant `name`, sticky `description`, body that explains why and gives examples, under 500 lines;
3. **Split resources** — detailed docs into `references/`, deterministic work into `scripts/`, templates into `assets/`;
4. **Test twice** — with Skill vs without, write assertions, aggregate a benchmark, read feedback, iterate;
5. **Tune triggering** — 20 queries to optimize the description, held-out set to prevent overfitting;
6. **Validate & package** — run `validate`, produce a `.skill`, and audit before sharing.

One line to remember: **treat a Skill as a job manual for a smart new colleague who doesn't know your team yet** — explain the why, give plenty of examples, skip the fluff. The rest is handled by progressive disclosure and the testing loop.

---

**Further reading**

- [Agent Skills specification](https://agentskills.io/specification) — the authoritative source for fields and directory structure
- [Anthropic's official skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) — where this guide's testing workflow comes from, with the full scripts
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) — engineering blog on progressive disclosure and iteration
