// import App from "./App";
import React from "react";
import { render } from "../stack-reconciler";

class Heading extends React.Component {
  render() {
    return <h1>Hello</h1>;
  }
}
const App = () => {
  return (
    <div>
      <Heading></Heading>
      <p>World</p>
    </div>
  );
};

const root = document.getElementById("root");
render(<App />, root);
