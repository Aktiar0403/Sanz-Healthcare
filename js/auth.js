// js/auth.js - UPDATED VERSION
function login(email, password) {
    // Check if Firebase auth is available
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert('Firebase not loaded. Please refresh the page.');
        return;
    }
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Logged in:", userCredential.user.email);
            window.location.href = 'index.html';
        })
        .catch(err => {
            console.error("Login error:", err);
            alert('Login failed: ' + err.message);
        });
}

function logout() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.error('Firebase auth not available');
        return;
    }
    
    firebase.auth().signOut()
        .then(() => {
            console.log("Logged out");
            window.location.href = 'login.html';
        })
        .catch(err => {
            console.error("Logout error:", err);
        });
}

// Make functions globally available
window.logout = logout;
window.login = login;