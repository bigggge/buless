const fs = require("fs");
const path = require("path");

const json = ({ app, root }) => {
  app.use((ctx, next) => {
    const {
      request: { url },
    } = ctx;
    if (url.endsWith(".json")) {
      const p = path.resolve(root, url.slice(1));
      const json = fs.readFileSync(p, "utf-8");
      const body = `export default ${json}`;
      ctx.type = "application/javascript";
      ctx.body = body;
    }
    return next();
  });
};
module.exports = json;
