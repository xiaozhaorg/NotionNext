---
title: "Ubuntu Server Initial Setup: 10 Things to Do on a Fresh Server"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "10 essential steps for Ubuntu Server initial setup: SSH security, firewall, auto-updates, timezone, Docker, monitoring. A complete hardening checklist."
author: "Xiaozha"
tags: ["Tutorial", "Linux", "DevOps", "Server"]
featured: false
draft: false
ogImage: "/images/ubuntu-server-setup-real.jpg"
coverAlt: "Server room with neatly arranged racks and network equipment"
zhSlug: "ubuntu-server-setup"
---

A fresh Ubuntu Server is a blank page. The default install is functional but it is **not** production-ready: it ships with `root` SSH enabled on a public port, no firewall, no time sync, no auto-updates, and only the most basic monitoring. The first 30 minutes you spend hardening it will save you hours of incident response later.

This guide walks through the **10 things I do on every new Ubuntu server** before I install the first application. Whether you are spinning up a VPS for a hobby project, a Docker host for self-hosted apps, or a production box, this checklist applies.

---

## 1. Update and Upgrade Packages

The first command on any new server updates the package index and installs the latest security patches.

```bash
# Log in as root (or a user with sudo) the first time
apt update
apt upgrade -y
apt autoremove -y
```

`apt update` refreshes the package index from the configured repositories. `apt upgrade` installs new versions of installed packages. `apt autoremove` removes packages that were installed as dependencies but are no longer needed.

To enable the **universe** and **multiverse** repositories (often useful for additional packages):

```bash
add-apt-repository universe
add-apt-repository multiverse
apt update
```

For an Ubuntu release that has gone past standard support, switch to the **ESM** (Extended Security Maintenance) repository:

```bash
pro enable esm-infra
```

The `pro` command requires a free Ubuntu One account, but it gives you security updates for the kernel and core packages for up to 12 years on LTS releases.

---

## 2. Create a Non-Root User with sudo

Running services as `root` is asking for trouble. The first user-creation step is to make a regular account with sudo privileges, then disable root SSH access (in step 3).

```bash
# Create the user; -m makes a home directory, -s sets the shell
adduser deploy
# Answer the prompts for password and full name

# Add the user to the sudo group
usermod -aG sudo deploy
```

Verify:

```bash
su - deploy
sudo whoami
# root
```

If `sudo whoami` returns `root` without prompting for a password, your sudo group is configured to not require a password (the default on cloud images). For tighter security, require a password:

```bash
# As root or with sudo
visudo
```

Find the line:

```
%sudo   ALL=(ALL:ALL) NOPASSWD: ALL
```

Change it to:

```
%sudo   ALL=(ALL:ALL) ALL
```

Now sudo will prompt for the user's password.

### Copy your SSH key to the new user

If you've been logging in as `root`, copy your public key to the new user before you disable root login (otherwise you'll lock yourself out):

```bash
# On your local machine
ssh-copy-id deploy@<server-ip>
```

Or manually:

```bash
# On the server, as deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Paste your public key
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## 3. Configure SSH Key Authentication (Disable Password Login)

Password-based SSH is the #1 vector for brute-force attacks. Once you've confirmed your SSH key works for the new user, disable password auth entirely.

```bash
sudo nano /etc/ssh/sshd_config
```

Set (or add) these lines:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
KbdInteractiveAuthentication no
```

Optionally, change the SSH port from 22 to something else (e.g. 2222) to drop log noise from drive-by scanners:

```
Port 2222
```

**Important**: if you change the port, you must update your firewall (next step) to allow the new port **before** you restart sshd, or you'll lock yourself out.

Apply the changes:

```bash
sudo systemctl restart sshd
```

Test from a new terminal (don't close the existing one) that you can still log in:

```bash
ssh -p 2222 deploy@<server-ip>
```

Only after a successful login should you close your original session.

### SSH hardening extras (optional but recommended)

In `/etc/ssh/sshd_config`:

```
MaxAuthTries 3
LoginGraceTime 30
AllowUsers deploy
ClientAliveInterval 300
ClientAliveCountMax 2
```

- `AllowUsers deploy` only lets the `deploy` user SSH in — even if other users are created later, they can't SSH until explicitly added.
- `ClientAliveInterval` / `ClientAliveCountMax` disconnect idle sessions.

Restart sshd after any change.

---

## 4. Configure UFW Firewall

`ufw` (Uncomplicated Firewall) is Ubuntu's frontend for `iptables`. Enable it and open only the ports you need.

```bash
# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (use the port you set in step 3)
sudo ufw allow 2222/tcp      # or just: sudo ufw allow OpenSSH

# Allow HTTP and HTTPS for web services
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow a specific IP only (e.g. for an admin port)
sudo ufw allow from 192.0.2.0/24 to any port 5432 proto tcp

# Enable the firewall
sudo ufw enable
# Type 'y' to confirm
```

Verify:

```bash
sudo ufw status verbose
```

Output:

```
Status: active
To                         Action      From
--                         ------      ----
2222/tcp                   ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
192.0.2.0/24 5432/tcp      ALLOW       192.0.2.0/24
```

**Order matters**: set your default-deny policy and explicitly allow SSH **before** enabling the firewall, or you'll cut yourself off.

### Rate-limit SSH

To slow brute-force attempts on the SSH port even further:

```bash
sudo ufw limit 2222/tcp
```

This limits any single IP to 6 connections per 30 seconds.

---

## 5. Set Timezone and Sync Time

A server with the wrong timezone causes silent bugs: log timestamps that don't match reality, cron jobs running at unexpected times, certificate validity checks failing.

### Set the timezone

```bash
sudo timedatectl set-timezone Asia/Shanghai
```

List all available timezones:

```bash
timedatectl list-timezones | grep -i america
```

### Enable NTP sync

Modern Ubuntu uses `systemd-timesyncd` by default. Enable it:

```bash
sudo timedatectl set-ntp true
timedatectl status
```

Output:

```
               Local time: Fri 2026-08-28 10:00:00 CST
           Universal time: Fri 2026-08-28 02:00:00 UTC
                 RTC time: Fri 2026-08-28 02:00:00
                Time zone: Asia/Shanghai (CST, +0800)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```

### Use chrony for better accuracy (optional)

For servers that need sub-second accuracy (databases, distributed systems), replace timesyncd with `chrony`:

```bash
sudo apt install -y chrony
sudo systemctl enable --now chrony
chronyc tracking
```

---

## 6. Install Docker and Docker Compose

Most modern self-hosted applications ship as Docker containers. Installing Docker and Compose now means every later install is a one-liner.

```bash
# Remove old Docker if present
sudo apt-get remove -y docker docker-engine docker.io containerd runc

# Install prerequisites
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine, CLI, Buildx, and Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Let your user run docker without sudo
sudo usermod -aG docker deploy
newgrp docker
```

Verify:

```bash
docker --version
docker compose version
docker run hello-world
```

If all three commands succeed, you're ready to deploy anything you find on Docker Hub. For a deeper dive, see our [Docker Compose tutorial](/en/articles/docker-compose-tutorial).

---

## 7. Enable Automatic Security Updates

Ubuntu ships `unattended-upgrades` for exactly this: it installs security updates automatically and reports what it did.

```bash
sudo apt install -y unattended-upgrades apt-listchanges
sudo dpkg-reconfigure -plow unattended-upgrades
# Select 'Yes'
```

Tune `/etc/apt/apt.conf.d/50unattended-upgrades`:

```
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

// Auto-reboot if a kernel update requires it
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";

// Email report (optional — install mailutils first)
Unattended-Upgrade::Mail "you@example.com";
```

Tune the periodic frequency in `/etc/apt/apt.conf.d/20auto-upgrades`:

```
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
```

The values are days. With these settings, the system checks for updates daily, downloads upgradeable packages, runs the security upgrade, and cleans the apt cache weekly.

**Warning**: automatic reboots can interrupt services. If you'd rather be in control of reboots, set `Automatic-Reboot "false"` and watch for kernel updates yourself. Most production setups schedule reboots via a maintenance window.

Test a dry-run:

```bash
sudo unattended-upgrade --dry-run --debug
```

---

## 8. Install Fail2ban for Brute-Force Protection

Even with SSH key-only auth and a custom port, scanners will hammer your SSH port. Fail2ban watches logs and temporarily bans IPs that fail too many times.

```bash
sudo apt install -y fail2ban
```

Fail2ban ships sensible defaults — it bans IPs that fail SSH auth 5 times in 10 minutes for 10 minutes. For more aggressive rules, create a local override:

```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 3
backend  = systemd

[sshd]
enabled  = true
port     = 2222
logpath  = %(sshd_log)s
```

- `bantime = 3600` — ban for 1 hour.
- `findtime = 600` — count failures within a 10-minute window.
- `maxretry = 3` — ban after 3 failures.
- `port = 2222` — match the SSH port you set in step 3.

Restart:

```bash
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

Check status:

```bash
sudo fail2ban-client status sshd
```

Output shows currently banned IPs and the total ban count.

---

## 9. Set Up Swap Space

Cloud VPS images often come with no swap. If a process spikes memory, the OOM killer starts killing things — usually the wrong things. Adding 1-2 GB of swap gives you a safety net.

### Check current swap

```bash
sudo swapon --show
free -h
```

If both return nothing (or 0B), you have no swap.

### Create a swap file

```bash
# Create a 2 GB swap file
sudo fallocate -l 2G /swapfile

# If fallocate isn't supported, fall back to dd:
# sudo dd if=/dev/zero of=/swapfile bs=1M count=2048

# Set permissions (must be readable only by root)
sudo chmod 600 /swapfile

# Format it as swap
sudo mkswap /swapfile

# Enable it
sudo swapon /swapfile

# Verify
sudo swapon --show
free -h
```

### Make it persistent

Add to `/etc/fstab`:

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Tune swap behavior

By default Linux is reluctant to use swap (swappiness = 60). For a server with sufficient RAM that you want to lean on swap only as a last resort, set swappiness low:

```bash
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

`vm.swappiness=10` makes the kernel prefer keeping application data in RAM and only swap under memory pressure.

---

## 10. Install Monitoring Tools (htop, glances, uptime-kuma)

Once a server is in production you want eyes on it. Three tools cover most needs: `htop` for ad-hoc CPU/memory checks, `glances` for a one-screen dashboard, and `uptime-kuma` for uptime alerts.

### htop and basics

```bash
sudo apt install -y htop iotop iftop nload
```

- `htop` — interactive process viewer, far better than `top`.
- `iotop` — disk I/O per process.
- `iftop` — network bandwidth per connection.
- `nload` — real-time network throughput.

### glances (full-system dashboard)

```bash
sudo apt install -y glances
glances
```

Glances shows CPU, memory, load, disk I/O, network, top processes, and Docker containers in one screen. It can also expose a web UI and a Prometheus endpoint.

### uptime-kuma (uptime monitoring with alerts)

Uptime-Kuma is a self-hosted "is it up?" monitor with notifications via Telegram, Discord, Slack, email, and more. Deploy it with Docker:

```yaml
# /opt/uptime-kuma/docker-compose.yml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
```

```bash
sudo mkdir -p /opt/uptime-kuma
sudo cp docker-compose.yml /opt/uptime-kuma/
cd /opt/uptime-kuma
sudo docker compose up -d
```

Open `http://<server-ip>:3001` and create the admin account. Add HTTP / TCP / DNS monitors for your services, configure a notification channel, and you'll get alerts within seconds of any outage.

### Bonus: netdata (optional, deeper metrics)

For full per-process, per-disk, and per-container metrics with a polished UI:

```bash
wget -O /tmp/netdata-kickstart.sh https://my-netdata.io/kickstart.sh
sh /tmp/netdata-kickstart.sh
```

Netdata exposes a dashboard at `http://<server-ip>:19999`.

---

## Bonus: One-Line Script to Do It All

If you provision servers often, paste this into a setup script and run it on every fresh install. It runs steps 1-10 in sequence, with prompts for the username and SSH port.

```bash
#!/usr/bin/env bash
set -euo pipefail

# === Configuration ===
NEW_USER="${NEW_USER:-deploy}"
SSH_PORT="${SSH_PORT:-2222}"
TIMEZONE="${TIMEZONE:-Asia/Shanghai}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

# === 1. Update and upgrade ===
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y upgrade
apt-get -y autoremove

# === 2. Create non-root user with sudo ===
if ! id -u "$NEW_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$NEW_USER"
  usermod -aG sudo "$NEW_USER"
fi

# === 3. SSH key auth, custom port, disable root login ===
sed -i "s/^#\?Port .*/Port $SSH_PORT/" /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication .*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# === 4. UFW firewall ===
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT"/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# === 5. Timezone and time sync ===
timedatectl set-timezone "$TIMEZONE"
timedatectl set-ntp true

# === 6. Docker and Docker Compose ===
if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
  usermod -aG docker "$NEW_USER"
fi

# === 7. Automatic security updates ===
apt-get install -y unattended-upgrades apt-listchanges
echo 'APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";' > /etc/apt/apt.conf.d/20auto-upgrades

# === 8. Fail2ban ===
apt-get install -y fail2ban
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 3
backend  = systemd

[sshd]
enabled  = true
port     = $SSH_PORT
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

# === 9. Swap ===
if ! swapon --show | grep -q swapfile; then
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
  sysctl -p
fi

# === 10. Monitoring tools ===
apt-get install -y htop glances iotop iftop nload

echo "=== Done ==="
echo "Log in as: ssh -p $SSH_PORT $NEW_USER@<server-ip>"
```

Save it as `setup.sh`, make it executable, and run as root:

```bash
chmod +x setup.sh
NEW_USER=deploy SSH_PORT=2222 TIMEZONE=Asia/Shanghai ./setup.sh
```

Run this on a fresh Ubuntu 22.04 / 24.04 LTS install and you'll have a hardened, monitored, Docker-ready server in about 5 minutes.

---

## Summary

A hardened server is the foundation of every reliable deployment. In this guide you learned the **10 essential Ubuntu Server setup steps**:

1. **Update and upgrade** packages and enable ESM for old releases.
2. **Create a non-root user** with sudo, require a password for sudo.
3. **Harden SSH**: keys only, custom port, no root login, idle disconnect.
4. **Configure UFW** with default-deny inbound, allow only 22 / 80 / 443, rate-limit SSH.
5. **Set timezone and enable NTP** so logs and cron jobs make sense.
6. **Install Docker and Docker Compose** for clean application deploys.
7. **Enable unattended-upgrades** for automatic security patches with optional auto-reboot.
8. **Install Fail2ban** to ban brute-force attackers automatically.
9. **Add swap** so a memory spike doesn't trigger the OOM killer.
10. **Install monitoring tools**: `htop`, `glances`, and `uptime-kuma`.

Plus a **one-line setup script** that runs all ten steps unattended, with sensible defaults and environment-variable overrides for the username, port, timezone, and swap size.

The next step is to put your server to work. If you want inspiration, check out our tutorials on [Immich self-hosted photo backup](/en/articles/immich-photo-backup), [Jellyfin media server](/en/articles/jellyfin-media-server), [Ollama local LLMs](/en/articles/ollama-local-llm), and [Cloudflare R2 object storage](/en/articles/cloudflare-r2-storage). Happy hosting! 🐧
