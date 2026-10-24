---
title: Ubuntu Server 初始化配置：拿到新服务器必做的 10 件事
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: 新服务器到手第一件事做什么？这份 Ubuntu Server 初始化清单覆盖更新源、普通用户、SSH 密钥登录与加固、UFW 防火墙、时区、Docker、自动安全更新、Fail2ban、Swap 和监控，附一键脚本。
author: 小吒
tags:
  - 教程
  - 开发工具
  - 免费工具
draft: false
sourceUrl: "https://xiaozha.org/article/ubuntu-server-setup"
ogImage: "/images/ubuntu-server-setup-real.jpg"
coverAlt: "服务器机房中排列整齐的机柜与网络设备"
enSlug: "ubuntu-server-setup"
---

新开一台 VPS 或拿到一台新服务器，第一件事不是装应用，而是把地基打好。默认配置的服务器是暴露在公网上的：root 密码登录、没防火墙、没自动更新——上线几天就会被扫描器盯上。

这份清单按顺序做一遍，大约二十分钟，能把绝大多数常见攻击路径堵掉。文末附一键脚本。

## 一、更新系统

```bash
sudo apt update && sudo apt upgrade -y
```

第一次登录就做。后面的步骤都基于最新的软件包。

## 二、创建普通用户并授予 sudo

**不要用 root 日常操作。** 建一个普通用户，需要提权时再用 `sudo`。

```bash
# 创建用户，-m 建家目录，-s 指定 shell
sudo adduser deploy

# 加入 sudo 组
sudo usermod -aG sudo deploy

# 切到新用户
su - deploy
```

之后所有命令都以 `deploy` 身份执行，`deploy` 的家目录也是后续放项目和 Docker 配置的地方。

## 三、配置 SSH 密钥登录，关掉密码登录

这是整套清单里**最重要的一步**。密码登录意味着要跟全网的暴力破解脚本对抗，密钥登录基本杜绝这件事。

先给自己生成密钥对（在**本地电脑**上执行，不要 ssh 登录时现生成）：

```bash
# macOS / Linux
ssh-keygen -t ed25519 -C "your@email.com"

# Windows PowerShell 同理，或用 WSL
```

默认存在 `~/.ssh/id_ed25519`（私钥）和 `~/.ssh/id_ed25519.pub`（公钥）。**私钥永远不要上传到服务器。**

把公钥装到服务器：

```bash
# 本地电脑执行
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@你的服务器IP
```

如果 `ssh-copy-id` 不可用，手动来：

```bash
# 服务器上，以 deploy 身份
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys   # 粘贴本地 id_ed25519.pub 的全部内容
chmod 600 ~/.ssh/authorized_keys
```

**先测试密钥能登录，再关密码登录**——顺序反了会把自己锁在门外。

新开一个终端试一下：

```bash
ssh -i ~/.ssh/id_ed25519 deploy@你的服务器IP
```

能进，再改 SSH 配置：

```bash
sudo nano /etc/ssh/sshd_config
```

```text
Port 22                          # 可改成一个不常见的端口，减少扫描噪音
PermitRootLogin no               # 禁止 root 直接登录
PasswordAuthentication no        # 禁止密码登录
PubkeyAuthentication yes         # 允许密钥登录
```

改端口要注意：防火墙和云服务商的安全组都要同步放行，否则改完就连不上了。

```bash
sudo systemctl restart sshd
```

### 顺手再加固一点

```text
MaxAuthTries 3                  # 每个连接最多试 3 次
ClientAliveInterval 300         # 5 分钟无操作自动断开
ClientAliveCountMax 2
AllowUsers deploy               # 只允许这个用户登录
```

## 四、配置 UFW 防火墙

UFW 是 iptables 的友好前端，几行命令搞定。

```bash
# 默认策略：拒绝所有入站，放行所有出站
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 放行 SSH（端口如果改过，这里跟着改）
sudo ufw allow 22/tcp

# 放行 Web 服务
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 只给某个 IP 开放管理端口（比如监控面板）
sudo ufw allow from 203.0.113.10 to any port 3001

# 启用，输入 y 确认
sudo ufw enable
```

启用后立刻确认 SSH 端口是放行的——最好开着现有连接操作，万一配错连接还在。

```bash
sudo ufw status verbose      # 查看规则
sudo ufw status numbered     # 带编号，方便删除
```

### 给 SSH 加限速

```bash
sudo ufw limit 22/tcp
```

同一 IP 30 秒内超过 6 次连接就被拒，配合密钥登录基本无懈可击。

## 五、设置时区并同步时间

时区错乱会让日志时间、cron 任务、证书校验全都对不上，是那种"不致命但能烦死你"的问题。

```bash
# 查看当前时区
timedatectl

# 设置（交互式选择，或直接指定）
sudo timedatectl set-timezone Asia/Shanghai
```

NTP 默认开启，确认一下：

```bash
timedatectl status | grep -i synchronized
```

显示 `System clock synchronized: yes` 即可。对时间精度有要求（比如数据库主从），可以换 chrony：

```bash
sudo apt install chrony -y
sudo systemctl enable --now chrony
```

## 六、安装 Docker 和 Docker Compose

绝大多数自托管应用现在都是容器化部署，一次装好省掉后面反复折腾。

```bash
# 卸掉可能存在的旧版本
sudo apt remove docker docker-engine docker.io containerd runc

# 装依赖
sudo apt update
sudo apt install ca-certificates curl gnupg

# 添加 GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 添加仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装引擎、CLI、Buildx 和 Compose 插件
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 让 deploy 用户免 sudo 跑 docker
sudo usermod -aG docker deploy

# 设置开机自启
sudo systemctl enable --now docker
```

`usermod -aG` 之后要重新登录才生效。

## 七、开启自动安全更新

服务器不可能天天手动 `apt upgrade`。让安全补丁自动装上，是性价比最高的一件事。

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

弹出的界面选 `<Yes>`。配置文件在 `/etc/apt/auto-upgrades`，默认只装安全更新，不装普通版本更新——这个默认值是对的，别改成全自动升级，那容易在半夜把服务搞挂。

```bash
# 查看自动更新日志
sudo tail -f /var/log/unattended-upgrades/unattended-upgrades.log
```

## 八、安装 Fail2ban

UFW 限速是一层，Fail2ban 是另一层：它读日志，发现某个 IP 反复失败就临时封掉。

```bash
sudo apt install fail2ban -y
sudo systemctl enable --now fail2ban
```

默认就保护 SSH。本地配置放 `/etc/fail2ban/jail.local`：

```ini
[DEFAULT]
bantime = 1h          # 封禁时长
findtime = 10m        # 统计窗口
maxretry = 5          # 窗口内失败几次就封

[sshd]
enabled = true
```

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd    # 查看当前封禁的 IP
```

配合前面的密钥登录，SSH 这条线基本就堵死了。

## 九、配置 Swap

内存小的机器（1G/2G）装 Docker 很容易 OOM。加一点 Swap 作为缓冲，代价是慢一点，但比直接被 kill 好。

```bash
# 看当前 swap
free -h
swapon --show
```

创建 2G swap 文件：

```bash
sudo fallocate -l 2G /swapfile
# 如果文件系统不支持 fallocate，改用 dd：
# sudo dd if=/dev/zero of=/swapfile bs=1M count=2048

# 权限必须只有 root 能读，否则 swap 不会被启用
sudo chmod 600 /swapfile

sudo mkswap /swapfile
sudo swapon /swapfile
```

持久化，写进 fstab：

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

调一下使用倾向（`vm.swappiness`，默认 60，服务器上一般调到 10）：

```bash
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

注意：**Swap 不是内存的替代品**，只是防止突发流量把机器搞崩。长期靠 swap 换性能不如加内存。

## 十、装监控

看不见服务器状态，就等于闭着眼睛开车。三个由轻到重：

```bash
sudo apt install htop -y        # 基础：CPU/内存/进程
```

`glances` 是更全的系统仪表盘：

```bash
sudo apt install glances -y
glances
```

要真正意义上的"挂了能知道"，装 Uptime Kuma，带告警推送：

```bash
sudo mkdir -p /opt/uptime-kuma && cd /opt/uptime-kuma
```

`docker-compose.yml`：

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data

volumes:
  uptime-kuma-data:
```

```bash
sudo docker compose up -d
```

访问 `http://服务器IP:3001`，把 CPU、内存、磁盘、HTTP 服务都加上监控，再接上 Telegram 或 Server酱推送。详细配置见《Uptime Kuma 自建监控》。

想要更深的指标（历史趋势、自定义面板）就上 netdata：

```bash
docker run -d --name=netdata -p 19999:19999 --restart unless-stopped \
  -v netdataconfig:/etc/netdata -v netdatalib:/var/lib/netdata \
  -v /proc:/host/proc:ro -v /sys:/host/sys:ro \
  --cap-add SYS_PTRACE netdata/netdata
```

## 一键脚本

把下面内容存成 `setup.sh`，按需修改配置区，`bash setup.sh` 一把梭。

```bash
#!/usr/bin/env bash
set -euo pipefail

# ===== 配置区，按需修改 =====
NEW_USER="deploy"
SSH_PORT="22"
SWAP_SIZE="2G"
TIMEZONE="Asia/Shanghai"
# ==========================

echo "==> 1/10 更新系统"
apt update && apt upgrade -y

echo "==> 2/10 创建用户 $NEW_USER"
adduser --disabled-password --gecos "" "$NEW_USER" || true
usermod -aG sudo "$NEW_USER"

echo "==> 3/10 SSH 加固"
sed -i "s/^#\?Port .*/Port $SSH_PORT/" /etc/ssh/sshd_config
sed -i "s/^#\?PermitRootLogin .*/PermitRootLogin no/" /etc/ssh/sshd_config
sed -i "s/^#\?PasswordAuthentication .*/PasswordAuthentication no/" /etc/ssh/sshd_config
systemctl restart sshd

echo "==> 4/10 UFW 防火墙"
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT/tcp"
ufw limit "$SSH_PORT/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 5/10 时区与时间同步"
timedatectl set-timezone "$TIMEZONE"

echo "==> 6/10 安装 Docker"
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker "$NEW_USER"
systemctl enable --now docker

echo "==> 7/10 自动安全更新"
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo "==> 8/10 Fail2ban"
apt install -y fail2ban
systemctl enable --now fail2ban

echo "==> 9/10 Swap"
if [ ! -f /swapfile ]; then
  fallocate -l "$SWAP_SIZE" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> 10/10 监控工具"
apt install -y htop glances

echo "完成。请重新登录并验证 SSH 密钥可用。"
```

**用脚本前务必先确认 SSH 公钥已经装好**，否则 `PasswordAuthentication no` 一生效你就进不去了。

## 小结

这十件事按风险排序的话：**SSH 密钥登录 > 防火墙 > 自动更新 > 普通用户**，这四个是必做；Docker、Swap、监控按你的实际需要。

做完了，这台服务器就有了一个像样的地基。接下来不管是搭博客、跑自托管应用还是部署 API，都从这儿开始。想接着装什么，可以看《自托管 20 个必备开源应用》或者《Docker Compose 入门到实战》。
