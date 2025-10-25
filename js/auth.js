// Authentication and Session Management for Sanj Healthcare App

// Check authentication state
document.addEventListener('DOMContentLoaded', function() {
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(function(user) {
      if (user) {
        showDashboard(user);
      } else {
        showLogin();
      }
    });
  }
});

// Show login page
function showLogin() {
  const loginPage = document.getElementById('login-page');
  const dashboardPage = document.getElementById('dashboard-page');
  const loginError = document.getElementById('login-error');
  
  if (loginPage) loginPage.classList.remove('hidden');
  if (dashboardPage) dashboardPage.classList.add('hidden');
  if (loginError) loginError.textContent = '';
}

// Show dashboard
function showDashboard(user) {
  const loginPage = document.getElementById('login-page');
  const dashboardPage = document.getElementById('dashboard-page');
  const userEmail = document.getElementById('user-email');
  
  if (loginPage) loginPage.classList.add('hidden');
  if (dashboardPage) dashboardPage.classList.remove('hidden');
  if (userEmail) userEmail.textContent = user.email;
  
  if (typeof initNavigation === 'function') {
    initNavigation();
  }
}

// Handle login form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');
    
    if (auth) {
      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          if (loginError) loginError.textContent = '';
        })
        .catch((error) => {
          console.error('Login error:', error);
          if (loginError) {
            loginError.textContent = getErrorMessage(error.code);
            loginError.classList.remove('hidden');
          }
        });
    }
  });
}

// Handle logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    if (auth) {
      auth.signOut().catch(error => {
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
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.'
  };
  return errors[errorCode] || 'Login failed. Please try again.';
}