const pluginConfig = require("./d3fc.plugin.config");

const rules = []; //pluginConfig.module.rules.slice(0);
rules.push({
    test: /\.js$/,
    exclude: /node_modules/,
    loader: "babel-loader"
});

module.exports = Object.assign({}, pluginConfig, {
    entry: "./src/js/plugin/plugin.js",
    mode: "development",
    module: Object.assign({}, pluginConfig.module, {
        rules
    })
});
