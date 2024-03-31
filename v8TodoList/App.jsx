import React from "./core/React.js";
import "./app.css";
let id = 0;
export default function App() {
  // { text: "学习", done: false }
  const [todos, setTodos] = React.useState([{ text: "学习", done: false, id }]);
  const [renderTodos, setRenderTodos] = React.useState([]);
  const [todo, setTodo] = React.useState("");
  const [checkedRadio, setCheckedRadio] = React.useState("all");

  function handleInputText(event) {
    setTodo(event.target.value);
  }

  function handleChangeStatus(value) {
    setCheckedRadio(value);
  }

  function handleAddTodo() {
    const todoList = todo.split(",");
    const newTodoList = [];
    todoList.forEach((item) => {
      id++;
      const newTodo = { text: item, done: false, id: id };
      newTodoList.push(newTodo);
    });
    setTodos([...todos, ...newTodoList]);
    setTodo("");
  }

  function handleKeywordDown(event) {
    if (event.key === "Enter") {
      handleAddTodo();
    }
  }

  function handleSave() {
    localStorage.setItem("todoList", JSON.stringify(todos));
  }

  function findIndex(id) {
    return todos.findIndex((item) => item.id === id);
  }

  function handleRemove(id) {
    let todoList = todos.filter((item) => item.id !== id);
    setTodos(todoList);
  }

  function handleDone(id) {
    const index = findIndex(id);
    todos[index].done = !todos[index].done;
    setTodos([...todos]);
  }

  React.useEffect(() => {
    const todoList = JSON.parse(localStorage.getItem("todoList") || "[]");
    todoList.forEach(() => {
      id++;
    });
    if (todoList.length > 0) {
      setTodos(todoList);
    }
  }, []);

  React.useEffect(() => {
    const todoList = todos.filter((todo) => {
      if (checkedRadio === "all") return true;
      if (checkedRadio === "done") return todo.done;
      return !todo.done;
    });

    setRenderTodos(todoList);
  }, [checkedRadio, todos]);

  return (
    <div id="app">
      <h1>TODOS</h1>
      <div>
        <input
          value={todo}
          onChange={handleInputText}
          onKeyDown={handleKeywordDown}
        ></input>
        <button onClick={handleAddTodo}>add</button>
      </div>

      <button onClick={handleSave}>save</button>
      <div className="radio-group">
        <div>
          <input
            onChange={() => handleChangeStatus("all")}
            type="radio"
            id="all"
            name="status"
            checked={checkedRadio === "all"}
          ></input>
          <label htmlFor="all">All</label>
        </div>
        <div>
          <input
            onChange={() => handleChangeStatus("done")}
            type="radio"
            id="done"
            name="status"
            checked={checkedRadio === "done"}
          ></input>
          <label htmlFor="done">done</label>
        </div>
        <div>
          <input
            onChange={() => handleChangeStatus("active")}
            type="radio"
            id="active"
            name="status"
            checked={checkedRadio === "active"}
          ></input>
          <label htmlFor="active">active</label>
        </div>
      </div>

      <ul>
        {renderTodos.map((item) => {
          return (
            <li>
              <label className={item.done ? "done" : ""}>{item.text}</label>
              <button onClick={() => handleRemove(item.id)}>remove</button>
              <button onClick={() => handleDone(item.id)}>
                {item.done ? "cancel" : "done"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
