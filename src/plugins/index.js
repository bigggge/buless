const pluginCss = require('./pluginCss');
const pluginEsm = require('./pluginEsm');
const pluginJsx = require('./pluginJsx');

const plugins = [
  pluginCss,
  pluginEsm,
  pluginJsx
]

module.exports = plugins;
