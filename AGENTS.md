# Weiran Prototype

使用简体中文协作。这是 React + Semi UI 的纯前端原型模板，不包含 Java、数据库或后端服务。

- `pnpm dev` 通过 Turbo 启动 manage（4802）与 docs（4809），端口冲突直接报错。
- 组件从 npm `@weiran-tech/semi-components` 引用，不复制组件包源码。
- 保留 `src/main.tsx`、登录页、管理布局、动态菜单和演示页面入口。
- 新页面在 `packages/manage/src/pages/` 创建，在 `src/mocks/seed.ts` 菜单登记。
- `src/mocks/transport.ts` 是浏览器内数据适配器，开发和构建产物均使用它；新增数据契约同时补 Mock。
- Mock 数据存 localStorage，会话只用于原型展示，不代表真实身份或权限安全。
- `pnpm lint`、`pnpm test`、`pnpm build` 验证；布局改动需浏览器检查。
- 文档在 docs，新增或调整功能同步文档。主色 #0064FA。
