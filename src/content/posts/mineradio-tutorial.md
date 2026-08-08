---
title: Mineradio 音乐播放器教程（2026）：3D 立体歌词开源播放器，支持网易云 QQ 音乐同步
pubDatetime: "2026-07-29T00:00:00.000Z"
description: Mineradio 是一款完全开源免费的音乐播放器，支持网易云和 QQ 音乐登录同步歌单，3D 立体歌词 + 动态视觉切换，听歌体验远超普通播放器。
author: 小吒
tags:
  - 软件教程
  - 开源
  - 音乐播放器
  - Mineradio
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/mineradio-tutorial"
ogImage: "/images/mineradio-tutorial-real.jpg"
coverAlt: "MacBook 旁摆放着耳机与音乐播放器界面"
---

核心结论经过实际测试：

- Mineradio 是一款完全开源免费的音乐播放器，GitHub 快 9K Star
- 支持登录网易云和 QQ 音乐，歌单直接同步，不需要换平台
- 3D 立体歌词 + 动态视觉切换，听歌体验确实比普通播放器好很多
- 有两个版本：

联网版（在线播放）和本地版（纯本地文件播放）如果你想要一款界面好看、免费、支持主流音乐平台登录的播放器，Mineradio 值得一试。

🎯

适合：

追求播放器界面的用户 / 网易云、QQ 音乐用户 / 喜欢 3D 可视化效果的人群

--
-

### 什么是 Mineradio？

Mineradio 是一款开源的跨平台音乐播放器，基于 Electron 开发，支持 Windows 和 macOS。

它主要解决：

- 给用户提供高颜值的音乐播放界面，3D 立体歌词和动态视觉
- 支持登录网易云音乐和 QQ 音乐，歌单自动同步
- 完全免费、开源、无广告

### 为什么选择 Mineradio？

市面上免费开源的音乐播放器不少，但 Mineradio 有几个不一样的地方：

方案

3D 界面

网易云/QQ 登录

本地音乐

开源免费

Mineradio

✅ 立体歌词+3D 架构

✅ 支持

✅ 支持

✅

普通播放器

❌ 平面歌词

❌ 不支持

✅ 支持

看情况

网易云客户端

❌ 平面 UI

✅ 官方

❌ 仅在线

❌ 有广告

Mineradio 的优势在于：

它既保留了网易云和 QQ 音乐的歌单生态，又提供了完全不同的播放界面体验。

听歌的时候，3D 歌词和画面会跟着音乐自动切换，仪式感比普通播放器强很多。

--
-

### 🛠️ 准备工作
- Windows 或 macOS 电脑
- GitHub 访问权限
- 网易云或 QQ 音乐账号（联网版需要）⏱️

预计时间：5 分钟
难度：⭐

🚀 Mineradio 安装教程

#### 第一步：

下载安装包打开 Mineradio 的 `GitHub` 项目页面，点击右侧的 Releases，找到最新版本，下载对应系统的安装文件。

[github.comhttps://github.com/XxHuberrr/Mineradio](https://github.com/XxHuberrr/Mineradio)

#### 

第二步：

安装下载后双击安装，按提示完成。

安装完直接运行。

#### 

第三步：

登录账号（联网版）打开后界面非常有质感，点击右上角的登录，支持网易云音乐和 QQ 音乐。

点击后会自动跳转到官方的登录页面，播放器只是一个窗口，登录信息是安全的。

登录成功后，你的歌单会自动同步过来，可以直接在线播放。

#### 

第四步：

界面操作播放器界面是 3D 立体的，可以用鼠标拖动旋转视角。

播放音乐时，歌词也是 3D 立体显示，画面会跟随音乐节奏自动切换。

右下角可以调节界面布局、外观、歌词设置、动态效果等参数。

#### 

本地版（无需登录）GitHub 上还有一个二改版本，没有登录界面，直接导入本地音乐文件播放。

[github.comhttps://github.com/oirge/Mineradio](https://github.com/oirge/Mineradio)

安装方式一样，下载对应版本安装即可。

打开后可以直接拖入本地音乐文件夹或文件播放。

--
-

### 🎵 自定义歌词操作播放本地音乐时，播放器无法联网搜索歌词，需要手动添加。

- 在设置中找到歌词选项
- 下拉找到自定义歌词，点击进入
- 可以粘贴带时间轴的歌词（精确匹配），也可以粘贴纯文本歌词（按歌曲时长自动铺开）⚠️

提示：

AI 生成的时间轴歌词不一定完全匹配节奏，可能需要手动调整。

--
-

### 📊 我的测试体验测试环境：

Windows 10 / Mineradio 最新版 + 二改 v1.2.40

#### 

✅ 好的方面
- 界面确实好看，3D 立体歌词和动态视觉很惊艳
- 网易云和 QQ 音乐登录正常，歌单同步稳定
- 本地音乐分析功能不错（MR 分析 / 低阶分析）
- 完全免费无广告

#### ❌ 不足的地方
- 自定义歌词的时间轴匹配不够精确，需要手动调整
- 二改版本不能在线搜索歌曲，只能播本地文件
- 3D 界面对低配电脑可能稍微有负担--
-

### ❓ 常见问题 FAQ

#### Mineradio 免费吗？

完全免费，开源项目，GitHub 上可以直接下载，没有任何收费项目。

#### 

Mineradio 支持哪些音乐平台？

官方版本支持网易云音乐和 QQ 音乐的账号登录，登录后歌单会自动同步。

#### 

本地版和联网版有什么区别？

联网版需要登录网易云或 QQ 音乐，可以在线播放和同步歌单。

本地版是二改版本，无需登录，只能播放电脑本地的音乐文件。

#### 

Mineradio 可以自定义歌词吗？

可以。

播放本地音乐时，在设置 - 歌词 - 自定义中，可以粘贴带时间轴或不带时间轴的歌词。

带时间轴的会更精确，但实测 AI 生成的时间轴不一定完美匹配。

#### 

Mineradio 占用资源大吗？3D 界面会比普通播放器多消耗一些显卡资源，低配电脑上可能会有轻微卡顿。

普通配置的电脑日常使用没有问题。

--
-

### 📝 总结本文介绍了 Mineradio 开源音乐播放器的安装和使用方法。

通过实际测试：

- 3D 立体歌词和动态视觉效果很出色，普通播放器比不了
- 支持网易云和 QQ 音乐登录，歌单直接同步
- 联网版和本地版两个选择，覆盖不同使用场景如果你想要一款高颜值、免费、支持主流平台的音乐播放器，Mineradio 是一个很值得尝试的选择。

--
-

### 🔗 相关资源官方版本 GitHub：`https://github.com/XxHuberrr/Mineradio`

本地版本 GitHub：`https://github.com/oirge/Mineradio`

[上一篇Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）](/article/claude-code-tutorial)[下一篇IDM 安装激活完整教程（2026年最新）](/article/idm-activation-tutorial-2026)

[下一篇IDM 安装激活完整教程（2026年最新）](/article/idm-activation-tutorial-2026)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/mineradio-tutorial](https://xiaozha.org/article/mineradio-tutorial)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[IDM 安装激活完整教程（2026年最新）![image](/images/idm-activation-tutorial-2026-real.jpg)](/article/idm-activation-tutorial-2026)[Uptime Kuma 自建监控：

免费替代 UptimeRobot，漂亮又强大![image](https://xiaozha.org/images/uptime-kuma-monitor-cover.jpg?t=3a9c55d5-e9ea-813d-b32e-dc4fada13b4b)](/article/uptime-kuma-monitor)[自托管 20 个必备开源应用：

告别云服务订阅，掌控自己的数据![image](https://xiaozha.org/images/self-host-apps-cover.jpg?t=3a9c55d5-e9ea-816c-99b6-e4d25f79c8bd)](/article/self-host-apps)[n8n 自托管工作流自动化：

Zapier 的开源替代，连接一切应用![image](https://xiaozha.org/images/n8n-workflow-automation-cover.jpg?t=3a9c55d5-e9ea-819a-ba37-f896311d2356)](/article/n8n-workflow-automation)[Mealie 自建菜谱应用：

告别下厨房广告，掌控你的私人厨房![image](https://xiaozha.org/images/mealie-recipe-app-cover.jpg?t=3a9c55d5-e9ea-815e-9418-cb48b94022bd)](/article/mealie-recipe-app)[🧠 Kimi K3 深度解析：2.8万亿参数，全球最大开源大模型来了![image](https://xiaozha.org/images/kimi-k3-open-source-cover.jpg?t=3a9c55d5-e9ea-81ab-a321-e256217a22bc)](/article/kimi-k3-open-source)
