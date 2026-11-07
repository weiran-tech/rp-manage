# 使用指南

仓库根执行 `pnpm install`，再执行 `pnpm dev`。Turbo 默认启用 TUI 交互界面，同时启动管理端 4802 与文档站 4809。端口被占用会直接报错。

打开 原型地址 `http://localhost:4802`，用 `admin` / `admin123` 登录。也可使用种子用户 `user1` 与同一演示密码。短信验证码固定为 `123456`，不会发送短信。

保留用户、角色、菜单、字典、配置、资源、地区与日志页面，以及列表、表单、导航、权限、批处理和自增序号演示。

偏好支持明暗主题、主色、布局、多页签、收藏和锁屏。所有交互只影响当前浏览器数据。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | Turbo 启动原型与文档 |
| `pnpm dev:web` / `pnpm dev:docs` | 分别启动 |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm build` | Turbo 构建原型与文档 |
| `pnpm build:site` | 构建并合并为同域名站点：`/` 演示、`/docs/` 文档 |
| `pnpm build:web` / `pnpm build:docs` | 分别构建 |

## 恢复演示数据

浏览器开发者工具 Application → Local Storage 删除 `prototype_mock_v1`，刷新页面。全部重置时同时清除 `prototype_` 前缀的本地和会话存储项，以及 `prototype_csrf` Cookie。
