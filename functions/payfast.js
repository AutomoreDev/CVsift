const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

const db = admin.firestore();

// PayFast Configuration using environment variables for v2
const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID || "31731849",
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || "b0j9si5k9ewt6",
  passphrase: process.env.PAYFAST_PASSPHRASE || "CVSiftSecure2024",
  mode: process.env.PAYFAST_MODE || "sandbox",
  urls: {
    sandbox: "https://sandbox.payfast.co.za/eng/process",
    live: "https://www.payfast.co.za/eng/process",
  },
};

const APP_URL = process.env.APP_URL || "http://localhost:3001";

/**
 * Generate PayFast signature
 * @param {object} data - Payment data
 * @param {string} passPhrase - Passphrase
 * @return {string} MD5 hash signature
 */
function generateSignature(data, passPhrase = null) {
  // Create a copy and remove signature if it exists
  const pfData = {...data};
  delete pfData.signature;

  // Remove URL fields - these are NOT included in PayFast signature
  delete pfData.return_url;
  delete pfData.cancel_url;
  delete pfData.notify_url;

  // Sort the keys alphabetically (PayFast requirement)
  const sortedKeys = Object.keys(pfData).sort();

  let pfOutput = "";
  for (const key of sortedKeys) {
    const value = pfData[key];
    // Skip empty, null, or undefined values
    if (value === "" || value === null || value === undefined) {
      continue;
    }
    // URL encode the value and replace %20 with +
    const encodedValue = encodeURIComponent(
        value.toString().trim(),
    ).replace(/%20/g, "+");
    pfOutput += `${key}=${encodedValue}&`;
  }

  // Remove trailing &
  let getString = pfOutput.slice(0, -1);

  // Add passphrase if provided (just the value, not as a key-value pair)
  if (passPhrase !== null && passPhrase !== "") {
    getString += `&${passPhrase.trim()}`;
  }

  console.log("Signature string before hash:", getString);

  return crypto.createHash("md5").update(getString).digest("hex");
}

/**
 * Create PayFast payment
 */
exports.createPayment = functions.https.onCall(
    async (request) => {
      try {
        if (!request.auth) {
          throw new functions.https.HttpsError(
              "unauthenticated",
              "User must be authenticated",
          );
        }
        const userId = request.auth.uid;
        const {plan, amount, itemName} = request.data;
        if (!plan || !amount || !itemName) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "Missing required fields",
          );
        }
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
          throw new functions.https.HttpsError(
              "not-found",
              "User not found",
          );
        }
        const userData = userDoc.data();
        const displayName = userData.displayName || "";
        const nameParts = displayName.split(" ");
        const paymentRef = db.collection("payments").doc();
        const paymentId = paymentRef.id;
        const paymentData = {
          merchant_id: PAYFAST_CONFIG.merchantId,
          merchant_key: PAYFAST_CONFIG.merchantKey,
          return_url: `${APP_URL}/payment/success`,
          cancel_url: `${APP_URL}/payment/cancel`,
          notify_url: `https://us-central1-cvsift-3dff8.cloudfunctions.net/payfastWebhook`,
          name_first: nameParts[0] || "User",
          email_address: userData.email,
          m_payment_id: paymentId,
          amount: amount.toFixed(2),
          item_name: itemName,
          item_description: `CVSift ${plan} Plan Subscription`,
          custom_str1: userId,
          custom_str2: plan,
          custom_int1: Date.now(),
        };
        // Only add name_last if it exists
        if (nameParts[1]) {
          paymentData.name_last = nameParts[1];
        }
        paymentData.signature = generateSignature(
            paymentData,
            PAYFAST_CONFIG.passphrase,
        );

        // Debug logging
        console.log("Payment data for signature:", paymentData);
        console.log("Generated signature:", paymentData.signature);
        console.log("Using passphrase:", PAYFAST_CONFIG.passphrase);

        await paymentRef.set({
          userId: userId,
          plan: plan,
          amount: amount,
          status: "pending",
          paymentData: paymentData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
          paymentId: paymentId,
          paymentUrl: PAYFAST_CONFIG.urls[PAYFAST_CONFIG.mode],
          paymentData: paymentData,
        };
      } catch (error) {
        console.error("Error creating payment:", error);
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);

/**
 * PayFast webhook handler
 */
exports.payfastWebhook = functions.https.onRequest(
    async (req, res) => {
      try {
        if (req.method !== "POST") {
          res.status(405).send("Method Not Allowed");
          return;
        }
        const pfData = req.body;
        console.log("=== PayFast Webhook Received ===");
        console.log("Full webhook data:", JSON.stringify(pfData, null, 2));
        console.log("Received signature:", pfData.signature);
        console.log("Passphrase being used:", PAYFAST_CONFIG.passphrase);

        // Create parameter string for signature verification
        const pfParamString = Object.keys(pfData)
            .filter((key) => key !== "signature")
            .sort() // CRITICAL: Sort alphabetically
            .filter((key) => {
              // Filter out empty values
              const value = pfData[key];
              return value !== "" && value !== null && value !== undefined;
            })
            .map((key) => {
              const value = pfData[key].toString().trim();
              const encodedValue = encodeURIComponent(value)
                  .replace(/%20/g, "+");
              return `${key}=${encodedValue}`;
            })
            .join("&");

        console.log("Parameter string:", pfParamString);

        // Add passphrase
        const passphrase = PAYFAST_CONFIG.passphrase.trim();
        const encodedPassphrase = encodeURIComponent(passphrase)
            .replace(/%20/g, "+");
        const signatureString =
          `${pfParamString}&passphrase=${encodedPassphrase}`;

        console.log("Signature string:", signatureString);

        // Calculate signature
        const calculatedSignature = crypto
            .createHash("md5")
            .update(signatureString)
            .digest("hex");

        console.log("Calculated signature:", calculatedSignature);

        if (calculatedSignature !== pfData.signature) {
          console.error("=== SIGNATURE MISMATCH ===");
          console.error("Expected:", calculatedSignature);
          console.error("Received:", pfData.signature);
          console.error("All webhook keys:", Object.keys(pfData).sort());
          res.status(400).send("Invalid signature");
          return;
        }

        console.log("✓ Signature validation successful!");
        const paymentId = pfData.m_payment_id;
        const paymentRef = db.collection("payments").doc(paymentId);
        const paymentDoc = await paymentRef.get();
        if (!paymentDoc.exists) {
          console.error("Payment not found:", paymentId);
          res.status(404).send("Payment not found");
          return;
        }
        const userId = pfData.custom_str1;
        const plan = pfData.custom_str2;
        await paymentRef.update({
          status: pfData.payment_status,
          payfastData: pfData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        if (pfData.payment_status === "COMPLETE") {
          const planLimits = {
            free: 10,
            basic: 500,
            professional: 2000,
            enterprise: 999999,
          };
          await db.collection("users").doc(userId).update({
            plan: plan,
            cvUploadLimit: planLimits[plan.toLowerCase()] || 10,
            subscriptionStatus: "active",
            subscriptionStartDate:
              admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`User ${userId} upgraded to ${plan} plan`);
        }
        res.status(200).send("OK");
      } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).send("Internal Server Error");
      }
    },
);

/**
 * Get payment status
 */
exports.getPaymentStatus = functions.https.onCall(
    async (request) => {
      try {
        if (!request.auth) {
          throw new functions.https.HttpsError(
              "unauthenticated",
              "User must be authenticated",
          );
        }
        const {paymentId} = request.data;
        if (!paymentId) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "Payment ID required",
          );
        }
        const paymentDoc = await db
            .collection("payments")
            .doc(paymentId)
            .get();
        if (!paymentDoc.exists) {
          throw new functions.https.HttpsError(
              "not-found",
              "Payment not found",
          );
        }
        const paymentData = paymentDoc.data();
        if (paymentData.userId !== request.auth.uid) {
          throw new functions.https.HttpsError(
              "permission-denied",
              "Access denied",
          );
        }
        return {
          paymentId: paymentId,
          status: paymentData.status,
          plan: paymentData.plan,
          amount: paymentData.amount,
          createdAt: paymentData.createdAt,
        };
      } catch (error) {
        console.error("Error getting payment status:", error);
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);
