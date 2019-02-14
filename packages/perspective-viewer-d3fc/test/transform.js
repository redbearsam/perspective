const c = require("../babel.config.js");

const defaultCwd = process.cwd();
const transformer = require("babel-jest").createTransformer(c);

// Monkey patch around https://github.com/facebook/jest/issues/7868
const oldGetCacheKey = transformer.getCacheKey;
transformer.getCacheKey = (fileData, filename, configString, {config, instrument, rootDir}) =>
    oldGetCacheKey(fileData, filename, configString, {
        config: config || {cwd: defaultCwd},
        instrument,
        rootDir
    });

module.exports = transformer;
