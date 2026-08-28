---
title: "Free Large Model API Relay: Shawn AI Gives 7000 Free Credits on Signup (Full Integration Guide)"
pubDatetime: "2026-07-31T04:53:41.260Z"
description: "Shawn AI is a free large model API relay platform that aggregates hundreds of mainstream models including GPT-5.5, Claude Opus 4.7, Gemini 3.1, and DeepSeek-V4. New users get 5000 credits on signup, plus 2000 more when registering through an invite code, and 1000-3000 credits for daily check-ins. This article covers the full signup process and how to connect CherryStudio, Claude Code, and SillyTavern."
author: "Xiaozha"
tags:
  - AI
  - API
  - Tutorial
  - Free Tools
featured: false
draft: false
ogImage: "/images/shawn-ai-free-api-real.jpg"
coverAlt: "A conceptual neural network image of artificial intelligence bathed in a blue glow"
zhSlug: "shawn-ai-free-api"
---

🎁 This article recommends a free large model API relay platform I've personally tested and verified—Shawn AI.

You get 5000 credits right on signup, and registering through the invite link in this article earns you another 2000, for a total of 7000 credits. That's enough to call GPT-5.5, Claude Opus 4.7, the full Gemini 3.1 lineup, DeepSeek-V4, and hundreds of other mainstream models.

Anyone who plays with AI knows that top-tier models like GPT, Claude, and Gemini come with three pain points when used in mainland China: ① You need an overseas account and a credit card; ② The API pricing is expensive—a few rounds of calls can already cost several dollars; ③ Network access is unstable.

Shawn AI is one solution to all three problems—an API relay platform that aggregates multiple models, with free credits and direct access from mainland China.

## What Is Shawn AI?

Shawn AI (official site [https://free.supxh.xin](https://free.supxh.xin?ic=019f071f-eb85-7351-b410-3084056207f8)) is a nonprofit large model API relay platform built for Chinese-speaking users.

It aggregates hundreds of mainstream large models and provides a unified API endpoint, so a single key starting with `sk-` lets you call every model.

**Core features:**

- One-stop access to hundreds of models: GPT-5.5, Claude Opus 4.7, Claude Sonnet 4.5, the full Gemini 3.1 lineup, Gemini 3 Flash, DeepSeek-V4, and more
- Fully compatible with the OpenAI API format, so it plugs seamlessly into all kinds of third-party AI tools
- Direct access from mainland China—no proxy needed, low latency
- Register with just a QQ mailbox—zero barriers to entry
- Multiple ways to earn credits: signup bonus, daily check-in, referral rewards, and paid monthly plans

## How to Claim the 7000 Credits (Detailed Tutorial)

Shawn AI offers four ways to earn credits, and combining them lets you rack up quite a lot.

### Method 1: 5000 Credits for New Signups

Open the registration link and sign up with a QQ mailbox:

[https://free.supxh.xin/register?code=LZ25QS](https://free.supxh.xin/register?code=LZ25QS&ic=019f071f-eb85-7351-b410-3084056207f8)

Fill in the details:

- Email address (QQ mailboxes only—a throwaway account is recommended)
- Get the email verification code and enter it
- Set a username and password
- The invite code is filled in automatically via the link, so no manual entry needed (it shows `LZ25QS`)
- Once registration is complete, 5000 credits land in your account immediately

### Method 2: Referral Fission—Both Sides Get 2000 Credits

For every person you invite who registers, both you and the invitee get 2000 credits. Invite 20 people and you'll earn an unlimited weekly card!

💡 Registering through the invite link in this article gives both you and me 2000 credits.

That's where the "7000 credits" comes from: `5000 (signup) + 2000 (referral) = 7000`.

### Method 3: 1000-3000 Credits for Daily Check-ins

Log in and check in every day to get a random 1000-3000 credits. Check in consistently for a month and you'll save up tens of thousands of credits—plenty for everyday use.

### Method 4: Anniversary Limited-Time Coupons (Depends on Luck)

During the anniversary event (July 24 - July 28), weekly cards get ¥15 off, monthly cards ¥30 off, and quarterly cards ¥100 off. Only 100 coupons available, first come, first served.

## Supported Model List (Partial)

Shawn AI has integrated almost every mainstream large model. Here are some commonly used ones:

| Model Category | Representative Models | Best For |
|---|---|---|
| Anthropic | Claude Opus 4.7, Claude Sonnet 4.5 | Code generation, long-form writing |
| OpenAI | GPT-5.5, GPT-5 | General conversation, reasoning |
| Google | Gemini 3.1 Pro, Gemini 3 Flash, Gemini 2.5 Pro | Multimodal, long context |
| Domestic | DeepSeek-V4 | Chinese-language scenarios, great value |

💡 The exact models available depend on the "Model List" in the console—the platform regularly adds the latest models.

## Hands-On Integration: 3 High-Frequency Use Cases

### Use Case 1: Connecting CherryStudio (Recommended for Beginners)

CherryStudio is a desktop AI chat client that supports switching between multiple models, has a clean UI, and is great for everyday use.

- Download CherryStudio: visit `cherry-ai.com/download`
- After installing, open it and go to "Settings" on the left → "Model Providers" → click "+" to add a new provider
- Fill in the config:

```json
{
  "apiKey": "sk-your-key",
  "apiBaseUrl": "https://api.supxh.xin"
}
```

- Click "Detect Available Models" to auto-load all available models
- Return to the main screen, pick a model (e.g. `gemini-3-flash`), and start chatting

### Use Case 2: Connecting Claude Code (A Programmer's Favorite)

Shawn AI is fully compatible with the Anthropic protocol, so you can plug it straight into Claude Code. It's one of the simplest ways to use Claude Code in mainland China.

- First install Claude Code (see my earlier tutorial)
- Edit the `~/.claude/settings.json` config file:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.supxh.xin",
    "ANTHROPIC_API_KEY": "sk-your-key"
  }
}
```

- Save it, reopen your terminal, and run `claude` to get going

⚡ Driving Claude Code with free Shawn AI credits is basically getting an AI coding assistant for nothing. It's a far better deal than the $20/month official Pro subscription.

### Use Case 3: Connecting SillyTavern (For AI Tavern Players)

SillyTavern (`sillytavern.app`) is a killer tool for AI roleplay, but hooking up a model has always been a pain point. Shawn AI solves this perfectly.

- Grab an API key from the Shawn AI console
- Open SillyTavern → API settings → select Chat Completion (OpenAI)
- For Custom Endpoint, enter: `https://api.supxh.xin`
- For Custom API Key, enter your `sk-` key
- Click the connection test and load the model list
- Pick a model (Claude Sonnet 4.5 or Gemini 3 Flash are recommended for the best roleplay results)

## Important Usage Notes (Must Read)

⚠️ Free credits are great, but keep these points in mind to avoid account issues.

- Use a throwaway QQ mailbox for signup to keep your personal privacy separate
- Don't share the same API key across multiple devices to avoid getting the endpoint banned
- Lower your call frequency to reduce concurrency errors and risk-control blocks
- Don't type sensitive content like ID numbers or phone numbers into conversations (conversation data leaves the country)
- Not for minors—roleplay scenarios lack content filtering
- Credits burn faster than you'd expect, so pair it with the daily check-in

> If you need domestic, compliant models with higher security, go with CAC-filing models like ERNIE Bot (Wenxin Yiyan), Tongyi Qianwen, or iFlytek Spark. Shawn AI is best for "trying things out + learning + non-sensitive scenarios."

## Shawn AI vs. Official API: Which Should You Choose?

| Comparison | Shawn AI Relay | Official API |
|---|---|---|
| Signup barrier | QQ mailbox is enough | Overseas phone + credit card |
| Free credits | 7000 to start, sustained by check-ins | None (requires payment) |
| Network | Direct access in mainland China | Proxy required |
| Stability | Medium (relay service) | High (official SLA) |
| Data security | Data leaves the country; be careful with sensitive info | Also leaves the country |
| Best for | Learning, trying things out, non-sensitive scenarios | Production, enterprise, sensitive data |

## Summary: Is It Worth Signing Up?

If you fit any of the situations below, I'd strongly recommend registering:

- You want to try GPT-5.5 or Claude Opus 4.7 but don't have an overseas account
- You're a student or solo developer on a tight budget who still wants top-tier models
- You need an inexpensive model backend for tools like Claude Code or SillyTavern
- You want to compare multiple models but don't want to pay for a membership with each one

On the other hand, if you have these needs, go straight to the official API:

- Enterprise production environments that require SLA guarantees
- Handling sensitive data (user privacy, trade secrets)
- Need long-term, uninterrupted, reliable calls

🔗 **Invite link for this article:** [https://free.supxh.xin/register?code=LZ25QS](https://free.supxh.xin/register?code=LZ25QS&ic=019f071f-eb85-7351-b410-3084056207f8)

Registering through this link earns both you and me 2000 credits—mutual benefit. Thanks for the support!

> Grab the freebies while they last—free credits won't be around forever, and promotions can change at any time. Register today, and you can start using top-tier large models today.

If you have any questions, feel free to leave a comment below—I'll keep sharing more ways to get AI tools for free. My next post will cover Cline in practice, so stay tuned.
