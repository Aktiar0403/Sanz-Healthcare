// Stock Management Module for Sanj Healthcare App
// Using Firebase Firestore v8

// Global variables
let products = [];
let customers = [];
let stockItems = [];
let filteredStockItems = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeStockModule();
});

function initializeStockModule() {
    // Set today's date as default for date fields
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('purchase-date').value = today;
    document.getElementById('sales-date').value = today;
    
    // Set up collapsible sections
    setupCollapsibleSections();
    
    // Load initial data
    loadProducts();
    loadCustomers();
    loadStockData();
    
    // Set up event listeners
    document.getElementById('purchase-form').addEventListener('submit', handlePurchaseSubmit);
    document.getElementById('sales-form').addEventListener('submit', handleSalesSubmit);
    document.getElementById('sales-product').addEventListener('change', updateBatchOptions);
    document.getElementById('stock-search').addEventListener('input', filterStockTable);
    document.getElementById('export-btn').addEventListener('click', exportStockToCSV);
}

// Set up collapsible sections
function setupCollapsibleSections() {
    const sections = [
        { header: 'purchase-header', content: 'purchase-content' },
        { header: 'sales-header', content: 'sales-content' },
        { header: 'summary-header', content: 'summary-content' }
    ];
    
    sections.forEach(section => {
        const header = document.getElementById(section.header);
        const content = document.getElementById(section.content);
        
        header.addEventListener('click', () => {
            content.classList.toggle('hidden');
            header.classList.toggle('collapsed');
        });
    });
}

// Load products from Firestore
function loadProducts() {
    db.collection("products").get()
        .then((querySnapshot) => {
            products = [];
            const purchaseSelect = document.getElementById('purchase-product');
            const salesSelect = document.getElementById('sales-product');
            
            // Clear existing options (except the first one)
            purchaseSelect.innerHTML = '<option value="">Select Product</option>';
            salesSelect.innerHTML = '<option value="">Select Product</option>';
            
            querySnapshot.forEach((doc) => {
                const product = {
                    id: doc.id,
                    ...doc.data()
                };
                products.push(product);
                
                // Add to dropdowns
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = product.name;
                option.setAttribute('data-retailer-price', product.retailerPrice || 0);
                
                purchaseSelect.appendChild(option.cloneNode(true));
                salesSelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error("Error loading products: ", error);
            showAlert("Error loading products. Please refresh the page.", "danger");
        });
}

// Load customers from Firestore
function loadCustomers() {
    db.collection("customers").get()
        .then((querySnapshot) => {
            customers = [];
            const customerSelect = document.getElementById('sales-customer');
            
            // Clear existing options (except the first one)
            customerSelect.innerHTML = '<option value="">Select Customer</option>';
            
            querySnapshot.forEach((doc) => {
                const customer = {
                    id: doc.id,
                    ...doc.data()
                };
                customers.push(customer);
                
                // Add to dropdown
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = customer.name || customer.companyName || 'Unknown Customer';
                customerSelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error("Error loading customers: ", error);
            showAlert("Error loading customers. Please refresh the page.", "danger");
        });
}

// Load stock data from Firestore with real-time updates
function loadStockData() {
    db.collection("stock").onSnapshot((querySnapshot) => {
        stockItems = [];
        const tableBody = document.getElementById('stock-table-body');
        
        // Clear loading message
        tableBody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const stockItem = {
                id: doc.id,
                ...doc.data()
            };
            stockItems.push(stockItem);
        });
        
        // Update filtered items and display
        filteredStockItems = [...stockItems];
        displayStockTable();
    }, (error) => {
        console.error("Error loading stock data: ", error);
        showAlert("Error loading stock data. Please refresh the page.", "danger");
    });
}

// Display stock data in table
function displayStockTable() {
    const tableBody = document.getElementById('stock-table-body');
    
    if (filteredStockItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading">No stock items found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    filteredStockItems.forEach(item => {
        const row = document.createElement('tr');
        
        // Apply styling for low stock
        if (item.quantity <= 5) {
            row.classList.add('critical-stock');
        } else if (item.quantity <= 10) {
            row.classList.add('low-stock');
        }
        
        // Format dates
        const lastUpdated = item.lastUpdated ? 
            new Date(item.lastUpdated.toDate()).toLocaleDateString() : 'N/A';
        
        // Calculate stock value
        const stockValue = (item.quantity * (item.salePrice || 0)).toFixed(2);
        
        row.innerHTML = `
            <td>${item.productName || 'Unknown Product'}</td>
            <td>${item.batchNo || 'N/A'}</td>
            <td>${item.quantity || 0}</td>
            <td>₹${(item.purchasePrice || 0).toFixed(2)}</td>
            <td>₹${(item.salePrice || 0).toFixed(2)}</td>
            <td>₹${stockValue}</td>
            <td>${item.supplier || 'N/A'}</td>
            <td>${lastUpdated}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Update batch options based on selected product
function updateBatchOptions() {
    const productId = document.getElementById('sales-product').value;
    const batchSelect = document.getElementById('sales-batch');
    
    // Clear existing options
    batchSelect.innerHTML = '<option value="">Select Batch</option>';
    
    if (!productId) return;
    
    // Find batches for the selected product
    const productBatches = stockItems.filter(item => 
        item.productId === productId && item.quantity > 0
    );
    
    if (productBatches.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No batches available';
        option.disabled = true;
        batchSelect.appendChild(option);
        return;
    }
    
    // Add batch options
    productBatches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch.batchNo;
        option.textContent = `${batch.batchNo} (Available: ${batch.quantity})`;
        option.setAttribute('data-purchase-price', batch.purchasePrice || 0);
        option.setAttribute('data-sale-price', batch.salePrice || 0);
        batchSelect.appendChild(option);
    });
    
    // Auto-set sale price based on selected batch
    batchSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption && selectedOption.value) {
            const salePrice = selectedOption.getAttribute('data-sale-price');
            document.getElementById('sales-price').value = salePrice;
        }
    });
}

// Handle purchase form submission
function handlePurchaseSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('purchase-product').value;
    const batchNo = document.getElementById('purchase-batch').value;
    const quantity = parseInt(document.getElementById('purchase-quantity').value);
    const purchasePrice = parseFloat(document.getElementById('purchase-price').value);
    const supplier = document.getElementById('purchase-supplier').value;
    const purchaseDate = document.getElementById('purchase-date').value;
    const invoiceNo = document.getElementById('purchase-invoice').value;
    
    // Validate form
    if (!productId || !batchNo || !quantity || !purchasePrice || !supplier || !purchaseDate) {
        showAlert("Please fill in all required fields.", "danger");
        return;
    }
    
    // Find selected product
    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
        showAlert("Selected product not found.", "danger");
        return;
    }
    
    // Calculate default sale price (20% markup by default)
    const salePrice = selectedProduct.retailerPrice || (purchasePrice * 1.2);
    
    // Check if stock item already exists with same product and batch
    const existingStockItem = stockItems.find(item => 
        item.productId === productId && item.batchNo === batchNo
    );
    
    if (existingStockItem) {
        // Update existing stock item
        const newQuantity = existingStockItem.quantity + quantity;
        
        db.collection("stock").doc(existingStockItem.id).update({
            quantity: newQuantity,
            purchasePrice: purchasePrice,
            salePrice: salePrice,
            supplier: supplier,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            // Add finance record for purchase
            addFinanceRecord(
                "Expense",
                "Stock Purchase",
                quantity * purchasePrice,
                `Purchase of ${quantity} units of ${selectedProduct.name} (Batch: ${batchNo})`,
                purchaseDate
            );
            
            showAlert("Purchase added successfully! Stock quantity updated.", "success");
            document.getElementById('purchase-form').reset();
            document.getElementById('purchase-date').value = new Date().toISOString().split('T')[0];
        })
        .catch((error) => {
            console.error("Error updating stock: ", error);
            showAlert("Error updating stock. Please try again.", "danger");
        });
    } else {
        // Create new stock item
        db.collection("stock").add({
            productId: productId,
            productName: selectedProduct.name,
            batchNo: batchNo,
            quantity: quantity,
            purchasePrice: purchasePrice,
            salePrice: salePrice,
            supplier: supplier,
            purchaseDate: purchaseDate,
            invoiceNo: invoiceNo,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            // Add finance record for purchase
            addFinanceRecord(
                "Expense",
                "Stock Purchase",
                quantity * purchasePrice,
                `Purchase of ${quantity} units of ${selectedProduct.name} (Batch: ${batchNo})`,
                purchaseDate
            );
            
            showAlert("Purchase added successfully!", "success");
            document.getElementById('purchase-form').reset();
            document.getElementById('purchase-date').value = new Date().toISOString().split('T')[0];
        })
        .catch((error) => {
            console.error("Error adding purchase: ", error);
            showAlert("Error adding purchase. Please try again.", "danger");
        });
    }
}

// Handle sales form submission
function handleSalesSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('sales-product').value;
    const batchNo = document.getElementById('sales-batch').value;
    const quantity = parseInt(document.getElementById('sales-quantity').value);
    const salePrice = parseFloat(document.getElementById('sales-price').value);
    const customerId = document.getElementById('sales-customer').value;
    const saleDate = document.getElementById('sales-date').value;
    const reference = document.getElementById('sales-reference').value;
    
    // Validate form
    if (!productId || !batchNo || !quantity || !salePrice || !customerId || !saleDate) {
        showAlert("Please fill in all required fields.", "danger");
        return;
    }
    
    // Find selected product and customer
    const selectedProduct = products.find(p => p.id === productId);
    const selectedCustomer = customers.find(c => c.id === customerId);
    
    if (!selectedProduct) {
        showAlert("Selected product not found.", "danger");
        return;
    }
    
    if (!selectedCustomer) {
        showAlert("Selected customer not found.", "danger");
        return;
    }
    
    // Find stock item
    const stockItem = stockItems.find(item => 
        item.productId === productId && item.batchNo === batchNo
    );
    
    if (!stockItem) {
        showAlert("Selected batch not found in stock.", "danger");
        return;
    }
    
    // Check if enough stock is available
    if (stockItem.quantity < quantity) {
        showAlert(`Insufficient stock! Only ${stockItem.quantity} units available.`, "danger");
        return;
    }
    
    // Calculate new quantity
    const newQuantity = stockItem.quantity - quantity;
    
    // Update stock
    db.collection("stock").doc(stockItem.id).update({
        quantity: newQuantity,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // Add finance record for sale
        addFinanceRecord(
            "Revenue",
            "Product Sale",
            quantity * salePrice,
            `Sale of ${quantity} units of ${selectedProduct.name} to ${selectedCustomer.name || selectedCustomer.companyName} (Batch: ${batchNo})`,
            saleDate
        );
        
        // Optionally, record sale details in a sales collection
        db.collection("sales").add({
            productId: productId,
            productName: selectedProduct.name,
            batchNo: batchNo,
            quantity: quantity,
            salePrice: salePrice,
            totalAmount: quantity * salePrice,
            customerId: customerId,
            customerName: selectedCustomer.name || selectedCustomer.companyName,
            saleDate: saleDate,
            reference: reference,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert("Sale recorded successfully!", "success");
        document.getElementById('sales-form').reset();
        document.getElementById('sales-date').value = new Date().toISOString().split('T')[0];
        updateBatchOptions(); // Refresh batch options
    })
    .catch((error) => {
        console.error("Error recording sale: ", error);
        showAlert("Error recording sale. Please try again.", "danger");
    });
}

// Add finance record
function addFinanceRecord(type, category, amount, description, date) {
    db.collection("finance").add({
        type: type,
        category: category,
        amount: amount,
        description: description,
        date: date,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .catch((error) => {
        console.error("Error adding finance record: ", error);
    });
}

// Filter stock table based on search input
function filterStockTable() {
    const searchTerm = document.getElementById('stock-search').value.toLowerCase();
    
    if (!searchTerm) {
        filteredStockItems = [...stockItems];
    } else {
        filteredStockItems = stockItems.filter(item => 
            (item.productName && item.productName.toLowerCase().includes(searchTerm)) ||
            (item.batchNo && item.batchNo.toLowerCase().includes(searchTerm))
        );
    }
    
    displayStockTable();
}

// Export stock data to CSV
function exportStockToCSV() {
    if (filteredStockItems.length === 0) {
        showAlert("No data to export.", "danger");
        return;
    }
    
    // Create CSV header
    let csvContent = "Product Name,Batch No.,Available Quantity,Purchase Rate,Sale Rate,Stock Value,Supplier,Last Updated\n";
    
    // Add data rows
    filteredStockItems.forEach(item => {
        const lastUpdated = item.lastUpdated ? 
            new Date(item.lastUpdated.toDate()).toLocaleDateString() : 'N/A';
        const stockValue = (item.quantity * (item.salePrice || 0)).toFixed(2);
        
        const row = [
            `"${item.productName || 'Unknown Product'}"`,
            `"${item.batchNo || 'N/A'}"`,
            item.quantity || 0,
            (item.purchasePrice || 0).toFixed(2),
            (item.salePrice || 0).toFixed(2),
            stockValue,
            `"${item.supplier || 'N/A'}"`,
            `"${lastUpdated}"`
        ].join(',');
        
        csvContent += row + '\n';
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `stock-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert("Stock data exported successfully!", "success");
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.getElementById('stock-alert');
    
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertDiv.classList.add('hidden');
    }, 5000);
}