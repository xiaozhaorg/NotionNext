---
title: "Fail2ban Behind a Reverse Proxy: Why You're Banning 127.0.0.1 and Attacks Don't Stop"
pubDatetime: "2026-11-26T00:00:00.000Z"
description: "Fail2ban shows bans but attacks continue, because your log records the proxy's IP. The proxy_set_header X-Real-IP that every tutorial teaches is for the backend app, not for Fail2ban's log reader. Here's the realip module, XFF extraction, regex injection and the Docker gotcha."
author: "Xiaozha"
tags: ["Tutorial", "Open Source", "Tool"]
draft: false
ogImage: "/images/fail2ban-reverse-proxy-en-real.webp"
coverAlt: "Multi-layer reverse proxy chain with the attacker IP resolved at the origin"
zhSlug: "fail2ban-reverse-proxy"
---

This is the trap almost every self-hoster hits: put Nginx / Nginx Proxy Manager / Cloudflare Tunnel in front, install Fail2ban behind it to protect a login page, and then `fail2ban-client status` shows `127.0.0.1` or `172.18.0.1` in the banned list.

You've banned for hours. The attacks haven't slowed down at all.

Our [Ubuntu Server setup guide](/en/article/ubuntu-server-setup) covers Fail2ban basics. This article answers one specific question: **when your service sits behind a reverse proxy, who exactly should Fail2ban ban, and how do you get that IP?**

## First, understand what Fail2ban actually looks at

Fail2ban doesn't watch live connections. It **reads log files**, pulls an IP out of each line with a regex (that slot is called `<HOST>`), and hands it to the firewall to block.

Here's the problem: when the service is behind a reverse proxy, `$remote_addr` in the Nginx log is the **proxy's address**, not the real visitor. Every request looks like it came from `127.0.0.1` (same-host proxy) or `172.18.0.x` (Docker gateway).

So Fail2ban faithfully bans the proxy:

- If `ignoreself` is left at its default `true` (the official man page says it prevents banning your own IP), `127.0.0.1` is skipped — **so it bans nothing at all and the protection silently does nothing**, while you assume it's working.
- If the proxy is an internal address like a Docker gateway, or you disabled `ignoreself` — **banning the proxy locks out every legitimate visitor at once.**

Both are bad endings, and both are confusing in practice.

## Mistake #1: X-Real-IP isn't for Fail2ban

Nearly every Chinese tutorial tells you to add this line:

```nginx
proxy_set_header X-Real-IP $remote_addr;
```

Then claims "now the backend gets the real IP." That's **correct for the backend app** — Gitea, Jellyfin and friends read this header to display the login source.

But Fail2ban reads the **log file on disk**, not HTTP headers. No matter how many header fields you set in `proxy_set_header`, if the Nginx log format doesn't write that value into the file, Fail2ban will never see it.

These are two completely separate channels. Change the wrong one and the config looks professional while doing absolutely nothing.

## Fix A (preferred): make Nginx replace the IP before writing the log

The clean solution is to stop the wrong IP from ever entering the log. Nginx's `ngx_http_realip_module` does exactly this — it replaces `$remote_addr` with the real client IP while processing the request, so every log line and every backend gets the right address.

```nginx
# inside an http / server / location block
set_real_ip_from  127.0.0.1;        # your reverse proxy address
set_real_ip_from  172.18.0.0/16;    # or your Docker network
real_ip_header    X-Forwarded-For;
real_ip_recursive on;
```

What the three directives mean (from the official ngx_http_realip_module docs):

- **`set_real_ip_from`**: declares **trusted proxies** by address or CIDR. Header-supplied IPs are only accepted from these sources. This is your security boundary — omit it and anyone can spoof an IP.
- **`real_ip_header X-Forwarded-For`**: which header to read. XFF is a chain like `client, proxy1, proxy2`, with addresses further right closer to the proxy.
- **`real_ip_recursive on`**: walks right-to-left, skipping every **trusted** proxy, and uses the last non-trusted address as the client. Leave it off (the default) and it just takes the rightmost value — which, if forged by an attacker, is exactly what you'll ban.

Reload Nginx and confirm access.log now shows real public IPs. Fail2ban's built-in filters then work unchanged.

> Note: this module is **not compiled in by default**; it needs `--with-http_realip_module`. Official nginx images and apt packages usually include it — check with `nginx -V | grep realip`. Nginx Proxy Manager is Nginx underneath but hides the config entry point, so add nginx directives through Advanced, not by editing files inside the container (they're lost on rebuild).

## Fix B: leave Nginx alone, extract the IP from XFF inside Fail2ban

If you can't touch the Nginx config (a managed panel, for example), have Fail2ban pull the IP from the XFF field in the log instead.

The prerequisite: access.log must contain XFF. Append `"$http_x_forwarded_for"` to your `log_format` in `nginx.conf` (less invasive than the realip module), then write a custom filter:

```ini
# /etc/fail2ban/filter.d/nginx-xff-404.conf
# Assumes "$http_x_forwarded_for" was appended to log_format
# The leading $remote_addr is consumed by \S+ (that's the proxy);
# <HOST> lands on the first IP in the XFF field.
[Definition]
failregex = ^\S+ - \S+ \[[^\]]+\] "[^"]*" 404 \d+ "[^"]*" "[^"]*" "<HOST>(?:, [^"]*)?"$
```

Here `<HOST>` is Fail2ban's IP capture macro — it **bans whatever it matches**. The trick is to land it on the real IP in the XFF field while consuming the leading proxy IP with a plain `\S+`. Adapt the regex to your own `log_format`.

**This is the key to understanding Fail2ban**: `<HOST>` doesn't inherently mean the first column of the log. It's a placeholder for "this is the IP to ban," and your regex decides where it points. Most tutorials point it at `$remote_addr`, which is wrong behind a proxy. Also, `<HOST>` can appear **only once** in a single `failregex` — Fail2ban uses the first match, so writing it twice just bans the proxy.

Validate the rule against your real logs with the official tool before deploying:

```bash
fail2ban-regex /var/log/nginx/access.log /etc/fail2ban/filter.d/nginx-xff-404.conf
```

The output shows how many lines matched and which IPs were captured. If you see a proxy IP, the regex is wrong.

## A lesser-known trap: your regex can be a backdoor

Fail2ban's official docs have a "Filter Security" section documenting exactly this attack: a sloppy `failregex` lets an attacker **inject an IP into the log**, tricking Fail2ban into blocking any target — turning your firewall into a DoS weapon. Real cases include Apache's CVE-2013-2178.

The official bad example:

```ini
# Dangerous: \S+ for the username, so an injected "from 1.2.3.4" works
failregex = ^Invalid command \S+ from <HOST>

# Attacker makes the app log:
# Invalid command blah from 1.2.3.44 from 1.2.3.4
# Result: 1.2.3.44 gets banned
```

The fix is to let the variable part greedily consume up to the last `from`, and anchor `<HOST>` at the end with `$`:

```ini
failregex = ^Invalid command .* from <HOST>$
```

Two principles: **anchor `<HOST>` to text generated by the application that the user can't inject** (ideally end the line with `$`), and **make variable fields non-greedy with `.*?`** so they don't run past `<HOST>` into a fake IP the attacker planted. The docs also warn about shared logs like syslog: make sure other programs don't write user-controlled text at the start of a line.

Custom filters touching URLs, User-Agents or usernames deserve extra scrutiny — feed a few injection-style fake log lines into `fail2ban-regex` and see what gets captured.

## Docker: the rules exist but do nothing

Docker adds another classic failure: Fail2ban inside a container runs `iptables -I ... -j DROP`, but **Docker rewrites iptables too**, so packets may never traverse the chain Fail2ban modified. It looks like "banned but not actually banned."

Things to check:

- The container needs `cap_add: NET_ADMIN` and `NET_RAW` to touch iptables, plus a read-only mount of the host's `/var/log`.
- The more robust setup runs Fail2ban on the **host**, reading container logs mapped to the host (`/var/lib/docker/containers/*/*.log` or a bind-mounted volume) and banning with the host's iptables/ufw — sidestepping the network namespace mess entirely.
- The official man page notes `banaction` selects the banning action (e.g. `ufw`, `iptables-ipset`) and `actionban` supports multiple commands. If ufw manages your firewall, set `banaction = ufw` instead of letting Fail2ban maintain a parallel iptables ruleset.
- Don't forget IPv6: `allowipv6` defaults to `auto`, but if you only ban IPv4, attackers can come in over AAAA.

## A self-check list

When Fail2ban isn't working behind a proxy, go in order:

1. `fail2ban-client status <jail>` — is the banned IP the proxy's? If so, apply Fix A or B.
2. What is `$remote_addr` in access.log actually recording? This one step diagnoses ~80% of cases.
3. `fail2ban-regex <log> <filter>` — if the regex doesn't match, everything downstream is pointless.
4. `ignoreself` / `ignoreip` — confirm you haven't whitelisted your own egress IP or the proxy IP without realizing it.
5. Firewall chains — in Docker, verify the rule actually intercepts packets.

## Bottom line

Fail2ban is a pipeline: **read log → capture IP → call firewall.** A reverse proxy breaks the first stage — if the log doesn't contain the real IP, everything after it bans thin air.

Preferred: let Nginx's realip module fix the log at the source (`set_real_ip_from` allowlist plus `real_ip_recursive on` as the safety condition). If you can't change Nginx, write a custom filter to extract XFF. Either way, test with `fail2ban-regex`, and be careful your own regex doesn't become an injection backdoor for attackers.

---

**References**

- [Fail2ban official jail.conf(5) man page](https://github.com/fail2ban/fail2ban/blob/master/man/jail.conf.5)
- [Fail2ban Developing Filters / Filter Security](https://fail2ban.readthedocs.io/en/latest/filters.html)
- [Nginx official ngx_http_realip_module docs](https://nginx.org/en/docs/http/ngx_http_realip_module.html)
- [Juejin: Protect Gitea with Fail2ban (reverse proxy config)](https://juejin.cn/post/7180282570892902437)
