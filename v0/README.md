# API 实现

## 明确目标：react 的 API 形式

```js
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```

## 小步走, 慢慢实现

### V0: 使用普通 dom 操作方式显示 app（写死）

```js
// 获取根节点
const root = document.getElementById("root");
// 创建div
const ele = document.createElement("div");
ele.id = "app";
// 将div放到根节点中
root?.appendChild(ele);

// 创建文本节点
const textElement = document.createTextNode("");
// 为文本节点赋值
textElement.nodeValue = "Hello World";

// div添加文本节点
ele.appendChild(textElement);
```

### 利用虚拟 Dom 的形式显示

```js
const createTextNode = (nodeValue) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue,
      children: [],
    },
  };
};

const createElement = (type, props, ...children) => {
  return {
    type: type,
    props: {
      ...props,
      children,
    },
  };
};

const root = document.getElementById("root");
const ele = document.createElement(dom.type);
ele.id = dom.props.id;
root?.appendChild(ele);
const textElement = document.createTextNode("");
textElement.nodeValue = TextElement.props.nodeValue;
ele.appendChild(textElement);
```

- 确定属性

  - `type`: 类型，确定节点
  - `props`: 传入自定义属性
  - `children`: 子节点相关内容

- 确定数据结构（数据结构正确，算法复杂度才会越低）

```json
{
  "type": "div",
  "props": {
    "id": "app",
    "children": [
      {
        "type": "TEXT_ELEMENT",
        "props": {
          "nodeValue": "Hello World",
          "children": []
        }
      }
    ]
  }
}
```

**V1: 利用虚拟 Dom 的概念手动完成页面渲染（明确自己要对这个数据结构做什么）**

```js
const TextElement = {
  type: "TEXT_ELEMENT",
  props: {
    nodeValue: "Hello World",
  },
  children: [],
};

const dom = {
  type: "div",
  props: {
    id: "app",
  },
  children: [TextElement],
};

const root = document.getElementById("root");
const ele = document.createElement(dom.type);
ele.id = dom.props.id;
root?.appendChild(ele);

const textElement = document.createTextNode("");
textElement.nodeValue = TextElement.props.nodeValue;
ele.appendChild(textElement);
```

**V2: 利用虚拟 Dom 的概念进行动态创建虚拟 dom ，并渲染到页面上（重构，并完成封装）**

```js
const createTextNode = (nodeValue) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue,
      children: [],
    },
  };
};

const createElement = (type, props, ...children) => {
  return {
    type: type,
    props: { ...props, children },
  };
};

const textNode = createTextNode("hello world");
const App = createElement("div", { id: "app" }, textNode);
const root = document.getElementById("root");
const ele = document.createElement(App.type);
ele.id = App.props.id;
root?.appendChild(ele);

const textElement = document.createTextNode("");
textElement.nodeValue = textNode.props.nodeValue;
ele.appendChild(textElement);
```

> 重构出添加了两个创建虚拟 dom 的方法
>
> - `createTextNode`: 创建文本节点
>   - 主要变化点在于内容：`nodeValue`
> - `createElement`: 创建元素节点
>   - `type`：类型，确定创建什么元素（`div`, `textNode` ……）
>   - `props`：参数
>   - `children`：内部其他元素

### V3: 动态创建节点 【render】

```js
const render = (App, container) => {
  const { type, props } = App;

  // 判断元素类型，并创建元素
  const ele =
    type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(type);

  // 添加属性
  Object.keys(props).forEach((key) => {
    if (key !== "children") {
      ele[key] = props[key];
    }
  });

  // 递归渲染子元素
  props.children.forEach((child) => {
    render(child, ele);
  });

  container.appendChild(ele);
};

const textNode = createTextNode("hello world");
const App = createElement("div", { id: "app" }, textNode);
render(App, document.getElementById("root"));
```

- 通过 `render` 方法，将 `App` 节点渲染到页面上
  - 递归创建子节点
  - 将创建的节点挂载到容器上

### V4: 模拟 react API 形式完成

```js
// ...省略了createTextNode方法

const createElement = (type, props, ...children) => {
  return {
    type: type,
    props: {
      ...props,
      children: children.map((item) =>
        typeof item === "string" ? createTextNode(item) : item
      ),
    },
  };
};

const ReactDOM = {
  createRoot: (container) => ({
    render: (App) => render(App, container),
  }),
};

const App = createElement("div", { id: "app" }, "hello", " world");
ReactDOM.createRoot(document.getElementById("root")).render(App);
```

- 按 `React` 的 `api` 对其进行实现
- 对 `createElement` 方法进行优化，子节点可以传入字符串，自动转换为文本节点

### 最终版本: 优化代码，将业务代码和框架代码拆分

**React.js**
将`createTextNode` `createElement` `render`三个方法放入`core/React.js`中

```js
const React = {
  render,
  createElement,
};

export default React;
```

- `createTextNode`: 为内部方法，无需导出

**ReactDOM.js**

将 ReactDOM 放入`core/ReactDOM.js`中，并导出

```js
import React from "./React.js";

const ReactDOM = {
  createRoot: (container) => ({
    render: (App) => React.render(App, container),
  }),
};

export default ReactDOM;
```

**main.js**

```js
import React from "./core/React.js";
import ReactDOM from "./core/ReactDOM.js";

const App = React.createElement("div", { id: "app" }, "hello", " world");
ReactDOM.createRoot(document.getElementById("root")).render(App);
```

**app.js**

```js
import React from "./core/React.js";

const App = React.createElement("div", { id: "app" }, "hello", " world");

export default App;
```

**main.js**

```js
import App from "./App.js";
import ReactDOM from "./core/ReactDOM.js";

ReactDOM.createRoot(document.getElementById("root")).render(App);
```
