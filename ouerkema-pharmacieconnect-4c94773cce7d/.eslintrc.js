module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  globals: {
    alert: 'readonly',
    __DEV__: 'readonly',
  },
  rules: {
    // Errors
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'],
      },
    ],
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_|^React',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-undef': 'error',
    'no-duplicate-imports': 'error',

    // Code quality
    'prefer-const': 'warn',
    'no-var': 'warn',
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'indent': ['warn', 2],
    'eol-last': ['warn', 'always'],
    'no-trailing-spaces': 'warn',
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],
    'comma-spacing': 'warn',
    'keyword-spacing': 'warn',
    'space-infix-ops': 'warn',
    'space-before-function-paren': ['warn', 'never'],
  },
};
