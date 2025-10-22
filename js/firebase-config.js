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
// Add this at the BOTTOM of your existing firebase-config.js:

// Auto-initialize products on first load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to initialize, then check products
    setTimeout(() => {
        if (firebase.auth().currentUser) {
            initializeProducts();
        }
    }, 2000);
});

// Enhanced temporary message function
function showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        font-weight: bold;
        transition: opacity 0.3s;
    `;
    
    messageDiv.style.backgroundColor = type === 'success' ? '#28a745' : 
                                      type === 'error' ? '#dc3545' : '#17a2b8';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => document.body.removeChild(messageDiv), 300);
    }, 3000);
}