// Authentication and Session Management for Sanj Healthcare App

// DOM Elements
const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const loginError = document.getElementById('login-error');

// Check authentication state on page load
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the login page or main app
  if (auth) {
    auth.onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in
        showDashboard(user);
      } else {
        // User is signed out
        showLogin();
      }
    });
  }
});

// Show login page
function showLogin() {
  if (loginPage) loginPage.classList.remove('hidden');
  if (dashboardPage) dashboardPage.classList.add('hidden');
  if (loginError) loginError.textContent = '';
  if (loginForm) loginForm.reset();
}

// Show dashboard
function showDashboard(user) {
  if (loginPage) loginPage.classList.add('hidden');
  if (dashboardPage) dashboardPage.classList.remove('hidden');
  if (userEmail) userEmail.textContent = user.email;
  
  // Initialize navigation after dashboard is shown
  if (typeof initNavigation === 'function') {
    initNavigation();
  }
}

// Handle login form submission
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Show loading state
    const loginBtn = loginForm.querySelector('.btn-login');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    
    // Sign in with Firebase Auth
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Login successful - handled by auth state change
        if (loginError) loginError.textContent = '';
      })
      .catch((error) => {
        // Handle errors
        console.error('Login error:', error);
        if (loginError) {
          loginError.textContent = getErrorMessage(error.code);
          loginError.classList.remove('hidden');
        }
        
        // Reset button
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
      });
  });
}

// Handle logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    auth.signOut()
      .then(() => {
        // Sign-out successful - handled by auth state change
        console.log('User signed out');
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
  });
}

// Helper function to convert Firebase error codes to user-friendly messages
function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Login failed. Please try again.';
  }
}

// Export functions for global access
window.showLogin = showLogin;
window.showDashboard = showDashboard;
window.getErrorMessage = getErrorMessage;