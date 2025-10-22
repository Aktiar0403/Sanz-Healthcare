// js/init-products.js - Initialize with Your Actual Products
async function initializeProducts() {
    try {
        console.log('🏥 Initializing Sanj Healthcare products database...');
        
        // Check if products already exist
        const productsSnapshot = await firebase.firestore().collection('products').limit(1).get();
        
        if (productsSnapshot.empty) {
            console.log('📦 Creating Sanj Healthcare products...');
            await createSanjProducts();
            showTemporaryMessage('Products database initialized successfully!', 'success');
        } else {
            console.log('✅ Products already exist in database');
        }
        
    } catch (error) {
        console.error('❌ Products initialization failed:', error);
        showTemporaryMessage('Error initializing products: ' + error.message, 'error');
    }
}

// Your Actual Sanj Healthcare Products
async function createSanjProducts() {
    const sanjProducts = [
        {
            name: "CALSANZ FEM CAP",
            batch: "CSF2301",
            expiry: "2025-08-31",
            mrp: 350.00,
            gst: 12,
            retailerPrice: 280.00,
            stockistPrice: 240.00,
            supplierPrice: 190.00,
            bonus: "10+2",
            stock: 120,
            category: "Women's Health",
            description: "Calcium supplement for women with Vitamin D3",
            composition: "Calcium Carbonate + Vitamin D3 + Magnesium + Zinc",
            packing: "10x10 Strips",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: "CALSANZ STRONG CAPSULE",
            batch: "CSS2302",
            expiry: "2025-09-30",
            mrp: 320.00,
            gst: 12,
            retailerPrice: 260.00,
            stockistPrice: 220.00,
            supplierPrice: 175.00,
            bonus: "5+1",
            stock: 85,
            category: "Bone Health",
            description: "High potency calcium with essential minerals",
            composition: "Calcium Citrate + Vitamin D3 + Vitamin K2 + Magnesium",
            packing: "15 Capsules Strip",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: "FOL D3 TAB",
            batch: "FLD2303",
            expiry: "2025-06-30",
            mrp: 180.00,
            gst: 12,
            retailerPrice: 150.00,
            stockistPrice: 130.00,
            supplierPrice: 105.00,
            bonus: "10+1",
            stock: 200,
            category: "Pregnancy Care",
            description: "Folic acid with Vitamin D3 for prenatal care",
            composition: "Folic Acid 5mg + Vitamin D3 1000 IU",
            packing: "10x10 Tablets",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: "NEURON PLUS CAP",
            batch: "NPL2304",
            expiry: "2025-07-31",
            mrp: 280.00,
            gst: 12,
            retailerPrice: 230.00,
            stockistPrice: 200.00,
            supplierPrice: 160.00,
            bonus: "15+3",
            stock: 150,
            category: "Neuro Health",
            description: "Advanced neuro-nutritional supplement",
            composition: "Methylcobalamin + Alpha Lipoic Acid + Folic Acid + Pyridoxine",
            packing: "10 Capsules Strip",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: "NEURON PLUS INJ",
            batch: "NPI2305",
            expiry: "2024-12-31",
            mrp: 85.00,
            gst: 12,
            retailerPrice: 70.00,
            stockistPrice: 60.00,
            supplierPrice: 45.00,
            bonus: "25+5",
            stock: 300,
            category: "Injectables",
            description: "Neurobion injection for vitamin B12 deficiency",
            composition: "Methylcobalamin 1500mcg",
            packing: "1ml x 10 Vials",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: "RABSANZ DSR CAP",
            batch: "RDS2306",
            expiry: "2025-10-31",
            mrp: 220.00,
            gst: 12,
            retailerPrice: 185.00,
            stockistPrice: 160.00,
            supplierPrice: 125.00,
            bonus: "10+2",
            stock: 95,
            category: "Gastrointestinal",
            description: "Rabeprazole delayed release capsules for acidity",
            composition: "Rabeprazole 20mg",
            packing: "10 Capsules Strip",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: "SAZ LQ 10 CAP",
            batch: "SLQ2307",
            expiry: "2025-05-31",
            mrp: 190.00,
            gst: 12,
            retailerPrice: 160.00,
            stockistPrice: 140.00,
            supplierPrice: 110.00,
            bonus: "8+1",
            stock: 110,
            category: "Gastrointestinal",
            description: "Levosulpiride and Rabeprazole combination",
            composition: "Levosulpiride 75mg + Rabeprazole 20mg",
            packing: "10 Capsules Strip",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: "TENDOLIV OA TAB",
            batch: "TDO2308",
            expiry: "2025-08-31",
            mrp: 260.00,
            gst: 12,
            retailerPrice: 220.00,
            stockistPrice: 190.00,
            supplierPrice: 150.00,
            bonus: "12+2",
            stock: 75,
            category: "Pain Management",
            description: "Glucosamine with Osteoarthritis management",
            composition: "Glucosamine 750mg + Diacerein 50mg",
            packing: "10 Tablets Strip",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: "SINOPLEX L SYP",
            batch: "SPL2309",
            expiry: "2024-11-30",
            mrp: 145.00,
            gst: 12,
            retailerPrice: 120.00,
            stockistPrice: 105.00,
            supplierPrice: 85.00,
            bonus: "6+1",
            stock: 180,
            category: "Cough & Cold",
            description: "Antitussive and expectorant syrup",
            composition: "Chlorpheniramine Maleate + Dextromethorphan + Guaiphenesin",
            packing: "100ml Bottle",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: "NEURON FORTE CAP",
            batch: "NFT2310",
            expiry: "2025-09-30",
            mrp: 320.00,
            gst: 12,
            retailerPrice: 270.00,
            stockistPrice: 235.00,
            supplierPrice: 190.00,
            bonus: "10+1",
            stock: 60,
            category: "Neuro Health",
            description: "Advanced neuroprotection formula",
            composition: "Methylcobalamin + Pregabalin + Alpha Lipoic Acid",
            packing: "10 Capsules Strip",
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    let createdCount = 0;
    
    for (const product of sanjProducts) {
        await firebase.firestore().collection('products').add(product);
        createdCount++;
        console.log(`✅ Created: ${product.name}`);
    }
    
    console.log(`🎉 Successfully created ${createdCount} Sanj Healthcare products`);
    return createdCount;
}

// Enhanced product display with composition and packing
function enhanceProductDisplay() {
    // This will be called after products are loaded to enhance the UI
    const style = document.createElement('style');
    style.textContent = `
        .product-composition {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
            font-style: italic;
        }
        .product-packing {
            font-size: 11px;
            color: #888;
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 10px;
            display: inline-block;
        }
    `;
    document.head.appendChild(style);
}

// Update your products.js to show enhanced information
function enhanceProductsJS() {
    // This would be added to your existing products.js
    console.log('🔧 Enhancing products display with composition details...');
}

// Call this from your main app
// initializeProducts();