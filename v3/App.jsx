import React from "./core/React.js";

function Counter({ num }) {
  return (
    <div>
      测试一下num:{num}
      <div>测试一下3</div>
    </div>
  );
}

function CounterWarper() {
  return (
    <div>
      测试一下2
      <Counter num={9}></Counter>
      <Counter num={19}></Counter>
    </div>
  );
}

export default function App() {
  return (
    <div id="app">
      hello world
      <CounterWarper></CounterWarper>
      特写
      <p>测试一下</p>
    </div>
  );
}
