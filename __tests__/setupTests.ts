// filepath: /c:/Users/willi/codebase/capstone1/SHPEHackerz-Task-Path/__tests__/setupTests.ts
import { Alert } from 'react-native';

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));