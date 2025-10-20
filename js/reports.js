// reports.js
import { db } from './firebase-config.js';

// DOM elements
const revenueCtx = document.getElementById('revenueChart').getContext('2d');
const profitCtx = document.getElementById('profitChart').getContext('2d');
const stockCtx = document.getElementById('stockChart').getContext('2d');
const debtsTableBody = document.querySelector('#debtsSummaryTable tbody');
const marketingTableBody = document.querySelector('#marketingSummaryTable tbody');

// Helper function to get Firestore collection data
async function fetchCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Load all reports
async function loadReports() {
  const [financeData, stockData, debtsData, marketingData] = await Promise.all([
    fetchCollection('finance'),
    fetchCollection('stock'),
    fetchCollection('debts'),
    fetchCollection('marketing')
  ]);

  generateRevenueExpenseChart(financeData);
  generateProfitChart(financeData);
  generateStockChart(stockData);
  populateDebtsTable(debtsData);
  populateMarketingTable(marketingData);
}

// Revenue vs Expenses Chart
function generateRevenueExpenseChart(financeData) {
  const monthlyData = {}; // { 'Jan': { revenue: 0, expense: 0 } }

  financeData.forEach(item => {
    const month = new Date(item.date.seconds * 1000).toLocaleString('default', { month: 'short' });
    if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expense: 0 };
    if (item.type === 'revenue') monthlyData[month].revenue += Number(item.amount);
    if (item.type === 'expense') monthlyData[month].expense += Number(item.amount);
  });

  const labels = Object.keys(monthlyData);
  const revenue = labels.map(m => monthlyData[m].revenue);
  const expense = labels.map(m => monthlyData[m].expense);

  new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Revenue', data: revenue, borderColor: 'green', fill: false },
        { label: 'Expenses', data: expense, borderColor: 'red', fill: false }
      ]
    },
    options: { responsive: true }
  });
}

// Profit Chart
function generateProfitChart(financeData) {
  const monthlyData = {};
  financeData.forEach(item => {
    const month = new Date(item.date.seconds * 1000).toLocaleString('default', { month: 'short' });
    if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expense: 0 };
    if (item.type === 'revenue') monthlyData[month].revenue += Number(item.amount);
    if (item.type === 'expense') monthlyData[month].expense += Number(item.amount);
  });

  const labels = Object.keys(monthlyData);
  const profit = labels.map(m => monthlyData[m].revenue - monthlyData[m].expense);

  new Chart(profitCtx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Profit', data: profit, backgroundColor: 'blue' }] },
    options: { responsive: true }
  });
}

// Stock Chart
function generateStockChart(stockData) {
  const labels = stockData.map(s => s.productName);
  const quantities = stockData.map(s => s.quantity);

  new Chart(stockCtx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Quantity', data: quantities, backgroundColor: quantities.map(q => q < 10 ? 'red' : 'green') }] },
    options: { responsive: true }
  });
}

// Populate Debts Table
function populateDebtsTable(debtsData) {
  debtsTableBody.innerHTML = '';
  debtsData.forEach(d => {
    const row = `<tr>
      <td>${d.type}</td>
      <td>${d.principal}</td>
      <td>${d.monthlyROI}</td>
      <td>${d.paidAmount}</td>
      <td>${d.remainingPrincipal}</td>
    </tr>`;
    debtsTableBody.innerHTML += row;
  });
}

// Populate Marketing Table
function populateMarketingTable(marketingData) {
  marketingTableBody.innerHTML = '';
  marketingData.forEach(m => {
    const row = `<tr>
      <td>${m.doctorName}</td>
      <td>${m.targetValue}</td>
      <td>${m.paid}</td>
      <td>${m.completedPrescriptions}</td>
    </tr>`;
    marketingTableBody.innerHTML += row;
  });
}

// Initialize
loadReports();
