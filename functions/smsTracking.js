const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Cloud function to log SMS verifications
 * Called from the frontend when SMS is sent
 */
exports.logSmsVerification = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be authenticated to log SMS verifications",
      );
    }

    const userId = context.auth.uid;
    const {phoneNumber, purpose} = data; // purpose: 'mfa_enrollment', 'mfa_signin', 'phone_verification'

    // Log the SMS verification
    await db.collection("smsLogs").add({
      userId: userId,
      phoneNumber: phoneNumber,
      purpose: purpose || "unknown",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      cost: 0.50, // Cost per SMS in your currency (adjust as needed)
    });

    return {success: true, message: "SMS verification logged successfully"};
  } catch (error) {
    console.error("Error logging SMS verification:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get SMS usage for a specific user
 */
exports.getUserSmsUsage = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be authenticated",
      );
    }

    const {userId, startDate, endDate} = data;
    const targetUserId = userId || context.auth.uid;

    // Check permissions - only allow users to view their own data or masters to view sub-masters
    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    const userData = userDoc.data();

    if (context.auth.uid !== targetUserId && userData.role !== "master") {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You don't have permission to view this user's SMS usage",
      );
    }

    const query = db.collection("smsLogs")
        .where("userId", "==", targetUserId);

    if (startDate && endDate) {
      query.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)))
          .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const smsSnapshot = await query.get();

    const smsUsage = {
      totalCount: smsSnapshot.size,
      totalCost: smsSnapshot.size * 0.50,
      breakdown: {},
    };

    smsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const purpose = data.purpose || "unknown";
      smsUsage.breakdown[purpose] = (smsUsage.breakdown[purpose] || 0) + 1;
    });

    return smsUsage;
  } catch (error) {
    console.error("Error getting SMS usage:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
