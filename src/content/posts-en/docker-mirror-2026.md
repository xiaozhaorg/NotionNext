---
title: "🐳 2026 Docker Registry Mirror Guide: Speed Up Pulls 10x"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "2026 latest Docker registry mirror configuration guide. Covers Docker Engine, Containerd, and K8s. Solve pull timeout issues and boost download speed 10x."
author: "Xiaozha"
tags: ["Docker", "DevTools", "Tutorial", "DevOps"]
featured: false
draft: false
ogImage: "/images/docker-mirror-2026-real.jpg"
coverAlt: "Cloud computing abstract image with clouds and server room"
zhSlug: "docker-mirror-2026"
---

![Cloud computing abstract image with clouds and server room](/images/remote/1518432031352-d6fc5c10da5a.webp)

If you use Docker in China, you have probably hit this wall: `docker pull nginx` hangs on `Pulling fs layer` forever and finally throws an `i/o timeout` or `TLS handshake timeout`. Access to Docker Hub from inside the country is hit-or-miss and seriously hurts developer productivity.

This guide is a systematic rundown of the domestic Docker registry mirrors that are still working as of July 2026, all personally tested and verified.

## 1. Why You Need a Registry Mirror

Docker Hub's official servers are overseas, so accessing them from China comes with several pain points:

- **High latency:** Direct connections average 200–500ms with heavy packet loss.
- **Slow pulls:** A 100Mbps broadband line only hits 100–300 KB/s.
- **Frequent timeouts:** Large images (such as PyTorch and CUDA) are almost impossible to pull.
- **Corporate network restrictions:** Some company networks block Docker Hub outright.

Once you configure a domestic mirror, download speed jumps from ~300 KB/s to over 12 MB/s — a night-and-day difference.

## 2. Tested Working Mirrors (July 2026)

After real-world testing, the following registry mirrors are still usable in July 2026. Configure them in this order for failover:

| Mirror | Address | Status | Speed |
| --- | --- | --- | --- |
| 1Panel | `docker.1panel.live` | ✅ Stable | ⭐⭐⭐⭐⭐ |
| DaoCloud | `docker.m.daocloud.io` | ✅ Stable | ⭐⭐⭐⭐ |
| Nanjing University | `docker.nju.edu.cn` | ✅ Stable | ⭐⭐⭐⭐ |
| USTC | `docker.mirrors.ustc.edu.cn` | ⚠️ Intermittent | ⭐⭐⭐ |
| Alibaba Cloud | `xxxx.mirror.aliyuncs.com` | ✅ Needs personal ID | ⭐⭐⭐⭐⭐ |

> 💡 **Tip:** Mirrors go down periodically. Configure several at once — Docker will automatically fall back to the next one.

## 3. Docker Engine Configuration (Most Common)

### 1. Edit `daemon.json`

On Linux the config file lives at `/etc/docker/daemon.json` (Windows Docker Desktop users configure this in the Settings UI — see the next section).

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://docker.1panel.live",
    "https://docker.m.daocloud.io",
    "https://docker.nju.edu.cn",
    "https://docker.mirrors.ustc.edu.cn",
    "https://xxxx.mirror.aliyuncs.com"
  ]
}
EOF
```

> Replace `xxxx.mirror.aliyuncs.com` with your own Alibaba Cloud accelerator address (see section 5).

### 2. Restart the Docker service

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

Verify the configuration took effect:

```bash
docker info | grep -A 5 "Registry Mirrors"
```

Output similar to the following means success:

```
Registry Mirrors:
  https://docker.1panel.live/
  https://docker.m.daocloud.io/
  https://docker.nju.edu.cn/
```

### 3. Test the speedup

```bash
time docker pull nginx:latest
```

Before the mirror, a pull might take 5–10 minutes; after configuration it usually finishes in 10–30 seconds.

## 4. Docker Desktop (Windows / Mac) Configuration

Docker Desktop does not require manually editing a config file:

1. Open Docker Desktop.
2. Click the **gear icon** in the top-right to open **Settings**.
3. Select **Docker Engine** on the left.
4. Paste the same `registry-mirrors` JSON above into the editor.
5. Click **Apply & Restart**.

Mac users can also edit `~/.docker/daemon.json` directly.

```json
{
  "registry-mirrors": [
    "https://docker.1panel.live",
    "https://docker.m.daocloud.io",
    "https://docker.nju.edu.cn",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```

## 5. Alibaba Cloud Personal Accelerator (Recommended for Individuals)

Alibaba Cloud gives every account a dedicated accelerator address — the fastest and most stable option:

1. Log in to the [Alibaba Cloud Container Registry service](https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors).
2. On the **Mirror Tools → Image Accelerator** page, grab your dedicated address, which looks like:

   ```
   https://xxxxxx.mirror.aliyuncs.com
   ```

3. Run the setup script that Alibaba Cloud auto-generates for your OS.

The advantage of the Alibaba Cloud accelerator is dedicated bandwidth — it will not slow down when public mirrors get hammered.

## 6. Containerd Configuration (A Must for K8s Users)

If you run Kubernetes or containerd, the configuration is a little different. Edit `/etc/containerd/config.toml`:

```bash
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
```

Locate the `[plugins."io.containerd.grpc.v1.cri".registry]` section and add mirror config blocks for `docker.io`:

```toml
[plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
  endpoint = [
    "https://docker.1panel.live",
    "https://docker.m.daocloud.io",
    "https://docker.nju.edu.cn"
  ]

[plugins."io.containerd.grpc.v1.cri".registry.mirrors."gcr.io"]
  endpoint = ["https://docker.m.daocloud.io"]

[plugins."io.containerd.grpc.v1.cri".registry.mirrors."quay.io"]
  endpoint = ["https://docker.m.daocloud.io"]
```

Restart containerd:

```bash
sudo systemctl restart containerd
```

## 7. Pull Directly via a Mirror Prefix (No Config Change)

If you cannot modify system config, prepend the mirror host to the image name:

```bash
docker pull docker.m.daocloud.io/library/nginx:latest
docker pull docker.1panel.live/library/python:3.12
docker pull docker.nju.edu.cn/library/redis:7
```

This is perfect for one-off pulls or environments where you lack root access.

## 8. Advanced: Build a Private Mirror Proxy with Cloudflare Workers

For teams and enterprises, I recommend reverse-proxying Docker Hub with a Cloudflare Worker to set up your own private mirror.

Core idea:

- Create a Worker that reverse-proxies `registry-1.docker.io`.
- Bind your own domain (e.g., `docker.yourdomain.com`).
- Add that address to `daemon.json`.

Example Worker code:

```javascript
const HUB_HOST = "registry-1.docker.io";
const PATH_PREFIX = "/v2";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const upstream = new URL(`https://${HUB_HOST}${PATH_PREFIX}${url.pathname.replace(/^.*\/v2/, "")}${url.search}`);

    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", HUB_HOST);
    newHeaders.set("Authorization", request.headers.get("Authorization") || "");

    const response = await fetch(upstream, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: "manual",
    });

    const respHeaders = new Headers(response.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  },
};
```

Then point the Worker route at your custom domain and add it to `daemon.json`:

```json
{
  "registry-mirrors": ["https://docker.yourdomain.com"]
}
```

> ⚠️ **Note:** The Cloudflare Workers free tier allows 100,000 requests per day. A team sharing one proxy may burn through that quickly — consider upgrading to a paid plan.

## 9. Troubleshooting

### Q1: Still timing out after configuration?

Troubleshoot in this order:

```bash
# 1. Check whether Docker actually loaded the mirrors
docker info | grep -A 5 "Registry Mirrors"

# 2. Test connectivity to the mirror
curl -v https://docker.1panel.live/v2/

# 3. Force-restart Docker
sudo systemctl restart docker

# 4. If a mirror is down, remove it from daemon.json and retry
```

### Q2: Error `x509: certificate signed by unknown authority`?

The mirror's certificate is invalid or your system clock is wrong. Check the time first:

```bash
date
# Sync time if it is off
sudo ntpdate ntp.aliyun.com
```

### Q3: What if every mirror is down?

Mirrors get blocked on a cycle. Track these channels for the latest working addresses:

- DaoCloud accelerator official announcements
- 1Panel community forum
- GitHub — search for `docker-mirror` projects

## 10. Summary and Recommendations

Configuring a registry mirror is now mandatory for using Docker in China in 2026. A few takeaways:

- **Pick the Alibaba Cloud dedicated accelerator first:** stable, fast, dedicated bandwidth.
- **Configure multiple mirrors for failover:** avoids a single point of failure breaking pulls.
- **K8s users must configure containerd:** otherwise every node's image pulls will fail.
- **Teams should build a private proxy:** Cloudflare Workers or a self-hosted Harbor.
- **Keep an eye on mirror status:** switch quickly when one fails — don't pin yourself to a single mirror.

Once your mirrors are set up, Docker feels silky smooth — `docker pull` is no longer a "go grab a coffee" ordeal.

Xiaozha Blog will keep sharing hands-on guides on Docker, Kubernetes, and cloud-native tech. Bookmark and follow for more.
