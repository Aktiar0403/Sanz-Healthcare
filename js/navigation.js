// navigation.js - App navigation functionality
console.log('🧭 Navigation module loaded');

// Global navigation functions
window.switchTab = function(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    try {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.getElementById(tabName);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Load tab content if not already loaded
        loadTabContent(tabName);
        
    } catch (error) {
        console.error('❌ Error switching tab:', error);
        showTemporaryMessage('Error loading tab: ' + error.message, 'error');
    }
}

// Load Tab Content Dynamically
async function loadTabContent(tabName) {
    const tabContent = document.getElementById(tabName);
    
    // Skip if already loaded or is dashboard
    if (tabContent.querySelector('.loaded') || tabName === 'dashboard') {
        return;
    }
    
    try {
        console.log(`📥 Loading ${tabName} content...`);
        
        // Show loading state
        tabContent.innerHTML = `
            <div class="loading">
                <h3>Loading ${tabName.replace(/([A-Z])/g, ' $1')}...</h3>
                <p>Please wait while we load the module</p>
                <div style="margin-top: 20px;">
                    <div style="width: 100%; height: 4px; background: #f0f0f0; border-radius: 2px;">
                        <div style="width: 100%; height: 100%; background: #2196F3; border-radius: 2px; animation: pulse 1.5s infinite;"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Load the HTML content
        const response = await fetch(`tabs/${tabName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load ${tabName}.html: ${response.status}`);
        }
        const html = await response.text();
        
        // Inject the content
        tabContent.innerHTML = html;
        tabContent.classList.add('loaded');
        
        // Load the corresponding JavaScript
        await loadJSModule(tabName);
        
        console.log(`✅ ${tabName} content loaded successfully`);
        
    } catch (error) {
        console.error(`❌ Error loading ${tabName}:`, error);
        tabContent.innerHTML = `
            <div class="error-message">
                <h3>Error Loading ${tabName.replace(/([A-Z])/g, ' $1')}</h3>
                <p>${error.message}</p>
                <button onclick="loadTabContent('${tabName}')" style="margin-top: 10px; padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
}

// Load JavaScript Module
async function loadJSModule(tabName) {
    try {
        console.log(`📜 Loading ${tabName}.js...`);
        
        // Remove existing script if any
        const existingScript = document.getElementById(`script-${tabName}`);
        if (existingScript) {
            existingScript.remove();
        }
        
        // Create new script element
        const script = document.createElement('script');
        script.id = `script-${tabName}`;
        script.src = `js/${tabName}.js`;
        
        // Wait for script to load
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        
        console.log(`✅ ${tabName}.js loaded successfully`);
        
    } catch (error) {
        console.error(`❌ Error loading ${tabName}.js:`, error);
        throw new Error(`Failed to load ${tabName} functionality`);
    }
}

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });
});

console.log('✅ Navigation system ready');