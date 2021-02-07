import React from "react";
import ReactDOM from "react-dom";
import data from "./data.json";
import "./index.css";

class Hello extends React.Component {
  render() {
    return (
      <div>
        <img src="./logo.svg" width={50} alt="logo" />
        <div>Hello {this.props.toWhat}</div>
        <div>Hello {data.msg}</div>
      </div>
    );
  }
}

ReactDOM.render(<Hello toWhat={"JSX"} />, document.getElementById("root-jsx"));
