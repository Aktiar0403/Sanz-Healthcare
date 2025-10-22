class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initAuthListener();
    }

    initAuthListener() {
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                // User is signed in
                window.location.href = 'index.html';
            } else {
                // User is signed out
                if (window.location.pathname !== '/login.html') {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();