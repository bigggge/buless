import dayjs from "dayjs";
import "./index.css";

const app = document.querySelector("#app");
setInterval(() => {
  app.innerHTML = `
  <h1>Hello buless!</h1>
  <p>${dayjs().format("HH:mm:ss")}</p>
  <a href="https://github.com/bigggge/buless" target="_blank">Github</a>
`;
}, 1000);
