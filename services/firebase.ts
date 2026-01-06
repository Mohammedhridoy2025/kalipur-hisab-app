import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Web app's Firebase configuration
// Using a helper to ensure we don't pass literal "undefined" strings
const getEnv = (key: string) => {
  const value = process.env[key];
  return (value === "undefined" || !value) ? "" : value;
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID'),
  measurementId: getEnv('FIREBASE_MEASUREMENT_ID')
};

// Check for missing keys
const missingKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value && key !== 'measurementId')
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error("CRITICAL ERROR: Missing Firebase Environment Variables:", missingKeys.join(", "));
  console.warn("Please add these keys to your Vercel Environment Variables settings and Redeploy.");
}

// Initialize Firebase only if we have at least the API Key
if (!firebase.apps.length && firebaseConfig.apiKey) {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

// Initialize Services
export const db = firebase.firestore();

// Optimized settings for web
try {
  if (firebase.apps.length) {
    db.settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
      merge: true
    });
    
    // Enable offline persistence
    db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab.");
      } else if (err.code === 'unimplemented') {
        console.warn("The current browser does not support persistence.");
      }
    });
  }
} catch (e) {
  console.debug("Firestore settings could not be applied.");
}

export const auth = firebase.auth();

// Collection References
export const membersCol = db.collection("members");
export const subscriptionsCol = db.collection("subscriptions");
export const expensesCol = db.collection("expenses");
export const trashCol = db.collection("trash");