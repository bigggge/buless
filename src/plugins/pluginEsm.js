const fs = require("fs");
const path = require("path");
const {
  loadedCode,
  transform2ESM,
  getEntry,
  rewriteImport,
} = require("../utils");

const esm = ({ app, root }) => {
  app.use(async (ctx, next) => {
    const {
      request: { url },
    } = ctx;
    if (url.startsWith("/@modules/")) {
      const time1 = Date.now();
      let pkgName = url.replace("/@modules/", "");
      const { packageJson, entry, pkgPath, esm } = getEntry(pkgName);
      const esmEnable = !!packageJson.module && esm;
      let content;
      // 支持 esm
      if (esmEnable) {
        console.log("[buless] esm supported", url);
        content = fs.readFileSync(
          path.resolve(pkgPath, packageJson.module),
          "utf-8"
        );
        content = rewriteImport(content);
      } else {
        if (loadedCode.has(pkgName)) {
          console.log("[buless] package cached", pkgName);
          content = loadedCode.get(pkgName);
        } else {
          // 不支持 esm, 就用 rollup 转成 esm
          content = await transform2ESM(path.resolve(pkgPath, entry));
          content = rewriteImport(content);
        }
      }
      loadedCode.set(pkgName, content);
      ctx.type = "application/javascript";
      ctx.body = content;
    } else if (url.endsWith(".js")) {
      const time1 = Date.now();
      const p = path.resolve(root, url.slice(1));
      const file = fs.readFileSync(p, "utf-8");
      ctx.type = "application/javascript";
      ctx.body = rewriteImport(file);
    }
    return next();
  });
};

module.exports = esm;
