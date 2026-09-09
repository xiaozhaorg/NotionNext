---
title: "Build a Free Personal Navigation Site with Cloudflare Pages + WebStack"
pubDatetime: "2026-09-09T00:00:00.000Z"
description: "Deploy a WebStack open-source navigation site on Cloudflare Pages for free. No server needed, custom domain support, perfect for organizing your bookmarks."
author: "Xiaozha"
tags: ["Cloudflare", "Open Source", "Tutorial"]
featured: false
draft: false
ogImage: "/images/cloudflare-navigation-site-real.webp"
coverAlt: "Browser navigation page showing categorized website links"
zhSlug: "cloudflare-navigation-site"
---

Bookmarks get messy fast. AI tools, online tools, dev resources all mixed together — finding anything takes forever.

Instead of continuing to fight with your bookmarks, build a navigation site. Today we'll set one up using Cloudflare Pages + WebStack, zero cost.

## Why Build a Personal Navigation Site?

- **Centralized management**: All常用 websites in one page
- **Access anywhere**: Open your browser on any device
- **Fully customizable**: Organize by your own categories
- **Zero cost**: No server needed, Cloudflare Pages free hosting
- **Shareable**: Generate a link for your team or friends

## Technical Approach

Using the open-source **WebStack** project — a pure static navigation site template:

- **No backend**: Pure HTML/CSS/JS, no database
- **Responsive**: Works on phone, desktop, and tablet
- **Categorized**: Multi-level categories for organization
- **Search built-in**: Quick site search to find targets

**Resources**:
- WebStack GitHub: https://github.com/WebStackPage/WebStackPage.github.io
- WebStack Hugo version: https://github.com/shenweiyan/WebStack-Hugo
- Live demo: https://webstack.cc

## Deployment Steps

### Step 1: Fork the Project

1. Visit the WebStack GitHub repository
2. Click Fork to copy to your GitHub account
3. Rename the repo to your preference (e.g., `nav`)

### Step 2: Configure Cloudflare Pages

1. Log in to Cloudflare Dashboard, go to Pages
2. Click "Create a project"
3. Select "Connect to Git", authorize GitHub
4. Select the forked repo

Build config:
- **Framework preset**: Static
- **Build command**: Leave blank
- **Build output directory**: `/`

Deploy — your navigation site goes live in seconds.

### Step 3: Customize Content

Edit the config file to add your own sites:

```json
{
  "categories": [
    {
      "name": "AI Tools",
      "icon": "🤖",
      "links": [
        {
          "name": "ChatGPT",
          "url": "https://chat.openai.com",
          "description": "OpenAI chat assistant"
        }
      ]
    }
  ]
}
```

Push changes to GitHub — Cloudflare Pages auto-deploys.

## Category Suggestions

| Category | Examples |
|----------|----------|
| AI Tools | ChatGPT, Claude, Midjourney |
| Dev Tools | GitHub, VS Code, docs |
| Online Tools | Converters, calculators |
| Design | Figma, icons, color tools |
| Learning | Courses, tech blogs |
| Daily Use | Email, cloud storage, social |

## Advanced Features

### 1. Add Search
Add a search bar with JavaScript for quick filtering.

### 2. Import Browser Bookmarks
Export your bookmarks file and parse them automatically.

### 3. Team Collaboration
Store config in a shared repo for multiple contributors.

### 4. Analytics
Add Cloudflare Analytics or Umami to track popular links.

## Pitfalls to Avoid

1. **Build output directory**: For static sites, use `/` or `.`
2. **CSS path issues**: Check paths in config if styles are broken
3. **Search not working**: Verify JS loads correctly, check console errors
4. **Mobile layout**: Ensure responsive design works on phones

## Summary

Building a navigation site with Cloudflare Pages costs nothing and takes minutes. It's more efficient than browser bookmarks and more flexible than third-party navigation sites.
