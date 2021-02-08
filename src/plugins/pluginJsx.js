const fs = require("fs");
const path = require("path");
const { rewriteImport } = require("../utils");
const babel = require("@babel/core");

const jsx = ({ app, root }) => {
  app.use(async (ctx, next) => {
    const {
      request: { url },
    } = ctx;
    if (url.endsWith(".jsx")) {
      const p = path.resolve(root, url.slice(1));
      const file = fs.readFileSync(p, "utf-8");
      const result = await babel.transform(file, {
        presets: ["@babel/preset-react"],
      });
      ctx.type = "application/javascript";
      ctx.body = rewriteImport(result.code);
    }
    return next();
  });
};
module.exports = jsx;
