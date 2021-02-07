const pluginCss = require("./pluginCss");
const pluginEsm = require("./pluginEsm");
const pluginJsx = require("./pluginJsx");
const pluginImage = require("./pluginImg");
const pluginJson = require("./pluginJson");

const plugins = [pluginCss, pluginEsm, pluginJsx, pluginImage, pluginJson];

module.exports = plugins;
