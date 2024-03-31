import React from "./core/React.js";

export default function App() {
  const [isShowOdd, setIsShowOdd] = React.useState(false);
  const [ls, setLs] = React.useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [renderList, setRenderList] = React.useState([]);
  const [bar, setBar] = React.useState("bar");

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

  return (
    <div>
      <button onClick={handleClick}>显示奇数</button>
      <button onClick={handleAddClick}>添加5个节点</button>
      <button onClick={handleClickBar}>点击修改Bar</button>

      <ul>
        {renderList.map((item) => (
          <li>{item}</li>
        ))}
      </ul>
    </div>
  );
}
