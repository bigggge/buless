const path = require("path");
const { rollup } = require("rollup");
const commonjs = require("@rollup/plugin-commonjs");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

const loadedPkg = new Map();

async function transform2ESM(input) {
  console.log("transform2ESM", input);
  const bundle = await rollup({
    input,
    plugins: [commonjs({ sourceMap: false })],
  });
  const {
    output: [{ code }],
  } = await bundle.generate({
    exports: "auto",
    format: "es",
  });
  return code;
}

function getEntry(pkgName) {
  let _path = "";

  if (pkgName[0] !== "@") {
    const _ = pkgName.split("/");
    pkgName = _[0];
    _path = _[1] || "";
  }
  const pkgPath = path.resolve(__dirname, "../node_modules", pkgName);
  const packageJson = require(pkgPath + "/package.json");
  return {
    entry: _path ? _path + ".js" : packageJson.main || "index.js",
    packageJson,
    pkgPath,
  };
}

function rewriteImport(content) {
  const time1 = Date.now();
  console.log("-rewriteImport 0-");
  const ast = parse(content, { sourceType: "module" });
  console.log("-rewriteImport 1-" + (Date.now() - time1));
  traverse(ast, {
    ImportDeclaration: (path) => {
      const source = path.node.source.value;
      if (
        source[0] !== "/" &&
        source[0] !== "." &&
        source.indexOf("http") !== 0
      ) {
        path.node.source.value = "/@modules/" + source;
      }
    },
    ExportAllDeclaration: (path) => {
      const source = path.node.source.value;
      if (
        source[0] !== "/" &&
        source[0] !== "." &&
        source.indexOf("http") !== 0
      ) {
        path.node.source.value = "/@modules/" + source;
      }
    },
    ExportNamedDeclaration: (path) => {
      if (path.node.source) {
        const source = path.node.source.value;
        if (
          source[0] !== "/" &&
          source[0] !== "." &&
          source.indexOf("http") !== 0
        ) {
          path.node.source.value = "/@modules/" + source;
        }
      }
    },
  });
  console.log("-rewriteImport 2-" + (Date.now() - time1));
  const { code } = generate(ast, {
    /* options */
  });
  console.log("-rewriteImport 3-" + (Date.now() - time1));
  return code;
}

module.exports = {
  loadedPkg,
  transform2ESM,
  getEntry,
  rewriteImport,
};
