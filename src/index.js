import App from "./App";
import React from "react";
import { render } from "../stack-reconciler";

const root = document.getElementById("root");

let count = 0;
const updateCount = () => {
  count++;
  renderApp();
};

function renderApp() {
  render(<App count={count} updateCount={updateCount} />, root);
}

renderApp();
