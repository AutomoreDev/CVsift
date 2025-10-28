const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Check if user is the primary master account
 */
function isPrimaryMaster(email) {
  const primaryMasterEmail = process.env.PRIMARY_MASTER_EMAIL || process.env.MASTER_ACCOUNT_EMAIL;
  return email && primaryMasterEmail &&
    email.toLowerCase().trim() === primaryMasterEmail.toLowerCase().trim();
}

/**
 * Get comprehensive usage data for all sub-master accounts
 * Only accessible by the primary master account
 */
exports.getSubMasterUsage = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const currentUserEmail = request.auth.token.email;

    // Only primary master can view usage
    if (!isPrimaryMaster(currentUserEmail)) {
      throw new HttpsError(
          "permission-denied",
          "Only the primary master can view sub-master usage",
      );
    }

    // Get all sub-master accounts
    const subMastersSnapshot = await db.collection("users")
        .where("role", "==", "submaster")
        .get();

    if (subMastersSnapshot.empty) {
      return {
        success: true,
        subMasters: [],
        message: "No sub-master accounts found",
      };
    }

    const usageData = [];
    const now = new Date(); // Define once outside the loop

    // Process each sub-master
    for (const doc of subMastersSnapshot.docs) {
      const subMasterData = doc.data();
      const subMasterId = doc.id;

      // Get current month dates
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Get CV upload count for this month
      const cvsSnapshot = await db.collection("cvs")
          .where("userId", "==", subMasterId)
          .where("uploadedAt", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
          .where("uploadedAt", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
          .get();

      const cvCount = cvsSnapshot.size;

      // Get chatbot usage count for this month (including team members)
      const chatbotSnapshot = await db.collection("chatbotUsage")
          .where("accountOwnerId", "==", subMasterId)
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
          .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
          .get();

      const chatbotMessageCount = chatbotSnapshot.size;

      // Get API calls count for this month (if tracked)
      const apiCallsSnapshot = await db.collection("apiLogs")
          .where("userId", "==", subMasterId)
          .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
          .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
          .get();

      const apiCallCount = apiCallsSnapshot.size;

      // Group API calls by endpoint
      const apiBreakdown = {};
      apiCallsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const endpoint = data.endpoint || "unknown";
        apiBreakdown[endpoint] = (apiBreakdown[endpoint] || 0) + 1;
      });

      // Get SMS verifications count for this month
      const smsLogsSnapshot = await db.collection("smsLogs")
          .where("userId", "==", subMasterId)
          .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
          .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
          .get();

      const smsCount = smsLogsSnapshot.size;

      // Group SMS by purpose
      const smsBreakdown = {};
      smsLogsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const purpose = data.purpose || "unknown";
        smsBreakdown[purpose] = (smsBreakdown[purpose] || 0) + 1;
      });

      // Get team members count
      const teamMembersSnapshot = await db.collection("teamMembers")
          .where("teamOwnerId", "==", subMasterId)
          .get();

      const teamMemberCount = teamMembersSnapshot.size;

      // Get job specs count
      const jobSpecsSnapshot = await db.collection("jobSpecs")
          .where("userId", "==", subMasterId)
          .get();

      const jobSpecCount = jobSpecsSnapshot.size;

      // Calculate estimated costs (you can adjust these rates)
      const CV_COST_PER_UNIT = 1.20; // R1.20 per CV
      const CHATBOT_COST_PER_MESSAGE = 0.35; // R0.35 per message
      const API_COST_PER_CALL = 0.10; // R0.10 per API call
      const SMS_COST_PER_MESSAGE = 0.50; // R0.50 per SMS

      const estimatedCost =
        (cvCount * CV_COST_PER_UNIT) +
        (chatbotMessageCount * CHATBOT_COST_PER_MESSAGE) +
        (apiCallCount * API_COST_PER_CALL) +
        (smsCount * SMS_COST_PER_MESSAGE);

      // Get all-time stats
      const allTimeCvsSnapshot = await db.collection("cvs")
          .where("userId", "==", subMasterId)
          .get();

      const allTimeChatbotSnapshot = await db.collection("chatbotUsage")
          .where("accountOwnerId", "==", subMasterId)
          .get();

      usageData.push({
        subMasterId: subMasterId,
        email: subMasterData.email,
        displayName: subMasterData.displayName,
        createdAt: subMasterData.createdAt?.toDate?.()?.toISOString?.() || null,
        plan: subMasterData.plan,
        currentMonth: {
          cvUploads: cvCount,
          chatbotMessages: chatbotMessageCount,
          apiCalls: apiCallCount,
          apiBreakdown: apiBreakdown,
          smsVerifications: smsCount,
          smsBreakdown: smsBreakdown,
          estimatedCost: estimatedCost,
          period: {
            start: startOfMonth.toISOString(),
            end: endOfMonth.toISOString(),
          },
        },
        teamInfo: {
          memberCount: teamMemberCount,
          jobSpecCount: jobSpecCount,
        },
        allTime: {
          totalCvs: allTimeCvsSnapshot.size,
          totalChatbotMessages: allTimeChatbotSnapshot.size,
        },
        lastActivity: (subMasterData.lastLoginAt?.toDate?.() ||
          subMasterData.createdAt?.toDate?.())?.toISOString?.() || null,
      });
    }

    // Sort by estimated cost (highest first)
    usageData.sort((a, b) =>
      b.currentMonth.estimatedCost - a.currentMonth.estimatedCost,
    );

    // Calculate totals
    const totals = {
      totalSubMasters: usageData.length,
      totalCvUploads: usageData.reduce((sum, sm) => sum + sm.currentMonth.cvUploads, 0),
      totalChatbotMessages: usageData.reduce((sum, sm) => sum + sm.currentMonth.chatbotMessages, 0),
      totalApiCalls: usageData.reduce((sum, sm) => sum + sm.currentMonth.apiCalls, 0),
      totalSmsVerifications: usageData.reduce((sum, sm) => sum + sm.currentMonth.smsVerifications, 0),
      totalEstimatedRevenue: usageData.reduce((sum, sm) => sum + sm.currentMonth.estimatedCost, 0),
    };

    return {
      success: true,
      subMasters: usageData,
      totals: totals,
      month: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        name: now.toLocaleString("default", {month: "long"}),
      },
    };
  } catch (error) {
    console.error("Error getting sub-master usage:", error);
    throw new HttpsError("internal", `Failed to get usage data: ${error.message}`);
  }
});

/**
 * Get detailed usage history for a specific sub-master
 */
exports.getSubMasterDetailedUsage = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const currentUserEmail = request.auth.token.email;
    const {subMasterId, monthsBack = 6} = request.data;

    // Only primary master can view detailed usage
    if (!isPrimaryMaster(currentUserEmail)) {
      throw new HttpsError(
          "permission-denied",
          "Only the primary master can view detailed usage",
      );
    }

    if (!subMasterId) {
      throw new HttpsError("invalid-argument", "subMasterId is required");
    }

    // Get sub-master info
    const subMasterDoc = await db.collection("users").doc(subMasterId).get();
    if (!subMasterDoc.exists || subMasterDoc.data().role !== "submaster") {
      throw new HttpsError("not-found", "Sub-master account not found");
    }

    const monthlyData = [];
    const now = new Date();

    // Get data for the last N months
    for (let i = 0; i < monthsBack; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      // Get CV uploads for this month
      const cvsSnapshot = await db.collection("cvs")
          .where("userId", "==", subMasterId)
          .where("uploadedAt", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
          .where("uploadedAt", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
          .get();

      // Get chatbot usage for this month (including team members)
      const chatbotSnapshot = await db.collection("chatbotUsage")
          .where("accountOwnerId", "==", subMasterId)
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
          .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
          .get();

      // Get API calls for this month
      const apiCallsSnapshot = await db.collection("apiLogs")
          .where("userId", "==", subMasterId)
          .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
          .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
          .get();

      // Get SMS verifications for this month
      const smsLogsSnapshot = await db.collection("smsLogs")
          .where("userId", "==", subMasterId)
          .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
          .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
          .get();

      const cvCount = cvsSnapshot.size;
      const chatbotCount = chatbotSnapshot.size;
      const apiCount = apiCallsSnapshot.size;
      const smsCount = smsLogsSnapshot.size;

      const CV_COST_PER_UNIT = 1.20;
      const CHATBOT_COST_PER_MESSAGE = 0.35;
      const API_COST_PER_CALL = 0.10;
      const SMS_COST_PER_MESSAGE = 0.50;

      const totalCost =
        (cvCount * CV_COST_PER_UNIT) +
        (chatbotCount * CHATBOT_COST_PER_MESSAGE) +
        (apiCount * API_COST_PER_CALL) +
        (smsCount * SMS_COST_PER_MESSAGE);

      monthlyData.push({
        year: monthDate.getFullYear(),
        month: monthDate.getMonth() + 1,
        monthName: monthDate.toLocaleString("default", {month: "long"}),
        cvUploads: cvCount,
        chatbotMessages: chatbotCount,
        apiCalls: apiCount,
        smsVerifications: smsCount,
        totalCost: totalCost,
      });
    }

    return {
      success: true,
      subMaster: subMasterDoc.data(),
      monthlyData: monthlyData.reverse(), // Oldest first
    };
  } catch (error) {
    console.error("Error getting detailed usage:", error);
    throw new HttpsError("internal", `Failed to get detailed usage: ${error.message}`);
  }
});
