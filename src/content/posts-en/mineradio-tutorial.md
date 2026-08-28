---
title: "Mineradio Music Player Tutorial (2026): An Open-Source 3D Stereo Lyrics Player with NetEase & QQ Music Sync"
pubDatetime: "2026-07-29T00:00:00.000Z"
description: "Mineradio is a fully open-source, free music player that supports logging in with NetEase Cloud Music and QQ Music to sync playlists, with 3D stereo lyrics and dynamic visual switching for a listening experience far beyond ordinary players."
author: "Xiaozha"
tags: ["Mineradio", "Music", "Tutorial", "Open Source"]
featured: false
draft: false
ogImage: "/images/mineradio-tutorial-real.jpg"
coverAlt: "Headphones and a music player interface resting beside a MacBook"
zhSlug: "mineradio-tutorial"
---

Key takeaways, verified through hands-on testing:

- Mineradio is a fully open-source, free music player with nearly 9K stars on GitHub
- Log in with NetEase Cloud Music or QQ Music and your playlists sync over directly — no need to switch platforms
- 3D stereo lyrics plus dynamic visual switching, so the listening experience is genuinely a big step up from ordinary players
- Two versions are available:

The online version (streaming playback) and the local version (plays only local files). If you want a player that looks great, is free, and supports logging into the mainstream music platforms, Mineradio is well worth a try.

🎯

Best for:

Users who care about player aesthetics / NetEase Cloud Music and QQ Music users / anyone who enjoys 3D visualization effects

---

### What Is Mineradio?

Mineradio is an open-source, cross-platform music player built on Electron, supporting Windows and macOS.

It mainly solves:

- Delivering a great-looking playback interface with 3D stereo lyrics and dynamic visuals
- Supporting login with NetEase Cloud Music and QQ Music, with automatic playlist sync
- Being completely free, open-source, and ad-free

### Why Choose Mineradio?

There are plenty of free, open-source music players out there, but Mineradio stands out in a few ways:

| Solution | 3D Interface | NetEase/QQ Login | Local Music | Free & Open Source |
| --- | --- | --- | --- | --- |
| Mineradio | ✅ Stereo lyrics + 3D architecture | ✅ Supported | ✅ Supported | ✅ |
| Ordinary player | ❌ Flat lyrics | ❌ Not supported | ✅ Supported | Depends |
| NetEase client | ❌ Flat UI | ✅ Official | ❌ Online only | ❌ Has ads |

Mineradio's advantage:

It keeps the NetEase Cloud Music and QQ Music playlist ecosystem while offering an entirely different playback interface experience.

While you listen, the 3D lyrics and visuals switch automatically along with the music, giving it far more ceremony than a regular player.

---

### 🛠️ Prerequisites

- A Windows or macOS computer
- Access to GitHub
- A NetEase Cloud Music or QQ Music account (needed for the online version)

⏱️ Estimated time: 5 minutes
Difficulty: ⭐

🚀 Mineradio Installation Tutorial

#### Step 1: Download the installer

Open the `GitHub` project page for Mineradio, click Releases on the right, find the latest version, and download the installer for your system.

[github.com — https://github.com/XxHuberrr/Mineradio](https://github.com/XxHuberrr/Mineradio)

#### Step 2: Install

After downloading, double-click the installer and follow the prompts.

Launch it as soon as installation finishes.

#### Step 3: Log in (online version)

The interface looks very polished when it opens. Click the login button in the top-right corner — it supports both NetEase Cloud Music and QQ Music.

Clicking it takes you to the official login page. The player is just a window; your login info stays secure.

Once you log in, your playlists sync over automatically and you can stream directly.

#### Step 4: Interface operations

The player interface is 3D, and you can drag with your mouse to rotate the view.

When music is playing, the lyrics are displayed in 3D too, and the visuals switch automatically to match the rhythm.

In the bottom-right corner, you can adjust the layout, appearance, lyric settings, dynamic effects, and other options.

#### Local version (no login needed)

There's also a modified build on GitHub that has no login screen — you just import local music files and play.

[github.com — https://github.com/oirge/Mineradio](https://github.com/oirge/Mineradio)

Installation is the same: download the matching build and install it.

Once open, you can drag a local music folder or files straight in to play.

---

### 🎵 Custom Lyrics

When playing local music, the player can't fetch lyrics online, so you need to add them manually.

- Find the lyrics option in Settings
- Scroll down to Custom Lyrics and click into it
- You can paste timed lyrics (matched precisely) or plain-text lyrics (spread automatically across the song's duration)

⚠️ Note:

AI-generated timed lyrics don't always match the rhythm perfectly, so you may need to adjust them manually.

---

### 📊 My Testing Experience

Test environment:

Windows 10 / Latest Mineradio + modified build v1.2.40

#### ✅ The good

- The interface really is beautiful — the 3D stereo lyrics and dynamic visuals are stunning
- NetEase Cloud Music and QQ Music login work fine, and playlist sync is stable
- The local music analysis features are nice (MR analysis / low-level analysis)
- Completely free with no ads

#### ❌ The not-so-good

- Custom lyrics' timeline matching isn't precise enough and needs manual tweaking
- The modified build can't search for songs online — it only plays local files
- The 3D interface can be a bit heavy on low-spec machines

---

### ❓ FAQ

#### Is Mineradio free?

Yes, completely free. It's an open-source project you can download straight from GitHub, with nothing behind a paywall.

#### Which music platforms does Mineradio support?

The official version supports logging in with NetEase Cloud Music and QQ Music; your playlists sync automatically after login.

#### What's the difference between the local version and the online version?

The online version requires logging in with NetEase Cloud Music or QQ Music, and lets you stream online and sync playlists.

The local version is a modified build that needs no login and only plays music files stored on your computer.

#### Can I customize lyrics in Mineradio?

Yes.

When playing local music, go to Settings → Lyrics → Custom, where you can paste lyrics with or without a timeline.

Timed lyrics are more precise, but based on my testing, AI-generated timings don't always match perfectly.

#### Does Mineradio consume a lot of resources?

The 3D interface uses more GPU resources than ordinary players, so there may be slight lag on low-spec machines.

For a typical setup, everyday use is no problem.

---

### 📝 Summary

This article covered how to install and use Mineradio, the open-source music player.

Based on actual testing:

- The 3D stereo lyrics and dynamic visuals are excellent — something ordinary players can't match
- Supports NetEase Cloud Music and QQ Music login, with playlists syncing directly
- Both an online version and a local version cover different use cases

If you want a great-looking, free music player that supports the mainstream platforms, Mineradio is well worth a try.

---

### 🔗 Related Resources

Official version GitHub: `https://github.com/XxHuberrr/Mineradio`

Local version GitHub: `https://github.com/oirge/Mineradio`
