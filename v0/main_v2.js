const createTextNode = (nodeValue) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue,
    },
    children: [],
  };
};

const createElement = (type, props, ...children) => {
  return {
    type: type,
    props: props,
    children: children.map((item) =>
      typeof item === "string" ? createTextNode(item) : item
    ),
  };
};

const textNode = createTextNode("hello world");
const App = createElement("div", { id: "app" }, textNode);

// 获取根节点
const root = document.getElementById("root");
// 创建div
const ele = document.createElement(App.type);
ele.id = App.props.id;
// 将div放到根节点中
root?.appendChild(ele);

// 创建文本节点
const textElement = document.createTextNode("");
// 为文本节点赋值
textElement.nodeValue = textNode.props.nodeValue;

// div添加文本节点
ele.appendChild(textElement);
