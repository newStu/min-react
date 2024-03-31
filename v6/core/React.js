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
      children: children.map((item) =>
        typeof item === "string" || typeof item === "number"
          ? createTextNode(item)
          : item
      ),
    },
  };
};

let nextWorkOfUnit = null;
let wipRoot = null;
let currentRoot = null;
function render(el, container) {
  nextWorkOfUnit = wipRoot = {
    dom: container,
    props: {
      children: [el],
    },
  };
}

function createDom(type) {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

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

let delimiters = [];
function reconcileChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child;
  // 确定关系 parent sibling child
  let prevChild = null;
  children.forEach((child, index) => {
    let isSameType = oldFiber && child.type === oldFiber.type;
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

      if (oldFiber) {
        delimiters.push(oldFiber);
      }
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0 || !prevChild) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    if (newFiber) {
      prevChild = newFiber;
    }
  });

  if (oldFiber) {
    while (oldFiber) {
      delimiters.push(oldFiber);
      oldFiber = oldFiber.sibling;
    }
  }
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  stateHooks = [];
  stateHookIndex = 0;
  const { type, props } = fiber;
  const children = [type(props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    // 设置fiber的dom
    const ele = (fiber.dom = createDom(fiber.type));
    updateProps(ele, fiber.props, fiber.alternate?.props);
  }
  const children = fiber.props.children;
  reconcileChildren(fiber, children);
}

function performWorkOfUnit(fiber) {
  // 创建元素
  const isFunctionComponent = typeof fiber.type === "function";

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 返回新任务
  // 有子节点就返回子节点
  if (fiber.child) return fiber.child;
  // 如果没有子节点就返回兄弟节点
  if (fiber.sibling) return fiber.sibling;
  // 如果没有兄弟节点就返回父节点的兄弟节点
  let nextFiber = fiber.parent;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}

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
function commitRoot() {
  delimiters.map(commitDeletion);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
  delimiters = [];
}

function commitWork(fiber) {
  if (!fiber) return;
  const fiberParent = findHasDomParent(fiber);

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

requestIdleCallback(workLoop);

let wipFiber = null;
function update() {
  let currentFiber = wipFiber;

  return () => {
    nextWorkOfUnit = wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
  };
}

let stateHookIndex;
let stateHooks;
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

const React = {
  update,
  render,
  createElement,
  useState,
};

export default React;
