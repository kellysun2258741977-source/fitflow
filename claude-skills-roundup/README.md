# Claude Code 火热仓库 · 本地安装与使用指南

> 这份东西是在 **Anthropic 云端临时沙箱**里整理给你的,它**碰不到你本地电脑**。
> 所以这里只准备「提示词 / 脚本 / 说明」,真正的安装由 **你在自己电脑上** 跑。

---

## 0. 先泼一盆冷水(必读)

- 这批仓库是「2026 上半年趋势榜」搜来的,但 star 数高得离谱(几个月攒到 10~22 万星,
  比 GitHub 历史第一名当年还快)。**这意味着数据很可能有刷量/合成/玩梗成分**,不是
  实打实的口碑。别因为「星多」就全盘信任。
- 它们**不是一种东西**,不能用同一个「部署」动作搞定。我把它们分成两档:
  - **技能档(Skills)**:本质是 markdown / 配置指令,Claude Code 读了照做。低风险,有标准存放位置。→ 用 `install.sh` 一键装。
  - **手动档(独立工具)**:CLI / Web 应用 / 后台服务,会在你机器上**执行代码**。风险更高,**不替你自动跑**,见下方第 3 节,自己看明白再装。
- 装任何「技能」前,扫一眼它的 `SKILL.md`——那就是它会让 AI 干的事。

---

## 1. 文件地图:东西到底该放哪

Claude Code 的技能有**固定的存放位置**,这就是你说的「文件地图」:

```
~/.claude/skills/<技能名>/SKILL.md     ← 个人级:所有项目都能用(install.sh 默认装这里)
<你的项目>/.claude/skills/<技能名>/     ← 项目级:只在这个项目里生效,可随项目提交共享
```

- 想全局可用 → 放 `~/.claude/skills/`
- 想只给某个项目用、并且跟队友共享 → 放进那个项目的 `.claude/skills/` 并提交到 git

独立工具(手动档)没有统一位置,建议自己开个 `~/claude-tools/` 收纳。

---

## 2. 技能档:一键安装

把本文件夹 `claude-skills-roundup/` 拷到你电脑上(或者直接 `git pull` 这个分支),然后:

```bash
cd claude-skills-roundup

bash install.sh --list     # 先看清单,不装任何东西
bash install.sh            # 只装 CORE(低风险)技能
bash install.sh --all      # 装全部技能(含 EXTRA,改动更大)
bash install.sh --dry-run  # 演练:打印将执行的命令但不真正下载
```

装好后:

1. **重启 Claude Code**(或新开一个会话),让它重新扫描技能目录。
2. 在对话框输入 `/`,应该能在列表里看到刚装的技能。
3. 删除某个技能:`rm -rf ~/.claude/skills/<技能名>`

### CORE(默认安装,低风险)

| 技能名 | 仓库 | 干什么 |
|---|---|---|
| karpathy-skills | multica-ai/andrej-karpathy-skills | 按 Karpathy 总结的 LLM 编码陷阱约束 Claude |
| mattpocock-skills | mattpocock/skills | Matt Pocock 的实战工程技能 |
| addyosmani-agent-skills | addyosmani/agent-skills | Addy Osmani 的生产级工程技能 |
| taste-skill | Leonxlnx/taste-skill | 给 AI 审美,少出样板 UI |
| ponytail | DietrichGebert/ponytail | 让 Agent 走 YAGNI、少写代码 |

### EXTRA(`--all` 才装,改动较激进)

| 技能名 | 仓库 | 注意 |
|---|---|---|
| caveman | JuliusBrussee/caveman | 会把输出变成「原始人语气」省 token,玩梗成分大 |
| awesome-design-md | VoltAgent/awesome-design-md | DESIGN.md 合集,生成 UI 用 |
| gstack | garrytan/gstack | 23 件套角色化配置,对工作流改动大 |

---

## 3. 手动档:独立工具(自己看懂再装,脚本不替你跑)

这些会在你机器上跑进程/装二进制,**风险等级高于技能**。给你**官方安装入口**,别盲跑:

| 工具 | 仓库 | 装法(去仓库 README 核对最新命令) |
|---|---|---|
| rtk(省 token 的 CLI 代理) | rtk-ai/rtk | Rust 单二进制,看 README 的安装段 |
| headroom(压缩喂给 LLM 的内容) | headroomlabs-ai/headroom | Python,`pip install` 或起 proxy/MCP |
| codegraph(本地代码知识图谱) | colbymchenry/codegraph | TS,本地索引,按 README 起服务 |
| daily_stock_analysis(炒股分析) | ZhuLinsen/daily_stock_analysis | 中文项目,Python,需配 LLM key |
| open-design(本地设计工具) | nexu-io/open-design | 桌面 app,按 README 构建/下载 |

建议流程:
```bash
mkdir -p ~/claude-tools && cd ~/claude-tools
git clone --depth 1 https://github.com/<owner>/<repo>
cd <repo> && less README.md     # ★ 先读 README,确认它在你机器上做什么
# 确认无误后再按它的说明安装/运行
```

---

## 4. 装完之后:怎么用 Claude Code 的技能

技能不是命令行工具,它是「挂在 Claude Code 上的能力」。两种触发方式:

1. **显式调用**:在对话框输入 `/`,弹出技能列表,选一个,它会带着这个技能的指令工作。
2. **隐式触发**:你直接用自然语言描述任务,Claude 判断该用哪个技能就自动用。
   例:装了 `taste-skill` 后说「给我做一个落地页」,它会自动按「有审美」的方式生成。

实用小命令:
- `/` → 看所有可用技能
- 把技能放进 **项目** 的 `.claude/skills/` 并提交,队友 clone 后就自带这些技能
- 技能不生效?检查:① 路径对不对(`~/.claude/skills/<名>/SKILL.md` 必须存在)② 重启了 Claude Code 没

---

## 5. 一句话总结

- **能一键装的只有「技能档」**,因为它们就是配置文件,放进 `~/.claude/skills/` 即可 → `bash install.sh`。
- **「手动档」工具**会执行代码,我故意不自动跑,你照第 3 节自己核对后再装。
- star 数好看 ≠ 安全,装前扫一眼内容是基本功。
