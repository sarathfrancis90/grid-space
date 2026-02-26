import React from "react";
import ReactDOM from "react-dom/client";
import { enableMapSet } from "immer";
import { App } from "./App";

enableMapSet();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
