---
title: "装了 Fail2ban 却没挡住攻击？问题可能出在反向代理"
pubDatetime: "2026-11-26T00:00:00.000Z"
description: "你装了 Fail2ban，jail 里显示封了一堆 IP，攻击却一点没停——一查封的全是 127.0.0.1。这篇用大白话讲清为什么：日志里记的是代理的地址，不是访客的。再告诉你怎么查、怎么改，以及 Docker 和正则注入这些你大概率会撞上的事。"
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

你装好了 Fail2ban，跑 `fail2ban-client status` 一看，Banned IP 列表里躺着好几个 IP，看着挺像在干活。结果回头一看，攻击一点没停，登录口还在被人一遍遍试。你点开那个被封的 IP 仔细瞅——`127.0.0.1`。

说白了，Fail2ban 封的是你的反向代理，不是真正来打你的人。

Fail2ban 像个保安，但它不盯着门口来人，只翻一本日志本：本子上记了谁的名字，就把谁拉黑。问题是前面挂了代理之后，代理替所有访客登记，把每个人的名字都写成了自己。保安照着本子封，封的是代理，真正的坏人压根没被记上去。

站内[《Ubuntu Server 初始化配置》](/article/ubuntu-server-setup)讲过 Fail2ban 的基本用法。这篇只解决一件事：服务藏在反向代理后面，到底该封谁、怎么拿到那个真实 IP。

## 你现在就能查清楚

先跑一下：

```bash
fail2ban-client status <jail>
```

如果 Banned IP 里是 `127.0.0.1` 或 `172.18.0.x`，基本就破案了。再去翻 Nginx 的 access.log，看 `$remote_addr` 记的到底是谁——盯着这一列，80% 的问题就已经定位了。

你大概会顺手去改这一行，因为教程都这么教：

```nginx
proxy_set_header X-Real-IP $remote_addr;
```

翻成人话：这一行是给**后端应用**看的。Gitea、Jellyfin 这类程序会读它，用来在页面上显示“登录来自哪个 IP”。但 Fail2ban 读的是**磁盘上的日志文件**，不是 HTTP 请求头。你在 `proxy_set_header` 里塞再多字段，只要 Nginx 的日志格式没把它写进文件，Fail2ban 就永远看不到。

这是两条完全独立的路。改错地方，配置看着很专业，其实白忙活。

## 真正管用的解法

### 首选：让 Nginx 在写日志之前就把 IP 换成真的

最干净的办法是别让错的 IP 进日志。Nginx 的 `ngx_http_realip_module` 就是干这个的——它在处理请求时就把 `$remote_addr` 换成真实客户端 IP，之后所有日志、所有后端拿到的都是对的。

```nginx
# 只在 http / server / location 块里
set_real_ip_from  127.0.0.1;        # 你的反向代理地址
set_real_ip_from  172.18.0.0/16;    # 或 Docker 网段
real_ip_header    X-Forwarded-For;
real_ip_recursive on;
```

这三个指令的意思是：

- **`set_real_ip_from`**：声明哪些地址是**可信代理**。只有来自这些地址的请求，请求头里的 IP 才会被采信。这是安全边界，漏了它谁都能伪造 IP。
- **`real_ip_header X-Forwarded-For`**：从哪个头里取真实 IP。XFF 长这样：`client, proxy1, proxy2`，越靠右越靠近代理。
- **`real_ip_recursive on`**：从右往左，跳过所有**可信**代理，取最后一个不可信的地址当客户端。关掉它（默认就是 off）会直接拿最右边那个值——那个值攻击者可以伪造，你就封错人了，等于帮坏人挡好人。

改完 reload 一下 Nginx，确认 access.log 里出现的是真实公网 IP。之后 Fail2ban 用内置 filter 就能直接工作，不用改任何东西。

> 提醒一句：这个模块**默认没编进 Nginx**，需要 `--with-http_realip_module`。用官方 nginx 镜像或者 apt 装的一般都有，自己编译的查一下 `nginx -V | grep realip`。Nginx Proxy Manager 底层也是 Nginx，但它把配置入口藏起来了，要在 Advanced 里塞 nginx directives，别去改容器里的原始文件——重建就没了。

### 改不了 Nginx：让 Fail2ban 自己去日志里抓 XFF

如果 Nginx 配置你动不了（比如用的托管面板），那就让 Fail2ban 从日志的 XFF 字段里自己抓 IP。

前提是 access.log 得有 XFF 字段。先在 `nginx.conf` 的 `log_format` 末尾加上 `"$http_x_forwarded_for"`（这比装 realip 模块动静小），然后写个自定义 filter：

```ini
# /etc/fail2ban/filter.d/nginx-xff-404.conf
# 假设 log_format 末尾追加了 "$http_x_forwarded_for"
# $remote_addr 用 \S+ 吃掉（那是代理 IP），<HOST> 落在 XFF 字段的第一个 IP
[Definition]
failregex = ^\S+ - \S+ \[[^\]]+\] "[^"]*" 404 \d+ "[^"]*" "[^"]*" "<HOST>(?:, [^"]*)?"$
```

`<HOST>` 是 Fail2ban 的抓 IP 占位符——**它匹配到哪里，Fail2ban 就封哪里**。诀窍是让它落在 XFF 里的真实 IP 上，开头那个代理 IP 用普通的 `\S+` 吃掉。正则要按你自己的 `log_format` 调。这是理解 Fail2ban 的关键：`<HOST>` 不是说日志第一列，而是“这个就是要封的 IP”，位置由你的正则说了算。大多数教程让它匹配 `$remote_addr`，在反代场景就全错了。另外 `<HOST>` 在一条 `failregex` 里**只能出现一次**，Fail2ban 只认第一个匹配值，写两个反而封到代理。

上线前先拿真实日志验一下：

```bash
fail2ban-regex /var/log/nginx/access.log /etc/fail2ban/filter.d/nginx-xff-404.conf
```

输出会告诉你匹配了多少行、抓到哪些 IP。看到代理 IP 就说明写错了。

## 你会撞上的几件事

**1. 你自己写的正则，可能反过来给攻击者开后门。**

Fail2ban 官方文档的 “Filter Security” 一节专门讲这个：写得不严谨的 `failregex` 会让攻击者**自己往日志里塞一个 IP**，骗 Fail2ban 去封任意目标——你的防火墙反倒成了他手里的 DoS 工具。真实的例子有 Apache 的 CVE-2013-2178。官方给的反例是：

```ini
# 危险：用户名位置用了 \S+，攻击者可用带空格的用户名注入 "from 1.2.3.4"
failregex = ^Invalid command \S+ from <HOST>

# 攻击者让程序记下：
# Invalid command blah from 1.2.3.44 from 1.2.3.4
# 结果 1.2.3.44 被误封
```

修法是让前面那段可变内容贪婪地吃到最后一个 `from`，再用 `$` 把 `<HOST>` 钉在行尾：

```ini
failregex = ^Invalid command .* from <HOST>$
```

记住两条：`<HOST>` 要锚在应用自己生成、用户塞不进东西的文本上（最好行尾加 `$`）；可变字段用 `.*?` 这种非贪婪写法，别让它跨过 `<HOST>` 去匹配攻击者假造的 IP。官方还提醒，如果日志是好几个程序一起写的（比如 syslog），要确认别的程序不会在行首写用户可控的内容。自定义 filter 只要碰到 URL、User-Agent、用户名这些攻击者能控制的字段，就老老实实拿几条带注入内容的假日志喂给 `fail2ban-regex` 试试。

**2. Docker 里规则加了，却像没加。**

Fail2ban 在容器里跑 `iptables -I ... -j DROP`，但 **Docker 自己也在改 iptables**，数据包在 chain 里的走向跟裸机不一样，Fail2ban 加的规则可能压根没被走到。表现就是“封了但没封”。几个检查点：

- 容器要加 `cap_add: NET_ADMIN` 和 `NET_RAW` 才能操作 iptables，再把宿主机 `/var/log` 只读挂进去拿日志。
- 更稳的是让 Fail2ban 跑在**宿主机**上，直接读容器映射到宿主机的日志（`/var/lib/docker/containers/*/*.log` 或者绑定的 volume），用宿主机的 iptables/ufw 来封，绕开容器网络命名空间那摊事。
- 官方 man page 说 `banaction` 可以指定封禁动作（比如 `ufw`、`iptables-ipset`），`actionban` 还能放多条命令。如果你的防火墙是 ufw 管的，就设 `banaction = ufw`，别让 Fail2ban 另起一套 iptables 规则。
- 别忘了 IPv6：`allowipv6` 默认是 `auto`，但只封 IPv4 的话，攻击可以从 AAAA 记录绕过来。

**3. 白名单把你自己挡在外面。**

`ignoreself` 默认是 `true`，按官方 man page 的说法，它不让你封自己的 IP——所以 `127.0.0.1` 会被直接跳过。这就有意思了：你以为在封，其实一个 IP 都没封，防护等于没有。反过来，如果代理是 Docker 网关那种内网地址，或者你关了 `ignoreself`，封掉代理就等于把所有访客一起挡在门外，正常用户全挂。另外也顺手看看 `ignoreself` / `ignoreip`，别把自己的出口 IP 或代理 IP 写进白名单还浑然不觉。

## 什么时候不用折腾这些

- 服务根本没挂在反向代理后面：内置 filter 开箱就能用，这篇讲的跟你没关系。
- 就是个没有登录口的静态站：Fail2ban 主要挡的是暴力破解，没那个口就没那个场景，先别给自己加活。
- 日志你看不到、面板也不让你改：两个解法都做不了，先去解决“能不能拿到日志”这件事，别在这儿白忙活。
- 只想挡住某几个固定 IP 段：直接用防火墙或者面板自带的封禁规则更快，不必上 Fail2ban。

## 说到底

日志里有真实 IP，Fail2ban 才有得封；反代把 IP 藏起来之后，你要做的就是把这件事补回去，其余都是围绕这一句打转。

---

**参考**

- [Fail2ban 官方 jail.conf(5) man page](https://github.com/fail2ban/fail2ban/blob/master/man/jail.conf.5)
- [Fail2ban 官方 Developing Filters / Filter Security](https://fail2ban.readthedocs.io/en/latest/filters.html)
- [Nginx 官方 ngx_http_realip_module 文档](https://nginx.org/en/docs/http/ngx_http_realip_module.html)
- [稀土掘金：使用 Fail2ban 保护 Gitea（反向代理配置）](https://juejin.cn/post/7180282570892902437)
