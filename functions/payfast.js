const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

const db = admin.firestore();

// PayFast Configuration using environment variables for v2
const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID || "31731849",
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || "b0j9si5k9ewt6",
  passphrase: process.env.PAYFAST_PASSPHRASE || "2025CVsiftSecure",
  mode: process.env.PAYFAST_MODE || "sandbox",
  urls: {
    sandbox: "https://sandbox.payfast.co.za/eng/process",
    live: "https://www.payfast.co.za/eng/process",
  },
};

const APP_URL = process.env.APP_URL || "https://www.cvsift.co.za";

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

  // IMPORTANT: PayFast requires fields in DOCUMENT ORDER, not alphabetical!
  // From PayFast docs: "Do not use the API signature format, which uses alphabetical ordering!"
  // The order must match the order in which fields appear in PayFast documentation
  const fieldOrder = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "cell_number",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_int1",
    "custom_int2",
    "custom_int3",
    "custom_int4",
    "custom_int5",
    "custom_str1",
    "custom_str2",
    "custom_str3",
    "custom_str4",
    "custom_str5",
    "email_confirmation",
    "confirmation_address",
    "payment_method",
    // Subscription fields
    "subscription_type",
    "billing_date",
    "recurring_amount",
    "frequency",
    "cycles",
  ];

  let pfOutput = "";
  for (const key of fieldOrder) {
    if (Object.prototype.hasOwnProperty.call(pfData, key)) {
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
  }

  // Remove trailing &
  let getString = pfOutput.slice(0, -1);

  // Add passphrase if provided
  if (passPhrase !== null && passPhrase !== "") {
    getString += `&passphrase=${encodeURIComponent(passPhrase.trim())}`;
  }

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
        const {plan, amount, itemName, purchaseType, cvPackId, cvCount} = request.data;
        if (!amount || !itemName) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "Missing required fields",
          );
        }
        // Validate purchase type
        const type = purchaseType || "subscription";
        if (!["subscription", "cv_pack"].includes(type)) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "Invalid purchase type",
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
          item_description: type === "cv_pack" ?
            `CVSift CV Pack - ${cvCount} CVs` :
            `CVSift ${plan} Plan - Monthly Subscription`,
          custom_str1: userId,
          custom_str2: type === "cv_pack" ? cvPackId : plan,
          custom_str3: type,
          custom_int1: type === "cv_pack" ? cvCount : Date.now(),
        };

        // Add subscription parameters for plan purchases (not CV packs)
        if (type === "subscription") {
          // Calculate billing date (today + 1 month)
          const billingDate = new Date();
          billingDate.setMonth(billingDate.getMonth() + 1);
          const formattedDate = billingDate.toISOString().split("T")[0]; // YYYY-MM-DD

          paymentData.subscription_type = "1"; // 1 = subscription
          paymentData.billing_date = formattedDate;
          paymentData.recurring_amount = amount.toFixed(2);
          paymentData.frequency = "3"; // 3 = Monthly
          paymentData.cycles = "0"; // 0 = continuous until cancelled
        }

        // Only add name_last if it exists
        if (nameParts[1]) {
          paymentData.name_last = nameParts[1];
        }
        paymentData.signature = generateSignature(
            paymentData,
            PAYFAST_CONFIG.passphrase,
        );

        await paymentRef.set({
          userId: userId,
          plan: plan || null,
          purchaseType: type,
          cvPackId: cvPackId || null,
          cvCount: cvCount || null,
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
        console.log("[PayFast Webhook] Received at:", new Date().toISOString());
        console.log("[PayFast Webhook] Method:", req.method);
        console.log("[PayFast Webhook] IP:", req.ip || req.connection.remoteAddress);

        if (req.method !== "POST") {
          console.log("[PayFast Webhook] Rejected: Not POST");
          res.status(405).send("Method Not Allowed");
          return;
        }

        // PayFast IP Whitelist (Updated for AWS migration - valid until July 2025)
        const payfastIPs = [
          "3.163.236.237", "3.163.238.237", "3.163.251.237", "3.163.232.237",
          "3.163.241.237", "3.163.245.237", "3.163.248.237", "3.163.234.237",
          "3.163.237.237", "3.163.243.237", "3.163.247.237", "3.163.242.237",
          "3.163.244.237", "3.163.249.237", "3.163.252.237", "3.163.235.237",
          "3.163.239.237", "3.163.250.237", "3.163.233.237", "3.163.246.237",
          "3.163.240.237",
          // 197.97.145.144/28 (197.97.145.144 - 197.97.145.159)
          "197.97.145.144", "197.97.145.145", "197.97.145.146", "197.97.145.147",
          "197.97.145.148", "197.97.145.149", "197.97.145.150", "197.97.145.151",
          "197.97.145.152", "197.97.145.153", "197.97.145.154", "197.97.145.155",
          "197.97.145.156", "197.97.145.157", "197.97.145.158", "197.97.145.159",
          // 41.74.179.192/27 (41.74.179.192 - 41.74.179.223)
          "41.74.179.192", "41.74.179.193", "41.74.179.194", "41.74.179.195",
          "41.74.179.196", "41.74.179.197", "41.74.179.198", "41.74.179.199",
          "41.74.179.200", "41.74.179.201", "41.74.179.202", "41.74.179.203",
          "41.74.179.204", "41.74.179.205", "41.74.179.206", "41.74.179.207",
          "41.74.179.208", "41.74.179.209", "41.74.179.210", "41.74.179.211",
          "41.74.179.212", "41.74.179.213", "41.74.179.214", "41.74.179.215",
          "41.74.179.216", "41.74.179.217", "41.74.179.218", "41.74.179.219",
          "41.74.179.220", "41.74.179.221", "41.74.179.222", "41.74.179.223",
          // 102.216.36.0/28 (102.216.36.0 - 102.216.36.15)
          "102.216.36.0", "102.216.36.1", "102.216.36.2", "102.216.36.3",
          "102.216.36.4", "102.216.36.5", "102.216.36.6", "102.216.36.7",
          "102.216.36.8", "102.216.36.9", "102.216.36.10", "102.216.36.11",
          "102.216.36.12", "102.216.36.13", "102.216.36.14", "102.216.36.15",
          // 102.216.36.128/28 (102.216.36.128 - 102.216.36.143)
          "102.216.36.128", "102.216.36.129", "102.216.36.130", "102.216.36.131",
          "102.216.36.132", "102.216.36.133", "102.216.36.134", "102.216.36.135",
          "102.216.36.136", "102.216.36.137", "102.216.36.138", "102.216.36.139",
          "102.216.36.140", "102.216.36.141", "102.216.36.142", "102.216.36.143",
          // Additional PayFast IP
          "144.126.193.139",
        ];

        // Get client IP (handle various proxy headers)
        const clientIP = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
                        req.headers["x-real-ip"] ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress;

        // Validate IP (only in production mode)
        if (PAYFAST_CONFIG.mode === "live" && !payfastIPs.includes(clientIP)) {
          console.error("Unauthorized IP attempted webhook:", clientIP);
          res.status(403).send("Forbidden - Invalid IP");
          return;
        }

        const pfData = req.body;

        // Create parameter string for signature verification
        // IMPORTANT: PayFast ITN parameters must be processed in the order they are received,
        // NOT alphabetically sorted! Process until we hit 'signature' field, then break.
        // Include ALL parameters (even empty ones) in the signature string.
        let pfParamString = "";
        for (const key in pfData) {
          if (Object.prototype.hasOwnProperty.call(pfData, key)) {
            if (key === "signature") {
              break; // Stop processing when we hit signature
            }
            const value = pfData[key];
            // Include all values, even empty strings
            const stringValue = value !== null && value !== undefined ? value.toString().trim() : "";
            const encodedValue = encodeURIComponent(stringValue)
                .replace(/%20/g, "+");
            pfParamString += `${key}=${encodedValue}&`;
          }
        }
        // Remove trailing '&'
        pfParamString = pfParamString.slice(0, -1);

        // Add passphrase to signature string
        const passphrase = PAYFAST_CONFIG.passphrase.trim();
        const signatureString = `${pfParamString}&passphrase=${encodeURIComponent(passphrase)}`;

        // Calculate signature
        const calculatedSignature = crypto
            .createHash("md5")
            .update(signatureString)
            .digest("hex");

        // Validate signature
        if (calculatedSignature !== pfData.signature) {
          console.error("[PayFast Webhook] Signature validation failed");
          res.status(400).send("Invalid signature");
          return;
        }

        console.log("[PayFast Webhook] Signature validated successfully");
        const paymentId = pfData.m_payment_id;
        const paymentRef = db.collection("payments").doc(paymentId);
        const paymentDoc = await paymentRef.get();
        if (!paymentDoc.exists) {
          console.error("Payment not found:", paymentId);
          res.status(404).send("Payment not found");
          return;
        }
        const userId = pfData.custom_str1;
        const customStr2 = pfData.custom_str2; // plan or cvPackId
        const purchaseType = pfData.custom_str3 || "subscription";
        const cvCount = parseInt(pfData.custom_int1) || 0;

        // Store subscription token if present (for managing subscriptions)
        const updateData = {
          status: pfData.payment_status,
          payfastData: pfData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (pfData.token) {
          updateData.subscriptionToken = pfData.token;
        }

        await paymentRef.update(updateData);

        if (pfData.payment_status === "COMPLETE") {
          if (purchaseType === "cv_pack") {
            // Handle CV Pack purchase
            const userRef = db.collection("users").doc(userId);

            await userRef.update({
              cvPackBalance: admin.firestore.FieldValue.increment(cvCount),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`[PayFast Webhook] CV Pack processed: ${cvCount} CVs added for user ${userId}`);
          } else {
            // Handle Subscription plan purchase
            const planLimits = {
              free: 10,
              starter: 50,
              basic: 150,
              professional: 600,
              business: 1500,
              enterprise: 999999,
            };

            const userUpdateData = {
              plan: customStr2,
              cvUploadLimit: planLimits[customStr2.toLowerCase()] || 10,
              subscriptionStatus: "active",
              subscriptionStartDate:
                admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // Store subscription token and payment ID for future management
            if (pfData.token) {
              userUpdateData.subscriptionToken = pfData.token;
              userUpdateData.activePaymentId = paymentId;
            }

            await db.collection("users").doc(userId).update(userUpdateData);

            console.log(`[PayFast Webhook] Subscription activated: ${customStr2} plan for user ${userId}`);
          }
        } else {
          console.log(`[PayFast Webhook] Payment status: ${pfData.payment_status} for payment ${paymentId}`);
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
          payment: {
            paymentId: paymentId,
            status: paymentData.status,
            plan: paymentData.plan,
            amount: paymentData.amount,
            createdAt: paymentData.createdAt,
            purchaseType: paymentData.purchaseType,
            cvCount: paymentData.cvCount,
          },
        };
      } catch (error) {
        console.error("Error getting payment status:", error);
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);

/**
 * Cancel Subscription
 * Cancels a user's active PayFast subscription
 */
exports.cancelSubscription = functions.https.onCall(
    async (request) => {
      try {
        if (!request.auth) {
          throw new functions.https.HttpsError(
              "unauthenticated",
              "User must be authenticated",
          );
        }

        const userId = request.auth.uid;
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          throw new functions.https.HttpsError(
              "not-found",
              "User not found",
          );
        }

        const userData = userDoc.data();

        // Check if user has an active subscription
        if (userData.subscriptionStatus !== "active") {
          throw new functions.https.HttpsError(
              "failed-precondition",
              "No active subscription found",
          );
        }

        // Note: subscriptionToken may not exist for manually created test subscriptions
        // In production, PayFast will provide this token

        // PayFast subscription cancellation via API
        // Note: PayFast requires merchant to cancel via dashboard or API
        // For now, we'll mark it as pending cancellation
        // The actual cancellation must be done via PayFast dashboard
        await userRef.update({
          subscriptionStatus: "pending_cancellation",
          cancellationRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          message: "Subscription cancellation requested. Your subscription will remain active until the end of the current billing period.",
        };
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);

/**
 * Downgrade Plan
 * Downgrades user's subscription to a lower tier
 */
exports.downgradePlan = functions.https.onCall(
    async (request) => {
      try {
        if (!request.auth) {
          throw new functions.https.HttpsError(
              "unauthenticated",
              "User must be authenticated",
          );
        }

        const userId = request.auth.uid;
        const {newPlan} = request.data;

        if (!newPlan) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "New plan is required",
          );
        }

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          throw new functions.https.HttpsError(
              "not-found",
              "User not found",
          );
        }

        const userData = userDoc.data();
        const currentPlan = userData.plan || "free";

        // Define plan hierarchy
        const planHierarchy = {
          free: 0,
          starter: 1,
          basic: 2,
          professional: 3,
          business: 4,
          enterprise: 5,
        };

        const planLimits = {
          free: 10,
          starter: 50,
          basic: 150,
          professional: 600,
          business: 1500,
          enterprise: 999999,
        };

        // Check if it's actually a downgrade
        if (planHierarchy[newPlan.toLowerCase()] >= planHierarchy[currentPlan.toLowerCase()]) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "New plan must be lower than current plan",
          );
        }

        // Downgrade will take effect at end of billing period
        await userRef.update({
          pendingPlan: newPlan,
          pendingPlanLimit: planLimits[newPlan.toLowerCase()] || 10,
          downgradeRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          message: `Your plan will be downgraded to ${newPlan} at the end of your current billing period.`,
          effectiveDate: "End of billing period",
        };
      } catch (error) {
        console.error("Error downgrading plan:", error);
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);
