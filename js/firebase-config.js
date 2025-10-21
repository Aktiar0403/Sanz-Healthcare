// js/firebase-config.js - UPDATED WITH BETTER ERROR HANDLING
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

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
});

function initializeFirebase() {
    try {
        console.log('🔍 Checking Firebase availability...');
        
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK not loaded. Check script loading order.');
            return;
        }

        // Check if Firestore is available
        if (typeof firebase.firestore !== 'function') {
            console.error('❌ Firestore not loaded. Make sure firebase-firestore.js is included BEFORE this file.');
            return;
        }

        // Check if Auth is available  
        if (typeof firebase.auth !== 'function') {
            console.warn('⚠️ Auth not loaded, but continuing...');
        }

        // Initialize Firebase app
        if (!firebase.apps.length) {
            console.log('🔥 Initializing Firebase app...');
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase app initialized successfully');
        } else {
            console.log('ℹ️ Firebase app already initialized');
        }

        // Initialize services
        console.log('🔄 Initializing Firestore...');
        const db = firebase.firestore();
        
        console.log('🔄 Initializing Auth...');
        const auth = firebase.auth();
        
        console.log('✅ All Firebase services initialized successfully');
        
        // Global access for debugging
        window.firebaseDb = db;
        window.firebaseAuth = auth;
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        console.error('Error details:', {
            firebaseLoaded: typeof firebase !== 'undefined',
            firestoreLoaded: typeof firebase.firestore === 'function',
            authLoaded: typeof firebase.auth === 'function',
            appsLength: firebase.apps ? firebase.apps.length : 'no apps'
        });
    }
}

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    // DOM is already ready
    initializeFirebase();
}