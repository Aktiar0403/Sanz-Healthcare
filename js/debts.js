// js/debts.js - COMPLETE FIREBASE V8 VERSION
// Remove all import statements - using global firebase

const db = firebase.firestore();
let bankLoans = [];
let investors = [];

// References
const bankCollection = db.collection("debts").doc("bankLoans").collection("entries");
const investorCollection = db.collection("debts").doc("investors").collection("entries");

// ------------------ BANK LOANS ------------------
async function loadBankLoans() {
    try {
        const snapshot = await bankCollection.get();
        bankLoans = [];
        snapshot.forEach(docSnap => {
            bankLoans.push({ 
                id: docSnap.id, 
                ...docSnap.data() 
            });
        });
        renderBankTable();
        updateSummary();
    } catch (error) {
        console.error("Error loading bank loans:", error);
        alert("Error loading bank loans: " + error.message);
    }
}

function renderBankTable() {
    const tbody = document.querySelector("#bankTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    bankLoans.forEach(loan => {
        const row = document.createElement("tr");
        const remaining = (loan.principal || 0) - (loan.paid || 0);
        row.innerHTML = `
            <td>${loan.bankName || 'N/A'}</td>
            <td>₹${(loan.principal || 0).toLocaleString('en-IN')}</td>
            <td>₹${(loan.emi || 0).toLocaleString('en-IN')}</td>
            <td>₹${remaining.toLocaleString('en-IN')}</td>
            <td>${loan.startDate || 'N/A'}</td>
            <td>${loan.remarks || ''}</td>
            <td>
                <button class="btn edit-btn" onclick="editBank('${loan.id}')">Edit</button>
                <button class="btn delete-btn" onclick="deleteBank('${loan.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showBankForm() { 
    document.getElementById("bankForm").style.display = "block"; 
}

function hideBankForm() { 
    document.getElementById("bankForm").style.display = "none"; 
    document.getElementById("bankId").value = '';
    document.getElementById("bankName").value = '';
    document.getElementById("bankPrincipal").value = '';
    document.getElementById("bankEMI").value = '';
    document.getElementById("bankStartDate").value = '';
    document.getElementById("bankRemarks").value = '';
}

async function saveBankLoan() {
    try {
        const id = document.getElementById("bankId").value;
        const data = {
            bankName: document.getElementById("bankName").value,
            principal: parseFloat(document.getElementById("bankPrincipal").value) || 0,
            emi: parseFloat(document.getElementById("bankEMI").value) || 0,
            startDate: document.getElementById("bankStartDate").value,
            remarks: document.getElementById("bankRemarks").value,
            paid: 0,
            timestamp: new Date()
        };

        if (!data.bankName || !data.principal || !data.emi) {
            alert("Please fill in all required fields");
            return;
        }

        if (id) {
            await bankCollection.doc(id).update(data);
        } else {
            await bankCollection.add(data);
        }
        hideBankForm();
        await loadBankLoans();
    } catch (error) {
        console.error("Error saving bank loan:", error);
        alert("Error saving bank loan: " + error.message);
    }
}

async function editBank(id) {
    try {
        const loan = bankLoans.find(b => b.id === id);
        if (!loan) return;
        
        document.getElementById("bankId").value = loan.id;
        document.getElementById("bankName").value = loan.bankName || '';
        document.getElementById("bankPrincipal").value = loan.principal || '';
        document.getElementById("bankEMI").value = loan.emi || '';
        document.getElementById("bankStartDate").value = loan.startDate || '';
        document.getElementById("bankRemarks").value = loan.remarks || '';
        showBankForm();
    } catch (error) {
        console.error("Error editing bank loan:", error);
        alert("Error editing bank loan: " + error.message);
    }
}

async function deleteBank(id) {
    if (confirm("Are you sure you want to delete this bank loan?")) {
        try {
            await bankCollection.doc(id).delete();
            await loadBankLoans();
        } catch (error) {
            console.error("Error deleting bank loan:", error);
            alert("Error deleting bank loan: " + error.message);
        }
    }
}

// ------------------ INVESTORS ------------------
async function loadInvestors() {
    try {
        const snapshot = await investorCollection.get();
        investors = [];
        snapshot.forEach(docSnap => {
            investors.push({ 
                id: docSnap.id, 
                ...docSnap.data() 
            });
        });
        renderInvestorTable();
        updateSummary();
    } catch (error) {
        console.error("Error loading investors:", error);
        alert("Error loading investors: " + error.message);
    }
}

function renderInvestorTable() {
    const tbody = document.querySelector("#investorTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    investors.forEach(inv => {
        const withdrawn = inv.withdrawnPrincipal || 0;
        const remaining = (inv.principal || 0) - withdrawn;
        const roi = ((remaining * (inv.roi || 0)) / 100).toFixed(2);
        const skipped = inv.skipROI ? "Yes" : "No";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${inv.investorName || 'N/A'}</td>
            <td>₹${(inv.principal || 0).toLocaleString('en-IN')}</td>
            <td>${inv.roi || 0}%</td>
            <td>₹${roi}</td>
            <td>₹${withdrawn.toLocaleString('en-IN')}</td>
            <td>₹${remaining.toLocaleString('en-IN')}</td>
            <td>${inv.startDate || 'N/A'}</td>
            <td>${inv.remarks || ''}</td>
            <td>${skipped}</td>
            <td>
                <button class="btn edit-btn" onclick="editInvestor('${inv.id}')">Edit</button>
                <button class="btn delete-btn" onclick="deleteInvestor('${inv.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showInvestorForm() { 
    document.getElementById("investorForm").style.display = "block"; 
}

function hideInvestorForm() { 
    document.getElementById("investorForm").style.display = "none"; 
    document.getElementById("investorId").value = '';
    document.getElementById("investorName").value = '';
    document.getElementById("investorPrincipal").value = '';
    document.getElementById("investorROI").value = '';
    document.getElementById("investorWithdrawn").value = '0';
    document.getElementById("investorStartDate").value = '';
    document.getElementById("investorRemarks").value = '';
    document.getElementById("investorSkipROI").checked = false;
}

async function saveInvestor() {
    try {
        const id = document.getElementById("investorId").value;
        const data = {
            investorName: document.getElementById("investorName").value,
            principal: parseFloat(document.getElementById("investorPrincipal").value) || 0,
            roi: parseFloat(document.getElementById("investorROI").value) || 0,
            withdrawnPrincipal: parseFloat(document.getElementById("investorWithdrawn").value) || 0,
            startDate: document.getElementById("investorStartDate").value,
            remarks: document.getElementById("investorRemarks").value,
            skipROI: document.getElementById("investorSkipROI").checked,
            timestamp: new Date()
        };

        if (!data.investorName || !data.principal) {
            alert("Please fill in all required fields");
            return;
        }

        if (id) {
            await investorCollection.doc(id).update(data);
        } else {
            await investorCollection.add(data);
        }
        hideInvestorForm();
        await loadInvestors();
    } catch (error) {
        console.error("Error saving investor:", error);
        alert("Error saving investor: " + error.message);
    }
}

async function editInvestor(id) {
    try {
        const inv = investors.find(i => i.id === id);
        if (!inv) return;
        
        document.getElementById("investorId").value = inv.id;
        document.getElementById("investorName").value = inv.investorName || '';
        document.getElementById("investorPrincipal").value = inv.principal || '';
        document.getElementById("investorROI").value = inv.roi || 0;
        document.getElementById("investorWithdrawn").value = inv.withdrawnPrincipal || 0;
        document.getElementById("investorStartDate").value = inv.startDate || '';
        document.getElementById("investorRemarks").value = inv.remarks || '';
        document.getElementById("investorSkipROI").checked = inv.skipROI || false;
        showInvestorForm();
    } catch (error) {
        console.error("Error editing investor:", error);
        alert("Error editing investor: " + error.message);
    }
}

async function deleteInvestor(id) {
    if (confirm("Are you sure you want to delete this investor entry?")) {
        try {
            await investorCollection.doc(id).delete();
            await loadInvestors();
        } catch (error) {
            console.error("Error deleting investor:", error);
            alert("Error deleting investor: " + error.message);
        }
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

    if (document.getElementById("totalEMI")) {
        document.getElementById("totalEMI").innerText = totalEMI.toFixed(2);
    }
    if (document.getElementById("totalROI")) {
        document.getElementById("totalROI").innerText = totalROI.toFixed(2);
    }
    if (document.getElementById("totalDebtExpense")) {
        document.getElementById("totalDebtExpense").innerText = totalDebt.toFixed(2);
    }
    if (document.getElementById("pendingROI")) {
        document.getElementById("pendingROI").innerText = pendingROI.toFixed(2);
    }
}

// ------------------ INITIAL LOAD ------------------
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not initialized');
        return;
    }
    
    loadBankLoans();
    loadInvestors();
});


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
