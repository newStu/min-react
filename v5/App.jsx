import React from "./core/React.js";

let countBar = 0;

function Bar() {
  console.log("bar");
  const update = React.update();
  function handleClick() {
    countBar++;
    update();
  }

  return (
    <div>
      <h1>Bar</h1>
      {countBar}
      <button onClick={handleClick}>Bar点击</button>
    </div>
  );
}

let countFoo = 0;
function Foo() {
  console.log("foo");
  const update = React.update();
  function handleClick() {
    countFoo++;
    update();
  }

  return (
    <div>
      {countFoo}
      {countFoo === 2 && <h1>Foo</h1>}
      <button onClick={handleClick}>Foo点击</button>
    </div>
  );
}
let countApp = 0;
export default function App() {
  console.log("app");
  const update = React.update();
  function handleClick() {
    countApp++;
    update();
  }

  return (
    <div id="app">
      <h1>App</h1>
      {countApp}
      <button onClick={handleClick}>App点击</button>

      <Foo></Foo>
      <Bar></Bar>
    </div>
  );
}
