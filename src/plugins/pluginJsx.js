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
      console.log("jsx", url);
      const time1 = Date.now();
      console.log("-jsx-" + url + "---");
      const p = path.resolve(root, url.slice(1));
      const file = fs.readFileSync(p, "utf-8");
      const result = await babel.transform(file, {
        presets: ["@babel/preset-react"],
      });
      ctx.type = "application/javascript";
      ctx.body = rewriteImport(result.code);
      console.log("-jsx-" + url + "---" + (Date.now() - time1));
    }
    return next();
  });
};
module.exports = jsx;
