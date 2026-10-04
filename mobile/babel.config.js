module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo inclut déjà le plugin des worklets (Reanimated 4)
    presets: ['babel-preset-expo'],
  };
};
