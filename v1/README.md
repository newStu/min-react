# 使用 jsx

jsx 是无法被直接被解析的，需要通过打包工具对其进行解析为 js 对象，所以需要使用 vite 作为构建工具

## 项目创建

```bash
pnpm create vite
```

- 选择最简单的版本【Vanilla】

```bash
npm install
```

```bash
npm run dev
```

## 迁移文件

- 将`App.js`改名为`App.jsx`,并放入`v1`文件夹中
- 将`v0/core`放入`v1`
- 将`v0/main.js`替换`v1/main.js`

> 这个时候运行会报错 `Uncaught TypeError: Cannot read properties of null (reading 'appendChild')`
>
> - 因为我们的 v0 版本使用的根节点`id`为`root`,所以这里要注意更改`index.html内div的id`

## 更改 App.jsx 文件内容

我们当前还当 jsx 文件为一个 js 文件使用，接下来我们编写 jsx 语法，看看返回内容是什么

```jsx
import React from "./core/React.js";

// const App = React.createElement("div", { id: "app" }, "hello", " world");

const App = <div id="app">hello world</div>;

console.log(App);

export default App;
```

> 将以前的 `App` 翻译为下面的 `jsx` 内容，然后我们看看 `App` 内容.

```json
{
  "type": "div",
  "props": {
    "id": "app",
    "children": [
      {
        "type": "TEXT_ELEMENT",
        "props": {
          "nodeValue": "hello world",
          "children": []
        }
      }
    ]
  }
}
```

> 我们发现 `App` 的内容与 `React.createElement` 函数的返回内容相同.

**验证:这里走的是否就是我们写的`React.createElement`**

- 在`React.createElement`方法下面进行打印,发现是经过这里
  解析: jsx 会将`<div>9999</div>`转义为`React.createElement('div', null, '9999')`,然后加上我们上面导入的`React`.最后显示如下代码

```js
import React from "./core/React.js";
const App = React.createElement("div", null, "9999");
export default App;
```

**扩展-自定义 react 的名字**
jsx 这里默认使用的是`React.createElement`, 如果需要更改`React`这个名称,可以使用 pragma 进行指定.

```js
/**@jsx CReact.createElement */
import CReact from "./core/React.js";
const App = <div id="app">hello world</div>;

export default App;
```

> 上面就是使用 `CReact.createElement` 替换了 `React.createElement`

## 思考题

如果 DOM 树特别大,为什么会卡顿?

```js
const render = (App, container) => {
  const { type, props } = App;

  // 创建元素
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
```

当 DOM 树特别大的时候,由于递归创建,所以前面创建的 ele 元素不断的保存下来,没有销毁,内存占用过大,导致卡顿
