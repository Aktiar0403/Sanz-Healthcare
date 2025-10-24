// Global variables
let allData = {
    transactions: [],
    stock: [],
    finance: [],
    marketing: [],
    debts: [],
    customers: [],
    products: []
};

let charts = {};
let currentFilters = {
    startDate: null,
    endDate: null,
    productCategory: 'all',
    customerFilter: 'all',
    transactionType: 'all',
    debtType: 'all'
};

// Initialize reports when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeReports();
});

// Initialize all reports functionality
function initializeReports() {
    setupEventListeners();
    loadFilterOptions();
    fetchAllData();
    updateLastUpdated();
}

// Set up event listeners for filters
function setupEventListeners() {
    document.getElementById('startDate').addEventListener('change', function(e) {
        currentFilters.startDate = e.target.value;
    });
    
    document.getElementById('endDate').addEventListener('change', function(e) {
        currentFilters.endDate = e.target.value;
    });
    
    document.getElementById('productCategory').addEventListener('change', function(e) {
        currentFilters.productCategory = e.target.value;
    });
    
    document.getElementById('customerFilter').addEventListener('change', function(e) {
        currentFilters.customerFilter = e.target.value;
    });
    
    document.getElementById('transactionType').addEventListener('change', function(e) {
        currentFilters.transactionType = e.target.value;
    });
    
    document.getElementById('debtType').addEventListener('change', function(e) {
        currentFilters.debtType = e.target.value;
    });
}

// Load filter dropdown options
function loadFilterOptions() {
    // Product categories will be loaded from products data
    // Customers will be loaded from customers data
}

// Fetch all data from Firestore
function fetchAllData() {
    showLoading(true);
    
    Promise.all([
        fetchTransactionsData(),
        fetchStockData(),
        fetchFinanceData(),
        fetchMarketingData(),
        fetchDebtsData(),
        fetchCustomerData(),
        fetchProductsData()
    ]).then(() => {
        calculateSummaryCards();
        generateAllCharts();
        displayTables();
        showLoading(false);
        updateLastUpdated();
    }).catch(error => {
        console.error('Error fetching data:', error);
        showLoading(false);
        alert('Error loading reports data. Please try again.');
    });
}

// Fetch transactions data
function fetchTransactionsData() {
    return new Promise((resolve, reject) => {
        db.collection('transactions').onSnapshot(snapshot => {
            allData.transactions = [];
            snapshot.forEach(doc => {
                allData.transactions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            resolve();
        }, reject);
    });
}

// Fetch stock data
function fetchStockData() {
    return new Promise((resolve, reject) => {
        db.collection('stock').onSnapshot(snapshot => {
            allData.stock = [];
            snapshot.forEach(doc => {
                allData.stock.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            resolve();
        }, reject);
    });
}

// Fetch finance data
function fetchFinanceData() {
    return new Promise((resolve, reject) => {
        db.collection('finance').onSnapshot(snapshot => {
            allData.finance = [];
            snapshot.forEach(doc => {
                allData.finance.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            resolve();
        }, reject);
    });
}

// Fetch marketing data
function fetchMarketingData() {
    return new Promise((resolve, reject) => {
        db.collection('marketing').onSnapshot(snapshot => {
            allData.marketing = [];
            snapshot.forEach(doc => {
                allData.marketing.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            resolve();
        }, reject);
    });
}

// Fetch debts data
function fetchDebtsData() {
    return new Promise((resolve, reject) => {
        db.collection('debts').onSnapshot(snapshot => {
            allData.debts = [];
            snapshot.forEach(doc => {
                allData.debts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            resolve();
        }, reject);
    });
}

// Fetch customer data
function fetchCustomerData() {
    return new Promise((resolve, reject) => {
        db.collection('customers').onSnapshot(snapshot => {
            allData.customers = [];
            snapshot.forEach(doc => {
                allData.customers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            updateCustomerFilter();
            resolve();
        }, reject);
    });
}

// Fetch products data
function fetchProductsData() {
    return new Promise((resolve, reject) => {
        db.collection('products').onSnapshot(snapshot => {
            allData.products = [];
            snapshot.forEach(doc => {
                allData.products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            updateProductCategoryFilter();
            resolve();
        }, reject);
    });
}

// Update customer filter dropdown
function updateCustomerFilter() {
    const customerFilter = document.getElementById('customerFilter');
    customerFilter.innerHTML = '<option value="all">All</option>';
    
    allData.customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name || customer.companyName || 'Unknown Customer';
        customerFilter.appendChild(option);
    });
}

// Update product category filter dropdown
function updateProductCategoryFilter() {
    const categoryFilter = document.getElementById('productCategory');
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    const categories = [...new Set(allData.products.map(product => product.category).filter(Boolean))];
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Calculate and update summary cards
function calculateSummaryCards() {
    const filteredData = applyDataFilters();
    
    // Total Revenue (from sales)
    const totalRevenue = filteredData.transactions
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + (parseFloat(t.totalAmount) || 0), 0);
    
    // Total Expenses (purchases + commissions + transport + marketing + debts ROI)
    const purchaseExpenses = filteredData.transactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + (parseFloat(t.totalAmount) || 0), 0);
    
    const commissionExpenses = filteredData.transactions
        .reduce((sum, t) => sum + (parseFloat(t.cnfCommission) || 0), 0);
    
    const transportExpenses = filteredData.transactions
        .reduce((sum, t) => sum + (parseFloat(t.transportExpense) || 0), 0);
    
    const marketingExpenses = filteredData.marketing
        .reduce((sum, m) => sum + (parseFloat(m.paidAmount) || 0), 0);
    
    const debtExpenses = filteredData.debts
        .reduce((sum, d) => sum + (parseFloat(d.monthlyROI) || 0) + (parseFloat(d.monthlyEMI) || 0), 0);
    
    const totalExpenses = purchaseExpenses + commissionExpenses + transportExpenses + marketingExpenses + debtExpenses;
    
    // Total Profit
    const totalProfit = totalRevenue - totalExpenses;
    
    // Total Stock Value
    const totalStockValue = filteredData.stock
        .reduce((sum, item) => {
            const product = allData.products.find(p => p.id === item.productId);
            const unitPrice = product ? parseFloat(product.unitPrice) || 0 : 0;
            return sum + (unitPrice * (parseInt(item.quantity) || 0));
        }, 0);
    
    // Total Debts
    const totalDebts = filteredData.debts
        .reduce((sum, d) => sum + (parseFloat(d.remainingPrincipal) || 0), 0);
    
    // Total Expected Return
    const totalExpectedReturn = filteredData.transactions
        .reduce((sum, t) => sum + (parseFloat(t.expectedReturn) || 0), 0) +
        filteredData.marketing
        .reduce((sum, m) => sum + (parseFloat(m.expectedReturn) || 0), 0);
    
    // Update DOM elements
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('totalProfit').textContent = formatCurrency(totalProfit);
    document.getElementById('totalStockValue').textContent = formatCurrency(totalStockValue);
    document.getElementById('totalDebts').textContent = formatCurrency(totalDebts);
    document.getElementById('totalExpectedReturn').textContent = formatCurrency(totalExpectedReturn);
}

// Apply filters to data
function applyDataFilters() {
    let filteredData = JSON.parse(JSON.stringify(allData));
    
    // Date filter
    if (currentFilters.startDate || currentFilters.endDate) {
        filteredData.transactions = filteredData.transactions.filter(t => {
            const transactionDate = new Date(t.date || t.timestamp);
            const startDate = currentFilters.startDate ? new Date(currentFilters.startDate) : new Date('1970-01-01');
            const endDate = currentFilters.endDate ? new Date(currentFilters.endDate) : new Date();
            
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }
    
    // Product category filter
    if (currentFilters.productCategory !== 'all') {
        const productIdsInCategory = allData.products
            .filter(p => p.category === currentFilters.productCategory)
            .map(p => p.id);
        
        filteredData.transactions = filteredData.transactions.filter(t => 
            productIdsInCategory.includes(t.productId)
        );
        filteredData.stock = filteredData.stock.filter(s => 
            productIdsInCategory.includes(s.productId)
        );
    }
    
    // Customer filter
    if (currentFilters.customerFilter !== 'all') {
        filteredData.transactions = filteredData.transactions.filter(t => 
            t.customerId === currentFilters.customerFilter || t.sellerId === currentFilters.customerFilter
        );
    }
    
    // Transaction type filter
    if (currentFilters.transactionType !== 'all') {
        filteredData.transactions = filteredData.transactions.filter(t => 
            t.type === currentFilters.transactionType
        );
    }
    
    // Debt type filter
    if (currentFilters.debtType !== 'all') {
        filteredData.debts = filteredData.debts.filter(d => 
            d.type === currentFilters.debtType
        );
    }
    
    return filteredData;
}

// Generate all charts
function generateAllCharts() {
    generateRevenueExpenseChart();
    generateTopProductsChart();
    generateTopCustomersChart();
    generateDebtOverviewChart();
    generateMarketingROIChart();
    generateStockLevelsChart();
}

// Revenue vs Expenses Chart
function generateRevenueExpenseChart() {
    const ctx = document.getElementById('revenueExpenseChart').getContext('2d');
    
    // Sample data - in real implementation, aggregate by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenueData = [120000, 150000, 180000, 140000, 160000, 200000];
    const expenseData = [80000, 90000, 110000, 95000, 105000, 120000];
    
    if (charts.revenueExpense) {
        charts.revenueExpense.destroy();
    }
    
    charts.revenueExpense = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// Top Products Chart
function generateTopProductsChart() {
    const ctx = document.getElementById('topProductsChart').getContext('2d');
    
    // Aggregate product sales
    const productSales = {};
    allData.transactions
        .filter(t => t.type === 'sale')
        .forEach(t => {
            const productId = t.productId;
            const amount = parseFloat(t.totalAmount) || 0;
            productSales[productId] = (productSales[productId] || 0) + amount;
        });
    
    // Get top 5 products
    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, sales]) => {
            const product = allData.products.find(p => p.id === productId);
            return {
                name: product ? product.name : 'Unknown Product',
                sales: sales
            };
        });
    
    if (charts.topProducts) {
        charts.topProducts.destroy();
    }
    
    charts.topProducts = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProducts.map(p => p.name),
            datasets: [{
                label: 'Sales (₹)',
                data: topProducts.map(p => p.sales),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(14, 165, 233, 0.8)'
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)',
                    'rgb(139, 92, 246)',
                    'rgb(14, 165, 233)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Sales: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// Top Customers Chart
function generateTopCustomersChart() {
    const ctx = document.getElementById('topCustomersChart').getContext('2d');
    
    // Aggregate customer purchases
    const customerPurchases = {};
    allData.transactions
        .filter(t => t.type === 'sale')
        .forEach(t => {
            const customerId = t.customerId;
            const amount = parseFloat(t.totalAmount) || 0;
            customerPurchases[customerId] = (customerPurchases[customerId] || 0) + amount;
        });
    
    // Get top 5 customers
    const topCustomers = Object.entries(customerPurchases)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([customerId, purchases]) => {
            const customer = allData.customers.find(c => c.id === customerId);
            return {
                name: customer ? (customer.name || customer.companyName) : 'Unknown Customer',
                purchases: purchases
            };
        });
    
    if (charts.topCustomers) {
        charts.topCustomers.destroy();
    }
    
    charts.topCustomers = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topCustomers.map(c => c.name),
            datasets: [{
                label: 'Purchases (₹)',
                data: topCustomers.map(c => c.purchases),
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(20, 184, 166, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgb(139, 92, 246)',
                    'rgb(20, 184, 166)',
                    'rgb(245, 158, 11)',
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Purchases: ${formatCurrency(context.parsed.x)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// Debt Overview Chart
function generateDebtOverviewChart() {
    const ctx = document.getElementById('debtOverviewChart').getContext('2d');
    
    const bankDebts = allData.debts
        .filter(d => d.type === 'bank')
        .reduce((sum, d) => sum + (parseFloat(d.remainingPrincipal) || 0), 0);
    
    const investorDebts = allData.debts
        .filter(d => d.type === 'investor')
        .reduce((sum, d) => sum + (parseFloat(d.remainingPrincipal) || 0), 0);
    
    if (charts.debtOverview) {
        charts.debtOverview.destroy();
    }
    
    charts.debtOverview = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bank Debts', 'Investor Debts'],
            datasets: [{
                data: [bankDebts, investorDebts],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(139, 92, 246)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Marketing ROI Chart
function generateMarketingROIChart() {
    const ctx = document.getElementById('marketingROIChart').getContext('2d');
    
    // Sample data - in real implementation, use actual marketing data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const paidAmounts = [50000, 60000, 45000, 70000, 55000, 65000];
    const expectedReturns = [75000, 90000, 60000, 105000, 80000, 95000];
    
    if (charts.marketingROI) {
        charts.marketingROI.destroy();
    }
    
    charts.marketingROI = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Paid Amount',
                    data: paidAmounts,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)'
                },
                {
                    label: 'Expected Returns',
                    data: expectedReturns,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// Stock Levels Chart
function generateStockLevelsChart() {
    const ctx = document.getElementById('stockLevelsChart').getContext('2d');
    
    // Get stock levels for top 10 products
    const productStock = allData.stock
        .map(item => {
            const product = allData.products.find(p => p.id === item.productId);
            return {
                name: product ? product.name : 'Unknown Product',
                quantity: parseInt(item.quantity) || 0,
                minThreshold: parseInt(item.minThreshold) || 10
            };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    
    if (charts.stockLevels) {
        charts.stockLevels.destroy();
    }
    
    charts.stockLevels = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: productStock.map(p => p.name),
            datasets: [{
                label: 'Current Stock',
                data: productStock.map(p => p.quantity),
                backgroundColor: productStock.map(p => 
                    p.quantity <= p.minThreshold ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)'
                ),
                borderColor: productStock.map(p => 
                    p.quantity <= p.minThreshold ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantity'
                    }
                }
            }
        }
    });
}

// Display low stock table
function displayLowStockTable() {
    const lowStockTable = document.getElementById('lowStockTable');
    lowStockTable.innerHTML = '';
    
    const lowStockItems = allData.stock.filter(item => {
        const quantity = parseInt(item.quantity) || 0;
        const minThreshold = parseInt(item.minThreshold) || 10;
        return quantity <= minThreshold;
    });
    
    document.getElementById('lowStockCount').textContent = `${lowStockItems.length} items`;
    
    lowStockItems.forEach(item => {
        const product = allData.products.find(p => p.id === item.productId);
        const quantity = parseInt(item.quantity) || 0;
        const minThreshold = parseInt(item.minThreshold) || 10;
        
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3 font-medium text-gray-900">${product ? product.name : 'Unknown Product'}</td>
            <td class="px-4 py-3">${product ? product.category : 'N/A'}</td>
            <td class="px-4 py-3 font-medium ${quantity === 0 ? 'text-red-600' : 'text-orange-600'}">${quantity}</td>
            <td class="px-4 py-3">${minThreshold}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${
                    quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                }">
                    ${quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                </span>
            </td>
            <td class="px-4 py-3 text-gray-500">${formatDate(item.lastUpdated)}</td>
        `;
        lowStockTable.appendChild(row);
    });
}

// Display transactions table
function displayTransactionsTable() {
    const transactionsTable = document.getElementById('transactionsTable');
    transactionsTable.innerHTML = '';
    
    const filteredTransactions = applyDataFilters().transactions.slice(0, 50); // Show last 50
    
    filteredTransactions.forEach(transaction => {
        const product = allData.products.find(p => p.id === transaction.productId);
        const customer = allData.customers.find(c => c.id === (transaction.customerId || transaction.sellerId));
        
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3">${formatDate(transaction.date)}</td>
            <td class="px-4 py-3 font-medium text-gray-900">${customer ? (customer.name || customer.companyName) : 'Unknown'}</td>
            <td class="px-4 py-3">${product ? product.name : 'Unknown Product'}</td>
            <td class="px-4 py-3">${transaction.quantity || 0}</td>
            <td class="px-4 py-3 font-medium">${formatCurrency(transaction.totalAmount)}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${
                    transaction.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }">
                    ${transaction.paymentStatus || 'pending'}
                </span>
            </td>
            <td class="px-4 py-3">${formatCurrency(transaction.expectedReturn)}</td>
            <td class="px-4 py-3">${formatCurrency(transaction.cnfCommission)}</td>
            <td class="px-4 py-3">${formatCurrency(transaction.transportExpense)}</td>
        `;
        transactionsTable.appendChild(row);
    });
}

// Display debts table
function displayDebtsTable() {
    const debtsTable = document.getElementById('debtsTable');
    debtsTable.innerHTML = '';
    
    const filteredDebts = applyDataFilters().debts;
    
    filteredDebts.forEach(debt => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3 font-medium text-gray-900">${debt.bankName || debt.investorName || 'Unknown'}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${
                    debt.type === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }">
                    ${debt.type || 'unknown'}
                </span>
            </td>
            <td class="px-4 py-3 font-medium">${formatCurrency(debt.remainingPrincipal)}</td>
            <td class="px-4 py-3">${formatCurrency(debt.monthlyROI || debt.monthlyEMI)}</td>
            <td class="px-4 py-3">${debt.skippedROI || 0}</td>
            <td class="px-4 py-3">${formatCurrency(debt.partialWithdrawals)}</td>
            <td class="px-4 py-3">${formatDate(debt.startDate)}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${
                    debt.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }">
                    ${debt.status || 'active'}
                </span>
            </td>
        `;
        debtsTable.appendChild(row);
    });
}

// Display all tables
function displayTables() {
    displayLowStockTable();
    displayTransactionsTable();
    displayDebtsTable();
}

// Apply filters and refresh data
function applyFilters() {
    calculateSummaryCards();
    generateAllCharts();
    displayTables();
}

// Reset all filters
function resetFilters() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('productCategory').value = 'all';
    document.getElementById('customerFilter').value = 'all';
    document.getElementById('transactionType').value = 'all';
    document.getElementById('debtType').value = 'all';
    
    currentFilters = {
        startDate: null,
        endDate: null,
        productCategory: 'all',
        customerFilter: 'all',
        transactionType: 'all',
        debtType: 'all'
    };
    
    applyFilters();
}

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

// Update last updated timestamp
function updateLastUpdated() {
    const now = new Date();
    document.getElementById('lastUpdated').textContent = `Last updated: ${now.toLocaleString()}`;
}

// Format currency
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return '₹' + num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Export to PDF (placeholder function)
function exportToPDF() {
    alert('PDF export functionality would be implemented here. This could use libraries like jsPDF or generate a server-side PDF.');
    // In a real implementation, this would:
    // 1. Capture the current report state
    // 2. Generate a PDF with all charts and tables
    // 3. Download the PDF file
}

// Auto-refresh data every 5 minutes
setInterval(() => {
    fetchAllData();
}, 5 * 60 * 1000);