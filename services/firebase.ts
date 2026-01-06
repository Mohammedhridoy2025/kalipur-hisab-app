// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyADFLsO7piWILFCacpctgqWDfQrzNhXmAQ",
  authDomain: "ai-agent-455520.firebaseapp.com",
  projectId: "ai-agent-455520",
  storageBucket: "ai-agent-455520.firebasestorage.app",
  messagingSenderId: "1035386759238",
  appId: "1:1035386759238:web:582eff2c2214ddd4c94247",
  measurementId: "G-ETZLYRFBK0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Function to create a mock Auth service to prevent "is not a function" errors
const createMockAuth = () => {
  return {
    onAuthStateChanged: (callback: any) => {
      console.warn("Firebase Auth is using a mock service. Please verify initialization.");
      callback(null);
      return () => { };
    },
    signInWithEmailAndPassword: async () => {
      throw new Error("Firebase Auth is not correctly initialized.");
    },
    signOut: async () => {
      console.warn("Mock signOut called.");
    }
  } as unknown as firebase.auth.Auth;
};

// Function to create a mock Firestore service
const createMockDb = () => {
  const mockCollection = {
    onSnapshot: (callback: any) => {
      callback({ docs: [], docChanges: () => [] });
      return () => { };
    },
    add: async () => { throw new Error("Firestore not initialized"); },
    doc: () => ({
      set: async () => { throw new Error("Firestore not initialized"); },
      delete: async () => { throw new Error("Firestore not initialized"); },
      onSnapshot: () => () => { }
    }),
    where: function () { return this; },
    orderBy: function () { return this; },
    limit: function () { return this; }
  };

  return {
    collection: () => mockCollection,
    settings: () => { },
    enablePersistence: async () => { }
  } as unknown as firebase.firestore.Firestore;
};

let dbInstance: firebase.firestore.Firestore;
let authInstance: firebase.auth.Auth;

// Initialize Firebase
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  dbInstance = firebase.firestore();
  authInstance = firebase.auth();

  // Apply best-practice settings
  dbInstance.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    merge: true
  });

  // Enable offline persistence if possible
  if (typeof window !== 'undefined') {
    dbInstance.enablePersistence({ synchronizeTabs: true }).catch((err) => {
      console.debug("Firestore Persistence:", err.code);
    });
  }
} catch (err) {
  console.error("Firebase Error during initialization:", err);
  dbInstance = createMockDb();
  authInstance = createMockAuth();
}

export const db = dbInstance;
export const auth = authInstance;

// Collections
export const membersCol = db.collection("members");
export const subscriptionsCol = db.collection("subscriptions");
export const expensesCol = db.collection("expenses");
export const trashCol = db.collection("trash");
