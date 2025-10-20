// js/debts.js
import { db } from "./firebase-config.js";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// References
const bankCollection = collection(db, "debts", "bankLoans", "entries");
const investorCollection = collection(db, "debts", "investors", "entries");

// Cached arrays
let bankLoans = [];
let investors = [];

// ------------------ BANK LOANS ------------------
export async function loadBankLoans() {
  const snapshot = await getDocs(bankCollection);
  bankLoans = [];
  snapshot.forEach(docSnap => bankLoans.push({ id: docSnap.id, ...docSnap.data() }));
  renderBankTable();
  updateSummary();
}

function renderBankTable() {
  const tbody = document.querySelector("#bankTable tbody");
  tbody.innerHTML = "";
  bankLoans.forEach(loan => {
    const row = document.createElement("tr");
    const remaining = loan.principal - (loan.paid || 0);
    row.innerHTML = `
      <td>${loan.bankName}</td>
      <td>${loan.principal}</td>
      <td>${loan.emi}</td>
      <td>${remaining}</td>
      <td>${loan.startDate}</td>
      <td>${loan.remarks || ""}</td>
      <td>
        <button onclick="editBank('${loan.id}')">Edit</button>
        <button onclick="deleteBank('${loan.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

export function showBankForm() { document.getElementById("bankForm").style.display = "block"; }
export function hideBankForm() { document.getElementById("bankForm").style.display = "none"; }

export async function saveBankLoan() {
  const id = document.getElementById("bankId").value;
  const data = {
    bankName: document.getElementById("bankName").value,
    principal: parseFloat(document.getElementById("bankPrincipal").value) || 0,
    emi: parseFloat(document.getElementById("bankEMI").value) || 0,
    startDate: document.getElementById("bankStartDate").value,
    remarks: document.getElementById("bankRemarks").value,
    paid: 0
  };
  if (id) {
    await updateDoc(doc(db, "debts", "bankLoans", "entries", id), data);
  } else {
    await addDoc(bankCollection, data);
  }
  hideBankForm();
  loadBankLoans();
}

export async function editBank(id) {
  const loan = bankLoans.find(b => b.id === id);
  document.getElementById("bankId").value = loan.id;
  document.getElementById("bankName").value = loan.bankName;
  document.getElementById("bankPrincipal").value = loan.principal;
  document.getElementById("bankEMI").value = loan.emi;
  document.getElementById("bankStartDate").value = loan.startDate;
  document.getElementById("bankRemarks").value = loan.remarks || "";
  showBankForm();
}

export async function deleteBank(id) {
  if (confirm("Delete this bank loan?")) {
    await deleteDoc(doc(db, "debts", "bankLoans", "entries", id));
    loadBankLoans();
  }
}

// ------------------ INVESTORS ------------------
export async function loadInvestors() {
  const snapshot = await getDocs(investorCollection);
  investors = [];
  snapshot.forEach(docSnap => investors.push({ id: docSnap.id, ...docSnap.data() }));
  renderInvestorTable();
  updateSummary();
}

function renderInvestorTable() {
  const tbody = document.querySelector("#investorTable tbody");
  tbody.innerHTML = "";
  investors.forEach(inv => {
    const withdrawn = inv.withdrawnPrincipal || 0;
    const remaining = inv.principal - withdrawn;
    const roi = ((remaining * (inv.roi || 0)) / 100).toFixed(2);
    const skipped = inv.skipROI ? "Yes" : "No";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${inv.investorName}</td>
      <td>${inv.principal}</td>
      <td>${inv.roi || 0}</td>
      <td>${roi}</td>
      <td>${withdrawn}</td>
      <td>${remaining}</td>
      <td>${inv.startDate}</td>
      <td>${inv.remarks || ""}</td>
      <td>${skipped}</td>
      <td>
        <button onclick="editInvestor('${inv.id}')">Edit</button>
        <button onclick="deleteInvestor('${inv.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

export function showInvestorForm() { document.getElementById("investorForm").style.display = "block"; }
export function hideInvestorForm() { document.getElementById("investorForm").style.display = "none"; }

export async function saveInvestor() {
  const id = document.getElementById("investorId").value;
  const data = {
    investorName: document.getElementById("investorName").value,
    principal: parseFloat(document.getElementById("investorPrincipal").value) || 0,
    roi: parseFloat(document.getElementById("investorROI").value) || 0,
    withdrawnPrincipal: parseFloat(document.getElementById("investorWithdrawn").value) || 0,
    startDate: document.getElementById("investorStartDate").value,
    remarks: document.getElementById("investorRemarks").value,
    skipROI: document.getElementById("investorSkipROI").checked
  };
  if (id) {
    await updateDoc(doc(db, "debts", "investors", "entries", id), data);
  } else {
    await addDoc(investorCollection, data);
  }
  hideInvestorForm();
  loadInvestors();
}

export async function editInvestor(id) {
  const inv = investors.find(i => i.id === id);
  document.getElementById("investorId").value = inv.id;
  document.getElementById("investorName").value = inv.investorName;
  document.getElementById("investorPrincipal").value = inv.principal;
  document.getElementById("investorROI").value = inv.roi || 0;
  document.getElementById("investorWithdrawn").value = inv.withdrawnPrincipal || 0;
  document.getElementById("investorStartDate").value = inv.startDate;
  document.getElementById("investorRemarks").value = inv.remarks || "";
  document.getElementById("investorSkipROI").checked = inv.skipROI || false;
  showInvestorForm();
}

export async function deleteInvestor(id) {
  if (confirm("Delete this investor entry?")) {
    await deleteDoc(doc(db, "debts", "investors", "entries", id));
    loadInvestors();
  }
}

// ------------------ SUMMARY ------------------
function updateSummary() {
  const totalEMI = bankLoans.reduce((sum, b) => sum + (b.emi || 0), 0);
  const totalROI = investors.reduce((sum, i) => {
    if (!i.skipROI) {
      const remaining = (i.principal || 0) - (i.withdrawnPrincipal || 0);
      return sum + (remaining * (i.roi || 0) / 100);
    } else return sum;
  }, 0);
  const totalDebt = totalEMI + totalROI;
  const pendingROI = investors.reduce((sum, i) => {
    if (i.skipROI) {
      const remaining = (i.principal || 0) - (i.withdrawnPrincipal || 0);
      return sum + (remaining * (i.roi || 0) / 100);
    } else return sum;
  }, 0);

  document.getElementById("totalEMI").innerText = totalEMI.toFixed(2);
  document.getElementById("totalROI").innerText = totalROI.toFixed(2);
  document.getElementById("totalDebtExpense").innerText = totalDebt.toFixed(2);
  document.getElementById("pendingROI").innerText = pendingROI.toFixed(2);
}

// ------------------ INITIAL LOAD ------------------
loadBankLoans();
loadInvestors();

// Make functions globally accessible for inline onclick
window.showBankForm = showBankForm;
window.hideBankForm = hideBankForm;
window.saveBankLoan = saveBankLoan;
window.editBank = editBank;
window.deleteBank = deleteBank;

window.showInvestorForm = showInvestorForm;
window.hideInvestorForm = hideInvestorForm;
window.saveInvestor = saveInvestor;
window.editInvestor = editInvestor;
window.deleteInvestor = deleteInvestor;
