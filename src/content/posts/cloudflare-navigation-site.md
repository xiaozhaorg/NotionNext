---
title: 零成本搭建个人导航站｜Cloudflare Pages + WebStack 完整指南
pubDatetime: "2026-09-09T00:00:00.000Z"
description: 使用 Cloudflare Pages 零成本部署 WebStack 开源导航站，无需服务器，支持自定义域名，适合收藏整理常用网站。
author: 小吒
tags:
  - Cloudflare
  - 开源项目
  - 教程
featured: false
draft: false
sourceUrl: ""
ogImage: "/images/cloudflare-navigation-site-real.webp"
coverAlt: "浏览器导航页面截图展示多分类网站链接"
enSlug: "cloudflare-navigation-site"
---

收藏夹里的网站越来越多，找起来越来越麻烦。AI 工具、在线工具、开发资源混在一起，效率很低。

与其继续整理收藏夹，不如自己搭一个导航站。今天用 Cloudflare Pages + WebStack，零成本搞定。

## 为什么要做个人导航站？

- **集中管理**：所有常用网站一个页面搞定
- **随时访问**：任何设备打开浏览器就能用
- **可定制**：按自己的习惯分类，想加就加
- **零成本**：不需要买服务器，Cloudflare Pages 免费托管
- **可分享**：生成链接后，团队或朋友都能用

## 技术方案

用的是开源项目 **WebStack**，这是一个纯静态的导航站模板：

- **无需后端**：纯 HTML/CSS/JS，不需要数据库
- **响应式设计**：手机、电脑、平板都能正常显示
- **分类管理**：支持多级分类，方便整理
- **搜索功能**：内置站内搜索，快速找到目标网站

## 部署步骤

### 第一步：Fork 项目

1. 访问 WebStack 的 GitHub 仓库
2. 点击 Fork，把项目复制到自己的 GitHub 账号下
3. 仓库名可以改成你喜欢的，比如 `nav`

### 第二步：配置 Cloudflare Pages

1. 登录 Cloudflare Dashboard
2. 进入 Pages，点击「Create a project」
3. 选择「Connect to Git」，授权 GitHub
4. 选择刚才 Fork 的仓库

构建配置：

- **Framework preset**：选择 Static
- **Build command**：留空
- **Build output directory**：填 `/`

点击部署，几十秒后就能访问了。

### 第三步：自定义内容

默认的导航链接肯定不是你想要的，需要修改配置文件。

打开项目中的 `config.json`（或类似配置文件），按格式添加你自己的网站：

```json
{
  "categories": [
    {
      "name": "AI 工具",
      "icon": "🤖",
      "links": [
        {
          "name": "ChatGPT",
          "url": "https://chat.openai.com",
          "description": "OpenAI 对话助手"
        }
      ]
    }
  ]
}
```

修改后推送到 GitHub，Cloudflare Pages 会自动重新部署。

### 第四步：绑定自定义域名

如果有自己的域名：

1. 在 Pages 项目设置中进入「Custom domains」
2. 输入域名，按提示添加 DNS 记录
3. 等待 DNS 生效，几分钟内就能通过域名访问

## 内容分类建议

一个好的导航站需要合理的分类结构：

| 分类 | 说明 |
|------|------|
| AI 工具 | ChatGPT、Claude、Midjourney 等 |
| 开发工具 | GitHub、VS Code、文档站点 |
| 在线工具 | 格式转换、图片处理、计算器 |
| 设计资源 | Figma、图标库、配色工具 |
| 学习平台 | 在线课程、技术博客 |
| 常用服务 | 邮箱、云盘、社交媒体 |

根据自己的实际需求调整，不需要一开始就加太多。

## 进阶玩法

基础版搭好后，可以考虑这些升级：

### 1. 添加搜索功能

在页面顶部加一个搜索框，用 JavaScript 实现站内搜索，方便快速定位。

### 2. 导入浏览器书签

从浏览器导出书签文件，写个脚本自动解析并生成导航数据，省去手动录入的麻烦。

### 3. 多人协作

如果团队一起用，可以把配置文件放在共享仓库，多人共同维护。

### 4. 数据统计

接入 Cloudflare Analytics 或 Umami，看看哪些网站被点击最多，优化分类。

## 避坑指南

搭建过程中可能遇到的问题：

1. **部署后白屏**：检查构建输出目录是否正确，静态站点一般填 `/` 或 `.`
2. **样式错乱**：可能是 CSS 文件路径问题，检查配置中的路径设置
3. **搜索不生效**：确认 JavaScript 文件正确加载，检查浏览器控制台是否有报错
4. **移动端显示异常**：确保使用的模板支持响应式，或者手动添加媒体查询

## 总结

用 Cloudflare Pages 搭建个人导航站，零成本、零维护、随时访问。比浏览器收藏夹更高效，比第三方导航站更自由。

花半小时搭一个，以后找网站再也不用翻收藏夹了。
