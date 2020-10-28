// @jsx Simact.createElement
import Simact from "@simact/simact";
import SimactDOM from "@simact/simact-dom";

const root = document.getElementById("root");

function render(value) {
  const element = (
    <div>
      <h1>Hello</h1>
      <p>Good Morning.</p>
      <input value={value} onInput={(e) => render(e.target.value)} />
    </div>
  );
  SimactDOM.render(element, root);
}

render("");
