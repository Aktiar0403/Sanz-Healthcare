// Navigation and Tab Management for Sanj Healthcare App

// DOM Elements
const contentArea = document.getElementById('content');
const navLinks = document.querySelectorAll('.nav-link');
const currentTabTitle = document.getElementById('current-tab-title');

// Initialize navigation system
function initNavigation() {
  console.log('Initializing navigation system...');
  
  // Add event listeners to all navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const tabName = this.getAttribute('data-tab');
      console.log('Loading tab:', tabName);
      
      loadTabContent(tabName);
      setActiveTab(this);
    });
  });
  
  // Load dashboard by default
  loadTabContent('dashboard');
}

// Set active tab in sidebar
function setActiveTab(activeLink) {
  navLinks.forEach(link => link.classList.remove('active'));
  activeLink.classList.add('active');
}

// Load tab content dynamically
function loadTabContent(tabName) {
  if (currentTabTitle) {
    currentTabTitle.textContent = capitalizeFirstLetter(tabName);
  }
  
  if (tabName === 'dashboard') {
    showDashboardContent();
    return;
  }
  
  const tabPath = `tabs/${tabName}.html`;
  
  if (contentArea) {
    fetch(tabPath)
      .then(response => {
        if (!response.ok) throw new Error('Tab not found');
        return response.text();
      })
      .then(html => {
        contentArea.innerHTML = html;
        loadTabScript(tabName);
      })
      .catch(error => {
        console.log(`Tab ${tabName} not found:`, error);
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
            <div class="stat-card bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Products</h3>
                  <p class="text-3xl font-bold mt-2">0</p>
                  <p class="text-blue-100 text-sm mt-1">Total Products</p>
                </div>
                <i class="fas fa-pills text-3xl opacity-80"></i>
              </div>
            </div>
            
            <div class="stat-card bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Stock</h3>
                  <p class="text-3xl font-bold mt-2">0</p>
                  <p class="text-green-100 text-sm mt-1">Items in Stock</p>
                </div>
                <i class="fas fa-boxes text-3xl opacity-80"></i>
              </div>
            </div>
            
            <div class="stat-card bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Customers</h3>
                  <p class="text-3xl font-bold mt-2">0</p>
                  <p class="text-purple-100 text-sm mt-1">Total Customers</p>
                </div>
                <i class="fas fa-users text-3xl opacity-80"></i>
              </div>
            </div>
            
            <div class="stat-card bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Revenue</h3>
                  <p class="text-3xl font-bold mt-2">₹0</p>
                  <p class="text-orange-100 text-sm mt-1">This Month</p>
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

// Show placeholder content
function showPlaceholderContent(tabName) {
  if (contentArea) {
    contentArea.innerHTML = `
      <div class="text-center py-12">
        <div class="max-w-md mx-auto">
          <i class="fas fa-tools text-6xl text-gray-400 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">${capitalizeFirstLetter(tabName)} Management</h2>
          <p class="text-gray-600 mb-6">This feature is under development and will be available soon.</p>
          <button onclick="loadTabContent('dashboard')" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
          </button>
        </div>
      </div>
    `;
  }
}

// Load tab-specific JavaScript
function loadTabScript(tabName) {
  const scriptPath = `js/${tabName}.js`;
  
  console.log(`Loading script: ${scriptPath}`);
  
  // Remove existing script
  const existingScript = document.querySelector(`script[data-tab="${tabName}"]`);
  if (existingScript) existingScript.remove();
  
  // Create new script
  const script = document.createElement('script');
  script.src = scriptPath;
  script.setAttribute('data-tab', tabName);
  
  script.onload = function() {
    console.log(`✅ Loaded: ${tabName}.js`);
    const initFunction = `initialize${capitalizeFirstLetter(tabName)}Module`;
    if (typeof window[initFunction] === 'function') {
      window[initFunction]();
    }
  };
  
  script.onerror = function() {
    console.error(`❌ Failed to load: ${scriptPath}`);
    provideFallbackFunctionality(tabName);
  };
  
  document.head.appendChild(script);
}

// Provide fallback functionality
function provideFallbackFunctionality(tabName) {
  console.log(`Providing fallback for: ${tabName}`);
  
  setTimeout(() => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (!form.hasAttribute('data-enhanced')) {
        form.setAttribute('data-enhanced', 'true');
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          alert(`✅ ${tabName} form submitted!\n\nIn production, this would save to Firebase.`);
          this.reset();
        });
      }
    });
  }, 100);
}

// Helper function
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Make functions global
window.initNavigation = initNavigation;
window.loadTabContent = loadTabContent;

console.log('Navigation system ready');