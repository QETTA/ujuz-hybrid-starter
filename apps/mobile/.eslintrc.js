/**
 * UJUz Mobile ESLint Configuration
 *
 * Includes React Native accessibility rules
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['@typescript-eslint', 'react-native-a11y'],
  rules: {
    // Accessibility Rules
    'react-native-a11y/has-accessibility-hint': 'warn',
    'react-native-a11y/has-accessibility-props': 'warn',
    'react-native-a11y/has-valid-accessibility-actions': 'error',
    'react-native-a11y/has-valid-accessibility-role': 'error',
    'react-native-a11y/has-valid-accessibility-state': 'error',
    'react-native-a11y/has-valid-accessibility-states': 'error',
    'react-native-a11y/has-valid-accessibility-value': 'error',
    'react-native-a11y/has-valid-important-for-accessibility': 'error',
    'react-native-a11y/no-nested-touchables': 'warn',
    'import/no-unresolved': 'off',

    // General React Rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Compiler rules (downgrade to warn until codebase is fully compliant)
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/refs': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/purity': 'warn',
    'react-hooks/use-memo': 'warn',
    'react-hooks/globals': 'warn',

    // TypeScript Rules
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
  },
  settings: {
    'react-native-a11y': {
      touchables: [
        'TouchableOpacity',
        'TouchableHighlight',
        'TouchableWithoutFeedback',
        'Pressable',
        'PressableScale',
      ],
    },
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'android/',
    'ios/',
    'scripts/',
    '*.config.js',
  ],
};
