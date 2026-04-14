## 1. 概览
fit flow：纯前端 React 应用，数据通过 Supabase（PostgREST + Storage）存储；饮食图片识别通过 Supabase Edge Function 代理外部识别服务。

- 数据读写：前端使用 Supabase JS SDK 访问 `food_entries / workout_entries / daily_targets / daily_summaries`
- 图片：前端上传到 Supabase Storage（Bucket：`food-images`，公开读或签名读由策略决定）
- 识别：前端调用 Edge Function `POST /functions/v1/food-recognize`

## 2. 身份与鉴权（无显式登录）
为满足“无需注册登录”的体验，同时保证数据隔离：
- 前端在首次打开时进行 Supabase Auth **匿名登录**（Anonymous Sign-in），并持久化 session。
- `deviceId` 取 `session.user.id`（UUID），作为所有表的逻辑归属键（`device_id`）。

> 注意：外部识别服务的密钥不得下发到前端；仅允许在 Edge Function 使用。

## 3. 共享 TypeScript 类型
```ts
export type DateISO = string; // YYYY-MM-DD

export type FoodRecognitionCandidate = {
  name: string;
  caloriesKcal: number;
  portionText?: string;
  confidence?: number; // 0-1
};

export type FoodEntry = {
  id: string;
  deviceId: string;
  eatenAt: string; // ISO datetime
  date: DateISO;
  imageUrl?: string;
  name: string;
  portionGrams?: number;
  caloriesKcal: number;
  source: "image" | "manual";
  createdAt: string;
  updatedAt: string;
};

export type WorkoutEntry = {
  id: string;
  deviceId: string;
  exercisedAt: string; // ISO datetime
  date: DateISO;
  activity: string;
  durationMin: number;
  intensity?: "low" | "medium" | "high";
  weightKg?: number;
  caloriesKcal: number;
  createdAt: string;
  updatedAt: string;
};

export type DailyTarget = {
  deviceId: string;
  date: DateISO;
  targetCaloriesKcal: number;
};

export type DailySummary = {
  deviceId: string;
  date: DateISO;
  intakeKcal: number;
  burnKcal: number;
  netKcal: number; // intake - burn
  targetKcal: number;
  deficitKcal: number; // target - net
};

export type ExportRow = {
  date: DateISO;
  intakeKcal: number;
  burnKcal: number;
  netKcal: number;
  targetKcal: number;
  deficitKcal: number;
};
```

## 4. Edge Function API

### 4.1 饮食图片识别
```
POST /functions/v1/food-recognize
```

Request（`multipart/form-data`）：
| Param Name| Param Type | isRequired | Description |
|----------|------------|------------|-------------|
| image | file | true | 食物图片 |
| locale | string | false | 语言偏好（默认 zh） |

Response：
| Param Name| Param Type | Description |
|----------|------------|-------------|
| candidates | FoodRecognitionCandidate[] | 候选识别结果列表（按置信度排序） |
| imageUrl | string | 已上传到 Storage 的图片 URL |

Example response：
```json
{
  "imageUrl": "https://<project>.supabase.co/storage/v1/object/public/food-images/xxx.jpg",
  "candidates": [
    {"name":"鸡胸肉","caloriesKcal":165,"portionText":"100g","confidence":0.74},
    {"name":"烤鸡腿","caloriesKcal":215,"portionText":"100g","confidence":0.41}
  ]
}
```

Error（建议约定）：
| HTTP Status | code | message |
|------------|------|---------|
| 400 | INVALID_INPUT | 缺少图片或格式不支持 |
| 502 | VENDOR_UNAVAILABLE | 外部识别服务不可用 |
| 504 | VENDOR_TIMEOUT | 外部识别服务超时 |

## 5. Supabase 数据 API（PostgREST）
以下为 Supabase 自动生成的 REST 接口（也可用 Supabase JS SDK 等价调用）。

### 5.1 Food entries
Base：`/rest/v1/food_entries`

- 查询当天饮食记录
  - `GET /rest/v1/food_entries?device_id=eq.{deviceId}&date=eq.{YYYY-MM-DD}&order=eaten_at.desc`

- 新增饮食记录
  - `POST /rest/v1/food_entries`

Request body：
| Field | Type | Required | Notes |
|-------|------|----------|------|
| device_id | string | true | = deviceId |
| date | string | true | YYYY-MM-DD |
| eaten_at | string | true | ISO datetime |
| image_url | string | false | Storage URL |
| name | string | true | 食物名称 |
| portion_grams | number | false | 份量（克） |
| calories_kcal | number | true | kcal |
| source | string | true | image/manual |

- 更新饮食记录
  - `PATCH /rest/v1/food_entries?id=eq.{id}&device_id=eq.{deviceId}`

- 删除饮食记录
  - `DELETE /rest/v1/food_entries?id=eq.{id}&device_id=eq.{deviceId}`

### 5.2 Workout entries
Base：`/rest/v1/workout_entries`

- 查询当天运动记录
  - `GET /rest/v1/workout_entries?device_id=eq.{deviceId}&date=eq.{YYYY-MM-DD}&order=exercised_at.desc`

- 新增 / 更新 / 删除
  - 与 `food_entries` 一致的 `POST/PATCH/DELETE` 方式（同样需要携带 `device_id` 过滤）。

### 5.3 Daily targets
Base：`/rest/v1/daily_targets`

- 设置（Upsert）某天目标
  - `POST /rest/v1/daily_targets?on_conflict=device_id,date`

Request body：
| Field | Type | Required |
|-------|------|----------|
| device_id | string | true |
| date | string | true |
| target_calories_kcal | number | true |

- 查询目标
  - `GET /rest/v1/daily_targets?device_id=eq.{deviceId}&date=eq.{YYYY-MM-DD}`

### 5.4 Daily summaries
Base：`/rest/v1/daily_summaries`

- 查询时间范围汇总（用于报表）
  - `GET /rest/v1/daily_summaries?device_id=eq.{deviceId}&date=gte.{from}&date=lte.{to}&order=date.asc`

> 汇总更新策略（无后端的最小实现）：前端在新增/编辑/删除饮食或运动记录后，重新拉取当日全部记录并在前端计算 `intake/burn/net/deficit`，然后 upsert 写回 `daily_summaries`（`on_conflict=device_id,date`）。

## 6. 外部服务接入与密钥安全存储

### 6.1 外部服务接入（饮食图片识别）
- 调用链：前端上传图片 → 调用 Edge Function → Edge Function 携带密钥请求外部识别服务 → 返回候选结果。
- 约束：
  - Edge Function 需要设置请求超时与重试（例如 8–12s 超时、最多 1 次重试）。
  - 失败时返回可识别的错误码（见 4.1）。
  - 仅在服务端记录必要日志（不记录完整图片内容/用户敏感信息）。

### 6.2 密钥与敏感信息存储
- 前端允许暴露的：
  - `SUPABASE_URL` 与 `SUPABASE_ANON_KEY`（它们本质是“公开客户端凭证”，仍需配合 RLS/策略保证数据隔离）。
- 前端禁止存放的：
  - 外部识别服务 API Key、任何可直接访问供应商计费能力的密钥。
- 推荐存储位置：
  - Supabase Edge Function Secrets（例如：`FOOD_RECOGNITION_API_KEY`、`FOOD_RECOGNITION_ENDPOINT`）。
  - 本地开发使用 `.env.local`，并确保加入 `.gitignore`。
- 安全实践：
  1) 最小权限：外部 Key 仅开放需要的接口权限/配额。
  2) 定期轮换：建立 key 轮换流程，避免长期不变。
  3) 分环境隔离：dev/staging/prod 使用不同 key。
  4) 避免透传：Edge Function 不回传供应商原始错误与密钥相关信息。
