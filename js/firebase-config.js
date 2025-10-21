// js/firebase-config.js - SIMPLE WORKING VERSION
console.log('🚀 Loading Firebase configuration...');

const firebaseConfig = {
  apiKey: "AIzaSyARxCkcyB7ts0EWoq9x9G31xhIN6fpR9kk",
  authDomain: "sanj-healthcare-77e02.firebaseapp.com",
  projectId: "sanj-healthcare-77e02",
  storageBucket: "sanj-healthcare-77e02.firebasestorage.app",
  messagingSenderId: "710696156355",
  appId: "1:710696156355:web:13bcee177f46e3aebc7676",
  measurementId: "G-HDKXN3LZ7P"
};

// Simple initialization - remove all complex checks
try {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
  
  // Initialize services
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  console.log('✅ Firebase services ready');
  
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log('ℹ️ Firebase already initialized');
  } else {
    console.error('❌ Firebase initialization failed:', error);
  }
}