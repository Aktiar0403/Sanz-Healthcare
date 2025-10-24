// Navigation and Tab Management for Sanj Healthcare App

// DOM Elements
const contentArea = document.getElementById('content');
const navLinks = document.querySelectorAll('.nav-link');
const currentTabTitle = document.getElementById('current-tab-title');

// Initialize navigation system
function initNavigation() {
  // Add event listeners to all navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the tab name from data attribute
      const tabName = this.getAttribute('data-tab');
      
      // Load the corresponding tab content
      loadTabContent(tabName);
      
      // Update active state
      setActiveTab(this);
    });
  });
  
  // Load dashboard by default
  loadTabContent('dashboard');
}

// Set active tab in sidebar
function setActiveTab(activeLink) {
  // Remove active class from all links
  navLinks.forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to clicked link
  activeLink.classList.add('active');
}

// Load tab content dynamically
function loadTabContent(tabName) {
  // Update current tab title
  currentTabTitle.textContent = capitalizeFirstLetter(tabName);
  
  // If it's the dashboard, show the welcome message
  if (tabName === 'dashboard') {
    showDashboardContent();
    return;
  }
  
  // For other tabs, try to load from /tabs/ folder
  const tabPath = `tabs/${tabName}.html`;
  
  fetch(tabPath)
    .then(response => {
      if (!response.ok) {
        throw new Error('Tab not found');
      }
      return response.text();
    })
    .then(html => {
      contentArea.innerHTML = html;
      
      // Load the corresponding JS file if it exists
      loadTabScript(tabName);
    })
    .catch(error => {
      console.log(`Tab ${tabName} not implemented yet:`, error);
      showPlaceholderContent(tabName);
    });
}

// Show dashboard content
function showDashboardContent() {
  contentArea.innerHTML = `
    <div class="welcome-message">
      <h2>Welcome to Sanj Healthcare App</h2>
      <p>Select a tab from the sidebar to manage your healthcare business.</p>
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>Products</h3>
          <p class="stat-value">0</p>
          <p class="stat-label">Total Products</p>
        </div>
        <div class="stat-card">
          <h3>Stock</h3>
          <p class="stat-value">0</p>
          <p class="stat-label">Items in Stock</p>
        </div>
        <div class="stat-card">
          <h3>Customers</h3>
          <p class="stat-value">0</p>
          <p class="stat-label">Total Customers</p>
        </div>
      </div>
    </div>
  `;
}

// Show placeholder content for tabs that aren't implemented yet
function showPlaceholderContent(tabName) {
  contentArea.innerHTML = `
    <div class="placeholder-content">
      <h2>${capitalizeFirstLetter(tabName)} Management</h2>
      <p>This feature is under development and will be available soon.</p>
      <div class="placeholder-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.5 12H14.5M9.5 15H14.5M9.5 9H14.5M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  `;
}

// Load tab-specific JavaScript
function loadTabScript(tabName) {
  const scriptPath = `js/tabs/${tabName}.js`;
  
  // Remove existing tab script if any
  const existingScript = document.querySelector(`script[data-tab="${tabName}"]`);
  if (existingScript) {
    existingScript.remove();
  }
  
  // Create and load new script
  const script = document.createElement('script');
  script.src = scriptPath;
  script.setAttribute('data-tab', tabName);
  script.onerror = function() {
    console.log(`Script for ${tabName} not found`);
  };
  
  document.head.appendChild(script);
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}