---
title: "Docker Compose Tutorial: From Beginner to Practice in 5 Minutes"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Complete Docker Compose tutorial covering installation, YAML configuration, common commands, multi-container orchestration, and building a WordPress dev environment."
author: "Xiaozha"
tags: ["Tutorial", "Docker", "DevTools", "DevOps"]
featured: false
draft: false
ogImage: "/images/docker-compose-tutorial-real.jpg"
coverAlt: "Close-up of developer hands on laptop keyboard writing code"
zhSlug: "docker-compose-tutorial"
---

If you have ever tried to run a real web application, you already know the pain: install the database, configure the cache, set up the web server, then repeat the whole process on your laptop, your teammate's laptop, and the production server. **Docker Compose** is the tool that makes this story end well.

This Docker Compose tutorial takes you from zero to a working multi-container setup in about five minutes. We will cover installation, your first `docker-compose.yml`, the commands you will use every day, a full WordPress + MySQL project, a field guide to every important YAML key, and the best practices that separate hobby projects from production-grade stacks.

---

## What Is Docker Compose and Why Use It?

Docker Compose is a tool for defining and running multi-container Docker applications. You describe your entire stack — web app, database, cache, queue, reverse proxy — in a single YAML file, then bring it all up with one command.

```bash
docker compose up -d
```

That one line can start a web server, a PostgreSQL database, a Redis cache, and a worker process, wire them together on a private network, mount persistent volumes, and expose only the ports you choose.

### Compose vs. Plain Docker

| Concern | Plain `docker run` | Docker Compose |
| --- | --- | --- |
| Multi-container apps | Long, fragile `docker run` chains with `--link` flags | One declarative `docker-compose.yml` |
| Reproducibility | "It works on my machine" | Same file works on every machine |
| Environment variables | Inline `-e` flags, easy to forget | `.env` files and `${VAR}` interpolation |
| Tear down | Remove containers and networks manually | `docker compose down` cleans everything |
| Version control | Hard | The YAML file is diff-friendly |

### When to Reach for Compose

- **Local development environments** that mirror production.
- **CI pipelines** that need a clean, throwaway stack for integration tests.
- **Single-host deployments** for small projects, demos, or self-hosted apps.
- **Onboarding** new developers in minutes instead of hours.

For multi-host, production-scale orchestration you will eventually want Kubernetes or Docker Swarm, but Compose remains the fastest way to describe and share a stack.

---

## Installing Docker Compose

Modern Docker Desktop and the Docker Engine ship Compose as a plugin, so on most systems the command is `docker compose` (with a space). The older standalone binary `docker-compose` (with a hyphen) is still around but considered legacy.

### Install Docker Desktop (Recommended for Mac and Windows)

Docker Desktop bundles the Docker Engine, Compose, BuildKit, and a GUI in one installer.

1. Download Docker Desktop from the [official site](https://www.docker.com/products/docker-desktop/).
2. Run the installer and follow the wizard.
3. Start Docker Desktop and wait for the whale icon in the menu bar / system tray to become steady.
4. Verify the installation:

```bash
docker compose version
# Docker Compose version v2.30.0
```

### Install on Linux (Ubuntu / Debian)

Install the Docker Engine and the Compose plugin from Docker's official repository.

```bash
# Remove old versions if present
sudo apt-get remove docker docker-engine docker.io containerd runc

# Set up the repository
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Engine + Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Let your user run docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

### Verify Everything Works

```bash
docker --version
docker compose version
docker run hello-world
```

If all three commands succeed, you are ready for the next section.

---

## Hello World: Your First `docker-compose.yml`

Let's start with the simplest possible setup: a single Nginx web server that serves a custom HTML file. Create a new directory and add two files.

Project structure:

```
hello-compose/
├── docker-compose.yml
└── index.html
```

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Hello from Compose</title>
  </head>
  <body>
    <h1>🐳 Hello from Docker Compose!</h1>
    <p>This page is served by Nginx, started from a docker-compose.yml file.</p>
  </body>
</html>
```

`docker-compose.yml`:

```yaml
services:
  web:
    image: nginx:alpine
    container_name: hello-web
    ports:
      - "8080:80"
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html:ro
    restart: unless-stopped
```

A few things worth noting in this minimal file:

- There is **no `version` key**. Modern Compose (v2) reads the Compose Specification and ignores the legacy `version:` field, so you can omit it.
- `services:` is the top-level key. Everything under it is a container.
- `8080:80` maps port 8080 on your host to port 80 inside the container.
- The `volume` mounts your local `index.html` into the Nginx document root, so you can edit the file and refresh the browser without rebuilding anything.
- `restart: unless-stopped` means the container comes back after a reboot or a crash, but stays stopped if you explicitly stopped it.

Start it:

```bash
docker compose up -d
```

Open `http://localhost:8080` in your browser and you should see your page. When you are done:

```bash
docker compose down
```

That removes the container and the network Compose created for it. Your `index.html` file on disk is untouched.

---

## Common Docker Compose Commands

These are the commands you will use 95% of the time. All of them must be run from the directory that contains `docker-compose.yml`.

### `docker compose up` — Start the stack

```bash
# Start in the foreground, showing logs in the terminal
docker compose up

# Start in the background (detached)
docker compose up -d

# Rebuild images before starting
docker compose up -d --build

# Start only specific services
docker compose up -d web db
```

### `docker compose down` — Stop and remove

```bash
# Stop and remove containers and the default network
docker compose down

# Also remove named volumes (WARNING: deletes data)
docker compose down -v

# Also remove images used by the services
docker compose down --rmi all
```

### `docker compose ps` — List running services

```bash
docker compose ps

# Show all services, including stopped ones
docker compose ps -a
```

### `docker compose logs` — Tail logs

```bash
# Follow logs for all services
docker compose logs -f

# Follow logs for one service, last 100 lines
docker compose logs -f --tail 100 web
```

### `docker compose exec` — Run a command in a running container

```bash
# Open a shell inside the web container
docker compose exec web sh

# Run a one-off command
docker compose exec db mysql -u root -p
```

### `docker compose build` — Build or rebuild images

```bash
# Build all services that have a `build:` section
docker compose build

# Build without using the cache
docker compose build --no-cache
```

### `docker compose restart` — Restart services

```bash
# Restart everything
docker compose restart

# Restart just the database
docker compose restart db
```

### `docker compose pull` — Pull latest images

```bash
docker compose pull
docker compose up -d   # then recreate with the new images
```

### Bonus: `docker compose run` — One-off tasks

```bash
# Run a Laravel artisan command in a fresh container
docker compose run --rm web php artisan migrate
```

The `--rm` flag removes the container after the command finishes, keeping your environment clean.

---

## Practical Example: WordPress + MySQL

Now let's build something real. A classic LAMP-style stack — WordPress talking to MySQL — is the perfect playground for Compose because it has two services that depend on each other and persistent data that must survive restarts.

### Project Structure

```
wordpress-compose/
├── docker-compose.yml
├── .env
└── wp-content/
```

### `.env` — Keep secrets out of the YAML

```env
# Database
MYSQL_ROOT_PASSWORD=change-me-root
MYSQL_DATABASE=wordpress
MYSQL_USER=wp
MYSQL_PASSWORD=change-me-wp

# WordPress
WORDPRESS_DB_HOST=db:3306
WORDPRESS_DB_USER=wp
WORDPRESS_DB_PASSWORD=change-me-wp
WORDPRESS_DB_NAME=wordpress
```

Compose automatically reads a `.env` file in the same directory and exposes its values to `docker-compose.yml` via `${VAR}` interpolation.

### `docker-compose.yml`

```yaml
services:
  db:
    image: mysql:8.0
    container_name: wp-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
    networks:
      - wp_net

  wordpress:
    image: wordpress:6.6-php8.2-apache
    container_name: wp-app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      WORDPRESS_DB_HOST: ${WORDPRESS_DB_HOST}
      WORDPRESS_DB_USER: ${WORDPRESS_DB_USER}
      WORDPRESS_DB_PASSWORD: ${WORDPRESS_DB_PASSWORD}
      WORDPRESS_DB_NAME: ${WORDPRESS_DB_NAME}
    ports:
      - "8080:80"
    volumes:
      - ./wp-content:/var/www/html/wp-content
      - wp_data:/var/www/html
    networks:
      - wp_net

volumes:
  db_data:
  wp_data:

networks:
  wp_net:
    driver: bridge
```

### Run It

```bash
docker compose up -d
```

Open `http://localhost:8080` and you'll see the famous WordPress five-minute install screen. Because `depends_on` waits for the database health check to pass, WordPress never starts before MySQL is ready to accept connections.

### What This File Teaches You

- **`depends_on` with `condition: service_healthy`** solves the "race condition" problem where the app starts before the database is ready.
- **Named volumes** (`db_data`, `wp_data`) persist across `docker compose down`. The bind mount `./wp-content` lets you edit themes and plugins from your host editor.
- **A dedicated bridge network** isolates the database so it is not reachable from the host, only from `wordpress` on the internal network.
- **`.env` interpolation** keeps secrets out of version control. Add `.env` to `.gitignore`.

To tear everything down and delete the database data:

```bash
docker compose down -v
```

---

## `docker-compose.yml` Reference

The Compose Specification is large, but a handful of keys cover almost every real-world project. This section is the reference you can come back to.

### `services` (required)

The top-level container that holds every service definition.

```yaml
services:
  web:
    # ...
  db:
    # ...
```

### `image` vs `build`

- `image:` pulls a ready-made image from a registry.
- `build:` builds an image from a local `Dockerfile`.

```yaml
services:
  web:
    image: nginx:alpine

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    # Tag the built image so you can reuse it
    image: my-api:latest
```

### `ports` — Publish ports to the host

```yaml
ports:
  - "8080:80"      # host:container
  - "127.0.0.1:5432:5432"  # bind to localhost only
  - "3000"         # container port only, random host port
```

Always bind database ports to `127.0.0.1` in production so they are not exposed to the public internet.

### `environment` — Pass env vars to the container

```yaml
environment:
  - DEBUG=1
  - API_KEY=${API_KEY}      # interpolated from .env
  RAILS_ENV: production     # map syntax also works
```

Prefer the `.env` file + `${VAR}` pattern over hardcoding secrets.

### `volumes` — Persist data and mount host files

```yaml
volumes:
  # Named volume managed by Docker
  - db_data:/var/lib/mysql

  # Bind mount: host path : container path
  - ./src:/app/src

  # Read-only bind mount
  - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
```

Top-level `volumes:` declares named volumes:

```yaml
volumes:
  db_data:
    driver: local
```

### `networks` — Connect services

```yaml
services:
  web:
    networks:
      - frontend
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true   # no external access
```

`internal: true` creates a network with no outbound internet access — perfect for isolating a database.

### `depends_on` — Control startup order

The simple form only waits for the container to start:

```yaml
depends_on:
  - db
```

The long form waits for a healthy state:

```yaml
depends_on:
  db:
    condition: service_healthy
    restart: true   # restart this service if the dependency restarts
```

Always pair this with a `healthcheck` on the dependency.

### `healthcheck` — Tell Docker when a container is "up"

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:80/ || exit 1"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s
```

`start_period` gives slow-starting services a grace period before failed checks count toward `retries`.

### `restart` — Restart policy

```yaml
restart: unless-stopped
```

Options:

- `no` (default) — never restart.
- `always` — always restart, even after `docker stop`.
- `unless-stopped` — always restart, except when you stopped it manually.
- `on-failure[:max-retries]` — restart only on a non-zero exit code.

`unless-stopped` is the sweet spot for most projects.

### `command` and `entrypoint` — Override the image default

```yaml
command: ["gunicorn", "--bind", "0.0.0.0:8000", "myapp:app"]
entrypoint: ["/app/entrypoint.sh"]
```

### Resource limits — `deploy.resources`

```yaml
deploy:
  resources:
    limits:
      cpus: "1.0"
      memory: 512M
    reservations:
      memory: 128M
```

On Docker Desktop and Swarm, this enforces hard limits. For the legacy `mem_limit` / `cpus` top-level keys, use `docker compose` v2 with the `--compatibility` flag if you need them.

---

## Best Practices

The example above works, but real projects need a few more habits to stay healthy over time.

### 1. Use `.env` files for environment variables

Never commit database passwords or API keys to Git. Create a `.env` file, add it to `.gitignore`, and commit a `.env.example` template instead.

`.env.example`:

```env
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=wordpress
MYSQL_USER=wp
MYSQL_PASSWORD=
```

Compose interpolates `${MYSQL_PASSWORD}` automatically. You can also override the file:

```bash
docker compose --env-file .env.prod up -d
```

### 2. Health checks with `depends_on`

A bare `depends_on: [db]` only waits for the container to start — not for the database to be ready to accept connections. Always add a `healthcheck` and use the long form:

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

### 3. Data volume persistence

Use **named volumes** for data that Docker should manage, and **bind mounts** only for things you want to edit from the host (source code, config files).

```yaml
volumes:
  - pg_data:/var/lib/postgresql/data   # managed by Docker
  - ./src:/app/src                     # host-edited source
```

Back up a named volume by exporting it to a tarball:

```bash
docker run --rm -v pg_data:/data -v "$PWD:/backup" alpine \
  tar czf /backup/pg_data.tar.gz -C /data .
```

### 4. Resource limits

Cap CPU and memory per service so one runaway container cannot starve the others:

```yaml
deploy:
  resources:
    limits:
      cpus: "0.5"
      memory: 512M
```

For Compose v2 with the legacy `mem_limit` / `cpus` syntax, add the `--compatibility` flag when starting:

```bash
docker compose --compatibility up -d
```

### 5. Network isolation

Create at least two networks: a `frontend` (web-facing) and a `backend` (database-only). Put your web service on both, and the database on `backend` only.

```yaml
services:
  web:
    networks: [frontend, backend]
  db:
    networks: [backend]

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

Combined with binding database ports to `127.0.0.1`, this is defense in depth.

### 6. Build context and Dockerfile

When you need a custom image, put the `Dockerfile` next to the `docker-compose.yml` and reference the directory as the build context:

```yaml
services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
      args:
        BUILD_VERSION: 1.2.3
    image: my-api:1.2.3
```

Keep build contexts small with a `.dockerignore` file:

```
node_modules
.git
*.log
.env
```

This speeds up builds by avoiding sending unnecessary files to the Docker daemon.

### 7. Override files (`docker-compose.override.yml`)

Compose automatically merges two files if both exist:

- `docker-compose.yml` — base configuration.
- `docker-compose.override.yml` — local overrides (added to `.gitignore`).

This is the cleanest way to have one shared config plus per-developer tweaks.

`docker-compose.yml`:

```yaml
services:
  web:
    image: myapp:latest
    environment:
      NODE_ENV: production
    ports:
      - "80:80"
```

`docker-compose.override.yml`:

```yaml
services:
  web:
    environment:
      NODE_ENV: development
      DEBUG: "*"
    ports:
      - "3000:80"
    volumes:
      - ./src:/app/src
```

Running `docker compose up` merges both files, so the developer gets hot-reload and debug logs while CI keeps using the base file. You can also pick files explicitly:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Summary

Docker Compose turns "it works on my machine" into "it works on every machine". In this tutorial you learned how to:

1. **Install** Docker Compose on Linux, Mac, and Windows.
2. **Write** a minimal `docker-compose.yml` and bring up an Nginx web server.
3. **Use** the everyday commands: `up`, `down`, `ps`, `logs`, `exec`, `build`, `restart`, and `run`.
4. **Build** a real WordPress + MySQL stack with health checks and persistent volumes.
5. **Read** the most important Compose keys: `services`, `image`/`build`, `ports`, `environment`, `volumes`, `networks`, `depends_on`, and `healthcheck`.
6. **Apply** best practices: `.env` files, health-check-gated dependencies, resource limits, network isolation, build contexts, and override files.

The next step is to dockerize one of your own projects. Pick something you run manually today — a database, an API, a static site — and write a `docker-compose.yml` for it. Once you have a working file, commit it to the repo. Your future self, your teammates, and your CI pipeline will all thank you.

If you found this Docker Compose tutorial useful, you might also like our guides on [Docker registry mirror configuration](/en/articles/docker-mirror-2026) and [self-hosting open-source applications](/en/articles/self-host-apps). Happy composing! 🐳
