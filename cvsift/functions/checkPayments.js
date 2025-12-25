/**
 * Check recent payment attempts in Firestore
 * Run: node checkPayments.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("../service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkPayments() {
  try {
    console.log("Checking recent payments...\n");

    const paymentsRef = db.collection("payments");
    const snapshot = await paymentsRef
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

    if (snapshot.empty) {
      console.log("No payments found");
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log("═══════════════════════════════════════");
      console.log("Payment ID:", doc.id);
      console.log("Status:", data.status);
      console.log("Plan:", data.plan || data.cvPackId);
      console.log("Amount:", data.amount);
      console.log("Created:", data.createdAt?.toDate());

      if (data.paymentData) {
        console.log("\nPayment Data:");
        console.log("- Generated Signature:", data.paymentData.signature);
        console.log("- Amount:", data.paymentData.amount);
        console.log("- Item:", data.paymentData.item_name);
      }

      if (data.payfastData) {
        console.log("\nPayFast Response:");
        console.log("- Status:", data.payfastData.payment_status);
        console.log("- Signature:", data.payfastData.signature);
      }

      console.log("");
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkPayments();
