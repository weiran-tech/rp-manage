# 构建与部署

```bash
pnpm install
pnpm build:site
```

一体化产物为仓库根目录 `dist/`：

- `/`：React 演示站。
- `/docs/`：VitePress 文档，包含独立的资源目录和搜索索引。

`pnpm build:site` 先通过 Turbo 构建两个站点，再将 `packages/manage/dist` 复制到 `dist/`，将 `docs/.vitepress/dist` 复制到 `dist/docs/`。每次合并会清空旧的发布目录，避免遗留资源。

## Vercel

导入 GitHub 仓库，只创建一个项目，Root Directory 保持仓库根目录。仓库的 `vercel.json` 已配置：

| 配置 | 值 |
| --- | --- |
| Framework Preset | Other |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build:site` |
| Output Directory | `dist` |

文档通过 `cleanUrls` 支持 `/docs/usage` 等不带 `.html` 的地址；演示站的非文件路径回退到入口页，支持刷新和直接访问管理页面。`/docs/` 不参与 SPA 回退，缺失的文档返回 404。

部署后检查 `/`、`/login`、`/docs/`、`/docs/usage`，以及文档本地搜索。文档首页的“查看原型”返回同域名根目录。

其他静态托管平台需配置同等路由：文档目录优先匹配静态 HTML，只有文档目录之外的演示路由回退到 `index.html`。

本地独立预览：`pnpm --filter @weiran/manage preview`（4802）与 `pnpm docs:preview`（4809，访问 `/docs/`）。开发服务与预览不能同时占用同一端口。独立预览文档时，“查看原型”指向文档服务的根目录；同域名部署后指向演示站。

模板无需 API 地址、反向代理、Java 或数据库。生产构建仍使用浏览器 Mock，只适合原型展示。实际产品开发需另行接入真实认证、授权与数据服务。
