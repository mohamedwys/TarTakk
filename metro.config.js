// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force tslib to use ES6 module on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib' && platform === 'web') {
    return {
      filePath: require.resolve('tslib/tslib.es6.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;