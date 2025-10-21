// js/reports.js - FIXED CHART VERSION
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
    const snapshot = await firebase.firestore().collection(collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Load all reports
async function loadReports() {
    try {
        const [financeData, stockData, debtsData, marketingData] = await Promise.all([
            fetchCollection('finance'),
            fetchCollection('stock'),
            fetchCollection('debts'),
            fetchCollection('marketing')
        ]);

        generateRevenueExpenseChart(financeData);
        generateProfitChart(financeData);
        generateStockChart(stockData);
        populateDebtsTable(debtsData);
        populateMarketingTable(marketingData);
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Revenue vs Expenses Chart
function generateRevenueExpenseChart(financeData) {
    if (!revenueCtx) return;
    
    // Destroy existing chart
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    const monthlyData = {};

    financeData.forEach(item => {
        const month = new Date(item.date).toLocaleString('default', { month: 'short' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expense: 0 };
        if (item.type === 'Revenue') monthlyData[month].revenue += Number(item.amount);
        if (item.type === 'Expense') monthlyData[month].expense += Number(item.amount);
    });

    const labels = Object.keys(monthlyData);
    const revenue = labels.map(m => monthlyData[m].revenue);
    const expense = labels.map(m => monthlyData[m].expense);

    revenueChart = new Chart(revenueCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Revenue', data: revenue, borderColor: 'green', fill: false },
                { label: 'Expenses', data: expense, borderColor: 'red', fill: false }
            ]
        },
        options: { responsive: true }
    });
}

// Profit Chart
function generateProfitChart(financeData) {
    if (!profitCtx) return;
    
    // Destroy existing chart
    if (profitChart) {
        profitChart.destroy();
    }
    
    const monthlyData = {};
    financeData.forEach(item => {
        const month = new Date(item.date).toLocaleString('default', { month: 'short' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expense: 0 };
        if (item.type === 'Revenue') monthlyData[month].revenue += Number(item.amount);
        if (item.type === 'Expense') monthlyData[month].expense += Number(item.amount);
    });

    const labels = Object.keys(monthlyData);
    const profit = labels.map(m => monthlyData[m].revenue - monthlyData[m].expense);

    profitChart = new Chart(profitCtx.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Profit', data: profit, backgroundColor: 'blue' }] },
        options: { responsive: true }
    });
}

// Stock Chart
function generateStockChart(stockData) {
    if (!stockCtx) return;
    
    // Destroy existing chart
    if (stockChart) {
        stockChart.destroy();
    }
    
    const labels = stockData.map(s => s.productName || 'Unknown');
    const quantities = stockData.map(s => s.quantity || 0);

    stockChart = new Chart(stockCtx.getContext('2d'), {
        type: 'bar',
        data: { 
            labels, 
            datasets: [{ 
                label: 'Quantity', 
                data: quantities, 
                backgroundColor: quantities.map(q => q < 10 ? 'red' : 'green') 
            }] 
        },
        options: { responsive: true }
    });
}

// Populate Debts Table
function populateDebtsTable(debtsData) {
    if (!debtsTableBody) return;
    
    debtsTableBody.innerHTML = '';
    debtsData.forEach(d => {
        const row = `<tr>
            <td>${d.type || 'N/A'}</td>
            <td>${d.principal || 0}</td>
            <td>${d.monthlyROI || 0}</td>
            <td>${d.paidAmount || 0}</td>
            <td>${d.remainingPrincipal || 0}</td>
        </tr>`;
        debtsTableBody.innerHTML += row;
    });
}

// Populate Marketing Table
function populateMarketingTable(marketingData) {
    if (!marketingTableBody) return;
    
    marketingTableBody.innerHTML = '';
    marketingData.forEach(m => {
        const row = `<tr>
            <td>${m.doctorName || 'N/A'}</td>
            <td>${m.targetValue || 0}</td>
            <td>${m.paid || 0}</td>
            <td>${m.completedPrescriptions || 0}</td>
        </tr>`;
        marketingTableBody.innerHTML += row;
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
        loadReports();
    } else {
        console.error('Firebase not available for reports');
    }
});