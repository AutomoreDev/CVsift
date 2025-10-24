/* eslint-disable valid-jsdoc */
/* eslint-disable max-len */
const {onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {calculateAdvancedMatch} = require("./advancedMatcher");
const {logApiCall} = require("./apiLogger");

/**
 * Calculate match score between a CV and a job specification
 */
exports.calculateMatchScore = onCall(async (request) => {
  const {cvId, jobSpecId} = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const db = admin.firestore();

    // Check if user is a team member
    const memberSnapshot = await db.collection("teamMembers")
        .where("userId", "==", userId)
        .limit(1)
        .get();

    const isTeamMember = !memberSnapshot.empty;
    let effectiveUserId = userId;

    if (isTeamMember) {
      // User is a team member - use team owner's ID
      const memberData = memberSnapshot.docs[0].data();
      effectiveUserId = memberData.teamOwnerId;
    }

    // Get CV data
    const cvDoc = await db.collection("cvs").doc(cvId).get();
    if (!cvDoc.exists) {
      throw new Error("CV not found");
    }
    const cvData = cvDoc.data();

    // Verify CV belongs to user or team owner
    if (cvData.userId !== effectiveUserId) {
      throw new Error("Unauthorized access to CV");
    }

    // Get job spec data
    const jobSpecDoc = await db.collection("jobSpecs").doc(jobSpecId).get();
    if (!jobSpecDoc.exists) {
      throw new Error("Job specification not found");
    }
    const jobSpec = jobSpecDoc.data();

    // Verify job spec belongs to user or team owner
    if (jobSpec.userId !== effectiveUserId) {
      throw new Error("Unauthorized access to job specification");
    }

    // Calculate match score using advanced matcher
    const matchResult = calculateAdvancedMatch(cvData, jobSpec);

    // Log API call for billing
    await logApiCall(userId, "calculateMatchScore", "CV_MATCH");

    // Store match result with owner's userId
    await db.collection("cvMatches").add({
      cvId,
      jobSpecId,
      userId: effectiveUserId, // Always use owner's ID
      matchScore: matchResult.overallScore,
      breakdown: matchResult.breakdown,
      strengths: matchResult.strengths,
      gaps: matchResult.gaps,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update CV document with match score
    await db.collection("cvs").doc(cvId).update({
      [`matchScores.${jobSpecId}`]: {
        score: matchResult.overallScore,
        breakdown: matchResult.breakdown,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    return {
      success: true,
      matchScore: matchResult.overallScore,
      breakdown: matchResult.breakdown,
      strengths: matchResult.strengths,
      gaps: matchResult.gaps,
    };
  } catch (error) {
    console.error("Error calculating match score:", error);
    throw new Error(`Failed to calculate match score: ${error.message}`);
  }
});

/**
 * Batch calculate match scores for multiple CVs against a job spec
 */
exports.batchCalculateMatches = onCall(async (request) => {
  const {cvIds, jobSpecId} = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const db = admin.firestore();

    // Check if user is a team member
    const memberSnapshot = await db.collection("teamMembers")
        .where("userId", "==", userId)
        .limit(1)
        .get();

    const isTeamMember = !memberSnapshot.empty;
    let effectiveUserId = userId;
    let teamOwnerId = null;

    if (isTeamMember) {
      // User is a team member - use team owner's ID
      const memberData = memberSnapshot.docs[0].data();
      teamOwnerId = memberData.teamOwnerId;
      effectiveUserId = teamOwnerId;
    }

    // Get job spec data
    const jobSpecDoc = await db.collection("jobSpecs").doc(jobSpecId).get();
    if (!jobSpecDoc.exists) {
      throw new Error("Job specification not found");
    }
    const jobSpec = jobSpecDoc.data();

    // Verify access: either owner or team member of the owner
    if (jobSpec.userId !== effectiveUserId) {
      throw new Error("Unauthorized access to job specification");
    }

    // Log API call for billing (batch operation counts as one API call)
    await logApiCall(userId, "batchCalculateMatches", "BATCH_CV_MATCH");

    // Process all CVs
    const results = [];
    const batchWrites = [];

    for (const cvId of cvIds) {
      const cvDoc = await db.collection("cvs").doc(cvId).get();
      if (!cvDoc.exists || cvDoc.data().userId !== effectiveUserId) {
        continue;
      }

      const cvData = cvDoc.data();
      const matchResult = calculateAdvancedMatch(cvData, jobSpec);

      // Store match result with the owner's userId (not team member's)
      batchWrites.push(
          db.collection("cvMatches").add({
            cvId,
            jobSpecId,
            userId: effectiveUserId, // Always use owner's ID
            matchScore: matchResult.overallScore,
            breakdown: matchResult.breakdown,
            strengths: matchResult.strengths,
            gaps: matchResult.gaps,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }),
      );

      // Update CV with match score
      batchWrites.push(
          db.collection("cvs").doc(cvId).update({
            [`matchScores.${jobSpecId}`]: {
              score: matchResult.overallScore,
              breakdown: matchResult.breakdown,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
          }),
      );

      results.push({
        cvId,
        matchScore: matchResult.overallScore,
        breakdown: matchResult.breakdown,
      });
    }

    // Execute all writes
    await Promise.all(batchWrites);

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("Error in batch calculation:", error);
    throw new Error(`Failed to calculate batch matches: ${error.message}`);
  }
});

/**
 * Legacy matching algorithm - DEPRECATED
 * This function is no longer used. All matching now uses calculateAdvancedMatch from advancedMatcher.js
 * Keeping this code for reference only.
 */
