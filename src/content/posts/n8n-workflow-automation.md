---
title: n8n 自托管工作流自动化：Zapier 的开源替代，连接一切应用
pubDatetime: "2026-07-21T00:00:00.000Z"
description: n8n 是开源的工作流自动化工具，400+ 集成，可视化拖拽搭建工作流，本文详解 Docker 部署、常见场景、实战模板。
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

n8n 是开源的工作流自动化工具，比 Zapier 便宜 100 倍，功能却不输。

## 一、什么是 n8n

- 开源、免费（自托管）
- 400+ 应用集成
- 可视化拖拽编辑
- 支持自定义代码
- 支持 AI 节点

## 二、Docker 部署

最简单的方式是用 Docker Compose：

```yaml
version: "3.8"

services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=your-n8n-domain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - GENERIC_TIMEZONE=Asia/Shanghai
    volumes:
      - ~/.n8n:/home/node/.n8n
```

```bash
docker compose up -d
```

打开 `http://localhost:5678` 即可开始使用。

## 三、典型工作流

### 1. RSS 自动推送

抓取 RSS → AI 摘要 → 推送到 Telegram

### 2. 表单自动回复

网站表单 → 数据库存储 → 自动邮件回复 → 通知到 Slack

### 3. 定时数据备份

定时触发 → 备份数据库 → 上传云存储 → 通知管理员

### 4. AI 客服

客户消息 → AI 处理 → 自动回复 → 复杂问题转人工

## 四、内置节点

- **触发器**：定时、Webhook、邮件、IM
- **数据处理**：Filter、Set、Code、Merge
- **AI**：OpenAI、Claude、Hugging Face
- **数据库**：MySQL、PostgreSQL、MongoDB
- **通讯**：Email、Slack、Telegram、微信
- **存储**：S3、Google Drive、Dropbox

## 五、实战：RSS → Telegram 推送

1. 添加 **RSS Trigger** 节点，输入 RSS 源 URL
2. 添加 **Function** 节点，处理数据格式
3. 添加 **HTTP Request**，调用 AI API 生成摘要
4. 添加 **Telegram** 节点，配置 Bot Token 和 Chat ID

## 六、定价对比

| 工具 | 价格 | 任务数 |
|------|------|--------|
| **n8n 自托管** | **免费** | **无限** |
| n8n 云 | €20/月 | 10000 |
| Zapier | $19.99/月 | 750 |
| Make | $9/月 | 10000 |
