// Products Management Module
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const productForm = document.getElementById('product-form');
    const productNameInput = document.getElementById('product-name');
    const compositionInput = document.getElementById('composition');
    const mrpInput = document.getElementById('mrp');
    const retailerPriceInput = document.getElementById('retailer-price');
    const stockistPriceInput = document.getElementById('stockist-price');
    const gstInput = document.getElementById('gst');
    const offerInput = document.getElementById('offer');
    const bonusNotesInput = document.getElementById('bonus-notes');
    const saveProductBtn = document.getElementById('save-product');
    const resetFormBtn = document.getElementById('reset-form');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const searchInput = document.getElementById('search-product');
    const productsTableBody = document.getElementById('products-table-body');
    const formTitle = document.getElementById('form-title');
    
    // Error message elements
    const nameError = document.getElementById('name-error');
    const mrpError = document.getElementById('mrp-error');
    
    // State variables
    let currentProductId = null;
    let isEditing = false;
    let products = [];
    
    // Initialize the module
    function init() {
        setupEventListeners();
        loadProducts();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Form submission
        productForm.addEventListener('submit', handleFormSubmit);
        
        // MRP input change - calculate prices
        mrpInput.addEventListener('input', calculatePrices);
        
        // Reset form
        resetFormBtn.addEventListener('click', resetForm);
        
        // Cancel edit
        cancelEditBtn.addEventListener('click', cancelEdit);
        
        // Search functionality
        searchInput.addEventListener('input', filterProducts);
    }
    
    // Calculate retailer and stockist prices based on MRP
    function calculatePrices() {
        const mrp = parseFloat(mrpInput.value) || 0;
        
        if (mrp > 0) {
            const retailerPrice = mrp * 0.8;
            const stockistPrice = retailerPrice * 0.9;
            
            retailerPriceInput.value = retailerPrice.toFixed(2);
            stockistPriceInput.value = stockistPrice.toFixed(2);
        } else {
            retailerPriceInput.value = '';
            stockistPriceInput.value = '';
        }
    }
    
    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Get form data
        const productData = {
            name: productNameInput.value.trim(),
            composition: compositionInput.value.trim(),
            mrp: parseFloat(mrpInput.value),
            retailerPrice: parseFloat(retailerPriceInput.value),
            stockistPrice: parseFloat(stockistPriceInput.value),
            gst: gstInput.value ? parseFloat(gstInput.value) : 0,
            offer: offerInput.value.trim(),
            bonusNotes: bonusNotesInput.value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add createdAt for new products
        if (!isEditing) {
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Save to Firestore
        saveProduct(productData);
    }
    
    // Validate form inputs
    function validateForm() {
        let isValid = true;
        
        // Clear previous errors
        nameError.textContent = '';
        mrpError.textContent = '';
        
        // Validate product name
        if (!productNameInput.value.trim()) {
            nameError.textContent = 'Product name is required';
            isValid = false;
        }
        
        // Validate MRP
        if (!mrpInput.value || parseFloat(mrpInput.value) <= 0) {
            mrpError.textContent = 'Valid MRP is required';
            isValid = false;
        }
        
        return isValid;
    }
    
    // Save product to Firestore
    function saveProduct(productData) {
        saveProductBtn.disabled = true;
        saveProductBtn.textContent = 'Saving...';
        
        try {
            if (isEditing && currentProductId) {
                // Update existing product
                db.collection('products').doc(currentProductId).update(productData)
                    .then(() => {
                        showMessage('Product updated successfully', 'success');
                        resetForm();
                    })
                    .catch(error => {
                        console.error('Error updating product: ', error);
                        showMessage('Error updating product: ' + error.message, 'error');
                    })
                    .finally(() => {
                        saveProductBtn.disabled = false;
                        saveProductBtn.textContent = 'Update Product';
                    });
            } else {
                // Add new product
                db.collection('products').add(productData)
                    .then(() => {
                        showMessage('Product added successfully', 'success');
                        resetForm();
                    })
                    .catch(error => {
                        console.error('Error adding product: ', error);
                        showMessage('Error adding product: ' + error.message, 'error');
                    })
                    .finally(() => {
                        saveProductBtn.disabled = false;
                        saveProductBtn.textContent = 'Save Product';
                    });
            }
        } catch (error) {
            console.error('Error in saveProduct: ', error);
            showMessage('Error: ' + error.message, 'error');
            saveProductBtn.disabled = false;
            saveProductBtn.textContent = isEditing ? 'Update Product' : 'Save Product';
        }
    }
    
    // Load products from Firestore with real-time updates
    function loadProducts() {
        try {
            db.collection('products').orderBy('name').onSnapshot(snapshot => {
                products = [];
                productsTableBody.innerHTML = '';
                
                snapshot.forEach(doc => {
                    const product = {
                        id: doc.id,
                        ...doc.data()
                    };
                    products.push(product);
                    renderProductRow(product);
                });
            }, error => {
                console.error('Error loading products: ', error);
                showMessage('Error loading products: ' + error.message, 'error');
            });
        } catch (error) {
            console.error('Error in loadProducts: ', error);
            showMessage('Error: ' + error.message, 'error');
        }
    }
    
    // Render a product row in the table
    function renderProductRow(product) {
        const row = document.createElement('tr');
        
        // Add highlight class if product has an offer
        if (product.offer) {
            row.classList.add('offer-highlight');
        }
        
        row.innerHTML = `
            <td>${escapeHtml(product.name)}</td>
            <td>${escapeHtml(product.composition || '-')}</td>
            <td>${product.mrp ? product.mrp.toFixed(2) : '0.00'}</td>
            <td>${product.retailerPrice ? product.retailerPrice.toFixed(2) : '0.00'}</td>
            <td>${product.stockistPrice ? product.stockistPrice.toFixed(2) : '0.00'}</td>
            <td>${product.gst || '0'}</td>
            <td>${escapeHtml(product.offer || '-')}</td>
            <td class="action-cell">
                <button class="btn btn-primary btn-edit" data-id="${product.id}">Edit</button>
                <button class="btn btn-danger btn-delete" data-id="${product.id}">Delete</button>
            </td>
        `;
        
        productsTableBody.appendChild(row);
        
        // Add event listeners to the buttons
        row.querySelector('.btn-edit').addEventListener('click', () => editProduct(product.id));
        row.querySelector('.btn-delete').addEventListener('click', () => deleteProduct(product.id));
    }
    
    // Edit product
    function editProduct(productId) {
        try {
            db.collection('products').doc(productId).get()
                .then(doc => {
                    if (doc.exists) {
                        const product = doc.data();
                        
                        // Populate form with product data
                        productNameInput.value = product.name || '';
                        compositionInput.value = product.composition || '';
                        mrpInput.value = product.mrp || '';
                        calculatePrices(); // This will set retailer and stockist prices
                        gstInput.value = product.gst || '';
                        offerInput.value = product.offer || '';
                        bonusNotesInput.value = product.bonusNotes || '';
                        
                        // Update UI for editing mode
                        currentProductId = productId;
                        isEditing = true;
                        formTitle.textContent = 'Edit Product';
                        saveProductBtn.textContent = 'Update Product';
                        cancelEditBtn.classList.remove('hidden');
                        
                        // Scroll to form
                        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
                    } else {
                        showMessage('Product not found', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error getting product: ', error);
                    showMessage('Error loading product: ' + error.message, 'error');
                });
        } catch (error) {
            console.error('Error in editProduct: ', error);
            showMessage('Error: ' + error.message, 'error');
        }
    }
    
    // Delete product with confirmation
    function deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            try {
                db.collection('products').doc(productId).delete()
                    .then(() => {
                        showMessage('Product deleted successfully', 'success');
                    })
                    .catch(error => {
                        console.error('Error deleting product: ', error);
                        showMessage('Error deleting product: ' + error.message, 'error');
                    });
            } catch (error) {
                console.error('Error in deleteProduct: ', error);
                showMessage('Error: ' + error.message, 'error');
            }
        }
    }
    
    // Cancel edit and reset form
    function cancelEdit() {
        resetForm();
    }
    
    // Reset form to initial state
    function resetForm() {
        productForm.reset();
        currentProductId = null;
        isEditing = false;
        formTitle.textContent = 'Add New Product';
        saveProductBtn.textContent = 'Save Product';
        cancelEditBtn.classList.add('hidden');
        
        // Clear error messages
        nameError.textContent = '';
        mrpError.textContent = '';
        
        // Clear calculated prices
        retailerPriceInput.value = '';
        stockistPriceInput.value = '';
    }
    
    // Filter products by name
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
    
    // Show message to user
    function showMessage(message, type) {
        // You can implement a toast notification system here
        // For now, using alert as a simple solution
        if (type === 'error') {
            alert('Error: ' + message);
        } else {
            alert(message);
        }
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Initialize the module
    init();
});