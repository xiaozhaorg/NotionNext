---
title: Docker Compose 入门到实战：5 分钟学会容器编排
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Docker Compose 入门到实战，从安装、第一个 docker-compose.yml、日常命令，到 WordPress + MySQL 完整项目、YAML 字段速查和生产环境最佳实践。
author: 小吒
tags:
  - Docker
  - 教程
  - 开发工具
  - 免费工具
draft: false
sourceUrl: "https://xiaozha.org/article/docker-compose-tutorial"
ogImage: "/images/docker-compose-tutorial-real.jpg"
coverAlt: "开发者双手放在笔记本键盘上编写代码的特写"
enSlug: "docker-compose-tutorial"
---

跑过真实 Web 应用的人都懂那种痛：装数据库、配缓存、搭 Web 服务器，然后在自己笔记本、同事笔记本、生产服务器上把整套流程再走一遍。**Docker Compose** 就是让这件事有个好结局的工具。

这篇带你用大约五分钟，从零到一个能跑的多容器环境。内容涵盖安装、第一个 `docker-compose.yml`、每天都会用的命令、一个完整的 WordPress + MySQL 项目、YAML 字段速查，以及区分"玩具项目"和"生产级栈"的最佳实践。

## Docker Compose 是什么

Docker Compose 用来定义和运行多容器 Docker 应用。你把整个栈——Web 应用、数据库、缓存、队列、反向代理——写在一个 YAML 文件里，然后用一条命令全部拉起来。

```bash
docker compose up -d
```

这一行能启动 Web 服务器、PostgreSQL 数据库、Redis 缓存和一个 worker 进程，把它们接到同一个私有网络，挂上持久化数据卷，并且只暴露你指定的端口。

### Compose 和裸 `docker run` 的区别

| 关注点 | 裸 `docker run` | Docker Compose |
|---|---|---|
| 多容器应用 | 一长串脆弱的 `docker run` 加 `--link` | 一份声明式的 `docker-compose.yml` |
| 可复现性 | "在我机器上是好的" | 同一份文件在任何机器上行为一致 |
| 环境变量 | 散落的 `-e` 参数，容易漏 | `.env` 文件 + `${VAR}` 插值 |
| 拆除 | 手动删容器和网络 | `docker compose down` 一次清干净 |
| 版本控制 | 困难 | YAML 文件对 diff 友好 |

### 什么时候该用 Compose

- 应用超过一个容器（几乎所有的真实应用）
- 需要在不同机器上复现同一套环境
- 想把"怎么跑起来"这件事写进 Git，而不是留在某人脑子里

单容器、一次性的小工具，`docker run` 更直接。

## 安装 Docker Compose

现代 Docker 已经把 Compose 作为插件内置，装好 Docker 就有了，不用单独装。

### macOS / Windows：装 Docker Desktop

官网下载安装包即可，Compose 插件随 Desktop 一起提供。

### Linux（Ubuntu / Debian）

```bash
# 卸掉可能存在的旧版本
sudo apt remove docker docker-engine docker.io containerd runc

# 添加官方仓库
sudo apt update
sudo apt install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装引擎和 Compose 插件
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 让当前用户免 sudo 跑 docker
sudo usermod -aG docker $USER
```

最后一步要重新登录才生效。

### 验证

```bash
docker --version
docker compose version
```

两条都能输出版本号就绪。

## Hello World：第一个 `docker-compose.yml`

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro
```

在同目录建一个 `html/index.html`，随便写点内容，然后：

```bash
docker compose up
```

浏览器打开 `http://localhost:8080` 就能看到。加上 `-d` 转后台运行。

这份文件已经包含了 Compose 的三个核心概念：**services**（要跑什么）、**ports**（怎么访问）、**volumes**（数据放哪）。

## 常用命令速查

| 命令 | 作用 |
|---|---|
| `docker compose up -d` | 后台启动整个栈 |
| `docker compose up -d --build` | 启动前先重新构建镜像 |
| `docker compose up -d web` | 只启动指定服务 |
| `docker compose down` | 停止并移除容器和默认网络 |
| `docker compose down -v` | 同时删掉命名卷（**会丢数据**） |
| `docker compose ps` | 列出运行中的服务 |
| `docker compose logs -f` | 跟随所有服务的日志 |
| `docker compose logs -f --tail=100 web` | 只看 web 服务最近 100 行 |
| `docker compose exec web sh` | 进运行中的容器执行命令 |
| `docker compose build` | 构建带 `build:` 段的服务 |
| `docker compose restart db` | 重启指定服务 |
| `docker compose pull` | 拉取最新镜像 |
| `docker compose run --rm web npm test` | 起个临时容器跑一次性任务 |

`down -v` 和 `down --rmi all` 是仅有的两个会真删东西的命令，用之前想清楚。

## 实战：WordPress + MySQL

### 目录结构

```
project/
├── .env
├── docker-compose.yml
└── html/
```

### `.env`：把密钥挡在 YAML 外面

```bash
MYSQL_ROOT_PASSWORD=换成随机强密码
MYSQL_DATABASE=wordpress
MYSQL_USER=wp
MYSQL_PASSWORD=再换一个随机强密码

WORDPRESS_DB_HOST=db:3306
WORDPRESS_DB_NAME=wordpress
WORDPRESS_DB_USER=wp
WORDPRESS_DB_PASSWORD=再换一个随机强密码
```

`.env` 加进 `.gitignore`。YAML 文件可以进 Git，`.env` 不行。

### `docker-compose.yml`

```yaml
services:
  db:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  wordpress:
    image: wordpress:6-php8.2-apache
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      WORDPRESS_DB_HOST: ${WORDPRESS_DB_HOST}
      WORDPRESS_DB_NAME: ${WORDPRESS_DB_NAME}
      WORDPRESS_DB_USER: ${WORDPRESS_DB_USER}
      WORDPRESS_DB_PASSWORD: ${WORDPRESS_DB_PASSWORD}
    ports:
      - "8080:80"
    volumes:
      - wp_data:/var/www/html

volumes:
  db_data:
  wp_data:
```

### 启动

```bash
docker compose up -d
docker compose ps      # 两个服务都该是 running
```

等十几秒，访问 `http://localhost:8080` 就是 WordPress 安装界面。

### 这份文件教了什么

- `depends_on` 配合 `condition: service_healthy`，让 WordPress 真的等 MySQL 就绪，而不是赌启动顺序
- 数据卷把数据库和 WordPress 文件放在容器外，`docker compose down` 不会丢数据
- 所有密钥走 `${VAR}` 从 `.env` 读，YAML 里不出现明文

## `docker-compose.yml` 字段速查

### `services`（必填）

栈里要跑的所有容器，键名自定义，后面命令用它引用。

### `image` vs `build`

用官方镜像填 `image`，用自己的代码填 `build`。两者可以同时存在——`build` 先构建，`image` 给产物打标签。

```yaml
services:
  app:
    build: .
    image: myapp:latest
```

### `ports`

`"宿主机端口:容器端口"`。冒号左边是你在机器上访问的端口，右边是容器内监听的端口。只暴露真正需要对外的端口，数据库端口通常不用映射。

### `environment`

两种写法等价：

```yaml
environment:
  - NODE_ENV=production
  # 或者
  NODE_ENV: production
```

### `volumes`

持久化数据或把宿主文件挂进去。

```yaml
volumes:
  - named_vol:/var/lib/data          # 命名卷，Compose 管理
  - ./config:/etc/app:ro             # 绑定挂载，右边是容器内路径
  - /etc/localtime:/etc/localtime:ro # 同步宿主机时区
```

数据库、上传的文件、配置——凡是容器删了还想留着的东西，都该走卷。

### `networks`

不声明的话所有服务在同一个默认网络里，用服务名互相访问（`http://web`、`db:3306`）。需要隔离时自定义：

```yaml
services:
  web:
    networks: [frontend]
  db:
    networks: [backend]

networks:
  frontend:
  backend:
```

### `depends_on`

控制启动顺序，但**默认只等容器启动，不等服务就绪**。所以它单独用经常不够，要配合 `healthcheck`。

### `healthcheck`

告诉 Docker 怎么判断这个容器"真的能用了"：

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

配了之后，`depends_on` 才能用 `condition: service_healthy` 做真正的等待。

### `restart`

- `no`：默认，退出就不管
- `always`：无论如何重启
- `on-failed`：非零退出码才重启
- `unless-stopped`：除非你手动 `stop`，否则一直重启

生产环境用 `unless-stopped`，配合 Docker 守护进程开机自启，服务器重启后服务自动回来。

### `command` 和 `entrypoint`

覆盖镜像里的默认启动命令。改一次性的东西用 `command`，要替换镜像的入口才动 `entrypoint`。

### 资源限制

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
```

防止某个容器把机器内存吃光，连带拖垮其他服务。

## 最佳实践

### 1. 环境变量全部走 `.env`

YAML 进 Git，`.env` 不进。密码、Token、API Key 只出现在 `.env` 里。

### 2. 健康检查 + `depends_on`

不要赌启动顺序。给数据库类服务加 `healthcheck`，依赖方用 `condition: service_healthy`。

### 3. 数据卷持久化

`docker compose down` 不删命名卷，`down -v` 才删。所以只要别手滑加 `-v`，数据基本安全。但**卷不是备份**——定期还是要往机器外拷一份。

### 4. 资源限制

至少给可能吃内存的服务（数据库、带机器学习的应用）设 `limits`。小主机上这一条能救命。

### 5. 网络隔离

不需要互相访问的服务别放同一个网络。数据库只暴露给后端，不要接到前端网络。

### 6. 构建上下文和 Dockerfile

`build` 指向含 Dockerfile 的目录。把 `.dockerignore` 写好，别把 `node_modules`、`.git`、`.env` 塞进构建上下文——那会让构建慢几倍，还有把密钥打进镜像的风险。

### 7. 用 override 文件区分环境

基础文件保持干净，本地开发用的配置放 override：

`docker-compose.yml`（生产）
```yaml
services:
  app:
    image: myapp:latest
    restart: unless-stopped
```

`docker-compose.override.yml`（本地开发，Compose 自动合并）
```yaml
services:
  app:
    build: .
    ports:
      - "9229:9229"   # 调试端口，只在本地开
    volumes:
      - ./src:/app/src # 代码热重载
```

部署到服务器时删掉 override 文件，或者用 `-f` 显式指定只用基础文件：

```bash
docker compose -f docker-compose.yml up -d
```

## 小结

Docker Compose 的核心价值不是"少打几条命令"，而是**把环境定义成了可以进版本控制的文件**。同一个 `docker-compose.yml`，在自己笔记本、同事机器、生产服务器上跑出完全相同的一套栈——这件事的价值远超省下的打字时间。

如果你刚接触自托管，建议下一篇直接看《自托管 20 个必备开源应用》，里面每个应用都附了现成的 Compose 配置，可以直接抄。
