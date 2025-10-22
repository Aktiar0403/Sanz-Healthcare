// js/debts.js - ENHANCED VERSION WITH ADDITIONAL FEATURES
// Remove all import statements - using global firebase

const db = firebase.firestore();
let bankLoans = [];
let investors = [];

// References
const bankCollection = db.collection("debts").doc("bankLoans").collection("entries");
const investorCollection = db.collection("debts").doc("investors").collection("entries");

// ------------------ ENHANCED BANK LOANS ------------------
async function loadBankLoans() {
    try {
        const snapshot = await bankCollection.orderBy('timestamp', 'desc').get();
        bankLoans = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            bankLoans.push({ 
                id: docSnap.id, 
                ...data,
                // Calculate remaining principal
                remainingPrincipal: (data.principal || 0) - (data.paid || 0)
            });
        });
        renderBankTable();
        updateSummary();
    } catch (error) {
        console.error("Error loading bank loans:", error);
        showTemporaryMessage("Error loading bank loans: " + error.message, "error");
    }
}

function renderBankTable() {
    const tbody = document.querySelector("#bankTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (bankLoans.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    <h3>No bank loans found</h3>
                    <p>Click "Add Bank Loan" to create your first loan entry</p>
                </td>
            </tr>
        `;
        return;
    }
    
    bankLoans.forEach(loan => {
        const row = document.createElement("tr");
        row.className = "bank-row";
        
        const remaining = (loan.principal || 0) - (loan.paid || 0);
        const progressPercent = loan.principal > 0 ? ((loan.paid || 0) / loan.principal) * 100 : 0;
        
        row.innerHTML = `
            <td><strong>${loan.bankName || 'N/A'}</strong></td>
            <td>₹${(loan.principal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>₹${(loan.emi || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>
                ₹${remaining.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                <div style="background: #e9ecef; height: 5px; border-radius: 3px; margin-top: 5px;">
                    <div style="background: #4CAF50; height: 100%; width: ${progressPercent}%; border-radius: 3px;"></div>
                </div>
                <small style="color: #666;">${progressPercent.toFixed(1)}% paid</small>
            </td>
            <td>${loan.startDate ? new Date(loan.startDate).toLocaleDateString() : 'N/A'}</td>
            <td>${loan.remarks || '-'}</td>
            <td class="action-cell">
                <button class="btn edit-btn" onclick="editBank('${loan.id}')">Edit</button>
                <button class="btn delete-btn" onclick="deleteBank('${loan.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Enhanced save with validation
async function saveBankLoan() {
    try {
        const id = document.getElementById("bankId").value;
        const data = {
            bankName: document.getElementById("bankName").value.trim(),
            principal: parseFloat(document.getElementById("bankPrincipal").value) || 0,
            emi: parseFloat(document.getElementById("bankEMI").value) || 0,
            startDate: document.getElementById("bankStartDate").value,
            remarks: document.getElementById("bankRemarks").value.trim(),
            paid: 0,
            timestamp: new Date()
        };

        // Enhanced validation
        if (!data.bankName) {
            alert("Please enter bank name");
            return;
        }

        if (data.principal <= 0) {
            alert("Principal amount must be greater than 0");
            return;
        }

        if (data.emi <= 0) {
            alert("EMI amount must be greater than 0");
            return;
        }

        if (!data.startDate) {
            alert("Please select start date");
            return;
        }

        if (id) {
            await bankCollection.doc(id).update(data);
            showTemporaryMessage("Bank loan updated successfully!", "success");
        } else {
            await bankCollection.add(data);
            showTemporaryMessage("Bank loan added successfully!", "success");
        }
        hideBankForm();
        await loadBankLoans();
    } catch (error) {
        console.error("Error saving bank loan:", error);
        showTemporaryMessage("Error saving bank loan: " + error.message, "error");
    }
}

// ------------------ ENHANCED INVESTORS ------------------
async function loadInvestors() {
    try {
        const snapshot = await investorCollection.orderBy('timestamp', 'desc').get();
        investors = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const withdrawn = data.withdrawnPrincipal || 0;
            const remaining = (data.principal || 0) - withdrawn;
            const monthlyROI = data.skipROI ? 0 : (remaining * (data.roi || 0)) / 100;
            
            investors.push({ 
                id: docSnap.id, 
                ...data,
                remainingPrincipal: remaining,
                monthlyROI: monthlyROI
            });
        });
        renderInvestorTable();
        updateSummary();
    } catch (error) {
        console.error("Error loading investors:", error);
        showTemporaryMessage("Error loading investors: " + error.message, "error");
    }
}

function renderInvestorTable() {
    const tbody = document.querySelector("#investorTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (investors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="loading">
                    <h3>No investors found</h3>
                    <p>Click "Add Investor" to create your first investor entry</p>
                </td>
            </tr>
        `;
        return;
    }
    
    investors.forEach(inv => {
        const withdrawn = inv.withdrawnPrincipal || 0;
        const remaining = (inv.principal || 0) - withdrawn;
        const roi = ((remaining * (inv.roi || 0)) / 100).toFixed(2);
        const skipped = inv.skipROI;
        const progressPercent = inv.principal > 0 ? (withdrawn / inv.principal) * 100 : 0;
        
        const row = document.createElement("tr");
        row.className = "investor-row";
        
        row.innerHTML = `
            <td><strong>${inv.investorName || 'N/A'}</strong></td>
            <td>₹${(inv.principal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>${inv.roi || 0}%</td>
            <td>₹${roi}</td>
            <td>
                ₹${withdrawn.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                <div style="background: #e9ecef; height: 5px; border-radius: 3px; margin-top: 5px;">
                    <div style="background: #2196F3; height: 100%; width: ${progressPercent}%; border-radius: 3px;"></div>
                </div>
            </td>
            <td>₹${remaining.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>${inv.startDate ? new Date(inv.startDate).toLocaleDateString() : 'N/A'}</td>
            <td>${inv.remarks || '-'}</td>
            <td>
                <span class="status-badge ${skipped ? 'status-skipped' : 'status-active'}">
                    ${skipped ? 'Skipped' : 'Active'}
                </span>
            </td>
            <td class="action-cell">
                <button class="btn edit-btn" onclick="editInvestor('${inv.id}')">Edit</button>
                <button class="btn delete-btn" onclick="deleteInvestor('${inv.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Enhanced investor save with validation
async function saveInvestor() {
    try {
        const id = document.getElementById("investorId").value;
        const data = {
            investorName: document.getElementById("investorName").value.trim(),
            principal: parseFloat(document.getElementById("investorPrincipal").value) || 0,
            roi: parseFloat(document.getElementById("investorROI").value) || 0,
            withdrawnPrincipal: parseFloat(document.getElementById("investorWithdrawn").value) || 0,
            startDate: document.getElementById("investorStartDate").value,
            remarks: document.getElementById("investorRemarks").value.trim(),
            skipROI: document.getElementById("investorSkipROI").checked,
            timestamp: new Date()
        };

        // Enhanced validation
        if (!data.investorName) {
            alert("Please enter investor name");
            return;
        }

        if (data.principal <= 0) {
            alert("Principal amount must be greater than 0");
            return;
        }

        if (data.withdrawnPrincipal > data.principal) {
            alert("Withdrawn amount cannot exceed principal amount");
            return;
        }

        if (id) {
            await investorCollection.doc(id).update(data);
            showTemporaryMessage("Investor updated successfully!", "success");
        } else {
            await investorCollection.add(data);
            showTemporaryMessage("Investor added successfully!", "success");
        }
        hideInvestorForm();
        await loadInvestors();
    } catch (error) {
        console.error("Error saving investor:", error);
        showTemporaryMessage("Error saving investor: " + error.message, "error");
    }
}

// ------------------ ENHANCED SUMMARY CALCULATIONS ------------------
function updateSummary() {
    // Total EMI from all bank loans
    const totalEMI = bankLoans.reduce((sum, b) => sum + (b.emi || 0), 0);
    
    // ROI that needs to be paid monthly (non-skipped investors)
    const totalROI = investors.reduce((sum, i) => {
        if (!i.skipROI) {
            const remaining = (i.principal || 0) - (i.withdrawnPrincipal || 0);
            return sum + (remaining * (i.roi || 0) / 100);
        } else return sum;
    }, 0);
    
    // Total monthly debt expense
    const totalDebt = totalEMI + totalROI;
    
    // ROI that is being skipped/accumulated
    const pendingROI = investors.reduce((sum, i) => {
        if (i.skipROI) {
            const remaining = (i.principal || 0) - (i.withdrawnPrincipal || 0);
            return sum + (remaining * (i.roi || 0) / 100);
        } else return sum;
    }, 0);

    // Update UI elements
    if (document.getElementById("totalEMI")) {
        document.getElementById("totalEMI").innerText = totalEMI.toLocaleString('en-IN', {minimumFractionDigits: 2});
    }
    if (document.getElementById("totalROI")) {
        document.getElementById("totalROI").innerText = totalROI.toLocaleString('en-IN', {minimumFractionDigits: 2});
    }
    if (document.getElementById("totalDebtExpense")) {
        document.getElementById("totalDebtExpense").innerText = totalDebt.toLocaleString('en-IN', {minimumFractionDigits: 2});
    }
    if (document.getElementById("pendingROI")) {
        document.getElementById("pendingROI").innerText = pendingROI.toLocaleString('en-IN', {minimumFractionDigits: 2});
    }
}

// ------------------ UTILITY FUNCTIONS ------------------
function showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        font-weight: bold;
        transition: opacity 0.3s;
    `;
    
    messageDiv.style.backgroundColor = type === 'success' ? '#28a745' : 
                                      type === 'error' ? '#dc3545' : '#17a2b8';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => document.body.removeChild(messageDiv), 300);
    }, 3000);
}

// ------------------ INITIAL LOAD ------------------
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not initialized');
        showTemporaryMessage('Firebase not loaded. Please refresh the page.', 'error');
        return;
    }
    
    console.log('Loading debts data...');
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

console.log('🏦 Debt Management module loaded successfully!');