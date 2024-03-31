# useState

useState 是一个 Hook，它接收一个参数作为初始值，返回一个数组，数组的第一个元素是当前状态，第二个元素是一个更新状态的函数。所以只有当调用函数更新状态时，才会重新渲染组件。

**基本语法**

```jsx
const [count, setCount] = useState(10);
```

- count 是当前状态
- setCount 是更新状态的函数

**案例**

```jsx
import React from "./core/React.js";

export default function App() {
  const [count, setCount] = React.useState(10);
  function handleClick() {
    setCount((c) => {
      return ++c;
    });
  }

  return (
    <div id="app">
      <h1>App</h1>
      {count}
      <button onClick={handleClick}>点击</button>
    </div>
  );
}
```

我们实现的目标就是当我们点击按钮的时候，页面上数字会加 1

> 这里要`++c`, 不可以`c++`,因为`c++`是先返回 c 再加 1

**实现**

```jsx
function useState(initial) {
  let currentFiber = wipFiber;
  const oldStateHook = currentFiber.alternate?.stateHook;
  const stateHook = {
    state: oldStateHook ? oldStateHook.state : initial,
  };

  currentFiber.stateHook = stateHook;

  function setState(action) {
    stateHook.state = action(stateHook.state);

    nextWorkOfUnit = wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
  }

  return [stateHook.state, setState];
}
```

0. 渲染组件,会调用 updateFunctionComponent 方法,这个时候我们就讲 wipFiber 设置为当前组件, 在 updateFunctionComponent 方法中,会调用组件方法【type()】
1. 我们在组件中调用 useState，传入一个初始值
2. 这个时候我们使用 currentFiber 保存 wipFiber，同时创建一个 stateHook 对象【这里是对象，不是普通值】
3. 这个时候我们取出 oldFiber 中保存的状态，如果存在的话，就赋值给 stateHook.state，我们获取到了上一个状态
4. 返回状态值【stateHook.state】与修改状态的方法【setState】
5. 组件渲染的时候就拿到了缓存的新状态【也就是 oldStateHook.state】，这里的新状态是相较于默认值的新状态
6. 我们通过点击事件，调用了 setState 方法，传入了一个获取到修改状态后的方法
7. 这个时候我们将获取到新的状态【action(stateHook.state)】,并将新状态赋值给 stateHook.state。【这里就是通过改变对象内部属性，而 currentFiber.stateHook 所指向的地址不变，所以才能继续通过存入下一个任务】
8. 并设置下一个更新任务 nextWorkOfUnit，然后又进入了第 0 步

**实现多个 useState 同时使用**

```jsx
import React from "./core/React.js";

export default function App() {
  const [count, setCount] = React.useState(10);
  const [bar, setBar] = React.useState("bar");
  function handleClick() {
    setCount((c) => {
      return ++c;
    });

    setBar((c) => c + "bar");
  }

  return (
    <div id="app">
      <h1>App</h1>
      {count}
      <p>{bar}</p>
      <button onClick={handleClick}>点击</button>
    </div>
  );
}
```

在这个案例中，我们使用了两次 useState 创建了两个数据，如果我们还用上面那个实现，当我们点击按钮时，count 和 bar 都将变为字符串`barbar`,那是因为我们的 useState 只记录了一个数值，后面的数值将覆盖前面创建的数据

实现该功能有两个点值得关注

- 我们怎么区分多个 useState 呢？
  我们发现调用 useState 的方法的顺序是不一样的，所以我们可以通过函数的调用顺序来区分多个 useState
- 我们要以什么形式存储数据呢？
  我们可以通过数组的形式存储数据，这也和我们前面通过调用顺序来区分相照应

通过上面两个问题的解答，我们来看看代码：

```js
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  stateHooks = [];
  stateHookIndex = 0;
  const { type, props } = fiber;
  const children = [type(props)];
  reconcileChildren(fiber, children);
}

let stateHookIndex;
let stateHooks;
function useState(initial) {
  let currentFiber = wipFiber;
  const oldStateHook = currentFiber.alternate?.stateHooks[stateHookIndex];
  const stateHook = {
    state: oldStateHook ? oldStateHook.state : initial,
  };
  stateHooks.push(stateHook);

  currentFiber.stateHooks = stateHooks;
  stateHookIndex++;
  function setState(action) {
    const isFunction = typeof action === "function";
    const value = isFunction ? action(stateHook.state) : action;

    stateHook.state = value;

    nextWorkOfUnit = wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
  }

  return [stateHook.state, setState];
}
```

- stateHookIndex：确定调用顺序
- stateHooks：保存状态
- 我们在 updateFunctionComponent 的时候对两个变量进行初始化
- 执行完一次 useState 就将 stateHookIndex 增加 1
- 我们通过判断 action 的类型来确定是调用函数获取值还是直接使用 action，让我们的 setState 支持直接设置值的方式【setState("bar")】

> 通过以上调用顺序而确定值的操作，我们就能明白为什么 react 中 hook 不能再函数内或者判断内进行调用了，因为这样将导致数据顺序的错误

**优化：提前检测，减少不必要的更新**
按我们上面的方式，我们只要调用 setState 就会添加一个任务，但是实际上当修改的值没有变化的时候我们是没有必要添加任务的，所以我们可以提前获取新值，与旧值对比，从而减少不必要的更新。

```js
function setState(action) {
  const isFunction = typeof action === "function";
  const value = isFunction ? action(stateHook.state) : action;
  if (value === stateHook.state) return;

  stateHook.state = value;

  nextWorkOfUnit = wipRoot = {
    ...currentFiber,
    alternate: currentFiber,
  };
}
```

我们通过新值和旧值的对比，从而判断是否需要提前返回

## 批量执行 action

```jsx
import React from "./core/React.js";

export default function App() {
  const [count, setCount] = React.useState(10);
  const [bar, setBar] = React.useState("bar");
  function handleClick() {
    setCount((c) => {
      return ++c;
    });

    setBar(bar + "barbar");
    setBar(bar + "barbar");
    setBar(bar + "barbar");
    setBar(bar + "barbar");
    setBar(bar + "barbar");
    setBar(bar + "barbar");
  }

  return (
    <div id="app">
      <h1>App</h1>
      {count}
      <p>{bar}</p>
      <button onClick={handleClick}>点击</button>
    </div>
  );
}
```

```js
function useState(initial) {
  let currentFiber = wipFiber;
  const oldStateHook = currentFiber.alternate?.stateHooks[stateHookIndex];
  const stateHook = {
    state: oldStateHook ? oldStateHook.state : initial,
    queue: oldStateHook ? oldStateHook.queue : [],
  };

  stateHook.queue.forEach((action) => action(stateHook.state));

  stateHook.queue = [];

  stateHooks.push(stateHook);

  currentFiber.stateHooks = stateHooks;
  stateHookIndex++;
  function setState(action) {
    const isFunction = typeof action === "function";
    const actionFunc = isFunction ? action : () => action;
    // @ts-ignore
    stateHook.queue.push(actionFunc);

    const value = actionFunc(stateHook.state);
    if (value === stateHook.state) return;

    stateHook.state = value;

    nextWorkOfUnit = wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
  }

  return [stateHook.state, setState];
}
```

- 我们通过 stateHook.queue 对 action 进行保存
- 在 setState 的过程中，我们将 action 转为函数，然后保存到我们的 queue 中【这里设置了任务】
- 任务执行的时候，会执行 updateFunctionComponent 函数，然后执行【type()】,这个时候就会调用我们的 useState 方法
- 我们拿到了 oldStateHook.queue ，然后进行循环执行，最后再进行清空
