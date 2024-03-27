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
        typeof item === "string" ? createTextNode(item) : item
      ),
    },
  };
};

let nextWorkOfUnit = null;
const render = (el, container) => {
  nextWorkOfUnit = {
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

function initChildren(fiber) {
  // 确定关系 parent sibling child
  let prevChild = null;
  fiber.props.children.forEach((child, index) => {
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

function performWorkOfUnit(fiber) {
  // 创建元素
  const { type, props, dom } = fiber;
  if (!dom) {
    // 设置fiber的dom
    const ele = (fiber.dom = createDom(type));
    updateProps(ele, props);
    // 添加到dom树中
    fiber.parent.dom.append(ele);
  }

  initChildren(fiber);

  // 返回新任务
  // 有子节点就返回子节点
  if (fiber.child) return fiber.child;
  // 如果没有子节点就返回兄弟节点
  if (fiber.sibling) return fiber.sibling;
  // 如果没有兄弟节点就返回父节点的子节点
  return fiber.parent?.sibling;
}

function workLoop(deadline) {
  // 是否进行让步
  let shouldYield = false;

  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);

    shouldYield = deadline.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

const React = {
  render,
  createElement,
};

export default React;
