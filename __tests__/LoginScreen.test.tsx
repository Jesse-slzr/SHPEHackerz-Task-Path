import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Login from '../app/userAuthentication/Login';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Mock Firebase Authentication
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

describe('Login Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(<Login />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('displays an error when email or password is empty', async () => {
    const { getByText, getByPlaceholderText } = render(<Login />);
    fireEvent.changeText(getByPlaceholderText('Email'), '');
    fireEvent.changeText(getByPlaceholderText('Password'), '');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Email and password cannot be empty')).toBeTruthy();
    });
  });

  it('calls signInWithEmailAndPassword with correct credentials', async () => {
    const { getByText, getByPlaceholderText } = render(<Login />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
    });
  });

  it('displays an error message on sign-in failure', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));
    const { getByText, getByPlaceholderText } = render(<Login />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
  });
});