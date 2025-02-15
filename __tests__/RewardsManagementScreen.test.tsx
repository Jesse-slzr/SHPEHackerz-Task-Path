// Mock the Firebase configuration to provide a dummy FIREBASE_DB object
jest.mock('../../../FirebaseConfig', () => ({
    FIREBASE_DB: {} // dummy firebase db object for tests
  }));
  
  // Mock Firebase Firestore functions
  jest.mock('firebase/firestore', () => ({
    addDoc: jest.fn(() => Promise.resolve({ id: 'testDocId' })),
    collection: jest.fn(() => 'mockCollection'),
    getDocs: jest.fn(() =>
      Promise.resolve({
        docs: [] // Return an empty list of rewards for testing
      })
    ),
    updateDoc: jest.fn(() => Promise.resolve()),
    doc: jest.fn(),
    deleteDoc: jest.fn(() => Promise.resolve())
  }));
  
  import React from 'react';
  import { render, waitFor } from '@testing-library/react-native';
  import RewardScreen from '../app/screens/dashboardScreens/RewardsManagementScreen';
  
  describe('RewardsManagementScreen', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('renders loading indicator then displays the Manage Rewards title', async () => {
      const { getByText, queryByText } = render(<RewardScreen />);
      
      // Initially, the loading indicator should be visible
      expect(getByText(/Loading Tasks/i)).toBeTruthy();
      
      // Wait for loading to finish and the rewards screen to be rendered
      await waitFor(() => {
        expect(queryByText(/Loading Tasks/i)).toBeNull();
      });
      
      // Verify that the title "Manage Rewards" is displayed
      expect(getByText(/Manage Rewards/i)).toBeTruthy();
    });
  });