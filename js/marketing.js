// js/marketing.js - DOCTOR AGREEMENTS MANAGEMENT
console.log('📋 Loading Doctor Agreements module...');

const db = firebase.firestore();
let agreements = [];
let doctors = [];
let editMode = false;
let currentSort = { field: 'startDate', direction: 'desc' };
let currentFilters = {};

// DOM Elements
const agreementsTableBody = document.getElementById('agreementsTableBody');
const totalAgreementsElem = document.getElementById('totalAgreements');
const totalExpenseElem = document.getElementById('totalExpense');
const reviewCountElem = document.getElementById('reviewCount');

// Master Doctor List (can be moved to database later)
const masterDoctors = [
    "Dr. Sharma", "Dr. Verma", "Dr. Gupta", "Dr. Singh", "Dr. Kumar",
    "Dr. Patel", "Dr. Reddy", "Dr. Mehta", "Dr. Joshi", "Dr. Malhotra",
    "Dr. Choudhary", "Dr. Agarwal", "Dr. Das", "Dr. Rao", "Dr. Iyer"
];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not available');
        showErrorMessage('Firebase not loaded. Please refresh the page.');
        return;
    }
    
    console.log('Firebase available, loading doctor agreements...');
    initializeDoctors();
    loadAgreements();
    setupEventListeners();
});

// Initialize doctor dropdowns
function initializeDoctors() {
    const doctorSelect = document.getElementById('doctorName');
    const filterDoctor = document.getElementById('filterDoctor');
    
    if (doctorSelect) {
        doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
        masterDoctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor;
            option.textContent = doctor;
            doctorSelect.appendChild(option);
        });
    }
    
    if (filterDoctor) {
        filterDoctor.innerHTML = '<option value="">All Doctors</option>';
        masterDoctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor;
            option.textContent = doctor;
            filterDoctor.appendChild(option);
        });
    }
}

// Load agreements from Firestore
async function loadAgreements() {
    try {
        showLoadingState();
        console.log('Loading doctor agreements from Firestore...');
        
        const snapshot = await db.collection('doctorAgreements')
            .orderBy('startDate', 'desc')
            .get();
        
        agreements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Loaded ${agreements.length} doctor agreements`);
        applyFilters();
        
    } catch (error) {
        console.error('Error loading agreements:', error);
        showErrorMessage('Error loading doctor agreements: ' + error.message);
    }
}

// Show Agreement Form
function showAgreementForm() {
    editMode = false;
    document.getElementById('formTitle').textContent = "Add Doctor Agreement";
    document.getElementById('agreementForm').style.display = 'block';
    document.getElementById('agreementId').value = '';
    
    // Clear form fields
    const fields = ['doctorName', 'startDate', 'endDate', 'agreementAmount', 
                   'paymentFrequency', 'paidAmount', 'returnValue', 'notes'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.value = '';
    });
    
    // Set default values
    document.getElementById('status').value = 'active';
    document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
    
    // Set end date to 1 year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('endDate').value = nextYear.toISOString().split('T')[0];
    
    updatePendingAmount();
}

// Hide Agreement Form
function hideAgreementForm() {
    document.getElementById('agreementForm').style.display = 'none';
}

// Update Pending Amount (real-time calculation)
function updatePendingAmount() {
    const agreementAmount = parseFloat(document.getElementById('agreementAmount').value) || 0;
    const paidAmount = parseFloat(document.getElementById('paidAmount').value) || 0;
    const pendingAmount = agreementAmount - paidAmount;
    
    document.getElementById('pendingAmount').value = pendingAmount.toFixed(2);
}

// Save Agreement
async function saveAgreement() {
    try {
        const agreementId = document.getElementById('agreementId').value;
        const agreementData = {
            doctorName: document.getElementById('doctorName').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            agreementAmount: parseFloat(document.getElementById('agreementAmount').value) || 0,
            paymentFrequency: document.getElementById('paymentFrequency').value,
            paidAmount: parseFloat(document.getElementById('paidAmount').value) || 0,
            pendingAmount: parseFloat(document.getElementById('pendingAmount').value) || 0,
            returnValue: parseFloat(document.getElementById('returnValue').value) || 0,
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value,
            updatedAt: new Date()
        };

        // Validation
        if (!agreementData.doctorName || !agreementData.startDate || !agreementData.endDate) {
            alert('Please fill in all required fields');
            return;
        }

        if (agreementData.agreementAmount <= 0) {
            alert('Agreement amount must be greater than 0');
            return;
        }

        if (editMode && agreementId) {
            // Update existing agreement
            await db.collection('doctorAgreements').doc(agreementId).update(agreementData);
            console.log('Agreement updated:', agreementId);
            showTemporaryMessage('Doctor agreement updated successfully!', 'success');
        } else {
            // Add new agreement
            agreementData.createdAt = new Date();
            const docRef = await db.collection('doctorAgreements').add(agreementData);
            console.log('Agreement added with ID:', docRef.id);
            showTemporaryMessage('Doctor agreement added successfully!', 'success');
        }

        hideAgreementForm();
        await loadAgreements();
        
    } catch (error) {
        console.error('Error saving agreement:', error);
        showTemporaryMessage('Error saving agreement: ' + error.message, 'error');
    }
}

// Edit Agreement
function editAgreement(id) {
    try {
        const agreement = agreements.find(a => a.id === id);
        if (!agreement) {
            alert('Agreement not found');
            return;
        }
        
        editMode = true;
        document.getElementById('formTitle').textContent = "Edit Doctor Agreement";
        document.getElementById('agreementForm').style.display = 'block';
        document.getElementById('agreementId').value = agreement.id;
        
        // Fill form with agreement data
        document.getElementById('doctorName').value = agreement.doctorName || '';
        document.getElementById('startDate').value = agreement.startDate || '';
        document.getElementById('endDate').value = agreement.endDate || '';
        document.getElementById('agreementAmount').value = agreement.agreementAmount || '';
        document.getElementById('paymentFrequency').value = agreement.paymentFrequency || '';
        document.getElementById('paidAmount').value = agreement.paidAmount || '';
        document.getElementById('returnValue').value = agreement.returnValue || '';
        document.getElementById('status').value = agreement.status || 'active';
        document.getElementById('notes').value = agreement.notes || '';
        
        updatePendingAmount();
        
    } catch (error) {
        console.error('Error editing agreement:', error);
        showTemporaryMessage('Error editing agreement: ' + error.message, 'error');
    }
}

// Delete Agreement
async function deleteAgreement(id) {
    const agreement = agreements.find(a => a.id === id);
    if (!agreement) return;
    
    const confirmation = confirm(
        `Are you sure you want to delete agreement with ${agreement.doctorName}?\n\n` +
        `Agreement Amount: ₹${agreement.agreementAmount}\n` +
        `Status: ${agreement.status}\n` +
        `This action cannot be undone!`
    );
    
    if (confirmation) {
        try {
            await db.collection('doctorAgreements').doc(id).delete();
            console.log('Agreement deleted:', id);
            showTemporaryMessage('Doctor agreement deleted successfully!', 'success');
            await loadAgreements();
            
        } catch (error) {
            console.error('Error deleting agreement:', error);
            showTemporaryMessage('Error deleting agreement: ' + error.message, 'error');
        }
    }
}

// Render Agreements Table
function renderAgreements(filteredAgreements = agreements) {
    if (!agreementsTableBody) return;
    
    agreementsTableBody.innerHTML = '';

    if (filteredAgreements.length === 0) {
        agreementsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading">
                    <h3>No doctor agreements found</h3>
                    <p>Click "Add Agreement" to create your first doctor agreement</p>
                </td>
            </tr>
        `;
        updateSummary(filteredAgreements);
        return;
    }

    let totalAgreements = 0;
    let totalExpense = 0;
    let reviewCount = 0;

    filteredAgreements.forEach(agreement => {
        const tr = document.createElement('tr');
        
        // Determine row class based on performance and status
        const rowClass = getRowClass(agreement);
        if (rowClass) tr.className = rowClass;
        
        // Format dates
        const startDate = new Date(agreement.startDate).toLocaleDateString();
        const endDate = new Date(agreement.endDate).toLocaleDateString();
        
        // Status badge
        const statusBadge = `<span class="status-badge status-${agreement.status}">${agreement.status}</span>`;
        
        tr.innerHTML = `
            <td><strong>${agreement.doctorName}</strong></td>
            <td>${startDate} – ${endDate}</td>
            <td>₹${agreement.agreementAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>₹${agreement.paidAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>₹${agreement.pendingAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>₹${agreement.returnValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>${statusBadge}</td>
            <td class="action-cell">
                <button class="btn edit-btn" onclick="editAgreement('${agreement.id}')">Edit</button>
                <button class="btn delete-btn" onclick="deleteAgreement('${agreement.id}')">Delete</button>
            </td>
        `;
        agreementsTableBody.appendChild(tr);

        // Update summary counts
        totalAgreements++;
        totalExpense += agreement.paidAmount;
        if (agreement.status === 'discontinued') reviewCount++;
    });

    updateSummary(filteredAgreements, totalAgreements, totalExpense, reviewCount);
}

// Determine row CSS class based on agreement performance
function getRowClass(agreement) {
    const today = new Date();
    const endDate = new Date(agreement.endDate);
    
    // Completed agreements
    if (agreement.status === 'completed') return 'completed';
    
    // Discontinued agreements
    if (agreement.status === 'discontinued') return 'needs-review';
    
    // Expired agreements
    if (endDate < today) return 'needs-review';
    
    // Performance-based coloring
    if (agreement.returnValue >= agreement.paidAmount) {
        return 'performing-well';
    } else if (agreement.returnValue < agreement.paidAmount) {
        return 'underperforming';
    }
    
    return '';
}

// Update Summary Cards
function updateSummary(filteredAgreements = [], totalAgreements = 0, totalExpense = 0, reviewCount = 0) {
    if (totalAgreementsElem) {
        totalAgreementsElem.textContent = totalAgreements;
    }
    if (totalExpenseElem) {
        totalExpenseElem.textContent = totalExpense.toLocaleString('en-IN', {minimumFractionDigits: 2});
    }
    if (reviewCountElem) {
        // Count discontinued + expired agreements
        const expiredCount = filteredAgreements.filter(agreement => {
            const endDate = new Date(agreement.endDate);
            const today = new Date();
            return endDate < today && agreement.status === 'active';
        }).length;
        reviewCountElem.textContent = reviewCount + expiredCount;
    }
}

// Filter Functions
function toggleFilterSection() {
    const filterSection = document.getElementById('filterSection');
    filterSection.style.display = filterSection.style.display === 'none' ? 'block' : 'none';
}

function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const doctorFilter = document.getElementById('filterDoctor').value;
    const startDateFilter = document.getElementById('filterStartDate').value;
    const endDateFilter = document.getElementById('filterEndDate').value;
    const performanceFilter = document.getElementById('filterPerformance').value;
    
    currentFilters = { statusFilter, doctorFilter, startDateFilter, endDateFilter, performanceFilter };
    
    let filtered = agreements;
    
    // Apply status filter
    if (statusFilter) {
        filtered = filtered.filter(agreement => agreement.status === statusFilter);
    }
    
    // Apply doctor filter
    if (doctorFilter) {
        filtered = filtered.filter(agreement => agreement.doctorName === doctorFilter);
    }
    
    // Apply date range filter
    if (startDateFilter) {
        filtered = filtered.filter(agreement => agreement.startDate >= startDateFilter);
    }
    if (endDateFilter) {
        filtered = filtered.filter(agreement => agreement.endDate <= endDateFilter);
    }
    
    // Apply performance filter
    if (performanceFilter === 'performing') {
        filtered = filtered.filter(agreement => agreement.returnValue >= agreement.paidAmount);
    } else if (performanceFilter === 'underperforming') {
        filtered = filtered.filter(agreement => agreement.returnValue < agreement.paidAmount);
    }
    
    renderAgreements(filtered);
}

// Sorting Functionality
function setupEventListeners() {
    // Add click listeners to table headers for sorting
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const field = header.getAttribute('data-sort');
            sortAgreements(field);
        });
    });
}

function sortAgreements(field) {
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    const sortedAgreements = [...agreements].sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];
        
        // Handle dates
        if (field.includes('Date')) {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }
        
        // Handle numbers
        if (typeof aValue === 'number') {
            return currentSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle strings
        if (currentSort.direction === 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    
    renderAgreements(sortedAgreements);
}

// Utility Functions
function showLoadingState() {
    if (agreementsTableBody) {
        agreementsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading">
                    <h3>Loading doctor agreements...</h3>
                    <p>Please wait while we load your agreements data</p>
                </td>
            </tr>
        `;
    }
}

function showErrorMessage(message) {
    if (agreementsTableBody) {
        agreementsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="error-message">
                    <h3>Error Loading Agreements</h3>
                    <p>${message}</p>
                    <button class="btn add-btn" onclick="loadAgreements()" style="margin-top: 10px;">Try Again</button>
                </td>
            </tr>
        `;
    }
}

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

// Make functions globally available
window.showAgreementForm = showAgreementForm;
window.hideAgreementForm = hideAgreementForm;
window.saveAgreement = saveAgreement;
window.editAgreement = editAgreement;
window.deleteAgreement = deleteAgreement;
window.updatePendingAmount = updatePendingAmount;
window.toggleFilterSection = toggleFilterSection;
window.applyFilters = applyFilters;

console.log('📋 Doctor Agreements module loaded successfully!');