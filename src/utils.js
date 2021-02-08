const path = require("path");
const { rollup } = require("rollup");
const commonjs = require("@rollup/plugin-commonjs");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const compress = require("koa-compress");

const loadedCode = new Map();

async function transform2ESM(input) {
  console.log("[buless] transform2ESM", input);
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
    const [_p, ...paths] = pkgName.split("/");
    pkgName = _p;
    _path = paths.join("/") || "";
  }
  const pkgPath = path.resolve(__dirname, "../node_modules", pkgName);
  const packageJson = require(pkgPath + "/package.json");
  return {
    entry: _path
      ? _path.endsWith(".js")
        ? _path
        : _path + ".js"
      : packageJson.main || "index.js",
    packageJson,
    pkgPath,
    esm: !_path,
  };
}

function astHandler(path) {
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
}

function rewriteImport(content) {
  const ast = parse(content, { sourceType: "module" });
  traverse(ast, {
    ImportDeclaration: astHandler,
    ExportAllDeclaration: astHandler,
    ExportNamedDeclaration: astHandler,
  });
  const { code } = generate(ast, {
    /* options */
  });
  return code;
}

const gzip = compress({
  filter(content_type) {
    return /text|application\/javascript/i.test(content_type);
  },
  threshold: 2048,
  gzip: {
    flush: require("zlib").constants.Z_SYNC_FLUSH,
  },
  deflate: {
    flush: require("zlib").constants.Z_SYNC_FLUSH,
  },
  br: false,
});

module.exports = {
  loadedCode,
  transform2ESM,
  getEntry,
  rewriteImport,
  gzip,
};
