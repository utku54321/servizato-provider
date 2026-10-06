// Adds the CI build number to app.json, so every GitHub build is a newer version
// (phones install it as an update). Locally it stays build 1.
module.exports = ({ config }) => {
  const build = Number(process.env.BUILD_NUMBER || 1);
  return {
    ...config,
    version: `1.0.${build}`,
    android: { ...config.android, versionCode: build },
    ios: { ...config.ios, buildNumber: String(build) },
  };
};
