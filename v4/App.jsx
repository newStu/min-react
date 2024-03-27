import React from "./core/React.js";

let count = 0;
let props = { id: "test" };
function Counter() {
  function handleClick() {
    count++;
    props = {};
    React.update();
    console.log("click");
  }

  return (
    <div {...props}>
      <div id={count + "-1"}>测试一下: {count}</div>
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
