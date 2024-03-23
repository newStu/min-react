// 利用虚拟Dom的形式显示

const TextElement = {
  type: "TEXT_ELEMENT",
  props: {
    nodeValue: "Hello World",
  },
  children: [],
};

const dom = {
  type: "div",
  props: {
    id: "app",
  },
  children: [TextElement],
};

// 获取根节点
const root = document.getElementById("root");
// 创建div
const ele = document.createElement(dom.type);
ele.id = dom.props.id;
// 将div放到根节点中
root?.appendChild(ele);

// 创建文本节点
const textElement = document.createTextNode("");
// 为文本节点赋值
textElement.nodeValue = TextElement.props.nodeValue;

// div添加文本节点
ele.appendChild(textElement);
