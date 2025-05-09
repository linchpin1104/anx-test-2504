import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// If you need Analytics, you can import and initialize it in a browser-only context
// import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "anx-test-faadd.firebaseapp.com",
  projectId: "anx-test-faadd",
  storageBucket: "anx-test-faadd.firebasestorage.app",
  messagingSenderId: "576536060563",
  appId: "1:576536060563:web:1d934d3e70f1fc2b26e366",
  measurementId: "G-RT8W7937B9"
};

// Initialize Firebase App (re-use if already initialized)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firestore and Auth instances for client-side use
export const db = getFirestore(app);
export const auth = getAuth(app);

// If you need analytics, initialize it in a browser environment:
// if (typeof window !== 'undefined') {
//   export const analytics = getAnalytics(app);
// } 