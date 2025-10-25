// Products Management Module - DEBUG VERSION
console.log('🎯 PRODUCTS MODULE LOADED - DEBUG MODE');

// Export for navigation system
window.initializeProductsModule = function() {
    console.log('🚀 Products module initialized via navigation');
    
    // Check if we're on products page
    const productForm = document.getElementById('product-form');
    if (!productForm) {
        console.log('❌ Not on products page');
        return;
    }
    
    console.log('✅ On products page, setting up basic functionality');
    
    // Basic form handling without Firebase
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productName = document.getElementById('product-name').value;
        const mrp = document.getElementById('mrp').value;
        
        console.log('📦 Product form submitted:', { productName, mrp });
        alert(`Product "${productName}" with MRP ₹${mrp} would be saved to Firebase in production!`);
        
        this.reset();
    });
    
    // MRP calculation
    const mrpInput = document.getElementById('mrp');
    if (mrpInput) {
        mrpInput.addEventListener('input', function() {
            const mrp = parseFloat(this.value) || 0;
            if (mrp > 0) {
                const retailerPrice = mrp * 0.8;
                const stockistPrice = retailerPrice * 0.9;
                
                const retailerInput = document.getElementById('retailer-price');
                const stockistInput = document.getElementById('stockist-price');
                
                if (retailerInput) retailerInput.value = retailerPrice.toFixed(2);
                if (stockistInput) stockistInput.value = stockistPrice.toFixed(2);
            }
        });
    }
    
    console.log('✅ Products module setup complete');
};

// Auto-initialize if directly on products page
if (document.getElementById('product-form')) {
    console.log('🔍 Auto-initializing products module (direct access)');
    document.addEventListener('DOMContentLoaded', function() {
        window.initializeProductsModule();
    });
}