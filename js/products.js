// Firestore initialization (use your firebase-config.js)
const db = firebase.firestore();

// Global charges
const cnfCharge = 5000;
const deliveryCharge = 2000;

// Product data example (10 products)
const products = [
  {
    id: 1,
    name: "Calsanz Fem Capsule",
    batch: "CF001",
    expiry: "2026-12-31",
    mrp: 500,
    gst: 12, // %
    retailerPrice: 500 * 0.8,
    stockistPrice: 500 * 0.8 * 0.9,
    supplierPrice: 300,
    bonus: "10+1 strip",
    stock: 200,
    category: "Capsules",
    description: "Calcium & Vitamin D capsule"
  },
  {
    id: 2,
    name: "Calsanz Strong Capsule",
    batch: "CS002",
    expiry: "2026-12-31",
    mrp: 600,
    gst: 12,
    retailerPrice: 600 * 0.8,
    stockistPrice: 600 * 0.8 * 0.9,
    supplierPrice: 400,
    bonus: "10+3 strip",
    stock: 150,
    category: "Capsules",
    description: "Strong Calcium & Vitamin D formulation"
  },
  {
    id: 3,
    name: "Rabsanz DSR Capsule",
    batch: "RD003",
    expiry: "2025-11-30",
    mrp: 450,
    gst: 12,
    retailerPrice: 450 * 0.8,
    stockistPrice: 450 * 0.8 * 0.9,
    supplierPrice: 280,
    bonus: "5+1 strip",
    stock: 300,
    category: "Capsules",
    description: "Rabeprazole + Domperidone"
  },
  {
    id: 4,
    name: "Rabsanz 20 Tablet",
    batch: "R20T004",
    expiry: "2025-10-31",
    mrp: 350,
    gst: 12,
    retailerPrice: 350 * 0.8,
    stockistPrice: 350 * 0.8 * 0.9,
    supplierPrice: 200,
    bonus: "10+2 tablet",
    stock: 250,
    category: "Tablets",
    description: "Rabeprazole 20mg tablet"
  },
  {
    id: 5,
    name: "FOL D3 Capsule",
    batch: "FD005",
    expiry: "2026-01-31",
    mrp: 400,
    gst: 12,
    retailerPrice: 400 * 0.8,
    stockistPrice: 400 * 0.8 * 0.9,
    supplierPrice: 250,
    bonus: "10+1 capsule",
    stock: 180,
    category: "Capsules",
    description: "Folic Acid + Vitamin D3"
  },
  {
    id: 6,
    name: "Neuron Plus Injection Ampule",
    batch: "NPIA006",
    expiry: "2025-12-31",
    mrp: 1200,
    gst: 12,
    retailerPrice: 1200 * 0.8,
    stockistPrice: 1200 * 0.8 * 0.9,
    supplierPrice: 800,
    bonus: "10+3 ampule",
    stock: 80,
    category: "Injections",
    description: "Nootropic injection ampule"
  },
  {
    id: 7,
    name: "Neuron Plus Capsule",
    batch: "NPC007",
    expiry: "2026-06-30",
    mrp: 700,
    gst: 12,
    retailerPrice: 700 * 0.8,
    stockistPrice: 700 * 0.8 * 0.9,
    supplierPrice: 450,
    bonus: "10+2 capsule",
    stock: 120,
    category: "Capsules",
    description: "Nootropic capsule for brain health"
  },
  {
    id: 8,
    name: "SAZ LQ10 Capsule",
    batch: "SAZ008",
    expiry: "2026-03-31",
    mrp: 550,
    gst: 12,
    retailerPrice: 550 * 0.8,
    stockistPrice: 550 * 0.8 * 0.9,
    supplierPrice: 350,
    bonus: "10+1 capsule",
    stock: 100,
    category: "Capsules",
    description: "Coenzyme Q10 supplement"
  },
  {
    id: 9,
    name: "Sinoplex-L Syrup",
    batch: "SLS009",
    expiry: "2025-12-31",
    mrp: 300,
    gst: 12,
    retailerPrice: 300 * 0.8,
    stockistPrice: 300 * 0.8 * 0.9,
    supplierPrice: 180,
    bonus: "1+1 bottle",
    stock: 150,
    category: "Syrup",
    description: "Multivitamin syrup"
  },
  {
    id: 10,
    name: "Rabsanz DSR Tablet",
    batch: "RDT010",
    expiry: "2025-10-31",
    mrp: 480,
    gst: 12,
    retailerPrice: 480 * 0.8,
    stockistPrice: 480 * 0.8 * 0.9,
    supplierPrice: 300,
    bonus: "5+1 tablet",
    stock: 200,
    category: "Tablets",
    description: "Rabeprazole + Domperidone combination tablet"
  }
];

// Firestore CRUD example functions
function addProduct(product) {
  db.collection("products").doc(product.id.toString()).set(product)
    .then(() => console.log("Product added:", product.name))
    .catch(err => console.error(err));
}

function updateProduct(productId, updatedData) {
  db.collection("products").doc(productId.toString()).update(updatedData)
    .then(() => console.log("Product updated:", productId))
    .catch(err => console.error(err));
}

function deleteProduct(productId) {
  db.collection("products").doc(productId.toString()).delete()
    .then(() => console.log("Product deleted:", productId))
    .catch(err => console.error(err));
}
