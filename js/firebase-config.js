// firebase-config.js - USING YOUR REAL FIREBASE CONFIG
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
        console.log('🔥 Firebase initialized successfully with your project');
    }
} catch (error) {
    console.error('🔥 Firebase initialization error:', error);
}

// Auto-initialize products on first load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App loaded, checking Firebase...');
    
    // Wait for auth to initialize
    setTimeout(() => {
        if (typeof initializeProducts === 'function') {
            if (firebase.auth().currentUser) {
                console.log('👤 User logged in, initializing products...');
                initializeProducts();
            } else {
                console.log('👤 No user logged in yet');
            }
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    messageDiv.style.backgroundColor = type === 'success' ? '#28a745' : 
                                      type === 'error' ? '#dc3545' : '#17a2b8';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                document.body.removeChild(messageDiv);
            }
        }, 300);
    }, 4000);
}

console.log('📄 Firebase config loaded with project: sanj-healthcare-77e02');