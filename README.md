# Weiran Prototype

从 mono4j manage 提取的纯前端原型生成模板：React 19、Semi UI、TanStack Query、Vite、VitePress 与 Turbo。

```bash
pnpm install
pnpm dev
```

- 原型入口：http://localhost:4802（`admin` / `admin123`，短信演示验证码 `123456`）
- 文档入口：http://localhost:4809/docs/
- 独立启动：`pnpm dev:web` / `pnpm dev:docs`
- 验证：`pnpm lint`、`pnpm test`、`pnpm build`
- 预览构建：`pnpm --filter @weiran/manage preview` / `pnpm docs:preview`

只含 `packages/manage` 与 `docs`，无需 Java、MySQL、Docker 或 API 服务。组件依赖 npm 发布的 `@weiran-tech/semi-components@^0.4.1`。

保留登录、首页、管理布局、动态路由、权限展示、偏好设置、系统管理、日志、地区和组件演示入口。Mock 在浏览器执行，开发和生产构建均可使用。

## 生成新原型

1. 修改 `packages/manage/.env.development` 的 `VITE_APP_TITLE`；构建标题可通过环境变量或 `.env.production` 设置。
2. 在 `packages/manage/src/pages/` 添加业务页面，复用公共组件及列表页模式。
3. 在 `src/mocks/seed.ts` 注册菜单和种子数据，`component` 相对 pages、不带扩展名；无需改 App.tsx。
4. 在 `src/mocks/transport.ts` 补充数据操作，保留数字 `code: 0` 的响应格式。未知路径明确报错。
5. 同步 `docs` 的功能说明。

Mock 数据存于 `localStorage.prototype_mock_v1`，会话采用独立 `prototype_csrf` 标记。清除此存储键并刷新可恢复初始数据；偏好、页签和收藏也是本地演示数据。无需配置后端代理。

文件上传为本地 data URL 预览（单文件最多 3 MB，受浏览器存储总量限制）；批处理返回固定模拟结果，不解析 Excel/ZIP；短信不发送，外部身份服务不连接。权限与登录仅用于原型交互，不具备生产安全能力。

一体化部署执行 `pnpm build:site`，上传根目录 `dist/`：`/` 为演示站，`/docs/` 为文档。Vercel 导入仓库时 Root Directory 保持仓库根目录，构建和路由由 `vercel.json` 配置。详见 docs/deployment.md。
