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
let root = null;
const render = (el, container) => {
  root = nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el],
    },
  };
};

function createDom(type) {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

function updateProps(dom, props) {
  // 设置props
  Object.keys(props).forEach((key) => {
    if (key !== "children") {
      dom[key] = props[key];
    }
  });
}

function initChildren(fiber, children) {
  // 确定关系 parent sibling child
  let prevChild = null;
  children.forEach((child, index) => {
    const newFiber = {
      type: child.type,
      props: child.props,
      dom: null,
      parent: fiber,
      child: null,
      sibling: null,
    };

    if (index === 0) fiber.child = newFiber;
    else prevChild.sibling = newFiber;

    prevChild = newFiber;
  });
}

function updateFunctionComponent(fiber) {
  const { type, props } = fiber;
  const children = [type(props)];
  initChildren(fiber, children);
}

function updateHostComponent(fiber) {
  const { type, props, dom } = fiber;
  if (!dom) {
    // 设置fiber的dom
    const ele = (fiber.dom = createDom(type));
    updateProps(ele, props);
  }
  const children = props.children;
  initChildren(fiber, children);
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
function commitRoot() {
  commitWork(root.child);
  root = null;
}

function commitWork(fiber) {
  if (!fiber) return;
  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }
  if (fiber.dom) {
    fiberParent.dom?.append(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function workLoop(deadline) {
  // 是否进行让步
  let shouldYield = false;

  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 渲染完成了,统一提交到root节点上
  if (!nextWorkOfUnit && root) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

const React = {
  render,
  createElement,
};

export default React;
