---
title: Pi-hole 全网广告拦截：一个 DNS 黑洞，让全家设备告别广告
pubDatetime: "2026-10-24T00:00:00.000Z"
description: Pi-hole 是自托管 DNS 广告拦截方案，网络级生效，无需在任何设备装软件。本文讲清 DNS sinkhole 原理、Pi-hole v6 Docker 部署、路由器配置、屏蔽列表、分组规则、加密 DNS 与双机冗余。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/pihole-ad-blocking"
ogImage: "/images/pihole-ad-blocking-real.jpg"
coverAlt: "数据中心机架中密集的网络线缆与闪烁的指示灯"
enSlug: "pihole-ad-blocking"
---

手机装广告拦截、电脑装浏览器插件、电视盒子没办法装——最后总有几个设备在放广告。更麻烦的是，这些设备后台在往哪发数据，你根本不知道。

**Pi-hole** 换了个思路：不改任何设备，改你整个网络的 DNS。一次配置，路由器底下所有设备——手机、平板、电视、IoT 音箱、扫地机器人——全部生效。

这篇讲清原理、Pi-hole v6 部署，以及那些网上教程还在用 v5 旧架构、容易踩坑的地方。

## DNS 广告拦截的原理

你访问任何网站，第一步都是 **DNS 查询**：把 `ads.doubleclick.net` 这样的域名翻译成 IP 地址。

Pi-hole 做的事：当网络里某台设备查询一个已知的广告/追踪域名时，它**不返回真实 IP，而是返回 `0.0.0.0`**——一个黑洞地址。广告请求根本发不出去，页面里的广告位就空着。

关键是这个拦截发生在 **DNS 层，比浏览器更早**：

| | 浏览器插件 | Pi-hole |
|---|---|---|
| 生效范围 | 只有这个浏览器 | 整个网络所有设备 |
| 电视盒子 / IoT | 装不了 | 自动生效 |
| App 内广告 | 部分能拦 | 大部分能拦 |
| 性能开销 | 每个浏览器一份 | 全网一份 |

附带好处：**你能看见后台到底在连什么**。IoT 设备往家里连过哪些域名，查询日志里一清二楚——这是最直接的"你的智能电视在偷偷干什么"的证据。

## Pi-hole 还是 AdGuard Home

这两个是主流选择，2026 年的现状：

| | Pi-hole v6 | AdGuard Home |
|---|---|---|
| 开源 | 纯社区 | AdGuard 公司 |
| GitHub stars | ~50k | ~26k |
| 加密 DNS（DoH/DoT） | 需另配 cloudflared 或 Unbound | **内置** |
| 规则语法 | 列表 + 正则 | Adblock 语法（`$client` 修饰符） |
| 分组管理 | 强（按 IP/MAC 分组） | 有，按客户端 |
| 家长控制 | 无 | 内置 SafeSearch |
| 界面 | v6 已重做，够用 | 更现代 |

**选 Pi-hole**：要最大控制权、想配 Unbound 做完全递归解析、看重社区生态和文档厚度。
**选 AdGuard Home**：想开箱即用、要内置加密 DNS、需要按设备快速做家长控制。

说实话两者拦截能力几乎一样（用的是同一批社区屏蔽列表），差别在管理方式。这篇以 Pi-hole 为主，AdGuard Home 的部署思路完全一致。

## Pi-hole v6 的重要变化

**如果你照着 2024 年以前的教程配，一定会卡住。** v6（2025 年 2 月发布）是架构级重构：

- **内嵌 Web 服务器和 REST API 到 pihole-FTL 二进制里**，不再需要 lighttpd + PHP
- 配置改成 **TOML 文件**（`/etc/pihole/pihole.toml`），不再是 `setupVars.conf`
- 管理界面原生支持 **HTTPS**
- 组件从四个缩到一个，升级更快、故障点更少

Docker 部署的话影响不大（镜像都封装好了），但**改配置的方式变了**——以前是 `pihole -a -i` 那套命令，现在主要走 Web 界面和 TOML。

## Docker Compose 部署

### 目录结构

```
/opt/pihole/
├── docker-compose.yml
├── etc-pihole/      # Pi-hole 配置
└── etc-dnsmasq.d/   # 自定义 DNS 配置
```

### `docker-compose.yml`

```yaml
services:
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    restart: unless-stopped
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "80:80/tcp"          # 管理界面，可改
    environment:
      # 时区，影响日志时间戳
      TZ: "Asia/Shanghai"
      # Web 界面密码，必填，设个强密码
      FTLCONF_webserver_api_password: "换成强密码"
      # 上游 DNS 服务器，可填多个
      FTLCONF_dns_upstreams: "223.5.5.5;119.29.29.29"
      # 监听所有接口（容器网络模式需要）
      FTLCONF_dns_listeningMode: "all"
      # 查不到结果时是否回退上游查询，默认 no 即可
      FTLCONF_dns_revServer_active: "false"
    volumes:
      - ./etc-pihole:/etc/pihole
      - ./etc-dnsmasq.d:/etc/dnsmasq.d
    cap_add:
      - NET_ADMIN           # 允许修改网络设置，DHCP 功能需要
```

### 几个容易踩的点

**53 端口冲突**：如果机器上已经跑了 systemd-resolved（Ubuntu 默认开），它会占用 53。先释放：

```bash
sudo systemctl stop systemd-resolved
sudo systemctl disable systemd-resolved
# 删除 /etc/resolv.conf 里的 127.0.0.53 指向，改成真实 DNS
```

**上游 DNS 选择**：国内用阿里 `223.5.5.5`、腾讯 `119.29.29.29`；想要解析结果干净可以用 `1.1.1.1`（但国内 CDN 解析可能不准，导致视频、下载变慢）。**建议默认用国内公共 DNS，把干净解析交给加密 DNS那一层去解决。**

**`FTLCONF_` 前缀**：v6 的环境变量都带这个前缀，对应 TOML 里的配置项。这是 v6 的新写法，网上很多教程还在用 `ServerIP`、`WEBPASSWORD` 那套——**那些在 v6 已经废弃**。

### 启动

```bash
cd /opt/pihole
docker compose up -d
docker compose logs -f pihole    # 看是否正常拉取 gravity
```

第一次启动会下载屏蔽列表并编译成本地数据库，叫 **gravity**，几万到几十万条域名，一两分钟。看到 `Compiled allowlist`、`Building gravity` 之类的日志走完就绪。

访问 `http://服务器IP/admin`，用你设的密码登录。

## 让全网设备用上它

Pi-hole 装好了，但设备还不知道要找它解析。两种方式：

### 方式 A：改路由器 DNS（推荐）

登录路由器管理界面，找 **DHCP 设置**（或"内网设置"/"局域网设置"），把 **DNS 服务器**改成 Pi-hole 的 IP。

这样所有设备自动获取，新设备接入也生效。**这是唯一能让电视、IoT 这些改不了 DNS 的设备也用上的办法。**

缺点：部分路由器锁死了 DNS 配置，或者光猫拨号的情况下得改光猫。

### 方式 B：逐个设备改

适合只想给某台设备用：

- **电脑**：网络设置里手动填 DNS
- **手机**：Wi-Fi 高级设置里改 DNS（移动网络改不了，除非用私有 DNS）
- **电视盒子**：大部分安卓盒子能改，Apple TV 要装描述文件

麻烦，但精细。

### 验证生效

```bash
# 在任意设备上
nslookup ads.doubleclick.net
# 应该返回 0.0.0.0 而不是真实 IP
```

或者直接打开一个有广告的网页，看广告位是不是空了。

## 屏蔽列表：gravity 系统

Pi-hole 的拦截能力来自屏蔽列表。默认带一个官方列表，但**建议自己加几套**，覆盖更全：

| 列表 | 作用 |
|---|---|
| StevenBlack 统一列表 | 综合，广告 + 恶意 + 追踪 |
| AdGuard DNS filter | 覆盖面广，更新快 |
| EasyList / EasyPrivacy | 广告 + 追踪，最经典 |
| OISD Big | 精简直达，误杀少 |
| 乘风广告过滤规则 | **中文广告专门优化** |
| anti-AD | 中文站点广告，命中率高 |

添加位置：Web 界面 → **Adlists** → 粘贴 URL → 保存，然后：

```bash
pihole updateGravity
# Docker 里
docker exec pihole pihole updateGravity
```

**中文站点一定要加乘风或 anti-AD**——国际列表对国内广告网络覆盖很差，这两套是中文环境的关键补充。

列表不是越多越好。每套都有误杀风险，加太多会把正常功能也拦掉。**5-8 套精选的，比 30 套杂乱的强。**

## 分组与精细控制

家庭网络里不同设备需要不同策略：孩子平板要严、自己笔记本要松、电视要能看广告（有些视频 App 检测到广告拦截会黑屏）。

Pi-hole 用 **Group（组）** 管理：

1. **Group Management → Groups** → 新建组，比如 `Kids`、`NoFilter`
2. **Adlists** 里给每个列表指定生效的组
3. **Clients** 里把设备 IP 分配到组

这样孩子的平板只走严格列表，电视走空白组完全不拦。

**按 MAC 地址识别客户端比按 IP 好**——IP 会随 DHCP 租期变，MAC 不变。但按 MAC 识别需要 Pi-hole 自己当 DHCP 服务器（关掉路由器的 DHCP），配置复杂度上升，家庭用按 IP 也够。

## 白名单：误杀了怎么办

装好第一天，很可能发现某个 App 用不了了、某张图加载不出来。八成是被误杀。

**排错流程**：

1. Web 界面 → **Query Log**，按时间倒序找刚被拦截的域名
2. 看到可疑域名，点 **Whitelist** 加进白名单
3. 刷新页面验证恢复

常见需要白名单的：统计类域名（Google Analytics、百度统计）、某些 App 的 API 域名、广告联盟的追踪域名（拦了会导致"请关闭广告拦截后重试"）。

**养成习惯**：遇到"网站打不开/功能异常"，先去 Query Log 看，别急着卸 Pi-hole。

## 加密 DNS：别让上游看到你在查什么

默认情况下，Pi-hole 把拦截后的查询转发给上游 DNS（阿里、Cloudflare 之类）——**这个转发是明文的**。你的 ISP 依然能看到你查了哪些域名。

两个解决方案：

### 方案 A：cloudflared（简单）

跑一个 cloudflared 容器，把查询加密后发给 Cloudflare：

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: proxy-dns
    environment:
      TZ: "Asia/Shanghai"
      PORT: "5053"
    ports:
      - "5053:5053/tcp"
      - "5053:5053/udp"
```

然后 Pi-hole 的上游改成 `172.17.0.1#5053`（cloudflared 的地址，按实际容器网络调整）。

### 方案 B：Unbound（彻底）

Unbound 自己递归查询根服务器和权威服务器，**完全不依赖任何第三方 DNS**。隐私最好，配置稍麻烦：

```yaml
services:
  unbound:
    image: mvance/unbound:latest
    restart: unless-stopped
    ports:
      - "5335:5335/tcp"
      - "5335:5335/udp"
    volumes:
      - ./unbound.conf:/etc/unbound/unbound.conf:ro
```

`unbound.conf`：

```text
server:
  verbosity: 0
  interface: 0.0.0.0
  port: 5335
  do-ip4: yes
  do-udp: yes
  do-tcp: yes
  access-control: 0.0.0.0/0 refuse
  access-control: 127.0.0.0/8 allow
  access-control: 172.16.0.0/12 allow   # Docker 网段
```

Pi-hole 上游指向 Unbound。

**家庭用选 A 就够**，B 适合对隐私有执念的。

## 冗余：DNS 不能只有一台

DNS 是网络的咽喉，**Pi-hole 挂了，全家断网**。生产做法是跑两个实例：

- 主：正常 Pi-hole，端口 53
- 备：同样一套，改端口（比如 `5380:80`，DNS 端口没法同时占用，得用另一个 IP 或 network_mode: host 改端口）
- 路由器 DHCP 里填两个 DNS：主 IP 和备 IP

设备会优先用主，主挂了自动切备。列表同步用 [Gravity Sync](https://github.com/vmstan/gravity-sync) 这个工具，把主的白名单和列表同步到备。

## 它拦不了什么

提前说清楚，避免失望：

- **YouTube / Twitch 广告**：广告和视频同一个域名，DNS 拦了视频也看不了。这类只能浏览器插件（uBlock Origin）
- **App 内嵌广告**：部分 App 用内置 DoH 或硬编码 IP，绕过 DNS。YouTube App 就是典型
- **搜索结果里的推广**：搜索引擎的广告位和自然结果同域名，拦不掉
- **开了"隐私 DNS"的手机**：Android 的"私人 DNS"功能会强制走加密 DNS，绕过 Pi-hole。要用 Pi-hole 就在手机里关掉这个选项

所以现实用法是：**Pi-hole 管网络级（IoT、电视、电脑系统层），浏览器再配个 uBlock Origin 管网页内嵌**。两层叠加才是完整的。

## 远程访问与备份

**别把 Pi-hole 管理界面裸暴露到公网**——查询日志等于你的浏览记录。要用 Cloudflare Tunnel：

```bash
cloudflared tunnel route dns pihole pihole.example.com
```

配置和《Cloudflare Tunnel 免费内网穿透》里一样，把 ingress 指向 `http://localhost:80`。Cloudflare 前面还能加 Access，做到"只有我的邮箱能登"。

**备份**：Pi-hole 的配置就在 `etc-pihole` 目录，定期 tar 一下同步到 R2 或外部硬盘：

```bash
tar czf pihole-$(date +%F).tar.gz etc-pihole/ etc-dnsmasq.d/
```

gravity 数据库不用备份（能重新生成），要备的是白名单、分组、客户端分配这些你调过的东西。

## 小结

Pi-hole 是自托管里**收益最直接**的一个：装一次，全网设备受益，而且立刻让你看见自己网络里发生了什么。

给新手的建议路径：先 Docker 部署 → 改路由器 DNS → 加中文屏蔽列表 → 用一周，遇到误杀就白名单 → 稳定后加 cloudflared 加密上游 → 最后考虑双机冗余。

配好之后接着看《Tailscale vs Cloudflare Tunnel》决定怎么远程访问，或者《Uptime Kuma 自建监控》把 Pi-hole 自己也监控起来——DNS 挂了可不是小事。
