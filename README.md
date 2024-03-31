# min-react

学习 React 的手写简单版本

## 运行

### 安装依赖

```bash
pnpm install
```

### 运行

```bash
npm run dev[1-8]
```

### 运行文档

```bash
npm run docs
```

## 版本介绍

### [V0](./v0/README.md)

这个版本为最初的版本，只实现了利用虚拟 dom 的形式对页面的基本数据渲染，并未使用到 jsx

### [V1](./v1/README.md)

该版本在 V0 版本的基础上利用 vite 解析 jsx，并渲染到页面上.但未实现`function`组件

### [V2](./v2/README.md)

该版本实现了任务调度器以及实现了用链式结构代替树形结构实现组件渲染

### [V3](./v3/README.md)

该版本实现了统一提交,并完成了`function`组件

### [V4](./v4/README.md)

该版本实现了绑定事件，更新 props

### [V5](./v5/README.md)

该版本实现了更新子节点能力

### [V6](./v6/README.md)

该版本实现 useState hook

### [V7](./v7/README.md)

该版本实现 useEffect hook
