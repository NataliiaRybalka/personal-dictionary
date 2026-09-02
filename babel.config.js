module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Must stay last: injects __initData into worklets (react-native-reanimated 4 / worklets 0.12).
    'react-native-worklets/plugin',
  ],
};
