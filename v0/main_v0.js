// 使用普通dom 操作方式显示app（写死）

// 获取根节点
const root = document.getElementById("root");
// 创建div
const ele = document.createElement("div");
ele.id = "app";
// 将div放到根节点中
root?.appendChild(ele);

// 创建文本节点
const textElement = document.createTextNode("");
// 为文本节点赋值
textElement.nodeValue = "Hello World";

// div添加文本节点
ele.appendChild(textElement);
