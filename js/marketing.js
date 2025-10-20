// marketing.js
const db = firebase.firestore();

let marketingEntries = [];
let editMode = false;

// DOM Elements
const marketingTableBody = document.querySelector('#marketingTable tbody');
const totalTargetElem = document.getElementById('totalTarget');
const totalCompletedElem = document.getElementById('totalCompleted');
const totalPaymentsElem = document.getElementById('totalPayments');

// Show Add Marketing Form
function showAddMarketingForm() {
  editMode = false;
  document.getElementById('formTitle').textContent = "Add Doctor Agreement";
  document.getElementById('marketingForm').style.display = 'block';
  document.getElementById('marketingId').value = '';
  ['doctorName','targetValue','completedValue','initialPayment','agreementDate','notes'].forEach(id => document.getElementById(id).value = '');
}

// Hide Marketing Form
function hideMarketingForm() {
  document.getElementById('marketingForm').style.display = 'none';
}

// Save Marketing Entry (Add or Update)
function saveMarketing() {
  const marketingId = editMode ? parseInt(document.getElementById('marketingId').value) : Date.now();
  const entry = {
    id: marketingId,
    doctorName: document.getElementById('doctorName').value,
    targetValue: parseFloat(document.getElementById('targetValue').value),
    completedValue: parseFloat(document.getElementById('completedValue').value),
    initialPayment: parseFloat(document.getElementById('initialPayment').value),
    agreementDate: document.getElementById('agreementDate').value,
    notes: document.getElementById('notes').value
  };

  if(editMode){
    const index = marketingEntries.findIndex(e => e.id === marketingId);
    marketingEntries[index] = entry;
    db.collection('marketing').doc(marketingId.toString()).update(entry);
  } else {
    marketingEntries.push(entry);
    db.collection('marketing').doc(marketingId.toString()).set(entry);
  }

  hideMarketingForm();
  renderMarketingTable();
}

// Edit Marketing Entry
function editMarketing(id) {
  editMode = true;
  const entry = marketingEntries.find(e => e.id === id);
  document.getElementById('formTitle').textContent = "Edit Doctor Agreement";
  document.getElementById('marketingForm').style.display = 'block';
  document.getElementById('marketingId').value = entry.id;
  document.getElementById('doctorName').value = entry.doctorName;
  document.getElementById('targetValue').value = entry.targetValue;
  document.getElementById('completedValue').value = entry.completedValue;
  document.getElementById('initialPayment').value = entry.initialPayment;
  document.getElementById('agreementDate').value = entry.agreementDate;
  document.getElementById('notes').value = entry.notes;
}

// Delete Marketing Entry
function deleteMarketing(id) {
  if(confirm("Are you sure you want to delete this doctor agreement?")) {
    const index = marketingEntries.findIndex(e => e.id === id);
    if(index > -1) marketingEntries.splice(index,1);
    db.collection('marketing').doc(id.toString()).delete();
    renderMarketingTable();
  }
}

// Render Marketing Table + Summary
function renderMarketingTable() {
  marketingTableBody.innerHTML = '';

  let totalTarget = 0;
  let totalCompleted = 0;
  let totalPayments = 0;

  marketingEntries.forEach(entry => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${entry.doctorName}</td>
      <td>₹${entry.targetValue.toFixed(2)}</td>
      <td>₹${entry.completedValue.toFixed(2)}</td>
      <td>₹${entry.initialPayment.toFixed(2)}</td>
      <td>${entry.agreementDate}</td>
      <td>${entry.notes}</td>
      <td>
        <button class="btn edit-btn" onclick="editMarketing(${entry.id})">Edit</button>
        <button class="btn delete-btn" onclick="deleteMarketing(${entry.id})">Delete</button>
      </td>
    `;
    marketingTableBody.appendChild(tr);

    totalTarget += entry.targetValue;
    totalCompleted += entry.completedValue;
    totalPayments += entry.initialPayment;
  });

  totalTargetElem.textContent = totalTarget.toFixed(2);
  totalCompletedElem.textContent = totalCompleted.toFixed(2);
  totalPaymentsElem.textContent = totalPayments.toFixed(2);
}

// Initial load: fetch marketing entries from Firestore
db.collection('marketing').get().then(snapshot => {
  marketingEntries = snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
  renderMarketingTable();
});
