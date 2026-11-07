# 模板配置

`VITE_APP_TITLE` 控制管理端标题，默认 Weiran Prototype。开发默认值位于 packages/manage/.env.development，构建可设置同名环境变量或 .env.production。

端口固定为 manage 4802、docs 4809，均启用 strictPort。要统一调整时同步修改 Vite 配置、docs/package.json 与文档链接。

布局、主题、页签、表格和收藏由偏好面板调整，本地存储采用 prototype_ 前缀，与原项目分离。

业务配置由 Mock config 表与 configGroup 表提供。新增字段可复用现有动态配置表单；文件上传演示只使用浏览器存储。
