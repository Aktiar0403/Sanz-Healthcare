// firebase-config.js - CORRECTED VERSION (No import statements)

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4wGDrMTFbO7k2u6Q7Qn6Q8Y5q9yLm8eA", // Replace with your actual API key
    authDomain: "sanj-healthcare.firebaseapp.com", // Replace with your actual domain
    projectId: "sanj-healthcare", // Replace with your actual project ID
    storageBucket: "sanj-healthcare.appspot.com", // Replace with your actual bucket
    messagingSenderId: "123456789", // Replace with your actual sender ID
    appId: "your-app-id" // Replace with your actual app ID
};

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('🔥 Firebase initialized successfully');
    } else {
        firebase.app(); // if already initialized, use that one
        console.log('🔥 Firebase already initialized');
    }
} catch (error) {
    console.error('🔥 Firebase initialization error:', error);
}

// Demo configuration for testing (remove in production)
const demoConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// Auto-initialize products on first load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App loaded, checking Firebase...');
    
    // Wait for auth to initialize, then check products
    setTimeout(() => {
        if (typeof initializeProducts === 'function') {
            if (firebase.auth().currentUser) {
                console.log('👤 User logged in, initializing products...');
                initializeProducts();
            } else {
                console.log('👤 No user logged in, products will init after login');
            }
        }
    }, 3000);
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

console.log('📄 Firebase config loaded');