module.exports = {
  // Dummy implementation for getReactNativePersistence to prevent the error
  getReactNativePersistence: jest.fn(() => 'mockPersistence'),
  
  // Add stubs for other Firebase Auth functions as needed
  browserSessionPersistence: 'SESSION',
  getAuth: jest.fn(),
  initializeAuth: jest.fn(),
  setPersistence: jest.fn(),
};