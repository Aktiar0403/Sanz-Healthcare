// Authentication and Session Management for Sanj Healthcare App

// Initialize auth system
function initializeAuth() {
    console.log('🔐 Initializing auth system...');
    
    // Check if Firebase auth is available
    if (window.auth) {
        console.log('✅ Firebase Auth available');
        initializeFirebaseAuth();
    } else {
        console.log('🚨 Firebase Auth not available - using demo mode');
        initializeDemoAuth();
    }
}

// Initialize with Firebase Auth
function initializeFirebaseAuth() {
    auth.onAuthStateChanged(function(user) {
        console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
        if (user) {
            showDashboard(user);
        } else {
            showLogin();
        }
    });
}

// Initialize without Firebase (demo mode)
function initializeDemoAuth() {
    // Auto-login as demo user
    const demoUser = {
        email: 'demo@sanjhealthcare.com',
        uid: 'demo-user'
    };
    
    console.log('👤 Demo user logged in');
    showDashboard(demoUser);
    
    // Handle login form for demo
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            console.log('Demo login:', email);
            alert('✅ Logged in successfully!\n\nIn production, this would authenticate with Firebase.');
            
            const user = { email: email, uid: 'demo-user' };
            showDashboard(user);
        });
    }
}

// Show login page
function showLogin() {
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginError = document.getElementById('login-error');
    
    if (loginPage) loginPage.classList.remove('hidden');
    if (dashboardPage) dashboardPage.classList.add('hidden');
    if (loginError) {
        loginError.textContent = '';
        loginError.classList.add('hidden');
    }
}

// Show dashboard
function showDashboard(user) {
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const userEmail = document.getElementById('user-email');
    
    if (loginPage) loginPage.classList.add('hidden');
    if (dashboardPage) dashboardPage.classList.remove('hidden');
    if (userEmail) userEmail.textContent = user.email;
    
    console.log('🏠 Showing dashboard for:', user.email);
    
    // Initialize navigation
    if (typeof initNavigation === 'function') {
        setTimeout(() => {
            initNavigation();
        }, 100);
    }
}

// Handle logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (auth) {
            auth.signOut();
        } else {
            // Demo logout - reload page
            window.location.reload();
        }
    });
}

// Auto-initialize auth system
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for Firebase to initialize
    setTimeout(() => {
        initializeAuth();
    }, 500);
});

console.log('🔐 Auth module loaded');