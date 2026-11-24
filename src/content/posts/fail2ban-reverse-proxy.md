---
title: "反向代理后面的 Fail2ban：为什么你封的是 127.0.0.1，攻击却一点没停"
pubDatetime: "2026-11-26T00:00:00.000Z"
description: "装了 Fail2ban、 jail 也显示封禁，攻击却没停——因为日志里记的是反向代理的 IP。中文教程教的 proxy_set_header X-Real-IP 是给后端应用看的，跟 Fail2ban 读日志是两套机制。这篇讲清 realip 模块、XFF 取真实 IP、filter 注入漏洞和 Docker 封禁失效。"
author: 小吒
tags:
  - 教程
  - 开源
  - 工具
draft: false
ogImage: "/images/fail2ban-reverse-proxy-real.webp"
coverAlt: "多层反向代理链路示意图，攻击者 IP 经代理后被还原"
enSlug: "fail2ban-reverse-proxy"
---

这是 self-hosted 玩家最常被坑到的一套组合：前面挂了 Nginx / Nginx Proxy Manager / Cloudflare Tunnel，后面装了 Fail2ban 保护登录口。`fail2ban-client status` 一看，Banned IP 列表里赫然写着 `127.0.0.1` 或 `172.18.0.1`。

封了半天，攻击一点没停。

站内[《Ubuntu Server 初始化配置》](/article/ubuntu-server-setup)已经讲过 Fail2ban 基础。这篇只解决一个具体问题：**当你的服务藏在反向代理后面，Fail2ban 到底该封谁、怎么拿到那个 IP。**

## 先搞清楚 Fail2ban 封的是谁

Fail2ban 不看实时连接，它**读日志文件**，用正则从日志行里抓一个 IP（这个位置叫 `<HOST>`），然后交给防火墙封掉。

问题来了：服务在反向代理后面时，Nginx 日志里的 `$remote_addr` 是**代理的地址**，不是真实访客。所有请求看起来都来自 `127.0.0.1`（同机反代）或 `172.18.0.x`（Docker 网关）。

于是 Fail2ban 老老实实地封代理：

- 如果 `ignoreself` 保持默认 `true`（官方 man page：默认阻止封自己 IP），`127.0.0.1` 会被直接跳过——**结果是它一个IP都封不了，防护形同虚设**，你还以为在生效。
- 如果代理是 Docker 网关这种内网 IP、或你关了 `ignoreself`——**封掉代理等于把所有访客一起挡在门外**，正常用户全挂。

两种都是坏结局，而且现象都很迷惑。

## 第一个误区：X-Real-IP 不是给 Fail2ban 用的

几乎每篇中文教程都会教你写这行：

```nginx
proxy_set_header X-Real-IP $remote_addr;
```

然后说"这样后端就能拿到真实 IP 了"。这话**对后端应用是对的**——Gitea、Jellyfin 这类程序会读这个请求头，用它显示登录来源。

但 Fail2ban 读的是**磁盘上的日志文件**，不是 HTTP 请求头。你在 `proxy_set_header` 里塞再多字段，只要 Nginx 的日志格式里没有把它写进去，Fail2ban 就永远看不到。

这是两个完全独立的通道。改错地方，配置看起来很专业，实际什么都没发生。

## 正确做法 A（首选）：让 Nginx 在写日志前就把 IP 换掉

最干净的解法是别让错误 IP 进入日志。Nginx 的 `ngx_http_realip_module` 专门干这个——它在处理请求时就把 `$remote_addr` 替换成真实客户端 IP，之后所有日志、所有后端都拿到对的 address。

```nginx
# 只在 http / server / location 块里
set_real_ip_from  127.0.0.1;        # 你的反向代理地址
set_real_ip_from  172.18.0.0/16;    # 或 Docker 网段
real_ip_header    X-Forwarded-For;
real_ip_recursive on;
```

这三个指令的含义（官方 ngx_http_realip_module 文档）：

- **`set_real_ip_from`**：声明**可信代理**的地址或 CIDR。只有来自这些地址的请求，header 里的 IP 才会被采信。这一步是安全边界，漏了它等于谁都能伪造 IP。
- **`real_ip_header X-Forwarded-For`**：从哪个头取真实 IP。XFF 是一串 `client, proxy1, proxy2`，越靠右越接近代理。
- **`real_ip_recursive on`**：从右往左跳过所有**可信**代理，取最后一个不可信的地址作为客户端。关掉它（默认 off）会直接取最右那个值——如果那个值恰好是攻击者伪造的，你就中招了。

改完 reload Nginx，确认 access.log 里出现的是真实公网 IP，Fail2ban 用内置 filter 就能直接工作，无需任何改动。

> 注意：这个模块**默认不编译进 Nginx**，需要 `--with-http_realip_module`。用官方 nginx 镜像或 apt 装的通常是带了的，编译安装的自查 `nginx -V | grep realip`。Nginx Proxy Manager 底层是 Nginx，但它抽象掉了配置入口，改自定义配置要在 Advanced 里塞 nginx directives，别去改容器里的原始文件（重建就没了）。

## 正确做法 B：不改 Nginx，在 Fail2ban 里从 XFF 取 IP

如果不能动 Nginx 配置（比如用的是托管面板），那就让 Fail2ban 自己从日志里的 XFF 字段抓 IP。

前提：access.log 里得有 XFF 字段。先在 `nginx.conf` 的 `log_format` 末尾加上 `"$http_x_forwarded_for"`（这个改动比 realip 模块侵入性小），然后写自定义 filter：

```ini
# /etc/fail2ban/filter.d/nginx-xff-404.conf
# 假设 log_format 末尾追加了 "$http_x_forwarded_for"
# $remote_addr 用 \S+ 吃掉（那是代理 IP），<HOST> 落在 XFF 字段的第一个 IP
[Definition]
failregex = ^\S+ - \S+ \[[^\]]+\] "[^"]*" 404 \d+ "[^"]*" "[^"]*" "<HOST>(?:, [^"]*)?"$
```

这里的 `<HOST>` 是 Fail2ban 的 IP 捕获宏——它**匹配到哪里，Fail2ban 就封哪里**。关键是让它落在 XFF 字段的真实 IP 上，而把开头的代理 IP 用普通的 `\S+` 匹配掉。正则要按你自己的 `log_format` 调整。

**这是理解 Fail2ban 的关键**：`<HOST>` 不是固定指日志第一列，它是"这是要封的 IP"的占位符，位置由你的正则决定。绝大多数教程直接让它匹配 `$remote_addr`，在反代场景就全错了。另外 `<HOST>` 在一条 `failregex` 里**只能出现一次**——Fail2ban 只认第一个匹配值，写两个只会封到代理 IP。

写完用官方工具验证规则能不能匹配你的真实日志，别直接上线：

```bash
fail2ban-regex /var/log/nginx/access.log /etc/fail2ban/filter.d/nginx-xff-404.conf
```

输出里会显示匹配到多少行、抓到哪些 IP。看到代理 IP 就说明写错了。

## 一个更少人知道的坑：你的正则本身可能是后门

Fail2ban 官方文档的 "Filter Security" 章节明确记载了这类攻击：写得不严谨的 `failregex` 会让攻击者**自己往日志里注入一个 IP**，诱导 Fail2ban 封掉任意目标——等于把你的防火墙变成 DoS 武器。真实案例包括 Apache 的 CVE-2013-2178。

看官方给的反例：

```ini
# 危险：用户名位置用了 \S+，攻击者可用带空格的用户名注入 "from 1.2.3.4"
failregex = ^Invalid command \S+ from <HOST>

# 攻击者让程序记下：
# Invalid command blah from 1.2.3.44 from 1.2.3.4
# 结果 1.2.3.44 被误封
```

修法是让前面的可变部分贪婪地吃到最后一个 `from`，并用 `$` 把 `<HOST>` 锚定在行尾：

```ini
failregex = ^Invalid command .* from <HOST>$
```

两个原则：**`<HOST>` 必须锚定在应用生成的、用户无法注入的文本上**（最好行尾加 `$`）；**可变字段用 `.*?` 非贪婪**，别让它跨过 `<HOST>` 去匹配攻击者塞进来的假 IP。官方还提醒：如果日志是多个程序共写的（比如 syslog），要确保别的程序不会在行首写用户可控内容。

自定义 filter 尤其是处理 URL、User-Agent、用户名这些攻击者能控制的字段时，务必用 `fail2ban-regex` 喂几条带注入内容的假日志测试。

## Docker 场景：规则加了却不生效

Docker 用户还有一个经典坑：Fail2ban 在容器里执行 `iptables -I ... -j DROP`，但 **Docker 自己也在改 iptables**，数据包在 chain 里的走向和裸机不一样，Fail2ban 加的规则可能压根没被走到。表现就是"封了但没封"。

几个检查点：

- 容器需要 `cap_add: NET_ADMIN` 和 `NET_RAW` 才能操作 iptables；只读挂载宿主机 `/var/log` 拿日志。
- 更稳的做法是让 Fail2ban 跑在**宿主机**上，直接读容器映射到宿主机的日志（`/var/lib/docker/containers/*/*.log` 或绑定的 volume），用宿主机的 iptables/ufw 封禁——避开容器网络命名空间的混乱。
- 官方 man page 提示 `banaction` 可以指定动作（如 `ufw`、`iptables-ipset`），并且 `actionban` 支持多条命令。如果你的防火墙是 ufw 管理，就别让 Fail2ban 另起一套 iptables 规则，设 `banaction = ufw` 统一。
- 别忘了 IPv6：`allowipv6` 默认 `auto`，但只封 IPv4 的场景下攻击可以从 AAAA 记录绕过来。

## 收尾：一个能自查的清单

反代后 Fail2ban 不生效，按顺序查：

1. `fail2ban-client status <jail>` —— Banned IP 是代理地址？是的话按做法 A 或 B 修。
2. access.log 里 `$remote_addr` 到底记的谁 —— 这一步就能定位 80% 的问题。
3. `fail2ban-regex <日志> <filter>` —— 正则没匹配上，后面全白搭。
4. `ignoreself` / `ignoreip` —— 确认你没把自己的出口 IP 或代理 IP 写进白名单还浑然不觉。
5. 防火墙链条 —— Docker 环境重点查规则有没有真正拦到包。

## 小结

Fail2ban 是一个"读日志 → 抓 IP → 调防火墙"的管道。反向代理打断的是第一环：日志里没有真实 IP，后面做得再花哨也是封空气。

优先让 Nginx 用 realip 模块从源头修正日志（`set_real_ip_from` 白名单 + `real_ip_recursive on` 是安全前提）；改不了就写自定义 filter 把 XFF 提取出来。无论哪条路，都要用 `fail2ban-regex` 实测，并且小心自己写的正则别变成攻击者的注入后门。

---

**参考**

- [Fail2ban 官方 jail.conf(5) man page](https://github.com/fail2ban/fail2ban/blob/master/man/jail.conf.5)
- [Fail2ban 官方 Developing Filters / Filter Security](https://fail2ban.readthedocs.io/en/latest/filters.html)
- [Nginx 官方 ngx_http_realip_module 文档](https://nginx.org/en/docs/http/ngx_http_realip_module.html)
- [稀土掘金：使用 Fail2ban 保护 Gitea（反向代理配置）](https://juejin.cn/post/7180282570892902437)
