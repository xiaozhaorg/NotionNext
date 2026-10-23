---
title: "GitHub Actions Advanced: 5 Practical Tips to Supercharge Your CI/CD"
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-23T00:00:00.000Z"
description: "Advanced GitHub Actions in practice: cache the package manager store instead of node_modules, matrix builds with fail-fast disabled, the UTC trap in scheduled workflows, secret management with OIDC, and reusable workflows — plus a complete workflow you can copy."
author: "Xiaozha"
tags: ["DevOps", "Tutorial"]
draft: false
ogImage: "/images/github-actions-advanced-real.jpg"
coverAlt: "A warm team collaboration scene at a work desk"
zhSlug: "github-actions-advanced"
---

`on: push` plus `npm test` is the tutorial version. What actually slows a team down is different: dependencies re-downloaded on every run, a test suite serialized for an hour on one runner, secrets copy-pasted into a dozen repos, and the same YAML maintained in fifteen places.

Here are five techniques you can apply today, each with working configuration.

## 1. Dependency Caching

A cache in the wrong place is worse than no cache.

### The most common mistake: caching node_modules

```yaml
# Wrong
- uses: actions/cache@v4
  with:
    path: node_modules          # Don't cache this directly
    key: deps-${{ hashFiles('package-lock.json') }}
```

`node_modules` contains platform-compiled native binaries (`sharp`, `esbuild`, `node-sass` and friends). A binary built on an Ubuntu runner crashes on Windows or macOS. You also skip `npm ci`'s integrity check, so the lock file and what actually got installed drift apart silently.

### Correct: cache the package manager's download store

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'                # One line; the key is derived from package-lock.json

- run: npm ci                   # Still runs — it just skips the network
```

`cache` accepts `npm`, `yarn`, or `pnpm`. For a monorepo, point at the specific lock files:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'
    cache-dependency-path: |
      apps/web/package-lock.json
      packages/ui/package-lock.json
```

When you need finer control, use `actions/cache` directly:

```yaml
- name: Resolve npm cache directory
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

`restore-keys` is a prefix fallback: when the lock file changes and there is no exact hit, you fall back to the nearest older cache for a partial hit. Always better than a cold start.

### Three things that bite people

| Symptom | Cause |
|---|---|
| PRs never save a new cache | `setup-node` only saves on the default branch by default; add `save-always: true` for PRs |
| Cache mysteriously misses | Caches are scoped per branch and cannot read unrelated branches; fork PRs cannot read them either |
| Cache gets slower over time | 10 GB per repo, LRU eviction. Don't use one giant key prefix to keep things simple |

## 2. Matrix Builds

A matrix fans one job out across a set of configurations. The syntax is trivial; `fail-fast` is the part that matters.

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false          # Don't cancel the other legs when one fails
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

Without `fail-fast: false`, the first failure cancels everything else and you see exactly one error message — which makes triage slower, not faster.

### Dropping combinations you don't need

```yaml
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [18, 20, 22]
        exclude:
          - os: windows-latest
            node-version: 18     # No reason to support this pair
```

### Shard long test suites

A 20-minute suite split four ways finishes in about 5 minutes:

```yaml
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npx vitest run --shard=${{ matrix.shard }}/4
```

Vitest and Jest support `--shard` natively; Playwright takes the same flag.

## 3. Scheduled Workflows

`schedule` uses POSIX cron: five fields, **minute hour day-of-month month day-of-week**.

```yaml
on:
  schedule:
    - cron: '0 2 * * *'          # 02:00 every day
```

### The biggest trap: cron runs in UTC

`'0 2 * * *'` is 02:00 UTC — 10:00 in Beijing. For 02:00 Beijing time you need `'0 18 * * *'`. Getting the timezone wrong is the number-one cause of "my cron never fires," and it fails silently: the job runs, just at the wrong hour.

### Two more limits

- The minimum interval is 5 minutes. Write `* * * * *` and GitHub clamps it to the 5-minute tier. Don't treat it as near-real-time monitoring.
- **Scheduled workflows are disabled automatically after 60 days with no repository activity.** Personal sites get hit by this constantly: skip a month of pushes, the schedule quietly stops, and after you resume you have to re-enable it manually from the Actions tab.

So always pair a schedule with a manual trigger as a fallback:

```yaml
on:
  schedule:
    - cron: '0 18 * * *'
  workflow_dispatch:            # Allows running it by hand from the Actions tab
```

## 4. Secret Management

### Pick the right scope

| Scope | Use for |
|---|---|
| Repository secrets | Project-specific values, visible only in that repo |
| Environment secrets | Per-environment values, separate sets for production and staging |
| Organization secrets | Shared across repos, configured once |

For production releases, use an Environment with manual approval:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production      # Can require named approvers
```

### Skip long-lived credentials entirely: OIDC

When deploying to AWS, Azure, or GCP, don't store access keys in secrets. OIDC lets the workflow exchange a short-lived credential at runtime that expires when the job ends. Nothing to rotate, no leak window.

```yaml
permissions:
  id-token: write               # Must be explicit, or you get no OIDC token
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

### Two things worth doing while you're here

**Tighten `GITHUB_TOKEN` permissions.** Defaults are usually broader than needed. Declare the minimum at the workflow or job level:

```yaml
permissions:
  contents: read                # Don't grant write if you only read code
```

**Pin third-party actions to a commit SHA.** Tags can be force-moved; SHAs cannot. It is the cheapest supply-chain protection available:

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
```

The tradeoff is manual upgrades. Let Dependabot open the PRs for you.

## 5. Reusable Workflows

When several repos share build steps, don't copy YAML. Define a reusable workflow with `workflow_call`:

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

The caller:

```yaml
jobs:
  build-staging:
    uses: ./.github/workflows/reusable-build.yml
    with:
      environment: staging
    secrets:
      DEPLOY_TOKEN: ${{ secrets.STAGING_TOKEN }}
```

### Reusable workflows vs composite actions

| | Reusable workflow | Composite action |
|---|---|---|
| Sharing scope | Across repos and orgs | Inside one action |
| Secrets | Passed in explicitly | Inherited automatically |
| Visibility | Separate workflow run, visible in the UI | Inlined in the caller, not shown separately |
| Best for | Whole multi-job pipelines | Two or three steps that always travel together |

Rule of thumb: sharing an entire pipeline, use a reusable workflow; sharing a small fixed sequence of steps, use a composite action.

## 6. A Complete Workflow

Everything above, combined. The goals: the common case finishes in under five minutes, only relevant file changes trigger it, redundant pushes cancel themselves, and deployment goes through OIDC.

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
  cancel-in-progress: true        # New push on the same branch cancels the old run

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
      id-token: write            # Only for OIDC
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

Run through this checklist before calling it done:

- The common case (push to a feature branch) finishes in under 5 minutes
- Dependencies and build output are cached
- lint / typecheck / test run in parallel, not serialized
- Deploys only from `main`, and never on a pull request
- A new push on the same branch cancels the previous run
- `paths` filters keep doc-only changes from triggering a build
- Deployment uses OIDC; no long-lived cloud keys in secrets
- Every job has `timeout-minutes`
- Installs use `npm ci`, not `npm install`

That last one is easy to overlook: `npm install` mutates the lock file, so CI can end up testing a different dependency set than your machine. `npm ci` installs strictly from the lock file, is reproducible, and is faster.
