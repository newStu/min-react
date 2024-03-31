module.exports = {
  title: "Min React",
  description: "从0实现一个微型React",
  base: "/min-react/",
  themeConfig: {
    lastUpdated: "2024-03-28",
    docsDir: "docs",
    editLinks: true,
    editLinkText: "编辑此⽹站",
    outlineTitle: "页面导航",
    repo: "https://gitee.com/wangzhaoyv/min-react",
    footer: {
      message: "Released under the MITLicense.",
      copyright: "Copyright © 2023-present ZZ",
    },
    nav: [
      {
        text: "开发文档",
        link: "/develop/quick_start",
        activeMatch: "/develop/",
      },
    ],
    sidebar: {
      "/develop/": [
        {
          text: "开始",
          items: [{ text: "快速开始", link: "/develop/quick_start" }],
        },
        {
          text: "开发指南",
          items: [
            { text: "组件简单渲染", link: "/develop/common_render" },
            { text: "Jsx", link: "/develop/jsx" },
            { text: "Fiber", link: "/develop/fiber" },
            { text: "函数式组件", link: "/develop/function_component" },
            { text: "更新属性", link: "/develop/update_props" },
            { text: "更新子节点", link: "/develop/update_children" },
            { text: "useState", link: "/develop/use_state" },
            { text: "useEffect", link: "/develop/use_effect" },
            { text: "问题优化", link: "/develop/question_optimization" },
          ],
        },
      ],
    },
  },
};
