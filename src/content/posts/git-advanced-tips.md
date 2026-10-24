---
title: Git 进阶技巧：10 个让同事对你刮目相看的高级命令
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: 10 个 Git 高级命令实战：交互式 rebase 整理提交、cherry-pick 精选提交、worktree 多工作目录、bisect 二分定位 bug、reflog 找回丢失提交、log 美化输出等。
author: 小吒
tags:
  - 开发工具
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/git-advanced-tips"
ogImage: "/images/git-advanced-tips-real.jpg"
coverAlt: "程序员在双显示器上编写代码的俯拍工作台"
enSlug: "git-advanced-tips"
---

Git 远不止 `commit` 和 `push`。掌握这 10 个命令，你能把提交历史整理得像教科书、在三十秒内定位引入 bug 的那次提交、甚至救回"删掉"的代码。

每个命令都配可直接抄的用法。

## 一、`git rebase -i` 交互式变基

把一团乱的提交整理成线性历史。还没 push 的本地提交，随便改。

```bash
# 整理最近 3 个提交
git rebase -i HEAD~3
```

弹出编辑器，每行一个提交，前面的指令决定怎么处理：

```text
pick a1b2c3d  feat: 加登录
squash e4f5g6h  wip
reword h7i8j9k  fix: 改 bug
edit k1l2m3n  debug
drop n4o5p6q  临时测试
```

| 指令 | 作用 |
|---|---|
| `pick` | 保留这个提交 |
| `reword` | 保留，但改提交信息 |
| `edit` | 停下来，让你改内容再继续 |
| `squash` | 合并到上一个提交，信息也合并 |
| `fixup` | 合并到上一个，丢弃这个的信息 |
| `drop` | 删掉这个提交 |

**最常见的用法**：`squash` 把一堆 "wip"、"fix typo" 合成一个干净提交。

```bash
git rebase -i main        # 把功能分支的提交全整理一遍再合入
```

**铁律：只 rebase 没 push 过的提交。** 改了已推送的历史，别人 pull 会冲突，你得 `push --force`，然后收获同事的怨恨。

## 二、`git cherry-pick` 精选提交

把别的分支上的**某一个**提交拿到当前分支，不用把整条分支合过来。

```bash
# 把 hotfix 分支上的 a1b2c3d 拿到 main
git cherry-pick a1b2c3d

# 一次拿多个
git cherry-pick a1b2c3d e4f5g6h

# 拿一段连续提交（不含起点）
git cherry-pick a1b2c3d^..e4f5g6h
```

典型场景：生产出 bug，同事在 `hotfix` 分支修好了，你只想把那个修复拿到自己的 `develop`，不要他分支上其他改动。

有冲突时，Git 会停下来，你解完：

```bash
git add .
git cherry-pick --continue
# 或者放弃
git cherry-pick --abort
```

## 三、`git worktree` 多工作目录

一个仓库同时检出到多个目录，各在不同分支。**不用 stash 来切分支了。**

```bash
# 为主仓库旁挂一个 hotfix 工作目录
git worktree add ../myproject-hotfix hotfix

# 基于新分支挂
git worktree add -b feature-x ../myproject-feature feature-x
```

现在 `../myproject-hotfix` 和 `../myproject-feature` 是两个独立目录，各自在不同分支，**改互不影响**。IDE 里开两个窗口就行。

用完了清理：

```bash
git worktree remove ../myproject-hotfix
git worktree list      # 看当前所有工作目录
```

**适用场景**：正在写功能，突然要修线上 bug；或者要对比两个分支的构建产物。比 `git stash` 干净得多——stash 是"暂停"，worktree 是"并行"。

## 四、`git bisect` 二分查找

自动定位"是哪次提交引入的 bug"。提交历史 500 个，二分查找只要 9 步。

```bash
git bisect start
git bisect bad                  # 当前版本有 bug
git bisect good v2.1.0          # 这个版本是好的
```

Git 会检出一个中间提交，你测一下，然后告诉它结果：

```bash
git bisect good     # 这个版本没 bug
git bisect bad      # 这个版本有 bug
```

重复几次，Git 会指出第一个坏提交：

```
a1b2c3d is the first bad commit
```

结束：

```bash
git bisect reset
```

**自动化版本**——如果你有测试能自动判断：

```bash
git bisect start HEAD v2.1.0
git bisect run npm test
```

`npm test` 返回 0（通过）Git 就标 good，非 0 就标 bad，全程无人值守。**这个在 CI 里定位 flaky test 引入点特别好用。**

## 五、`git stash` 临时存储

手头活没干完，要去切分支。别急着commit 半个功能。

```bash
git stash                  # 存起来，工作区变干净
git stash list             # 看存了哪些
git stash pop              # 取回最近一个，并从栈里删掉
git stash apply            # 取回但保留在栈里
```

进阶用法：

```bash
git stash -u               # 连未跟踪的新文件一起存
git stash push -m "登录功能写一半"   # 加个备注，list 时看得懂
git stash drop             # 删掉栈顶
git stash clear            # 全清
```

**比 stash 更好的是 worktree**——如果是要长时间并行两份工作，见上面第三条。

## 六、`git reflog` 找回丢失的提交

**这条是救命用的。** 误操作 `reset --hard`、`branch -D` 删了分支、rebase 出错——只要提交进过仓库，reflog 都记着。

```bash
git reflog
```

输出类似：

```text
a1b2c3d HEAD@{0}: reset: moving to HEAD~3
e4f5g6h HEAD@{1}: commit: feat: 登录功能
h7i8j9k HEAD@{2}: checkout: moving from feature to main
```

`HEAD@{n}` 就是你每一步的操作历史。找回被 reset 掉的提交：

```bash
git reset --hard e4f5g6h
# 或者只把那个提交捡出来
git cherry-pick e4f5g6h
```

**reflog 默认保留 90 天**（可配置），过期就真没了。所以发现误操作**立刻**查 reflog，别拖。

这条值得单独记：**Git 里没有"彻底删除"这回事，只有"暂时找不到"。** reflog 就是那个能找到的地方。

## 七、`git log` 美化输出

默认输出又长又乱。配一个别名：

```bash
git config --global alias.lg "log --graph --abbrev-commit --decorate --format=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(bold yellow)%d%C(reset)' --all"
```

之后 `git lg` 输出：

```text
* a1b2c3d - (2 hours ago) feat: 登录功能 - 小吒 (HEAD -> main)
* e4f5g6h - (5 hours ago) fix: 修 typo - 小吒
|\
| * h7i8j9k - (1 day ago) feat: 支付 - 同事 (feature/pay)
|/
* k1l2m3n - (2 days ago) chore: 升级依赖 - 小吒
```

分支合并关系一目了然。

常用过滤：

```bash
git log --oneline -10              # 最近 10 条，一行一条
git log --author="小吒"            # 只看某人的
git log --since="1 week ago"       # 最近一周
git log --grep="登录"              # 搜提交信息
git log -S "function login"        # 搜代码内容（pickaxe）
git log --oneline --decorate --graph --all   # 全部分支图
```

**`git log -S` 特别有用**——想知道某行代码什么时候引入的、又被谁删了，直接搜字符串。

## 八、`git blame` 追责与解惑

逐行看最后一次修改是谁、哪个提交。

```bash
git blame src/index.ts
```

```text
a1b2c3d (小吒 2026-07-21 10:30:12 +0800 42) export function login() {
e4f5g6h (小吒 2026-07-20 15:22:08 +0800 43)   const token = await verify();
```

别用它来"追责"——它真正的价值是**读懂代码为什么这么写**。看到可疑的一行，`git blame` 拿到 commit，再 `git show <commit>` 看当时的完整改动和提交信息，往往能找到答案。

```bash
# 只看某几行
git blame -L 40,50 src/index.ts

# 忽略空白字符变动（reformat 后特别有用）
git blame -w src/index.ts

# 追踪代码移动（跨文件复制也能追）
git blame -M -C src/index.ts
```

## 九、`git diff` 高级用法

不只是 `git diff`。

```bash
# 比较工作区和暂存区
git diff

# 比较暂存区和最后一次提交（即将提交的内容）
git diff --staged
git diff --cached              # 同上

# 比较两个提交
git diff a1b2c3d e4f5g6h

# 比较两个分支
git diff main feature/x

# 只看统计，不看内容
git diff --stat

# 只看某个文件
git diff -- src/index.ts

# 忽略空白字符
git diff -w

# 显示函数名（看 diff 时知道在改哪个函数）
git diff --function-context
```

**提交前必做**：`git diff --staged`。确认你到底暂存了什么，比提交后发现多带了 debug 代码再回滚省事。

## 十、`git submodule` 子模块

在一个 Git 仓库里嵌另一个 Git 仓库。适合引入第三方库但又要锁定版本。

```bash
# 添加子模块
git submodule add https://github.com/vmstan/gravity-sync.git scripts/gravity-sync

# 克隆带子模块的仓库
git clone --recursive <repo>

# 已经克隆了，补拉子模块
git submodule update --init --recursive

# 更新所有子模块到远端最新
git submodule update --remote
```

`.gitmodules` 记录子模块，主仓库只存一个 commit 指针。

**实话实说：submodule 用起来麻烦**（忘记 `--recursive` 就拉不到内容、更新要手动）。2026 年的替代方案：

- **Git Subtree**：把子仓库内容直接并入主仓库，没有指针问题
- **包管理器**：npm/pnpm workspace、Go module、Rust crate——如果你的"子模块"是代码依赖，用语言自带的
- **直接 vendoring**：把第三方代码复制进仓库，简单粗暴但有效

**只有一种情况我推荐 submodule**：你真的需要"主仓库锁定第三方仓库的某个 commit，且经常要同步上游"。其他情况，上面三个替代方案都更省心。

## 小结

这 10 个里，按使用频率排：

| 命令 | 什么时候用 |
|---|---|
| `rebase -i` | 提交前整理历史（几乎每天） |
| `diff --staged` | 提交前检查（每次） |
| `log --graph` | 看分支关系（经常） |
| `stash` | 临时切分支（经常） |
| `cherry-pick` | 挑单个提交（偶尔） |
| `reflog` | **误操作救命（关键时刻）** |
| `blame` | 读懂代码为什么这么写（偶尔） |
| `worktree` | 并行两份工作（偶尔） |
| `bisect` | 定位 bug 引入点（排查时） |
| `submodule` | 嵌第三方仓库（尽量别用） |

真正值得形成肌肉记忆的是前四个。尤其 `git diff --staged`——这个习惯能避免 90% 的"手滑提交"。

Git 的哲学是"一切操作可逆"。理解了这一点，`reflog`、`rebase`、`reset` 这些命令就不再可怕——它们都在那个"可逆"的框架里。
