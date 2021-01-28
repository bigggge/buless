const fs = require('fs');
const path = require('path');
const { rewriteImport } = require("../utils");
const babel = require("@babel/core");

const react = ({ app, root }) => {
  app.use(async (ctx, next) => {
    const { request: { url } } = ctx;
    console.log("react", url)
    if (url.endsWith('.jsx')) {
      const time1 = Date.now()
      console.log("-js-" + url + "---")
      const p = path.resolve(root, url.slice(1));
      const file = fs.readFileSync(p, 'utf-8');
      const result = await babel.transform(file, {
        presets: ["@babel/preset-react"],
      });
      ctx.type = 'application/javascript';
      ctx.body = rewriteImport(result.code);
      console.log("-js-" + url + "---" + (Date.now() - time1))
    }
    return next()
  })
}
module.exports = react;
