// Marketing Tab - Doctor Agreements Management
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    const db = firebase.firestore();
    const auth = firebase.auth();
    
    // DOM Elements
    const addAgreementBtn = document.getElementById('addAgreementBtn');
    const agreementModal = document.getElementById('agreementModal');
    const agreementForm = document.getElementById('agreementForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const modalTitle = document.getElementById('modalTitle');
    const agreementsTableBody = document.getElementById('agreementsTableBody');
    const tableLoading = document.getElementById('tableLoading');
    const tableEmpty = document.getElementById('tableEmpty');
    const addFirstAgreement = document.getElementById('addFirstAgreement');
    
    // Summary Cards
    const totalAgreementsEl = document.getElementById('totalAgreements');
    const totalExpenseEl = document.getElementById('totalExpense');
    const reviewDiscontinuedEl = document.getElementById('reviewDiscontinued');
    
    // Form Fields
    const doctorNameSelect = document.getElementById('doctorName');
    const agreementStartInput = document.getElementById('agreementStart');
    const agreementEndInput = document.getElementById('agreementEnd');
    const agreementAmountInput = document.getElementById('agreementAmount');
    const paidAmountInput = document.getElementById('paidAmount');
    const pendingAmountInput = document.getElementById('pendingAmount');
    const expectedReturnInput = document.getElementById('expectedReturn');
    const expectedReturnRatioInput = document.getElementById('expectedReturnRatio');
    const returnValueInput = document.getElementById('returnValue');
    const statusSelect = document.getElementById('status');
    const paymentFrequencySelect = document.getElementById('paymentFrequency');
    const notesTextarea = document.getElementById('notes');
    
    // State
    let currentEditingId = null;
    let doctorsList = [];
    let agreements = [];
    
    // Initialize Date Pickers
    flatpickr(".datepicker", {
        dateFormat: "Y-m-d",
        allowInput: true
    });
    
    // Event Listeners
    addAgreementBtn.addEventListener('click', openAddModal);
    cancelBtn.addEventListener('click', closeModal);
    agreementForm.addEventListener('submit', handleFormSubmit);
    addFirstAgreement.addEventListener('click', openAddModal);
    
    // Field Calculations
    agreementAmountInput.addEventListener('input', calculatePendingAmount);
    paidAmountInput.addEventListener('input', calculatePendingAmount);
    
    expectedReturnInput.addEventListener('input', function() {
        const agreementAmount = parseFloat(agreementAmountInput.value) || 0;
        const expectedReturn = parseFloat(this.value) || 0;
        
        if (agreementAmount > 0) {
            const ratio = (expectedReturn / agreementAmount) * 100;
            expectedReturnRatioInput.value = ratio.toFixed(2);
        }
    });
    
    expectedReturnRatioInput.addEventListener('input', function() {
        const agreementAmount = parseFloat(agreementAmountInput.value) || 0;
        const ratio = parseFloat(this.value) || 0;
        
        if (agreementAmount > 0) {
            const expectedReturn = (agreementAmount * ratio) / 100;
            expectedReturnInput.value = expectedReturn.toFixed(2);
        }
    });
    
    // Initialize the marketing tab
    initMarketingTab();
    
    // Functions
    function initMarketingTab() {
        // Check authentication
        auth.onAuthStateChanged(user => {
            if (user) {
                loadDoctors();
                fetchAgreements();
            } else {
                // Redirect to login if not authenticated
                window.location.href = '../login.html';
            }
        });
    }
    
    function loadDoctors() {
        db.collection('doctors').get()
            .then(snapshot => {
                doctorsList = [];
                doctorNameSelect.innerHTML = '<option value="">Select Doctor</option>';
                
                snapshot.forEach(doc => {
                    const doctor = { id: doc.id, ...doc.data() };
                    doctorsList.push(doctor);
                    
                    const option = document.createElement('option');
                    option.value = doctor.name;
                    option.textContent = doctor.name;
                    doctorNameSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading doctors:', error);
                showAlert('Error loading doctors list', 'error');
            });
    }
    
    function fetchAgreements() {
        tableLoading.classList.remove('hidden');
        tableEmpty.classList.add('hidden');
        
        db.collection('marketingAgreements')
            .onSnapshot(snapshot => {
                agreements = [];
                agreementsTableBody.innerHTML = '';
                
                snapshot.forEach(doc => {
                    agreements.push({ id: doc.id, ...doc.data() });
                });
                
                if (agreements.length === 0) {
                    tableLoading.classList.add('hidden');
                    tableEmpty.classList.remove('hidden');
                } else {
                    renderAgreementsTable();
                    tableLoading.classList.add('hidden');
                }
                
                calculateSummaryCards();
            }, error => {
                console.error('Error fetching agreements:', error);
                showAlert('Error loading agreements', 'error');
                tableLoading.classList.add('hidden');
            });
    }
    
    function renderAgreementsTable() {
        agreementsTableBody.innerHTML = '';
        
        agreements.forEach(agreement => {
            const row = document.createElement('tr');
            applyRowColoring(row, agreement);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${agreement.doctorName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(agreement.agreementStart)} - ${formatDate(agreement.agreementEnd)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹${formatCurrency(agreement.agreementAmount)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹${formatCurrency(agreement.paidAmount)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹${formatCurrency(agreement.pendingAmount)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹${formatCurrency(agreement.expectedReturn)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${agreement.expectedReturnRatio}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹${formatCurrency(agreement.returnValue)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(agreement.status)}">
                        ${agreement.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 edit-btn mr-3" data-id="${agreement.id}">Edit</button>
                    <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${agreement.id}">Delete</button>
                </td>
            `;
            
            agreementsTableBody.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openEditModal(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteAgreement(id);
            });
        });
    }
    
    function applyRowColoring(row, agreement) {
        // Reset any previous coloring
        row.className = '';
        
        // Check if agreement is expired or discontinued
        const today = new Date();
        const endDate = new Date(agreement.agreementEnd);
        
        if (agreement.status === 'Discontinued' || endDate < today) {
            row.classList.add('bg-yellow-50');
        } 
        // Check performance
        else if (agreement.returnValue >= agreement.expectedReturn) {
            row.classList.add('bg-green-50');
        } else {
            row.classList.add('bg-red-50');
        }
    }
    
    function getStatusBadgeClass(status) {
        switch(status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Completed':
                return 'bg-blue-100 text-blue-800';
            case 'Discontinued':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }
    
    function calculateSummaryCards() {
        const totalAgreements = agreements.length;
        const totalExpense = agreements.reduce((sum, agreement) => sum + (agreement.paidAmount || 0), 0);
        const reviewDiscontinued = agreements.filter(agreement => 
            agreement.status === 'Discontinued' || isAgreementExpired(agreement)
        ).length;
        
        totalAgreementsEl.textContent = totalAgreements;
        totalExpenseEl.textContent = `₹${formatCurrency(totalExpense)}`;
        reviewDiscontinuedEl.textContent = reviewDiscontinued;
    }
    
    function isAgreementExpired(agreement) {
        const today = new Date();
        const endDate = new Date(agreement.agreementEnd);
        return endDate < today && agreement.status !== 'Completed';
    }
    
    function openAddModal() {
        currentEditingId = null;
        modalTitle.textContent = 'Add New Agreement';
        agreementForm.reset();
        calculatePendingAmount();
        agreementModal.classList.remove('hidden');
    }
    
    function openEditModal(id) {
        const agreement = agreements.find(a => a.id === id);
        if (!agreement) return;
        
        currentEditingId = id;
        modalTitle.textContent = 'Edit Agreement';
        
        // Populate form fields
        doctorNameSelect.value = agreement.doctorName;
        agreementStartInput.value = agreement.agreementStart;
        agreementEndInput.value = agreement.agreementEnd;
        agreementAmountInput.value = agreement.agreementAmount;
        paidAmountInput.value = agreement.paidAmount;
        pendingAmountInput.value = agreement.pendingAmount;
        expectedReturnInput.value = agreement.expectedReturn;
        expectedReturnRatioInput.value = agreement.expectedReturnRatio;
        returnValueInput.value = agreement.returnValue;
        statusSelect.value = agreement.status;
        paymentFrequencySelect.value = agreement.paymentFrequency;
        notesTextarea.value = agreement.notes || '';
        
        agreementModal.classList.remove('hidden');
    }
    
    function closeModal() {
        agreementModal.classList.add('hidden');
        currentEditingId = null;
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Get form values
        const formData = {
            doctorName: doctorNameSelect.value,
            agreementStart: agreementStartInput.value,
            agreementEnd: agreementEndInput.value,
            agreementAmount: parseFloat(agreementAmountInput.value),
            paidAmount: parseFloat(paidAmountInput.value),
            pendingAmount: parseFloat(pendingAmountInput.value),
            expectedReturn: parseFloat(expectedReturnInput.value),
            expectedReturnRatio: parseFloat(expectedReturnRatioInput.value),
            returnValue: parseFloat(returnValueInput.value),
            status: statusSelect.value,
            paymentFrequency: paymentFrequencySelect.value,
            notes: notesTextarea.value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Validate form
        if (!validateForm(formData)) {
            return;
        }
        
        if (currentEditingId) {
            updateAgreement(currentEditingId, formData);
        } else {
            formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            addAgreement(formData);
        }
    }
    
    function validateForm(data) {
        if (!data.doctorName) {
            showAlert('Please select a doctor', 'error');
            return false;
        }
        
        if (!data.agreementStart || !data.agreementEnd) {
            showAlert('Please select start and end dates', 'error');
            return false;
        }
        
        if (new Date(data.agreementStart) >= new Date(data.agreementEnd)) {
            showAlert('End date must be after start date', 'error');
            return false;
        }
        
        if (data.agreementAmount <= 0) {
            showAlert('Agreement amount must be greater than 0', 'error');
            return false;
        }
        
        if (data.paidAmount < 0) {
            showAlert('Paid amount cannot be negative', 'error');
            return false;
        }
        
        if (data.paidAmount > data.agreementAmount) {
            showAlert('Paid amount cannot exceed agreement amount', 'error');
            return false;
        }
        
        return true;
    }
    
    function addAgreement(data) {
        db.collection('marketingAgreements').add(data)
            .then(() => {
                showAlert('Agreement added successfully', 'success');
                closeModal();
            })
            .catch(error => {
                console.error('Error adding agreement:', error);
                showAlert('Error adding agreement', 'error');
            });
    }
    
    function updateAgreement(id, data) {
        db.collection('marketingAgreements').doc(id).update(data)
            .then(() => {
                showAlert('Agreement updated successfully', 'success');
                closeModal();
            })
            .catch(error => {
                console.error('Error updating agreement:', error);
                showAlert('Error updating agreement', 'error');
            });
    }
    
    function deleteAgreement(id) {
        if (confirm('Are you sure you want to delete this agreement? This action cannot be undone.')) {
            db.collection('marketingAgreements').doc(id).delete()
                .then(() => {
                    showAlert('Agreement deleted successfully', 'success');
                })
                .catch(error => {
                    console.error('Error deleting agreement:', error);
                    showAlert('Error deleting agreement', 'error');
                });
        }
    }
    
    function calculatePendingAmount() {
        const agreementAmount = parseFloat(agreementAmountInput.value) || 0;
        const paidAmount = parseFloat(paidAmountInput.value) || 0;
        const pendingAmount = agreementAmount - paidAmount;
        
        pendingAmountInput.value = pendingAmount.toFixed(2);
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN').format(amount);
    }
    
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();
        
        const alert = document.createElement('div');
        alert.id = alertId;
        alert.className = `p-4 rounded-md shadow-md mb-4 ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`;
        alert.innerHTML = `
            <div class="flex justify-between items-center">
                <span>${message}</span>
                <button class="text-${type === 'success' ? 'green' : 'red'}-500 hover:text-${type === 'success' ? 'green' : 'red'}-700" onclick="document.getElementById('${alertId}').remove()">
                    &times;
                </button>
            </div>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    }
});