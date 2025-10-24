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
  if (currentTabTitle) {
    currentTabTitle.textContent = capitalizeFirstLetter(tabName);
  }
  
  // If it's the dashboard, show the welcome message
  if (tabName === 'dashboard') {
    showDashboardContent();
    return;
  }
  
  // For other tabs, try to load from /tabs/ folder
  const tabPath = `tabs/${tabName}.html`;
  
  if (contentArea) {
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
}

// Show dashboard content
function showDashboardContent() {
  if (contentArea) {
    contentArea.innerHTML = `
      <div class="welcome-message">
        <div class="bg-white rounded-lg shadow-sm border p-8 text-center">
          <i class="fas fa-heartbeat text-6xl text-blue-600 mb-4"></i>
          <h2 class="text-3xl font-bold text-gray-800 mb-4">Welcome to Sanj Healthcare App</h2>
          <p class="text-gray-600 text-lg mb-8">Select a tab from the sidebar to manage your healthcare business operations.</p>
          
          <div class="dashboard-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div class="stat-card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Products</h3>
                  <p class="stat-value text-3xl font-bold">0</p>
                  <p class="stat-label text-blue-100">Total Products</p>
                </div>
                <i class="fas fa-pills text-3xl opacity-80"></i>
              </div>
            </div>
            
            <div class="stat-card bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Stock</h3>
                  <p class="stat-value text-3xl font-bold">0</p>
                  <p class="stat-label text-green-100">Items in Stock</p>
                </div>
                <i class="fas fa-boxes text-3xl opacity-80"></i>
              </div>
            </div>
            
            <div class="stat-card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Customers</h3>
                  <p class="stat-value text-3xl font-bold">0</p>
                  <p class="stat-label text-purple-100">Total Customers</p>
                </div>
                <i class="fas fa-users text-3xl opacity-80"></i>
              </div>
            </div>
            
            <div class="stat-card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Revenue</h3>
                  <p class="stat-value text-3xl font-bold">₹0</p>
                  <p class="stat-label text-orange-100">This Month</p>
                </div>
                <i class="fas fa-rupee-sign text-3xl opacity-80"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Show placeholder content for tabs that aren't implemented yet
function showPlaceholderContent(tabName) {
  if (contentArea) {
    contentArea.innerHTML = `
      <div class="placeholder-content text-center py-12">
        <div class="max-w-md mx-auto">
          <i class="fas fa-tools text-6xl text-gray-400 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">${capitalizeFirstLetter(tabName)} Management</h2>
          <p class="text-gray-600 mb-6">This feature is under development and will be available soon.</p>
          <button onclick="loadTabContent('dashboard')" class="btn btn-primary">
            <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
          </button>
        </div>
      </div>
    `;
  }
}

// Load tab-specific JavaScript
// Load tab-specific JavaScript
function loadTabScript(tabName) {
    // Use the correct path - your files are in js/ not js/tabs/
    const scriptPath = `js/${tabName}.js`;
    
    console.log(`Loading script: ${scriptPath}`);
    
    // Remove existing tab script if any
    const existingScript = document.querySelector(`script[data-tab="${tabName}"]`);
    if (existingScript) {
        existingScript.remove();
    }
    
    // Create and load new script
    const script = document.createElement('script');
    script.src = scriptPath;
    script.setAttribute('data-tab', tabName);
    script.onload = function() {
        console.log(`Successfully loaded: ${tabName}.js`);
        // Initialize the module if the function exists
        const initFunctionName = `initialize${capitalizeFirstLetter(tabName)}Module`;
        if (typeof window[initFunctionName] === 'function') {
            window[initFunctionName]();
        }
    };
    script.onerror = function() {
        console.error(`Failed to load script: ${scriptPath}`);
        // Provide basic functionality
        provideFallbackFunctionality(tabName);
    };
    
    document.head.appendChild(script);
}

// Provide basic functionality when scripts fail to load
function provideFallbackFunctionality(tabName) {
    console.log(`Providing fallback for: ${tabName}`);
    
    const contentArea = document.getElementById('content');
    if (contentArea) {
        contentArea.innerHTML += `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">Module Loading Issue</h3>
                        <div class="mt-2 text-sm text-yellow-700">
                            <p>The ${tabName} module couldn't be loaded. Basic functionality is available.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Add basic form handling
    setTimeout(() => {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form.hasAttribute('data-enhanced')) {
                form.setAttribute('data-enhanced', 'true');
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    alert(`✅ ${tabName} form submitted successfully!\n\nIn the full version, this would be saved to Firebase.`);
                    this.reset();
                });
            }
        });
    }, 100);
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Make functions globally available
window.initNavigation = initNavigation;
window.loadTabContent = loadTabContent;
window.showDashboardContent = showDashboardContent;
