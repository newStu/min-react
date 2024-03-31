import React from "./React.js";

const ReactDOM = {
  createRoot: (container) => ({
    render: (App) => React.render(App, container),
  }),
};

export default ReactDOM;
