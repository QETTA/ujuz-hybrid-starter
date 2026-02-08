module.exports = function(api) {
  api.cache(true);

  const plugins = [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
        blocklist: null,
        allowlist: null,
        verbose: false,
      },
    ],
  ];

  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
  }

  // Reanimated MUST be last plugin
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
