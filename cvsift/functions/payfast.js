const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const axios = require("axios");
const nodemailer = require("nodemailer");
const {subscriptionCancelledEmail, accountDeletedEmail} = require("./emailTemplates");

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

// PayFast API URLs
const PAYFAST_API_URL = {
  sandbox: "https://api.payfast.co.za",
  live: "https://api.payfast.co.za",
};

/**
 * Generate PayFast API signature for subscription management
 * @param {object} params - API parameters (merchant-id, timestamp, version)
 * @param {string} passphrase - Passphrase
 * @return {string} MD5 hash signature
 */
function generateApiSignature(params, passphrase) {
  // Remove empty values
  const filteredParams = {};
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key];
      if (value !== null && value !== undefined && value !== "") {
        filteredParams[key] = value;
      }
    }
  }

  // Sort by key alphabetically
  const sortedKeys = Object.keys(filteredParams).sort();
  const paramArray = [];
  for (const key of sortedKeys) {
    const value = filteredParams[key].toString().trim();
    paramArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }

  // Create query string
  let queryString = paramArray.join("&");

  // Append passphrase
  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  }

  // Generate MD5 hash
  return crypto.createHash("md5").update(queryString).digest("hex");
}

/**
 * Make PayFast API call for subscription management
 * @param {string} endpoint - API endpoint (e.g., '/subscriptions/TOKEN/cancel')
 * @param {string} method - HTTP method (PUT, GET, etc.)
 * @return {Promise<object>} API response
 */
async function callPayFastApi(endpoint, method = "PUT") {
  // PayFast expects ISO 8601 format with Z: 2025-12-10T10:22:05Z
  const timestamp = new Date().toISOString().replace(/\.\d{3}/, "");

  const params = {
    "merchant-id": PAYFAST_CONFIG.merchantId,
    "version": "v1",
    "timestamp": timestamp,
  };

  // Generate signature
  const signature = generateApiSignature(params, PAYFAST_CONFIG.passphrase);
  params["signature"] = signature;

  // Determine base URL
  const baseUrl = PAYFAST_API_URL[PAYFAST_CONFIG.mode] || PAYFAST_API_URL.sandbox;
  const url = `${baseUrl}${endpoint}`;

  // Add testing parameter for sandbox
  const urlWithParams = PAYFAST_CONFIG.mode === "sandbox" ? `${url}?testing=true` : url;

  console.log(`[PayFast API] ${method} ${urlWithParams}`);
  console.log(`[PayFast API] Headers:`, params);

  try {
    const response = await axios({
      method: method,
      url: urlWithParams,
      headers: params,
      timeout: 30000, // 30 second timeout
    });

    console.log(`[PayFast API] Response status: ${response.status}`);
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error(`[PayFast API] Error:`, error.response?.data || error.message);
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message,
    };
  }
}

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

        const paymentStatus = pfData.payment_status;
        const userRef = db.collection("users").doc(userId);

        // Handle different payment statuses
        switch (paymentStatus) {
          case "COMPLETE": {
            if (purchaseType === "cv_pack") {
              // Handle CV Pack purchase
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
                subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
                lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              };

              // Store subscription token and payment ID for future management
              if (pfData.token) {
                userUpdateData.subscriptionToken = pfData.token;
                userUpdateData.activePaymentId = paymentId;
              }

              await userRef.update(userUpdateData);

              console.log(`[PayFast Webhook] Subscription activated: ${customStr2} plan for user ${userId}`);
            }
            break;
          }

          case "CANCELLED": {
            // Subscription was cancelled (either by user or payment failed)
            await userRef.update({
              subscriptionStatus: "cancelled",
              subscriptionEndDate: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`[PayFast Webhook] Subscription cancelled for user ${userId}`);
            break;
          }

          case "FAILED": {
            // Payment failed - mark subscription as failed
            await userRef.update({
              subscriptionStatus: "payment_failed",
              lastPaymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`[PayFast Webhook] Payment failed for user ${userId}`);
            break;
          }

          case "SUSPENDED": {
            // Subscription suspended (usually due to payment issues)
            await userRef.update({
              subscriptionStatus: "suspended",
              suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`[PayFast Webhook] Subscription suspended for user ${userId}`);
            break;
          }

          case "PENDING": {
            // Payment is pending
            console.log(`[PayFast Webhook] Payment pending for user ${userId}`);
            break;
          }

          default: {
            console.log(`[PayFast Webhook] Unhandled payment status: ${paymentStatus} for payment ${paymentId}`);
          }
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
 * Cancels a user's active PayFast subscription via API
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

        // Check if subscription token exists
        if (!userData.subscriptionToken) {
          console.error(`[Cancel Subscription] No subscription token found for user ${userId}`);
          throw new functions.https.HttpsError(
              "failed-precondition",
              "No subscription token found. Please contact support.",
          );
        }

        const subscriptionToken = userData.subscriptionToken;

        console.log(`[Cancel Subscription] Cancelling subscription ${subscriptionToken} for user ${userId}`);

        // Call PayFast API to cancel subscription
        const apiResponse = await callPayFastApi(
            `/subscriptions/${subscriptionToken}/cancel`,
            "PUT",
        );

        if (!apiResponse.success) {
          console.error(`[Cancel Subscription] PayFast API failed:`, apiResponse.error);

          // Log the failure but still update local status
          await userRef.update({
            subscriptionStatus: "pending_cancellation",
            cancellationRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastCancellationError: apiResponse.error,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          throw new functions.https.HttpsError(
              "internal",
              "Failed to cancel subscription with PayFast. Please contact support.",
          );
        }

        // Successfully cancelled with PayFast
        await userRef.update({
          subscriptionStatus: "cancelled",
          cancellationCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
          subscriptionEndDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[Cancel Subscription] Successfully cancelled subscription for user ${userId}`);

        // Send confirmation email
        try {
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            },
          });

          const emailContent = subscriptionCancelledEmail(
              userData.displayName || userData.email,
              userData.email,
              userData.plan || "subscription",
          );

          await transporter.sendMail({
            from: process.env.EMAIL_FROM || "CVSift Team <noreply@cvsift.co.za>",
            to: userData.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });

          console.log(`[Cancel Subscription] Confirmation email sent to ${userData.email}`);
        } catch (emailError) {
          console.error(`[Cancel Subscription] Failed to send confirmation email:`, emailError);
          // Don't fail the operation if email fails
        }

        return {
          success: true,
          message: "Subscription cancelled successfully. You will not be charged again.",
        };
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);

/**
 * Pause Subscription
 * Pauses a user's active PayFast subscription
 */
exports.pauseSubscription = functions.https.onCall(
    async (request) => {
      try {
        if (!request.auth) {
          throw new functions.https.HttpsError(
              "unauthenticated",
              "User must be authenticated",
          );
        }

        const userId = request.auth.uid;
        const {cycles} = request.data; // Number of cycles to pause (optional)

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

        // Check if subscription token exists
        if (!userData.subscriptionToken) {
          console.error(`[Pause Subscription] No subscription token found for user ${userId}`);
          throw new functions.https.HttpsError(
              "failed-precondition",
              "No subscription token found. Please contact support.",
          );
        }

        const subscriptionToken = userData.subscriptionToken;

        console.log(`[Pause Subscription] Pausing subscription ${subscriptionToken} for user ${userId}`);

        // Build endpoint with cycles parameter if provided
        let endpoint = `/subscriptions/${subscriptionToken}/pause`;
        if (cycles) {
          endpoint += `?cycles=${cycles}`;
        }

        // Call PayFast API to pause subscription
        const apiResponse = await callPayFastApi(endpoint, "PUT");

        if (!apiResponse.success) {
          console.error(`[Pause Subscription] PayFast API failed:`, apiResponse.error);

          throw new functions.https.HttpsError(
              "internal",
              "Failed to pause subscription with PayFast. Please contact support.",
          );
        }

        // Successfully paused with PayFast
        await userRef.update({
          subscriptionStatus: "paused",
          pausedAt: admin.firestore.FieldValue.serverTimestamp(),
          pausedCycles: cycles || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[Pause Subscription] Successfully paused subscription for user ${userId}`);

        return {
          success: true,
          message: cycles ?
            `Subscription paused for ${cycles} billing cycle(s).` :
            "Subscription paused successfully.",
        };
      } catch (error) {
        console.error("Error pausing subscription:", error);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);

/**
 * Unpause (Resume) Subscription
 * Resumes a paused PayFast subscription
 */
exports.unpauseSubscription = functions.https.onCall(
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

        // Check if user has a paused subscription
        if (userData.subscriptionStatus !== "paused") {
          throw new functions.https.HttpsError(
              "failed-precondition",
              "Subscription is not paused",
          );
        }

        // Check if subscription token exists
        if (!userData.subscriptionToken) {
          console.error(`[Unpause Subscription] No subscription token found for user ${userId}`);
          throw new functions.https.HttpsError(
              "failed-precondition",
              "No subscription token found. Please contact support.",
          );
        }

        const subscriptionToken = userData.subscriptionToken;

        console.log(`[Unpause Subscription] Unpausing subscription ${subscriptionToken} for user ${userId}`);

        // Call PayFast API to unpause subscription
        const apiResponse = await callPayFastApi(
            `/subscriptions/${subscriptionToken}/unpause`,
            "PUT",
        );

        if (!apiResponse.success) {
          console.error(`[Unpause Subscription] PayFast API failed:`, apiResponse.error);

          throw new functions.https.HttpsError(
              "internal",
              "Failed to unpause subscription with PayFast. Please contact support.",
          );
        }

        // Successfully unpaused with PayFast
        await userRef.update({
          subscriptionStatus: "active",
          unpausedAt: admin.firestore.FieldValue.serverTimestamp(),
          pausedAt: admin.firestore.FieldValue.delete(),
          pausedCycles: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[Unpause Subscription] Successfully unpaused subscription for user ${userId}`);

        return {
          success: true,
          message: "Subscription resumed successfully.",
        };
      } catch (error) {
        console.error("Error unpausing subscription:", error);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);

/**
 * Update Subscription Plan
 * Updates user's subscription to a different tier (upgrade or downgrade)
 * Note: PayFast doesn't support direct plan updates, so we cancel and create a new subscription
 */
/**
 * Delete User Account
 * Permanently deletes a user account and all associated data
 * CRITICAL: Cancels active subscriptions first to prevent future charges
 */
exports.deleteUserAccount = functions.https.onCall(
    async (request) => {
      try {
        if (!request.auth) {
          throw new functions.https.HttpsError(
              "unauthenticated",
              "User must be authenticated",
          );
        }

        const userId = request.auth.uid;
        const {confirmEmail} = request.data;

        console.log(`[Delete Account] Starting account deletion for user ${userId}`);

        // Get user data
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          throw new functions.https.HttpsError(
              "not-found",
              "User account not found",
          );
        }

        const userData = userDoc.data();

        // Verify email confirmation for safety
        if (confirmEmail && confirmEmail !== userData.email) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "Email confirmation does not match account email",
          );
        }

        // CRITICAL: Cancel active subscription first to prevent future charges
        if (userData.subscriptionStatus === "active" && userData.subscriptionToken) {
          console.log(`[Delete Account] Cancelling active subscription for user ${userId}`);

          const subscriptionToken = userData.subscriptionToken;
          const apiResponse = await callPayFastApi(
              `/subscriptions/${subscriptionToken}/cancel`,
              "PUT",
          );

          if (!apiResponse.success) {
            console.error(`[Delete Account] Failed to cancel subscription:`, apiResponse.error);

            // Don't block account deletion, but log the error prominently
            console.error(`[Delete Account] CRITICAL: Subscription ${subscriptionToken} could not be cancelled automatically. Manual cancellation required!`);

            // Store the error for manual follow-up
            await userRef.update({
              accountDeletionAttempted: true,
              accountDeletionError: "Subscription cancellation failed - requires manual intervention",
              accountDeletionAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            throw new functions.https.HttpsError(
                "internal",
                "Failed to cancel subscription. Please contact support to cancel your subscription before deleting your account.",
            );
          }

          console.log(`[Delete Account] Subscription cancelled successfully for user ${userId}`);
        }

        // Delete user's data in batches
        const batch = db.batch();

        // Mark user document for deletion
        batch.update(userRef, {
          accountDeleted: true,
          accountDeletedAt: admin.firestore.FieldValue.serverTimestamp(),
          subscriptionStatus: "deleted",
          subscriptionToken: admin.firestore.FieldValue.delete(),
        });

        // Commit the batch
        await batch.commit();

        // Delete sub-collections (CVs, job specs, matches, etc.)
        const collections = [
          "cvs",
          "jobSpecs",
          "matches",
          "activityLogs",
          "apiUsage",
          "teamMembers",
        ];

        for (const collectionName of collections) {
          const snapshot = await db
              .collection(collectionName)
              .where("userId", "==", userId)
              .limit(500)
              .get();

          if (!snapshot.empty) {
            const deleteBatch = db.batch();
            snapshot.docs.forEach((doc) => {
              deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            console.log(`[Delete Account] Deleted ${snapshot.size} documents from ${collectionName}`);
          }
        }

        // Delete Storage files (CVs and other uploaded files)
        try {
          const bucket = admin.storage().bucket();
          const [files] = await bucket.getFiles({
            prefix: `users/${userId}/`,
          });

          if (files.length > 0) {
            await Promise.all(files.map((file) => file.delete()));
            console.log(`[Delete Account] Deleted ${files.length} storage files for user ${userId}`);
          }
        } catch (storageError) {
          console.error(`[Delete Account] Error deleting storage files:`, storageError);
          // Continue with account deletion even if storage deletion fails
        }

        // Send confirmation email BEFORE deleting auth account
        try {
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            },
          });

          const emailContent = accountDeletedEmail(
              userData.displayName || userData.email,
              userData.email,
          );

          await transporter.sendMail({
            from: process.env.EMAIL_FROM || "CVSift Team <noreply@cvsift.co.za>",
            to: userData.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });

          console.log(`[Delete Account] Confirmation email sent to ${userData.email}`);
        } catch (emailError) {
          console.error(`[Delete Account] Failed to send confirmation email:`, emailError);
          // Don't fail the operation if email fails
        }

        // Delete Firebase Auth account
        try {
          await admin.auth().deleteUser(userId);
          console.log(`[Delete Account] Deleted Firebase Auth account for user ${userId}`);
        } catch (authError) {
          console.error(`[Delete Account] Error deleting auth account:`, authError);
          throw new functions.https.HttpsError(
              "internal",
              "Failed to delete authentication account",
          );
        }

        console.log(`[Delete Account] Account deletion completed successfully for user ${userId}`);

        return {
          success: true,
          message: "Your account has been permanently deleted. All data and subscriptions have been removed.",
        };
      } catch (error) {
        console.error("[Delete Account] Error:", error);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);

exports.updateSubscriptionPlan = functions.https.onCall(
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

        // Check if plan is actually different
        if (newPlan.toLowerCase() === currentPlan.toLowerCase()) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "New plan is the same as current plan",
          );
        }

        const isUpgrade = planHierarchy[newPlan.toLowerCase()] > planHierarchy[currentPlan.toLowerCase()];

        // Check if user has an active subscription that needs to be cancelled
        if (userData.subscriptionStatus === "active" && userData.subscriptionToken) {
          // For downgrades, schedule for end of billing period
          if (!isUpgrade) {
            await userRef.update({
              pendingPlan: newPlan,
              pendingPlanLimit: planLimits[newPlan.toLowerCase()] || 10,
              planChangeRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
              success: true,
              message: `Your plan will be changed to ${newPlan} at the end of your current billing period. You will then need to set up a new payment.`,
              effectiveDate: "End of billing period",
              requiresNewPayment: true,
            };
          }

          // For upgrades, cancel immediately and require new payment setup
          console.log(`[Update Plan] Cancelling current subscription for upgrade - user ${userId}`);

          const subscriptionToken = userData.subscriptionToken;
          const apiResponse = await callPayFastApi(
              `/subscriptions/${subscriptionToken}/cancel`,
              "PUT",
          );

          if (!apiResponse.success) {
            console.error(`[Update Plan] Failed to cancel current subscription:`, apiResponse.error);
            throw new functions.https.HttpsError(
                "internal",
                "Failed to cancel current subscription. Please try again or contact support.",
            );
          }

          // Update user to new plan immediately (they'll need to pay)
          await userRef.update({
            plan: newPlan,
            cvUploadLimit: planLimits[newPlan.toLowerCase()] || 10,
            subscriptionStatus: "cancelled",
            previousPlan: currentPlan,
            planUpgradedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          return {
            success: true,
            message: `Your previous subscription has been cancelled. Please set up payment for the ${newPlan} plan to activate it.`,
            requiresNewPayment: true,
          };
        }

        // No active subscription, just update the plan
        await userRef.update({
          plan: newPlan,
          cvUploadLimit: planLimits[newPlan.toLowerCase()] || 10,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          message: `Plan updated to ${newPlan}. Please set up payment to activate your subscription.`,
          requiresNewPayment: true,
        };
      } catch (error) {
        console.error("Error updating plan:", error);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);

/**
 * NOTE: Scheduled function removed - requires Cloud Scheduler API and App Engine
 * Use manualVerifyFailedCancellations instead, which can be called via:
 * 1. Firebase Console
 * 2. External cron job (curl to the function URL)
 * 3. Cloud Scheduler job (set up manually via console)
 */

/**
 * Manual Trigger: Verify and Retry Failed Cancellations
 * RESTRICTED: Only available to master account
 * Allows admin to manually trigger the verification process
 */
exports.manualVerifyFailedCancellations = functions.https.onCall(
    async (request) => {
      try {
        if (!request.auth) {
          throw new functions.https.HttpsError(
              "unauthenticated",
              "User must be authenticated",
          );
        }

        // Get user document to check if they are master account
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        if (!userDoc.exists) {
          throw new functions.https.HttpsError(
              "not-found",
              "User not found",
          );
        }

        const userData = userDoc.data();

        // Check if user is master account
        const masterEmail = process.env.MASTER_ACCOUNT_EMAIL || "emma@automore.co.za";
        if (userData.email !== masterEmail) {
          throw new functions.https.HttpsError(
              "permission-denied",
              "This function is restricted to master account only",
          );
        }

        console.log("[Manual Verify] Starting manual verification by master account...");

        // Find users with pending_cancellation status or recent cancellation errors
        const usersSnapshot = await db.collection("users")
            .where("subscriptionStatus", "in", ["pending_cancellation", "cancelled"])
            .get();

        if (usersSnapshot.empty) {
          return {
            success: true,
            message: "No subscriptions to verify",
            results: {checked: 0, retried: 0, succeeded: 0, failed: 0},
          };
        }

        const results = {
          checked: 0,
          retried: 0,
          succeeded: 0,
          failed: 0,
        };

        const userDetails = [];

        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const userData = userDoc.data();
          results.checked++;

          // Skip if no subscription token
          if (!userData.subscriptionToken) {
            continue;
          }

          // Check if this is a pending cancellation or recent cancellation with error
          const needsRetry =
            userData.subscriptionStatus === "pending_cancellation" ||
            (userData.subscriptionStatus === "cancelled" &&
             userData.lastCancellationError &&
             userData.cancellationRequestedAt);

          if (!needsRetry) {
            continue;
          }

          console.log(`[Manual Verify] Retrying cancellation for user ${userId}`);
          results.retried++;

          // Retry the cancellation via PayFast API
          const apiResponse = await callPayFastApi(
              `/subscriptions/${userData.subscriptionToken}/cancel`,
              "PUT",
          );

          if (apiResponse.success) {
            // Successfully cancelled - update user document
            await db.collection("users").doc(userId).update({
              subscriptionStatus: "cancelled",
              cancellationCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
              subscriptionEndDate: admin.firestore.FieldValue.serverTimestamp(),
              lastCancellationError: admin.firestore.FieldValue.delete(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            results.succeeded++;
            userDetails.push({
              email: userData.email,
              displayName: userData.displayName,
              status: "success",
              plan: userData.plan,
              subscriptionToken: userData.subscriptionToken,
            });
            console.log(`[Manual Verify] Successfully cancelled subscription for user ${userId}`);
          } else {
            // Still failing - update error log
            await db.collection("users").doc(userId).update({
              lastCancellationError: apiResponse.error,
              lastCancellationRetryAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            results.failed++;
            userDetails.push({
              email: userData.email,
              displayName: userData.displayName,
              status: "failed",
              plan: userData.plan,
              subscriptionToken: userData.subscriptionToken,
              error: apiResponse.error,
            });
            console.error(`[Manual Verify] Failed to cancel subscription for user ${userId}:`, apiResponse.error);
          }
        }

        console.log("[Manual Verify] Completed:", results);
        return {
          success: true,
          message: "Verification completed",
          results: results,
          users: userDetails,
        };
      } catch (error) {
        console.error("[Manual Verify] Error:", error);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        throw new functions.https.HttpsError("internal", error.message);
      }
    },
);
