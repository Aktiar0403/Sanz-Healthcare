// js/dashboard.js - FIXED VERSION (No imports)

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not initialized');
        showErrorState('Firebase not loaded');
        return;
    }
    
    checkAuthState();
    loadDashboardData();
    initNavigation();
});

// Load all dashboard data
async function loadDashboardData() {
    try {
        showLoadingState();
        
        const [
            financeSummary, 
            stockSummary, 
            debtsSummary,
            marketingSummary
        ] = await Promise.all([
            fetchFinanceSummary(),
            fetchStockSummary(),
            fetchDebtsSummary(),
            fetchMarketingSummary()
        ]);

        updateSummaryCards(financeSummary, stockSummary, debtsSummary, marketingSummary);
        initMonthlyChart(financeSummary.monthlyData);
        
        hideLoadingState();
    } catch (error) {
        console.error('Dashboard loading error:', error);
        showErrorState('Failed to load dashboard data: ' + error.message);
    }
}

// Fetch Finance Summary
async function fetchFinanceSummary() {
    const snapshot = await firebase.firestore().collection('finance').get();
    const financeData = snapshot.docs.map(doc => doc.data());
    
    let totalRevenue = 0;
    let totalExpenses = 0;
    const monthlyData = {};
    
    financeData.forEach(entry => {
        const month = new Date(entry.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
            monthlyData[month] = { revenue: 0, expenses: 0 };
        }
        
        if (entry.type === 'Revenue') {
            totalRevenue += entry.amount;
            monthlyData[month].revenue += entry.amount;
        } else if (entry.type === 'Expense') {
            totalExpenses += entry.amount;
            monthlyData[month].expenses += entry.amount;
        }
    });
    
    return {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: totalRevenue - totalExpenses,
        monthlyData: monthlyData
    };
}

// Fetch Stock Summary
async function fetchStockSummary() {
    const [productsSnapshot, stockSnapshot] = await Promise.all([
        firebase.firestore().collection('products').get(),
        firebase.firestore().collection('stock').get()
    ]);
    
    const products = productsSnapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
    const stockEntries = stockSnapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
    
    let totalStockValue = 0;
    let lowStockItems = 0;
    
    // Calculate total stock value
    products.forEach(product => {
        const productStock = stockEntries.filter(entry => entry.productId === product.id);
        const totalQuantity = productStock.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
        totalStockValue += totalQuantity * (product.supplierPrice || 0);
        
        if (totalQuantity < 10) lowStockItems++;
    });
    
    return {
        totalValue: totalStockValue,
        lowStockCount: lowStockItems,
        totalProducts: products.length
    };
}

// Fetch Debts Summary
async function fetchDebtsSummary() {
    try {
        const [bankSnapshot, investorSnapshot] = await Promise.all([
            firebase.firestore().collection('debts').doc('bankLoans').collection('entries').get(),
            firebase.firestore().collection('debts').doc('investors').collection('entries').get()
        ]);
        
        const bankLoans = bankSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const investors = investorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const totalEMI = bankLoans.reduce((sum, loan) => sum + (loan.emi || 0), 0);
        const totalROI = investors.reduce((sum, investor) => {
            if (!investor.skipROI) {
                const remaining = (investor.principal || 0) - (investor.withdrawnPrincipal || 0);
                return sum + (remaining * (investor.roi || 0) / 100);
            }
            return sum;
        }, 0);
        
        return {
            totalMonthly: totalEMI + totalROI,
            totalPrincipal: 0,
            emiCount: bankLoans.length,
            investorCount: investors.length
        };
    } catch (error) {
        console.error('Error fetching debts:', error);
        return { totalMonthly: 0, totalPrincipal: 0, emiCount: 0, investorCount: 0 };
    }
}

// Fetch Marketing Summary
async function fetchMarketingSummary() {
    const snapshot = await firebase.firestore().collection('marketing').get();
    const marketingData = snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
    
    const totalTarget = marketingData.reduce((sum, entry) => sum + (entry.targetValue || 0), 0);
    const totalCompleted = marketingData.reduce((sum, entry) => sum + (entry.completedValue || 0), 0);
    const totalPayments = marketingData.reduce((sum, entry) => sum + (entry.initialPayment || 0), 0);
    const completionRate = totalTarget > 0 ? (totalCompleted / totalTarget * 100) : 0;
    
    return {
        totalTarget,
        totalCompleted,
        totalPayments,
        completionRate,
        agreementCount: marketingData.length
    };
}

// Update Summary Cards
function updateSummaryCards(finance, stock, debts, marketing) {
    document.getElementById('revenueValue').textContent = `₹${finance.revenue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('expenseValue').textContent = `₹${finance.expenses.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('profitValue').textContent = `₹${finance.profit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('stockValue').textContent = `₹${stock.totalValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('debtValue').textContent = `₹${debts.totalMonthly.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    // Add profit color coding
    const profitElement = document.getElementById('profitValue');
    profitElement.style.color = finance.profit >= 0 ? '#28a745' : '#dc3545';
}

// Initialize Monthly Chart
function initMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }
    
    const months = Object.keys(monthlyData).slice(-6);
    const revenueData = months.map(month => monthlyData[month]?.revenue || 0);
    const expenseData = months.map(month => monthlyData[month]?.expenses || 0);
    const profitData = months.map((month, index) => revenueData[index] - expenseData[index]);
    
    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Profit',
                    data: profitData,
                    type: 'line',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Financial Performance'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ₹${context.raw.toLocaleString('en-IN')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

// Navigation Handling
function initNavigation() {
    const navLinks = document.querySelectorAll('.top-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#')) {
                window.location.href = href;
            }
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Auth State Check
function checkAuthState() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            document.getElementById('userName').textContent = `Welcome, ${user.email}`;
        } else {
            window.location.href = 'login.html';
        }
    });
}

// Loading States
function showLoadingState() {
    const cards = document.querySelectorAll('.card p');
    cards.forEach(card => {
        card.innerHTML = '<span class="loading">Loading...</span>';
    });
}

function hideLoadingState() {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        if (el.parentElement) {
            el.parentElement.textContent = '₹0';
        }
    });
}

function showErrorState(message) {
    const summarySection = document.querySelector('.summary');
    if (summarySection) {
        summarySection.innerHTML = `
            <div class="error-state">
                <p>${message}</p>
                <button onclick="loadDashboardData()">Retry</button>
            </div>
        `;
    }
}

// Make functions globally available
window.loadDashboardData = loadDashboardData;