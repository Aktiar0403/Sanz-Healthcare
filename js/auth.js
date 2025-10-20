// js/auth.js - COMPLETE FIXED VERSION
function login(email, password) {
    auth.signInWithEmailAndPassword(email, password)
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
    auth.signOut()
        .then(() => {
            console.log("Logged out");
            window.location.href = 'login.html';
        })
        .catch(err => {
            console.error("Logout error:", err);
            alert('Logout failed: ' + err.message);
        });
}

// Make functions globally available
window.logout = logout;
window.login = login;