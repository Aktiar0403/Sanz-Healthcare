// js/products.js - COMPLETE FIREBASE VERSION
console.log('📦 Loading products module...');

// Global variables
let products = [];
let editMode = false;

// DOM elements
const container = document.getElementById('productContainer');
const totalSupplierElem = document.getElementById('totalSupplier');
const totalCNFElem = document.getElementById('totalCNF');
const totalDeliveryElem = document.getElementById('totalDelivery');
const grandTotalElem = document.getElementById('grandTotal');

// CNF and delivery charges
const cnfCharge = 5000;
const deliveryCharge = 2000;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not available');
        showErrorMessage('Firebase not loaded. Please refresh the page.');
        return;
    }
    
    console.log('Firebase available, loading products...');
    loadProducts();
});

// Load products from Firestore
async function loadProducts() {
    try {
        showLoadingState();
        console.log('Loading products from Firestore...');
        
        const snapshot = await firebase.firestore().collection('products').get();
        
        products = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            products.push({ 
                id: doc.id, 
                name: data.name || 'Unnamed Product',
                batch: data.batch || 'N/A',
                expiry: data.expiry || '',
                mrp: data.mrp || 0,
                gst: data.gst || 0,
                retailerPrice: data.retailerPrice || 0,
                stockistPrice: data.stockistPrice || 0,
                supplierPrice: data.supplierPrice || 0,
                bonus: data.bonus || '',
                stock: data.stock || 0,
                category: data.category || '',
                description: data.description || 'No description available',
                createdAt: data.createdAt || new Date(),
                updatedAt: data.updatedAt || new Date()
            });
        });
        
        console.log(`Loaded ${products.length} products from Firestore`);
        renderProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showErrorMessage('Failed to load products: ' + error.message);
    }
}

// Render products to the page
function renderProducts() {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
                <h3>No products found</h3>
                <p>Click "Add New Product" to create your first product</p>
            </div>
        `;
        updateSummary();
        return;
    }
    
    let totalSupplier = 0;

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'card';
       // In your renderProducts function in products.js, update the card HTML:
card.innerHTML = `
    ${product.bonus ? `<div class="bonus">${product.bonus}</div>` : ''}
    <div class="product-name">
        ${product.name}
        ${product.bonus ? `<span class="scheme-badge">Scheme</span>` : ''}
    </div>
    ${product.composition ? `<div class="product-composition">${product.composition}</div>` : ''}
    <div class="description">${product.description}</div>
    ${product.packing ? `<div class="product-packing">${product.packing}</div>` : ''}
    <div class="price">MRP: ₹${product.mrp.toFixed(2)}</div>
    <div class="price">Retailer: ₹${product.retailerPrice.toFixed(2)}</div>
    <div class="price">Stockist: ₹${product.stockistPrice.toFixed(2)}</div>
    <div class="supplier">Supplier: ₹${product.supplierPrice.toFixed(2)}</div>
    <div class="gst">GST: ${product.gst}%</div>
    <div class="stock">Stock: ${product.stock}</div>
    <div class="batch">Batch: ${product.batch}</div>
    <div class="expiry">Expiry: ${product.expiry || 'N/A'}</div>
    <div class="category">Category: ${product.category || 'General'}</div>
    <div style="margin-top: 15px;">
        <button class="btn edit-btn" onclick="editProduct('${product.id}')">Edit</button>
        <button class="btn delete-btn" onclick="deleteProduct('${product.id}')">Delete</button>
    </div>
`;
        container.appendChild(card);
        totalSupplier += product.supplierPrice * product.stock;
    });

    updateSummary(totalSupplier);
}

// Update summary calculations
function updateSummary(totalSupplier = 0) {
    if (totalSupplierElem) {
        totalSupplierElem.textContent = totalSupplier.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    if (totalCNFElem) {
        totalCNFElem.textContent = cnfCharge.toLocaleString('en-IN');
    }
    if (totalDeliveryElem) {
        totalDeliveryElem.textContent = deliveryCharge.toLocaleString('en-IN');
    }
    if (grandTotalElem) {
        const grandTotal = totalSupplier + cnfCharge + deliveryCharge;
        grandTotalElem.textContent = grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
}

// Show Add Product Form
function showAddForm() {
    editMode = false;
    document.getElementById('formTitle').textContent = "Add Product";
    document.getElementById('productForm').style.display = 'block';
    document.getElementById('productId').value = '';
    
    // Clear all form fields
    const fields = ['name', 'batch', 'expiry', 'mrp', 'gst', 'retailerPrice', 'stockistPrice', 'supplierPrice', 'bonus', 'stock', 'category', 'description'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.value = '';
    });
}

// Hide Form
function hideForm() {
    document.getElementById('productForm').style.display = 'none';
}

// Save Product (Add or Update)
async function saveProduct() {
    try {
        const productId = document.getElementById('productId').value;
        const productData = {
            name: document.getElementById('name').value,
            batch: document.getElementById('batch').value,
            expiry: document.getElementById('expiry').value,
            mrp: parseFloat(document.getElementById('mrp').value) || 0,
            gst: parseFloat(document.getElementById('gst').value) || 0,
            retailerPrice: parseFloat(document.getElementById('retailerPrice').value) || 0,
            stockistPrice: parseFloat(document.getElementById('stockistPrice').value) || 0,
            supplierPrice: parseFloat(document.getElementById('supplierPrice').value) || 0,
            bonus: document.getElementById('bonus').value,
            stock: parseInt(document.getElementById('stock').value) || 0,
            category: document.getElementById('category').value,
            description: document.getElementById('description').value,
            updatedAt: new Date()
        };

        // Validate required fields
        if (!productData.name || !productData.batch) {
            alert('Please fill in Product Name and Batch (required fields)');
            return;
        }

        if (editMode && productId) {
            // Update existing product
            await firebase.firestore().collection('products').doc(productId).update(productData);
            console.log('Product updated:', productId);
            showTemporaryMessage('Product updated successfully!', 'success');
        } else {
            // Add new product
            productData.createdAt = new Date();
            const docRef = await firebase.firestore().collection('products').add(productData);
            console.log('Product added with ID:', docRef.id);
            showTemporaryMessage('Product added successfully!', 'success');
        }

        hideForm();
        await loadProducts(); // Reload to get fresh data
        
    } catch (error) {
        console.error('Error saving product:', error);
        showTemporaryMessage('Error saving product: ' + error.message, 'error');
    }
}

// Edit Product
async function editProduct(id) {
    try {
        const product = products.find(p => p.id === id);
        if (!product) {
            alert('Product not found');
            return;
        }
        
        editMode = true;
        document.getElementById('formTitle').textContent = "Edit Product";
        document.getElementById('productForm').style.display = 'block';
        document.getElementById('productId').value = product.id;
        
        // Fill form with product data
        document.getElementById('name').value = product.name || '';
        document.getElementById('batch').value = product.batch || '';
        document.getElementById('expiry').value = product.expiry || '';
        document.getElementById('mrp').value = product.mrp || '';
        document.getElementById('gst').value = product.gst || '';
        document.getElementById('retailerPrice').value = product.retailerPrice || '';
        document.getElementById('stockistPrice').value = product.stockistPrice || '';
        document.getElementById('supplierPrice').value = product.supplierPrice || '';
        document.getElementById('bonus').value = product.bonus || '';
        document.getElementById('stock').value = product.stock || '';
        document.getElementById('category').value = product.category || '';
        document.getElementById('description').value = product.description || '';
        
    } catch (error) {
        console.error('Error editing product:', error);
        showTemporaryMessage('Error editing product: ' + error.message, 'error');
    }
}

// Delete Product
async function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const confirmation = confirm(
        `Are you sure you want to delete "${product.name}" (Batch: ${product.batch})?\n\n` +
        `Stock: ${product.stock} units\n` +
        `This action cannot be undone!`
    );
    
    if (confirmation) {
        try {
            await firebase.firestore().collection('products').doc(id).delete();
            console.log('Product deleted:', id);
            showTemporaryMessage('Product deleted successfully!', 'success');
            await loadProducts();
            
        } catch (error) {
            console.error('Error deleting product:', error);
            showTemporaryMessage('Error deleting product: ' + error.message, 'error');
        }
    }
}

// Show loading state
function showLoadingState() {
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <h3>Loading products...</h3>
                <p>Please wait while we load your product catalog</p>
            </div>
        `;
    }
}

// Show error message
function showErrorMessage(message) {
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Products</h3>
                <p>${message}</p>
                <button class="btn add-btn" onclick="loadProducts()" style="margin-top: 10px;">Try Again</button>
            </div>
        `;
    }
}

// Temporary message helper
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

// Global helper function for other modules
window.getProductById = async function(productId) {
    try {
        const doc = await firebase.firestore().collection('products').doc(productId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};

// Make functions globally available
window.showAddForm = showAddForm;
window.hideForm = hideForm;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.loadProducts = loadProducts;