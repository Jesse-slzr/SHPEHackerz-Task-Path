/**
 * This test file mocks Firestore methods and expo-router to simulate the behavior of your KidScreen.
 * The tests verify that:
 *   - A loading indicator appears initially and then disappears once data (kid coin count) is loaded.
 *   - The kid’s coin count (from onSnapshot) is rendered.
 *   - Navigation is triggered when the "Rewards" button is pressed.
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import KidScreen from '../app/screens/kidsViewScreens/[id]/index';

// ----- Mocks for firebase/firestore -----
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  addDoc,
  setDoc,
} from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn().mockImplementation((...args) => {
    // For debugging purposes, we attach a mock name so we can later differentiate queries
    const fn = jest.fn();
    fn.mockName = args[1] ? 'tasksQuery' : 'defaultQuery';
    return fn;
  }),
  where: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
}));

// ----- Mock Firebase Config -----
jest.mock('../../../FirebaseConfig', () => ({
  FIREBASE_DB: {}, // Dummy object for tests
}));

// ----- Mock expo-router to handle local search params and navigation -----
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'testId', name: 'Test Kid', age: '10' }),
  router: {
    push: jest.fn(),
  },
}));

// ----- Helper to create fake Firestore snapshot objects -----
const createFakeSnapshot = (docsData: any[]) => ({
  empty: docsData.length === 0,
  docs: docsData.map((data, index) => ({
    id: `doc${index}`,
    data: () => data,
  })),
});

describe('TasksManagementScreen (KidScreen)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator then displays kid info with coin count', async () => {
    // Setup: simulate kid snapshot that returns a coin balance of 50.
    const kidSnapshot = createFakeSnapshot([{ coinCount: 50 }]);
    
    // Mock onSnapshot to call its callback immediately with kidSnapshot.
    (onSnapshot as jest.Mock).mockImplementation((queryObj, callback) => {
      callback(kidSnapshot);
      return jest.fn(); // Unsubscribe dummy
    });
    
    // Mock getDocs for tasks and completions as empty arrays.
    (getDocs as jest.Mock).mockResolvedValue(createFakeSnapshot([]));
    
    // Render the KidScreen screen.
    const { getByText, queryByText } = render(<KidScreen />);
    
    // Initially, the loading indicator should be visible.
    expect(getByText(/Loading Tasks.../i)).toBeTruthy();
    
    // Wait for loading to complete and check that the kid coin balance is rendered.
    await waitFor(() => {
      expect(queryByText(/Loading Tasks.../i)).toBeNull();
      expect(getByText(/50 Coins/i)).toBeTruthy();
    });
  });

  it('navigates to rewards screen when Rewards button is pressed', async () => {
    // Setup: simulate kid snapshot as before.
    const kidSnapshot = createFakeSnapshot([{ coinCount: 50 }]);
    (onSnapshot as jest.Mock).mockImplementation((queryObj, callback) => {
      callback(kidSnapshot);
      return jest.fn();
    });
    (getDocs as jest.Mock).mockResolvedValue(createFakeSnapshot([]));
    
    // Render the screen.
    const { getByText } = render(<KidScreen />);
    
    // Wait for the kid coin balance to appear so that loading is done.
    await waitFor(() => {
      expect(getByText(/50 Coins/i)).toBeTruthy();
    });
    
    // The "Rewards" button should be rendered.
    const rewardsButton = getByText('Rewards');
    
    // Simulate press on the "Rewards" button.
    fireEvent.press(rewardsButton);
    
    // Verify that the navigation function was called.
    const { router } = require('expo-router');
    expect(router.push).toHaveBeenCalled();
  });
});