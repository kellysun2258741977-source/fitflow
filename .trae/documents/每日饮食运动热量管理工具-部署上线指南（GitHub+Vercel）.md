## 1. 目标
通过 GitHub 集成将本仓库（Vite 前端 + FastAPI 后端）部署到 Vercel：
- 前端：静态构建产物
- 后端：Vercel Python Serverless Functions（路径前缀 `/api`）
- 密钥：全部通过 Vercel Environment Variables（Secrets）注入，不写入代码与仓库

## 2. 仓库约定（已落地）
- 前端目录：`frontend/`（Vite）
- 后端目录：`backend/`（FastAPI）
- Vercel Serverless 入口：`api/index.py` 与 `api/[...path].py`
- SPA 路由回退：`vercel.json` 将非 `/api` 路径重写到 `/index.html`

## 3. Vercel 项目配置（推荐）

### 3.1 创建 Vercel 项目
1) 在 Vercel 控制台点击 New Project，选择 GitHub 仓库。
2) Framework 选择 Other。
3) 配置以下构建参数：
- Root Directory：仓库根目录（不要选 `frontend`）
- Build Command：`cd frontend && npm ci && npm run build`
- Output Directory：`frontend/dist`

### 3.2 环境变量（Secrets）
在 Vercel Project → Settings → Environment Variables 配置：

后端（Serverless Functions 使用）：
- `SECRET_KEY`：JWT 签名用随机长字符串
- `BAIDU_API_KEY`
- `BAIDU_SECRET_KEY`
- `DATABASE_URL`：可不配，默认 `sqlite:///./backend/sql_app.db`（注意：Serverless 不适合持久化 SQLite）

前端（Vite 构建期注入，必须以 `VITE_` 开头）：
- `VITE_API_BASE_URL`：生产建议填 `/api`

建议分环境设置：Preview 与 Production 至少分开 `SECRET_KEY/BAIDU_*`。

## 4. 重要说明：Serverless 与数据库
当前 MVP 默认使用 SQLite，本地开发非常方便；但在 Vercel Serverless 上文件系统是临时的：
- 每次函数冷启动/扩缩容可能导致数据丢失
- 不建议把 SQLite 作为生产持久化方案

上线建议（二选一）：
1) 迁移到 Supabase Postgres（推荐，与最初技术架构文档一致）
2) 迁移到托管 Postgres（Neon/Render/Railway 等）并通过 `DATABASE_URL` 配置

## 5. API 路由与前端调用
生产环境下，FastAPI 会以 `/api` 作为入口路径：
- 例如登录：`POST /api/token`
- 例如汇总：`GET /api/me/summary`

前端已实现：
- 生产默认 `VITE_API_BASE_URL=/api`
- 本地默认 `http://localhost:8000`

## 6. GitHub Actions CI
已提供 `.github/workflows/ci.yml`：
- 前端：`npm ci` → `lint` → `test` → `build`
- 后端：安装依赖 → `py_compile` 编译检查

建议：将主分支设为 `main`，并开启 Branch Protection（Require status checks）。

## 7. 本地开发快速启动
后端：
```bash
cp .env.example .env
python3 -m pip install -r backend/requirements.txt
python3 -m uvicorn backend.main:app --reload --port 8000
```

前端：
```bash
cp frontend/.env.example frontend/.env.local
cd frontend
npm install
npm run dev
```

