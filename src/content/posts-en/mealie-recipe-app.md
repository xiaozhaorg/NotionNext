---
title: "Self-Host Mealie: Ditch Recipe App Ads and Take Control of Your Kitchen"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Mealie is an open-source, self-hosted recipe manager that scrapes recipes from the web, plans meals, and builds shopping lists — the perfect alternative to Xiachufang (下厨房) and Douguo (豆果美食)."
author: "Xiaozha"
tags: ["Self-Hosting", "Mealie", "Tutorial"]
featured: false
draft: false
ogImage: "/images/mealie-recipe-app-real.jpg"
coverAlt: "Blue tech lighting of cloud computing and a server room"
zhSlug: "mealie-recipe-app"
---

![image](/images/remote/1460925895917-afdab827c52f.webp)

Mealie is an open-source, self-hosted recipe app that helps you manage all of your favorite recipes in one place. If you're tired of the endless ads on Xiachufang (下厨房) or Douguo (豆果美食) and want full ownership of your personal recipe collection, Mealie is the perfect replacement — your data stays on your own server, under your control.

## Core Features

- **Web recipe import** with automatic parsing
- **Manual recipe creation** via a Markdown editor
- **Automatic ingredient categorization**
- **Meal planning**
- **Shopping lists**
- **Multi-user support**
- **Mobile-friendly interface**

## Docker Deployment

## Initial Setup

- Visit `http://localhost:9925`
- Create an admin account
- Set `ALLOW_SIGNUP=false` to disable public registration

## Adding Recipes

#### Method 1: Web Import

- Copy a recipe URL from Xiachufang
- Paste it into Mealie
- Ingredients, steps, and cooking times are parsed automatically

#### Method 2: Manual Creation

- Markdown editor
- Ingredient autocomplete support
- Numbered steps

## Handy Features

- **Meal planning:** weekly and daily plans
- **Shopping lists:** auto-generated from your meal plan
- **Tag categories:** Chinese, Western, Sichuan, and more
- **Print optimization:** one recipe per page

## Recommended Practices

- Save all of your everyday recipes
- Create a shared family account
- Plan the coming week's meals on Sunday
- Track ingredients by shelf life
