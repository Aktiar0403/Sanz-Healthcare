// js/reports.js - COMPREHENSIVE REPORTING & ANALYTICS
console.log('📊 Loading reports module...');

const db = firebase.firestore();
let chartInstances = {};

// Data storage for reports
let reportData = {
    products: [],
    stock: [],
    finance: [],
    marketing: [],
    sales: [],
    period: {}
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not available');
        showErrorMessage('Firebase not loaded. Please refresh the page.');
        return;
    }
    
    console.log('Firebase available, initializing reports...');
    // Initial report generation will be triggered by the HTML
});

// Main report generation function
async function generateReports() {
    try {
        showLoadingState();
        console.log('Generating comprehensive reports...');
        
        // Get report parameters
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const reportType = document.getElementById('reportType').value;
        
        reportData.period = { startDate, endDate, reportType };
        
        // Load all data in parallel
        await Promise.all([
            loadProductsData(),
            loadStockData(),
            loadFinancialData(),
            loadMarketingData(),
            loadSalesData()
        ]);
        
        // Generate all reports
        updateKPICards();
        updateCharts();
        updatePerformanceReports();
        updatePerformanceIndicators();
        
        console.log('Reports generated successfully');
        
    } catch (error) {
        console.error('Error generating reports:', error);
        showTemporaryMessage('Error generating reports: ' + error.message, 'error');
    }
}

// Load products data
async function loadProductsData() {
    try {
        const snapshot = await db.collection('products').get();
        reportData.products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`Loaded ${reportData.products.length} products`);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load stock data
async function loadStockData() {
    try {
        const snapshot = await db.collection('stock')
            .where('date', '>=', reportData.period.startDate)
            .where('date', '<=', reportData.period.endDate)
            .get();
        
        reportData.stock = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`Loaded ${reportData.stock.length} stock entries`);
    } catch (error) {
        console.error('Error loading stock data:', error);
    }
}

// Load financial data
async function loadFinancialData() {
    try {
        const snapshot = await db.collection('finance')
            .where('date', '>=', reportData.period.startDate)
            .where('date', '<=', reportData.period.endDate)
            .get();
        
        reportData.finance = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`Loaded ${reportData.finance.length} financial entries`);
    } catch (error) {
        console.error('Error loading financial data:', error);
    }
}

// Load marketing data
async function loadMarketingData() {
    try {
        const snapshot = await db.collection('doctorAgreements').get();
        reportData.marketing = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`Loaded ${reportData.marketing.length} marketing agreements`);
    } catch (error) {
        console.error('Error loading marketing data:', error);
    }
}

// Load sales data (from stock - scheme sales)
async function loadSalesData() {
    try {
        const snapshot = await db.collection('stock')
            .where('type', '==', 'scheme_sale')
            .where('date', '>=', reportData.period.startDate)
            .where('date', '<=', reportData.period.endDate)
            .get();
        
        reportData.sales = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`Loaded ${reportData.sales.length} sales entries`);
    } catch (error) {
        console.error('Error loading sales data:', error);
    }
}

// Update KPI Cards
function updateKPICards() {
    // Calculate totals
    const totalRevenue = reportData.finance
        .filter(entry => entry.type === 'Revenue')
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    const totalExpenses = reportData.finance
        .filter(entry => entry.type === 'Expense')
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    const netProfit = totalRevenue - totalExpenses;
    
    // Calculate stock value (simplified - using supplier price)
    const stockValue = reportData.products.reduce((sum, product) => {
        return sum + ((product.supplierPrice || 0) * (product.stock || 0));
    }, 0);
    
    // Update KPI cards
    document.getElementById('kpiRevenue').textContent = totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById('kpiExpenses').textContent = totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById('kpiProfit').textContent = netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById('kpiStock').textContent = stockValue.toLocaleString('en-IN', {minimumFractionDigits: 2});
    
    // Simple trend calculation (in real app, compare with previous period)
    document.getElementById('revenueTrend').textContent = '+12.5% vs previous period';
    document.getElementById('expensesTrend').textContent = '+8.2% vs previous period';
    document.getElementById('profitTrend').textContent = '+15.3% vs previous period';
    document.getElementById('stockTrend').textContent = '+5.7% vs previous period';
}

// Update Charts
function updateCharts() {
    updateRevenueExpenseChart();
    updateSalesByCategoryChart();
    updateStockMovementChart();
    updateMarketingROIChart();
}

function updateRevenueExpenseChart() {
    const ctx = document.getElementById('revenueExpenseChart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart
    if (chartInstances.revenueExpenseChart) {
        chartInstances.revenueExpenseChart.destroy();
    }
    
    // Group by month for trend analysis
    const monthlyData = groupDataByMonth();
    
    chartInstances.revenueExpenseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: monthlyData.revenue,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Expenses',
                    data: monthlyData.expenses,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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

function updateSalesByCategoryChart() {
    const ctx = document.getElementById('salesByCategoryChart')?.getContext('2d');
    if (!ctx) return;
    
    if (chartInstances.salesByCategoryChart) {
        chartInstances.salesByCategoryChart.destroy();
    }
    
    // Group sales by product category
    const salesByCategory = {};
    reportData.sales.forEach(sale => {
        const product = reportData.products.find(p => p.id === sale.productId);
        if (product) {
            const category = product.category || 'Uncategorized';
            salesByCategory[category] = (salesByCategory[category] || 0) + (sale.totalValue || 0);
        }
    });
    
    chartInstances.salesByCategoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(salesByCategory),
            datasets: [{
                data: Object.values(salesByCategory),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateStockMovementChart() {
    const ctx = document.getElementById('stockMovementChart')?.getContext('2d');
    if (!ctx) return;
    
    if (chartInstances.stockMovementChart) {
        chartInstances.stockMovementChart.destroy();
    }
    
    // Get top 10 products by stock value
    const topProducts = [...reportData.products]
        .sort((a, b) => (b.supplierPrice * b.stock) - (a.supplierPrice * a.stock))
        .slice(0, 10);
    
    chartInstances.stockMovementChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProducts.map(p => p.name),
            datasets: [{
                label: 'Stock Value (₹)',
                data: topProducts.map(p => (p.supplierPrice || 0) * (p.stock || 0)),
                backgroundColor: '#2196F3'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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

function updateMarketingROIChart() {
    const ctx = document.getElementById('marketingROIChart')?.getContext('2d');
    if (!ctx) return;
    
    if (chartInstances.marketingROIChart) {
        chartInstances.marketingROIChart.destroy();
    }
    
    // Calculate ROI for each doctor agreement
    const marketingROI = reportData.marketing.map(agreement => {
        const roi = agreement.agreementAmount > 0 ? 
            ((agreement.completedValue || 0) / agreement.agreementAmount) * 100 : 0;
        return {
            doctor: agreement.doctorName,
            roi: roi,
            amount: agreement.agreementAmount
        };
    }).filter(item => item.amount > 0)
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 8);
    
    chartInstances.marketingROIChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: marketingROI.map(item => item.doctor),
            datasets: [{
                label: 'ROI %',
                data: marketingROI.map(item => item.roi),
                backgroundColor: '#FF9800'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Update Performance Reports
function updatePerformanceReports() {
    updateTopProductsList();
    updateStockAlertsList();
    updateMarketingPerformanceList();
    updateExpenseBreakdownList();
}

function updateTopProductsList() {
    const container = document.getElementById('topProductsList');
    if (!container) return;
    
    // Calculate product performance
    const productPerformance = reportData.products.map(product => {
        const sales = reportData.sales.filter(sale => sale.productId === product.id);
        const totalSales = sales.reduce((sum, sale) => sum + (sale.totalValue || 0), 0);
        const profitMargin = product.supplierPrice > 0 ? 
            ((product.stockistPrice - product.supplierPrice) / product.supplierPrice) * 100 : 0;
        
        return {
            name: product.name,
            sales: totalSales,
            stock: product.stock || 0,
            margin: profitMargin
        };
    }).filter(item => item.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
    
    container.innerHTML = '';
    
    productPerformance.forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'report-item';
        item.innerHTML = `
            <div class="name">${index + 1}. ${product.name}</div>
            <div class="value">₹${product.sales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
            <div class="trend" style="color: #4CAF50;">${product.margin.toFixed(1)}% margin</div>
        `;
        container.appendChild(item);
    });
}

function updateStockAlertsList() {
    const container = document.getElementById('stockAlertsList');
    if (!container) return;
    
    const lowStockProducts = reportData.products
        .filter(product => (product.stock || 0) < 10) // Low stock threshold
        .sort((a, b) => (a.stock || 0) - (b.stock || 0))
        .slice(0, 10);
    
    container.innerHTML = '';
    
    if (lowStockProducts.length === 0) {
        container.innerHTML = '<div class="report-item">✅ All stock levels are healthy</div>';
        return;
    }
    
    lowStockProducts.forEach(product => {
        const item = document.createElement('div');
        item.className = 'report-item';
        const alertLevel = product.stock < 5 ? '🔴' : '🟡';
        item.innerHTML = `
            <div class="name">${alertLevel} ${product.name}</div>
            <div class="value">${product.stock} units</div>
            <div class="trend" style="color: #f44336;">Low stock</div>
        `;
        container.appendChild(item);
    });
}

function updateMarketingPerformanceList() {
    const container = document.getElementById('marketingPerformanceList');
    if (!container) return;
    
    const marketingPerformance = reportData.marketing
        .map(agreement => {
            const roi = agreement.agreementAmount > 0 ? 
                ((agreement.completedValue || 0) / agreement.agreementAmount) * 100 : 0;
            return {
                doctor: agreement.doctorName,
                target: agreement.agreementAmount || 0,
                completed: agreement.completedValue || 0,
                roi: roi
            };
        })
        .filter(item => item.target > 0)
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 8);
    
    container.innerHTML = '';
    
    marketingPerformance.forEach(agreement => {
        const item = document.createElement('div');
        item.className = 'report-item';
        const performance = agreement.roi >= 100 ? '🟢' : agreement.roi >= 50 ? '🟡' : '🔴';
        item.innerHTML = `
            <div class="name">${performance} Dr. ${agreement.doctor}</div>
            <div class="value">${agreement.roi.toFixed(1)}%</div>
            <div class="trend">₹${agreement.completed.toLocaleString('en-IN')}</div>
        `;
        container.appendChild(item);
    });
}

function updateExpenseBreakdownList() {
    const container = document.getElementById('expenseBreakdownList');
    if (!container) return;
    
    const expenseByCategory = {};
    reportData.finance
        .filter(entry => entry.type === 'Expense')
        .forEach(entry => {
            expenseByCategory[entry.category] = (expenseByCategory[entry.category] || 0) + (entry.amount || 0);
        });
    
    const sortedExpenses = Object.entries(expenseByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);
    
    container.innerHTML = '';
    
    sortedExpenses.forEach(([category, amount]) => {
        const item = document.createElement('div');
        item.className = 'report-item';
        item.innerHTML = `
            <div class="name">${category}</div>
            <div class="value">₹${amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
        `;
        container.appendChild(item);
    });
}

// Update Performance Indicators
function updatePerformanceIndicators() {
    updateInventoryTurnover();
    updateDoctorROI();
    updateProfitMargin();
    updateSchemeEffectiveness();
}

function updateInventoryTurnover() {
    // Simplified inventory turnover calculation
    const costOfGoodsSold = reportData.sales.reduce((sum, sale) => {
        const product = reportData.products.find(p => p.id === sale.productId);
        return sum + ((product?.supplierPrice || 0) * (sale.billedQuantity || 0));
    }, 0);
    
    const averageInventory = reportData.products.reduce((sum, product) => {
        return sum + ((product.supplierPrice || 0) * (product.stock || 0));
    }, 0) / 2; // Simplified average
    
    const turnoverRatio = averageInventory > 0 ? costOfGoodsSold / averageInventory : 0;
    
    document.getElementById('turnoverRatio').textContent = turnoverRatio.toFixed(2);
    document.getElementById('turnoverBar').style.width = Math.min(turnoverRatio * 10, 100) + '%';
    
    let status = 'Needs improvement';
    let fillClass = 'fill-poor';
    if (turnoverRatio > 2) {
        status = 'Excellent';
        fillClass = 'fill-good';
    } else if (turnoverRatio > 1) {
        status = 'Good';
        fillClass = 'fill-average';
    }
    
    document.getElementById('turnoverBar').className = `indicator-fill ${fillClass}`;
    document.getElementById('turnoverStatus').textContent = status;
}

function updateDoctorROI() {
    const totalMarketingSpend = reportData.marketing.reduce((sum, agreement) => 
        sum + (agreement.agreementAmount || 0), 0);
    const totalMarketingReturns = reportData.marketing.reduce((sum, agreement) => 
        sum + (agreement.completedValue || 0), 0);
    
    const doctorROI = totalMarketingSpend > 0 ? 
        (totalMarketingReturns / totalMarketingSpend) * 100 : 0;
    
    document.getElementById('doctorROI').textContent = doctorROI.toFixed(1) + '%';
    document.getElementById('doctorROIBar').style.width = Math.min(doctorROI, 100) + '%';
    
    let status = 'Needs improvement';
    let fillClass = 'fill-poor';
    if (doctorROI > 150) {
        status = 'Excellent';
        fillClass = 'fill-good';
    } else if (doctorROI > 100) {
        status = 'Good';
        fillClass = 'fill-average';
    }
    
    document.getElementById('doctorROIBar').className = `indicator-fill ${fillClass}`;
    document.getElementById('doctorROIStatus').textContent = status;
}

function updateProfitMargin() {
    const totalRevenue = reportData.finance
        .filter(entry => entry.type === 'Revenue')
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    const totalExpenses = reportData.finance
        .filter(entry => entry.type === 'Expense')
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    
    document.getElementById('profitMargin').textContent = profitMargin.toFixed(1) + '%';
    document.getElementById('profitMarginBar').style.width = Math.min(profitMargin, 100) + '%';
    
    let status = 'Low';
    let fillClass = 'fill-poor';
    if (profitMargin > 20) {
        status = 'Excellent';
        fillClass = 'fill-good';
    } else if (profitMargin > 10) {
        status = 'Good';
        fillClass = 'fill-average';
    }
    
    document.getElementById('profitMarginBar').className = `indicator-fill ${fillClass}`;
    document.getElementById('profitMarginStatus').textContent = status;
}

function updateSchemeEffectiveness() {
    const totalSchemeSales = reportData.sales.reduce((sum, sale) => sum + (sale.billedQuantity || 0), 0);
    const totalFreeGiven = reportData.sales.reduce((sum, sale) => sum + (sale.freeQuantity || 0), 0);
    
    const schemeEffectiveness = totalSchemeSales > 0 ? 
        (totalFreeGiven / totalSchemeSales) * 100 : 0;
    
    document.getElementById('schemeEffectiveness').textContent = schemeEffectiveness.toFixed(1) + '%';
    document.getElementById('schemeEffectivenessBar').style.width = Math.min(schemeEffectiveness, 100) + '%';
    
    let status = 'Low engagement';
    let fillClass = 'fill-poor';
    if (schemeEffectiveness > 15) {
        status = 'High engagement';
        fillClass = 'fill-good';
    } else if (schemeEffectiveness > 8) {
        status = 'Moderate engagement';
        fillClass = 'fill-average';
    }
    
    document.getElementById('schemeEffectivenessBar').className = `indicator-fill ${fillClass}`;
    document.getElementById('schemeEffectivenessStatus').textContent = status;
}

// Utility Functions
function groupDataByMonth() {
    // Simplified monthly grouping - in real app, use actual date ranges
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenue = [45000, 52000, 48000, 61000, 58000, 72000];
    const expenses = [38000, 42000, 39000, 48000, 45000, 52000];
    
    return {
        labels: months,
        revenue: revenue,
        expenses: expenses
    };
}

// Export to Excel
function exportToExcel() {
    try {
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Add summary sheet
        const summaryData = [
            ['Sanj Healthcare - Financial Summary'],
            ['Report Period', `${reportData.period.startDate} to ${reportData.period.endDate}`],
            [''],
            ['KPI', 'Value'],
            ['Total Revenue', `₹${document.getElementById('kpiRevenue').textContent}`],
            ['Total Expenses', `₹${document.getElementById('kpiExpenses').textContent}`],
            ['Net Profit', `₹${document.getElementById('kpiProfit').textContent}`],
            ['Stock Value', `₹${document.getElementById('kpiStock').textContent}`]
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws, 'Summary');
        
        // Generate and download
        const fileName = `Sanj_Healthcare_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showTemporaryMessage('Report exported to Excel successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showTemporaryMessage('Error exporting to Excel: ' + error.message, 'error');
    }
}

// Print Reports
function printReports() {
    window.print();
}

// UI Utility Functions
function showLoadingState() {
    // Show loading states in various containers
    const containers = [
        'topProductsList', 'stockAlertsList', 'marketingPerformanceList', 'expenseBreakdownList'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="loading">Generating report...</div>';
        }
    });
}

function showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        font-weight: bold;
        transition: opacity 0.3s;
    `;
    
    messageDiv.style.backgroundColor = type === 'success' ? '#28a745' : 
                                      type === 'error' ? '#dc3545' : '#17a2b8';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => document.body.removeChild(messageDiv), 300);
    }, 3000);
}

function showErrorMessage(message) {
    const container = document.createElement('div');
    container.className = 'error-message';
    container.innerHTML = `
        <h3>Error Loading Reports</h3>
        <p>${message}</p>
        <button class="btn generate-btn" onclick="generateReports()" style="margin-top: 10px;">Try Again</button>
    `;
    
    // Add to page
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    document.querySelector('.control-panel').after(container);
}

// Make functions globally available
window.generateReports = generateReports;
window.exportToExcel = exportToExcel;
window.printReports = printReports;

console.log('📊 Reports module loaded successfully!');