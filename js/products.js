// Products Management Module
console.log('🎯 Products module loading...');

// Export for navigation system
window.initializeProductsModule = async function() {
    console.log('🚀 Products module initializing...');
    
    try {
        // Wait for Firebase
        await waitForFirebase();
        
        // DOM Elements
        const productForm = document.getElementById('product-form');
        if (!productForm) {
            console.log('❌ Not on products page');
            return;
        }

        console.log('✅ On products page, setting up...');
        setupProductsModule();
        
    } catch (error) {
        console.error('❌ Products module initialization failed:', error);
        setupProductsFallback();
    }
};

// Wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        const checkFirebase = () => {
            if (window.db) {
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Main products module setup
function setupProductsModule() {
    // DOM Elements
    const productForm = document.getElementById('product-form');
    const productNameInput = document.getElementById('product-name');
    const compositionInput = document.getElementById('composition');
    const categoryInput = document.getElementById('category');
    const packSizeInput = document.getElementById('pack-size');
    const mrpInput = document.getElementById('mrp');
    const purchasePriceInput = document.getElementById('purchase-price');
    const gstInput = document.getElementById('gst');
    const stockInput = document.getElementById('stock');
    const offerInput = document.getElementById('offer');
    const saveProductBtn = document.getElementById('save-product');
    const productsTableBody = document.getElementById('products-table-body');
    const searchInput = document.getElementById('search-product');

    // State
    let currentProductId = null;
    let products = [];

    // Event Listeners
    productForm.addEventListener('submit', handleProductSubmit);
    if (searchInput) searchInput.addEventListener('input', filterProducts);

    // Load products
    loadProducts();

    // Handle form submission
    function handleProductSubmit(e) {
        e.preventDefault();
        
        const productData = {
            name: productNameInput.value.trim(),
            composition: compositionInput.value.trim(),
            category: categoryInput.value,
            packSize: packSizeInput.value.trim(),
            mrp: parseFloat(mrpInput.value) || 0,
            purchasePrice: parseFloat(purchasePriceInput.value) || 0,
            gst: parseFloat(gstInput.value) || 0,
            stock: parseInt(stockInput.value) || 0,
            offer: offerInput.value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add createdAt for new products
        if (!currentProductId) {
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }

        saveProduct(productData);
    }

    // Save product to Firestore
    function saveProduct(productData) {
        if (!saveProductBtn) return;

        const originalText = saveProductBtn.textContent;
        saveProductBtn.disabled = true;
        saveProductBtn.textContent = 'Saving...';

        try {
            if (currentProductId) {
                // Update existing product
                db.collection('products').doc(currentProductId).update(productData)
                    .then(() => {
                        showMessage('Product updated successfully!', 'success');
                        resetForm();
                    })
                    .catch(handleFirestoreError)
                    .finally(resetButton);
            } else {
                // Add new product
                db.collection('products').add(productData)
                    .then(() => {
                        showMessage('Product added successfully!', 'success');
                        resetForm();
                    })
                    .catch(handleFirestoreError)
                    .finally(resetButton);
            }
        } catch (error) {
            handleFirestoreError(error);
            resetButton();
        }

        function resetButton() {
            saveProductBtn.disabled = false;
            saveProductBtn.textContent = originalText;
        }
    }

    // Load products from Firestore
    function loadProducts() {
        if (!db) {
            console.error('Firestore not available');
            return;
        }

        db.collection('products').orderBy('name').onSnapshot(
            (snapshot) => {
                products = [];
                if (productsTableBody) {
                    productsTableBody.innerHTML = '';
                }

                snapshot.forEach((doc) => {
                    const product = {
                        id: doc.id,
                        ...doc.data()
                    };
                    products.push(product);
                    renderProductRow(product);
                });

                console.log(`📦 Loaded ${products.length} products`);
            },
            (error) => {
                console.error('Error loading products:', error);
                showMessage('Error loading products: ' + error.message, 'error');
            }
        );
    }

    // Render product row in table
    function renderProductRow(product) {
        if (!productsTableBody) return;

        const row = document.createElement('tr');
        
        // Highlight products with offers
        if (product.offer) {
            row.classList.add('bg-yellow-50');
        }

        // Highlight low stock
        if (product.stock < 10) {
            row.classList.add('bg-red-50');
        }

        row.innerHTML = `
            <td class="px-4 py-3 font-medium">${escapeHtml(product.name)}</td>
            <td class="px-4 py-3">${escapeHtml(product.composition || '-')}</td>
            <td class="px-4 py-3">${product.category || '-'}</td>
            <td class="px-4 py-3">${product.packSize || '-'}</td>
            <td class="px-4 py-3">₹${(product.mrp || 0).toFixed(2)}</td>
            <td class="px-4 py-3">₹${(product.purchasePrice || 0).toFixed(2)}</td>
            <td class="px-4 py-3">${product.gst || 0}%</td>
            <td class="px-4 py-3 font-medium ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}">
                ${product.stock || 0}
            </td>
            <td class="px-4 py-3">${escapeHtml(product.offer || '-')}</td>
            <td class="px-4 py-3 space-x-2">
                <button onclick="editProduct('${product.id}')" class="text-blue-600 hover:text-blue-900">Edit</button>
                <button onclick="deleteProduct('${product.id}')" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;

        productsTableBody.appendChild(row);
    }

    // Edit product
    window.editProduct = function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Populate form
        productNameInput.value = product.name || '';
        compositionInput.value = product.composition || '';
        categoryInput.value = product.category || '';
        packSizeInput.value = product.packSize || '';
        mrpInput.value = product.mrp || '';
        purchasePriceInput.value = product.purchasePrice || '';
        gstInput.value = product.gst || '';
        stockInput.value = product.stock || '';
        offerInput.value = product.offer || '';

        // Update UI for edit mode
        currentProductId = productId;
        document.getElementById('form-title').textContent = 'Edit Product';
        saveProductBtn.textContent = 'Update Product';
        
        // Show cancel button if exists
        const cancelBtn = document.getElementById('cancel-edit');
        if (cancelBtn) cancelBtn.classList.remove('hidden');

        // Scroll to form
        productForm.scrollIntoView({ behavior: 'smooth' });
    };

    // Delete product
    window.deleteProduct = function(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        db.collection('products').doc(productId).delete()
            .then(() => {
                showMessage('Product deleted successfully!', 'success');
            })
            .catch(handleFirestoreError);
    };

    // Filter products
    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = productsTableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const productName = row.cells[0].textContent.toLowerCase();
            if (productName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Reset form
    function resetForm() {
        productForm.reset();
        currentProductId = null;
        document.getElementById('form-title').textContent = 'Add New Product';
        saveProductBtn.textContent = 'Save Product';
        
        const cancelBtn = document.getElementById('cancel-edit');
        if (cancelBtn) cancelBtn.classList.add('hidden');
    }

    // Handle Firestore errors
    function handleFirestoreError(error) {
        console.error('Firestore error:', error);
        showMessage('Error: ' + error.message, 'error');
    }

    // Show message
    function showMessage(message, type) {
        // Simple alert - you can replace with toast notifications
        alert(type === 'error' ? 'Error: ' + message : message);
    }

    // Escape HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    console.log('✅ Products module setup complete');
}

// Fallback mode (if Firebase fails)
function setupProductsFallback() {
    console.log('🔄 Setting up products in fallback mode');
    
    const contentArea = document.getElementById('content');
    if (!contentArea) return;

    contentArea.innerHTML += `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>
                <div>
                    <p class="text-yellow-800">Running in demo mode. Data will not be saved permanently.</p>
                </div>
            </div>
        </div>
    `;

    // Basic form handling without Firebase
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const productName = document.getElementById('product-name').value;
            alert(`Product "${productName}" would be saved to Firebase in production mode!`);
            this.reset();
        });
    }
}

// Auto-initialize if on products page
if (document.getElementById('product-form')) {
    document.addEventListener('DOMContentLoaded', function() {
        window.initializeProductsModule();
    });
}

console.log('✅ Products module loaded');