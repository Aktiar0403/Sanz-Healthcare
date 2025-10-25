// Firebase Configuration for Sanj Healthcare
console.log('🔥 Initializing Firebase...');

const firebaseConfig = {
  apiKey: "AIzaSyARxCkcyB7ts0EWoq9x9G31xhIN6fpR9kk",
  authDomain: "sanj-healthcare-77e02.firebaseapp.com",
  projectId: "sanj-healthcare-77e02",
  storageBucket: "sanj-healthcare-77e02.firebasestorage.app",
  messagingSenderId: "710696156355",
  appId: "1:710696156355:web:13bcee177f46e3aebc7676",
  measurementId: "G-HDKXN3LZ7P"
};

// Initialize Firebase with error handling
function initializeFirebase() {
  try {
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK not loaded');
    }

    // Initialize Firebase app
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase App initialized');
    }

    // Initialize services
    initializeServices();
    
  } catch (error) {
    console.error('💥 Firebase initialization failed:', error);
    handleFirebaseError(error);
  }
}

// Initialize Firebase services
function initializeServices() {
  try {
    // Firestore
    if (typeof firebase.firestore === 'function') {
      window.db = firebase.firestore();
      
      // Configure Firestore settings
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
      });
      
      console.log('✅ Firestore initialized');
      testFirestoreConnection();
    } else {
      throw new Error('Firestore not available');
    }

    // Auth
    if (typeof firebase.auth === 'function') {
      window.auth = firebase.auth();
      console.log('✅ Auth initialized');
    }

    window.firebase = firebase;
    console.log('🎉 All Firebase services ready');

  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    throw error;
  }
}

// Test Firestore connection
async function testFirestoreConnection() {
  try {
    const testDoc = await db.collection('test').doc('connection').get();
    console.log('✅ Firestore connection test: SUCCESS');
  } catch (error) {
    console.error('❌ Firestore connection test: FAILED', error);
    
    // Provide helpful error messages
    switch (error.code) {
      case 'failed-precondition':
        console.error('💡 Firestore might not be enabled. Go to Firebase Console → Firestore Database → Create Database');
        break;
      case 'permission-denied':
        console.error('💡 Firestore security rules blocking access. Check Firestore rules in Firebase Console');
        break;
      case 'not-found':
        console.error('💡 Firestore database not found. Make sure it\'s created in your Firebase project');
        break;
      default:
        console.error('💡 Unknown Firestore error:', error.code);
    }
  }
}

// Handle Firebase errors gracefully
function handleFirebaseError(error) {
  console.error('Firebase Error:', error);
  
  // Set null values to prevent further errors
  window.db = null;
  window.auth = null;
  window.firebase = null;
  
  // Show user-friendly message
  if (document.getElementById('content')) {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="p-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle text-red-400 text-xl mr-3"></i>
            <div>
              <h3 class="text-lg font-medium text-red-800">Firebase Connection Issue</h3>
              <p class="text-red-700 mt-1">Please check your Firebase configuration and make sure Firestore is enabled.</p>
              <p class="text-sm text-red-600 mt-2">Error: ${error.message}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize when Firebase SDK is loaded
if (typeof firebase !== 'undefined') {
  initializeFirebase();
} else {
  // Wait for Firebase to load
  window.addEventListener('firebase-loaded', initializeFirebase);
}

console.log('🔥 Firebase configuration loaded');