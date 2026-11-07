import { defineConfig } from 'vitepress';
export default defineConfig({
  "base": "/docs/",
  "lang": "zh-CN",
  "title": "Weiran Prototype",
  "description": "纯前端原型生成模板与组件文档",
  "cleanUrls": true,
  "themeConfig": {
    "nav": [
      {
        "text": "使用指南",
        "link": "/usage"
      },
      {
        "text": "架构与扩展",
        "link": "/architecture"
      },
      {
        "text": "Mock 数据",
        "link": "/mock"
      },
      {
        "text": "模板配置",
        "link": "/configuration"
      },
      {
        "text": "公共组件",
        "link": "/components/"
      },
      {
        "text": "静态部署",
        "link": "/deployment"
      }
    ],
    "sidebar": [
      {
        "text": "原型模板",
        "items": [
          {
            "text": "使用指南",
            "link": "/usage"
          },
          {
            "text": "架构与扩展",
            "link": "/architecture"
          },
          {
            "text": "Mock 数据",
            "link": "/mock"
          },
          {
            "text": "模板配置",
            "link": "/configuration"
          },
          {
            "text": "公共组件",
            "link": "/components/"
          },
          {
            "text": "静态部署",
            "link": "/deployment"
          }
        ]
      },
      {
        "text": "公共组件",
        "items": [
          {
            "text": "file-type-icon",
            "link": "/components/file-type-icon"
          },
          {
            "text": "file-upload",
            "link": "/components/file-upload"
          },
          {
            "text": "icon-picker",
            "link": "/components/icon-picker"
          },
          {
            "text": "image-upload",
            "link": "/components/image-upload"
          },
          {
            "text": "nav-list-item",
            "link": "/components/nav-list-item"
          },
          {
            "text": "nav-list-panel",
            "link": "/components/nav-list-panel"
          },
          {
            "text": "option-select",
            "link": "/components/option-select"
          },
          {
            "text": "pdf-preview",
            "link": "/components/pdf-preview"
          },
          {
            "text": "rich-text-editor",
            "link": "/components/rich-text-editor"
          },
          {
            "text": "text-avatar",
            "link": "/components/text-avatar"
          },
          {
            "text": "video-preview",
            "link": "/components/video-preview"
          }
        ]
      }
    ],
    "search": {
      "provider": "local"
    },
    "footer": {
      "message": "React · Semi UI · Browser Mock"
    }
  }
});
