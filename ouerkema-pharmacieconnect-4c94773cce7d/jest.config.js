module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/*.config.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/.expo/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-modules-autolinking|expo-modules-core|expo-font|@react-navigation|@react-native-async-storage|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-maps|@react-native-community|i18next|react-i18next)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
