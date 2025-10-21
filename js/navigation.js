// js/navigation.js - Simple navigation component
function loadNavigation() {
  const navigationHTML = `
    <header>
      <div class="header-container">
        <div class="logo">🩺 Sanj Healthcare Pvt. Ltd.</div>
        <div class="user-info">
          <span id="userName">Welcome, Admin</span>
          <button class="btn logout-btn" onclick="logout()">Logout</button>
        </div>
      </div>
    </header>

    <nav class="top-nav">
      <a href="../index.html" class="nav-btn dashboard-btn">
        <span>📊 Dashboard</span>
      </a>
      <a href="products.html" class="nav-btn">Products</a>
      <a href="stock.html" class="nav-btn">Stock</a>
      <a href="finance.html" class="nav-btn">Finance</a>
      <a href="marketing.html" class="nav-btn">Marketing</a>
      <a href="debts.html" class="nav-btn">Debts</a>
      <a href="reports.html" class="nav-btn">Reports</a>
    </nav>
  `;
  
  // Create navigation container
  const navContainer = document.createElement('div');
  navContainer.id = 'main-navigation';
  navContainer.innerHTML = navigationHTML;
  
  // Insert at top of body
  document.body.insertBefore(navContainer, document.body.firstChild);
  
  // Add styles
  addNavigationStyles();
  
  // Highlight current page
  highlightCurrentPage();
}

function addNavigationStyles() {
  const styles = `
    <style>
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #0d6efd;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        margin-bottom: 10px;
      }
      
      .logo { font-size: 1.4rem; font-weight: 600; }
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .logout-btn {
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
      }
      
      .logout-btn:hover { background: #c82333; }
      
      .top-nav {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .nav-btn {
        text-decoration: none;
        padding: 12px 20px;
        background: #e9ecef;
        color: #333;
        border-radius: 6px;
        transition: all 0.3s ease;
        font-weight: 500;
      }
      
      .nav-btn:hover {
        background: #0d6efd;
        color: white;
        transform: translateY(-2px);
      }
      
      .nav-btn.active {
        background: #0d6efd;
        color: white;
        box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
      }
      
      .dashboard-btn {
        background: #28a745;
        color: white;
        font-weight: bold;
      }
      
      .dashboard-btn:hover { background: #218838; }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

function highlightCurrentPage() {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.nav-btn');
  
  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || 
        (currentPage === '' && linkPage === '../index.html') ||
        (currentPage === 'index.html' && linkPage === '../index.html')) {
      link.classList.add('active');
    }
  });
}

function logout() {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().signOut().then(() => {
      window.location.href = '../login.html';
    });
  } else {
    window.location.href = '../login.html';
  }
}

// Load navigation when DOM is ready
document.addEventListener('DOMContentLoaded', loadNavigation);