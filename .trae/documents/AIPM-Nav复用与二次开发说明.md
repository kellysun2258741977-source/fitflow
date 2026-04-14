## 1. 仓库概况（AIPM-Nav）

已克隆并通读 `AIPM-Nav` 仓库源码。该仓库为纯静态站点（无 README、无构建系统、无依赖），文件仅包含：

- `index.html`：页面结构（顶部时间/全局搜索/多模块区/底部 Dock）
- `script.js`：核心交互逻辑（配置驱动的模块数据、Tab 切换、卡片生成、全局搜索、动态时间）
- `style.css`：样式
- `.nojekyll`：GitHub Pages 相关

因此可复用的价值主要来自“交互模式/信息架构/配置驱动的数据组织方式”，而不是库或后端能力。

## 2. 可复用模块清单（从 AIPM-Nav 提取）

### 2.1 配置驱动的模块化数据结构

来源：`script.js` 的 `moduleData`。

可复用点：

- 用一个对象统一定义“分类 -> 卡片列表（icon/title/desc/url）”
- 页面渲染与交互只依赖该配置，实现“内容可维护、逻辑可复用”

在当前项目中的落地：

- 新增 `resourcesData`，作为当前项目的“资源中心”数据源
- 后续你只改数据文件即可增删资源，无需改组件逻辑

### 2.2 Dock 式底部导航（Tab 切换）

来源：`index.html` 的 `.dock-nav` + `script.js` 的 `activateTab/setupDockNavigation`。

可复用点：

- 低学习成本的底部分类切换
- 适合移动端/小屏

在当前项目中的落地：

- 在 React 内实现 `activeTab` 状态切换，保留“Dock + 指示状态”的交互模式

### 2.3 全局搜索 + 快捷动作

来源：`script.js` 的 `setupGlobalSearch/performGoogleSearch`。

可复用点：

- 单输入框统一搜索
- 回车直接跳转 Google

在当前项目中的落地：

- 新增“资源中心”的搜索框：搜索当前资源并提供结果卡片；回车打开 Google

### 2.4 动态时间显示

来源：`script.js` 的 `updateDynamicTime`。

可复用点：

- 日期/星期/秒级时间显示

在当前项目中的落地：

- 在资源中心页面顶部加入日期与时间（独立于业务数据）

## 3. 与当前项目的兼容性评估

### 3.1 依赖与技术栈

`AIPM-Nav`：纯 HTML/CSS/JS，无依赖。

当前项目：React + Vite + Tailwind + Vitest。

兼容性结论：

- 无第三方依赖冲突
- 需要把“DOM 操作 + 动态创建节点”的逻辑改写为 React 声明式渲染

### 3.2 代码风格差异

- AIPM-Nav：全局函数 + DOM query
- 当前项目：组件化 + 状态驱动

处理方式：

- 把“Tab、搜索、卡片渲染、时间格式化”抽成 React 状态与纯函数 utils

## 4. 已完成的封装与集成（当前仓库变更）

### 4.1 新增页面：资源中心

- 页面：`/resources`
- 入口：顶部导航栏新增“资源”

代码位置：

- 页面组件：[ResourcesPage.jsx](file:///Users/sebastienlefevre/Documents/healt/frontend/src/pages/ResourcesPage.jsx)
- 数据配置：[resourcesData.js](file:///Users/sebastienlefevre/Documents/healt/frontend/src/pages/resources/resourcesData.js)
- 纯函数工具：[utils.js](file:///Users/sebastienlefevre/Documents/healt/frontend/src/pages/resources/utils.js)

### 4.2 路由与导航集成

- 路由新增：`/resources`（受现有鉴权保护）
- 顶部导航新增：资源入口

代码位置：

- [App.jsx](file:///Users/sebastienlefevre/Documents/healt/frontend/src/App.jsx)
- [Header.jsx](file:///Users/sebastienlefevre/Documents/healt/frontend/src/components/Header.jsx)

## 5. 测试补齐（单元 + 轻量集成）

已新增测试并通过：

- 数据结构单测：[resourcesData.test.js](file:///Users/sebastienlefevre/Documents/healt/frontend/src/pages/resources/resourcesData.test.js)
- 工具函数单测：[utils.test.js](file:///Users/sebastienlefevre/Documents/healt/frontend/src/pages/resources/utils.test.js)
- 页面轻量集成测试（渲染 + Tab 切换）：[ResourcesPage.test.jsx](file:///Users/sebastienlefevre/Documents/healt/frontend/src/pages/ResourcesPage.test.jsx)

为支持页面渲染测试，已将 Vitest 环境改为 `jsdom` 并增加 setup：

- [vite.config.js](file:///Users/sebastienlefevre/Documents/healt/frontend/vite.config.js)
- [vitest.setup.js](file:///Users/sebastienlefevre/Documents/healt/frontend/vitest.setup.js)

## 6. 风险点与后续维护建议

### 6.1 风险点

- 资源链接的可用性：外部站点可能变更 URL 或策略（需要定期巡检）
- 搜索体验：当前为简单包含匹配，数据量很大时需做索引/分词

### 6.2 维护建议

- 把资源数据改为后端可配置（未来可做管理员界面维护）
- 增加“最近使用/收藏”本地存储
- 为资源中心添加埋点（点击率、搜索词）以优化信息架构

