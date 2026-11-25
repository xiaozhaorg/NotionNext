---
title: "LightRAG: let AI connect the dots in your documents"
pubDatetime: "2026-11-27T00:00:00.000Z"
description: "You dump a pile of documents into AI and ask how two companies are actually related. Plain vector search finds paragraphs that mention them but can't connect them. LightRAG adds a relationship graph alongside the vectors. Here's how to install it, when it's genuinely useful, and what you'll run into once you start."
author: "Xiaozha"
tags: ["AI", "Open Source", "Tutorial"]
draft: false
ogImage: "/images/lightrag-rag-en-real.webp"
coverAlt: "Knowledge graph nodes layered over vector retrieval structure"
zhSlug: "lightrag-rag"
---

Ever done this: toss a pile of reports into AI and ask "how are these companies actually related?" Plain vector search hands you paragraphs that mention their names, but it has no idea who connects to whom, or how that relationship shapes the conclusion. You dig through it all and still end up with scattered fragments.

[LightRAG](https://github.com/HKUDS/LightRAG) is an open-source tool from HKU's team built for exactly that: on top of vector search, it builds a knowledge graph, and checks both when a question comes in.

Think of it this way. Traditional RAG is like flipping through a book by keyword — you want a paragraph, it finds that paragraph. LightRAG also draws a relationship map on the side: who knows whom, who influenced whom, all marked on the lines. Ask "how are these two people related," and flipping through the book won't get you there. You need the map.

Put plainly, it stores both "what this paragraph says" and "how these paragraphs relate."

## Install it and give it a spin

Check the package name first. Some tutorials tell you to install `lightrag-core` or `lightrag-gpu`, and claim Python 3.8+ is enough. Follow those and you'll have wasted an afternoon. The real package is `lightrag-hku`, and it needs Python 3.11+.

The easiest path is [uv](https://docs.astral.sh/uv/) with the API and WebUI extras:

```bash
uv tool install "lightrag-hku[api]"
curl -O https://raw.githubusercontent.com/HKUDS/LightRAG/main/env.example
cp env.example .env
# edit .env with your model keys
lightrag-server
```

Then open `http://localhost:9621/webui` to upload documents, explore the graph and debug queries; REST docs are at `/docs`. Docker Compose and an interactive setup wizard (`make env-base`, etc.) are also available.

## Where it actually earns its keep

The test is one line: do your questions require connecting the dots?

- Single-fact lookups (policy clauses, product specs, an API's usage): traditional vector RAG plus keyword filtering is enough. A graph is pure overhead.
- Cross-document relational reasoning ("how are these companies connected across this set of reports," "how do character relationships drive the plot"): this is its home turf. The team says it's especially strong in verticals like law and finance that need the whole picture.

It's a lightweight alternative to GraphRAG: no community reports (summaries written after grouping related entities together) and no multi-hop reasoning, so it makes far fewer LLM calls during both indexing and querying. **But "lightweight" doesn't mean cheap** — more on that below.

## Once you actually run it, here's what hits you

**1. The default storage is for testing only.**

LightRAG needs four stores: KV (LLM cache and chunks), vector, graph, and document status. All four default to in-memory databases (`JsonKVStorage` / `NanoVectorDBStorage` / `NetworkXStorage` / `JsonDocStatusStorage`) — the data lives in the server process's memory, and local files are just a courtesy save. The docs say it plainly: fine for small-scale testing, evaluation and debugging, **not for production**. For production the official recommendation is **PostgreSQL** (one backend handles all four stores); MongoDB and OpenSearch are the other single-backend options. You can also split them — Milvus/Qdrant for vectors, Neo4j/Memgraph for the graph.

**2. It listens on every interface by default, with auth off.**

The README has a block set aside for this:

> `lightrag-server` binds to `HOST=0.0.0.0` and ships with authentication off. On a cloud host, **every endpoint is public — and spends your LLM quota.**

In plain words: run it on a cloud host and anyone can reach it, and every request spends your money. Before the first start, pick one:

1. Bind to a private address in `.env`: `HOST=127.0.0.1`, or a VPN / tunnel address.
2. Configure auth: set `LIGHTRAG_API_KEY`, or `AUTH_ACCOUNTS` plus `TOKEN_SECRET` (generate with `openssl rand -hex 32`).

Note the recent WebUI auth migration: protected `/webui` and `/workspace` now require `AUTH_ACCOUNTS` and a strong `TOKEN_SECRET`; API keys are for programmatic access only and no longer sign into the WebUI. Exposing the server without auth is effectively running a public paid LLM proxy.

**3. Extraction defaults to a reasoning model.**

LightRAG consumes more LLM than traditional RAG because every text chunk is sent to an LLM for entity-relation extraction. The docs split LLMs into four roles and recommend configuring them separately:

| Role | Job | Official advice |
| --- | --- | --- |
| EXTRACT | entity-relation extraction on every chunk | fast, cheap **non-thinking** model |
| QUERY | writes the answer from long, noisy context | stronger than extraction; thinking model OK |
| KEYWORD | extracts query keywords | must be non-thinking; latency-sensitive |
| VLM | image input | any mainstream multimodal model |

The trap: the default model `gpt-6-luna` is a **reasoning model**, and the API defaults to `effort=medium` — every chunk triggers long thinking, slow and expensive. The docs say to uncomment and set `OPENAI_LLM_REASONING_EFFORT=low`. For local extraction, the official minimum is Qwen3-30B-A3B (non-thinking). Go smaller and extraction quality drops.

**4. Its edge over GraphRAG in the paper is small.**

You've probably seen headlines about "30% accuracy boost." Look at the table the official README itself posts and the claim needs toning down: against NaiveRAG, RQ-RAG and HyDE, LightRAG wins big (overall 57%–86%, peaking at 84.8% in the legal domain). Against **GraphRAG, the margin is thin**: agriculture 54.8% vs 45.2%, CS 52.0% vs 48.0%, legal 52.8% vs 47.2% — and on the mixed corpus (Mix — several domains thrown together) it actually **loses, 49.6% vs 50.4%**.

These numbers were organized by the project team, using an LLM to judge pairwise responses — relative preference, not objective accuracy. The honest version: it beats vanilla vector RAG, but it's roughly in the same tier as GraphRAG. Its real selling points are fewer LLM calls for indexing and query, plus incremental updates — not a total rout.

## Two details that can waste half a day

**Lock in your embedding model before the first ingestion.** Changing it means re-embedding every chunk, entity and relation. The team ships `lightrag-rebuild-vdb` to rebuild vectors from the graph and text chunks — don't just delete the working directory, which turns a vector rebuild into re-ingesting every document.

**The default parsing pipeline doesn't show the system's best.** The docs say so directly and recommend enabling MinerU plus image analysis. Another common one for Chinese users: graph entities and relations come out in English — set `SUMMARY_LANGUAGE=Chinese` in `.env` instead of editing prompts.

## When not to use it

- Your knowledge base is mostly single-fact lookups — vector RAG is enough, a graph is pure cost.
- You just want to chat with a few PDFs — try something simpler first; extraction cost only pays off on cross-document relational questions.
- You plan to run it with defaults on a small public cloud box — fix auth and storage first, or you'll burn quota and risk losing data on restart.

## Bottom line

LightRAG does one thing: it connects entities scattered across documents into a graph, so it can answer relational questions plain vector retrieval can't.

It's useful, but treat it as a service that needs real ops work: default storage is test-only, the default listener burns money, extraction needs a non-thinking model, and the embedding model must be chosen up front. Put those four in your plan and it holds up.

---

**References**

- [LightRAG on GitHub and its README](https://github.com/HKUDS/LightRAG)
- [Paper, arXiv:2410.05779](https://arxiv.org/abs/2410.05779)
- [Docs: from default configuration to production](https://github.com/HKUDS/LightRAG/blob/main/docs/ExploreLightRAG.md)
- [Juejin: LightRAG's mechanism, cost and boundaries](https://juejin.cn/post/7670757585832591400)
