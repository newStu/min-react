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

const React = {
  render,
  createElement,
};

export default React;
