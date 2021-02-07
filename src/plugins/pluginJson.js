const fs = require("fs");
const path = require("path");

const json = ({ app, root }) => {
  app.use((ctx, next) => {
    const {
      request: { url },
    } = ctx;
    if (url.endsWith(".json")) {
      console.log("json", url);
      const p = path.resolve(root, url.slice(1));
      console.log(p);
      const json = fs.readFileSync(p, "utf-8");
      const body = `export default ${json}`;
      ctx.type = "application/javascript";
      ctx.body = body;
    }

    return next();
  });
};
module.exports = json;
