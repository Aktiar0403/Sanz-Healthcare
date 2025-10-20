// js/auth.js
// Simple email/password login example
function login(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then(user => console.log("Logged in:", user.user.email))
        .catch(err => console.error("Login error:", err));
}

function logout() {
    auth.signOut()
        .then(() => console.log("Logged out"))
        .catch(err => console.error("Logout error:", err));
}
