const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Monorepo: watch root node_modules for hoisted deps
config.watchFolders = [monorepoRoot];

// Monorepo: resolve packages from both local and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Transformer
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
    },
  },
};

// Resolver
config.resolver = {
  ...config.resolver,
  sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs', 'mjs'],
  blockList: [
    /\.git\/.*/,
    /android\/.*\/build\/.*/,
    /\.expo\/.*/,
  ],
  unstable_enablePackageExports: true,
};

module.exports = config;
