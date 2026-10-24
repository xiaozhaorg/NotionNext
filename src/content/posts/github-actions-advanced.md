---
title: GitHub Actions 进阶：5 个实战技巧让你的 CI/CD 飞起来
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-23T00:00:00.000Z"
description: GitHub Actions 进阶实战，讲清依赖缓存的正确做法（缓存包管理器而非 node_modules）、矩阵构建、定时任务的 UTC 陷阱、密钥管理与 OIDC、可复用工作流，附一份可直接抄的完整 workflow。
author: 小吒
tags:
  - 教程
  - 开发工具
draft: false
sourceUrl: "https://xiaozha.org/article/github-actions-advanced"
ogImage: "/images/github-actions-advanced-real.jpg"
coverAlt: "团队成员在桌前协作交流的温馨工作场景"
enSlug: "github-actions-advanced"
---

会写 `on: push` + `npm test` 只算入门。真正拖慢团队的是这几件事：每次构建都重新下载依赖、测试在单个 runner 上串行跑一小时、密钥到处复制、YAML 在十几个仓库里各存一份。

这篇讲 5 个能立刻见效的进阶技巧，每个都附可用的 YAML。

## 一、依赖缓存加速

缓存用错地方，比不用还糟。

### 最常见的错误：缓存 node_modules

```yaml
# 错误示范
- uses: actions/cache@v4
  with:
    path: node_modules          # 不要直接缓存这个
    key: deps-${{ hashFiles('package-lock.json') }}
```

`node_modules` 里含有按平台编译的原生模块（`sharp`、`esbuild`、`node-sass` 之类），在 Ubuntu runner 上构建的二进制拿到 Windows 或 macOS runner 上会直接崩。而且跳过了 `npm ci` 的完整性校验，lock 文件和实际安装内容悄悄不一致你也发现不了。

### 正确做法：缓存包管理器的下载目录

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'                # 一行搞定，自动按 package-lock.json 生成 key

- run: npm ci                   # 仍然要执行，只是省掉了网络下载
```

`cache: 'npm'` 支持 `npm` / `yarn` / `pnpm`，monorepo 可以指定具体 lock 文件：

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'
    cache-dependency-path: |
      apps/web/package-lock.json
      packages/ui/package-lock.json
```

需要更细的控制时，用 `actions/cache` 手动配：

```yaml
- name: 获取 npm 缓存目录
  id: npm-cache
  run: echo "dir=$(npm config get cache)" >> "$GITHUB_OUTPUT"

- uses: actions/cache@v4
  with:
    path: ${{ steps.npm-cache.outputs.dir }}
    key: ${{ runner.os }}-node22-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node22-npm-
      ${{ runner.os }}-node22-
```

`restore-keys` 是前缀回退：lock 文件变了没有精确命中时，退回最接近的旧缓存，拿到部分命中，总比冷启动快。

### 三个容易踩的点

| 现象 | 原因 |
|---|---|
| PR 里永远不生成新缓存 | `setup-node` 默认只在默认分支保存缓存，PR 上要加 `save-always: true` |
| 缓存莫名失效 | 缓存按分支隔离，读不到不相关分支的缓存；fork 来的 PR 也读不到 |
| 缓存越攒越慢 | 单仓库缓存上限 10 GB，LRU 淘汰。key 别图省事用一个大而全的前缀 |

## 二、矩阵构建

矩阵是把一组配置展开成多个并行 job。关键不在语法，在 `fail-fast`。

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false          # 一个组合失败不要拖垮其他组合
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

不加 `fail-fast: false`，第一个组合一失败，其余全部取消，你只看到一条错误信息，排查成本反而更高。

### 排除不需要的组合

```yaml
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [18, 20, 22]
        exclude:
          - os: windows-latest
            node-version: 18     # 这个组合没有支持必要
```

### 测试套件太长就分片

单测跑 20 分钟，拆成 4 片并行大约 5 分钟：

```yaml
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npx vitest run --shard=${{ matrix.shard }}/4
```

Vitest 和 Jest 都原生支持 `--shard`，Playwright 用 `--shard` 参数同理。

## 三、定时任务

`schedule` 用 POSIX cron，五个字段，**分钟 小时 日 月 星期**。

```yaml
on:
  schedule:
    - cron: '0 2 * * *'          # 每天 02:00
```

### 最大的坑：cron 跑的是 UTC

`'0 2 * * *'` 是 UTC 凌晨 2 点，对应北京时间上午 10 点。想要北京时间每天凌晨 2 点执行，得写 `'0 18 * * *'`。写错时区是定时任务失效的头号原因，而且它不会报错，只是安静地在错误的时间跑。

### 另外两个限制

- 最短间隔 5 分钟。写 `* * * * *` 每分钟触发，GitHub 会自动拉到 5 分钟档位，不要指望它做准实时监控。
- **仓库连续 60 天没有任何提交活动，定时工作流会被自动禁用。**个人小站最容易中招——某个月没推送，定时任务就悄悄停了，恢复后需要手动去 Actions 页面重新启用。

所以定时任务一定要配一个手动触发作为兜底：

```yaml
on:
  schedule:
    - cron: '0 18 * * *'
  workflow_dispatch:            # 允许在 Actions 页面手动运行
```

## 四、密钥管理

### 按作用域选对位置

| 作用域 | 适用场景 |
|---|---|
| Repository secrets | 项目级密钥，只在本仓库可见 |
| Environment secrets | 按环境区分，production / staging 各自一套 |
| Organization secrets | 多个仓库共用，一次配置全局生效 |

需要配准生产发布，用 Environment 的手动审批：

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production      # 可配置需要谁审批
```

### 能不用长期密钥就不用：OIDC

部署到 AWS / Azure / GCP 时，不要把 Access Key 存进 secrets。OIDC 让 GitHub Actions 在运行时换取一个短时凭证，任务结束即失效，没有轮换成本，也没有泄露窗口。

```yaml
permissions:
  id-token: write               # 必须显式声明，否则拿不到 OIDC token
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
          aws-region: ap-northeast-1
      - run: npm run deploy
```

### 顺手做两件事

**收紧 `GITHUB_TOKEN` 权限。** 默认权限往往过宽，在 workflow 或 job 级显式声明最小权限：

```yaml
permissions:
  contents: read                # 只需要读代码就别给 write
```

**第三方 action 固定到 commit SHA。** 标签是可以被覆盖推送的，SHA 不能。这是成本最低的供应链防护：

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
```

缺点是升级得手动改。可以用 Dependabot 自动提 PR 来管这件事。

## 五、可复用工作流

多个仓库的构建步骤雷同时，不要复制 YAML。用 `workflow_call` 定义一个可复用工作流：

`.github/workflows/reusable-build.yml`

```yaml
name: Reusable Build

on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: '22'
      environment:
        required: true
        type: string
    secrets:
      DEPLOY_TOKEN:
        required: true

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: ./deploy.sh
        env:
          TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

调用方：

```yaml
jobs:
  build-staging:
    uses: ./.github/workflows/reusable-build.yml
    with:
      environment: staging
    secrets:
      DEPLOY_TOKEN: ${{ secrets.STAGING_TOKEN }}
```

### 可复用工作流 vs 复合 action

| | 可复用工作流 | 复合 action |
|---|---|---|
| 共享范围 | 跨仓库、跨组织 | 单个 action 内 |
| secrets | 显式声明传入 | 自动继承 |
| 运行可见性 | 独立 workflow run，UI 里能看到 | 内嵌在调用方，不单独显示 |
| 适合 | 多 job 的完整流水线 | 几步总是捆绑出现的小操作 |

经验法则：要共享的是一整条流水线，用可复用工作流；只是两三步固定组合，用复合 action。

## 六、实战：一份完整的 workflow

把上面所有技巧合起来。这份配置的目标是：常见场景 5 分钟内跑完，只在相关文件变化时触发，重复推送自动取消，部署走 OIDC。

```yaml
name: CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'package.json'
      - 'package-lock.json'
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true        # 同一分支新推送取消旧任务，省 runner 时间

permissions:
  contents: read

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ${{ matrix.os }}
    timeout-minutes: 15
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test

  deploy:
    needs: [lint-and-typecheck, test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment: production
    permissions:
      contents: read
      id-token: write            # 只为 OIDC 开通
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_DEPLOY_ROLE }}
          aws-region: ap-northeast-1
      - run: npm run deploy
```

上线前对着这份清单过一遍：

- 常见场景（功能分支推送）能在 5 分钟内跑完
- 依赖和构建产物都有缓存
- lint / typecheck / test 并行，不串行等待
- 只有 `main` 分支且非 PR 才部署
- 同一分支重复推送会取消旧任务
- 配了 `paths` 过滤，改文档不触发构建
- 部署用 OIDC，secrets 里没有长期云密钥
- 每个 job 都有 `timeout-minutes`
- 安装用 `npm ci` 而非 `npm install`

最后一条常被忽略：`npm install` 会改 lock 文件，CI 里装的依赖可能和本地不是一套。`npm ci` 严格按 lock 安装，可复现，而且更快。
