# useRef 和 useMemo

在 React 中有两个不是很常用的 api,那就是 useMemo 和 useRef。其最重要的一个作用就是缓存,接下来我们实现一下

## useRef

### 作用

- 保存组件内部的可变数据，用于创建一个可变的引用对象,这个对象在组件的整个生命周期中保持不变,并且可以保存任何类型的值。
- 可以在组件渲染的生命周期中修改这些数据，而无需触发重新渲染，这在某些场景中非常有用，例如记录上一次渲染的值。

### 使用

```jsx
import React from "./core/React.js";

export default function App() {
  const [bar, setBar] = React.useState("bar");
  const refValue = React.useRef("测试");
  const refTextValue = React.useRef("测试Text");

  function handleClickBar() {
    setBar("bar" + bar);
  }

  function handleChangeRef() {
    refValue.current = "99999";
    refTextValue.current = refTextValue.current + "8888";
  }

  React.useEffect(() => {
    console.log(refValue, refTextValue);
  }, [refTextValue.current]);

  return (
    <div>
      <button onClick={handleClickBar}>点击修改Bar</button>
      <button onClick={handleChangeRef}>点击修改Ref</button>
    </div>
  );
}
```

这里声明两个 ref 值,然后添加了两个按钮,一个是修改 Bar【setState】，一个时修改 ref 的值，当我们点击修改 ref 的时候，Effect 是不会触发的，然后点击修改 Bar 的时候，Effect 会触发，因为 `refTextValue` 值改变,然后`setState`触发了更新。

### 分析

要实现该功能,我们从作用与使用上进行分析，通过上面的介绍，我们可以得出以下结论

- useRef 和 useState 差不多，只是不需要返回`set函数`。
- useRef 返回的是一个对象，并且带有`current`属性。
- useRef 可以声明多个，并且值互不影响

### 实现

**基本框架**

```js
function useRef(initial, deps) {
  const refHook = {
    current: initial,
  };

  return refHook;
}
```

> 我们首先实现一个基本框架，接受一个初始值，然后返回一个带有`current`属性的对象。

**实现缓存**

看到这个我们应该不陌生了，前面我们的 useState 和 useEffect 都是通过存放再 fiber 实现缓存的，我们这个自然也不例外

```js
let refHookIndex;
let refHooks;
function useRef(initial) {
  const currentFiber = wipFiber;
  const oldRefHook = currentFiber.alternate?.refHooks[refHookIndex];
  const refHook = {
    current: oldRefHook ? oldRefHook.current : initial,
  };

  // 单使用index实现
  // if(!currentFiber.refHooks){
  //   currentFiber.refHooks = [];
  // }
  // currentFiber.refHooks[refHookIndex] = refHook;

  refHooks.push(refHook);
  currentFiber.refHooks = refHooks;

  refHookIndex++;
  return refHook;
}
```

因为比较简单，就直接以数组的形式实现了

- 获取到老的 hooks 数据
- 如果老数据存在，就用于初始化当前的 hooks 数据
- 缓存到当前 fiber 的 refHooks 数据中
- 返回 refHooks

> 这里选择与 useState 一样的缓存方式，当然也可以像我注释那样，定义一个 index 变量实现，但是每次都要判断，只是作为一种实现尝试.

::: warning
这里的两个全局变量`refHookIndex`和`refHooks`, 还是要再`updateFunctionComponent`函数中进行初始化的
:::

::: info
上面的实现非常简单，可能有不完善的地方。如果发现可以再进行优化修复
:::

## useMemo

### 作用

useMemo 的作用是在 React 组件中缓存计算结果，以减少不必要的重复计算和渲染，从而优化性能和确保组件的一致性。

### 使用

```jsx
import React from "./core/React.js";

export default function App() {
  const [bar, setBar] = React.useState("bar");
  const [foo, setFoo] = React.useState("foo");

  const memoInfo = React.useMemo(() => {
    return bar + "memo";
  }, [bar]);

  function handleClickBar() {
    setBar("bar" + bar);
  }

  function handleClickFoo() {
    setFoo("foo" + foo);
  }

  React.useEffect(() => {
    console.log(memoInfo);
  }, [memoInfo]);

  return (
    <div>
      <button onClick={handleClickBar}>点击修改Bar</button>
      <button onClick={handleClickFoo}>点击修改Foo</button>
      <p>bar: {bar}</p>
      <p>foo: {foo}</p>
      <p>memo: {memoInfo}</p>
    </div>
  );
}
```

### 分析

- useMemo 传入的函数会被执行一次获取到值
- 如果依赖不改变，那么该函数就不会再次执行
- useMemo 传入的函数返回值会作为 useMemo 的返回值

### 思考

针对上面的分析我们思考几个问题

1. useMemo 缓存内容放在哪里？
   > 这应该清楚了，useMemo 的缓存还是放在 fiber 中
2. useMemo 的缓存内容什么时候更新？
   > 依赖变化的时候
3. useMemo 的缓存内容在哪里更新？
   > 组件重刷后，调用 useMemo 的时候我们应该返回内容，所以这个时候如果依赖变化，直接调用函数进行更新就挺好的

### 实现

**简单实现**

```js
function useMemo(callback, deps) {
  // 没有改变并且有老的值,就直接用
  const memoHook = {
    value: callback(),
    deps,
  };

  return memoHook.value;
}
```

第一个参数为一个函数，然后我们通过调用该函数，获取到初始值，然后返回

**实现缓存**

```jsx
let memoIndex;
let memoHooks;
function useMemo(callback, deps) {
  const currentFiber = wipFiber;
  const oldMemoHook = currentFiber.alternate?.memoHooks[memoIndex];

  const isChange = oldMemoHook?.deps.some((dep, i) => {
    return deps[i] !== dep;
  });

  // 没有改变并且有老的值,就直接用
  const memoHook = {
    value: oldMemoHook?.value && !isChange ? oldMemoHook?.value : callback(),
    deps,
  };

  memoHooks.push(memoHook);
  memoIndex++;
  currentFiber.memoHooks = memoHooks;

  return memoHook.value;
}
```

- 我们还是像 useState 一样，通过全局变量`memoIndex`和`memoHooks`来实现缓存
- 但是我们需要在返回前进行判断，如果依赖没有变化，就直接返回老的值，否则就重新计算

::: warning
这里的两个全局变量`memoIndex`和`memoHooks`, 还是要再`updateFunctionComponent`函数中进行初始化的
:::

::: info
上面的实现非常简单，可能有不完善的地方。如果发现可以再进行优化修复
:::

#### 初始化代码

```js
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  stateHooks = [];
  effectHooks = [];
  memoHooks = [];
  refHooks = [];
  stateHookIndex = 0;
  refHookIndex = 0;
  memoIndex = 0;
  const { type, props } = fiber;
  const children = [type(props)];
  reconcileChildren(fiber, children);
}
```

## 重构

我们发现我们对比依赖的地方已经有三处【`runCleanup`, `commitEffects`, `useMemo`】了，我们可以提取一个函数来实现该功能

```js
function verifyDepsChange(oldDeps = [], newDeps = []) {
  return oldDeps.some((dep, i) => {
    return newDeps[i] !== dep;
  });
}
```

该方法直接提供新的依赖和旧的依赖，最后返回对比结果
