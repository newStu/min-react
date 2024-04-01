import React from "./core/React.js";

export default function App() {
  const [isShowOdd, setIsShowOdd] = React.useState(false);
  const [ls, setLs] = React.useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [renderList, setRenderList] = React.useState([]);
  const [bar, setBar] = React.useState("bar");
  const refValue = React.useRef("测试");
  const refTextValue = React.useRef("测试Text");

  const memoInfo = React.useMemo(() => {
    return bar + "memo";
  }, [bar]);

  function handleClickBar() {
    setBar("bar" + bar);
  }

  function handleAddClick() {
    let maxNum = Math.max(...ls);
    [1, 1, 1, 1, 1].forEach((item) => {
      maxNum += item;
      ls.push(maxNum);
    });

    setLs([...ls]);
  }

  function handleClick() {
    setIsShowOdd(!isShowOdd);
  }

  React.useEffect(() => {
    const lists = ls.filter((item) => (isShowOdd ? item % 2 === 1 : true));
    setRenderList(lists);
  }, [isShowOdd, ls]);

  React.useEffect(() => {
    console.log(refValue, refTextValue);
  }, [refTextValue.current]);

  return (
    <div>
      <button onClick={handleClick}>显示奇数</button>
      <button onClick={handleAddClick}>添加5个节点</button>
      <button onClick={handleClickBar}>点击修改Bar</button>
      <button
        onClick={() => {
          refValue.current = "99999";
          refTextValue.current = refTextValue.current + "8888";
        }}
      >
        点击修改Ref
      </button>
      <p>memo: {memoInfo}</p>
      <ul>
        {renderList.map((item) => (
          <li>{item}</li>
        ))}
      </ul>
    </div>
  );
}
