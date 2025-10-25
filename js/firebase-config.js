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

// Initialize Firebase only if not already initialized
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialized successfully');
  }
  
  // Initialize services
  window.db = firebase.firestore();
  window.auth = firebase.auth();
  
  console.log('✅ Firebase services ready');
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Make sure Firebase is globally available
if (typeof firebase !== 'undefined') {
  window.firebase = firebase;
}