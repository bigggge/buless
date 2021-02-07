const fs = require("fs");
const path = require("path");

const css = ({ app, root }) => {
  app.use((ctx, next) => {
    const {
      request: { url },
    } = ctx;
    if (url.endsWith(".css")) {
      const p = path.resolve(root, url.slice(1));
      const file = fs.readFileSync(p, "utf-8");
      const content = `
      const css = '${file.replace(/\n/g, "")}'
      let style = document.createElement('style');
      document.head.appendChild(style);
      style.innerHTML = css;
      export default css;
    `;
      ctx.type = "application/javascript";
      ctx.body = content;
    }
    return next();
  });
};
module.exports = css;
