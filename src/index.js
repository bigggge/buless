#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const open = require('open');
const compress = require('koa-compress');
const plugins = require("./plugins");
const { loadedPkg, transform2ESM, getEntry } = require("./utils");

const app = new Koa();
const entry = process.argv[2] || 'index.html'

function getImports(content) {
  const ast = parse(content, { sourceType: 'module', });
  const deps = []
  traverse(ast, {
    ImportDeclaration: (path) => {
      const source = path.node.source.value
      if (source[0] !== "/" && source[0] !== ".") {
        deps.push(source)
      }
    },
  });
  return deps
}

async function preloadPkg() {
  let content = fs.readFileSync('./index.js', 'utf-8');
  const deps = getImports(content)
  console.log("预编译模块..." + deps)
  for (let i = 0; i < deps.length; i++) {
    const { entry, pkgPath } = getEntry(deps[i])
    content = await transform2ESM(path.resolve(pkgPath, entry))
    loadedPkg.set(deps[i], content)
  }
  console.log("预编译模块成功")
}

app.use(compress({
  filter(content_type) {
    return /text|application\/javascript/i.test(content_type)
  },
  threshold: 2048,
  gzip: {
    flush: require('zlib').constants.Z_SYNC_FLUSH
  },
  deflate: {
    flush: require('zlib').constants.Z_SYNC_FLUSH,
  },
  br: false
}))

app.use((ctx, next) => {
  const { request: { url } } = ctx;
  console.log("url:", url)
  if (url === '/') {
    let content = fs.readFileSync(entry, 'utf-8');
    content = content.replace(
      `<script`,
      `
      <script>
        window.process = \{env: \{ NODE_ENV : 'development' \} \}
      </script>
      <script`
    );
    ctx.type = 'text/html';
    ctx.body = content;
  }
  return next()
});

plugins.forEach(plugin => {
  console.log("load...", plugin)
  plugin({
    root: process.cwd(),
    app
  })
});

app.listen(9000, async () => {
  await preloadPkg()
  open("http://localhost:9000")
});
