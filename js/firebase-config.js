// Firebase v8 Configuration for Sanj Healthcare App
const firebaseConfig = {
  apiKey: "AIzaSyARxCkcyB7ts0EWoq9x9G31xhIN6fpR9kk",
  authDomain: "sanj-healthcare-77e02.firebaseapp.com",
  projectId: "sanj-healthcare-77e02",
  storageBucket: "sanj-healthcare-77e02.firebasestorage.app",
  messagingSenderId: "710696156355",
  appId: "1:710696156355:web:13bcee177f46e3aebc7676",
  measurementId: "G-HDKXN3LZ7P"
};

// Initialize Firebase
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Initialize Firebase services
const db = firebase.firestore();
const auth = firebase.auth();

// Enable offline persistence with error handling
db.enablePersistence()
  .catch((err) => {
    console.log("Firebase persistence error: ", err);
    // Continue without offline persistence
  });

// Make Firebase instances globally available
window.db = db;
window.auth = auth;