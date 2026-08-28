---
title: "Cloudflare Speed Optimization for Mainland China: Optimized IP Setup Guide"
pubDatetime: "2026-07-05T00:00:00.000Z"
description: "Made for website administrators! Speed up your whole site with optimized IPs + DNS resolution, so every visitor from mainland China enjoys low-latency access."
author: "Xiaozha"
tags: ["Cloudflare", "Tutorial", "Networking"]
featured: false
draft: false
ogImage: "/images/cloudflare-ip-optimization-real.jpg"
coverAlt: "Blinking network indicator lights on a data center server rack"
zhSlug: "cloudflare-ip-optimization"
---

Cloudflare is the world's largest free CDN provider, but visitors from mainland China often run into high latency and packet loss.

As a website administrator, you need a solution that improves the experience for all of your visitors — not something that leaves every user to figure it out on their own.

This article shares an acceleration plan built for website administrators:

Run a local speed test to find optimized IPs with real-world latency, then configure DNS resolution so every visitor benefits.

## Why You Need Optimized IPs

Cloudflare uses Anycast technology, which in theory should automatically route users to the nearest node.

But here's what actually happens:

| Symptom | Cause |
| --- | --- |
| Latency of 200ms+ | Traffic is routed to nodes on the US West Coast or in Europe |
| Unstable connections | Some IP ranges suffer from congestion or poor routing quality |
| Frequent packet loss | International egress bandwidth is limited |

The core problem: the IP Cloudflare assigns by default isn't necessarily the fastest one reachable from China's domestic network.

By manually selecting an optimized IP, you can let visitors connect directly to the Cloudflare node with the lowest latency.

## Comparing the Options

As a website administrator, you need a plan that benefits all of your visitors:

| Option | Coverage | Difficulty | Recommendation |
| --- | --- | --- | --- |
| **DNS resolution to optimized IP** | Benefits all site visitors | Low | ✅✅✅ |
| Carrier-specific split resolution | Optimized per ISP | Medium | ✅✅✅ |
| CNAME optimized-IP service | Benefits all site visitors | Low | ✅✅ |
| Local hosts file modification | Only benefits yourself | Low | ❌ (not recommended) |

Recommended approach: **DNS resolution to optimized IPs + carrier-specific split resolution**.

## Step 1: Get Optimized IPs

Before configuring anything, you need to run a speed test to find the Cloudflare IPs that are fastest from mainland China.

### Recommended Tools

Use the open-source tool [XIU2/CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest), widely regarded as the most stable Cloudflare IP speed test tool in China.

### Downloads

| Platform | Download |
| --- | --- |
| Windows | [CloudflareSpeedTest_windows_amd64.zip](https://github.com/XIU2/CloudflareSpeedTest/releases) |
| macOS | [CloudflareSpeedTest_macos_amd64.tar.gz](https://github.com/XIU2/CloudflareSpeedTest/releases) |
| Linux | [CloudflareSpeedTest_linux_amd64.tar.gz](https://github.com/XIU2/CloudflareSpeedTest/releases) |

### Run the Speed Test

### Selection Criteria

After the speed test finishes, pick IPs that meet the following criteria:

| Metric | Recommended value | Notes |
| --- | --- | --- |
| Latency | ≤ 100ms | Lower is better; under 50ms is ideal |
| Download speed | ≥ 5MB/s | Ensures enough bandwidth |
| Packet loss | 0% | Must be 0%, or it will be unstable |

Record the 3–5 IPs with the lowest latency as your optimized IPs.

## Step 2: Configure DNS Resolution (Core Step)

This is the most important step. Once configured, every visitor will reach your site through the optimized IP.

### Prerequisites

- Your domain is hosted on Cloudflare
- You've obtained optimized IPs

### Configuration Steps

- Log in to the Cloudflare dashboard and open your domain's management page.
- Turn off the orange cloud proxy (switch to grey cloud / DNS only).

> ⚠️ Important: If you leave the proxy on and access the IP directly, you'll trigger a 1003 error.

- Add A records pointing to your optimized IP.

| Host | Type | Value | Proxy status |
| --- | --- | --- | --- |
| @ | A | 104.16.132.22 | DNS only (grey cloud) |
| www | A | 104.16.132.22 | DNS only (grey cloud) |

- Configure SSL/TLS: go to the SSL/TLS settings and change the mode to **Full (strict)**.

### Why Disable the Proxy

| | Effect |
| --- | --- |
| Orange cloud (enabled) | Traffic flows through Cloudflare nodes and gets security protection, but may be routed to a slow node |
| Grey cloud (disabled) | Resolves straight to the Cloudflare IP, bypassing node assignment for faster access |

After disabling the proxy, your site still uses Cloudflare's Anycast IP ranges — you're just skipping Cloudflare's security filtering and acceleration layer.

## Step 3: Carrier-Specific Split Resolution (Advanced)

Network quality varies a lot between carriers, so you can assign different optimized IPs to China Telecom, China Unicom, and China Mobile users.

### Prerequisites

- Migrate your domain's DNS to DNSPod (the free tier is enough)
- Have measured separate optimized IPs for all three carriers

### Configuration

Add multiple A records in DNSPod:

| Host | Type | Carrier | Value |
| --- | --- | --- | --- |
| @ | A | Telecom | 104.16.132.22 |
| @ | A | Unicom | 172.64.155.88 |
| @ | A | Mobile | 104.18.42.166 |
| @ | A | Default | 104.16.132.22 |

### How to Test Each Carrier Separately

You need to run speed tests on each carrier's network, or use the IP range files shared by the community.

IP range files can be found on GitHub or in technical communities.

## Step 4: Automatically Update Optimized IPs (Automation)

The network conditions of optimized IPs change over time, so it's a good idea to update them regularly.

You can use a script to automate the updates.

### Configure the DNSPod API

- Create an API key in the DNSPod console.
- Write down your `SECRET_ID` and `SECRET_KEY`.

### Create the Auto-Update Script

### Set Up a Scheduled Task

Use crontab to run the update every 6 hours:

### Use GitHub Actions (Recommended)

You can also use GitHub Actions to run speed tests and updates on a schedule.

> ⚠️ Note: GitHub Actions runs overseas, so speed test results may be less accurate for mainland China.
>
> It's better to run the script on a domestic server or on your local machine.

## Verifying the Results

### Check DNS Resolution

### Test Access Speed

Use your browser's developer tools (F12), switch to the Network panel, and look at TTFB (Time to First Byte):

| Metric | Before | After |
| --- | --- | --- |
| TTFB | 200–500ms | 50–100ms |
| Page load | 3–5s | 1–2s |

### Monitoring Tips

- Use Cloudflare Analytics to monitor access speed.
- Set up alerts to notify you when TTFB exceeds a threshold.
- Run a manual speed test once a week to confirm your optimized IPs are still working.

## FAQ

#### Q1: Will the SSL certificate still work after I disable the proxy?

A: Yes. As long as your domain has been hosted on Cloudflare at some point, Cloudflare automatically issues a universal certificate. The certificate stays valid even with grey-cloud resolution.

Just keep these in mind:

- Set the SSL/TLS mode to "Full (strict)".
- Your origin must have a valid certificate (hosting platforms like Cloudflare Pages and Vercel provide one automatically).

#### Q2: Do optimized IPs go stale?

A: Yes. Cloudflare IP network conditions change over time, so it's recommended to:

- Re-run speed tests every 1–2 weeks.
- Keep 3–5 backup IPs on hand.
- Set up an auto-update script.

#### Q3: Why are some IPs fast in the speed test but slow when I actually access the site?

A: A speed test only measures latency to the Cloudflare node. Real access speed also depends on:

- The connection from Cloudflare to your origin
- Your origin's response speed
- The size of your page resources

It's best to also test download speed, and pick IPs that score well on both latency and throughput.

#### Q4: How do I test access speed from different regions?

A: You can use online tools:

- [站长工具](https://ping.chinaz.com/) - multi-node ping testing across China
- [Cloudflare Radar](https://radar.cloudflare.com/) - Cloudflare network status
- [17CE](https://www.17ce.com/) - nationwide multi-node speed testing

## Pitfalls to Avoid

| Mistake | Problem | Correct approach |
| --- | --- | --- |
| Testing from overseas | Results are inaccurate for mainland users | Run the test inside China |
| Orange cloud + direct IP access | Triggers the 1003 error | Disable the proxy (grey cloud) |
| Single IP with no backup | Site becomes unreachable when the IP fails | Keep multiple backup IPs |
| Testing too many IPs too often | Triggers Cloudflare rate limiting | Test once a week, 100–200 IPs per run |
| One shared IP across all three carriers | Some carriers access slowly | Use split-horizon resolution |

## Summary

Here's why the optimized IP + DNS resolution approach recommended in this article works:

| Advantage | Details |
| --- | --- |
| Benefits the whole site | All visitors get faster access, with no action required from users |
| Simple to implement | No server needed — just DNS configuration |
| Noticeable results | TTFB drops from 200ms+ to under 100ms |
| Zero cost | The tools and DNS services are all free |

The core steps:

- Run CloudflareSpeedTest in a domestic (mainland China) environment.
- Pick the 3–5 IPs with the lowest latency.
- Configure DNS resolution for your domain (disable the Cloudflare proxy).
- (Optional) Set up carrier-specific split resolution.
- (Optional) Set up an auto-update script.
- Monitor and verify the results regularly.

This approach has been proven in practice and is the best practice for website administrators who want to optimize Cloudflare access speed from mainland China.

---

## References

- [XIU2/CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest) - speed test tool
- [DNSPod split-horizon resolution](https://docs.dnspod.cn/api/) - API documentation
- [Cloudflare SSL/TLS settings](https://developers.cloudflare.com/ssl/) - official documentation
