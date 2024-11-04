import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYmiwZjG3wzRK60y1qatp0ByHuuRIc5eI",
  authDomain: "taskpath-bd90f.firebaseapp.com",
  projectId: "taskpath-bd90f",
  storageBucket: "taskpath-bd90f.firebasestorage.app",
  messagingSenderId: "111821687357",
  appId: "1:111821687357:web:3dc1a83fd4066dc938b854"
};

// // Initialize Firebase
 export const FIREBASE_APP = initializeApp(firebaseConfig);
 export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
 const analytics = isSupported().then(yes => yes ? getAnalytics(FIREBASE_APP) : null);