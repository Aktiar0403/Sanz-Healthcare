// Authentication and Session Management for Sanj Healthcare App

// Wait for auth to be available
function waitForAuth() {
  return new Promise((resolve) => {
    const checkAuth = () => {
      if (window.auth) {
        resolve();
      } else {
        setTimeout(checkAuth, 100);
      }
    };
    checkAuth();
  });
}

// Initialize auth when ready
async function initializeAuth() {
  try {
    await waitForAuth();
    console.log('🔐 Auth system initializing...');
    
    // Check authentication state
    auth.onAuthStateChanged(function(user) {
      console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
      if (user) {
        showDashboard(user);
      } else {
        showLogin();
      }
    });
    
  } catch (error) {
    console.error('Auth initialization error:', error);
    // Fallback: Show login by default
    showLogin();
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
  
  console.log('👤 Showing login page');
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
    initNavigation();
  }
}

// Handle login form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');
    const loginBtn = this.querySelector('.btn-login');
    
    if (!auth) {
      console.error('Auth not available');
      if (loginError) {
        loginError.textContent = 'Authentication system not available';
        loginError.classList.remove('hidden');
      }
      return;
    }
    
    // Show loading state
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';
    }
    
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      console.log('Login successful:', userCredential.user.email);
      
      if (loginError) {
        loginError.textContent = '';
        loginError.classList.add('hidden');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      if (loginError) {
        loginError.textContent = getErrorMessage(error.code);
        loginError.classList.remove('hidden');
      }
    } finally {
      // Reset button
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
      }
    }
  });
}

// Handle logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    if (auth) {
      auth.signOut().then(() => {
        console.log('User signed out');
      }).catch(error => {
        console.error('Logout error:', error);
      });
    }
  });
}

// Error message helper
function getErrorMessage(errorCode) {
  const errors = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.'
  };
  return errors[errorCode] || 'Login failed. Please try again.';
}

// Auto-initialize auth system
if (document.getElementById('login-page') || document.getElementById('dashboard-page')) {
  initializeAuth().catch(console.error);
}

console.log('🔐 Auth module loaded');