// js/reports.js - ENHANCED VERSION
let revenueChart = null;
let profitChart = null;
let stockChart = null;

// DOM elements
const revenueCtx = document.getElementById('revenueChart');
const profitCtx = document.getElementById('profitChart');
const stockCtx = document.getElementById('stockChart');
const debtsTableBody = document.querySelector('#debtsSummaryTable tbody');
const marketingTableBody = document.querySelector('#marketingSummaryTable tbody');

// Helper function to get Firestore collection data
async function fetchCollection(collectionName) {
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        return [];
    }
    
    try {
        const snapshot = await firebase.firestore().collection(collectionName).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return [];
    }
}

// Load all reports
async function loadReports() {
    try {
        console.log('Loading reports data...');
        
        const [financeData, stockData, debtsData, marketingData] = await Promise.all([
            fetchCollection('finance'),
            fetchCollection('stock'),
            fetchDebtsData(),
            fetchCollection('marketing')
        ]);

        console.log('Data loaded:', {
            finance: financeData.length,
            stock: stockData.length,
            debts: debtsData.length,
            marketing: marketingData.length
        });

        generateRevenueExpenseChart(financeData);
        generateProfitChart(financeData);
        generateStockChart(stockData);
        populateDebtsTable(debtsData);
        populateMarketingTable(marketingData);
        
    } catch (error) {
        console.error('Error loading reports:', error);
        showErrorMessage('Failed to load reports data');
    }
}

// Special function for debts data (subcollections)
async function fetchDebtsData() {
    try {
        const [bankSnapshot, investorSnapshot] = await Promise.all([
            firebase.firestore().collection('debts').doc('bankLoans').collection('entries').get(),
            firebase.firestore().collection('debts').doc('investors').collection('entries').get()
        ]);
        
        const bankLoans = bankSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            type: 'Bank Loan',
            ...doc.data() 
        }));
        
        const investors = investorSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            type: 'Investor',
            ...doc.data() 
        }));
        
        return [...bankLoans, ...investors];
    } catch (error) {
        console.error('Error fetching debts:', error);
        return [];
    }
}

// Revenue vs Expenses Chart
function generateRevenueExpenseChart(financeData) {
    if (!revenueCtx) return;
    
    // Destroy existing chart
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    // If no data, show message
    if (financeData.length === 0) {
        revenueCtx.getContext('2d').font = '16px Arial';
        revenueCtx.getContext('2d').fillText('No financial data available', 100, 100);
        return;
    }
    
    const monthlyData = {};

    financeData.forEach(item => {
        const month = new Date(item.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        
        if (item.type === 'Revenue') {
            monthlyData[month].revenue += Number(item.amount || 0);
        } else if (item.type === 'Expense') {
            monthlyData[month].expenses += Number(item.amount || 0);
        }
    });

    const labels = Object.keys(monthlyData).length > 0 ? Object.keys(monthlyData) : ['Jan', 'Feb', 'Mar'];
    const revenue = labels.map(m => monthlyData[m]?.revenue || 0);
    const expenses = labels.map(m => monthlyData[m]?.expenses || 0);

    revenueChart = new Chart(revenueCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                { 
                    label: 'Revenue', 
                    data: revenue, 
                    borderColor: '#28a745', 
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                { 
                    label: 'Expenses', 
                    data: expenses, 
                    borderColor: '#dc3545', 
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 2,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Revenue vs Expenses'
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

// Profit Chart
function generateProfitChart(financeData) {
    if (!profitCtx) return;
    
    // Destroy existing chart
    if (profitChart) {
        profitChart.destroy();
    }
    
    // If no data, show message
    if (financeData.length === 0) {
        profitCtx.getContext('2d').font = '16px Arial';
        profitCtx.getContext('2d').fillText('No financial data available', 100, 100);
        return;
    }
    
    const monthlyData = {};
    financeData.forEach(item => {
        const month = new Date(item.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        
        if (item.type === 'Revenue') monthlyData[month].revenue += Number(item.amount || 0);
        if (item.type === 'Expense') monthlyData[month].expenses += Number(item.amount || 0);
    });

    const labels = Object.keys(monthlyData).length > 0 ? Object.keys(monthlyData) : ['Jan', 'Feb', 'Mar'];
    const profit = labels.map(m => (monthlyData[m]?.revenue || 0) - (monthlyData[m]?.expenses || 0));

    profitChart = new Chart(profitCtx.getContext('2d'), {
        type: 'bar',
        data: { 
            labels, 
            datasets: [{ 
                label: 'Profit/Loss', 
                data: profit, 
                backgroundColor: profit.map(p => p >= 0 ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)') 
            }] 
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Profit Analysis'
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

// Stock Chart
function generateStockChart(stockData) {
    if (!stockCtx) return;
    
    // Destroy existing chart
    if (stockChart) {
        stockChart.destroy();
    }
    
    // If no data, show message
    if (stockData.length === 0) {
        stockCtx.getContext('2d').font = '16px Arial';
        stockCtx.getContext('2d').fillText('No stock data available', 100, 100);
        return;
    }
    
    // Get product names for labels
    const labels = stockData.map(s => s.productId ? `Product ${s.productId}` : 'Unknown Product');
    const quantities = stockData.map(s => s.quantity || 0);

    stockChart = new Chart(stockCtx.getContext('2d'), {
        type: 'bar',
        data: { 
            labels, 
            datasets: [{ 
                label: 'Stock Quantity', 
                data: quantities, 
                backgroundColor: quantities.map(q => q < 10 ? 'rgba(220, 53, 69, 0.7)' : 'rgba(40, 167, 69, 0.7)') 
            }] 
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Current Stock Levels'
                }
            }
        }
    });
}

// Populate Debts Table
function populateDebtsTable(debtsData) {
    if (!debtsTableBody) return;
    
    debtsTableBody.innerHTML = '';
    
    if (debtsData.length === 0) {
        debtsTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #6c757d;">
                    No debt data available
                </td>
            </tr>
        `;
        return;
    }
    
    debtsData.forEach(d => {
        const principal = d.principal || 0;
        const monthlyPayment = d.emi || d.roi || 0;
        const paid = d.paid || d.withdrawnPrincipal || 0;
        const remaining = principal - paid;
        
        const row = `<tr>
            <td>${d.type || 'N/A'}</td>
            <td>₹${principal.toLocaleString('en-IN')}</td>
            <td>₹${monthlyPayment.toLocaleString('en-IN')}</td>
            <td>₹${paid.toLocaleString('en-IN')}</td>
            <td>₹${remaining.toLocaleString('en-IN')}</td>
        </tr>`;
        debtsTableBody.innerHTML += row;
    });
}

// Populate Marketing Table
function populateMarketingTable(marketingData) {
    if (!marketingTableBody) return;
    
    marketingTableBody.innerHTML = '';
    
    if (marketingData.length === 0) {
        marketingTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #6c757d;">
                    No marketing data available
                </td>
            </tr>
        `;
        return;
    }
    
    marketingData.forEach(m => {
        const target = m.targetValue || 0;
        const completed = m.completedValue || 0;
        const payment = m.initialPayment || 0;
        const progress = target > 0 ? ((completed / target) * 100).toFixed(1) + '%' : '0%';
        
        const row = `<tr>
            <td>${m.doctorName || 'N/A'}</td>
            <td>₹${target.toLocaleString('en-IN')}</td>
            <td>₹${completed.toLocaleString('en-IN')}</td>
            <td>₹${payment.toLocaleString('en-IN')}</td>
            <td>${progress}</td>
        </tr>`;
        marketingTableBody.innerHTML += row;
    });
}

// Show error message
function showErrorMessage(message) {
    const containers = document.querySelectorAll('.chart-container, .table-container');
    containers.forEach(container => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            canvas.getContext('2d').font = '16px Arial';
            canvas.getContext('2d').fillText(message, 50, 100);
        }
    });
}

// Clean up charts when leaving page
window.addEventListener('beforeunload', function() {
    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (stockChart) stockChart.destroy();
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        console.log('Firebase available, loading reports...');
        loadReports();
    } else {
        console.error('Firebase not available for reports');
        showErrorMessage('Firebase not initialized');
    }
});