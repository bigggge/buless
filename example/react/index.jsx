import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

class Hello extends React.Component {
  render() {
    return (
      <div>
        <img src="./logo.svg" width={50} />
        <div>Hello {this.props.toWhat}</div>
      </div>
    );
  }
}

ReactDOM.render(<Hello toWhat={"JSX"} />, document.getElementById("root-jsx"));
