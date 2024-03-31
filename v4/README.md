# 添加事件

根据以往经验,我们为按钮绑定事件后,看看 jsx 为我们解析成什么,然后我根据解析的内容进行对应实现

**添加事件**

```jsx
import React from "./core/React.js";

function Counter() {
  function handleClick() {
    console.log("click");
  }
  return (
    <div>
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

这里我们简化了一下组件,方便我们进行测试,我们为 button 按钮添加了一个`handleClick`方法,方法内部只有一个输出,接下来我们看看这个方法会被解析成什么内容

```json
{
  "type": "div",
  "props": {
    "children": [
      {
        "type": "button",
        "props": {
          "onClick": "ƒ handleClick() 函数",
          "children": [
            {
              "type": "TEXT_ELEMENT",
              "props": {
                "nodeValue": "点击",
                "children": []
              }
            }
          ]
        }
      }
    ]
  }
}
```

> 注意:我这里使用的是字符串表示,所以`onClick`属性其实是一个函数

通过上面我们可以看到其实事件也是被解析到 props 属性中

## 实现

既然是属性,我们就可以在`updateProps`的时候进行注册事件,我们需要判断属性是否为` on 开头`,然后`去掉 on` 后进行小写的,就是我们需要注册的事件了
`onClick  =>  on开头  => 去掉on并小写 => click`

```js
function updateProps(dom, props) {
  // 设置props
  Object.keys(props).forEach((key) => {
    if (key !== "children") {
      if (key.startsWith("on")) {
        const event = key.slice(2).toLocaleLowerCase();

        dom.addEventListener(event, props[key]);
      } else {
        dom[key] = props[key];
      }
    }
  });
}
```

到此,我们绑定事件就完成了,接下来我们实现更新节点的能力

# 实现更新

为了性能,我们必定不能进行全量替换更新,所以我们设计 diff,要实现 diff 更新,就意味着我们需要拿到老的虚拟 dom,然后和最新的虚拟 dom 进行对比,然后进行更新.

- 新的虚拟 dom 怎么来呢?
  - 新的虚拟 dom 我们还是可以通过 render 函数生成
- 老的虚拟 dom 和新的虚拟 dom 怎么对应上呢?
  - 对比的时候,循环查找到对应的老虚拟 dom 【劣：一个节点循环查找一次，性能太差】
  - 在构建新的虚拟 dom 节点关系【`parent` `sibling` `child`】的时候,将老的虚拟 dom 节点放入其中 【优】
- 什么时候更新节点呢？
  - 我们有一个统一挂载节点的过程，我们可以在这个时候进行对比更新
- 怎么 diff props?
  - 新有, 旧有: 更新
  - 新有, 旧无: 添加
  - 新无, 旧有: 删除

## 生成新的虚拟 dom

```js
let nextWorkOfUnit = null;
let root = null;
function render(el, container) {
  root = nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el],
    },
  };
}
```

我们可以看到`render`函数实际是有两个参数的

- 一个是根元素: el
- 一个是根容器: container
  但是我们更新的话，是没有必要传入这两个内容的，因为这两个内容在后续的操作中并不会改变，所以我们可以将其记录下来，后面直接使用。因此我们添加一个`update`方法作为更新使用

```js
let currentRoot = null;

function commitRoot() {
  commitWork(root.child);
  currentRoot = root;
  root = null;
}

function update() {
  root = nextWorkOfUnit = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot,
  };
}
```

- 我们新添加了一个全局变量`currentRoot`，用于记录上一次渲染的根节点。【`root`变量是要作为统一提交的标记的，所以不能复用】
- 我们在 commitRoot 中对其先赋值，然后在将 root 清空，为什么在这里进行赋值，而不是一开始【`render`】赋值是因为我们需要将其作为旧的虚拟 dom 传入后续的 diff 中
- 为其添加`alternate`属性，记录对应的虚拟 dom 节点

> 注意：
>
> - 这里还是需要将其赋值给 root 的，不然没有办法开始`commitRoot`操作
> - 这里也需要将 `nextWorkOfUnit` 进行赋值，不然没有办法进行更新操作【`workLoop` 中，只有当 `nextWorkOfUnit` 有内容的时候才会进行更新操作】

## 新老虚拟 dom 对应

新的虚拟 dom 也会进行关系的链接【`parent` `sibling` `child`】,这个时候我们进行新老虚拟 dom 关系绑定

```js
function initChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child;
  let prevChild = null;
  children.forEach((child, index) => {
    let isSameType = child.type === oldFiber?.type;
    let newFiber;
    if (isSameType) {
      newFiber = {
        type: child.type,
        props: child.props,
        dom: oldFiber.dom,
        parent: fiber,
        child: null,
        sibling: null,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    } else {
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

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}
```

- 该方法本来就是为了对孩子节点进行遍历，所以我们将`oldFiber` 设置为 `fiber.alternate?.child`
- 为 Fiber 添加了一个`effectTag`属性，用来标记当前节点的更新类型
- 判断 type 是否相同，如果相同，则复用老的节点，并且给其标记为`UPDATE`,表示为修改操作。并将`alternate`设置为`oldFiber`
- 如果不相同，则创建新的节点，并且标记为`PLACEMENT`，表示为添加操作。
- 后面我们还得将`oldFiber的指针`移动到兄弟节点上【`sibling`】, 因为如果有多个子元素，就是`child`的兄弟节点

```js
树 = [1, 2, 3, 4, 5];
链表 = {
  child: {
    value: 1,
    sibling: {
      value: 2,
      sibling: {
        value: 3,
        sibling: {
          value: 4,
          sibling: {
            value: 5,
          },
        },
      },
    },
  },
};
```

## 更新 props

我们对每一个 Fiber 都是有一个标记`effectTag`，表示需要做什么，我们在`commitWork`的时候只需要对该标记进行判断，然后执行对应的操作。

```js
function updateProps(dom, props, oldProps = {}) {
  // 新没,旧有: 删除属性
  Object.keys(oldProps).forEach((key) => {
    if (key !== "children") {
      if (!(key in props)) {
        dom.removeAttribute(key);
      }
    }
  });

  // 新有,旧没: 添加属性
  // 新有,旧有: 更新属性
  Object.keys(props).forEach((key) => {
    if (key !== "children") {
      const value = props[key];
      const oldValue = oldProps[key];
      if (value !== oldValue) {
        if (key.startsWith("on")) {
          const event = key.slice(2).toLocaleLowerCase();

          dom.removeEventListener(event, oldValue);

          dom.addEventListener(event, value);
        } else {
          dom[key] = value;
        }
      }
    }
  });
}

function commitWork(fiber) {
  if (!fiber) return;
  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }

  if (fiber.effectTag === "UPDATE") {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props);
  } else if (fiber.effectTag === "PLACEMENT") {
    if (fiber.dom) {
      fiberParent.dom?.append(fiber.dom);
    }
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```

修改了两个方法，一个是`commitWork`，一个是`updateProps`

- `commitWork`方法中，我们先判断`fiber.effectTag`是否为`UPDATE`，如果是，则调用`updateProps`方法更新 dom 元素的属性,如果是`PLACEMENT`,我们就执行插入操作
- 然后在`updateProps`方法中
  - 我们先循环旧的 props，如果有新有旧没有，就可以直接设置
  - 然后循环我们新的 props, 如果旧的不等于新的【新有，旧无 | 新有,旧有】，那就没更新属性。如果是事件的话，需要先解绑事件，后面再绑定事件，因为我们的是函数组件，每次调用都会产生新的函数，所以每次都会进入这里

## 重构

单个 root 不能体现其职责所在，所以我们需要更换一个更符合他的名称
root => wipRoot => work in progress

我们的 initChildren 方法也从一开始的初始化功能有所拓展，所以也需要更改名称为 reconcileChildren
initChildren => reconcileChildren

改名作为重构看似乎不重要，实则一个好的名称，可以让代码可读性大幅度提升
