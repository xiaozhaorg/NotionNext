---
title: Ollama 本地部署大模型完全指南：5分钟跑起 Llama 3 / Qwen 3 / DeepSeek
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Ollama 是最简单的本地大模型运行工具。本文详解三大系统安装、模型下载与管理、REST API 调用、Open WebUI 集成、按显存选型，以及 Modelfile 自定义系统提示词。
author: 小吒
tags:
  - AI
  - 大模型
  - 教程
  - 免费工具
draft: false
sourceUrl: "https://xiaozha.org/article/ollama-local-llm"
ogImage: "/images/ollama-local-llm-real.jpg"
coverAlt: "发光的 AI 芯片与电路板特写，象征大模型算力"
enSlug: "ollama-local-llm"
---

把大模型跑在自己机器上，以前是件麻烦事：装 CUDA、配环境、转格式、调量化。**Ollama** 把这件事压缩成一条命令。

这篇覆盖安装、跑通第一个模型、模型管理、API 调用、配 Web UI，以及按自己硬件选型的建议。

## Ollama 是什么

Ollama 是一个本地大模型运行时，把模型下载、量化、推理、API 服务全打包在一起。你不需要懂 GGUF 格式，不需要手动配 CUDA，甚至不需要写一行代码——装好、拉模型、对话。

适合谁：想让数据不出本机的开发者、想白嫖本地算力的人、想给应用接个本地 AI 的人。

## 安装

### macOS

官网下载 `.app` 拖进应用程序，或者：

```bash
brew install ollama
```

Apple Silicon 芯片自动走 Metal 加速，M 系列跑 8B 模型很流畅。

### Windows

从官网下载安装包：https://ollama.com/download

装完 Ollama 会在托盘运行。Windows 上默认用 CPU 或 Vulkan，有 NVIDIA 卡会自动用 CUDA。

### Linux

一条命令：

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

装完验证：

```bash
ollama version
# ollama version is 0.x.x
```

Ollama 默认监听 `11434` 端口。只想本机用不用改；想让局域网其他机器访问：

```bash
# Linux（systemd）
sudo systemctl edit ollama.service
```

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
```

```bash
sudo systemctl restart ollama
```

**注意**：`0.0.0.0` 会让同网段任何人都能调用你的模型，公网部署必须加反向代理 + 认证。

## 跑通第一个模型

```bash
ollama run qwen3:8b
```

第一次执行会自动下载（几 GB，看网速），下完直接进入对话：

```
>>> 你好，请用一句话介绍你自己
您好，我是通义千问……
```

输入 `/bye` 退出，`/?` 看所有交互命令。

到这里，本地大模型已经跑起来了。整个流程就是一条命令。

## 可选模型

| 模型 | 定位 | 大小 |
|---|---|---|
| `qwen3` | 通用 + 中文强 | 0.6B ~ 235B |
| `llama3.1` / `llama3.2` | Meta 出品，英文强 | 1B ~ 405B |
| `deepseek-r1` | 推理强，思维链 | 1.5B ~ 671B |
| `deepseek-coder-v2` | 代码专用 | 16B ~ 236B |
| `gemma3` | Google 出品，轻量 | 1B ~ 27B |
| `mistral` / `mixtral` | 欧洲系，MoE | 7B ~ 8x22B |
| `phi4` | 微软小钢炮，3.8B 打 7B | 3.8B / 14B |
| `nomic-embed-text` | 向量嵌入（RAG 用） | 0.27B |

选型口诀：**中文优先 qwen3，代码优先 deepseek-coder-v2，极小显存用 phi4**。

具体标签看 [ollama.com/library](https://ollama.com/library)，每个模型页都写了推荐参数。

## 模型管理

```bash
ollama pull qwen3:8b        # 下载模型
ollama list                 # 看已安装的模型和占用
ollama show qwen3:8b        # 看模型详情、参数、模板
ollama ps                   # 看正在运行的模型
ollama rm qwen3:8b          # 删除模型
ollama cp qwen3:8b my-qwen  # 复制一份改配置用
```

模型默认存在 `~/.ollama/models`，几个模型轻松吃掉几十 GB。空间紧张时把不用的 `rm` 掉，需要再 `pull`。

## REST API

Ollama 起服务的同时就开了 API，默认 `http://localhost:11434`。

### `/api/generate` — 单轮补全

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3:8b",
  "prompt": "用一句话解释什么是内网穿透",
  "stream": false
}'
```

### `/api/chat` — 多轮对话

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3:8b",
  "messages": [
    {"role": "system", "content": "你是一个简洁的技术助手"},
    {"role": "user", "content": "Cloudflare Tunnel 是什么？"}
  ],
  "stream": false
}'
```

### Python 调用

```python
import requests

r = requests.post("http://localhost:11434/api/chat", json={
    "model": "qwen3:8b",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": False,
})
print(r.json()["message"]["content"])
```

用官方 SDK 更省事：

```python
from ollama import chat
resp = chat(model="qwen3:8b", messages=[{"role": "user", "content": "你好"}])
print(resp.message.content)
```

### JavaScript 调用

```javascript
const res = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "qwen3:8b",
    messages: [{ role: "user", content: "你好" }],
    stream: false,
  }),
});
const data = await res.json();
console.log(data.message.content);
```

### OpenAI 兼容接口

Ollama 还提供 `/v1/chat/completions`，**任何支持 OpenAI SDK 的代码都能零改动接过来**，只要把 base_url 指到 Ollama：

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
resp = client.chat.completions.create(
    model="qwen3:8b",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)
```

这个兼容层很实用——大量现成工具（NextChat、Chatbox、各种 IDE 插件）填个地址就能用。

## Open WebUI：给它一个 ChatGPT 界面

命令行对话不够好用，装个 Web UI：

```yaml
# docker-compose.yml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    restart: unless-stopped
    ports:
      - "3000:8080"
    volumes:
      - open-webui-data:/app/backend/data
    extra_hosts:
      - "host.docker.internal:host-gateway"

volumes:
  open-webui-data:
```

```bash
docker compose up -d
```

访问 `http://localhost:3000`，注册账号，在设置里把 Ollama 地址填 `http://host.docker.internal:11434`，模型列表就出来了。

白送的功能：多用户、对话历史、知识库（RAG）、文档上传问答、模型切换、参数调节。想要团队用或自己用得舒服，装这个。

## 硬件要求：按模型大小选

| 模型规模 | 内存/显存 | 体验 |
|---|---|---|
| 1B – 3B | 4 GB | 快，但能力有限，适合分类、提取 |
| 7B – 8B | 8 GB | **甜点区间**，日常问答、写代码够用 |
| 13B – 14B | 16 GB | 明显更聪明，需要好一点的卡 |
| 32B | 24 GB | 接近商业模型水平 |
| 70B | 40 GB+ | 消费级基本别想，上服务器 |

### 各平台情况

- **CPU**：能跑，慢。8B 模型生成速度大概每秒几个 token，勉强能用
- **Apple Silicon**：统一内存，M 系列 Pro/Max 跑 8B 很舒服，速度取决于内存带宽
- **NVIDIA**：最优先。8GB 显存跑 8B 量化模型刚好，12GB 能上 14B
- **AMD / Intel 显卡**：Ollama 支持 Vulkan，能用但比 NVIDIA 慢一截

量化模型（Q4_K_M 之类）是默认选项，已经把显存需求砍到原版的六成左右，画质损失很小。

## 进阶：Modelfile 自定义

想固定系统提示词、调参数，不用改代码，写个 Modelfile：

```dockerfile
FROM qwen3:8b

SYSTEM """你是一个资深后端工程师，回答必须：
1. 直接给结论，不说客套话
2. 代码示例必须能直接运行
3. 不确定时明说不知道
"""

PARAMETER temperature 0.3
PARAMETER num_ctx 8192
PARAMETER top_p 0.9
```

```bash
ollama create my-coder -f Modelfile
ollama run my-coder
```

常用参数：

| 参数 | 作用 | 建议 |
|---|---|---|
| `temperature` | 随机性 | 写代码 0.2-0.4，创意 0.7-1.0 |
| `num_ctx` | 上下文长度 | 默认 2048 太小，设 8192+ |
| `top_p` | 采样范围 | 0.9 通用 |
| `repeat_penalty` | 重复惩罚 | 1.1 左右 |

### 做 RAG 用嵌入模型

```bash
ollama pull nomic-embed-text
```

配合向量数据库就能做文档问答。本地 RAG 的完整链路：嵌入模型 + Chroma/Qdrant + Open WebUI 的知识库功能，不需要写代码。

## Ollama 和其他工具对比

| | Ollama | LM Studio | text-generation-webui | vLLM |
|---|---|---|---|---|
| 上手难度 | 极简 | 极简（GUI） | 中等 | 较难 |
| 部署方式 | CLI + 服务 | 桌面 App | Web UI | 服务端 |
| API | 完整，OpenAI 兼容 | 兼容 | 兼容 | OpenAI 兼容 |
| 多模型并发 | 弱 | 弱 | 弱 | **强** |
| 生产环境 | 个人/小团队 | 个人尝鲜 | 个人 | 企业级 |

选型：**自己用选 Ollama**；完全不想碰命令行选 LM Studio；要给生产服务做高并发推理选 vLLM。

## 小结

Ollama 的核心价值是**把本地大模型的门槛降到一条命令**。五分钟跑起来不是夸张——装、拉模型、对话，就这三步。

真正花时间的是后面：按硬件选对模型、用 Modelfile 调教系统提示词、接 Web UI。这些做完，你就有了一个完全免费、数据不出本机、不被限额的 AI 助手。

如果想让本地模型有 ChatGPT 那样的完整体验，接着看《NextChat 部署指南》；想接进编程工作流，看《Cline 实战》里本地模型那部分。
