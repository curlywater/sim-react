// import App from "./App";
import React from "react";
import { mount } from "../stack-reconciler";

const App = () => {
  return (
    <div>
      <h1>Hello</h1>
      <p>World</p>
    </div>
  );
};

const root = document.getElementById("root");
root.appendChild(mount(<App />));
