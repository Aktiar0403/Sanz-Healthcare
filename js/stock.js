// js/stock.js - COMPLETE SCHEME-AWARE STOCK MANAGEMENT
console.log('📊 Loading stock module...');

const db = firebase.firestore();
let stockEntries = [];
let products = [];
let currentTab = 'all';
const lowStockThreshold = 10;

// DOM Elements
const productSelect = document.getElementById('productSelect');
const schemeProductSelect = document.getElementById('schemeProductSelect');
const stockTableBody = document.querySelector('#stockTable tbody');

// Summary elements
const totalProductsElem = document.getElementById('totalProducts');
const lowStockCountElem = document.getElementById('lowStockCount');
const expiryCountElem = document.getElementById('expiryCount');
const schemeLiabilitiesElem = document.getElementById('schemeLiabilities');

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not available');
        showErrorMessage('Firebase not loaded. Please refresh the page.');
        return;
    }
    
    console.log('Firebase available, loading stock data...');
    loadProductsAndStock();
});

// Load both products and stock data
async function loadProductsAndStock() {
    try {
        showLoadingState();
        console.log('Loading products and stock data...');
        
        // Load products first
        const productsSnapshot = await db.collection('products').get();
        products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        loadProductOptions(products);
        
        // Load stock entries
        const stockSnapshot = await db.collection('stock').orderBy('date', 'desc').get();
        stockEntries = stockSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateSummary();
        renderStockTable();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showErrorMessage('Error loading stock data: ' + error.message);
    }
}

// Load products to dropdowns
function loadProductOptions(products) {
    if (!productSelect || !schemeProductSelect) return;
    
    // Clear both dropdowns
    productSelect.innerHTML = '<option value="">Select Product</option>';
    schemeProductSelect.innerHTML = '<option value="">Select Product</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (Batch: ${product.batch || 'N/A'})`;
        productSelect.appendChild(option.cloneNode(true));
        schemeProductSelect.appendChild(option);
    });
}

// Update summary cards
function updateSummary() {
    if (!totalProductsElem) return;
    
    // Total products
    totalProductsElem.textContent = products.length;
    
    // Low stock count
    const lowStockProducts = products.filter(p => p.stock < lowStockThreshold);
    lowStockCountElem.textContent = lowStockProducts.length;
    
    // Near expiry count (within 30 days)
    const today = new Date();
    const nearExpiryProducts = products.filter(p => {
        if (!p.expiry) return false;
        const expiryDate = new Date(p.expiry);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    });
    expiryCountElem.textContent = nearExpiryProducts.length;
    
    // Scheme liabilities (calculate from scheme sales)
    const schemeLiabilities = stockEntries
        .filter(entry => entry.type === 'scheme_sale')
        .reduce((total, entry) => total + (entry.freeQuantity || 0), 0);
    schemeLiabilitiesElem.textContent = schemeLiabilities;
}

// Switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab UI
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    renderStockTable();
}

// Show Add Stock Form
function showAddStockForm() {
    document.getElementById('formTitle').textContent = "Add Stock Entry";
    document.getElementById('stockForm').style.display = 'block';
    document.getElementById('schemeSaleForm').style.display = 'none';
    
    // Clear form
    document.getElementById('stockId').value = '';
    ['batch', 'quantity', 'invoice', 'date'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    if (productSelect) productSelect.value = '';
    if (document.getElementById('movementType')) {
        document.getElementById('movementType').value = 'purchase';
    }
}

// Show Scheme Sale Form
function showSchemeSaleForm() {
    document.getElementById('schemeFormTitle').textContent = "Record Scheme Sale";
    document.getElementById('schemeSaleForm').style.display = 'block';
    document.getElementById('stockForm').style.display = 'none';
    
    // Clear form
    document.getElementById('schemeProductSelect').value = '';
    document.getElementById('stockistName').value = '';
    document.getElementById('billedQuantity').value = '';
    document.getElementById('saleInvoice').value = '';
    document.getElementById('saleDate').value = '';
    document.getElementById('schemePreview').style.display = 'none';
}

// Hide Forms
function hideStockForm() {
    document.getElementById('stockForm').style.display = 'none';
}

function hideSchemeForm() {
    document.getElementById('schemeSaleForm').style.display = 'none';
}

// Calculate bonus based on scheme
function calculateBonus(billedQuantity, bonusScheme) {
    if (!bonusScheme) return { freeQuantity: 0, scheme: 'none' };
    
    let freeQuantity = 0;
    let schemeDescription = '';
    
    if (bonusScheme.includes('+')) {
        // "10+1" scheme
        const [buy, free] = bonusScheme.split('+').map(Number);
        freeQuantity = Math.floor(billedQuantity / buy) * free;
        schemeDescription = `Buy ${buy} Get ${free} Free`;
    }
    else if (bonusScheme.includes('%')) {
        // "10% extra" scheme
        const percentage = parseInt(bonusScheme);
        freeQuantity = Math.floor(billedQuantity * (percentage / 100));
        schemeDescription = `${percentage}% Extra Free`;
    }
    else if (bonusScheme === '1+1') {
        // "Buy 1 Get 1"
        freeQuantity = Math.floor(billedQuantity / 1) * 1;
        schemeDescription = 'Buy 1 Get 1 Free';
    }
    else if (bonusScheme === 'Free Gift') {
        freeQuantity = 0; // Handle gifts separately
        schemeDescription = 'Free Gift with Purchase';
    }
    else {
        schemeDescription = bonusScheme;
    }
    
    return {
        freeQuantity: freeQuantity,
        scheme: bonusScheme,
        description: schemeDescription,
        totalQuantity: billedQuantity + freeQuantity
    };
}

// Preview scheme when product selected
document.getElementById('schemeProductSelect')?.addEventListener('change', async function() {
    const productId = this.value;
    if (!productId) {
        document.getElementById('schemePreview').style.display = 'none';
        return;
    }
    
    const product = await getProductById(productId);
    if (product && product.bonus) {
        const bonusDetails = calculateBonus(1, product.bonus); // Preview for 1 unit
        document.getElementById('schemeDetails').textContent = 
            `${product.bonus} - ${bonusDetails.description}`;
        document.getElementById('schemePreview').style.display = 'block';
    } else {
        document.getElementById('schemePreview').style.display = 'none';
    }
});

// Save Stock Entry
async function saveStock() {
    try {
        const productId = productSelect.value;
        const batch = document.getElementById('batch').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const invoice = document.getElementById('invoice').value;
        const date = document.getElementById('date').value;
        const movementType = document.getElementById('movementType').value;

        // Validation
        if (!productId || !batch || !quantity || !date) {
            alert('Please fill in all required fields');
            return;
        }

        const product = await getProductById(productId);
        if (!product) {
            alert('Selected product not found');
            return;
        }

        const stockData = {
            productId: productId,
            productName: product.name,
            batch: batch,
            quantity: quantity,
            invoice: invoice,
            date: date,
            type: movementType,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Add new stock entry
        const docRef = await db.collection('stock').add(stockData);
        console.log('Stock entry added with ID:', docRef.id);
        
        // Update product stock
        let newStock = product.stock || 0;
        if (movementType === 'purchase' || movementType === 'return') {
            newStock += quantity;
        } else if (movementType === 'adjustment') {
            // For adjustments, quantity could be positive or negative
            newStock += quantity;
        }
        
        await db.collection('products').doc(productId).update({
            stock: newStock,
            updatedAt: new Date()
        });

        showTemporaryMessage('Stock entry added successfully!', 'success');
        hideStockForm();
        await loadProductsAndStock();
        
    } catch (error) {
        console.error('Error saving stock entry:', error);
        showTemporaryMessage('Error saving stock entry: ' + error.message, 'error');
    }
}

// Save Scheme Sale
async function saveSchemeSale() {
    try {
        const productId = document.getElementById('schemeProductSelect').value;
        const stockistName = document.getElementById('stockistName').value;
        const billedQuantity = parseInt(document.getElementById('billedQuantity').value);
        const invoice = document.getElementById('saleInvoice').value;
        const date = document.getElementById('saleDate').value;

        // Validation
        if (!productId || !stockistName || !billedQuantity || !date) {
            alert('Please fill in all required fields');
            return;
        }

        const product = await getProductById(productId);
        if (!product) {
            alert('Selected product not found');
            return;
        }

        // Calculate bonus
        const bonusDetails = calculateBonus(billedQuantity, product.bonus);
        
        const schemeSaleData = {
            productId: productId,
            productName: product.name,
            stockistName: stockistName,
            billedQuantity: billedQuantity,
            freeQuantity: bonusDetails.freeQuantity,
            totalQuantity: bonusDetails.totalQuantity,
            scheme: product.bonus,
            schemeDescription: bonusDetails.description,
            invoice: invoice,
            date: date,
            type: 'scheme_sale',
            stockistPrice: product.stockistPrice,
            totalValue: billedQuantity * product.stockistPrice,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Add scheme sale entry
        const docRef = await db.collection('stock').add(schemeSaleData);
        console.log('Scheme sale recorded with ID:', docRef.id);
        
        // Update product stock (reduce by total quantity)
        const newStock = (product.stock || 0) - bonusDetails.totalQuantity;
        await db.collection('products').doc(productId).update({
            stock: newStock,
            updatedAt: new Date()
        });

        showTemporaryMessage(`Scheme sale recorded! ${bonusDetails.freeQuantity} free units given.`, 'success');
        hideSchemeForm();
        await loadProductsAndStock();
        
    } catch (error) {
        console.error('Error saving scheme sale:', error);
        showTemporaryMessage('Error saving scheme sale: ' + error.message, 'error');
    }
}

// Render Stock Table with filtering
function renderStockTable() {
    if (!stockTableBody) return;
    
    stockTableBody.innerHTML = '';

    if (stockEntries.length === 0) {
        stockTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #6c757d;">
                    <h3>No stock entries found</h3>
                    <p>Click "Add Stock Entry" to create your first stock record</p>
                </td>
            </tr>
        `;
        return;
    }

    // Filter entries based on current tab
    let filteredEntries = stockEntries;
    
    switch (currentTab) {
        case 'low':
            // Show entries for products with low stock
            const lowStockProductIds = products
                .filter(p => p.stock < lowStockThreshold)
                .map(p => p.id);
            filteredEntries = stockEntries.filter(entry => 
                lowStockProductIds.includes(entry.productId)
            );
            break;
            
        case 'scheme':
            // Show only scheme sales
            filteredEntries = stockEntries.filter(entry => 
                entry.type === 'scheme_sale'
            );
            break;
            
        case 'expired':
            // Show entries for near-expiry products
            const today = new Date();
            const expiredProductIds = products.filter(p => {
                if (!p.expiry) return false;
                const expiryDate = new Date(p.expiry);
                return expiryDate < today;
            }).map(p => p.id);
            filteredEntries = stockEntries.filter(entry => 
                expiredProductIds.includes(entry.productId)
            );
            break;
            
        default:
            // 'all' - show all entries
            filteredEntries = stockEntries;
    }

    filteredEntries.forEach(entry => {
        const product = products.find(p => p.id === entry.productId);
        const tr = document.createElement('tr');

        // Apply styling based on conditions
        if (entry.type === 'scheme_sale') {
            tr.classList.add('scheme-sale');
        }
        if (product && product.stock < lowStockThreshold) {
            tr.classList.add('low-stock');
        }

        tr.innerHTML = `
            <td>
                ${entry.productName || 'Unknown'}
                ${entry.scheme ? `<span class="scheme-badge">Scheme</span>` : ''}
            </td>
            <td>${entry.batch || 'N/A'}</td>
            <td>
                ${entry.type === 'scheme_sale' ? 'Scheme Sale' : 
                  entry.type === 'purchase' ? 'Purchase' :
                  entry.type === 'return' ? 'Return' : 'Adjustment'}
                ${entry.stockistName ? `<br><small>to ${entry.stockistName}</small>` : ''}
            </td>
            <td>${entry.billedQuantity || entry.quantity}</td>
            <td>
                ${entry.freeQuantity ? `
                    <span class="free-badge">${entry.freeQuantity} free</span>
                ` : '-'}
            </td>
            <td>${entry.totalQuantity || entry.quantity}</td>
            <td>
                ${entry.type === 'purchase' || entry.type === 'return' ? 
                  `<span style="color: green">+${entry.quantity}</span>` :
                  entry.type === 'scheme_sale' ?
                  `<span style="color: red">-${entry.totalQuantity}</span>` :
                  `<span style="color: orange">${entry.quantity >= 0 ? '+' : ''}${entry.quantity}</span>`}
            </td>
            <td>${entry.invoice || 'N/A'}</td>
            <td>${new Date(entry.date).toLocaleDateString()}</td>
            <td>
                <button class="btn delete-btn" onclick="deleteStockEntry('${entry.id}')">Delete</button>
            </td>
        `;
        stockTableBody.appendChild(tr);
    });
}

// Delete Stock Entry
async function deleteStockEntry(id) {
    if (confirm("Are you sure you want to delete this stock entry? This will affect stock calculations.")) {
        try {
            // Get the entry first to know what we're deleting
            const entry = stockEntries.find(e => e.id === id);
            if (!entry) {
                alert('Entry not found');
                return;
            }

            await db.collection('stock').doc(id).delete();
            console.log('Stock entry deleted:', id);
            
            // Note: In a real system, you might want to recalculate product stock
            // when deleting entries. This is simplified for demo purposes.
            
            showTemporaryMessage('Stock entry deleted successfully!', 'success');
            await loadProductsAndStock();
            
        } catch (error) {
            console.error('Error deleting stock entry:', error);
            showTemporaryMessage('Error deleting stock entry: ' + error.message, 'error');
        }
    }
}

// Show loading state
function showLoadingState() {
    if (stockTableBody) {
        stockTableBody.innerHTML = `
            <tr>
                <td colspan="10" class="loading">
                    <h3>Loading stock data...</h3>
                    <p>Please wait while we load your stock information</p>
                </td>
            </tr>
        `;
    }
}

// Show error message
function showErrorMessage(message) {
    if (stockTableBody) {
        stockTableBody.innerHTML = `
            <tr>
                <td colspan="10" class="error-message">
                    <h3>Error Loading Stock Data</h3>
                    <p>${message}</p>
                    <button class="btn add-btn" onclick="loadProductsAndStock()" style="margin-top: 10px;">Try Again</button>
                </td>
            </tr>
        `;
    }
}

// Temporary message helper (same as in products.js)
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

// Make functions globally available
window.showAddStockForm = showAddStockForm;
window.showSchemeSaleForm = showSchemeSaleForm;
window.hideStockForm = hideStockForm;
window.hideSchemeForm = hideSchemeForm;
window.saveStock = saveStock;
window.saveSchemeSale = saveSchemeSale;
window.deleteStockEntry = deleteStockEntry;
window.switchTab = switchTab;
window.loadProductsAndStock = loadProductsAndStock;

// Stock adjustment form (simplified version)
function showAdjustmentForm() {
    document.getElementById('formTitle').textContent = "Stock Adjustment";
    document.getElementById('stockForm').style.display = 'block';
    document.getElementById('schemeSaleForm').style.display = 'none';
    
    // Clear form and set type to adjustment
    document.getElementById('stockId').value = '';
    ['batch', 'invoice', 'date'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    document.getElementById('quantity').value = '';
    document.getElementById('quantity').placeholder = 'Adjustment Quantity (+/-)';
    if (productSelect) productSelect.value = '';
    if (document.getElementById('movementType')) {
        document.getElementById('movementType').value = 'adjustment';
    }
}

console.log('📊 Stock module loaded successfully!');