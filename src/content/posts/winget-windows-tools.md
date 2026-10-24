---
title: Windows 包管理器 winget 完全指南：告别手动下载安装软件
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Windows 包管理器 winget 完全指南：安装、常用命令、批量安装开发环境、结合 PowerShell 自动化、推荐软件包清单，以及与 Scoop 的选型对比。
author: 小吒
tags:
  - 免费工具
  - 开发工具
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/winget-windows-tools"
ogImage: "/images/winget-windows-tools-real.jpg"
coverAlt: "绿色电路板上密布的芯片与数据线特写"
enSlug: "winget-windows-tools"
---

macOS 有 Homebrew，Linux 有 apt，Windows 现在有 **winget**——微软官方的包管理器。一条命令装软件，不用再开浏览器、找官网、防捆绑、点下一步。

这篇讲清常用命令、批量装机脚本，以及它和 Scoop 该怎么选。

## 安装 winget

**Windows 11** 自带，直接 `winget --version` 验证。

**Windows 10** 需要手动装：

- **方式一**：Microsoft Store 搜 "App Installer" 安装（推荐，能自动更新）
- **方式二**：去 GitHub Releases 下载 msixbundle 手动装
  `https://github.com/microsoft/winget-cli/releases`

装完开新终端，输入：

```powershell
winget --version
```

能输出版本号就行。注意 **winget 只认 Windows 10 1709 之后的版本**，更老的系统升不了。

## 常用命令

```powershell
# 搜索软件
winget search "visual studio code"

# 看详细信息（含所有可装版本）
winget show Microsoft.VisualStudioCode

# 安装（自动接受协议，静默）
winget install --id Microsoft.VisualStudioCode -e --accept-source-agreements --accept-package-agreements

# 用名字装（更短，但可能匹配到多个）
winget install "Microsoft Visual Studio Code"

# 卸载
winget uninstall Microsoft.VisualStudioCode

# 升级所有可升级的软件
winget upgrade

# 升级指定软件
winget upgrade Microsoft.VisualStudioCode

# 列出已安装的软件
winget list

# 导出已安装软件列表（换机神器）
winget export -o apps.json

# 从列表批量恢复（新电脑一条命令装回全部）
winget import -i apps.json
```

**`winget export` / `import` 是换机时最值得记住的一对。** 旧电脑导出 JSON，新电脑导入，常用软件全回来。

### 常用参数

| 参数 | 作用 |
|---|---|
| `-e` / `--exact` | 精确匹配 ID，避免搜出同名软件 |
| `-h` / `--silent` | 静默安装，不弹 UI |
| `--scope user` | 装到当前用户，不需要管理员 |
| `--scope machine` | 装到全局，需要管理员 |
| `-l` / `--location` | 指定安装路径 |
| `--version` | 装指定版本 |
| `--source` | 指定软件源（winget / msstore） |
| `--accept-source-agreements` | 自动接受源协议 |

## 批量安装开发环境

新机器装开发环境，一行一行 `winget install` 太慢。写成脚本一把梭：

**PowerShell 版**（`setup-dev.ps1`）：

```powershell
$packages = @(
  "Microsoft.VisualStudioCode",
  "Microsoft.WindowsTerminal",
  "Git.Git",
  "OpenJS.NodeJS.LTS",
  "Python.Python.3.12",
  "Docker.DockerDesktop",
  "Google.Chrome",
  "7zip.7zip",
  "Microsoft.PowerToys",
  "VideoLAN.VLC"
)

foreach ($pkg in $packages) {
  Write-Host "==> 安装 $pkg" -ForegroundColor Cyan
  winget install --id $pkg -e --accept-source-agreements --accept-package-agreements --silent
}

Write-Host "全部完成" -ForegroundColor Green
```

```powershell
# 以管理员身份运行
Set-ExecutionPolicy -Scope Process Bypass
.\setup-dev.ps1
```

**CMD 批处理版**（`setup-dev.bat`，不想开 PowerShell 的话）：

```bat
@echo off
for %%p in (
  Microsoft.VisualStudioCode
  Git.Git
  OpenJS.NodeJS.LTS
  Google.Chrome
  7zip.7zip
) do (
  echo ==^> 安装 %%p
  winget install --id %%p -e --accept-source-agreements --accept-package-agreements --silent
)
echo 全部完成
```

**建议做法**：把这个脚本存进 Git 仓库或网盘，换机器、重装系统后直接跑。比记一堆下载链接靠谱。

## 与 PowerShell 脚本结合

winget 的返回值能判断装没装上，方便做条件逻辑：

```powershell
# 检查是否已安装，没装才装
$pkg = "Git.Git"
$installed = winget list --id $pkg -e

if ($installed -match $pkg) {
  Write-Host "$pkg 已安装"
} else {
  Write-Host "正在安装 $pkg"
  winget install --id $pkg -e --silent --accept-package-agreements
}

# 检查退出码
winget install --id $pkg -e --silent
if ($LASTEXITCODE -eq 0) {
  Write-Host "安装成功"
} else {
  Write-Host "安装失败，退出码 $LASTEXITCODE"
}
```

**升级全部 + 记录日志**：

```powershell
$log = "winget-upgrade-$(Get-Date -Format 'yyyyMMdd').log"
winget upgrade --all --silent --accept-source-agreements --accept-package-agreements *>&1 |
  Tee-Object -FilePath $log
```

`Tee-Object` 一边显示一边写文件，出问题能回头看。

## 推荐软件包

按类别，附 winget ID：

### 开发

| 软件 | ID |
|---|---|
| VS Code | `Microsoft.VisualStudioCode` |
| Windows Terminal | `Microsoft.WindowsTerminal` |
| Git | `Git.Git` |
| Node.js LTS | `OpenJS.NodeJS.LTS` |
| Python | `Python.Python.3.12` |
| Docker Desktop | `Docker.DockerDesktop` |
| Postman | `Postman.Postman` |
| .NET SDK | `Microsoft.DotNet.SDK.8` |

### 浏览器与通讯

| 软件 | ID |
|---|---|
| Chrome | `Google.Chrome` |
| Firefox | `Mozilla.Firefox` |
| Edge（重装用） | `Microsoft.Edge` |
| Telegram | `Telegram.TelegramDesktop` |
| 微信 | `Tencent.WeChat` |

### 效率工具

| 软件 | ID |
|---|---|
| PowerToys | `Microsoft.PowerToys` |
| 7-Zip | `7zip.7zip` |
 Everything 搜索 | `voidtools.Everything` |
| Snipaste 截图 | `Snipaste.Snipaste` |
| Obsidian | `Obsidian.Obsidian` |
| Notion | `Notion.Notion` |

### 媒体与设计

| 软件 | ID |
|---|---|
| VLC | `VideoLAN.VLC` |
| Figma | `Figma.Figma` |
| OBS Studio | `OBSProject.OBSStudio` |
| 网易云音乐 | `NetEase.CloudMusic` |

### 安全与系统

| 软件 | ID |
|---|---|
| KeePassXC | `KeePassXC.KeePassXC` |
| Bitwarden | `Bitwarden.Bitwarden` |
| Geek Uninstaller | `GeekUninstaller.GeekUninstaller` |
| HWiNFO | `REALiX.HWiNFO64` |

**查找 ID 的方法**：`winget search <关键词>`，结果第一列就是。

## winget vs Scoop

这两个是最常被比较的 Windows 包管理器，定位不同：

| 维度 | winget | Scoop |
|---|---|---|
| 软件源 | 微软官方仓库 | 社区维护 |
| 安装位置 | `C:\Program Files` | 用户目录 `~/scoop` |
| 权限 | 默认需要管理员 | **不需要管理员** |
| 软件数量 | 数千 | 数千（偏开发工具） |
| 速度 | 中等 | 快 |
| 卸载残留 | 取决于各安装包 | **干净**（不写注册表） |
| 自动更新 | 需手动 `upgrade` | `scoop update *` 或配计划任务 |
| 便携软件 | 少 | **多**（绿色软件首选） |

### 怎么选

**用 winget 如果**：

- 想要微软官方背书、软件源更"正规"
- 主要装常规软件（IDE、浏览器、办公软件）
- 需要 `export`/`import` 做换机迁移
- 公司机器，能拿到管理员权限

**用 Scoop 如果**：

- **没有管理员权限**（公司 locked-down 机器）
- 想要便携软件、不污染系统
- 讨厌注册表和 `Program Files` 里堆积的残留
- 主要装命令行开发工具

**我的建议：两个都装，分工明确。**

- **winget** 管常规软件（VS Code、Chrome、微信）
- **Scoop** 管命令行工具和便携软件（`git`、`node`、`ripgrep`、`ffmpeg`）

两者装到不同位置，互不冲突。真正冲突的是"同一个软件两边都装"——那就手动卸一个。

### 两者共存的一个坑

PATH 顺序。Scoop 装在用户目录，winget 装在 `Program Files`，如果同一个软件（比如 Git）两边都有，命令行用的是 PATH 靠前的那个。检查：

```powershell
Get-Command git | Select-Object -ExpandProperty Source
```

看输出的路径，就知道用的是哪个。

## 小结

winget 让 Windows 终于有了像样的包管理器。三个最值得养成的习惯：

1. **装软件先 `winget search`**，别再开浏览器找官网——省下的时间和防住的捆绑安装，价值巨大
2. **写一个 `setup-dev.ps1`** 存 Git 里，换机器一条命令
3. **定期 `winget upgrade`**，或者配个计划任务每月自动跑

如果你经常重装系统或在多台 Windows 机器间切换，`winget export` / `import` 这套迁移机制值得单独记一下——它比任何"软件清单文档"都可靠。
