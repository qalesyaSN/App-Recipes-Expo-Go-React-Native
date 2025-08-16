module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ...plugin lain
      'react-native-reanimated/plugin', // Pastikan ini ada
    ],
  };
};
