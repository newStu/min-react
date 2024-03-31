import React from "./core/React.js";

export default function App() {
  const [count, setCount] = React.useState(10);
  const [bar, setBar] = React.useState("bar");
  function handleClick() {
    setCount((c) => {
      return ++c;
    });

    setBar(bar + "barbar");
    setBar(bar + "barbar");
    setBar(bar + "barbar");
    setBar(bar + "barbar");
    setBar(bar + "barbar");
    setBar(bar + "barbar");
  }

  return (
    <div id="app">
      <h1>App</h1>
      {count}
      <p>{bar}</p>
      <button onClick={handleClick}>点击</button>
    </div>
  );
}
