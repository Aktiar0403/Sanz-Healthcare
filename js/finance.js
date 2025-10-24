// Finance Tab JavaScript
class FinanceManager {
    constructor() {
        this.db = firebase.firestore();
        this.financeCollection = this.db.collection('finance');
        this.reportsCollection = this.db.collection('reports');
        
        this.currentUser = null;
        this.transactions = [];
        this.filteredTransactions = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            type: 'all',
            dateFrom: '',
            dateTo: '',
            search: ''
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.loadFinanceRecords();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Accordion toggles
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const accordion = header.parentElement;
                accordion.classList.toggle('active');
            });
        });

        // Form submissions
        document.getElementById('incomeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addFinanceRecord('income');
        });

        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addFinanceRecord('expense');
        });

        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateFinanceRecord();
        });

        // Buttons
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadFinanceRecords();
        });

        document.getElementById('exportReportsBtn').addEventListener('click', () => {
            this.exportFinanceToReports();
        });

        document.getElementById('refreshSummaryBtn').addEventListener('click', () => {
            this.calculateSummary();
        });

        document.getElementById('exportSummaryBtn').addEventListener('click', () => {
            this.exportFinanceToReports();
        });

        // Filter controls
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFilters();
        });

        document.getElementById('dateFromFilter').addEventListener('change', (e) => {
            this.filters.dateFrom = e.target.value;
            this.applyFilters();
        });

        document.getElementById('dateToFilter').addEventListener('change', (e) => {
            this.filters.dateTo = e.target.value;
            this.applyFilters();
        });

        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.applyFilters();
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        // Pagination
        document.getElementById('prevPageBtn').addEventListener('click', () => {
            this.previousPage();
        });

        document.getElementById('nextPageBtn').addEventListener('click', () => {
            this.nextPage();
        });

        // Modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.closeEditModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeEditModal();
            }
        });
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('incomeDate').value = today;
        document.getElementById('expenseDate').value = today;
        document.getElementById('editDate').value = today;
    }

    checkAuthState() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                console.log('User authenticated:', user.email);
            } else {
                console.log('No user signed in');
                // Redirect to login if needed
                // window.location.href = '../login.html';
            }
        });
    }

    async addFinanceRecord(type) {
        this.showLoading(true);
        
        try {
            const formId = type === 'income' ? 'incomeForm' : 'expenseForm';
            const form = document.getElementById(formId);
            const formData = new FormData(form);
            
          const record = {
    type: type,
    source: type === 'income' ? document.getElementById('incomeSource').value : '',
    category: type === 'income' ? document.getElementById('incomeCategory').value : document.getElementById('expenseCategory').value,
    amount: parseFloat(type === 'income' ? document.getElementById('incomeAmount').value : document.getElementById('expenseAmount').value),
    date: type === 'income' ? document.getElementById('incomeDate').value : document.getElementById('expenseDate').value,
    linkedTab: 'finance',
    notes: type === 'income' ? document.getElementById('incomeNotes').value : document.getElementById('expenseRemarks').value,
    customerId: type === 'income' ? document.getElementById('incomeCustomer').value : '', // ✅ Fixed: Added colon
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
};

            await this.financeCollection.add(record);
            
            this.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} record added successfully!`, 'success');
            form.reset();
            this.setDefaultDates();
            
        } catch (error) {
            console.error('Error adding finance record:', error);
            this.showToast('Error adding record. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    loadFinanceRecords() {
        this.showLoading(true);
        
        this.financeCollection
            .orderBy('date', 'desc')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                this.transactions = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    this.transactions.push({
                        id: doc.id,
                        ...data,
                        date: data.date || 'Unknown Date',
                        amount: data.amount || 0
                    });
                });
                
                this.applyFilters();
                this.calculateSummary();
                this.showLoading(false);
            }, (error) => {
                console.error('Error loading finance records:', error);
                this.showToast('Error loading transactions.', 'error');
                this.showLoading(false);
            });
    }

    applyFilters() {
        this.currentPage = 1;
        this.filteredTransactions = this.transactions.filter(transaction => {
            // Type filter
            if (this.filters.type !== 'all' && transaction.type !== this.filters.type) {
                return false;
            }
            
            // Date range filter
            if (this.filters.dateFrom && transaction.date < this.filters.dateFrom) {
                return false;
            }
            if (this.filters.dateTo && transaction.date > this.filters.dateTo) {
                return false;
            }
            
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableFields = [
                    transaction.source,
                    transaction.category,
                    transaction.notes,
                    transaction.linkedTab,
                    transaction.amount.toString()
                ].join(' ').toLowerCase();
                
                if (!searchableFields.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.renderTransactionsTable();
        this.updatePagination();
    }

    clearFilters() {
        document.getElementById('typeFilter').value = 'all';
        document.getElementById('dateFromFilter').value = '';
        document.getElementById('dateToFilter').value = '';
        document.getElementById('searchInput').value = '';
        
        this.filters = {
            type: 'all',
            dateFrom: '',
            dateTo: '',
            search: ''
        };
        
        this.applyFilters();
    }

    renderTransactionsTable() {
        const tbody = document.getElementById('transactionsBody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageTransactions = this.filteredTransactions.slice(startIndex, endIndex);
        
        if (pageTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div style="padding: 40px; text-align: center; color: #6c757d;">
                            <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                            <p>No transactions found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = pageTransactions.map(transaction => `
            <tr>
                <td>
                    <span class="type-badge ${transaction.type}">
                        ${transaction.type}
                    </span>
                </td>
                <td>
                    <strong>${transaction.source || transaction.category}</strong>
                    ${transaction.category && transaction.source !== transaction.category ? `<br><small>${transaction.category}</small>` : ''}
                </td>
                <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                    <strong>₹${transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td>${this.formatDate(transaction.date)}</td>
                <td>
                    <span class="badge badge-secondary">${transaction.linkedTab || 'Manual'}</span>
                </td>
                <td>${transaction.notes || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline edit-btn" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline delete-btn" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Add event listeners to action buttons
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.openEditModal(id);
            });
        });
        
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.deleteFinanceRecord(id);
            });
        });
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
        const paginationInfo = document.getElementById('paginationInfo');
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredTransactions.length);
        
        paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${this.filteredTransactions.length} transactions`;
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTransactionsTable();
            this.updatePagination();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTransactionsTable();
            this.updatePagination();
        }
    }

    async openEditModal(id) {
        try {
            const doc = await this.financeCollection.doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                
                document.getElementById('editId').value = id;
                document.getElementById('editType').value = data.type;
                document.getElementById('editSource').value = data.source || '';
                document.getElementById('editCategory').value = data.category || '';
                document.getElementById('editAmount').value = data.amount || 0;
                document.getElementById('editDate').value = data.date || '';
                document.getElementById('editLinkedTab').value = data.linkedTab || '';
                document.getElementById('editNotes').value = data.notes || '';
                
                document.getElementById('editModal').style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading transaction for edit:', error);
            this.showToast('Error loading transaction data.', 'error');
        }
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editForm').reset();
    }

    async updateFinanceRecord() {
        this.showLoading(true);
        
        try {
            const id = document.getElementById('editId').value;
            const updatedData = {
                type: document.getElementById('editType').value,
                source: document.getElementById('editSource').value,
                category: document.getElementById('editCategory').value,
                amount: parseFloat(document.getElementById('editAmount').value),
                date: document.getElementById('editDate').value,
                linkedTab: document.getElementById('editLinkedTab').value,
                notes: document.getElementById('editNotes').value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.financeCollection.doc(id).update(updatedData);
            
            this.showToast('Transaction updated successfully!', 'success');
            this.closeEditModal();
            
        } catch (error) {
            console.error('Error updating finance record:', error);
            this.showToast('Error updating transaction. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteFinanceRecord(id) {
        if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            return;
        }
        
        this.showLoading(true);
        
        try {
            await this.financeCollection.doc(id).delete();
            this.showToast('Transaction deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting finance record:', error);
            this.showToast('Error deleting transaction. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    calculateSummary() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
            
        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
            
        const netProfit = totalIncome - totalExpenses;
        const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
        
        // Update cards
        document.getElementById('totalIncome').textContent = 
            `₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('totalExpenses').textContent = 
            `₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('netProfit').textContent = 
            `₹${netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('profitMargin').textContent = 
            `${profitMargin.toFixed(2)}%`;
        
        // Update summary section
        document.getElementById('summaryIncome').textContent = 
            `₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('summaryExpenses').textContent = 
            `₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('summaryProfit').textContent = 
            `₹${netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('summaryMargin').textContent = 
            `${profitMargin.toFixed(2)}%`;
        
        // Color code profit
        const profitElements = document.querySelectorAll('#netProfit, #summaryProfit');
        profitElements.forEach(el => {
            el.className = netProfit >= 0 ? 'text-success' : 'text-danger';
        });
    }

    async exportFinanceToReports() {
        this.showLoading(true);
        
        try {
            const now = new Date();
            const month = now.toLocaleString('default', { month: 'long' });
            const year = now.getFullYear();
            const monthYear = `${month} ${year}`;
            
            const totalIncome = this.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const totalExpenses = this.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const netProfit = totalIncome - totalExpenses;
            
            const reportData = {
                month: monthYear,
                totalIncome: totalIncome,
                totalExpenses: totalExpenses,
                netProfit: netProfit,
                transactionCount: this.transactions.length,
                exportedAt: firebase.firestore.FieldValue.serverTimestamp(),
                exportedBy: this.currentUser ? this.currentUser.email : 'Unknown'
            };
            
            await this.reportsCollection.add(reportData);
            
            this.showToast('Finance data exported to reports successfully!', 'success');
            
        } catch (error) {
            console.error('Error exporting to reports:', error);
            this.showToast('Error exporting data to reports.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.add('active');
        } else {
            spinner.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Auto-integration functions for other tabs
function addFinanceRecordFromOtherTab(recordData) {
    const db = firebase.firestore();
    const financeCollection = db.collection('finance');
    
    const record = {
        ...recordData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    return financeCollection.add(record)
        .then(() => console.log('Finance record added from external tab'))
        .catch(error => console.error('Error adding finance record from external tab:', error));
}

// Initialize Finance Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.financeManager = new FinanceManager();
});

// Export functions for other tabs to use
window.FinanceIntegration = {
    addRecord: addFinanceRecordFromOtherTab
};