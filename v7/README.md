# useEffect

useEffect 函数组件的副作用函数，在组件挂载、更新、卸载时执行。我们简单看看其的使用方法：

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
  }

  React.useEffect(() => {
    console.log("init");
  }, []);

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

在该案例中,当我们加载该组件的时候,就会执行一次`console.log(init)`.

## 分析

实现该功能主要注意两个点

1. useEffect 所注册的内容存放到哪?
   > 按前面 useState 的经验,我们可以知道我们应该将其放在 fiber 上
2. useEffect 的执行时机在哪里?
   > 前面也说过,useEffect 的执行时机是在组件渲染完成之后,而我们执行完组件渲染就是在 commitRoot 阶段,所以我们要将搜集到的内容放在 commitRoot 阶段执行, 因为要完全挂载,就要在 commitWork 完成后执行
3. useEffect 不管如何,首次都会执行一次,如何判断是首次呢?
   > 我们可以通过`fiber.alternate`是否存在来判断是否为第一次

## 简单版本实现

```js
function commitEffectHooks() {
  function run(fiber) {
    if (!fiber) return;
    if (!fiber.alternate) {
      const effectHook = fiber?.effectHook;
      effectHook.callback();
    }

    run(fiber.child);
    run(fiber.sibling);
  }

  run(wipRoot);
}

function commitRoot() {
  // ---省略
  commitWork(wipRoot.child);
  commitEffectHooks();
  // ---省略
}

function useEffect(callback, deps) {
  const effectHook = {
    callback,
    deps,
  };

  wipFiber.effectHook = effectHook;
}
```

- 我们先定义 `useEffect` 函数,并在函数中收集函数和依赖数组。然后存入`wipFiber`中。
- 然后在`commitRoot`中，调用 commitEffectHooks 函数
- commitEffectHooks 递归遍历`wipRoot`的子节点，如果子节点存在`effectHook`属性，则执行`effectHook`中的回调函数。
- 判断是否存在 alternate 属性,如果存在就是首次,不管是什么依赖都要进行执行

到此我们处理了首次 useEffect 的逻辑.接下来我们在处理一下有依赖的情况下该怎么处理

```js
function commitEffectHooks() {
  function run(fiber) {
    if (!fiber) return;
    if (!fiber.alternate) {
      const effectHook = fiber?.effectHook;
      effectHook.callback();
    } else {
      const isChange = fiber.effectHook.deps.some((dep, index) => {
        return fiber.alternate.effectHook.deps[index] !== dep;
      });

      if (isChange) fiber.effectHook.callback();
    }

    run(fiber.child);
    run(fiber.sibling);
  }

  run(wipRoot);
}
```

我们通过判断`fiber.effectHook.deps`与`fiber.alternate.effectHook.deps`之间的差别,来决定是否执行`fiber.effectHook.callback()`,这样我们就实现了`useEffect`的依赖变化而执行的逻辑了。

## 多个 useEffect 实现

如果我们想要实现多个`useEffect`的逻辑,那么我们就不能再只是定义一个局部变量`effectHook`了,而是应该定义一个数组`effectHooks`,这样我们就可以保存多个`useEffect`的逻辑了。
所以我们声明全局变量数组`effectHooks`。

```js
let effectHooks;
function useEffect(callback, deps) {
  const effectHook = {
    callback,
    deps,
  };
  effectHooks.push(effectHook);

  wipFiber.effectHooks = effectHooks;
}
```

现在问题是这个`effectHooks`数组在哪里进行初始化呢?

> 考虑到我们每一个组件的 useEffect 都是独立的，所以我们还是得在`updateFunctionComponent`中进行初始化操作

```js
let effectHooks;
function useEffect(callback, deps) {
  const effectHook = {
    callback,
    deps,
  };
  effectHooks.push(effectHook);

  wipFiber.effectHooks = effectHooks;
}

function commitEffects() {
  function run(fiber) {
    if (!fiber) return;
    // 首次执行
    if (!fiber.alternate) {
      fiber.effectHooks?.forEach((effectHook) => effectHook.callback());
    } else {
      const oldFiberHooks = fiber.alternate?.effectHooks;
      fiber.effectHooks?.forEach((effectHook, index) => {
        const oldHooks = oldFiberHooks[index];
        // 判断依赖是否改变执行
        const isChange = effectHook?.deps.some((dep, i) => {
          return oldHooks.deps[i] !== dep;
        });
        if (isChange) {
          effectHook.callback();
        }
      });
    }
    run(fiber.child);
    run(fiber.sibling);
  }
  run(wipRoot);
}
```

> 这里因为 useEffect 的 hooks 在函数组件的位置是不会改变的,所以这里直接 push 进去,又因为直接遍历执行所有的 useEffect,所以对应关系【deps】是不会有问题，这又是 hooks 不能使用再函数判断语句内的原因

## 实现 useEffect 的 cleanup

```jsx
import React from "./core/React.js";

function Bar() {
  const [bar, setBar] = React.useState("bar");
  function handleBarClick() {
    setBar(bar + "barbar");
  }

  React.useEffect(() => {
    console.log("init Bar");

    return () => {
      console.log("-----------");
    };
  }, []);

  return (
    <div>
      <h1>Bar</h1>
      <button onClick={handleBarClick}>bar点击</button>
    </div>
  );
}

export default function App() {
  const [count, setCount] = React.useState(10);
  const [bar, setBar] = React.useState("bar");
  function handleCountClick() {
    setCount(1 + count);
  }

  function handleBarClick() {
    setBar(bar + "barbar");
  }

  React.useEffect(() => {
    console.log("init");

    return () => {
      console.log("-----------");
    };
  }, []);

  React.useEffect(() => {
    console.log("initBar", bar);

    return () => {
      console.log("-----bar------");
    };
  }, [bar]);

  React.useEffect(() => {
    console.log("initCount", count);

    return () => {
      console.log("-----count------");
    };
  }, [count]);

  React.useEffect(() => {
    console.log("initCount initBar", count, bar);

    return () => {
      console.log("-----count bar------");
    };
  }, [count, bar]);

  return (
    <div id="app">
      <h1>App</h1>
      {count}
      <p>{bar}</p>
      <button onClick={handleCountClick}>count点击</button>
      <button onClick={handleBarClick}>bar点击</button>

      {count % 2 === 0 ? <Bar></Bar> : "123456"}
    </div>
  );
}
```

清理函数 (Cleanup Function)：当 useEffect 返回一个函数时，这个函数将被视作“清理”函数。其调用时机具体为：

- 依赖项变化时：如果有依赖项数组，并且这些依赖项在下一次渲染时发生了变化，React 将在应用新的副作用之前先调用上一轮渲染中的清理函数。
- 组件卸载前：无论 useEffect 的依赖数组是什么（包括没有依赖项，即 [] 的情况），在组件卸载销毁前，都会执行返回的清理函数。

### 分析

- 这个函数怎么获取，保存在哪里呢？
  > 我们可以通过调用 effect 函数的时候进行获取，保存位置自然也应该是在 effectHooks 上
- 这两个时机分别在什么位置呢？
  > 1. 第一个时机就直接可以在调用 commitEffects 前即可
  > 2. 第二个时机要找到卸载的时候，我们可以在删除节点的时候进行调用

### 实现场景一

```js
function useEffect(callback, deps) {
  const effectHook = {
    callback,
    deps,
    cleanup: null,
  };
  effectHooks.push(effectHook);

  wipFiber.effectHooks = effectHooks;
}
```

> 我们直接在下面先添加一个属性，cleanup，用来存储我们的回调函数。等到后面进行赋值

```js
function commitEffects() {
  function run(fiber) {
    if (!fiber) return;
    // 首次执行
    if (!fiber.alternate) {
      fiber.effectHooks?.forEach(
        (effectHook) => (effectHook.cleanup = effectHook.callback())
      );
    } else {
      const oldFiberHooks = fiber.alternate?.effectHooks;
      fiber.effectHooks?.forEach((effectHook, index) => {
        const oldHooks = oldFiberHooks[index];
        if (effectHook?.deps.length !== 0) {
          // 判断依赖是否改变执行
          const isChange = effectHook?.deps.some((dep, i) => {
            return oldHooks.deps[i] !== dep;
          });
          if (isChange) {
            effectHook.cleanup = effectHook.callback();
          }
        }
      });
    }
    run(fiber.child);
    run(fiber.sibling);
  }

  run(wipRoot);
}
```

> 在每次调用 callback 的时候都记录一下当前的返回值

```js
function commitEffects() {
  function run(fiber) {
    // ---省略
  }
  function runCleanup(fiber) {
    if (!fiber) return;
    const oldFiberHooks = fiber.alternate?.effectHooks;
    if (oldFiberHooks) {
      oldFiberHooks.forEach((effectHook) => {
        if (effectHook.cleanup && effectHook?.deps.length > 0) {
          effectHook.cleanup();
        }
      });
    }
    runCleanup(fiber.child);
    runCleanup(fiber.sibling);
  }

  runCleanup(wipRoot);
  run(wipRoot);
}
```

> 在执行 effectHooks 时，会先判断是否需要执行 cleanup 函数，如果存在，则执行。但是执行前先判断 deps 是否发生了变化，如果发生了变化，则执行 cleanup 函数。

这样一来我们的 cleanup 函数第一种场景就实现了，接下来我们来处理卸载的时候

### 实现场景二

我们的案例中，当 count 为奇数的时候就会展示字符串。偶数就会显示组件。这样就做到了组件的卸载. 我们上面也分析过了，当组件卸载必定是在删除组件的时候。于是我们用下面的方式进行实现

```js
function commitDeletion(fiber) {
  if (fiber.dom) {
    const fiberParent = findHasDomParent(fiber);
    fiberParent.dom.removeChild(fiber.dom);
  } else {
    if (typeof fiber.type === "function") {
      runCleanup(fiber, true);
    }
    commitDeletion(fiber.child);
  }
}
```

> 这里我们判断 dom 是否存在,如果不存在 dom 就说明可能是一个 function 组件,于是通过判断 type 类型来确定是 function 组件,我们就使用 runCleanup 函数进行卸载执行, 上面的实现中,我们的 runCleanup 函数为内部函数,外部无法调用,所以我们需要将其提出来作为全局函数,然后还要区分是否为卸载,所以加了第二个参数`isUnmount`

```js
function runCleanup(fiber, isUnmount = false) {
  if (!fiber) return;
  const oldFiberHooks = isUnmount
    ? fiber.effectHooks
    : fiber.alternate?.effectHooks;
  if (oldFiberHooks) {
    oldFiberHooks.forEach((effectHook) => {
      if (effectHook.cleanup && (isUnmount || effectHook?.deps.length > 0)) {
        effectHook.cleanup();
      }
    });
  }
  runCleanup(fiber.child);
  runCleanup(fiber.sibling);
}
```

- 我们默认为非卸载调用
- 判断如果是卸载就使用 fiber.effectHooks,否则就使用老 fiber 的 effectHooks
- 如果是卸载,我们就不要判断依赖是否大于 0

到此,我们的卸载调用就完成了

#### 问题

在案例中,我们如果先点击 app 组件的`bar点击`按钮,然后再点击`count 点击`按钮,会发现我们的卸载函数没有调用,那是因为当我们点击`count点击`按钮后,`Bar组件`进行更新,因为不是第一次调用了,所以 useEffect 无依赖的函数没有调用,最后就是初始值 null, 所以当我们卸载的时候发现并没有可用的清理函数使用

#### 解决

既然是因为前面没有调用导致的函数被 null 覆盖了,那么我们就可以考虑,如果函数并未被调用,那么直接使用老的 cleanup 函数,这样,就不会被覆盖了。

```js
function commitEffects() {
  function run(fiber) {
    if (!fiber) return;
    // 首次执行
    if (!fiber.alternate) {
      fiber.effectHooks?.forEach(
        (effectHook) => (effectHook.cleanup = effectHook.callback())
      );
    } else {
      const oldFiberHooks = fiber.alternate?.effectHooks;
      fiber.effectHooks?.forEach((effectHook, index) => {
        const oldHooks = oldFiberHooks[index];
        if (effectHook?.deps.length !== 0) {
          // 判断依赖是否改变执行
          const isChange = effectHook?.deps.some((dep, i) => {
            return oldHooks.deps[i] !== dep;
          });
          if (isChange) {
            effectHook.cleanup = effectHook.callback();
          } else {
            effectHook.cleanup = oldHooks.cleanup;
          }
        } else {
          effectHook.cleanup = oldHooks.cleanup;
        }
      });
    }
    run(fiber.child);
    run(fiber.sibling);
  }

  runCleanup(wipRoot);
  run(wipRoot);
}
```

我们更新了 run 方法,其中如果 isChange 为 false 或者 依赖长度为 0,我们就直接赋值为老的 cleanup 函数,以此解决我们遇到的问题
