/**
 * Advanced Analytics System
 * Predictive analytics and advanced metrics for recruitment
 *
 * Features:
 * - Time-to-hire metrics
 * - Hiring funnel analysis
 * - Source effectiveness tracking
 * - Diversity metrics
 * - Predictive insights
 * - Custom reports (Enterprise)
 */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {logApiCall} = require("./apiLogger");

// Lazy initialize firestore
const getDb = () => admin.firestore();

/**
 * Calculate time-to-hire metrics
 */
async function calculateTimeToHire(userId, startDate, endDate) {
  const hiredCandidates = await getDb()
      .collection("cvs")
      .where("userId", "==", userId)
      .where("candidateStatus", "==", "hired")
      .get();

  const timesToHire = [];
  const hiresByMonth = {};

  hiredCandidates.docs.forEach((doc) => {
    const data = doc.data();
    const uploadDate = data.uploadedAt?.toDate();
    const statusHistory = data.statusHistory || [];

    // Find when status changed to 'hired'
    const hiredEntry = statusHistory.find((entry) => entry.status === "hired");
    const hiredDate = hiredEntry?.changedAt?.toDate() || data.statusUpdatedAt?.toDate();

    if (uploadDate && hiredDate) {
      const daysDiff = Math.floor((hiredDate - uploadDate) / (1000 * 60 * 60 * 24));
      timesToHire.push(daysDiff);

      const monthKey = hiredDate.toISOString().substring(0, 7); // YYYY-MM
      hiresByMonth[monthKey] = (hiresByMonth[monthKey] || 0) + 1;
    }
  });

  const avgTimeToHire = timesToHire.length > 0 ?
    Math.round(timesToHire.reduce((sum, t) => sum + t, 0) / timesToHire.length) :
    0;

  const medianTimeToHire = timesToHire.length > 0 ?
    timesToHire.sort((a, b) => a - b)[Math.floor(timesToHire.length / 2)] :
    0;

  return {
    averageDays: avgTimeToHire,
    medianDays: medianTimeToHire,
    fastest: timesToHire.length > 0 ? Math.min(...timesToHire) : 0,
    slowest: timesToHire.length > 0 ? Math.max(...timesToHire) : 0,
    totalHires: timesToHire.length,
    hiresByMonth,
  };
}

/**
 * Calculate hiring funnel metrics
 */
async function calculateHiringFunnel(userId) {
  const allCandidates = await getDb()
      .collection("cvs")
      .where("userId", "==", userId)
      .get();

  const funnel = {
    total: 0,
    new: 0,
    reviewing: 0,
    contacted: 0,
    interviewing: 0,
    offered: 0,
    hired: 0,
    rejected: 0,
    withdrawn: 0,
  };

  const conversionRates = {};

  allCandidates.docs.forEach((doc) => {
    const status = doc.data().candidateStatus || "new";
    funnel.total++;
    funnel[status] = (funnel[status] || 0) + 1;
  });

  // Calculate conversion rates
  if (funnel.total > 0) {
    conversionRates.reviewToContact = funnel.reviewing > 0 ?
      Math.round((funnel.contacted / funnel.reviewing) * 100) :
      0;

    conversionRates.contactToInterview = funnel.contacted > 0 ?
      Math.round((funnel.interviewing / funnel.contacted) * 100) :
      0;

    conversionRates.interviewToOffer = funnel.interviewing > 0 ?
      Math.round((funnel.offered / funnel.interviewing) * 100) :
      0;

    conversionRates.offerToHire = funnel.offered > 0 ?
      Math.round((funnel.hired / funnel.offered) * 100) :
      0;

    conversionRates.overallConversion = Math.round((funnel.hired / funnel.total) * 100);
  }

  return {
    funnel,
    conversionRates,
  };
}

/**
 * Calculate source effectiveness
 */
async function calculateSourceEffectiveness(userId) {
  const allCandidates = await getDb()
      .collection("cvs")
      .where("userId", "==", userId)
      .get();

  const sourceMetrics = {};

  allCandidates.docs.forEach((doc) => {
    const data = doc.data();
    const tags = data.tags || [];

    // Find source tag
    const sourceTag = tags.find((t) => t.category === "source");
    const source = sourceTag?.name || "Unknown";

    if (!sourceMetrics[source]) {
      sourceMetrics[source] = {
        total: 0,
        hired: 0,
        interviewed: 0,
        avgMatchScore: 0,
        matchScores: [],
      };
    }

    sourceMetrics[source].total++;

    if (data.candidateStatus === "hired") {
      sourceMetrics[source].hired++;
    }

    if (data.candidateStatus === "interviewing" || data.candidateStatus === "offered" || data.candidateStatus === "hired") {
      sourceMetrics[source].interviewed++;
    }

    if (data.matchScore) {
      sourceMetrics[source].matchScores.push(data.matchScore);
    }
  });

  // Calculate averages and rates
  Object.keys(sourceMetrics).forEach((source) => {
    const metrics = sourceMetrics[source];

    metrics.hireRate = metrics.total > 0 ?
      Math.round((metrics.hired / metrics.total) * 100) :
      0;

    metrics.interviewRate = metrics.total > 0 ?
      Math.round((metrics.interviewed / metrics.total) * 100) :
      0;

    metrics.avgMatchScore = metrics.matchScores.length > 0 ?
      Math.round(metrics.matchScores.reduce((sum, s) => sum + s, 0) / metrics.matchScores.length) :
      0;

    delete metrics.matchScores; // Remove raw data
  });

  // Sort by effectiveness (hire rate)
  const sortedSources = Object.entries(sourceMetrics)
      .sort((a, b) => b[1].hireRate - a[1].hireRate);

  return {
    bySource: sourceMetrics,
    topSources: sortedSources.slice(0, 5).map(([name, metrics]) => ({name, ...metrics})),
  };
}

/**
 * Calculate diversity metrics
 */
async function calculateDiversityMetrics(userId) {
  const allCandidates = await getDb()
      .collection("cvs")
      .where("userId", "==", userId)
      .get();

  const diversity = {
    gender: {male: 0, female: 0, other: 0, unknown: 0},
    race: {},
    ageGroups: {
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "56+": 0,
      "unknown": 0,
    },
  };

  const hiredDiversity = {
    gender: {male: 0, female: 0, other: 0, unknown: 0},
    race: {},
  };

  allCandidates.docs.forEach((doc) => {
    const data = doc.data();
    const metadata = data.metadata || {};
    const isHired = data.candidateStatus === "hired";

    // Gender
    const gender = metadata.gender?.toLowerCase() || "unknown";
    diversity.gender[gender] = (diversity.gender[gender] || 0) + 1;
    if (isHired) {
      hiredDiversity.gender[gender] = (hiredDiversity.gender[gender] || 0) + 1;
    }

    // Race
    if (metadata.race) {
      const race = metadata.race;
      diversity.race[race] = (diversity.race[race] || 0) + 1;
      if (isHired) {
        hiredDiversity.race[race] = (hiredDiversity.race[race] || 0) + 1;
      }
    }

    // Age groups
    if (metadata.age) {
      const age = parseInt(metadata.age);
      let ageGroup = "unknown";

      if (age >= 18 && age <= 25) ageGroup = "18-25";
      else if (age >= 26 && age <= 35) ageGroup = "26-35";
      else if (age >= 36 && age <= 45) ageGroup = "36-45";
      else if (age >= 46 && age <= 55) ageGroup = "46-55";
      else if (age >= 56) ageGroup = "56+";

      diversity.ageGroups[ageGroup]++;
    }
  });

  return {
    pipeline: diversity,
    hired: hiredDiversity,
  };
}

/**
 * Generate predictive insights
 */
async function generatePredictiveInsights(userId) {
  const insights = [];

  // Get historical data
  const timeToHire = await calculateTimeToHire(userId);
  const funnel = await calculateHiringFunnel(userId);
  const sources = await calculateSourceEffectiveness(userId);

  // Predict time to fill based on current pipeline
  if (timeToHire.averageDays > 0 && funnel.funnel.interviewing > 0) {
    const interviewingCount = funnel.funnel.interviewing;
    const hiredCount = Math.max(funnel.funnel.hired, 1);
    const daysToFill = Math.ceil(timeToHire.averageDays * (interviewingCount / hiredCount));
    insights.push({
      type: "time-to-fill",
      title: "Estimated Time to Next Hire",
      value: `${daysToFill} days`,
      confidence: funnel.funnel.hired >= 5 ? "high" : "medium",
      description: `Based on ${funnel.funnel.interviewing} candidates in interview stage`,
    });
  }

  // Best performing source
  if (sources.topSources.length > 0) {
    const topSource = sources.topSources[0];
    insights.push({
      type: "top-source",
      title: "Most Effective Source",
      value: topSource.name,
      confidence: topSource.total >= 10 ? "high" : "medium",
      description: `${topSource.hireRate}% hire rate from ${topSource.total} candidates`,
    });
  }

  // Funnel bottleneck detection
  const rates = funnel.conversionRates;
  const lowestRate = Math.min(
      rates.reviewToContact,
      rates.contactToInterview,
      rates.interviewToOffer,
      rates.offerToHire,
  );

  let bottleneck = "";
  if (lowestRate === rates.reviewToContact) bottleneck = "reviewing to contact";
  else if (lowestRate === rates.contactToInterview) bottleneck = "contact to interview";
  else if (lowestRate === rates.interviewToOffer) bottleneck = "interview to offer";
  else if (lowestRate === rates.offerToHire) bottleneck = "offer to hire";

  if (bottleneck && lowestRate < 50) {
    insights.push({
      type: "bottleneck",
      title: "Hiring Funnel Bottleneck",
      value: bottleneck,
      confidence: "high",
      description: `Only ${lowestRate}% conversion rate - consider improving this stage`,
    });
  }

  return insights;
}

/**
 * Firebase Cloud Function: Get advanced analytics dashboard
 */
exports.getAdvancedAnalytics = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = request.auth.uid;
  const {startDate, endDate} = request.data;

  try {
    // Log API call for billing
    await logApiCall(userId, "getAdvancedAnalytics", "ANALYTICS");

    // Run all analytics in parallel
    const [timeToHire, funnel, sources, diversity, insights] = await Promise.all([
      calculateTimeToHire(userId, startDate, endDate),
      calculateHiringFunnel(userId),
      calculateSourceEffectiveness(userId),
      calculateDiversityMetrics(userId),
      generatePredictiveInsights(userId),
    ]);

    return {
      success: true,
      analytics: {
        timeToHire,
        funnel: funnel.funnel,
        conversionRates: funnel.conversionRates,
        sources,
        diversity,
        insights,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating advanced analytics:", error);
    throw new HttpsError("internal", "Failed to generate analytics");
  }
});

/**
 * Firebase Cloud Function: Generate custom report
 */
exports.generateCustomReport = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {reportType, startDate, endDate, filters} = request.data;
  const userId = request.auth.uid;

  // Log API call for billing
  await logApiCall(userId, "generateCustomReport", "CUSTOM_REPORT");

  // This would be expanded with different report types
  try {
    let reportData = {};

    switch (reportType) {
      case "hiring-summary":
        reportData = await calculateHiringFunnel(userId);
        break;

      case "time-to-hire":
        reportData = await calculateTimeToHire(userId, startDate, endDate);
        break;

      case "source-effectiveness":
        reportData = await calculateSourceEffectiveness(userId);
        break;

      case "diversity-report":
        reportData = await calculateDiversityMetrics(userId);
        break;

      default:
        throw new HttpsError("invalid-argument", "Invalid report type");
    }

    return {
      success: true,
      reportType,
      data: reportData,
      generatedAt: new Date().toISOString(),
      parameters: {startDate, endDate, filters},
    };
  } catch (error) {
    console.error("Error generating report:", error);
    throw new HttpsError("internal", "Failed to generate report");
  }
});

