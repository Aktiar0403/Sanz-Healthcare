// finance.js
const db = firebase.firestore();

let financeEntries = [];
let editMode = false;

// DOM Elements
const financeTableBody = document.querySelector('#financeTable tbody');
const typeSelect = document.getElementById('type');
const productSelect = document.getElementById('productSelect');
const totalRevenueElem = document.getElementById('totalRevenue');
const totalExpensesElem = document.getElementById('totalExpenses');
const profitElem = document.getElementById('profit');

// Load products for dropdown
function loadProductOptions(products) {
  productSelect.innerHTML = '<option value="">--Select Product (optional)--</option>';
  products.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    productSelect.appendChild(option);
  });
}

// Fetch products from Firestore
db.collection('products').get().then(snapshot => {
  const products = snapshot.docs.map(doc => ({ id: parseInt(doc.id), name: doc.data().name }));
  loadProductOptions(products);
});

// Show Add Finance Form
function showAddFinanceForm() {
  editMode = false;
  document.getElementById('formTitle').textContent = "Add Finance Entry";
  document.getElementById('financeForm').style.display = 'block';
  document.getElementById('financeId').value = '';
  ['amount','category','date','notes'].forEach(id => document.getElementById(id).value = '');
  typeSelect.value = 'Revenue';
  productSelect.value = '';
}

// Hide Finance Form
function hideFinanceForm() {
  document.getElementById('financeForm').style.display = 'none';
}

// Save Finance Entry (Add or Update)
function saveFinance() {
  const financeId = editMode ? parseInt(document.getElementById('financeId').value) : Date.now();
  const entry = {
    id: financeId,
    type: typeSelect.value,
    productId: productSelect.value ? parseInt(productSelect.value) : null,
    category: document.getElementById('category').value,
    amount: parseFloat(document.getElementById('amount').value),
    date: document.getElementById('date').value,
    notes: document.getElementById('notes').value
  };

  if(editMode){
    const index = financeEntries.findIndex(e => e.id === financeId);
    financeEntries[index] = entry;
    db.collection('finance').doc(financeId.toString()).update(entry);
  } else {
    financeEntries.push(entry);
    db.collection('finance').doc(financeId.toString()).set(entry);
  }

  hideFinanceForm();
  renderFinanceTable();
}

// Edit Finance Entry
function editFinance(id) {
  editMode = true;
  const entry = financeEntries.find(e => e.id === id);
  document.getElementById('formTitle').textContent = "Edit Finance Entry";
  document.getElementById('financeForm').style.display = 'block';
  document.getElementById('financeId').value = entry.id;
  typeSelect.value = entry.type;
  productSelect.value = entry.productId || '';
  document.getElementById('category').value = entry.category;
  document.getElementById('amount').value = entry.amount;
  document.getElementById('date').value = entry.date;
  document.getElementById('notes').value = entry.notes;
}

// Delete Finance Entry
function deleteFinance(id) {
  if(confirm("Are you sure you want to delete this finance entry?")) {
    const index = financeEntries.findIndex(e => e.id === id);
    if(index > -1) financeEntries.splice(index,1);
    db.collection('finance').doc(id.toString()).delete();
    renderFinanceTable();
  }
}

// Render Finance Table + Summary
function renderFinanceTable() {
  financeTableBody.innerHTML = '';

  let totalRevenue = 0;
  let totalExpenses = 0;

  // Get products for name mapping
  db.collection('products').get().then(snapshot => {
    const products = snapshot.docs.map(doc => ({ id: parseInt(doc.id), name: doc.data().name }));

    financeEntries.forEach(entry => {
      const product = products.find(p => p.id === entry.productId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${entry.type}</td>
        <td>${product ? product.name : ''}</td>
        <td>${entry.category}</td>
        <td>₹${entry.amount.toFixed(2)}</td>
        <td>${entry.date}</td>
        <td>${entry.notes}</td>
        <td>
          <button class="btn edit-btn" onclick="editFinance(${entry.id})">Edit</button>
          <button class="btn delete-btn" onclick="deleteFinance(${entry.id})">Delete</button>
        </td>
      `;
      financeTableBody.appendChild(tr);

      if(entry.type === 'Revenue') totalRevenue += entry.amount;
      else if(entry.type === 'Expense') totalExpenses += entry.amount;
    });

    totalRevenueElem.textContent = totalRevenue.toFixed(2);
    totalExpensesElem.textContent = totalExpenses.toFixed(2);
    profitElem.textContent = (totalRevenue - totalExpenses).toFixed(2);
  });
}

// Initial load: fetch finance entries from Firestore
db.collection('finance').get().then(snapshot => {
  financeEntries = snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
  renderFinanceTable();
});
