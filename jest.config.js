module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: [
      '@testing-library/jest-native/extend-expect',
      './__tests__/setupTests.ts'
    ],
    transform: {
      '^.+\\.[tj]sx?$': 'babel-jest',
    },
    // Map all firebase auth related imports to the firebaseAuth.js mock
    moduleNameMapper: {
      '^@firebase/auth(?:/.*)?$': '<rootDir>/__mocks__/firebaseAuth.js'
    },
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo-modules-core|@react-native/js-polyfills)/'
    ],
  };