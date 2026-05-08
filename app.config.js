const pkg = require('./package.json');
const appJson = require('./app.json');

const config = appJson.expo;

// Derive an integer versionCode from semver: 2.1.1 → 20101, 2.2.0 → 20200
const [major, minor, patch] = pkg.version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + (patch || 0);

module.exports = {
  expo: {
    ...config,
    version: pkg.version,
    runtimeVersion: pkg.version,
    ios: {
      ...config.ios,
      buildNumber: pkg.version,
    },
    android: {
      ...config.android,
      versionCode,
    },
  },
};
