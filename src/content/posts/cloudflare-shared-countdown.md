---
title: 零成本搭建共享倒计时器｜Cloudflare Pages 实战
pubDatetime: "2026-09-09T00:00:00.000Z"
description: 使用 Cloudflare Pages 部署在线共享倒计时器，支持多人同步查看剩余时间，适合活动倒计时、任务计时、会议提醒等场景。
author: 小吒
tags:
  - Cloudflare
  - 免费工具
  - 项目实战
featured: false
draft: false
sourceUrl: ""
ogImage: "/images/cloudflare-shared-countdown-real.webp"
coverAlt: "倒计时器界面显示剩余时间"
enSlug: "cloudflare-shared-countdown"
---

团队协作、活动筹备、考试冲刺……很多时候需要一个多人同步的倒计时工具。

市面上的倒计时 App 要么要注册，要么不支持共享。今天用 Cloudflare Pages 搭一个共享倒计时器，创建计时后生成专属链接，多人同步查看，零成本。

## 使用场景

- **活动倒计时**：年会、团建、发布会前的倒计时
- **任务计时**：团队冲刺某个 Deadline
- **考试提醒**：重要考试前的倒计时分享
- **生日派对**：活动开始前的倒计时
- **项目上线**：产品发布前的倒计时

## 功能设计

核心功能很简单：

| 功能 | 说明 |
|------|------|
| 创建计时 | 设置目标时间和标题 |
| 生成链接 | 专属链接，分享给他人 |
| 多人同步 | 多个设备同时查看同一个倒计时 |
| 自动刷新 | 页面自动更新剩余时间 |
| 到期提醒 | 倒计时结束时弹窗提醒 |

## 技术实现

### 项目结构

```
shared-countdown/
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

### 核心逻辑

用 URL 参数传递计时信息：

```
https://your-site.com/countdown?target=2026-12-31T00:00:00&title=新年倒计时
```

页面加载时解析参数，启动倒计时：

```javascript
function initCountdown() {
  const params = new URLSearchParams(window.location.search);
  const target = new Date(params.get('target'));
  const title = params.get('title');
  
  setInterval(() => {
    const now = new Date();
    const diff = target - now;
    updateDisplay(diff, title);
  }, 1000);
}
```

### 时间显示

把剩余时间格式化为天、时、分、秒：

```javascript
function formatTime(ms) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}
```

## 部署步骤

### 第一步：创建项目

把代码推送到 GitHub。

### 第二步：连接 Cloudflare Pages

1. 进入 Cloudflare Pages
2. 选择「Create a project」
3. 连接 GitHub 仓库
4. 构建配置选 Static，输出目录填 `/`
5. 部署

### 第三步：测试分享

部署完成后，创建一个倒计时，复制链接分享给朋友，看看多人同步效果。

## 进阶优化

### 1. 视觉效果

- 倒计时数字做大、做醒目
- 支持自定义主题颜色
- 添加粒子动画效果

### 2. 到期通知

倒计时结束时：
- 播放提示音
- 弹窗通知
- 震动提醒（移动端）

### 3. 历史记录

用 localStorage 保存用户创建过的倒计时，方便快速访问。

### 4. 多时区支持

自动检测用户时区，显示本地时间的倒计时。

## 避坑指南

1. **时间同步**：不同设备的系统时间可能有差异，用服务器时间校准
2. **链接有效期**：设置合理的倒计时范围，避免生成超长链接
3. **移动端适配**：手机上要能正常显示，触摸操作要友好
4. **性能优化**：只在页面可见时更新，隐藏时暂停

## 总结

共享倒计时器是一个实用的小工具，制作简单但使用场景很多。用 Cloudflare Pages 部署，零成本、秒上线。

做好 SEO 后，活动倒计时类搜索词能带来不少流量。
