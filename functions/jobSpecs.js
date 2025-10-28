const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {logJobSpecDelete} = require("./activityLogs");
const {logApiCall} = require("./apiLogger");

/**
 * Get team job specs for team members
 * Uses Admin SDK to bypass security rules
 * @param {object} request - The request object
 * @return {Promise<object>} - Job specs data
 */
exports.getTeamJobSpecs = onCall(async (request) => {
  try {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const db = admin.firestore();

    // Check if user is a team member
    const memberSnapshot = await db.collection("teamMembers")
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (memberSnapshot.empty) {
      throw new HttpsError(
          "permission-denied",
          "User is not a team member",
      );
    }

    const memberData = memberSnapshot.docs[0].data();
    const teamOwnerId = memberData.teamOwnerId;

    // Fetch owner's job specs using Admin SDK (bypasses security rules)
    const jobSpecsSnapshot = await db.collection("jobSpecs")
        .where("userId", "==", teamOwnerId)
        .orderBy("createdAt", "desc")
        .get();

    const jobSpecs = jobSpecsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Log API call for billing
    await logApiCall(userId, "getTeamJobSpecs", "GET_TEAM_JOB_SPECS");

    return {
      success: true,
      jobSpecs: jobSpecs,
      teamOwnerId: teamOwnerId,
    };
  } catch (error) {
    console.error("Error fetching team job specs:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
        "internal",
        `Failed to fetch team job specs: ${error.message}`,
    );
  }
});

/**
 * Delete a job spec (supports team members)
 * @param {object} request - The request object
 * @return {Promise<object>} - Deletion result
 */
exports.deleteJobSpec = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {jobSpecId} = request.data;
  if (!jobSpecId) {
    throw new HttpsError("invalid-argument", "Job spec ID is required");
  }

  try {
    const db = admin.firestore();
    const jobSpecRef = db.collection("jobSpecs").doc(jobSpecId);
    const jobSpecDoc = await jobSpecRef.get();

    if (!jobSpecDoc.exists) {
      throw new HttpsError("not-found", "Job specification not found");
    }

    const jobSpecData = jobSpecDoc.data();
    const userId = request.auth.uid;

    // Check permissions - user must own the job spec or be a team member
    let teamOwnerId = jobSpecData.userId;
    let isTeamMember = false;

    // Check if user is team member accessing team owner's job spec
    if (jobSpecData.userId !== userId) {
      const teamMemberSnapshot = await db.collection("teamMembers")
          .where("userId", "==", userId)
          .where("teamOwnerId", "==", jobSpecData.userId)
          .limit(1)
          .get();

      if (teamMemberSnapshot.empty) {
        throw new HttpsError(
            "permission-denied",
            "You don't have permission to delete this job specification",
        );
      }

      isTeamMember = true;
      teamOwnerId = jobSpecData.userId;
    }

    // Delete from Firestore
    await jobSpecRef.delete();

    // Log API call for billing
    await logApiCall(userId, "deleteJobSpec", "DELETE_JOB_SPEC");

    // Log deletion activity
    try {
      // Call the internal logActivity function, not the Cloud Function wrapper
      const {logActivity} = require("./activityLogs");
      await logActivity({
        userId,
        teamOwnerId,
        action: "jobspec_deleted",
        resourceType: "jobspec",
        resourceId: jobSpecId,
        resourceName: jobSpecData.title || "Unknown",
        metadata: {
          description: "Job specification deleted",
        },
      });
    } catch (logError) {
      console.error("Error logging job spec deletion:", logError);
      // Don't fail the deletion if logging fails
    }

    return {
      success: true,
      message: "Job specification deleted successfully",
      wasTeamMemberAction: isTeamMember,
    };
  } catch (error) {
    console.error("Error deleting job spec:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
        "internal",
        `Failed to delete job specification: ${error.message}`,
    );
  }
});
