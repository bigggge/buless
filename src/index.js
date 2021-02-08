#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const open = require("open");
const plugins = require("./plugins");
const { loadedCode } = require("./utils");
const { transform2ESM, getEntry, gzip, rewriteImport } = require("./utils");

const app = new Koa();
const entry = process.argv[2] || "index.html";

function getImports(content) {
  const ast = parse(content, { sourceType: "module" });
  const deps = [];
  traverse(ast, {
    ImportDeclaration: (path) => {
      const source = path.node.source.value;
      if (source[0] !== "/" && source[0] !== ".") {
        deps.push(source);
      }
    },
  });
  return deps;
}

async function preloadPkg() {
  const entryJs = fs.readFileSync("./index.js", "utf-8");
  let content, code;
  const deps = getImports(entryJs);
  console.log("[buless] preloading..." + deps);
  for (let i = 0; i < deps.length; i++) {
    const { entry, pkgPath } = getEntry(deps[i]);
    content = await transform2ESM(path.resolve(pkgPath, entry));
    code = await rewriteImport(content);
    loadedCode.set(deps[i], code);
  }
  console.log("[buless] preload success");
}

app.use(gzip);

app.use((ctx, next) => {
  const {
    request: { url },
  } = ctx;
  console.log("[buless] url:", url);
  if (url === "/") {
    let content = fs.readFileSync(entry, "utf-8");
    // noinspection JSValidateTypes
    content = content.replace(
      `<script`,
      `
      <script>
        window.process = \{env: \{ NODE_ENV : 'development' \} \}
      </script>
      <script`
    );
    ctx.type = "text/html";
    ctx.body = content;
  }
  return next();
});

function loadPlugins() {
  plugins.forEach((plugin) => {
    console.log("[buless] loading plugin:", plugin.name, "...");
    plugin({
      root: process.cwd(),
      app,
    });
  });
}

console.log("--- [buless] ---");
// 加载插件
loadPlugins();
// 启动服务
app.listen(9000, async () => {
  try {
    await preloadPkg();
    open("http://localhost:9000");
  } catch (e) {
    console.log("--- [error] ---");
    console.log("启动失败", e.message);
    console.log("--- [buless error] ---");
  }
});
