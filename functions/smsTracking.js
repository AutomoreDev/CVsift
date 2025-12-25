const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Cloud function to log SMS verifications
 * Called from the frontend when SMS is sent
 */
exports.logSmsVerification = onCall({region: "us-central1"}, async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "User must be authenticated to log SMS verifications",
      );
    }

    const userId = request.auth.uid;
    const {phoneNumber, purpose} = request.data; // purpose: 'mfa_enrollment', 'mfa_signin', 'phone_verification'

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
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Get SMS usage for a specific user
 */
exports.getUserSmsUsage = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "User must be authenticated",
      );
    }

    const {userId, startDate, endDate} = request.data;
    const targetUserId = userId || request.auth.uid;

    // Check permissions - only allow users to view their own data or masters to view sub-masters
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const userData = userDoc.data();

    if (request.auth.uid !== targetUserId && userData.role !== "master" && userData.role !== "submaster") {
      throw new HttpsError(
          "permission-denied",
          "You don't have permission to view this user's SMS usage",
      );
    }

    let query = db.collection("smsLogs")
        .where("userId", "==", targetUserId);

    if (startDate && endDate) {
      query = query.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)))
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
    throw new HttpsError("internal", error.message);
  }
});
