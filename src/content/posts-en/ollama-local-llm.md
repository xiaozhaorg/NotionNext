---
title: "Ollama Local LLM Guide: Run Llama 3, Qwen 3, DeepSeek in 5 Minutes"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Complete Ollama tutorial. Install, download models, use the API, integrate with Open WebUI. Run local LLMs on your own machine in 5 minutes."
author: "Xiaozha"
tags: ["AI", "LLM", "Tutorial", "Free Tools"]
featured: false
draft: false
ogImage: "/images/ollama-local-llm-real.jpg"
coverAlt: "Glowing AI chip on circuit board close-up, symbolizing LLM computing power"
zhSlug: "ollama-local-llm"
---

If you have ever sent a sensitive company document to an online LLM and wondered where the bytes ended up, you already understand the case for **running LLMs locally**. **Ollama** is the tool that makes it trivial.

Ollama is an open-source runtime that lets you run large language models like Llama 3, Qwen 3, DeepSeek, Mistral, Phi, and Gemma on your own laptop or server. You install one binary, type one command, and within minutes you have a chat-capable model responding on your own hardware — no API keys, no per-token billing, no internet required after the initial model download.

This guide walks through installing Ollama, running your first model, managing the model library, using the REST API, integrating with Open WebUI, picking the right hardware, customizing models, and comparing Ollama to alternatives.

---

## What Is Ollama and Why Run Local LLMs?

Ollama is a single-binary runtime for serving LLMs locally. Under the hood it uses `llama.cpp` for inference, packages models into a portable format (the "GGUF" file), and exposes them through a clean REST API and CLI.

The case for running LLMs locally, rather than via OpenAI / Anthropic / Google APIs:

- **Privacy.** Your prompts and completions never leave your machine. Critical for code review, legal documents, healthcare, and proprietary research.
- **No API costs.** You pay zero per token, forever. The only cost is the electricity to run your machine.
- **Offline.** Planes, trains, air-gapped servers — all work.
- **No rate limits.** Generate as much as you want, as fast as your hardware allows.
- **Full control.** You pick the model, the system prompt, the temperature, the context length. No vendor can silently change behavior.
- **Free.** Ollama and the most popular model weights (Llama 3, Qwen 3, DeepSeek) are open weights you can download and use freely.

The trade-off is hardware: you need a machine with enough RAM (and ideally a GPU) to run the model. More on this below.

---

## Installation: Windows, macOS, Linux

### macOS

The easiest path is the official installer:

1. Download **Ollama-darwin.zip** from [ollama.com](https://ollama.com).
2. Unzip and drag **Ollama** into Applications.
3. Launch the app. A llama menu bar icon appears, and `ollama` is available in Terminal.

Or via Homebrew:

```bash
brew install ollama
```

### Windows

Download **OllamaSetup.exe** from [ollama.com](https://ollama.com), run it, and accept the defaults. The installer adds `ollama` to PATH. A llama icon appears in the system tray.

Or with winget:

```powershell
winget install Ollama.Ollama
```

### Linux

The one-line installer works on most distros:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

This installs the `ollama` binary, sets up a `ollama` user, and starts the service as a systemd unit so it survives reboots.

Verify everything works:

```bash
ollama --version
# ollama version is 0.x.x
```

### Configure the host and port (optional)

By default Ollama listens on `127.0.0.1:11434`. If you want other machines on your LAN to reach it (e.g., to use a phone app against a beefy server), set the host:

```bash
# Linux (systemd)
sudo systemctl edit ollama
```

Add:

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```

Restart:

```bash
sudo systemctl restart ollama
```

---

## Running Your First Model: `ollama run llama3`

Time to talk to an LLM. The simplest command:

```bash
ollama run llama3
```

The first time you run this, Ollama downloads the model weights (about 4.7 GB for `llama3` 8B in Q4 quantization). After the download completes, you drop into an interactive prompt:

```
>>> Write a one-sentence pitch for a coffee shop.
Steeped in tradition, brewed for today — your perfect cup, every morning.
>>> /bye
```

Useful in-session commands:

- `/bye` or `Ctrl+D` — exit.
- `/show info` — show model details.
- `/show parameters` — show the active generation parameters.
- `/set system <text>` — change the system prompt.
- `/clear` — clear the conversation context.
- `/list` — list installed models.

You can also pipe input non-interactively:

```bash
echo "Translate to French: Hello, how are you?" | ollama run llama3
# Bonjour, comment vas-tu ?
```

---

## Available Models: Llama 3, Qwen 3, DeepSeek, Mistral, Phi, Gemma

Ollama's [model library](https://ollama.com/library) hosts dozens of open-weights models. The most popular as of 2026:

### General-purpose chat models

| Model | Size | Good for |
| --- | --- | --- |
| `llama3` (8B) | ~4.7 GB | General chat, code, fast on laptop |
| `llama3:70b` | ~40 GB | Best quality, needs big GPU/server |
| `qwen3` (8B, 14B, 32B, 72B) | varies | Multilingual, excellent Chinese |
| `mistral` (7B) | ~4.3 GB | Solid open-weights baseline |
| `gemma2` (9B, 27B) | varies | Google's open-weights model |
| `phi3` (mini, medium) | 2-7 GB | Small but capable |

### Code-focused

| Model | Size | Good for |
| --- | --- | --- |
| `deepseek-coder-v2` (16B, 236B) | varies | Code completion, agentic coding |
| `qwen2.5-coder` (7B, 32B) | varies | Strong open-weights coder |
| `starcoder2` (3B, 7B, 15B) | varies | Fill-in-the-middle autocomplete |

### Reasoning-focused (chain-of-thought)

| Model | Size | Good for |
| --- | --- | --- |
| `deepseek-r1` (1.5B, 7B, 8B, 14B, 32B, 70B, 671B) | varies | Strong reasoning, math, code |
| `qwen3` (with thinking) | varies | Built-in thinking mode |

Pick by RAM budget, not by parameter count alone. The size column above is the **on-disk size after quantization** — the model needs about that much RAM/VRAM to run, plus a few hundred MB for the KV cache.

To pull a model without running it:

```bash
ollama pull qwen3:14b
```

---

## Model Management: pull, list, rm, show

A handful of commands cover everything you'll do day-to-day.

### `ollama pull` — Download a model

```bash
ollama pull llama3
ollama pull qwen3:14b
ollama pull deepseek-r1:14b
```

Pulls are resumable; if you Ctrl+C, the next pull continues from where it left off.

### `ollama list` — List installed models

```bash
ollama list
```

Output looks like:

```
NAME                       ID            SIZE     MODIFIED
deepseek-r1:14b             0a-...        8.9 GB   2 days ago
llama3:latest              8a-...        4.7 GB   2 weeks ago
qwen3:14b                  2c-...        8.2 GB   4 hours ago
```

### `ollama rm` — Delete a model

```bash
ollama rm qwen3:14b
```

Frees the disk space immediately.

### `ollama show` — Inspect a model

```bash
ollama show llama3
```

Prints the model's metadata: architecture, parameter count, quantization, context window, the default system prompt, and license info. Useful for understanding exactly which weights you're running.

### `ollama ps` — List running models

```bash
ollama ps
```

Shows models currently loaded in memory. Models auto-unload after a few minutes of inactivity (configurable) to free RAM.

---

## REST API: `/api/generate` and `/api/chat`

Ollama exposes a REST API on port `11434`. You can call it from any language or HTTP client — perfect for integrating LLMs into your own scripts and apps.

### `/api/generate` — One-shot completion

A single prompt, single response:

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "List three ways to optimize a Python loop.",
  "stream": false
}'
```

`stream: false` returns the full response as one JSON object. With `stream: true` (the default), tokens come back as newline-delimited JSON objects, perfect for a streaming UI.

Response:

```json
{
  "model": "llama3",
  "response": "1. Use list comprehensions...\n2. Move work into C via NumPy...\n3. Avoid attribute lookups in hot loops...",
  "done": true,
  "total_duration": 1845000000,
  "prompt_eval_count": 32,
  "eval_count": 58
}
```

### `/api/chat` — Multi-turn conversation

For chat apps with system / user / assistant messages:

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3",
  "messages": [
    {"role": "system", "content": "You are a friendly senior backend engineer."},
    {"role": "user", "content": "What is the easiest way to add rate limiting to an Express app?"}
  ],
  "stream": false
}'
```

Roles follow the OpenAI convention (`system`, `user`, `assistant`, `tool`), so existing chat UIs and libraries work without changes.

### Calling from Python

```python
import requests

resp = requests.post(
    "http://localhost:11434/api/chat",
    json={
        "model": "llama3",
        "messages": [
            {"role": "system", "content": "You are a helpful coding assistant."},
            {"role": "user", "content": "Write a Python decorator that caches results."},
        ],
        "stream": False,
    },
)
data = resp.json()
print(data["message"]["content"])
```

### Calling from JavaScript

```typescript
const response = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    model: "llama3",
    messages: [{ role: "user", content: "Summarize the plot of Hamlet in one paragraph." }],
    stream: false,
  }),
});
const data = await response.json();
console.log(data.message.content);
```

For OpenAI-compatible code, set the base URL to `http://localhost:11434/v1` — Ollama ships an OpenAI-compatible endpoint.

---

## Open WebUI Integration

`ollama run` is great for the terminal, but most users want a polished chat interface with conversation history, file uploads, multi-user support, and RAG. **Open WebUI** is a drop-in open-source frontend for Ollama that looks and feels like ChatGPT.

### Deploy with Docker

```yaml
# open-webui.yml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    restart: unless-stopped
    ports:
      - "3000:8080"
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
    volumes:
      - ./open-webui-data:/app/backend/data
```

If Ollama is running on the host (not in a container), use `host.docker.internal:11434` on Docker Desktop. On Linux, use `--network=host` instead, or set `OLLAMA_BASE_URL=http://<host-ip>:11434`.

Bring it up:

```bash
docker compose -f open-webui.yml up -d
```

Open `http://localhost:3000`. The first user you create becomes the admin.

### Features you get for free

- **Multiple chat sessions** with persistence.
- **Model picker** — every model installed in Ollama appears in a dropdown.
- **RAG over documents** — upload PDFs, code, or text and the model answers questions grounded in them.
- **Multi-user** with role-based access.
- **Markdown rendering + code highlighting** with copy buttons.
- **Web search** integration (optional, requires a search API key).
- **OpenAI-compatible API** at `/v1` — use it as a drop-in replacement for OpenAI in any tool that supports custom endpoints.

---

## Hardware Requirements: RAM by Model Size

The single most important resource for LLM inference is **memory bandwidth**, not compute. A model with `N` billion parameters, quantized to 4 bits, takes roughly `N / 2` GB of memory. To run it at a comfortable speed you want at least **1.2×** that amount free on your machine.

### Memory tiers

| Model size | Min RAM (CPU) | Min VRAM (GPU) | Typical tokens/sec |
| --- | --- | --- | --- |
| 1.5B (phi3-mini, deepseek-r1:1.5b) | 4 GB | 2 GB | 30-80 |
| 7-8B (llama3, qwen3:7b) | 8 GB | 6 GB | 20-60 |
| 13-14B (deepseek-r1:14b, qwen3:14b) | 16 GB | 12 GB | 10-40 |
| 32B (qwen3:32b) | 32 GB | 24 GB | 5-20 |
| 70B (llama3:70b, qwen3:72b) | 64 GB | 48+ GB | 3-15 |
| 671B (deepseek-r1:671b) | 400+ GB | Multi-GPU | 1-5 |

### CPU inference

A modern laptop CPU (Intel 12th-gen+, Apple M2, AMD Zen 4+) runs 7-8B models at 10-30 tokens/sec — usable for chat. 14B+ becomes painful without a GPU.

### Apple Silicon

M1/M2/M3/M4 Macs are **excellent** for local LLMs because their unified memory has very high bandwidth and Ollama uses Metal automatically. An M2 Max with 64 GB runs `llama3:70b` at ~10 tokens/sec — comfortably usable.

### NVIDIA GPUs

CUDA is the best-supported acceleration path. Useful tiers:

- **8 GB VRAM** (RTX 3060, 4060) — runs 7-8B models comfortably.
- **12-16 GB VRAM** (RTX 3060 12GB, 4070 Ti, 4080) — runs 13-14B models.
- **24 GB VRAM** (RTX 3090, 4090) — runs 32B models, or 70B with offloading.
- **48-80 GB VRAM** (A6000, H100) — runs 70B at full speed.

### AMD / Intel GPUs

Ollama supports AMD ROCm on Linux for RDNA2/RDNA3 cards, and Intel GPU support via oneAPI / SYCL is improving. For Windows + AMD, the experience is still uneven; consider CPU inference or an NVIDIA card for production workloads.

---

## Tips: Modelfile, System Prompts, Temperature

### The Modelfile

The Modelfile is Ollama's equivalent of a Dockerfile — it lets you customize a model's behavior, system prompt, and parameters, then save it as a new model.

Example `Modelfile`:

```dockerfile
# Start from an existing model
FROM llama3

# Set a custom system prompt
SYSTEM """
You are a meticulous proofreader. You return the user's text with typos fixed,
no other changes. You never add commentary.
"""

# Tune generation parameters
PARAMETER temperature 0.2
PARAMETER num_ctx 8192
PARAMETER stop "<|end|>"
```

Build and run:

```bash
ollama create proofreader -f Modelfile
ollama run proofreader
```

The new model `proofreader` is now in `ollama list`. Under the hood it's the original llama3 weights plus your config — no duplication of the 4.7 GB download.

### Useful parameters

- `temperature` — 0 = deterministic, 1 = creative. Use 0.1-0.3 for code and facts, 0.7+ for brainstorming.
- `top_p` and `top_k` — sampling cutoffs; defaults (0.9, 40) are fine.
- `num_ctx` — context window in tokens. Larger = more context but slower and more memory. Llama 3 supports up to 128K, Qwen 3 supports up to 128K.
- `num_predict` — max tokens to generate.
- `repeat_penalty` — discourages repetition (default 1.1).
- `stop` — stop sequences.

### Embeddings for RAG

Ollama also serves embedding models:

```bash
ollama pull nomic-embed-text
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "The quick brown fox jumps over the lazy dog."
}'
```

Returns a 768-dim vector. Use it with a vector DB (Chroma, Qdrant, pgvector) to build RAG pipelines where retrieval happens locally.

---

## Ollama vs LM Studio vs text-generation-webui vs vLLM

| Feature | Ollama | LM Studio | text-generation-webui | vLLM |
| --- | --- | --- | --- | --- |
| Platform | Mac, Win, Linux | Mac, Win, Linux | Linux (Docker on others) | Linux server |
| UI | CLI + REST API | Beautiful desktop GUI | Web UI | Headless |
| Open source | Yes (MIT) | Closed | Yes | Yes |
| Model format | GGUF | GGUF, GGML, safetensors | GGUF, safetensors | safetensors |
| GPU accel | Metal, CUDA, ROCm | Metal, CUDA, ROCm | CUDA, ROCm, CPU | CUDA only |
| OpenAI-compatible API | Yes | Yes | Yes | Yes |
| Production-ready | Single user / dev | Single user / dev | Hobbyist | Yes, multi-tenant |
| Best for | Local dev & apps | Personal desktop use | Tinkerers | Production serving |

- **Ollama** is the sweet spot for local development: tiny install, single command, clean API, broad model library.
- **LM Studio** wins for users who want a graphical desktop app and don't need an API.
- **text-generation-webui** is the kitchen sink — supports the most formats, exposes the most knobs, but is more complex.
- **vLLM** is the choice for production multi-user serving on a GPU server; it does PagedAttention and continuous batching for high throughput.

For most developers and self-hosters, Ollama + Open WebUI is the recommended starting point.

---

## Summary

Ollama makes running local LLMs as easy as `docker run`. In this guide you learned how to:

1. **Understand what Ollama is** — a one-binary runtime for local LLM inference, with privacy and zero API costs.
2. **Install** on Windows, macOS, and Linux.
3. **Run your first model** — `ollama run llama3` and the interactive prompt commands.
4. **Pick from popular models** — Llama 3, Qwen 3, DeepSeek, Mistral, Phi, Gemma.
5. **Manage models** with `pull`, `list`, `rm`, `show`, and `ps`.
6. **Call the REST API** with `curl`, Python, and JavaScript.
7. **Deploy Open WebUI** for a polished, multi-user, RAG-capable chat frontend.
8. **Pick the right hardware** for 7B / 14B / 32B / 70B / 671B models, with notes on Apple Silicon, NVIDIA, AMD, and Intel.
9. **Customize models** with the Modelfile, system prompts, and parameters.
10. **Compare Ollama to LM Studio, text-generation-webui, and vLLM** to pick the right tool for your use case.

The next step is to install Ollama, pull a 7B model, and start a conversation. You'll be talking to a model that runs entirely on your own hardware within minutes — and once you've felt that, going back to per-token billing is hard. If you found this guide useful, you might also enjoy our tutorials on [Ubuntu Server initial setup](/en/articles/ubuntu-server-setup) and [Immich self-hosted photo backup](/en/articles/immich-photo-backup). Happy prompting! 🦙
