// Products Management Module - FALLBACK VERSION
console.log('🎯 PRODUCTS MODULE LOADED - FALLBACK MODE');

window.initializeProductsModule = function() {
    console.log('🚀 Products module initialized via navigation');
    
    const contentArea = document.getElementById('content');
    if (contentArea) {
        contentArea.innerHTML = `
            <div class="p-6">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-lg font-medium text-blue-800">Products Module Loaded</h3>
                            <div class="mt-2 text-blue-700">
                                <p>Basic products functionality is working!</p>
                                <p class="text-sm mt-1">Firebase integration will work once configured.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm border p-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Products Management</h2>
                    
                    <form id="product-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input type="text" id="product-name" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter product name" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
                            <input type="number" id="mrp" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter MRP" min="0" step="0.01" required>
                        </div>
                        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            Save Product
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        // Add form handling
        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const productName = document.getElementById('product-name').value;
                const mrp = document.getElementById('mrp').value;
                alert(`✅ Product "${productName}" saved!\nMRP: ₹${mrp}\n\nIn production, this would save to Firebase.`);
                this.reset();
            });
        }
    }
};

console.log('✅ Products module ready');