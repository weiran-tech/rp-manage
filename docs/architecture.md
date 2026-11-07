# 架构与扩展

```text
prototype/
├── packages/manage/       React 原型入口
│   └── src/
│       ├── main.tsx       应用挂载与 Provider
│       ├── App.tsx        登录守卫与动态路由
│       ├── pages/         页面与演示
│       ├── layouts/       管理布局与偏好
│       ├── components/    项目公共组件与组件包兼容入口
│       ├── hooks/queries/ TanStack Query 数据 hooks
│       └── mocks/         菜单、种子与数据适配器
├── docs/                  VitePress 文档与组件展示
└── turbo.json             开发、构建、lint 与 test 编排
```

页面 → hooks/queries → utils/request → mocks/transport → localStorage。所有请求都在浏览器内完成，路径沿用源项目的命名以保留页面契约。Vite 不配置后端代理。

组件包通过 npm `@weiran-tech/semi-components` 引用；不包含组件包源码或 Java 服务。`main.tsx` 和登录入口保留，菜单由 Mock 返回，仍通过页面注册表解析。

## 新增原型页面

在 pages 下创建页面，在 mocks/seed.ts 的 menus 登记标题、path 与 component。已有浏览器数据需要删除 `prototype_mock_v1` 才会重新读取种子菜单。

数据逻辑在 mocks/transport.ts 增加明确分支，禁止未知接口返回伪成功。复杂业务建议新增独立 Mock 模块并在 transport 中分发。

页面按钮可继续使用 Permission 展示权限状态。默认用户返回全部权限；这只是界面演示，不提供真实鉴权。
