#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const open = require('open');
const compress = require('koa-compress');

const app = new Koa();

const root = process.cwd()
console.log(process.argv)
const entry = process.argv[2] || 'index.html'

const loadedPkg = new Map();

function rewriteImport(content) {
  const ast = parse(content, { sourceType: 'module', });
  traverse(ast, {
    ImportDeclaration: (path) => {
      const source = path.node.source.value
      if (source[0] !== "/" && source[0] !== ".") {
        path.node.source.value = "/@modules/" + source;
      }
    },
  });
  const { code } = generate(ast, { /* options */ });
  return code
}

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

async function transform2ESM(input) {
  console.log("transform2ESM", input)
  const bundle = await rollup({
    input,
    plugins: [commonjs({ sourceMap: false })]
  });
  const { output: [{ code }] } = await bundle.generate({
    exports: 'auto',
    format: 'es'
  });
  return code
}

function getEntry(pkgName) {
  let _path = ""

  if (pkgName[0] !== "@") {
    const _ = pkgName.split("/")
    pkgName = _[0]
    _path = _[1] || ""
  }
  const pkgPath = path.resolve(__dirname, 'node_modules', pkgName);
  const packageJson = require(pkgPath + '/package.json')
  return { entry: _path ? _path + ".js" : packageJson.main || "index.js", packageJson, pkgPath };
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
  br: false // disable brotli
}))

app.use(async (ctx) => {
  const { request: { url } } = ctx;
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
  } else if (url.endsWith('.js')) {
    const time1 = Date.now()
    console.log("-js-" + url + "---")
    const p = path.resolve(root, url.slice(1));
    const file = fs.readFileSync(p, 'utf-8');
    ctx.type = 'application/javascript';
    ctx.body = rewriteImport(file);
    console.log("-js-" + url + "---" + (Date.now() - time1))
  } else if (url.startsWith('/@modules/')) {
    const time1 = Date.now()
    console.log("-modules 0-" + url + "---")
    let pkgName = url.replace('/@modules/', '')
    const { packageJson, entry, pkgPath } = getEntry(pkgName)
    const esmEnable = !!packageJson.module
    let content;
    console.log("-modules 1-" + url + "---" + (Date.now() - time1))
    // 支持 esm
    if (esmEnable) {
      content = fs.readFileSync(path.resolve(pkgPath, packageJson.module), 'utf-8');
    } else {
      console.log("esm not supported")
      if (loadedPkg.has(pkgName)) {
        content = loadedPkg.get(pkgName)
      } else {
        // 不支持 esm, 就用 rollup 转成 esm
        content = await transform2ESM(path.resolve(pkgPath, entry))
        loadedPkg.set(pkgName, content)
      }
    }
    console.log("-modules 2-" + url + "---" + (Date.now() - time1))
    ctx.type = 'application/javascript';
    ctx.body = rewriteImport(content);
    console.log("-modules end-" + url + "---" + (Date.now() - time1))
  } else if (url.endsWith('.css')) {
    const p = path.resolve(root, url.slice(1));
    const file = fs.readFileSync(p, 'utf-8');
    const content = `
      const css = '${file.replace(/\n/g, '')}'
      let style = document.createElement('style');
      document.head.appendChild(style);
      style.innerHTML = css;
      export default css;
    `;
    ctx.type = 'application/javascript';
    ctx.body = content;
  } else {
    ctx.body = 'body';
  }
});

app.listen(9000, async () => {
  await preloadPkg()
  open("http://localhost:9000")
});
