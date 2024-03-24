let taskId = 0;

function workLoop(deadline) {
  taskId++;
  // 是否进行让步
  let shouldYield = false;

  while (!shouldYield) {
    console.log("进行事件", taskId);
    shouldYield = deadline.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
