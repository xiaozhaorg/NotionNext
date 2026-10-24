---
title: Mealie 自建菜谱应用：告别下厨房广告，掌控你的私人厨房
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Mealie 是开源的自托管菜谱管理应用，支持网页爬取菜谱、膳食计划、购物清单、食材归类。本文详解 Docker 部署、两种添加菜谱方式、实用功能与家庭共享实践。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/mealie-recipe-app"
ogImage: "/images/mealie-recipe-app-real.jpg"
coverAlt: "厨房台面上摆放的新鲜食材与手写菜谱笔记"
enSlug: "mealie-recipe-app"
---

下厨房、豆果美食这些菜谱站，广告越来越多、弹窗越来越凶，找个菜谱要先关三个弹窗。更烦的是收藏的菜谱散落在各处，想规划一周吃什么、生成购物清单，没有好用的免费工具。

**Mealie** 是这件事的答案：开源自托管菜谱管理，能自动从网页抓取菜谱、按周规划膳食、自动生成购物清单。数据在自己服务器，没有广告，没有登录墙。

## 核心功能

- **网页爬取菜谱**：粘贴 URL 自动解析食材、步骤、烹饪时间
- **手动创建**：Markdown 编辑器，支持食材自动补全
- **食材自动归类**：按"蔬菜/肉类/调料"分组，购物清单按超市区域排序
- **膳食计划**：周计划 / 日计划，拖拽安排
- **购物清单**：根据膳食计划自动生成，可勾选
- **多用户**：家人各自账号，可共享家庭菜谱库
- **移动端友好**：响应式设计，手机上用着顺手
- **食谱导入导出**：支持 JSON、Nextcloud、Paprika 格式

## Docker 部署

### 目录结构

```
/opt/mealie/
├── docker-compose.yml
└── data/
```

### `docker-compose.yml`

```yaml
services:
  mealie:
    image: hkotel/mealie:latest
    container_name: mealie
    restart: unless-stopped
    ports:
      - "9925:9000"
    environment:
      # 时区，影响膳食计划的日期显示
      TZ: "Asia/Shanghai"
      # 基础 URL，配了域名或子路径才需要改
      BASE_URL: "https://mealie.example.com"
      # 关闭公开注册（注册完管理员后）
      ALLOW_SIGNUP: "false"
      # 允许访客浏览（不想公开就关掉）
      ALLOW_GUEST: "false"
    volumes:
      - ./data:/app/data
```

### 启动

```bash
cd /opt/mealie
docker compose up -d
docker compose logs -f mealie
```

第一次启动会跑数据库迁移，看到 `Uvicorn running on http://0.0.0.0:9000` 就绪。

## 初始化配置

访问 `http://服务器IP:9925`，第一次进会要求注册——**第一个注册的账号自动成为管理员**。

注册完立刻关注册：

```bash
sed -i 's/ALLOW_SIGNUP: "true"/ALLOW_SIGNUP: "false"/' docker-compose.yml
docker compose up -d
```

然后进 **Settings → General**：

- **Language**：选中文（界面会变成中文，但爬取的菜谱内容取决于原站）
- **First Day of Week**：选周一（国内习惯）
- **Meal Plan Settings**：开启膳食计划

## 添加菜谱

### 方式一：网页爬取（主力用法）

1. 网页端 → **Create** → **Import from URL**
2. 粘贴菜谱地址，比如 `https://www.xiachufang.com/recipe/100123456/`
3. 点 **Import**，Mealie 会抓取页面，解析出食材和步骤

**解析成功率取决于原站结构**。下厨房、美食杰这类主流站点识别率不错；个人博客、小红书笔记基本抓不到（前者结构不规范，后者根本不给你看 HTML）。

爬取完**一定要检查一遍**——自动解析经常把广告文案、无关段落混进食材表，或者漏掉小料。确认后保存。

**批量导入**：如果你有一堆收藏的菜谱，可以先用浏览器书签导出 HTML，然后用 Mealie 的批量导入（需要 API，或者写个脚本调 `/api/recipes/create-from-url`）。

### 方式二：手动创建

网页端 → **Create** → **New Recipe**：

- **标题**、**描述**
- **食材**：一行一个，格式 `数量 单位 名称`，比如 `200 克 五花肉`。Mealie 会自动识别数量和单位
- **步骤**：一行一步，支持 Markdown
- **标签**：中餐、川菜、快手菜……方便之后筛选

**手动创建的价值**：那些外婆传下来、书上拍下来的菜谱，只能自己录。录一次，以后永远有。

## 实用功能

### 膳食计划

网页端 → **Meal Plan**，一个周视图。把菜谱拖到某天某餐：

- 支持早/中/晚/加餐
- 可以留备注（"今天外卖"）
- **周日晚上花十分钟排好下周**，是这项功能最大的价值

### 购物清单

膳食计划排好后，**购物清单自动汇总所有菜谱需要的食材**，并按你设置的分类（蔬菜/肉/蛋/调料）分组。

去超市照着清单勾就行。还会自动合并同类项——三道菜都要用葱，清单上是一个"葱 1 把"而不是三行。

### 食材保质期管理

录入食材时可以设保质期，Mealie 会在临期时提醒。适合管冰箱里那些"买了但总忘"的东西。

### 打印优化

每个菜谱有打印视图，排版成"一页一个菜谱"——食材表 + 步骤，直接贴厨房墙上。这个细节很实用。

### 标签与筛选

标签是组织菜谱的核心。建议建这几个维度：

- **菜系**：中餐、西餐、日料
- **口味**：辣、清淡、酸甜
- **场景**：快手菜（30 分钟内）、宴客、一人食
- **食材**：鸡肉、牛肉、素食

之后"今晚想吃辣的、快手菜"，两个标签一筛就出来。

## 家庭共享实践

Mealie 支持多用户，家庭用法：

1. **管理员建一个家庭组**（Settings → Groups），把家人账号拉进来
2. **共享菜谱库**：组内成员看到的菜谱一致，谁添加的都可见
3. **个人私房菜**：不想共享的标为私有

实际体验最好的流程：

- **一个人负责录菜谱**（周末集中录入），其他人只管用
- **周日晚上全家定下周菜单**，拖进膳食计划
- **购物清单自动生成**，谁买菜谁拿着手机勾
- **做饭时打开菜谱的烹饪视图**，步骤大字显示，还能滑动翻步

## 推荐实践

几条用下来觉得值得的：

- **常用菜谱先收藏**：把家里常做的 20 个菜先录进去，价值立刻显现
- **善用标签而不是文件夹**：文件夹是树状，标签是多维。菜谱天然适合多维
- **批量爬取一次**：把浏览器里散落的收藏集中导进来，一次投入长期受益
- **定期清理**：做过一次觉得不好吃的，删掉或标"待改进"，别让库变成垃圾堆
- **备份 data 目录**：见下

## 备份

菜谱库是你长期积累的资产，值得备份：

```bash
# 停容器保证 SQLite 一致性
docker compose stop
tar czf mealie-$(date +%F).tar.gz data/
docker compose start

# 同步到异地
rclone sync ./ r2:你的桶/mealie-backup/
```

加进 cron 每天跑。Mealie 本身也有内置的导出功能（Settings → Backups），可以下 JSON——但自动化备份更可靠。方案见《自托管数据备份完全指南》。

## 远程访问

想在外面也看菜谱，走 Cloudflare Tunnel，不开放端口：

```bash
cloudflared tunnel route dns mealie mealie.example.com
```

ingress 指向 `http://localhost:9925`。这样手机上也能查菜谱、看购物清单。方案对比见《Tailscale vs Cloudflare Tunnel》。

## 小结

Mealie 解决的不是"找菜谱"，而是**"管理你自己的菜谱"**。下厨房们的内容再多，也不是你的——收藏夹会失效、链接会挂、广告会变多。

自托管一个，把家里常做的菜录进去，配合膳食计划和购物清单，一周能省下的决策时间和买菜来回，远超部署那半小时。

如果想搭一整套家庭自托管，接着看《自托管 20 个必备开源应用》——Mealie 通常和 Immich（相册）、Vaultwarden（密码）一起跑在同一台小主机上。
