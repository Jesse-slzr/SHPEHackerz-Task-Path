module.exports = {
    preset: 'react-native',
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation)',
    ],
    preset: 'react-native',
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', './__tests__/setupTests.ts'],
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation)',
    ],
  };