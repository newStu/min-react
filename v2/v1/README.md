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

如果 DOM 树特别大,为什么会卡顿 ?

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

主: js 为单线程,然后循环次数过大,导致卡顿
副: 当 DOM 树特别大的时候,由于递归创建,所以前面创建的 ele 元素不断的保存下来,没有销毁,内存占用过大,导致卡顿

```bash
您的理解部分正确，但针对“DOM 树特别大”导致卡顿的情况，我将澄清一下几点：

JS 单线程与循环次数过大： JavaScript 是单线程执行的，这意味着同一时刻只能执行一个任务。当循环次数过大时，如果循环体内部的操作复杂度过高或未进行合理的异步处理，确实可能导致主线程长时间阻塞，无法及时响应用户的交互和其他任务，从而造成页面卡顿。但这与DOM树大小直接相关的卡顿原因略有不同。

递归创建 DOM 节点： 在您提供的代码示例中，递归创建 DOM 节点的过程中，虽然不会因循环次数过大而直接导致 JS 执行线程卡顿，但是每创建一个 DOM 元素并追加到文档中，都涉及到内存分配和DOM操作。当递归创建的DOM树层级过深或节点数量巨大时，主要问题在于：

内存占用：随着递归创建DOM节点，不断地分配内存给新创建的元素，若未及时清理不再使用的DOM节点，则可能导致内存占用过高，从而影响浏览器性能，甚至可能导致浏览器崩溃。

DOM 操作成本：向DOM树中插入大量节点时，浏览器需要不断计算布局、样式以及进行实际的页面渲染，这一系列操作相当耗时，尤其在大型DOM树情况下，更容易导致页面渲染和响应卡顿。

为了避免此类问题，通常建议采用虚拟DOM技术和批量更新策略，以减少不必要的DOM操作，并合理管理内存，确保应用的高性能运行
```

- 递归的过程中,不是还没有插入到外层容器上,为什么会引起 dom 操作成本?

```
在递归创建 DOM 节点的过程中，虽然节点尚未插入到外层容器中，但依然会产生 DOM 操作的成本。原因如下：

内存分配： 在 JavaScript 中，无论是创建文本节点还是元素节点，都会在内存中分配存储空间。递归创建 DOM 节点时，每一次 document.createElement 或 document.createTextNode 都会分配新的内存资源，即便节点还未添加到 DOM 树中。

属性设置： 在创建元素节点后，代码还会遍历并设置节点的属性。即使这些节点尚未挂载到 DOM 树上，为节点属性赋值也是实际发生的 DOM 操作。

递归调用栈： 递归调用自身的过程中，会持续占用 JavaScript 调用栈的空间。尽管这不是直接的 DOM 操作，但在处理大量 DOM 节点时，递归深度过大会消耗较多的内存资源，也可能导致栈溢出等问题。

DOM 构造： 虽然节点没有立即插入到文档中，但构造完整的 DOM 节点树本身就是一个复杂的过程，尤其是当节点层次深且数量多时，即使没有发生 DOM 树的实际变化，构造这个数据结构也存在内在的时间成本。

当最终将这些递归创建的节点逐个插入到 DOM 树时，累积起来的 DOM 操作成本会进一步显现。浏览器需要处理大量节点的插入、维护内部数据结构、计算样式、布局及渲染，这些都会影响性能，尤其是对于复杂的大型 DOM 结构来说。因此，即使是递归过程中未插入 DOM 树的节点创建，其操作也间接增加了整体的 DOM 操作成本。
```
