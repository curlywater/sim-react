// @jsx Simact.createElement

import Simact, { useState } from "@simact/simact";
import "./styles.css";

export default function App() {
  const [count, setCount] = useState(0);
  console.log(count);
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <button onClick={() => setCount((c) => c + 1)}>Counter: {count}</button>
    </div>
  );
}
