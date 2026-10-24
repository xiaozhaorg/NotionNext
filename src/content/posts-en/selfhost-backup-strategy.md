---
title: "Self-Hosted Backup Guide: Don't Let a Dead Drive Take Everything"
pubDatetime: "2026-10-24T00:00:00.000Z"
description: "The biggest risk in self-hosting is not being hacked, it is a drive quietly dying. Covers the 3-2-1 rule, encrypted incremental backups with Restic, database dumps, automation, retention policies, and how to verify a backup can actually be restored."
author: "Xiaozha"
tags: ["Self-Hosting", "Open Source", "Tutorial", "Free Tools"]
draft: false
ogImage: "/images/selfhost-backup-strategy-real.jpg"
coverAlt: "Hard drive platter and actuator arm, precision mechanics in low light"
zhSlug: "selfhost-backup-strategy"
---

You spent two weeks setting up Immich, Jellyfin, and Vaultwarden — photos, movies, passwords, all of it. Then one morning the drive dies.

The self-hosting community has a saying: **RAID without a backup is not a backup.** More extreme version: a backup you have never restored is not a backup.

This post lays out a backup plan that actually works — not "remember to copy files regularly", but something automated, encrypted, verifiable, and capable of genuinely pulling you out of a disaster.

## Accept This First: Drives Will Fail

Mechanical drives have an AFR (annualized failure rate) around 1-3%. With four drives in a machine, the odds of at least one failing within a year are not small. SSDs are better, but they tend to die abruptly with no warning.

More often than hardware failure, though, it is:

- **Mistakes**: a typo in `rm -rf`, a stray `docker compose down -v`, a config that overwrites a database
- **Ransomware**: a scanner finds your public service and encrypts everything
- **Upgrades that break data**: an incompatible database version, and it will not open after upgrading
- **Physical damage**: water, lightning, a toddler pulling cables

The common thread: **it happens when you least expect it, and buying another drive does not fix it.**

## The 3-2-1 Rule

The golden rule of backups, unchanged for thirty years:

- **3** copies of data (1 production + 2 backups)
- **2** different media (e.g. internal drive + external drive)
- **1** copy off-site (fire, theft, and toddler proof)

Mapped to home self-hosting:

| Copy | Location | Media |
|---|---|---|
| Production | Server internal drive | SSD/HDD |
| Local backup | External drive on the same machine / NAS | Another drive |
| Off-site backup | Object storage (R2/B2/OSS) | Cloud |

The third line is what most people skip — "I already have two copies on the machine". Theft, fire, and a lightning strike take both.

## Tool Choice: Restic

Plenty of backup tools exist. For home use I recommend **Restic**:

- **Incremental + deduplicated**: only changed blocks are uploaded, so a second run usually takes minutes
- **Encrypted**: encrypted client-side, so pushing to a public cloud leaks nothing
- **Snapshots**: every run is a snapshot you can restore from any point in time
- **Many backends**: local directories, SFTP, S3, B2, R2, Azure, Google Cloud
- **Single binary**: no dependencies, download and run

The other option is **Kopia** — similar feature set with a GUI. Want a graphical interface, use Kopia; want scripting and stability, use Restic.

This post uses Restic.

## Getting Started with Restic

### Install

```bash
# Linux
curl -L https://github.com/restic/restic/releases/latest/download/restic_0.17.0_linux_amd64 -o restic
chmod +x restic && sudo mv restic /usr/local/bin/

# macOS
brew install restic

# Windows
scoop install restic
```

### Initialize a repository

```bash
# Local directory as the repo
restic init --repo /mnt/backup/restic-repo

# Or initialize straight to R2 (recommended, off-site)
export AWS_ACCESS_KEY_ID=<R2 Access Key>
export AWS_SECRET_ACCESS_KEY=<R2 Secret Key>
restic -r s3:https://<account-id>.r2.cloudflarestorage.com/my-backups init
```

R2 setup is covered in our [Cloudflare R2 guide](#). **Building the off-site repository on R2 directly is strongly advised** — one move solves both "local backup" and "off-site backup".

### Set the password

`init` asks for a repository password. **Lose it and the backups are gone for good** — Restic encrypts client-side with no backdoor. Store it in your password manager (which should be Vaultwarden, per our [Vaultwarden guide](#)).

### First backup

```bash
restic -r /mnt/backup/restic-repo backup /opt/immich/upload /opt/jellyfin/media
```

The first run uploads everything and is slow. After that only changed blocks:

```bash
$ restic -r /mnt/backup/restic-repo backup /opt/immich/upload
Files:           3 new     0 changed     12450 unchanged
Dirs:            1 new     0 changed     230 unchanged
Added to the repo: 412.8 MiB
duration: 0:02:14
```

12450 files unchanged, only 412MB transferred — that is the value of incremental.

## What to Back Up

Not everything deserves backup space. By priority:

### Must back up (irreplaceable or very hard to rebuild)

| Data | Location | Notes |
|---|---|---|
| User files | Immich's `upload/`, Nextcloud's `data/` | Photos, documents — **gone means gone** |
| Password database | Vaultwarden's `data/` | Lose it and every account is compromised |
| Application databases | PostgreSQL/MySQL data dirs | Metadata, users, settings |
| Config files | `/opt/*/docker-compose.yml`, `.env` | The blueprint for rebuilding services |
| Service data | n8n, Uptime Kuma, Gitea volumes | Workflows, monitors, code repos |

### Skip these

- **Original media files**: you have the discs or can re-download
- **Container images**: `docker compose pull` brings them back
- **Model files**: Ollama models re-`pull`, several GB each
- **Logs and caches**: no value
- **Pagefind index**: a build artifact, rebuilt on `astro build`

Principle: **do not spend backup space on anything you can re-obtain.** The leaner the backup, the faster and more reliable it is.

### Dump databases separately

Copying a live database's data directory can produce an inconsistent state (half-written pages). Use the database's own export tool:

```bash
# PostgreSQL
docker exec immich-database pg_dump -U postgres -d immich | gzip > immich-db.sql.gz

# MySQL / MariaDB
docker exec mariadb mysqldump -u root -p<password> --all-databases | gzip > all-db.sql.gz
```

Then back up that dump file with Restic. To restore, start an empty database and import the SQL.

## Automate It

Manual backups get forgotten eventually. Put it in cron:

```bash
sudo crontab -e
```

```cron
# Daily at 3 a.m.: dump databases first, then restic backup
0 3 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1
```

`backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

export RESTIC_REPOSITORY="s3:https://<account-id>.r2.cloudflarestorage.com/my-backups"
export AWS_ACCESS_KEY_ID="<R2 Access Key>"
export AWS_SECRET_ACCESS_KEY="<R2 Secret Key>"
export RESTIC_PASSWORD_FILE=/root/.restic-pass

TS=$(date +%F)

# 1. Dump each service's database
docker exec immich-database pg_dump -U postgres -d immich | gzip > /tmp/immich-db-$TS.sql.gz
docker exec vaultwarden /usr/bin/sqlite3 /data/db.sqlite ".backup '/tmp/vw-$TS.sqlite'"

# 2. Back up file data + dumps
restic backup \
  /opt/immich/upload \
  /opt/vaultwarden/data \
  /tmp/immich-db-$TS.sql.gz \
  /tmp/vw-$TS.sqlite \
  --tag daily

# 3. Retention: 7 daily, 4 weekly, 6 monthly
restic forget --tag daily \
  --keep-daily 7 --keep-weekly 4 --keep-monthly 6 \
  --prune

rm -f /tmp/immich-db-$TS.sql.gz /tmp/vw-$TS.sqlite

echo "$(date '+%F %T') backup complete"
```

`--prune` actually deletes expired data and **can take a long time** (it rewrites the repository index), so keep it in the small hours.

## The Critical Step: Verify You Can Restore

The most commonly skipped step, and the most important.

**A backup you have never restored is not a backup.** You think you are protecting your data, but you may be storing a pile of corrupted snapshots — and you only find out when disaster strikes, which is too late.

Run restore drills regularly:

```bash
# List snapshots
restic -r <repo> snapshots

# Restore a snapshot to a temp directory (never touch production!)
restic -r <repo> restore latest --target /tmp/restore-test

# Check that key files are present and usable
ls -la /tmp/restore-test/opt/immich/upload/ | head
gunzip -t /tmp/restore-test/tmp/immich-db-2026-10-24.sql.gz && echo "dump intact"

# Clean up
rm -rf /tmp/restore-test
```

Do a **full restore drill once a quarter**: pick a random snapshot, restore it somewhere temporary, verify files read and the database imports. Twenty minutes for real peace of mind.

For stricter integrity checking:

```bash
restic -r <repo> check --read-data
```

This downloads and verifies every data block — slow (hours) — but it catches silent corruption. Run it every six months.

## Encryption and Security

Restic encrypts client-side by default, so data in the repository is encrypted before it ever reaches a public cloud. A few notes:

**Do not put the password in the script** (as the sample above does). Use a password file with tight permissions:

```bash
umask 077
echo "your repository password" > /root/.restic-pass
chmod 600 /root/.restic-pass
```

**Give the R2 Access Key least privilege**: read/write on that one bucket only, not account-level. If it leaks, the damage is contained.

**Consider a backup of the backup**: R2 is redundant, but a suspended account, leaked key, or accidentally deleted bucket takes the backup with it. For truly critical data (photos, password vault), keep a local copy too, or use a second cloud.

## Common Mistakes

| Mistake | Consequence |
|---|---|
| Backing up only to another drive in the same machine | Theft or fire takes both copies |
| Never verifying backups | You discover they were broken during the disaster |
| Copying database data directories directly | Possibly inconsistent, restore fails |
| Backup script with no monitoring | Fails silently for three months |
| No retention policy | Historical backups fill the disk and new runs fail |
| Password stored in one place only | Lose the repo password, lose everything |

That last one is especially fatal — **store the repository password and backup location in your password manager**, and make sure that manager is itself backed up. Sounds recursive, but that is the reality of critical data.

## Pair It with Uptime Kuma

How do you know when the backup script fails? Use a Push monitor:

```bash
# In crontab, ping after a successful backup
0 3 * * * /usr/local/bin/backup.sh && curl -fsS https://kuma.example.com/api/push/xxxxx
```

If Uptime Kuma does not receive that ping within 24 hours it alerts — meaning the backup script died, the machine is down, or the disk is full. This is the only reliable way to monitor "the backup itself"; setup is in our [Uptime Kuma guide](#).

## Summary

Self-hosted backups do not need a complex design. They need to **actually run**. Minimum viable setup:

1. Restic repository on R2 (off-site, free tier)
2. Daily cron: dump databases → back up → forget/prune
3. Ping Uptime Kuma on success
4. Restore drill once a quarter
5. Repository password in your password manager

Do these five and your self-hosted data is genuinely safe. Everything else — encryption extras, multiple backends, Kopia — is garnish.

Our [20 essential self-hosted apps](#) post told you what to install. This one tells you how to keep it. Do both and self-hosting is complete.
