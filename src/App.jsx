import React from "react";
import "./styles.css";

export default function App({ count, updateCount }) {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <button onClick={updateCount}>Counter: {count}</button>
    </div>
  );
}
