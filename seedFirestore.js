// seedFirestore.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ----- Firebase Config -----
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ----- Sample Data -----
const products = [
  { name: "Calsanz Fem", batch: "B001", expiry: "2026-06-30", price: 200, GST: 18, offer: "10% off" },
  { name: "Calsanz Strong", batch: "B002", expiry: "2025-12-31", price: 250, GST: 18, offer: "5% off" },
  { name: "Rabsanz DSR", batch: "B003", expiry: "2026-03-15", price: 150, GST: 12, offer: "No Offer" }
];

const stock = [
  { productId: "B001", batch: "B001", quantity: 50, invoiceRef: "INV001", date: "2025-10-01" },
  { productId: "B002", batch: "B002", quantity: 30, invoiceRef: "INV002", date: "2025-10-05" },
  { productId: "B003", batch: "B003", quantity: 20, invoiceRef: "INV003", date: "2025-10-10" }
];

const finance = [
  { type: "revenue", amount: 5000, date: "2025-10-01" },
  { type: "expense", amount: 2000, date: "2025-10-02" },
  { type: "revenue", amount: 7000, date: "2025-10-15" },
  { type: "expense", amount: 2500, date: "2025-10-18" }
];

const marketing = [
  { doctorName: "Dr. Sharma", targetValue: 10000, paid: 2000, completedPrescriptions: 500, date: "2025-10-05" },
  { doctorName: "Dr. Mehta", targetValue: 8000, paid: 1500, completedPrescriptions: 350, date: "2025-10-10" }
];

const debts = [
  { type: "Bank EMI", principal: 50000, monthlyROI: 5000, paidAmount: 15000, remainingPrincipal: 35000, date: "2025-10-01" },
  { type: "Investor ROI", principal: 20000, monthlyROI: 2000, paidAmount: 4000, remainingPrincipal: 16000, date: "2025-10-05" }
];

const users = [
  { email: "admin@sanj.com", password: "Admin123", role: "admin" },
  { email: "employee@sanj.com", password: "Employee123", role: "employee" }
];

// ----- Seeder Function -----
async function seedCollection(collectionName, dataArray) {
  for (let data of dataArray) {
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      console.log(`Added to ${collectionName}:`, docRef.id);
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error);
    }
  }
}

// ----- Run Seeder -----
async function runSeeder() {
  console.log("Seeding Firestore...");

  await seedCollection("products", products);
  await seedCollection("stock", stock);
  await seedCollection("finance", finance);
  await seedCollection("marketing", marketing);
  await seedCollection("debts", debts);
  await seedCollection("users", users);

  console.log("Firestore seeding completed!");
}

runSeeder();
