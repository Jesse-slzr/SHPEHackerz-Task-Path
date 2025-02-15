import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import KidsRewardsView from '../app/screens/kidsViewScreens/[id]/KidsRewardsView';

// ----- Mocks for Firebase Firestore -----
import { getDocs, onSnapshot } from 'firebase/firestore';
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'testRewardCompletionId' })),
  setDoc: jest.fn(() => Promise.resolve()),
}));

// ----- Mock Firebase Config -----
jest.mock('../../../../FirebaseConfig', () => ({
  FIREBASE_DB: {},
}));

// ----- Mock expo-router -----
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({
    id: 'kid1',
    name: 'Test Kid',
    age: '10',
    completed: '',
  }),
  router: { push: jest.fn() },
}));

// ----- Helper: Create a fake Firestore snapshot -----
const fakeSnapshot = (docsData: any[]) => ({
  empty: docsData.length === 0,
  docs: docsData.map((data, index) => ({
    id: `doc${index}`,
    data: () => data,
  })),
});

describe('KidsRewardsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset getDocs call count for our custom implementation.
    (getDocs as jest.Mock).mockReset();
  });

  it('renders loading indicator then displays kid info and rewards', async () => {
    // Simulate onSnapshot for the kid's coin count
    (onSnapshot as jest.Mock).mockImplementation((queryRef, callback) => {
      // Return a snapshot with a coinCount of 150
      callback(fakeSnapshot([{ coinCount: 150 }]));
      return jest.fn(); // Dummy unsubscribe function
    });

    // Set up getDocs mock:
    // When first called, simulate fetching rewards,
    // then simulate fetching reward completions (empty in this case).
    let callCount = 0;
    (getDocs as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Rewards snapshot with one reward
        return Promise.resolve(
          fakeSnapshot([
            {
              rewardId: 'r1',
              name: 'Reward 1',
              description: 'First Reward',
              cost: 50,
            },
          ])
        );
      }
      // For completions snapshot - assume no completions yet
      return Promise.resolve(fakeSnapshot([]));
    });

    const { getByText, queryByText } = render(<KidsRewardsView />);

    // The loading indicator should be visible initially.
    expect(getByText(/Loading Kids.../i)).toBeTruthy();

    // Wait for fetchData to complete.
    await waitFor(() => {
      expect(queryByText(/Loading Kids.../i)).toBeNull();
      // Verify kid coin count is rendered.
      expect(getByText(/150 Coins/i)).toBeTruthy();
    });

    // Verify the reward card is displayed.
    expect(getByText('Reward 1')).toBeTruthy();
    expect(getByText('First Reward')).toBeTruthy();
    expect(getByText(/💰 50 Coins/i)).toBeTruthy();

    // Simulate pressing the "Redeem" button.
    // The reward card renders "Redeem" if not completed.
    const redeemButton = getByText('Redeem');
    fireEvent.press(redeemButton);

    // Wait for the modal to appear confirming the claim action.
    await waitFor(() => {
      expect(getByText(/Are you sure you want to redeem/i)).toBeTruthy();
    });
  });
});