---
title: 自托管数据备份完全指南：别让硬盘带走你的一切
pubDatetime: "2026-10-24T00:00:00.000Z"
description: 自托管最大的风险不是被黑，是硬盘悄悄坏掉。本文讲清 3-2-1 备份原则、Restic 加密增量备份、Kopia、数据库 dump、自动清理策略，以及怎么验证备份真的能恢复。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/selfhost-backup-strategy"
ogImage: "/images/selfhost-backup-strategy-real.jpg"
coverAlt: "硬盘内部的盘片与磁头臂，暗调光线下的精密机械结构"
enSlug: "selfhost-backup-strategy"
---

你花两周搭好了 Immich、Jellyfin、Vaultwarden，照片、电影、密码全在里面。然后某天早上硬盘挂了。

自托管社区有句老话：**没有备份的 RAID 不是备份。** 更极端一点：没有验证过的备份不算备份。

这篇讲一套能落地的备份方案——不是"记得定期复制文件"这种废话，而是自动化、加密、可验证、能真的把你从灾难里捞回来的那一套。

## 先接受一个事实：硬盘一定会坏

机械硬盘的 AFR（年化故障率）大约 1-3%。你有 4 块盘，一年内至少一块出问题的概率不低。SSD 更好，但掉盘是突发性的，通常没有预警。

更常见的不是硬件故障，而是：

- **误操作**：`rm -rf` 打错路径、`docker compose down -v` 手滑、改配置把库覆盖了
- **勒索软件**：扫到你的公网服务，加密后要比特币
- **系统升级搞坏数据**：数据库版本不兼容，升级完打不开
- **机器物理损坏**：进水、雷击、熊孩子拔线

共同点：**都发生在你最没有防备的时候，且都无法靠"再买一块硬盘"解决。**

## 3-2-1 原则

备份领域的黄金法则，三十年没变过：

- **3** 份数据副本（1 份生产 + 2 份备份）
- **2** 种不同介质（比如内置硬盘 + 外部硬盘）
- **1** 份异地（防火、防盗、防熊孩子）

对应到家庭自托管：

| 副本 | 位置 | 介质 |
|---|---|---|
| 生产数据 | 服务器内置盘 | SSD/HDD |
| 本地备份 | 同一台机器的外挂盘 / NAS | 另一块盘 |
| 异地备份 | 对象存储（R2/B2/OSS） | 云端 |

第三条是绝大多数人跳过的——"我机器上已经有两份了"。但机器被偷、着火、雷击，两份一起没。

## 工具选择：Restic

备份工具很多，家庭场景我推荐 **Restic**：

- **增量 + 去重**：只传变化的数据块，第二次备份通常几分钟
- **加密**：本地就加密，传到公网云端也不用担心内容泄露
- **快照**：每次备份一个快照，可以按时间点恢复
- **存储后端多**：本地目录、SFTP、S3、B2、R2、Azure、Google Cloud 全支持
- **单文件二进制**：无依赖，下载即用

另一个选择 **Kopia**，有 GUI、界面更友好，功能类似。想要图形界面用 Kopia，要脚本化和稳定用 Restic。

这篇以 Restic 为主。

## Restic 上手

### 安装

```bash
# Linux
curl -L https://github.com/restic/restic/releases/latest/download/restic_0.17.0_linux_amd64 -o restic
chmod +x restic && sudo mv restic /usr/local/bin/

# macOS
brew install restic

# Windows
scoop install restic
```

### 初始化仓库

```bash
# 本地目录作为仓库
restic init --repo /mnt/backup/restic-repo

# 或者直接初始化到 R2（推荐，异地）
export AWS_ACCESS_KEY_ID=<R2 Access Key>
export AWS_SECRET_ACCESS_KEY=<R2 Secret Key>
restic -r s3:https://<account-id>.r2.cloudflarestorage.com/我的备份桶 init
```

R2 的配置见《Cloudflare R2 对象存储完全指南》。**强烈建议异地仓库直接建在 R2**，一份投入同时解决"本地备份"和"异地备份"。

### 设置密码

`init` 时会要求设仓库密码。**这个密码丢了，备份就彻底废了**——Restic 是客户端加密，没有后门。把它存进你的密码管理器（希望那是 Vaultwarden，见《Vaultwarden 自托管密码管理器》）。

### 第一次备份

```bash
restic -r /mnt/backup/restic-repo backup /opt/immich/upload /opt/jellyfin/media
```

第一次会全量上传，慢。之后每次只传变化的块：

```bash
$ restic -r /mnt/backup/restic-repo backup /opt/immich/upload
Files:           3 new     0 changed     12450 unchanged
Dirs:            1 new     0 changed     230 unchanged
Added to the repo: 412.8 MiB
duration: 0:02:14
```

12450 个文件没变，只传了 412MB——这就是增量的价值。

## 该备份什么

不是所有东西都值得备份。按优先级：

### 必须备份（不可再生或极难重建）

| 数据 | 位置 | 说明 |
|---|---|---|
| 用户上传文件 | Immich 的 `upload/`、Nextcloud 的 `data/` | 照片、文档，**丢了就是永远丢了** |
| 密码数据库 | Vaultwarden 的 `data/` | 丢了等于全部账号失守 |
| 应用数据库 | PostgreSQL/MySQL 数据目录 | 元数据、用户、设置 |
| 配置文件 | `/opt/*/docker-compose.yml`、`.env` | 重建服务的依据 |
| 自托管服务数据 | n8n、Uptime Kuma、Gitea 的卷 | 工作流、监控项、代码仓库 |

### 不用备份

- **媒体库的原始文件**：电影、音乐你有原盘或能重新下载
- **容器镜像**：`docker compose pull` 能拉回来
- **模型文件**：Ollama 的模型重新 `pull` 就行，几 GB 一个
- **日志和缓存**：没有价值
- **Pagefind 索引**：构建产物，重新 build 就有

原则：**能重新获得的东西不要占备份空间。** 备份越精简，越快越可靠。

### 数据库要单独 dump

数据库正在运行时直接复制数据目录，可能得到不一致的状态（写了一半的页）。正确做法是用数据库自己的导出工具：

```bash
# PostgreSQL
docker exec immich-database pg_dump -U postgres -d immich | gzip > immich-db.sql.gz

# MySQL / MariaDB
docker exec mariadb mysqldump -u root -p<密码> --all-databases | gzip > all-db.sql.gz
```

Restic 再备份这个 dump 文件。恢复时先起空库，再把 SQL 灌进去。

## 自动化：让它自己跑

手动备份 = 迟早忘了。写进 cron：

```bash
sudo crontab -e
```

```cron
# 每天凌晨 3 点：先 dump 数据库，再 restic 备份
0 3 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1
```

`backup.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

export RESTIC_REPOSITORY="s3:https://<account-id>.r2.cloudflarestorage.com/我的备份桶"
export AWS_ACCESS_KEY_ID="<R2 Access Key>"
export AWS_SECRET_ACCESS_KEY="<R2 Secret Key>"
export RESTIC_PASSWORD_FILE=/root/.restic-pass

TS=$(date +%F)

# 1. dump 各服务的数据库
docker exec immich-database pg_dump -U postgres -d immich | gzip > /tmp/immich-db-$TS.sql.gz
docker exec vaultwarden /usr/bin/sqlite3 /data/db.sqlite ".backup '/tmp/vw-$TS.sqlite'"

# 2. 备份文件数据 + dump
restic backup \
  /opt/immich/upload \
  /opt/vaultwarden/data \
  /tmp/immich-db-$TS.sql.gz \
  /tmp/vw-$TS.sqlite \
  --tag daily

# 3. 清理：保留 7 天日备、4 周周备、6 月月备
restic forget --tag daily \
  --keep-daily 7 --keep-weekly 4 --keep-monthly 6 \
  --prune

rm -f /tmp/immich-db-$TS.sql.gz /tmp/vw-$TS.sqlite

echo "$(date '+%F %T') 备份完成"
```

`--prune` 会真正删除过期数据，**它可能跑很久**（要重写仓库索引），建议放在凌晨。

## 关键：验证能恢复

这是整套方案里最容易被跳过、又最关键的一步。

**备份了但从没恢复过，等于没备份。** 你以为在保护数据，实际上可能存了一堆损坏的快照——直到灾难发生才发现，那时候已经晚了。

定期做恢复演练：

```bash
# 列出所有快照
restic -r <repo> snapshots

# 把某个快照恢复到临时目录（不动生产数据！）
restic -r <repo> restore latest --target /tmp/restore-test

# 检查关键文件在不在、能不能用
ls -la /tmp/restore-test/opt/immich/upload/ | head
gunzip -t /tmp/restore-test/tmp/immich-db-2026-10-24.sql.gz && echo "dump 完整"

# 清理测试目录
rm -rf /tmp/restore-test
```

建议**每季度做一次完整恢复演练**，随机挑一个快照，恢复到临时位置，验证文件能读、数据库能导入。花二十分钟，买一个安心。

更严谨的可以用 `restic check` 检查仓库完整性：

```bash
restic -r <repo> check --read-data
```

这会下载并校验所有数据块，很慢（几小时），但能发现静默损坏。半年跑一次。

## 加密与安全

Restic 默认客户端加密，仓库里的数据在本地就加密了，传到公网云端内容也不可读。但有几条要注意：

**别把密码写在脚本里**（像上面示例那样直接写 `RESTIC_PASSWORD`）。用密码文件，且权限收紧：

```bash
umask 077
echo "你的仓库密码" > /root/.restic-pass
chmod 600 /root/.restic-pass
```

**R2 的 Access Key 用最小权限**：只给这个桶的读写，不要给账户级权限。泄露了损失可控。

**考虑备份的备份**：R2 本身有冗余，但账号被封/密钥泄露/误删桶，备份一样没。极重要的数据（照片、密码库），本地盘再留一份，或者用第二个云端。

## 常见错误

| 错误 | 后果 |
|---|---|
| 只备份到同机器另一块盘 | 机器被偷/着火，两份一起没 |
| 备份从不验证 | 灾难时才发现备份是坏的 |
| 数据库直接复制数据目录 | 可能备份到不一致状态，恢复失败 |
| 备份脚本无人监控 | 悄悄失败三个月你不知道 |
| 没有清理策略 | 磁盘被历史备份塞满，新备份失败 |
| 密码只存在一处 | 仓库密码丢了，备份全废 |

最后一条尤其致命——**把仓库密码和备份位置写进密码管理器**，且确认那个管理器本身有备份。听起来像递归，但这就是关键数据的现实。

## 和 Uptime Kuma 配合

备份脚本失败了你不知道？用 Push 监控：

```bash
# crontab 里，备份成功后 ping 一下
0 3 * * * /usr/local/bin/backup.sh && curl -fsS https://kuma.example.com/api/push/xxxxx
```

Uptime Kuma 超过 24 小时没收到这个 ping 就告警——意味着备份脚本挂了、机器宕了、或者磁盘满了。这是监控"备份这件事本身"的唯一可靠办法，配置见《Uptime Kuma 自建监控》。

## 小结

自托管的备份不需要复杂方案，需要的是**真的执行**。最小可用配置：

1. Restic 仓库建在 R2（异地 + 免费额度）
2. 每天 cron 跑：dump 数据库 → 备份 → forget/prune
3. 备份成功 ping 一下 Uptime Kuma
4. 每季度恢复演练一次
5. 仓库密码存进密码管理器

做到这五条，你的自托管数据就真的安全了。剩下的——加密、多后端、Kopia——都是锦上添花。

上一篇《自托管 20 个必备开源应用》告诉你装什么，这一篇告诉你怎么守住。两边都做到，自托管才完整。
