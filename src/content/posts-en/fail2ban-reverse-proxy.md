---
title: "Installed Fail2ban but the Attacks Keep Coming? The Reverse Proxy Might Be Why"
pubDatetime: "2026-11-26T00:00:00.000Z"
description: "You installed Fail2ban, the jail shows a bunch of bans, but the attacks don't stop — and every banned IP turns out to be 127.0.0.1. Here's the plain-English reason: your log records the proxy's address, not the visitor's. Plus how to check, how to fix it, and the Docker and regex-injection surprises you will likely run into."
author: "Xiaozha"
tags: ["Tutorial", "Open Source", "Tool"]
draft: false
ogImage: "/images/fail2ban-reverse-proxy-en-real.webp"
coverAlt: "Multi-layer reverse proxy chain with the attacker IP resolved at the origin"
zhSlug: "fail2ban-reverse-proxy"
---

You set up Fail2ban, run `fail2ban-client status`, and see a few IPs sitting in the Banned list — looks like it's doing its job. Then you check again: the attacks haven't slowed down one bit. The login page is still being tried over and over. You look closer at one of those banned IPs — `127.0.0.1`.

Plain and simple: Fail2ban is banning your reverse proxy, not the person actually trying to get in.

Think of Fail2ban as a guard who doesn't watch the people coming through the door — he only flips through a logbook and bans whoever's name is written there. Once you put a proxy in front, the proxy signs the book for everyone and writes its own name every time. The guard bans the proxy; the real attacker never gets written down at all.

Our [Ubuntu Server setup guide](/en/article/ubuntu-server-setup) covers the basics. This article answers one question: when your service sits behind a reverse proxy, who should Fail2ban ban, and how do you get that real IP?

## What you can check right now

Start with this:

```bash
fail2ban-client status <jail>
```

If the banned IP is `127.0.0.1` or `172.18.0.x`, you've basically solved it. Then open the Nginx access.log and see what `$remote_addr` really records — most of the time, staring at that one column locates about 80% of the problem.

You probably reached for this line, because every tutorial says to add it:

```nginx
proxy_set_header X-Real-IP $remote_addr;
```

In plain terms: that line is for the **backend app**. Programs like Gitea and Jellyfin read it to display which IP a login came from. But Fail2ban reads the **log file on disk**, not HTTP headers. No matter how many fields you set with `proxy_set_header`, if the Nginx log format doesn't write the value into the file, Fail2ban will never see it.

Those are two completely separate channels. Change the wrong one and the config looks professional while doing absolutely nothing.

## The fixes that actually work

### Preferred: have Nginx swap in the real IP before it writes the log

The cleanest approach is to keep the wrong IP out of the log in the first place. Nginx's `ngx_http_realip_module` does exactly that — it replaces `$remote_addr` with the real client IP while handling the request, so every log line and every backend gets the right address.

```nginx
# inside an http / server / location block
set_real_ip_from  127.0.0.1;        # your reverse proxy address
set_real_ip_from  172.18.0.0/16;    # or your Docker network
real_ip_header    X-Forwarded-For;
real_ip_recursive on;
```

What the three directives mean:

- **`set_real_ip_from`**: declares which addresses are **trusted proxies**. An IP from a header is only accepted from these sources. This is your security boundary — leave it out and anyone can spoof an IP.
- **`real_ip_header X-Forwarded-For`**: which header to read the real IP from. XFF looks like `client, proxy1, proxy2`, with addresses further right closer to the proxy.
- **`real_ip_recursive on`**: walks right-to-left, skipping every **trusted** proxy, and uses the last non-trusted address as the client. Leave it off (the default) and it just takes the rightmost value — an attacker can forge that value, and you end up banning the wrong person and blocking the good guys.

Reload Nginx and confirm access.log now shows real public IPs. Fail2ban's built-in filters then work unchanged.

> One note: this module is **not compiled in by default**; it needs `--with-http_realip_module`. Official nginx images and apt packages usually include it — check with `nginx -V | grep realip`. Nginx Proxy Manager is Nginx underneath but hides the config entry point, so add nginx directives through Advanced, not by editing files inside the container (they're gone after a rebuild).

### If you can't touch Nginx: let Fail2ban pull the IP from XFF in the log

If the Nginx config is off-limits (a managed panel, say), have Fail2ban grab the IP from the XFF field in the log instead.

The prerequisite: access.log must contain XFF. Append `"$http_x_forwarded_for"` to your `log_format` in `nginx.conf` (less invasive than the realip module), then write a custom filter:

```ini
# /etc/fail2ban/filter.d/nginx-xff-404.conf
# Assumes "$http_x_forwarded_for" was appended to log_format
# The leading $remote_addr is consumed by \S+ (that's the proxy);
# <HOST> lands on the first IP in the XFF field.
[Definition]
failregex = ^\S+ - \S+ \[[^\]]+\] "[^"]*" 404 \d+ "[^"]*" "[^"]*" "<HOST>(?:, [^"]*)?"$
```

`<HOST>` is Fail2ban's IP-capture placeholder — **it bans whatever it matches**. The trick is to land it on the real IP in XFF while consuming the leading proxy IP with a plain `\S+`. Adapt the regex to your own `log_format`. This is the key to understanding Fail2ban: `<HOST>` doesn't mean the first column of the log; it means "this is the IP to ban," and your regex decides where it points. Most tutorials point it at `$remote_addr`, which is wrong behind a proxy. Also, `<HOST>` can appear **only once** in a single `failregex` — Fail2ban uses the first match, so writing it twice just bans the proxy.

Validate against your real logs before deploying:

```bash
fail2ban-regex /var/log/nginx/access.log /etc/fail2ban/filter.d/nginx-xff-404.conf
```

The output shows how many lines matched and which IPs were captured. If you see a proxy IP, the regex is wrong.

## A few things you'll run into

**1. Your own regex can become a backdoor for attackers.**

Fail2ban's official docs have a “Filter Security” section about exactly this: a sloppy `failregex` lets an attacker **inject an IP into the log**, tricking Fail2ban into blocking any target — your firewall becomes a DoS weapon in his hands. A real case is Apache's CVE-2013-2178. The official bad example:

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

Remember two rules: anchor `<HOST>` to text generated by the application that the user can't inject (ideally end the line with `$`), and make variable fields non-greedy with `.*?` so they don't run past `<HOST>` into a fake IP the attacker planted. The docs also warn about shared logs like syslog: make sure other programs don't write user-controlled text at the start of a line. Any custom filter touching URLs, User-Agents or usernames deserves a look — feed a few injection-style fake log lines into `fail2ban-regex` and see what gets captured.

**2. In Docker the rules exist but do nothing.**

Fail2ban inside a container runs `iptables -I ... -j DROP`, but **Docker rewrites iptables too**, so packets may never traverse the chain Fail2ban modified. It looks like “banned but not actually banned.” Things to check:

- The container needs `cap_add: NET_ADMIN` and `NET_RAW` to touch iptables, plus a read-only mount of the host's `/var/log` to get logs.
- The more robust setup runs Fail2ban on the **host**, reading container logs mapped to the host (`/var/lib/docker/containers/*/*.log` or a bind-mounted volume) and banning with the host's iptables/ufw — sidestepping the network namespace mess entirely.
- The official man page notes `banaction` selects the banning action (e.g. `ufw`, `iptables-ipset`) and `actionban` supports multiple commands. If ufw manages your firewall, set `banaction = ufw` instead of letting Fail2ban maintain a parallel iptables ruleset.
- Don't forget IPv6: `allowipv6` defaults to `auto`, but if you only ban IPv4, attackers can come in over AAAA.

**3. The allowlist locks you out.**

`ignoreself` defaults to `true` — the official man page says it stops you banning your own IP, so `127.0.0.1` gets skipped. Which is awkward: you think you're banning things, but you're banning nothing and the protection does nothing at all. On the other hand, if the proxy is an internal address like a Docker gateway, or you turned `ignoreself` off, banning the proxy locks out every legitimate visitor at once. Also give `ignoreself` / `ignoreip` a look so you don't whitelist your own egress IP or the proxy IP without realizing it.

## When not to bother

- The service isn't behind a reverse proxy: the built-in filters work out of the box and none of this applies to you.
- It's a static site with no login page: Fail2ban is mostly for brute force, so there's nothing to guard — don't make extra work for yourself.
- You can't see the logs and the panel won't let you change things: neither fix is available. Solve the “can I get the logs” problem first instead of spinning your wheels here.
- You just want to block a couple of fixed IP ranges: a firewall or the panel's own ban rule is quicker, no Fail2ban needed.

## Bottom line

If the log has the real IP, Fail2ban has something to ban; when a proxy hides it, your whole job is to put that back — everything else is just a variation on that one point.

---

**References**

- [Fail2ban official jail.conf(5) man page](https://github.com/fail2ban/fail2ban/blob/master/man/jail.conf.5)
- [Fail2ban Developing Filters / Filter Security](https://fail2ban.readthedocs.io/en/latest/filters.html)
- [Nginx official ngx_http_realip_module docs](https://nginx.org/en/docs/http/ngx_http_realip_module.html)
- [Juejin: Protect Gitea with Fail2ban (reverse proxy config)](https://juejin.cn/post/7180282570892902437)
