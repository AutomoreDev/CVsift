const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

/**
 * Log an activity performed by a team member
 * This function should only be called by other cloud functions, not directly by clients
 */
exports.logActivity = async ({
  userId,
  teamOwnerId,
  action,
  resourceType,
  resourceId,
  resourceName,
  metadata = {},
}) => {
  try {
    const db = admin.firestore();

    // Get user info
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.error("User not found for logging:", userId);
      return {success: false, error: "User not found"};
    }

    const userData = userDoc.data();

    // Determine if this is a team member action or owner action
    let isTeamMemberAction = false;
    let role = "owner";

    if (teamOwnerId && teamOwnerId !== userId) {
      // Check if user is a team member
      const memberSnapshot = await db.collection("teamMembers")
          .where("userId", "==", userId)
          .where("teamOwnerId", "==", teamOwnerId)
          .limit(1)
          .get();

      if (!memberSnapshot.empty) {
        isTeamMemberAction = true;
        role = memberSnapshot.docs[0].data().role || "member";
      }
    }

    // Create activity log entry
    const logData = {
      userId: userId,
      userEmail: userData.email,
      userName: userData.displayName || userData.email,
      teamOwnerId: teamOwnerId || userId,
      action: action,
      resourceType: resourceType,
      resourceId: resourceId || null,
      resourceName: resourceName || null,
      role: role,
      isTeamMemberAction: isTeamMemberAction,
      metadata: metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.Timestamp.now(),
    };

    await db.collection("activityLogs").add(logData);

    return {success: true};
  } catch (error) {
    console.error("Error logging activity:", error);
    return {success: false, error: error.message};
  }
};

/**
 * Get activity logs for the current user's team
 * Team owners and team members (admins) can view logs
 */
exports.getActivityLogs = onCall(async (request) => {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const db = admin.firestore();

    // Determine the team owner ID (either current user or their team owner)
    let teamOwnerId = userId;
    let ownerPlan = null;

    // Check if user is a team member
    const memberSnapshot = await db.collection("teamMembers")
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (!memberSnapshot.empty) {
      // User is a team member - get the owner's ID
      const memberData = memberSnapshot.docs[0].data();
      teamOwnerId = memberData.teamOwnerId;

      // Check if user has permission (admin role can view logs)
      if (memberData.role !== "admin" && memberData.role !== "owner") {
        throw new HttpsError(
            "permission-denied",
            "Only team admins and owners can view activity logs.",
        );
      }

      // Get owner's plan
      const ownerDoc = await db.collection("users").doc(teamOwnerId).get();
      if (ownerDoc.exists) {
        ownerPlan = ownerDoc.data().plan;
      }
    } else {
      // User is potentially a team owner - get their plan
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User not found");
      }
      ownerPlan = userDoc.data().plan;
    }

    // Check if plan allows activity logs
    const allowedPlans = ["professional", "business", "enterprise"];
    if (!allowedPlans.includes(ownerPlan)) {
      throw new HttpsError(
          "permission-denied",
          "Activity logs are only available for Professional, Business, and Enterprise plans.",
      );
    }

    // Get activity logs for the team owner
    const logsSnapshot = await db.collection("activityLogs")
        .where("teamOwnerId", "==", teamOwnerId)
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

    const logs = logsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().createdAt?.toDate()?.toISOString() || null,
    }));

    return {
      success: true,
      logs: logs,
      total: logs.length,
    };
  } catch (error) {
    console.error("Error getting activity logs:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to get activity logs: ${error.message}`);
  }
});

/**
 * Helper function to log CV upload
 */
exports.logCVUpload = async (userId, teamOwnerId, cvId, cvName) => {
  return exports.logActivity({
    userId,
    teamOwnerId,
    action: "cv_uploaded",
    resourceType: "cv",
    resourceId: cvId,
    resourceName: cvName,
    metadata: {
      description: "CV uploaded to library",
    },
  });
};

/**
 * Helper function to log CV deletion
 */
exports.logCVDelete = async (userId, teamOwnerId, cvId, cvName) => {
  return exports.logActivity({
    userId,
    teamOwnerId,
    action: "cv_deleted",
    resourceType: "cv",
    resourceId: cvId,
    resourceName: cvName,
    metadata: {
      description: "CV deleted from library",
    },
  });
};

/**
 * Helper function to log CV update
 */
exports.logCVUpdate = async (userId, teamOwnerId, cvId, cvName, updateType) => {
  return exports.logActivity({
    userId,
    teamOwnerId,
    action: "cv_updated",
    resourceType: "cv",
    resourceId: cvId,
    resourceName: cvName,
    metadata: {
      description: `CV ${updateType}`,
      updateType: updateType,
    },
  });
};

/**
 * Helper function to log CV view
 */
exports.logCVView = async (userId, teamOwnerId, cvId, cvName) => {
  return exports.logActivity({
    userId,
    teamOwnerId,
    action: "cv_viewed",
    resourceType: "cv",
    resourceId: cvId,
    resourceName: cvName,
    metadata: {
      description: "CV viewed",
    },
  });
};

/**
 * Cloud Function to log job spec creation
 */
exports.logJobSpecCreate = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const {jobSpecId, jobSpecTitle, teamOwnerId} = request.data;

    if (!jobSpecId || !jobSpecTitle) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    const result = await exports.logActivity({
      userId,
      teamOwnerId: teamOwnerId || userId,
      action: "jobspec_created",
      resourceType: "jobspec",
      resourceId: jobSpecId,
      resourceName: jobSpecTitle,
      metadata: {
        description: "Job specification created",
      },
    });

    return result;
  } catch (error) {
    console.error("Error logging job spec creation:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `Failed to log activity: ${error.message}`);
  }
});

/**
 * Cloud Function to log job spec update
 */
exports.logJobSpecUpdate = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const {jobSpecId, jobSpecTitle, teamOwnerId} = request.data;

    if (!jobSpecId || !jobSpecTitle) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    const result = await exports.logActivity({
      userId,
      teamOwnerId: teamOwnerId || userId,
      action: "jobspec_updated",
      resourceType: "jobspec",
      resourceId: jobSpecId,
      resourceName: jobSpecTitle,
      metadata: {
        description: "Job specification updated",
      },
    });

    return result;
  } catch (error) {
    console.error("Error logging job spec update:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `Failed to log activity: ${error.message}`);
  }
});

/**
 * Cloud Function to log job spec deletion
 */
exports.logJobSpecDelete = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const {jobSpecId, jobSpecTitle, teamOwnerId} = request.data;

    if (!jobSpecId || !jobSpecTitle) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    const result = await exports.logActivity({
      userId,
      teamOwnerId: teamOwnerId || userId,
      action: "jobspec_deleted",
      resourceType: "jobspec",
      resourceId: jobSpecId,
      resourceName: jobSpecTitle,
      metadata: {
        description: "Job specification deleted",
      },
    });

    return result;
  } catch (error) {
    console.error("Error logging job spec deletion:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `Failed to log activity: ${error.message}`);
  }
});
