// customers.js - Sanj Healthcare App Customers Module

// Firebase references
const db = firebase.firestore();
let customers = [];
let products = [];
let transactions = [];

// DOM Elements
const customerForm = document.getElementById('customerForm');
const transactionForm = document.getElementById('transactionForm');

// Initialize the module
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomersModule();
});

function initializeCustomersModule() {
    // Set current date as default
    document.getElementById('transactionDate').valueAsDate = new Date();
    
    // Load initial data
    fetchCustomers();
    fetchProducts();
    fetchTransactions();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup real-time listeners
    setupRealtimeListeners();
}

function setupEventListeners() {
    // Customer form
    customerForm.addEventListener('submit', handleCustomerSubmit);
    document.getElementById('updateCustomerBtn').addEventListener('click', updateCustomer);
    document.getElementById('deleteCustomerBtn').addEventListener('click', deleteCustomer);
    document.getElementById('cancelCustomerBtn').addEventListener('click', resetCustomerForm);
    
    // Transaction form
    transactionForm.addEventListener('submit', handleTransactionSubmit);
    document.getElementById('updateTransactionBtn').addEventListener('click', updateTransaction);
    document.getElementById('deleteTransactionBtn').addEventListener('click', deleteTransaction);
    document.getElementById('cancelTransactionBtn').addEventListener('click', resetTransactionForm);
    
    // Auto-calculation events
    document.getElementById('transactionQuantity').addEventListener('input', calculateTotals);
    document.getElementById('transactionUnitPrice').addEventListener('input', calculateTotals);
    document.getElementById('transactionDiscount').addEventListener('input', calculateTotals);
    document.getElementById('transactionCNF').addEventListener('input', calculateTotals);
    document.getElementById('transactionTransport').addEventListener('input', calculateTotals);
    document.getElementById('transactionReturnRatio').addEventListener('input', syncExpectedReturnFields);
    document.getElementById('transactionExpectedReturn').addEventListener('input', syncExpectedReturnFields);
    
    // Product selection change
    document.getElementById('transactionProduct').addEventListener('change', handleProductSelection);
}

function setupRealtimeListeners() {
    // Real-time customers listener
    db.collection('customers').onSnapshot((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        updateCustomersDropdown();
        renderCustomersList();
        updateSummaryCards();
    });
    
    // Real-time products listener
    db.collection('products').onSnapshot((snapshot) => {
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        updateProductsDropdown();
    });
    
    // Real-time transactions listener
    db.collection('transactions').onSnapshot((snapshot) => {
        transactions = [];
        snapshot.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        renderTransactionsTable();
        updateSummaryCards();
    });
}

// ========== CUSTOMER MANAGEMENT ==========

function handleCustomerSubmit(e) {
    e.preventDefault();
    addCustomer();
}

function addCustomer() {
    const customerData = {
        name: document.getElementById('customerName').value,
        type: document.getElementById('customerType').value,
        contact: document.getElementById('customerContact').value,
        address: document.getElementById('customerAddress').value,
        gst: document.getElementById('customerGST').value,
        notes: document.getElementById('customerNotes').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('customers').add(customerData)
        .then(() => {
            alert('Customer added successfully!');
            resetCustomerForm();
        })
        .catch(error => {
            console.error('Error adding customer:', error);
            alert('Error adding customer: ' + error.message);
        });
}

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name || '';
    document.getElementById('customerType').value = customer.type || 'Buyer';
    document.getElementById('customerContact').value = customer.contact || '';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerGST').value = customer.gst || '';
    document.getElementById('customerNotes').value = customer.notes || '';
    
    // Show update/delete buttons, hide add button
    document.querySelector('button[type="submit"]').classList.add('hidden');
    document.getElementById('updateCustomerBtn').classList.remove('hidden');
    document.getElementById('deleteCustomerBtn').classList.remove('hidden');
    document.getElementById('cancelCustomerBtn').classList.remove('hidden');
}

function updateCustomer() {
    const id = document.getElementById('customerId').value;
    const customerData = {
        name: document.getElementById('customerName').value,
        type: document.getElementById('customerType').value,
        contact: document.getElementById('customerContact').value,
        address: document.getElementById('customerAddress').value,
        gst: document.getElementById('customerGST').value,
        notes: document.getElementById('customerNotes').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('customers').doc(id).update(customerData)
        .then(() => {
            alert('Customer updated successfully!');
            resetCustomerForm();
        })
        .catch(error => {
            console.error('Error updating customer:', error);
            alert('Error updating customer: ' + error.message);
        });
}

function deleteCustomer() {
    const id = document.getElementById('customerId').value;
    
    if (confirm('Are you sure you want to delete this customer?')) {
        db.collection('customers').doc(id).delete()
            .then(() => {
                alert('Customer deleted successfully!');
                resetCustomerForm();
            })
            .catch(error => {
                console.error('Error deleting customer:', error);
                alert('Error deleting customer: ' + error.message);
            });
    }
}

function resetCustomerForm() {
    customerForm.reset();
    document.getElementById('customerId').value = '';
    document.querySelector('button[type="submit"]').classList.remove('hidden');
    document.getElementById('updateCustomerBtn').classList.add('hidden');
    document.getElementById('deleteCustomerBtn').classList.add('hidden');
    document.getElementById('cancelCustomerBtn').classList.add('hidden');
}

// ========== TRANSACTION MANAGEMENT ==========

function handleTransactionSubmit(e) {
    e.preventDefault();
    addTransaction();
}

function addTransaction() {
    const transactionData = getTransactionFormData();
    
    // Check stock availability for sales
    if (transactionData.transactionType === 'Sale') {
        const product = products.find(p => p.id === transactionData.productId);
        if (product && product.currentStock < transactionData.quantity) {
            if (!confirm(`Insufficient stock! Available: ${product.currentStock}. Proceed anyway?`)) {
                return;
            }
        }
    }
    
    db.collection('transactions').add(transactionData)
        .then((docRef) => {
            // Update stock
            updateStock(transactionData);
            
            // Sync with finance
            syncFinance(transactionData);
            
            // Update reports
            updateReports(transactionData);
            
            alert('Transaction added successfully!');
            resetTransactionForm();
        })
        .catch(error => {
            console.error('Error adding transaction:', error);
            alert('Error adding transaction: ' + error.message);
        });
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    document.getElementById('transactionId').value = transaction.id;
    document.getElementById('transactionCustomer').value = transaction.customerId;
    document.getElementById('transactionProduct').value = transaction.productId;
    document.getElementById('transactionType').value = transaction.transactionType;
    document.getElementById('transactionQuantity').value = transaction.quantity;
    document.getElementById('transactionUnitPrice').value = transaction.unitPrice;
    document.getElementById('transactionDiscount').value = transaction.discount || 0;
    document.getElementById('transactionCNF').value = transaction.cnfCommission || 0;
    document.getElementById('transactionTransport').value = transaction.transportExpense || 0;
    document.getElementById('transactionReturnRatio').value = transaction.expectedReturnRatio || 0;
    document.getElementById('transactionExpectedReturn').value = transaction.expectedReturn || 0;
    document.getElementById('transactionPaymentStatus').value = transaction.paymentStatus || 'Pending';
    document.getElementById('transactionDate').value = transaction.date;
    
    calculateTotals();
    
    // Show update/delete buttons, hide add button
    document.querySelector('#transactionForm button[type="submit"]').classList.add('hidden');
    document.getElementById('updateTransactionBtn').classList.remove('hidden');
    document.getElementById('deleteTransactionBtn').classList.remove('hidden');
    document.getElementById('cancelTransactionBtn').classList.remove('hidden');
}

function updateTransaction() {
    const id = document.getElementById('transactionId').value;
    const transactionData = getTransactionFormData();
    
    db.collection('transactions').doc(id).update(transactionData)
        .then(() => {
            // Update stock (you might want to handle stock reversal for edits)
            updateStock(transactionData);
            
            // Sync with finance
            syncFinance(transactionData);
            
            // Update reports
            updateReports(transactionData);
            
            alert('Transaction updated successfully!');
            resetTransactionForm();
        })
        .catch(error => {
            console.error('Error updating transaction:', error);
            alert('Error updating transaction: ' + error.message);
        });
}

function deleteTransaction() {
    const id = document.getElementById('transactionId').value;
    
    if (confirm('Are you sure you want to delete this transaction?')) {
        db.collection('transactions').doc(id).delete()
            .then(() => {
                alert('Transaction deleted successfully!');
                resetTransactionForm();
            })
            .catch(error => {
                console.error('Error deleting transaction:', error);
                alert('Error deleting transaction: ' + error.message);
            });
    }
}

function resetTransactionForm() {
    transactionForm.reset();
    document.getElementById('transactionId').value = '';
    document.getElementById('transactionDate').valueAsDate = new Date();
    document.getElementById('transactionTotal').value = '0';
    
    document.querySelector('#transactionForm button[type="submit"]').classList.remove('hidden');
    document.getElementById('updateTransactionBtn').classList.add('hidden');
    document.getElementById('deleteTransactionBtn').classList.add('hidden');
    document.getElementById('cancelTransactionBtn').classList.add('hidden');
}

function getTransactionFormData() {
    const quantity = parseFloat(document.getElementById('transactionQuantity').value);
    const unitPrice = parseFloat(document.getElementById('transactionUnitPrice').value);
    const discount = parseFloat(document.getElementById('transactionDiscount').value) || 0;
    const cnfCommission = parseFloat(document.getElementById('transactionCNF').value) || 0;
    const transportExpense = parseFloat(document.getElementById('transactionTransport').value) || 0;
    const totalAmount = quantity * unitPrice - discount + cnfCommission + transportExpense;
    
    return {
        customerId: document.getElementById('transactionCustomer').value,
        customerName: document.getElementById('transactionCustomer').selectedOptions[0]?.text || '',
        productId: document.getElementById('transactionProduct').value,
        productName: document.getElementById('transactionProduct').selectedOptions[0]?.text || '',
        transactionType: document.getElementById('transactionType').value,
        quantity: quantity,
        unitPrice: unitPrice,
        discount: discount,
        cnfCommission: cnfCommission,
        transportExpense: transportExpense,
        totalAmount: totalAmount,
        expectedReturnRatio: parseFloat(document.getElementById('transactionReturnRatio').value) || 0,
        expectedReturn: parseFloat(document.getElementById('transactionExpectedReturn').value) || 0,
        paymentStatus: document.getElementById('transactionPaymentStatus').value,
        date: document.getElementById('transactionDate').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
}

// ========== CALCULATION FUNCTIONS ==========

function calculateTotals() {
    const quantity = parseFloat(document.getElementById('transactionQuantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('transactionUnitPrice').value) || 0;
    const discount = parseFloat(document.getElementById('transactionDiscount').value) || 0;
    const cnfCommission = parseFloat(document.getElementById('transactionCNF').value) || 0;
    const transportExpense = parseFloat(document.getElementById('transactionTransport').value) || 0;
    
    const totalAmount = quantity * unitPrice - discount + cnfCommission + transportExpense;
    document.getElementById('transactionTotal').value = totalAmount.toFixed(2);
    
    // Sync expected return if ratio is set
    const returnRatio = parseFloat(document.getElementById('transactionReturnRatio').value) || 0;
    if (returnRatio > 0) {
        const expectedReturn = totalAmount * (returnRatio / 100);
        document.getElementById('transactionExpectedReturn').value = expectedReturn.toFixed(2);
    }
}

function syncExpectedReturnFields() {
    const totalAmount = parseFloat(document.getElementById('transactionTotal').value) || 0;
    
    if (event.target.id === 'transactionReturnRatio') {
        // Ratio changed, update expected return
        const ratio = parseFloat(event.target.value) || 0;
        const expectedReturn = totalAmount * (ratio / 100);
        document.getElementById('transactionExpectedReturn').value = expectedReturn.toFixed(2);
    } else if (event.target.id === 'transactionExpectedReturn') {
        // Expected return changed, update ratio
        const expectedReturn = parseFloat(event.target.value) || 0;
        const ratio = totalAmount > 0 ? (expectedReturn / totalAmount) * 100 : 0;
        document.getElementById('transactionReturnRatio').value = ratio.toFixed(2);
    }
}

// ========== INTEGRATION FUNCTIONS ==========

function updateStock(transaction) {
    const productRef = db.collection('products').doc(transaction.productId);
    
    db.runTransaction((transaction) => {
        return transaction.get(productRef).then((doc) => {
            if (!doc.exists) {
                throw new Error('Product not found!');
            }
            
            const currentStock = doc.data().currentStock || 0;
            let newStock;
            
            if (transactionData.transactionType === 'Sale') {
                newStock = currentStock - transactionData.quantity;
            } else if (transactionData.transactionType === 'Purchase') {
                newStock = currentStock + transactionData.quantity;
            }
            
            transaction.update(productRef, {
                currentStock: newStock,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }).catch(error => {
        console.error('Error updating stock:', error);
    });
}

function syncFinance(transaction) {
    const financeData = {
        type: transaction.transactionType === 'Sale' ? 'Income' : 'Expense',
        category: transaction.transactionType === 'Sale' ? 'Sales' : 'Purchases',
        amount: transaction.totalAmount,
        description: `${transaction.transactionType} - ${transaction.productName} to ${transaction.customerName}`,
        date: transaction.date,
        transactionId: transaction.id,
        customerId: transaction.customerId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Add CNF and Transport as separate expense entries
    if (transaction.cnfCommission > 0) {
        const cnfData = {
            type: 'Expense',
            category: 'CNF Commission',
            amount: transaction.cnfCommission,
            description: `CNF Commission for ${transaction.productName}`,
            date: transaction.date,
            transactionId: transaction.id,
            customerId: transaction.customerId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('finance').add(cnfData);
    }
    
    if (transaction.transportExpense > 0) {
        const transportData = {
            type: 'Expense',
            category: 'Transportation',
            amount: transaction.transportExpense,
            description: `Transport for ${transaction.productName}`,
            date: transaction.date,
            transactionId: transaction.id,
            customerId: transaction.customerId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('finance').add(transportData);
    }
    
    // Add main transaction to finance
    db.collection('finance').add(financeData);
}

function updateReports(transaction) {
    // This would update aggregated reports data
    // Implementation depends on your reports structure
    console.log('Updating reports with transaction:', transaction);
}

// ========== DATA FETCHING AND RENDERING ==========

function fetchCustomers() {
    db.collection('customers').get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        updateCustomersDropdown();
        renderCustomersList();
    });
}

function fetchProducts() {
    db.collection('products').get().then((snapshot) => {
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        updateProductsDropdown();
    });
}

function fetchTransactions() {
    db.collection('transactions').get().then((snapshot) => {
        transactions = [];
        snapshot.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        renderTransactionsTable();
        updateSummaryCards();
    });
}

function updateCustomersDropdown() {
    const dropdown = document.getElementById('transactionCustomer');
    dropdown.innerHTML = '<option value="">Select Customer</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.type})`;
        dropdown.appendChild(option);
    });
}

function updateProductsDropdown() {
    const dropdown = document.getElementById('transactionProduct');
    dropdown.innerHTML = '<option value="">Select Product</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        option.setAttribute('data-price', product.price || 0);
        option.setAttribute('data-offer', product.offer || 0);
        dropdown.appendChild(option);
    });
}

function handleProductSelection() {
    const selectedOption = this.selectedOptions[0];
    if (selectedOption && selectedOption.value) {
        const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
        const offer = parseFloat(selectedOption.getAttribute('data-offer')) || 0;
        
        document.getElementById('transactionUnitPrice').value = price;
        document.getElementById('transactionDiscount').value = offer;
        calculateTotals();
    }
}

function renderCustomersList() {
    const container = document.getElementById('customersList');
    container.innerHTML = '';
    
    customers.forEach(customer => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg';
        div.innerHTML = `
            <div>
                <div class="font-medium">${customer.name}</div>
                <div class="text-sm text-gray-600">${customer.type} • ${customer.contact}</div>
            </div>
            <button onclick="editCustomer('${customer.id}')" 
                    class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                Edit
            </button>
        `;
        container.appendChild(div);
    });
}

function renderTransactionsTable() {
    const tbody = document.getElementById('transactionsTable');
    tbody.innerHTML = '';
    
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        const paymentClass = transaction.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 
                           transaction.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 
                           'bg-red-100 text-red-800';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${transaction.customerName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                    ${transaction.transactionType === 'Sale' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                    ${transaction.transactionType}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.productName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.quantity}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${transaction.unitPrice?.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${transaction.discount?.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${transaction.cnfCommission?.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${transaction.transportExpense?.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹${transaction.totalAmount?.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${transaction.expectedReturn?.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.expectedReturnRatio?.toFixed(2)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentClass}">
                    ${transaction.paymentStatus}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(transaction.date).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editTransaction('${transaction.id}')" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                <button onclick="if(confirm('Delete transaction?')) deleteTransactionDirect('${transaction.id}')" 
                        class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteTransactionDirect(id) {
    db.collection('transactions').doc(id).delete()
        .catch(error => {
            console.error('Error deleting transaction:', error);
            alert('Error deleting transaction: ' + error.message);
        });
}

function updateSummaryCards() {
    // Total Customers
    document.getElementById('totalCustomers').textContent = customers.length;
    
    // Calculate totals from transactions
    let totalSales = 0;
    let totalPurchases = 0;
    let totalExpectedReturn = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
        if (transaction.transactionType === 'Sale') {
            totalSales += transaction.totalAmount || 0;
        } else if (transaction.transactionType === 'Purchase') {
            totalPurchases += transaction.totalAmount || 0;
        }
        
        totalExpectedReturn += transaction.expectedReturn || 0;
        totalExpenses += (transaction.cnfCommission || 0) + (transaction.transportExpense || 0);
    });
    
    document.getElementById('totalSales').textContent = `₹${totalSales.toFixed(2)}`;
    document.getElementById('totalPurchases').textContent = `₹${totalPurchases.toFixed(2)}`;
    document.getElementById('totalExpectedReturn').textContent = `₹${totalExpectedReturn.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
}
// Export for navigation system  
window.initializeCustomersModule = function() {
    console.log('Customers module initialized via navigation');
    if (document.getElementById('customerForm')) {
        initializeCustomersModule();
    }
};

// Auto-initialize if on customers page
if (document.getElementById('customerForm')) {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Auto-initializing customers module');
        initializeCustomersModule();
    });
}