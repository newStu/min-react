# 删除节点

我们上节已经介绍了如何更新一个节点的 props, 现在我们来实现如果删除一个节点

## 思考

对于元素的添加,我们前面是已经完成了的,所以这里我们要关注的是如何删除元素.

- 我们需要知道删除的元素有哪些 ?
  - 如果 type 不同,那么该元素就是我们要删除的内容
- 删除的时机在哪里 ?
  - 我们会有一个 commitRoot 操作.我们可以在这个时候进行删除

## 场景一: 元素节点删除

```js
import React from "./core/React.js";

let showBar = false;
function Counter() {
  function handleClick() {
    showBar = !showBar;
    React.update();
  }

  const foo = <div>foo</div>;
  const bar = <p>bar</p>;

  return (
    <div>
      <div>{showBar ? bar : foo}</div>
      <button onClick={handleClick}>点击</button>
    </div>
  );
}

export default function App() {
  return (
    <div id="app">
      <Counter></Counter>
    </div>
  );
}
```

这个代码中,我们可以通过点击按钮来控制`showBar`参数,从而显示`bar`或者`foo`.这里的两个节点是不同的标签,所以不存在更新 props 操作,只有进行创建然后销毁以前的节点.

### 实现元素节点删除

1. 将需要删除的元素添加到 `delimiters` 的数组中
2. 在 `commitRoot` 中进行删除

```js
let delimiters = [];
function reconcileChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child;
  let prevChild = null;
  children.forEach((child, index) => {
    let isSameType = child.type === oldFiber?.type;
    let newFiber;
    if (isSameType) {
      // ------省略
    } else {
      // ------省略
      if (oldFiber) {
        delimiters.push(oldFiber);
      }
    }

    // ------省略
  });
}
```

> 这里判断`oldFiber`是否存在,如果存在就将其添加到`delimiters`数组中

```js
function commitDeletion(fiber) {
  fiberParent.dom.removeChild(fiber.dom);
}

function commitRoot() {
  delimiters.map(commitDeletion);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
  delimiters = [];
}
```

> 这里通过`commitDeletion`方法删除节点,删除节点也很简单,只需要通过父级 dom 元素的`removeChild`方法即可。但是这里是有一个问题的,如果是 function 组件,那么这个时候其实没有 dom 属性的,所以更改案例,然后处理一下在 function 组件的时候该怎么删除节点

## 场景二: 删除 function 组件节点

```jsx
import React from "./core/React.js";

let showBar = false;
function Counter() {
  function handleClick() {
    showBar = !showBar;
    React.update();
  }

  function Foo() {
    return <div>foo</div>;
  }

  function Bar() {
    return <p>bar</p>;
  }
  return (
    <div>
      <div>{showBar ? <Bar></Bar> : <Foo></Foo>}</div>
      <button onClick={handleClick}>点击</button>
    </div>
  );
}

export default function App() {
  return (
    <div id="app">
      <Counter></Counter>
    </div>
  );
}
```

> function 组件最大的问题就是没有 dom,所以我们可以通过查找子节点的方式来找到 dom

### 实现 function 组件节点删除

```js
function findHasDomParent(fiber) {
  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }
  return fiberParent;
}

function commitDeletion(fiber) {
  if (fiber.dom) {
    const fiberParent = findHasDomParent(fiber);
    fiberParent.dom.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child);
  }
}
```

- 这里我们通过判断当前 fiber 是否具有 dom 节点,如果没有 dom 节点就递归调用该方法
- 但是如果我们递归调用 commitDeletion 方法后,我们又会因为 function 组件第一个元素父节点无 dom 而报错,所以我们通过查找 dom 的形式来解决该问题,这种查找有 dom 的父节点操作较多,所以这里就直接提取一个函数`findHasDomParent`

## 场景三: 删除的节点中包含兄弟节点

```jsx
import React from "./core/React.js";

let showBar = false;
function Counter() {
  function handleClick() {
    showBar = !showBar;
    React.update();
  }

  const foo = (
    <div>
      foo<div>child1</div>
      <div>child2</div>
    </div>
  );

  const bar = <div>bar</div>;
  return (
    <div>
      <div>{showBar ? bar : foo}</div>
      <button onClick={handleClick}>点击</button>
    </div>
  );
}

export default function App() {
  return (
    <div id="app">
      <Counter></Counter>
    </div>
  );
}
```

> 这里我们切换后,发现`<div>child1</div>`并未被删除,这是因为我们只删除了 foo 的节点,并没有删除其兄弟节点`<div>child1</div>`

### 实现兄弟节点的删除

既然需要删除其兄弟节点,那么我们就要看 oldFiber 是否还存在兄弟节点【我们在 reconcileChildren 方法中会根据 children 循环，然后不断更新 oldFiber】，所以这个时候我们只需要判断 oldFiber 是否存在，如果存在，我们就添加到删除数组里去

```js
function reconcileChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child;
  let prevChild = null;
  children.forEach((child, index) => {
    // ----省略-----
  });

  if (oldFiber) {
    while (oldFiber) {
      delimiters.push(oldFiber);
      oldFiber = oldFiber.sibling;
    }
  }
}
```

> 这里使用循环是因为可能不只是存在一个兄弟节点，就像案例中的`<div>child2</div>`,所以需要循环遍历兄弟节点。

## 优化更新逻辑

```jsx
import React from "./core/React.js";

let countBar = 0;

function Bar() {
  console.log("bar");
  function handleClick() {
    countBar++;
    React.update();
  }

  return (
    <div>
      <h1>Bar</h1>
      {countBar}
      <button onClick={handleClick}>点击</button>
    </div>
  );
}

let countFoo = 0;
function Foo() {
  console.log("foo");
  function handleClick() {
    countFoo++;
    React.update();
  }

  return (
    <div>
      <h1>foo</h1>
      {countFoo}
      <button onClick={handleClick}>点击</button>
    </div>
  );
}
let countApp = 0;
export default function App() {
  console.log("app");
  function handleClick() {
    countApp++;
    React.update();
  }

  return (
    <div id="app">
      <h1>App</h1>
      {countApp}
      <button onClick={handleClick}>点击</button>

      <Foo></Foo>
      <Bar></Bar>
    </div>
  );
}
```

我们通过这个案例可以看到，我们不管点击哪个按钮，都会触发打印`app, foo, bar`, 但是当我们点击 foo 的按钮时，并不应该重新调用`app, bar`组件函数，我们接下来要进行优化该内容。

### 分析

要优化该内容，我们首先要明白两个位置，一个是更新开始节点，一个是更新结束节点。

1. 更新开始节点：当前组件
2. 更新结束节点：当前组件的兄弟节点

### 实现

我们首先要记录下我们的当前组件

```js
let wipFiber = null;
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  const { type, props } = fiber;
  const children = [type(props)];
  reconcileChildren(fiber, children);
}

function update() {
  let currentFiber = wipFiber;

  return () => {
    nextWorkOfUnit = wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
  };
}
```

我们结束点应该在任务中

```js
function workLoop(deadline) {
  // 是否进行让步
  let shouldYield = false;

  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);

    if (wipRoot?.sibling?.type === nextWorkOfUnit?.type) {
      nextWorkOfUnit = undefined;
    }

    shouldYield = deadline.timeRemaining() < 1;
  }

  // 渲染完成了,统一提交到root节点上
  if (!nextWorkOfUnit && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}
```

## 实现新语法

```jsx
import React from "./core/React.js";

let showBar = false;
function Counter() {
  function handleClick() {
    showBar = !showBar;
    React.update();
  }

  const bar = <div>bar</div>;
  return (
    <div>
      counter
      <button onClick={handleClick}>点击</button>
      {showBar && bar}
    </div>
  );
}

export default function App() {
  return (
    <div id="app">
      <Counter></Counter>
    </div>
  );
}
```

在 react 中我们经常使用以上` {showBar && bar}`语法进行显示，首先我们需要对其查看 jsx 解析出来的是什么，得到的结果如下

```json
{
  "type": "div",
  "children": [{ "type": "TEXT_ELEMENT" }, { "type": "button" }, false]
}
```

> 这里的 false 就是我们解析出来的`{showBar && bar}`，首先这个 false 会在三个位置出现`首位，中间，末尾`，我们分情况一个一个的处理

1. 末尾

```js
if (child) {
  newFiber = {
    type: child.type,
    props: child.props,
    dom: null,
    parent: fiber,
    child: null,
    sibling: null,
    alternate: null,
    effectTag: "PLACEMENT",
  };
}
```

2. 中间

```js
if (newFiber) {
  prevChild = newFiber;
}
```

3. 首位

```js
if (index === 0 || !prevChild) {
  fiber.child = newFiber;
} else {
  prevChild.sibling = newFiber;
}
```
