---
title: 登陆宝塔面板访问404
pubDatetime: "2026-04-17T00:00:00.000Z"
description: 宝塔面板访问报404错误的解决方案，端口被Nginx占用的排查与修复。
author: 小吒
tags:
  - 日常记录
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/bt-panel-404"
ogImage: "/images/bt-panel-404-real.jpg"
coverAlt: "服务器机房中排列整齐的机柜与网络设备"
---

问题今天首先突然发现自己的另一个word press网站白屏，想着通过宝塔面板登陆进去查看以下原因，结果发现登陆宝塔面板居然报404

错误表现首先在网上搜索，但是网上很多博主的建议就是宝塔面板端口没开放、或者没有输入正确的安全入口，建议运行BT 14命令查看正确的端口和安全入口，但是事实上，我可以很确定的说这种低级错误是没有犯的，很确认输入的IP+端口+安全入口正常

使用HTTPS访问提示"此网站无法提供安全连接"，使用HTTP访问提示"404 Not Found"

![image](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-81dc-a86d-d261d7dc56e2&q=50&width=1080&fmt=webp&fm=webp)

![image](https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-815b-88ca-d7787bebc62a&q=50&width=1080&fmt=webp&fm=webp)

解决方案在通过查询网站无果后，采用带AI助手的SSH终端进行查询解决，最终发现了问题

![image](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-8113-81d5-d7b14fa9d5ee&q=50&width=1080&fmt=webp&fm=webp)

原来是宝塔面板端口被占用，然后再次检查是被哪个服务占用，结果告诉我是Nginx占用

![image](https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-811e-b542-ed1b9ac83ec8&q=50&width=1080&fmt=webp&fm=webp)

找到问题就好解决了，将宝塔面板的登陆端口改一下，我这边改成8888测试，然后再将服务器管理后台的宝塔安全防火墙入口8888开放，然后就正常了

[上一篇ChatGPT vs Claude vs Gemini 2026 大横评：

谁是综合最强 AI？](/article/chatgpt-vs-claude-vs-gemini)[下一篇Vaultwarden 自托管密码管理器：

告别 1Password 年费，数据自己掌控](/article/bitwarden-self-host)

[下一篇Vaultwarden 自托管密码管理器：

告别 1Password 年费，数据自己掌控](/article/bitwarden-self-host)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/bt-panel-404](https://xiaozha.org/article/bt-panel-404)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[Hi！

欢迎访问本站！![image](https://bing.biturl.top/?resolution=1920&format=image)](/article/hi-welcome)
