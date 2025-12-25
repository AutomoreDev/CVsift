const admin = require("firebase-admin");

/**
 * Log an API call for billing purposes
 * @param {string} userId - The user ID making the call
 * @param {string} endpoint - The API endpoint name
 * @param {string} method - The method/operation (e.g., 'calculateMatch', 'getAnalytics')
 */
async function logApiCall(userId, endpoint, method = null) {
  try {
    const db = admin.firestore();

    // Determine the account owner (could be user or team owner)
    let accountOwnerId = userId;

    // Check if user is a team member
    const teamMemberQuery = await db.collection("teamMembers")
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (!teamMemberQuery.empty) {
      const teamMemberData = teamMemberQuery.docs[0].data();
      accountOwnerId = teamMemberData.teamOwnerId;
    }

    // Log the API call
    await db.collection("apiLogs").add({
      userId: userId,
      accountOwnerId: accountOwnerId, // The sub-master account to bill
      endpoint: endpoint,
      method: method,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to log API call:", error);
    // Don't fail the request if logging fails
  }
}

module.exports = {
  logApiCall,
};
