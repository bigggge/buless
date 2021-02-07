const fs = require("fs");
const path = require("path");
const {
  loadedPkg,
  transform2ESM,
  getEntry,
  rewriteImport,
} = require("../utils");

const esm = ({ app, root }) => {
  app.use(async (ctx, next) => {
    const {
      request: { url },
    } = ctx;
    if (url.endsWith(".js")) {
      const time1 = Date.now();
      console.log("-js-" + url + "---");
      const p = path.resolve(root, url.slice(1));
      const file = fs.readFileSync(p, "utf-8");
      ctx.type = "application/javascript";
      ctx.body = rewriteImport(file);
      console.log("-js-" + url + "---" + (Date.now() - time1));
    } else if (url.startsWith("/@modules/")) {
      const time1 = Date.now();
      console.log("-modules 0-" + url + "---");
      let pkgName = url.replace("/@modules/", "");
      const { packageJson, entry, pkgPath } = getEntry(pkgName);
      const esmEnable = !!packageJson.module;
      let content;
      console.log("-modules 1-" + url + "---" + (Date.now() - time1));
      // 支持 esm
      if (esmEnable) {
        console.log("esm supported", url);
        content = fs.readFileSync(
          path.resolve(pkgPath, packageJson.module),
          "utf-8"
        );
      } else {
        console.log("esm not supported");
        if (loadedPkg.has(pkgName)) {
          content = loadedPkg.get(pkgName);
        } else {
          // 不支持 esm, 就用 rollup 转成 esm
          content = await transform2ESM(path.resolve(pkgPath, entry));
          loadedPkg.set(pkgName, content);
        }
      }
      console.log("-modules 2-" + url + "---" + (Date.now() - time1));
      ctx.type = "application/javascript";
      ctx.body = rewriteImport(content);
      console.log("-modules end-" + url + "---" + (Date.now() - time1));
    }
    return next();
  });
};

module.exports = esm;
