// Mock Firebase Auth
jest.mock('@firebase/auth/dist/rn/index.js'); // This maps to __mocks__/firebaseAuth.js

// NEW: Mock AsyncStorage using the official Jest mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import KidsManagementScreen from '../app/screens/dashboardScreens/KidsManagementScreen';
import { Alert } from 'react-native';

describe('KidsManagementScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<KidsManagementScreen />);
    expect(getByText('Manage Kids')).toBeTruthy();
  });

  it('displays an alert when trying to add more than 10 kids', async () => {
    const { getByText, getByPlaceholderText } = render(<KidsManagementScreen />);
    
    // Simulate adding 10 kids
    for (let i = 0; i < 10; i++) {
      fireEvent.changeText(getByPlaceholderText("Kid Name"), `Kid ${i + 1}`);
      fireEvent.changeText(getByPlaceholderText("Age"), '10');
      fireEvent.press(getByText('Add Kid'));
    }

    // Try to add the 11th kid
    fireEvent.changeText(getByPlaceholderText("Kid Name"), 'Kid 11');
    fireEvent.changeText(getByPlaceholderText("Age"), '10');
    fireEvent.press(getByText('Add Kid'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Sorry!", "The maximum number of children allowed is 10!");
    });
  });

  it('displays an alert when trying to add a kid with age greater than 100', async () => {
    const { getByText, getByPlaceholderText } = render(<KidsManagementScreen />);
    
    fireEvent.changeText(getByPlaceholderText("Kid Name"), 'Kid 1');
    fireEvent.changeText(getByPlaceholderText("Age"), '101');
    fireEvent.press(getByText('Add Kid'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Invalid Age", "Number exceeds Age Limit!");
    });
  });
});