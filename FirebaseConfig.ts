import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    initializeAuth, 
    setPersistence,  
    getReactNativePersistence 
} from "firebase/auth";
import { browserSessionPersistence } from '@firebase/auth/dist/rn/index.js';
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYmiwZjG3wzRK60y1qatp0ByHuuRIc5eI",
  authDomain: "taskpath-bd90f.firebaseapp.com",
  projectId: "taskpath-bd90f",
  storageBucket: "taskpath-bd90f.firebasestorage.app",
  messagingSenderId: "111821687357",
  appId: "1:111821687357:web:3dc1a83fd4066dc938b854"
};

// Initialize Firebase App
export const FIREBASE_APP = initializeApp(firebaseConfig);

let INITIALIZED_FIREBASE_AUTH;

if (Platform.OS === 'web') {
  // Web-specific persistence
  INITIALIZED_FIREBASE_AUTH = getAuth(FIREBASE_APP);
  setPersistence(INITIALIZED_FIREBASE_AUTH, browserSessionPersistence).catch((error) => {
    console.error("Error setting persistence for web:", error);
  });
} else {
  // React Native-specific persistence
  INITIALIZED_FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Export Firebase Auth
export const FIREBASE_AUTH = () => {
  if (!INITIALIZED_FIREBASE_AUTH) {
    throw new Error("FIREBASE_AUTH is not initialized yet.");
  }
  return INITIALIZED_FIREBASE_AUTH;
};

// Initialize Firestore
export const FIREBASE_DB = getFirestore(FIREBASE_APP);

// Initialize Analytics (conditionally if supported)
export const FIREBASE_ANALYTICS = isSupported().then((supported) =>
  supported ? getAnalytics(FIREBASE_APP) : null
);