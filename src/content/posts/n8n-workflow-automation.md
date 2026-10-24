---
title: n8n 自托管工作流自动化：Zapier 的开源替代，连接一切应用
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: n8n 是开源的工作流自动化工具，400+ 集成，可视化拖拽搭建工作流。本文详解核心概念、PostgreSQL + Redis 的 Docker 部署、备份策略、三个完整实战场景、执行模式与安全加固。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/n8n-workflow-automation"
ogImage: "/images/n8n-workflow-automation-real.jpg"
coverAlt: "办公桌上笔记本电脑与数据图表的工作场景"
enSlug: "n8n-workflow-automation"
---

你大概率用过 Zapier："收到邮件 → 在表格里加一行"。挺好用——直到撞上免费版 100 次任务的上限，或者开始琢磨：为什么我业务的每条数据都要流经一个第三方 SaaS？

**n8n** 是这件事的开源答案：400+ 应用集成、可视化拖拽编排、支持自己写代码节点，而且自托管免费无限次执行。

这篇从核心概念讲到生产部署和三个完整实战场景。

## n8n 是什么

n8n（读作 "n-eight-n"）是一个工作流自动化平台。你把"触发器 + 一系列处理节点"用线连起来，数据顺着线流动，每个节点做一件事。

和 Zapier 的关系：**同一个品类，n8n 是开源自托管版**。

| | Zapier | n8n 自托管 |
|---|---|---|
| 费用 | 免费版 100 任务/月，付费 $19.99 起 | 免费，无限执行 |
| 工作流数量 | 免费 5 个，付费 50 个 | 无限 |
| 数据流向 | 经过 Zapier 服务器 | 全在自己机器 |
| 自定义代码 | 有限 | 任意 JavaScript/Python |
| 集成数量 | 5000+ | 400+（但可自己写） |

**选 n8n 的理由**：执行次数不值钱（Zapier 的任务数是最容易超的）、数据不想过第三方、需要写代码做定制处理。
**选 Zapier 的理由**：集成数量碾压、不想维护任何东西、愿意为省事付钱。

## 核心概念

### 节点（Node）

工作流的最小单位，一个方框做一件事。分三类：

- **触发器**：工作流的起点。定时、Webhook、收到邮件、表单提交
- **常规节点**：处理数据。HTTP 请求、数据库读写、过滤、格式转换
- **AI 节点**：调大模型。OpenAI、Claude、Hugging Face，或者接本地 Ollama

### 工作流（Workflow）

一堆节点连成的图。画布上看得很清楚：数据从左边进，经过处理，从右边出。

### 触发器类型

| 类型 | 说明 |
|---|---|
| **Schedule** | cron 定时，比如每天早上 8 点 |
| **Webhook** | 外部系统 POST 一个 URL 触发，最常用 |
| **Manual** | 手动点"执行" |
| **App Event** | 某个应用里发生事件（新邮件、新 Issue） |

### 凭证（Credentials）

n8n 把 API Key、Token、密码集中管理。你配一次，多个工作流复用，不用在每个节点里硬编码密钥。

## Docker Compose 部署

生产环境别用默认的 SQLite——**并发一高就锁库**。用 PostgreSQL + Redis。

### 目录与 `.env`

```
/opt/n8n/
├── .env
├── docker-compose.yml
└── data/          # n8n 数据
```

`.env`：

```bash
# n8n
N8N_HOST=n8n.example.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.example.com/
GENERIC_TIMEZONE=Asia/Shanghai
# 关闭新手引导和个性化推荐
N8N_DIAGNOSTICS_ENABLED=false
N8N_PERSONALIZATION_ENABLED=false

# Postgres
POSTGRES_USER=n8n
POSTGRES_PASSWORD=换成随机强密码
POSTGRES_DB=n8n

# Redis
REDIS_PASSWORD=再换一个随机强密码
```

`WEBHOOK_URL` 必须填对——Webhook 触发器的回调地址靠它生成，填错的话外部系统找不到你的 n8n。

### `docker-compose.yml`

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=${N8N_PORT}
      - N8N_PROTOCOL=${N8N_PROTOCOL}
      - WEBHOOK_URL=${WEBHOOK_URL}
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - N8N_DIAGNOSTICS_ENABLED=${N8N_DIAGNOSTICS_ENABLED}
      - N8N_PERSONALIZATION_ENABLED=${N8N_PERSONALIZATION_ENABLED}
      # 数据库与队列
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      # Redis 队列模式，多 worker 并行执行
      - QUEUE_MODE=redis
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      - QUEUE_BULL_REDIS_PASSWORD=${REDIS_PASSWORD}
      # 加密密钥，工作流里的凭证靠它加密，丢了所有凭证要重配
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
    volumes:
      - ./data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

`N8N_ENCRYPTION_KEY` 要用 `openssl rand -hex 32` 生成，**填进 `.env` 后永远别再改**——所有工作流里的凭证都用它加密，改了等于全部凭证作废。

```bash
cd /opt/n8n
docker compose up -d
docker compose logs -f n8n
```

访问 `http://服务器IP:5678`，第一次进要注册管理员账号。

### 备份策略（别跳过）

n8n 的数据分两处：PostgreSQL 里的工作流定义和凭证，`./data` 目录里的文件。**凭证是加密的，但加密密钥在 `.env` 里——三个都要备。**

```bash
# 1. dump 数据库
docker exec n8n-postgres pg_dump -U n8n -d n8n | gzip > n8n-db-$(date +%F).sql.gz

# 2. 打包 .env 和 data
tar czf n8n-config-$(date +%F).tar.gz .env data/

# 3. 同步到异地（R2/B2）
rclone sync ./ r2:你的桶/n8n-backup/
```

恢复时：起空库 → 导入 SQL → 还原 `.env` 和 `data` → 启动。完整方案见《自托管数据备份完全指南》。

## 400+ 集成怎么用

按类别找你需要的：

| 类别 | 常见节点 |
|---|---|
| **通讯** | Telegram、Slack、Discord、Email、企业微信、钉钉 |
| **数据库** | PostgreSQL、MySQL、MongoDB、Redis |
| **存储** | Google Drive、Dropbox、S3、R2 |
| **开发** | GitHub、GitLab、Webhook、HTTP Request、SSH |
| **AI** | OpenAI、Anthropic、Hugging Face、Ollama |
| **办公** | Google Sheets、Notion、Airtable、飞书 |
| **触发** | Schedule、RSS、表单、邮件接收 |

**HTTP Request 节点是万能钥匙**——没有现成集成的服务，用它调 REST API 就行。

## 实战一：定时 RSS → Telegram

最经典的入门场景：每天抓一次博客更新，AI 生成摘要，推到 Telegram。

**需要的节点**：Schedule Trigger → RSS Read → OpenAI → Telegram

**搭建步骤**：

1. **Schedule Trigger**：设 `0 8 * * *`（每天早 8 点，服务器时区）
2. **RSS Read**：填 RSS 地址，比如 `https://xiaozha.org/rss.xml`。默认输出最新 N 条
3. **IF 节点**（可选）：过滤掉已经推过的——用一个 Set 节点记录上次最后一条的 GUID，比对跳过
4. **OpenAI 节点**：Model 选 `gpt-4o-mini`，Prompt 用 `{{ $json.title }}\n\n{{ $json.content }}` 让模型输出 50 字中文摘要
5. **Telegram 节点**：填 Bot Token 和 Chat ID，消息体用 `{{ $json.title }}\n\n{{ $json.summary }}`

**去重是关键**。不做去重的话每次执行都会把历史文章全推一遍。两种做法：

- 简单版：RSS Read 的 `Limit` 设 3，只取最新三条，配合 cron 每天一次，重复一两条可以接受
- 严谨版：加一个 Postgres 节点，建一张 `pushed_guids` 表，执行前查、执行后写

**Bonus：把 Telegram 换成邮件**，节点换成 `Send Email`，填 SMTP 配置，就是一个邮件 Newsletter 系统。

## 实战二：Webhook → 写入数据库

"网站表单提交 → 存数据库 → 通知我"。比用表单服务靠谱，数据在自己手里。

### Webhook 节点

拖一个 **Webhook** 节点，n8n 会给你一个 URL：

```
https://n8n.example.com/webhook/abc123-def456
```

HTTP Method 选 `POST`，Respond 选 `Immediately`（不等后续节点跑完就返回，表单体验更好）。

前端表单直接 POST 到这个地址：

```html
<form id="contact">
  <input name="name" required>
  <input name="email" required>
  <textarea name="message"></textarea>
  <button>提交</button>
</form>
<script>
document.getElementById('contact').addEventListener('submit', async (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  await fetch('https://n8n.example.com/webhook/abc123-def456', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(d),
  });
  alert('已收到');
});
</script>
```

### Postgres 节点

接一个 **Postgres** 节点，Operation 选 `Insert`，Table 填 `contact_messages`，Columns 映射：

```
name    ← {{ $json.body.name }}
email   ← {{ $json.body.email }}
message ← {{ $json.body.message }}
```

先建表：

```sql
CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**注意**：Webhook 节点输出的结构是 `{ headers, params, query, body }`，所以字段要取 `$json.body.xxx`，不是 `$json.xxx`。这是新手最容易卡住的地方。

### 端到端测试

Webhook 节点点 **Listen for test event**，然后用 curl 打一下：

```bash
curl -X POST https://n8n.example.com/webhook/abc123-def456 \
  -H "Content-Type: application/json" \
  -d '{"body":{"name":"测试","email":"t@t.com","message":"hello"}}'
```

n8n 画布上能看到数据流过每个节点，点任一节点都能检查它的输入输出——**调试比 Zapier 直观得多**。

再加一个 Telegram 或邮件节点在最后，提交表单就通知你。

## 实战三：AI 节点自动摘要

"抓文章 → AI 摘要 → 存档/通知"。

**流程**：Schedule → HTTP Request（抓文章 HTML）→ HTML Extract（取正文）→ OpenAI（摘要）→ Notion/Postgres（存档）

关键在 **HTML Extract** 节点：用 CSS Selector 取正文，比如 `article` 或 `.post-content`。取错了后面全是噪声。

OpenAI 节点的 Prompt 这样写效果稳定：

```
请用不超过 80 字概括下面文章的要点，直接输出摘要，不要客套话：

标题：{{ $json.title }}
正文：{{ $json.content }}
```

`Temperature` 设 0.3，摘要要的是稳定不是创意。

### 进阶：AI Agent

n8n 有 **AI Agent** 节点，能给模型挂工具（Tool）。比如一个"运维助手" agent，工具是"执行 SSH 命令"和"查询监控 API"，你用自然语言描述需求，它自己决定调哪个工具。

这是从"固定流程"跨到"自主决策"的一步，适合把重复的运维判断交给 AI。**但涉及生产环境的操作一定要加人工确认节点**——Agent 会犯错。

## 执行模式

n8n 有两种跑法，影响你看到的行为：

| 模式 | 说明 |
|---|---|
| **Regular** | 生产模式，用数据库里保存的激活工作流，Webhook 用 `WEBHOOK_URL` 那个地址 |
| **Manual** | 编辑时手动点执行，用于调试 |

**常见困惑**：改了工作流不生效。因为画布上方有个 **Active** 开关——没打开的工作流不会自动跑。保存 + 激活，两件事。

## 安全加固

自托管的 n8n 掌握着你所有服务的凭证，别裸奔：

**1. 别暴露到公网。** 家庭/内网用填 IP + 端口就行；要外网访问用 Cloudflare Tunnel 或 Tailscale，别直接开防火墙端口。

**2. 打开双重认证。** 设置 → Users → 你的用户 → Enable 2FA。n8n 支持 TOTP。

**3. 加密密钥保管好。** `N8N_ENCRYPTION_KEY` 丢了，所有凭证要重配。它和 `.env` 一起备份。

**4. Webhook 加认证。** 敏感工作流的 Webhook 节点，Header Auth 加一个自定义 Header 校验，防止别人猜到 URL 就乱调。

**5. 反向代理 + HTTPS。** 用 Caddy 最简单：

```caddy
n8n.example.com {
    reverse_proxy localhost:5678
}
```

或者走 Cloudflare Tunnel，不开放任何端口。方案对比见《Tailscale vs Cloudflare Tunnel》。

## n8n vs Zapier vs Make vs Node-RED

| | n8n | Zapier | Make | Node-RED |
|---|---|---|---|---|
| 费用 | 自托管免费 | $19.99/月起 | $9/月起 | 完全免费 |
| 执行次数 | 无限 | 按任务计费 | 按操作计费 | 无限 |
| 集成数 | 400+ | 5000+ | 1000+ | 500+（偏 IoT） |
| 可视化 | 节点画布 | 线性步骤 | 可视化场景 | 节点流 |
| 自定义代码 | 强 | 弱 | 中 | 强（JavaScript） |
| 数据归属 | 自己 | 服务商 | 服务商 | 自己 |
| 适合 | 要无限执行 + 数据自主 | 要最多集成 + 省事 | 中量自动化 | 物联网 / 硬件 |

**选 n8n**：执行次数会超免费额度、数据不能过第三方、需要写代码处理。
**选 Zapier**：集成覆盖是刚需、完全不想维护。
**选 Node-RED**：主要接硬件传感器、GPIO、MQTT。

## 小结

n8n 的核心价值：**把"无限次执行"和"数据在自己手里"同时给你**，这两点 Zapier 一个都不给。

上手路径：Docker Compose 起 PostgreSQL + Redis 版 → 先做定时 RSS → Telegram 建立信心 → 再试 Webhook 写数据库 → 最后玩 AI 节点。四个场景走完，你就知道该拿它自动化什么了。

部署细节配合《Docker Compose 入门到实战》，远程访问看《Tailscale vs Cloudflare Tunnel》，备份照《自托管数据备份完全指南》——n8n 里存着你所有服务的凭证，备份优先级比别的应用高一级。
