# fit flow：基于 SSH 的极简 GitHub 自动化部署模板

本仓库提供一套“5 步以内上手”的 SSH 自动化部署方案：你只需要会 `git push`，其余（测试、构建、SSH 连接、部署、回滚、通知）由 GitHub Actions 完成。

部署目标：一台 Linux 服务器（建议 Ubuntu 22.04+），通过 Nginx + systemd 运行前后端。

## 目录结构规范（模板化）

```
.
├─ .github/
│  └─ workflows/
│     ├─ ci.yml
│     └─ deploy.yml
├─ backend/
├─ frontend/
├─ deploy/
│  └─ server/
│     ├─ backend.env.example
│     ├─ nginx/
│     │  └─ fit-flow.conf
│     └─ systemd/
│        └─ fit-flow-backend.service
├─ deploy.sh
├─ .env.example
└─ .gitignore
```

## 极简流程（≤5 步）

### 步骤 1：创建并推送仓库

命令：

```bash
git init
git add .
git commit -m "chore: init"
git branch -M main
git remote add origin git@github.com:<YOUR_ORG>/<YOUR_REPO>.git
git push -u origin main
```

验证：GitHub 仓库首页能看到提交记录。

常见错误：
- `Permission denied (publickey)`：你的本机未配置 GitHub SSH Key。

### 步骤 2：生成 SSH Key（ed25519）并配置服务器授权

命令（本机生成）：

```bash
ssh-keygen -t ed25519 -C "deploy" -f ~/.ssh/healt_deploy
```

把公钥追加到服务器：

```bash
ssh -p 2222 <user>@<host> "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys" < ~/.ssh/healt_deploy.pub
```

验证：

```bash
ssh -i ~/.ssh/healt_deploy -p 2222 <user>@<host> "echo SSH_OK"
```

成功应输出：`SSH_OK`

常见错误：
- `Connection refused`：端口不对或防火墙未放行。
- `Permission denied`：`authorized_keys` 权限不正确（应为 `600`）。

### 步骤 3：服务器一次性初始化（Nginx + systemd）

命令（在服务器上执行）：

```bash
sudo apt update
sudo apt install -y nginx python3 python3-venv python3-pip git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo mkdir -p /opt/fit-flow/shared
sudo cp /opt/fit-flow/current/deploy/server/systemd/fit-flow-backend.service /etc/systemd/system/fit-flow-backend.service || true
sudo cp /opt/fit-flow/current/deploy/server/nginx/fit-flow.conf /etc/nginx/sites-available/fit-flow || true
sudo ln -sfn /etc/nginx/sites-available/fit-flow /etc/nginx/sites-enabled/fit-flow
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now fit-flow-backend
sudo systemctl restart nginx
```

验证：

```bash
curl -fsS http://127.0.0.1:8000/healthz
```

成功应返回：`{"ok":true}`

常见错误：
- `fit-flow-backend.service: not found`：你还未完成首次部署（`/opt/fit-flow/current` 还不存在）。先执行步骤 4 触发一次部署，再回头安装服务文件。

### 步骤 4：配置 GitHub Secrets / Environments

在 GitHub 仓库设置里创建两个 Environment：`staging`、`production`。

每个 Environment 配置 Secrets：
- `SSH_HOST`
- `SSH_PORT`（非 22 端口也可）
- `SSH_USER`
- `SSH_PRIVATE_KEY`（`~/.ssh/healt_deploy` 的私钥内容）

可选 Secrets：
- `DEPLOY_WEBHOOK_URL`（用于通知）

每个 Environment 配置 Variables（可用默认）：
- `APP_NAME`（默认 `fit-flow`）
- `APP_DIR`（默认 `/opt/fit-flow`）
- `SYSTEMD_SERVICE`（默认 `fit-flow-backend`）
- `HEALTHCHECK_URL`（默认 `http://127.0.0.1:8000/healthz`）

验证：`Actions` 页能看到 `Deploy` 工作流。

常见错误：
- Secrets 没填全：部署会在 SSH 连接阶段失败。

### 步骤 5：触发自动部署并验证

命令（生产）：

```bash
git push origin main
```

验证（服务器）：

```bash
curl -fsS http://127.0.0.1:8000/healthz
```

验证（线上）：打开 `http://<host>/`，应能进入“今日概览/记录/报表”。

常见错误：
- 页面只剩登录：多半是 `/api` 代理没通或后端服务未启动（检查 Nginx 配置与 systemd 状态）。

## 分支与环境规范

- `main`：生产环境（production）
- `staging`：预发布环境（staging）
- `feat/*`、`fix/*`：功能/修复分支，合并后由 CI + Deploy 自动处理

## Commit Message 规范

采用 Conventional Commits：

- `feat: ...`
- `fix: ...`
- `chore: ...`
- `docs: ...`
- `refactor: ...`

示例：

```bash
git commit -m "feat: add photo food recognition"
```

## 本地开发

后端：

```bash
python3 -m pip install -r backend/requirements.txt
python3 -m uvicorn backend.main:app --reload --port 8000
```

前端：

```bash
cd frontend
npm ci
npm run dev
```

验证：

```bash
curl -fsS http://127.0.0.1:8000/healthz
```

## 自动化测试

前端：

```bash
cd frontend
npm run test
```

后端（最小校验）：

```bash
python3 -m py_compile backend/main.py
```

## 部署验证（健康检查）

默认健康检查地址：

- `http://127.0.0.1:8000/healthz`

你也可以把 `HEALTHCHECK_URL` 设置成 Nginx 对外的 URL（例如 `http://127.0.0.1/api/healthz`）。

## 常见问题排查

### 1) GitHub Actions 显示 SSH 连接失败

验证：

```bash
ssh -i ~/.ssh/healt_deploy -p <port> <user>@<host> "echo OK"
```

解决：
- 检查 `SSH_HOST/SSH_PORT/SSH_USER/SSH_PRIVATE_KEY`。
- 服务器防火墙放行该端口。

### 2) 部署成功但页面打不开 / API 404

验证：

```bash
sudo systemctl status fit-flow-backend --no-pager
sudo nginx -t
curl -i http://127.0.0.1:8000/healthz
```

解决：
- 确认 Nginx `/api/` 反代到 `127.0.0.1:8000`。
- 确认 systemd 服务 `WorkingDirectory` 指向 `/opt/fit-flow/current/backend`。

### 3) 需要回滚

服务器上执行：

```bash
ls -1dt /opt/fit-flow/releases/* | head
```

把 `current` 指向上一个 release 并重启：

```bash
PREV=$(ls -1dt /opt/fit-flow/releases/* | sed -n '2p')
sudo ln -sfn "$PREV" /opt/fit-flow/current
sudo systemctl restart fit-flow-backend
```

## 新旧方案对比（示例数据）

| 维度 | 传统手动部署 | 本方案（SSH + Actions） |
|---|---:|---:|
| 操作步骤数 | 15 步（登录服务器/拉代码/装依赖/构建/改配置/重启/验证…） | 5 步（配置一次后只需 `git push`） |
| 人工干预 | 高：每次都要手动 SSH + 执行命令 | 低：仅首次配置，之后全自动 |
| 部署失败率 | 10–30%（漏执行/执行顺序错/环境差异） | 1–3%（主要来自网络或依赖源） |
| 平均耗时 | 20–40 分钟 | 3–8 分钟 |
| 学习曲线 | 需要熟悉服务器运维/进程管理 | 只需掌握 Git 与 Secrets 配置 |
