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

// Wait for Firebase to load completely
function initializeFirebase() {
  return new Promise((resolve, reject) => {
    // Check if Firebase is already loaded
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded');
      reject(new Error('Firebase SDK not loaded'));
      return;
    }

    try {
      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('🔥 Firebase initialized successfully');
      }

      // Initialize services with error handling
      let db, auth;

      try {
        db = firebase.firestore();
        console.log('✅ Firestore initialized');
      } catch (firestoreError) {
        console.error('❌ Firestore initialization failed:', firestoreError);
        db = null;
      }

      try {
        auth = firebase.auth();
        console.log('✅ Auth initialized');
      } catch (authError) {
        console.error('❌ Auth initialization failed:', authError);
        auth = null;
      }

      // Make globally available
      window.db = db;
      window.auth = auth;
      window.firebase = firebase;

      console.log('🎉 Firebase configuration completed');
      resolve({ db, auth });

    } catch (error) {
      console.error('💥 Firebase initialization error:', error);
      reject(error);
    }
  });
}

// Auto-initialize when Firebase is ready
if (typeof firebase !== 'undefined') {
  initializeFirebase().catch(error => {
    console.error('Failed to initialize Firebase:', error);
  });
} else {
  console.log('⏳ Waiting for Firebase SDK to load...');
  
  // Fallback: Check again after a delay
  setTimeout(() => {
    if (typeof firebase !== 'undefined') {
      initializeFirebase().catch(console.error);
    } else {
      console.error('🚨 Firebase SDK never loaded');
    }
  }, 2000);
}