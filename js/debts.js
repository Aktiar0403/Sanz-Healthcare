// Debts Management Module
class DebtsManager {
    constructor() {
        this.db = firebase.firestore();
        this.bankDebtsCollection = this.db.collection('bankDebts');
        this.investorDebtsCollection = this.db.collection('investorDebts');
        this.financeCollection = this.db.collection('finance');
        
        this.currentEditingBankId = null;
        this.currentEditingInvestorId = null;
        
        this.initEventListeners();
        this.loadDebtsData();
    }

    initEventListeners() {
        // Tab navigation
        document.getElementById('bankTab').addEventListener('click', () => this.switchTab('bank'));
        document.getElementById('investorTab').addEventListener('click', () => this.switchTab('investor'));

        // Bank form
        document.getElementById('bankDebtForm').addEventListener('submit', (e) => this.handleBankDebtSubmit(e));
        document.getElementById('cancelBankEdit').addEventListener('click', () => this.cancelBankEdit());

        // Investor form
        document.getElementById('investorDebtForm').addEventListener('submit', (e) => this.handleInvestorDebtSubmit(e));
        document.getElementById('cancelInvestorEdit').addEventListener('click', () => this.cancelInvestorEdit());

        // Auto-calculation listeners
        document.getElementById('loanAmount').addEventListener('input', () => this.calculateBankFields());
        document.getElementById('interestRate').addEventListener('input', () => this.calculateBankFields());
        document.getElementById('tenureMonths').addEventListener('input', () => this.calculateBankFields());

        document.getElementById('principalInvested').addEventListener('input', () => this.calculateInvestorFields());
        document.getElementById('roiPercent').addEventListener('input', () => this.calculateInvestorFields());
        document.getElementById('partialWithdrawal').addEventListener('input', () => this.calculateInvestorFields());
        document.getElementById('skippedROI').addEventListener('change', () => this.calculateInvestorFields());
    }

    switchTab(tab) {
        const bankTab = document.getElementById('bankTab');
        const investorTab = document.getElementById('investorTab');
        const bankSection = document.getElementById('bankSection');
        const investorSection = document.getElementById('investorSection');

        if (tab === 'bank') {
            bankTab.classList.add('border-blue-500', 'text-blue-600');
            bankTab.classList.remove('border-transparent', 'text-gray-500');
            investorTab.classList.add('border-transparent', 'text-gray-500');
            investorTab.classList.remove('border-blue-500', 'text-blue-600');
            bankSection.classList.remove('hidden');
            investorSection.classList.add('hidden');
        } else {
            investorTab.classList.add('border-blue-500', 'text-blue-600');
            investorTab.classList.remove('border-transparent', 'text-gray-500');
            bankTab.classList.add('border-transparent', 'text-gray-500');
            bankTab.classList.remove('border-blue-500', 'text-blue-600');
            investorSection.classList.remove('hidden');
            bankSection.classList.add('hidden');
        }
    }

    calculateEMI(P, R, N) {
        // P = Principal, R = Monthly interest rate, N = Tenure in months
        const monthlyRate = R / 100 / 12;
        const emi = (P * monthlyRate * Math.pow(1 + monthlyRate, N)) / 
                   (Math.pow(1 + monthlyRate, N) - 1);
        return Math.round(emi * 100) / 100;
    }

    calculateBankFields() {
        const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const tenureMonths = parseInt(document.getElementById('tenureMonths').value) || 0;

        if (loanAmount > 0 && interestRate > 0 && tenureMonths > 0) {
            const emi = this.calculateEMI(loanAmount, interestRate, tenureMonths);
            document.getElementById('monthlyEMI').value = emi.toFixed(2);
            document.getElementById('remainingPrincipal').value = loanAmount.toFixed(2);
        }
    }

    calculateInvestorFields() {
        const principalInvested = parseFloat(document.getElementById('principalInvested').value) || 0;
        const roiPercent = parseFloat(document.getElementById('roiPercent').value) || 0;
        const partialWithdrawal = parseFloat(document.getElementById('partialWithdrawal').value) || 0;

        const remainingPrincipal = Math.max(0, principalInvested - partialWithdrawal);
        const monthlyROI = remainingPrincipal * (roiPercent / 100);

        document.getElementById('remainingPrincipalInvestor').value = remainingPrincipal.toFixed(2);
        document.getElementById('monthlyROIValue').value = monthlyROI.toFixed(2);
    }

    async handleBankDebtSubmit(e) {
        e.preventDefault();
        
        const formData = {
            bankName: document.getElementById('bankName').value,
            loanAmount: parseFloat(document.getElementById('loanAmount').value),
            startDate: document.getElementById('startDate').value,
            tenureMonths: parseInt(document.getElementById('tenureMonths').value),
            interestRate: parseFloat(document.getElementById('interestRate').value),
            monthlyEMI: parseFloat(document.getElementById('monthlyEMI').value),
            remainingPrincipal: parseFloat(document.getElementById('remainingPrincipal').value),
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (this.currentEditingBankId) {
                // Update existing debt
                await this.bankDebtsCollection.doc(this.currentEditingBankId).update({
                    ...formData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.showToast('Bank debt updated successfully');
            } else {
                // Add new debt
                await this.bankDebtsCollection.add(formData);
                this.showToast('Bank debt added successfully');
            }

            // Sync to finance if active
            if (formData.status === 'Active') {
                await this.syncToFinance('bank', formData);
            }

            this.resetBankForm();
        } catch (error) {
            console.error('Error saving bank debt:', error);
            this.showToast('Error saving bank debt', 'error');
        }
    }

    async handleInvestorDebtSubmit(e) {
        e.preventDefault();
        
        const formData = {
            investorName: document.getElementById('investorName').value,
            principalInvested: parseFloat(document.getElementById('principalInvested').value),
            roiPercent: parseFloat(document.getElementById('roiPercent').value),
            startDate: document.getElementById('investorStartDate').value,
            skippedROI: document.getElementById('skippedROI').checked,
            partialWithdrawal: parseFloat(document.getElementById('partialWithdrawal').value) || 0,
            remainingPrincipal: parseFloat(document.getElementById('remainingPrincipalInvestor').value),
            monthlyROIValue: parseFloat(document.getElementById('monthlyROIValue').value),
            status: document.getElementById('investorStatus').value,
            notes: document.getElementById('investorNotes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (this.currentEditingInvestorId) {
                // Update existing debt
                await this.investorDebtsCollection.doc(this.currentEditingInvestorId).update({
                    ...formData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.showToast('Investor debt updated successfully');
            } else {
                // Add new debt
                await this.investorDebtsCollection.add(formData);
                this.showToast('Investor debt added successfully');
            }

            // Sync to finance if active and ROI not skipped
            if (formData.status === 'Active' && !formData.skippedROI) {
                await this.syncToFinance('investor', formData);
            }

            this.resetInvestorForm();
        } catch (error) {
            console.error('Error saving investor debt:', error);
            this.showToast('Error saving investor debt', 'error');
        }
    }

    async syncToFinance(type, debtData) {
        try {
            const financeData = {
                type: 'Expense',
                category: 'Debt Servicing',
                amount: type === 'bank' ? debtData.monthlyEMI : debtData.monthlyROIValue,
                description: type === 'bank' 
                    ? `EMI Payment - ${debtData.bankName}`
                    : `ROI Payment - ${debtData.investorName}`,
                date: new Date().toISOString().split('T')[0],
                reference: type === 'bank' ? `BANK_${debtData.bankName}` : `INV_${debtData.investorName}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.financeCollection.add(financeData);
        } catch (error) {
            console.error('Error syncing to finance:', error);
        }
    }

    editBankDebt(id) {
        this.bankDebtsCollection.doc(id).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                this.currentEditingBankId = id;

                document.getElementById('bankDebtId').value = id;
                document.getElementById('bankName').value = data.bankName;
                document.getElementById('loanAmount').value = data.loanAmount;
                document.getElementById('startDate').value = data.startDate;
                document.getElementById('tenureMonths').value = data.tenureMonths;
                document.getElementById('interestRate').value = data.interestRate;
                document.getElementById('monthlyEMI').value = data.monthlyEMI;
                document.getElementById('remainingPrincipal').value = data.remainingPrincipal;
                document.getElementById('status').value = data.status;
                document.getElementById('notes').value = data.notes || '';

                document.getElementById('bankFormTitle').textContent = 'Edit Bank Debt';
                document.querySelector('#bankDebtForm button[type="submit"]').innerHTML = '<i class="fas fa-save mr-2"></i>Update Debt';
                document.getElementById('cancelBankEdit').classList.remove('hidden');

                // Scroll to form
                document.getElementById('bankDebtForm').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    editInvestorDebt(id) {
        this.investorDebtsCollection.doc(id).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                this.currentEditingInvestorId = id;

                document.getElementById('investorDebtId').value = id;
                document.getElementById('investorName').value = data.investorName;
                document.getElementById('principalInvested').value = data.principalInvested;
                document.getElementById('roiPercent').value = data.roiPercent;
                document.getElementById('investorStartDate').value = data.startDate;
                document.getElementById('skippedROI').checked = data.skippedROI;
                document.getElementById('partialWithdrawal').value = data.partialWithdrawal || 0;
                document.getElementById('remainingPrincipalInvestor').value = data.remainingPrincipal;
                document.getElementById('monthlyROIValue').value = data.monthlyROIValue;
                document.getElementById('investorStatus').value = data.status;
                document.getElementById('investorNotes').value = data.notes || '';

                document.getElementById('investorFormTitle').textContent = 'Edit Investor Debt';
                document.querySelector('#investorDebtForm button[type="submit"]').innerHTML = '<i class="fas fa-save mr-2"></i>Update Investor';
                document.getElementById('cancelInvestorEdit').classList.remove('hidden');

                // Scroll to form
                document.getElementById('investorDebtForm').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    async deleteBankDebt(id) {
        if (confirm('Are you sure you want to delete this bank debt?')) {
            try {
                await this.bankDebtsCollection.doc(id).delete();
                this.showToast('Bank debt deleted successfully');
            } catch (error) {
                console.error('Error deleting bank debt:', error);
                this.showToast('Error deleting bank debt', 'error');
            }
        }
    }

    async deleteInvestorDebt(id) {
        if (confirm('Are you sure you want to delete this investor debt?')) {
            try {
                await this.investorDebtsCollection.doc(id).delete();
                this.showToast('Investor debt deleted successfully');
            } catch (error) {
                console.error('Error deleting investor debt:', error);
                this.showToast('Error deleting investor debt', 'error');
            }
        }
    }

    cancelBankEdit() {
        this.currentEditingBankId = null;
        this.resetBankForm();
    }

    cancelInvestorEdit() {
        this.currentEditingInvestorId = null;
        this.resetInvestorForm();
    }

    resetBankForm() {
        document.getElementById('bankDebtForm').reset();
        document.getElementById('bankDebtId').value = '';
        document.getElementById('monthlyEMI').value = '';
        document.getElementById('remainingPrincipal').value = '';
        document.getElementById('bankFormTitle').textContent = 'Add Bank Debt';
        document.querySelector('#bankDebtForm button[type="submit"]').innerHTML = '<i class="fas fa-plus mr-2"></i>Add Debt';
        document.getElementById('cancelBankEdit').classList.add('hidden');
        this.currentEditingBankId = null;
    }

    resetInvestorForm() {
        document.getElementById('investorDebtForm').reset();
        document.getElementById('investorDebtId').value = '';
        document.getElementById('remainingPrincipalInvestor').value = '';
        document.getElementById('monthlyROIValue').value = '';
        document.getElementById('investorFormTitle').textContent = 'Add Investor Debt';
        document.querySelector('#investorDebtForm button[type="submit"]').innerHTML = '<i class="fas fa-plus mr-2"></i>Add Investor';
        document.getElementById('cancelInvestorEdit').classList.add('hidden');
        this.currentEditingInvestorId = null;
    }

    loadDebtsData() {
        // Load bank debts
        this.bankDebtsCollection.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const tableBody = document.getElementById('bankDebtsTable');
            tableBody.innerHTML = '';

            snapshot.forEach(doc => {
                const data = doc.data();
                const row = this.createBankDebtRow(doc.id, data);
                tableBody.appendChild(row);
            });

            this.updateSummaryCards();
        });

        // Load investor debts
        this.investorDebtsCollection.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const tableBody = document.getElementById('investorDebtsTable');
            tableBody.innerHTML = '';

            snapshot.forEach(doc => {
                const data = doc.data();
                const row = this.createInvestorDebtRow(doc.id, data);
                tableBody.appendChild(row);
            });

            this.updateSummaryCards();
        });
    }

    createBankDebtRow(id, data) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${data.bankName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${data.loanAmount.toLocaleString('en-IN')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${data.monthlyEMI.toLocaleString('en-IN')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${data.remainingPrincipal.toLocaleString('en-IN')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(data.startDate).toLocaleDateString('en-IN')}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${data.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${data.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="debtsManager.editBankDebt('${id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="debtsManager.deleteBankDebt('${id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        return row;
    }

    createInvestorDebtRow(id, data) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${data.investorName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${data.principalInvested.toLocaleString('en-IN')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${data.roiPercent}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${data.monthlyROIValue.toLocaleString('en-IN')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${data.remainingPrincipal.toLocaleString('en-IN')}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${data.skippedROI ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                    ${data.skippedROI ? 'Yes' : 'No'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${(data.partialWithdrawal || 0).toLocaleString('en-IN')}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${data.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${data.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="debtsManager.editInvestorDebt('${id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="debtsManager.deleteInvestorDebt('${id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        return row;
    }

    async updateSummaryCards() {
        try {
            const bankSnapshot = await this.bankDebtsCollection.get();
            const investorSnapshot = await this.investorDebtsCollection.get();

            let totalActiveDebts = 0;
            let totalPrincipalOutstanding = 0;
            let totalMonthlyROIEMI = 0;
            let totalMonthlyDebtExpense = 0;

            // Process bank debts
            bankSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'Active') {
                    totalActiveDebts++;
                    totalPrincipalOutstanding += data.remainingPrincipal;
                    totalMonthlyROIEMI += data.monthlyEMI;
                    totalMonthlyDebtExpense += data.monthlyEMI;
                }
            });

            // Process investor debts
            investorSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'Active') {
                    totalActiveDebts++;
                    totalPrincipalOutstanding += data.remainingPrincipal;
                    totalMonthlyROIEMI += data.monthlyROIValue;
                    if (!data.skippedROI) {
                        totalMonthlyDebtExpense += data.monthlyROIValue;
                    }
                }
            });

            // Update UI
            document.getElementById('totalActiveDebts').textContent = totalActiveDebts;
            document.getElementById('totalPrincipalOutstanding').textContent = `₹${totalPrincipalOutstanding.toLocaleString('en-IN')}`;
            document.getElementById('totalMonthlyROIEMI').textContent = `₹${totalMonthlyROIEMI.toLocaleString('en-IN')}`;
            document.getElementById('totalMonthlyDebtExpense').textContent = `₹${totalMonthlyDebtExpense.toLocaleString('en-IN')}`;
        } catch (error) {
            console.error('Error updating summary cards:', error);
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        
        // Set background color based on type
        if (type === 'error') {
            toast.classList.remove('bg-green-500');
            toast.classList.add('bg-red-500');
        } else {
            toast.classList.remove('bg-red-500');
            toast.classList.add('bg-green-500');
        }
        
        toast.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// Initialize Debts Manager when DOM is loaded
let debtsManager;
document.addEventListener('DOMContentLoaded', function() {
    debtsManager = new DebtsManager();
});