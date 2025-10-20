// stock.js
const db = firebase.firestore();

let stockEntries = [];
let editMode = false;
const lowStockThreshold = 10; // highlight if stock < 10

// DOM Elements
const productSelect = document.getElementById('productSelect');
const stockTableBody = document.querySelector('#stockTable tbody');

// CNF and delivery charges (for summary if needed)
const cnfCharge = 5000;  // example lumpsum
const deliveryCharge = 2000;

// Load products to dropdown
function loadProductOptions(products) {
  productSelect.innerHTML = '';
  products.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    productSelect.appendChild(option);
  });
}

// Fetch products from Firestore to populate dropdown
db.collection('products').get().then(snapshot => {
  const products = snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
  loadProductOptions(products);
});

// Show Add Stock Form
function showAddStockForm() {
  editMode = false;
  document.getElementById('formTitle').textContent = "Add Stock Entry";
  document.getElementById('stockForm').style.display = 'block';
  document.getElementById('stockId').value = '';
  ['batch','quantity','invoice','date'].forEach(id=>document.getElementById(id).value='');
}

// Hide Stock Form
function hideStockForm() {
  document.getElementById('stockForm').style.display = 'none';
}

// Save Stock Entry (Add or Update)
function saveStock() {
  const stockId = editMode ? parseInt(document.getElementById('stockId').value) : Date.now();
  const entry = {
    id: stockId,
    productId: parseInt(productSelect.value),
    batch: document.getElementById('batch').value,
    quantity: parseInt(document.getElementById('quantity').value),
    invoice: document.getElementById('invoice').value,
    date: document.getElementById('date').value
  };

  if(editMode){
    const index = stockEntries.findIndex(e => e.id === stockId);
    stockEntries[index] = entry;
    db.collection('stock').doc(stockId.toString()).update(entry);
  } else {
    stockEntries.push(entry);
    db.collection('stock').doc(stockId.toString()).set(entry);
  }

  hideStockForm();
  renderStockTable();
}

// Edit Stock Entry
function editStock(id) {
  editMode = true;
  const entry = stockEntries.find(e => e.id === id);
  document.getElementById('formTitle').textContent = "Edit Stock Entry";
  document.getElementById('stockForm').style.display = 'block';
  document.getElementById('stockId').value = entry.id;
  productSelect.value = entry.productId;
  document.getElementById('batch').value = entry.batch;
  document.getElementById('quantity').value = entry.quantity;
  document.getElementById('invoice').value = entry.invoice;
  document.getElementById('date').value = entry.date;
}

// Delete Stock Entry
function deleteStock(id) {
  if(confirm("Are you sure you want to delete this stock entry?")) {
    const index = stockEntries.findIndex(e => e.id === id);
    if(index > -1) stockEntries.splice(index,1);
    db.collection('stock').doc(id.toString()).delete();
    renderStockTable();
  }
}

// Render Stock Table
function renderStockTable() {
  stockTableBody.innerHTML = '';

  // Get products for name mapping
  db.collection('products').get().then(snapshot => {
    const products = snapshot.docs.map(doc => ({ id: parseInt(doc.id), name: doc.data().name }));

    stockEntries.forEach(entry => {
      const product = products.find(p => p.id === entry.productId);
      const tr = document.createElement('tr');

      // Highlight expired batches
      const today = new Date();
      const expiryDate = new Date(entry.date);
      if(expiryDate < today) tr.classList.add('expired');
      if(entry.quantity < lowStockThreshold) tr.classList.add('low-stock');

      tr.innerHTML = `
        <td>${product ? product.name : 'Unknown'}</td>
        <td>${entry.batch}</td>
        <td>${entry.quantity}</td>
        <td>${entry.invoice}</td>
        <td>${entry.date}</td>
        <td>
          <button class="btn edit-btn" onclick="editStock(${entry.id})">Edit</button>
          <button class="btn delete-btn" onclick="deleteStock(${entry.id})">Delete</button>
        </td>
      `;
      stockTableBody.appendChild(tr);
    });
  });
}

// Initial load: fetch stock entries from Firestore
db.collection('stock').get().then(snapshot => {
  stockEntries = snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
  renderStockTable();
});
