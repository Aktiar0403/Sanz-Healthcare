// js/dashboard.js - Dashboard specific functionality

class Dashboard {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
        this.revenueChart = null;
        this.performanceChart = null;
        
        this.init();
    }

    init() {
        this.initializeCharts();
        this.loadDashboardData();
        this.setupEventListeners();
    }

    initializeCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        this.revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Revenue (INR)',
                    data: [65000, 72000, 81000, 78000, 88500, 94258, 89000],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Revenue: ₹${context.parsed.y.toLocaleString('en-IN')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        });

        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        this.performanceChart = new Chart(performanceCtx, {
            type: 'bar',
            data: {
                labels: ['Paracetamol', 'Vitamin C', 'Amoxicillin', 'Insulin', 'Bandages'],
                datasets: [{
                    label: 'Units Sold',
                    data: [1200, 800, 650, 450, 300],
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                    ],
                    borderColor: [
                        '#2563eb',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    async loadDashboardData() {
        try {
            // Load recent activity
            await this.loadRecentActivity();
            
            // Load quick stats
            await this.loadQuickStats();
            
            // Load low stock alerts
            await this.loadLowStockAlerts();
            
            // Update metrics from Firestore (if data exists)
            await this.updateMetricsFromFirestore();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadRecentActivity() {
    try {
        // Get recent activities from Firestore
        const activitiesSnapshot = await this.db.collection('activities')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const activities = [];
        
        activitiesSnapshot.forEach(doc => {
            const activity = doc.data();
            activities.push({
                id: doc.id,
                product: activity.productName,
                code: activity.productCode,
                type: activity.type,
                date: this.formatTimestamp(activity.timestamp),
                status: activity.status,
                icon: this.getActivityIcon(activity.type)
            });
        });

        // If no activities in Firestore, use mock data
        if (activities.length === 0) {
            activities.push(
                {
                    product: 'Paracetamol 500mg',
                    code: 'MED-001',
                    type: 'Stock Update',
                    date: 'Just now',
                    status: 'completed',
                    icon: 'package'
                },
                {
                    product: 'Vitamin C 1000mg',
                    code: 'MED-045',
                    type: 'Sale',
                    date: '2 hours ago',
                    status: 'completed',
                    icon: 'check'
                },
                {
                    product: 'Amoxicillin 250mg',
                    code: 'MED-128',
                    type: 'Low Stock Alert',
                    date: '5 hours ago',
                    status: 'pending',
                    icon: 'alert'
                },
                {
                    product: 'Insulin Syringes',
                    code: 'MED-256',
                    type: 'Expiry Alert',
                    date: '1 day ago',
                    status: 'urgent',
                    icon: 'warning'
                }
            );
        }

        const tableBody = document.getElementById('recentActivityTable');
        tableBody.innerHTML = activities.map(activity => `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <div style="width: 32px; height: 32px; background: ${this.getStatusColor(activity.status, true)}; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;">
                            ${this.getStatusIcon(activity.icon)}
                        </div>
                        <div>
                            <div class="font-medium">${activity.product}</div>
                            <div class="text-xs text-secondary">${activity.code}</div>
                        </div>
                    </div>
                </td>
                <td>${activity.type}</td>
                <td>${activity.date}</td>
                <td>
                    <span class="badge ${this.getStatusBadge(activity.status)}">${this.getStatusText(activity.status)}</span>
                </td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="dashboard.viewActivity('${activity.id}')">View</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading recent activity:', error);
        // Fallback to mock data if there's an error
        this.loadMockRecentActivity();
    }
}

// Helper method to format Firestore timestamp
formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    const now = new Date();
    const activityDate = timestamp.toDate();
    const diffInHours = (now - activityDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
    } else {
        return `${Math.floor(diffInHours / 24)} days ago`;
    }
}

// Helper method to get appropriate icon based on activity type
getActivityIcon(type) {
    const iconMap = {
        'Stock Update': 'package',
        'Sale': 'check',
        'Low Stock Alert': 'alert',
        'Expiry Alert': 'warning',
        'New Product': 'package',
        'Price Update': 'dollar',
        'Stock In': 'arrow-down',
        'Stock Out': 'arrow-up'
    };
    return iconMap[type] || 'package';
}

// Method to view activity details
viewActivity(activityId) {
    // Implement view activity functionality
    console.log('Viewing activity:', activityId);
    // You can show a modal or redirect to details page
}

// Fallback method for mock data
loadMockRecentActivity() {
    const activities = [
        {
            product: 'Paracetamol 500mg',
            code: 'MED-001',
            type: 'Stock Update',
            date: 'Just now',
            status: 'completed',
            icon: 'package'
        },
        {
            product: 'Vitamin C 1000mg',
            code: 'MED-045',
            type: 'Sale',
            date: '2 hours ago',
            status: 'completed',
            icon: 'check'
        },
        {
            product: 'Amoxicillin 250mg',
            code: 'MED-128',
            type: 'Low Stock Alert',
            date: '5 hours ago',
            status: 'pending',
            icon: 'alert'
        },
        {
            product: 'Insulin Syringes',
            code: 'MED-256',
            type: 'Expiry Alert',
            date: '1 day ago',
            status: 'urgent',
            icon: 'warning'
        }
    ];

    const tableBody = document.getElementById('recentActivityTable');
    tableBody.innerHTML = activities.map(activity => `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <div style="width: 32px; height: 32px; background: ${this.getStatusColor(activity.status, true)}; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;">
                        ${this.getStatusIcon(activity.icon)}
                    </div>
                    <div>
                        <div class="font-medium">${activity.product}</div>
                        <div class="text-xs text-secondary">${activity.code}</div>
                    </div>
                </div>
            </td>
            <td>${activity.type}</td>
            <td>${activity.date}</td>
            <td>
                <span class="badge ${this.getStatusBadge(activity.status)}">${this.getStatusText(activity.status)}</span>
            </td>
            <td>
                <button class="btn btn-ghost btn-sm">View</button>
            </td>
        </tr>
    `).join('');
}

    async loadQuickStats() {
        const stats = [
            { label: "Today's Sales", value: "₹9,842", trend: "up", icon: "trending-up" },
            { label: "Pending Orders", value: "12", trend: "neutral", icon: "clock" },
            { label: "New Customers", value: "8", trend: "up", icon: "users" },
            { label: "Stock Value", value: "₹3.42L", trend: "up", icon: "package" }
        ];

        const quickStatsDiv = document.getElementById('quickStats');
        quickStatsDiv.innerHTML = stats.map(stat => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <div class="text-sm font-medium text-secondary">${stat.label}</div>
                    <div class="text-lg font-bold">${stat.value}</div>
                </div>
                <div class="${this.getTrendColor(stat.trend)}">
                    ${this.getStatIcon(stat.icon)}
                </div>
            </div>
        `).join('');
    }

    async loadLowStockAlerts() {
        // Mock data - replace with Firestore query for low stock items
        const lowStockItems = [
            {
                product: 'Amoxicillin 250mg',
                category: 'Antibiotic',
                currentStock: 8,
                threshold: 20,
                status: 'critical'
            },
            {
                product: 'Insulin Syringes',
                category: 'Diabetic Care',
                currentStock: 15,
                threshold: 25,
                status: 'low'
            },
            {
                product: 'Surgical Masks',
                category: 'Protective',
                currentStock: 22,
                threshold: 30,
                status: 'low'
            }
        ];

        const tableBody = document.getElementById('lowStockTable');
        const countBadge = document.getElementById('lowStockCount');
        
        countBadge.textContent = `${lowStockItems.length} items need attention`;
        
        tableBody.innerHTML = lowStockItems.map(item => `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <div style="width: 32px; height: 32px; background: ${this.getStatusColor(item.status, true)}; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;">
                            ${this.getStatusIcon('alert')}
                        </div>
                        <div>
                            <div class="font-medium">${item.product}</div>
                            <div class="text-xs text-secondary">${item.category}</div>
                        </div>
                    </div>
                </td>
                <td>${item.currentStock} units</td>
                <td>${item.threshold} units</td>
                <td>
                    <span class="badge ${this.getStatusBadge(item.status)}">${this.getStatusText(item.status)}</span>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm">Order Now</button>
                </td>
            </tr>
        `).join('');
    }

    async updateMetricsFromFirestore() {
        try {
            // Example of loading real data from Firestore
            // const productsSnapshot = await this.db.collection('products').get();
            // const totalProducts = productsSnapshot.size;
            
            // const lowStockSnapshot = await this.db.collection('products')
            //     .where('stock', '<=', 'lowStockThreshold')
            //     .get();
            // const lowStockCount = lowStockSnapshot.size;
            
            // Update your metric cards here with real data
            console.log('Firestore data loaded successfully');
            
        } catch (error) {
            console.error('Error loading Firestore data:', error);
        }
    }

    setupEventListeners() {
        // Revenue time range change
        document.getElementById('revenueTimeRange').addEventListener('change', (e) => {
            this.updateRevenueChart(e.target.value);
        });

        // Product view change
        document.getElementById('productView').addEventListener('change', (e) => {
            this.updatePerformanceChart(e.target.value);
        });

        // Add product button
        document.getElementById('addProductBtn').addEventListener('click', () => {
            window.location.href = 'tabs/products.html';
        });

        // Quick action FAB
        document.getElementById('quickActionBtn').addEventListener('click', () => {
            // Show quick action menu or redirect
            window.location.href = 'tabs/products.html?action=add';
        });
    }

    updateRevenueChart(timeRange) {
        // Update chart based on selected time range
        console.log('Updating revenue chart for:', timeRange, 'days');
        // Implement actual data fetching and chart update
    }

    updatePerformanceChart(viewType) {
        // Update chart based on selected view
        console.log('Updating performance chart view:', viewType);
        // Implement actual data fetching and chart update
    }

    // Helper methods
    getStatusColor(status, isBackground = false) {
        const colors = {
            completed: isBackground ? 'var(--success-50)' : 'var(--success-600)',
            pending: isBackground ? 'var(--warning-50)' : 'var(--warning-600)',
            urgent: isBackground ? 'var(--error-50)' : 'var(--error-600)',
            critical: isBackground ? 'var(--error-50)' : 'var(--error-600)',
            low: isBackground ? 'var(--warning-50)' : 'var(--warning-600)'
        };
        return colors[status] || (isBackground ? 'var(--gray-100)' : 'var(--gray-600)');
    }

    getStatusBadge(status) {
        const badges = {
            completed: 'badge-success',
            pending: 'badge-warning',
            urgent: 'badge-error',
            critical: 'badge-error',
            low: 'badge-warning'
        };
        return badges[status] || 'badge-secondary';
    }

    getStatusText(status) {
        const texts = {
            completed: 'Completed',
            pending: 'Pending',
            urgent: 'Urgent',
            critical: 'Critical',
            low: 'Low'
        };
        return texts[status] || status;
    }

    getTrendColor(trend) {
        const colors = {
            up: 'text-success',
            down: 'text-error',
            neutral: 'text-warning'
        };
        return colors[trend] || 'text-secondary';
    }

    getStatusIcon(icon) {
        const icons = {
            package: `<svg style="width: 16px; height: 16px; color: var(--primary-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
            check: `<svg style="width: 16px; height: 16px; color: var(--success-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
            alert: `<svg style="width: 16px; height: 16px; color: var(--warning-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>`,
            warning: `<svg style="width: 16px; height: 16px; color: var(--error-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
        };
        return icons[icon] || icons.package;
    }

    getStatIcon(icon) {
        const icons = {
            'trending-up': `<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>`,
            'clock': `<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
            'users': `<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>`,
            'package': `<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>`
        };
        return icons[icon] || icons.package;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});