/* eslint-disable valid-jsdoc */
/* eslint-disable max-len */
const {onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

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

    // Get CV data
    const cvDoc = await db.collection("cvs").doc(cvId).get();
    if (!cvDoc.exists) {
      throw new Error("CV not found");
    }
    const cvData = cvDoc.data();

    // Verify CV belongs to user
    if (cvData.userId !== userId) {
      throw new Error("Unauthorized access to CV");
    }

    // Get job spec data
    const jobSpecDoc = await db.collection("jobSpecs").doc(jobSpecId).get();
    if (!jobSpecDoc.exists) {
      throw new Error("Job specification not found");
    }
    const jobSpec = jobSpecDoc.data();

    // Verify job spec belongs to user
    if (jobSpec.userId !== userId) {
      throw new Error("Unauthorized access to job specification");
    }

    // Calculate match score
    const matchResult = calculateMatch(cvData, jobSpec);

    // Store match result
    await db.collection("cvMatches").add({
      cvId,
      jobSpecId,
      userId,
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

    // Get job spec data
    const jobSpecDoc = await db.collection("jobSpecs").doc(jobSpecId).get();
    if (!jobSpecDoc.exists) {
      throw new Error("Job specification not found");
    }
    const jobSpec = jobSpecDoc.data();

    if (jobSpec.userId !== userId) {
      throw new Error("Unauthorized access to job specification");
    }

    // Process all CVs
    const results = [];
    const batchWrites = [];

    for (const cvId of cvIds) {
      const cvDoc = await db.collection("cvs").doc(cvId).get();
      if (!cvDoc.exists || cvDoc.data().userId !== userId) {
        continue;
      }

      const cvData = cvDoc.data();
      const matchResult = calculateMatch(cvData, jobSpec);

      // Store match result
      batchWrites.push(
          db.collection("cvMatches").add({
            cvId,
            jobSpecId,
            userId,
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
 * Core matching algorithm
 */
function calculateMatch(cvData, jobSpec) {
  const breakdown = {};
  const strengths = [];
  const gaps = [];

  // 1. Skills Match (30%)
  const skillsScore = calculateSkillsMatch(
      cvData.metadata?.skills || [],
      jobSpec.requiredSkills || [],
      jobSpec.preferredSkills || [],
  );
  breakdown.skills = skillsScore;

  if (skillsScore.score > 70) {
    strengths.push(`Strong skills match: ${skillsScore.matchedSkills.join(", ")}`);
  } else if (skillsScore.missingRequired.length > 0) {
    gaps.push(`Missing required skills: ${skillsScore.missingRequired.join(", ")}`);
  }

  // 2. Experience Match (25%)
  const experienceScore = calculateExperienceMatch(
      cvData.metadata?.experience || 0,
      jobSpec.minExperience,
      jobSpec.maxExperience,
  );
  breakdown.experience = experienceScore;

  if (experienceScore.score === 100) {
    strengths.push(`Perfect experience match: ${cvData.metadata?.experience || 0} years`);
  } else if (experienceScore.score < 50) {
    gaps.push(experienceScore.reason);
  }

  // 3. Education Match (20%)
  const educationScore = calculateEducationMatch(
      cvData.metadata?.education || "",
      jobSpec.education || "",
  );
  breakdown.education = educationScore;

  if (educationScore.score === 100) {
    strengths.push(`Meets education requirement: ${cvData.metadata?.education}`);
  } else if (educationScore.score < 50) {
    gaps.push(`Education level below requirement`);
  }

  // 4. Location Match (10%)
  const locationScore = calculateLocationMatch(
      cvData.metadata?.location || "",
      jobSpec.location || "",
      jobSpec.locationType || "onsite",
  );
  breakdown.location = locationScore;

  // 5. Demographic Match (15%) - if specified
  const demographicScore = calculateDemographicMatch(
      cvData.metadata,
      jobSpec,
  );
  breakdown.demographic = demographicScore;

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
      skillsScore.score * 0.30 +
    experienceScore.score * 0.25 +
    educationScore.score * 0.20 +
    locationScore.score * 0.10 +
    demographicScore.score * 0.15,
  );

  return {
    overallScore,
    breakdown,
    strengths: strengths.slice(0, 5), // Top 5 strengths
    gaps: gaps.slice(0, 5), // Top 5 gaps
  };
}

/**
 * Calculate skills match score
 */
function calculateSkillsMatch(cvSkills, requiredSkills, preferredSkills) {
  const cvSkillsLower = cvSkills.map((s) => s.toLowerCase());
  const requiredLower = requiredSkills.map((s) => s.toLowerCase());
  const preferredLower = preferredSkills.map((s) => s.toLowerCase());

  // Required skills matching
  const matchedRequired = requiredLower.filter((skill) =>
    cvSkillsLower.some((cvSkill) =>
      cvSkill.includes(skill) || skill.includes(cvSkill),
    ),
  );

  const missingRequired = requiredLower.filter((skill) =>
    !cvSkillsLower.some((cvSkill) =>
      cvSkill.includes(skill) || skill.includes(cvSkill),
    ),
  );

  // Preferred skills matching
  const matchedPreferred = preferredLower.filter((skill) =>
    cvSkillsLower.some((cvSkill) =>
      cvSkill.includes(skill) || skill.includes(cvSkill),
    ),
  );

  // Calculate score
  let score = 0;
  if (requiredLower.length > 0) {
    score = (matchedRequired.length / requiredLower.length) * 80; // 80% for required
  } else {
    score = 80; // No required skills specified
  }

  // Add bonus for preferred skills
  if (preferredLower.length > 0) {
    score += (matchedPreferred.length / preferredLower.length) * 20;
  } else {
    score += 20; // No preferred skills specified
  }

  return {
    score: Math.round(score),
    matchedRequired: matchedRequired.length,
    totalRequired: requiredLower.length,
    matchedPreferred: matchedPreferred.length,
    totalPreferred: preferredLower.length,
    matchedSkills: [...matchedRequired, ...matchedPreferred],
    missingRequired: missingRequired,
  };
}

/**
 * Calculate experience match score
 */
function calculateExperienceMatch(cvExperience, minExp, maxExp) {
  const experience = parseInt(cvExperience) || 0;
  const min = parseInt(minExp) || 0;
  const max = parseInt(maxExp) || 999;

  let score = 0;
  let reason = "";

  if (experience >= min && experience <= max) {
    score = 100;
    reason = "Experience within range";
  } else if (experience < min) {
    const diff = min - experience;
    score = Math.max(0, 100 - diff * 15); // Penalize 15% per year short
    reason = `${diff} year(s) below minimum`;
  } else {
    // Over-qualified
    const diff = experience - max;
    score = Math.max(50, 100 - diff * 5); // Smaller penalty for being over-qualified
    reason = `${diff} year(s) above maximum (over-qualified)`;
  }

  return {
    score: Math.round(score),
    years: experience,
    range: `${min}-${max}`,
    reason,
  };
}

/**
 * Calculate education match score
 */
function calculateEducationMatch(cvEducation, requiredEducation) {
  if (!requiredEducation) {
    return {score: 100, reason: "No requirement specified"};
  }

  const educationLevels = {
    "high school": 1,
    "associate degree": 2,
    "bachelor's degree": 3,
    "bachelor": 3,
    "master's degree": 4,
    "master": 4,
    "doctorate": 5,
    "phd": 5,
  };

  const cvLevel = educationLevels[cvEducation.toLowerCase()] || 0;
  const reqLevel = educationLevels[requiredEducation.toLowerCase()] || 0;

  let score = 0;
  if (cvLevel >= reqLevel) {
    score = 100;
  } else if (cvLevel === reqLevel - 1) {
    score = 70; // One level below
  } else if (cvLevel === reqLevel - 2) {
    score = 40; // Two levels below
  } else {
    score = 20; // More than two levels below
  }

  return {
    score,
    cvLevel: cvEducation,
    requiredLevel: requiredEducation,
  };
}

/**
 * Calculate location match score
 */
function calculateLocationMatch(cvLocation, jobLocation, locationType) {
  if (!jobLocation || locationType === "remote") {
    return {score: 100, reason: "Remote or no location requirement"};
  }

  const cvLoc = cvLocation.toLowerCase();
  const jobLoc = jobLocation.toLowerCase();

  if (cvLoc.includes(jobLoc) || jobLoc.includes(cvLoc)) {
    return {score: 100, reason: "Location match"};
  }

  if (locationType === "hybrid") {
    return {score: 70, reason: "Hybrid role - location mismatch manageable"};
  }

  return {score: 30, reason: "Location mismatch"};
}

/**
 * Calculate demographic match score
 */
function calculateDemographicMatch(cvMetadata, jobSpec) {
  let score = 100;
  let matches = 0;
  let total = 0;

  // Gender match
  if (jobSpec.gender && jobSpec.gender !== "any") {
    total++;
    if (
      cvMetadata?.gender &&
      cvMetadata.gender.toLowerCase() === jobSpec.gender.toLowerCase()
    ) {
      matches++;
    }
  }

  // Race match
  if (jobSpec.race && jobSpec.race !== "any") {
    total++;
    if (
      cvMetadata?.race &&
      cvMetadata.race.toLowerCase() === jobSpec.race.toLowerCase()
    ) {
      matches++;
    }
  }

  // Age match
  if (jobSpec.minAge || jobSpec.maxAge) {
    total++;
    const age = cvMetadata?.age || 0;
    const min = jobSpec.minAge || 0;
    const max = jobSpec.maxAge || 999;

    if (age >= min && age <= max) {
      matches++;
    }
  }

  if (total === 0) {
    return {score: 100, reason: "No demographic preferences specified"};
  }

  score = Math.round((matches / total) * 100);

  return {
    score,
    matches,
    total,
  };
}
