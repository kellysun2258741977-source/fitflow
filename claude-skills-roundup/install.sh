#!/usr/bin/env bash
#
# claude-skills-roundup / install.sh
# ----------------------------------
# 把一批「2026 上半年比较火」的 Claude Code 技能(Skills)装到你本机的
# ~/.claude/skills/ 里。脚本在【你自己的电脑】上跑,不是在云端沙箱里。
#
# 用法:
#   bash install.sh            # 只装 CORE(低风险、纯配置/markdown)技能
#   bash install.sh --all      # 装 CORE + EXTRA 全部技能
#   bash install.sh --list     # 只列出清单,不安装
#   bash install.sh --dry-run  # 演练,打印将要执行的命令但不真正克隆
#
# ⚠️ 安全提醒:
#   - 下面这些仓库的 star 数高得反常(几个月就十几万星),很可能有刷量/玩梗成分。
#   - 「技能」本质是会被 AI 读取并据此行动的指令文件;装之前最好自己扫一眼 SKILL.md。
#   - 脚本【只克隆,不执行】任何仓库里的代码。需要跑代码的重型工具见 README 的「手动档」。
#
set -uo pipefail

SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
DRY_RUN=0
MODE="core"

for arg in "$@"; do
  case "$arg" in
    --all)     MODE="all" ;;
    --list)    MODE="list" ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) grep '^#' "$0" | sed 's/^#//'; exit 0 ;;
    *) echo "未知参数: $arg (试试 --help)"; exit 1 ;;
  esac
done

# 格式: "本地技能目录名|git地址|分级|一句话说明"
# CORE = 低风险(纯 markdown / 配置类指令);EXTRA = 体量更大或更激进,选装。
REPOS=(
  "karpathy-skills|https://github.com/multica-ai/andrej-karpathy-skills|CORE|一份 CLAUDE.md,按 Karpathy 总结的 LLM 编码陷阱来约束 Claude"
  "mattpocock-skills|https://github.com/mattpocock/skills|CORE|Matt Pocock 的实战工程技能合集"
  "addyosmani-agent-skills|https://github.com/addyosmani/agent-skills|CORE|Addy Osmani 的生产级工程技能"
  "taste-skill|https://github.com/Leonxlnx/taste-skill|CORE|给 AI 审美,少生成千篇一律的样板 UI"
  "ponytail|https://github.com/DietrichGebert/ponytail|CORE|让 Agent 像最懒的资深工程师那样思考(YAGNI)"
  "caveman|https://github.com/JuliusBrussee/caveman|EXTRA|原始人说话风格,激进砍 token(玩梗+实用,会显著改变输出语气)"
  "awesome-design-md|https://github.com/VoltAgent/awesome-design-md|EXTRA|各大品牌 DESIGN.md 合集,丢进项目生成对味 UI"
  "gstack|https://github.com/garrytan/gstack|EXTRA|Garry Tan 同款 23 件套配置(角色化:CEO/设计/QA…),改动较大"
)

clone_one() {
  local name="$1" url="$2" dest="$SKILLS_DIR/$1"
  if [ -d "$dest/.git" ]; then
    echo "  ↻ 已存在,更新: $name"
    [ "$DRY_RUN" = 1 ] && { echo "    DRY: git -C \"$dest\" pull --ff-only"; return; }
    git -C "$dest" pull --ff-only --quiet && echo "    ✓ 已更新" || echo "    ⚠ 更新失败(可能有本地改动),跳过"
  else
    echo "  ⬇ 克隆: $name"
    [ "$DRY_RUN" = 1 ] && { echo "    DRY: git clone --depth 1 \"$url\" \"$dest\""; return; }
    if git clone --depth 1 --quiet "$url" "$dest"; then
      echo "    ✓ 完成 -> $dest"
    else
      echo "    ✗ 克隆失败(仓库可能不存在或已改名): $url"
    fi
  fi
}

echo "================================================================"
echo " Claude Code 技能批量安装"
echo " 目标目录(文件地图): $SKILLS_DIR"
echo " 模式: $MODE   演练: $DRY_RUN"
echo "================================================================"

if [ "$MODE" = "list" ]; then
  printf "%-26s %-6s %s\n" "技能名" "分级" "说明"
  printf "%-26s %-6s %s\n" "------" "----" "----"
  for row in "${REPOS[@]}"; do
    IFS='|' read -r name url tier desc <<< "$row"
    printf "%-26s %-6s %s\n" "$name" "$tier" "$desc"
  done
  exit 0
fi

mkdir -p "$SKILLS_DIR"

installed=0
for row in "${REPOS[@]}"; do
  IFS='|' read -r name url tier desc <<< "$row"
  if [ "$MODE" = "core" ] && [ "$tier" != "CORE" ]; then
    continue
  fi
  echo ""
  echo "[$tier] $name — $desc"
  clone_one "$name" "$url"
  installed=$((installed+1))
done

echo ""
echo "================================================================"
echo " 完成。处理了 $installed 个技能。"
echo " 下一步:"
echo "   1) 重启 Claude Code(或新开一个会话)"
echo "   2) 输入  /  应该能看到刚装的技能"
echo "   3) 想删除某个技能:  rm -rf \"$SKILLS_DIR/<技能名>\""
echo "================================================================"
