// Load environment variables only in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const admin = require("firebase-admin");

admin.initializeApp();

// Import PayFast functions
const payfast = require("./payfast");

// Import CV Parser functions
const cvParser = require("./cvParser");

// Import CV Matcher functions
const cvMatcher = require("./cvMatcher");

// Import Master Account functions
const masterAccount = require("./masterAccount");

// Import Sub-Master Manager functions
const subMasterManager = require("./subMasterManager");

// Import Master Account Usage functions
const masterAccountUsage = require("./masterAccountUsage");

// Import Chatbot functions
const chatbot = require("./chatbot");

// Import Advanced Analytics functions
const advancedAnalytics = require("./advancedAnalytics");

// Import Team Collaboration functions
const teamCollaboration = require("./teamCollaboration");

// Import Activity Logs functions
const activityLogs = require("./activityLogs");

// Import Job Specs functions
const jobSpecs = require("./jobSpecs");

// Import SMS Tracking functions
const smsTracking = require("./smsTracking");

// Import CV Builder functions
const cvBuilder = require("./cvBuilder");

// Export PayFast functions
exports.createPayment = payfast.createPayment;
exports.payfastWebhook = payfast.payfastWebhook;
exports.getPaymentStatus = payfast.getPaymentStatus;
exports.cancelSubscription = payfast.cancelSubscription;
exports.pauseSubscription = payfast.pauseSubscription;
exports.unpauseSubscription = payfast.unpauseSubscription;
exports.updateSubscriptionPlan = payfast.updateSubscriptionPlan;
exports.deleteUserAccount = payfast.deleteUserAccount;
// Scheduled function removed temporarily - requires App Engine setup
// exports.verifyFailedCancellations = payfast.verifyFailedCancellations;
exports.manualVerifyFailedCancellations = payfast.manualVerifyFailedCancellations;

// Export CV Parser functions
exports.parseCVWithClaude = cvParser.parseCVWithClaude;
exports.retryParsing = cvParser.retryParsing;
exports.deleteCV = cvParser.deleteCV;
exports.updateCVFields = cvParser.updateCVFields;
exports.getTeamCVs = cvParser.getTeamCVs;
exports.getTeamCV = cvParser.getTeamCV;
exports.getCVById = cvParser.getCVById;

// Export CV Matcher functions
exports.calculateMatchScore = cvMatcher.calculateMatchScore;
exports.batchCalculateMatches = cvMatcher.batchCalculateMatches;

// Export Master Account functions
exports.initializeMasterAccount = masterAccount.initializeMasterAccount;
exports.checkMasterStatus = masterAccount.checkMasterStatus;
exports.getAllUsers = masterAccount.getAllUsers;
exports.getAllCVs = masterAccount.getAllCVs;
exports.updateAnyUser = masterAccount.updateAnyUser;

// Export Sub-Master Manager functions
exports.addSubMaster = subMasterManager.addSubMaster;
exports.listSubMasters = subMasterManager.listSubMasters;
exports.toggleSubMasterStatus = subMasterManager.toggleSubMasterStatus;
exports.deleteSubMaster = subMasterManager.deleteSubMaster;
exports.checkPrimaryMaster = subMasterManager.checkPrimaryMaster;

// Export Master Account Usage functions
exports.getSubMasterUsage = masterAccountUsage.getSubMasterUsage;
exports.getSubMasterDetailedUsage = masterAccountUsage.getSubMasterDetailedUsage;

// Export Chatbot functions
exports.chatWithAssistant = chatbot.chatWithAssistant;

// Export Advanced Analytics functions
exports.getAdvancedAnalytics = advancedAnalytics.getAdvancedAnalytics;
exports.generateCustomReport = advancedAnalytics.generateCustomReport;

// Export Team Collaboration functions
exports.getInviteData = teamCollaboration.getInviteData;
exports.sendTeamInvite = teamCollaboration.sendTeamInvite;
exports.acceptTeamInvite = teamCollaboration.acceptTeamInvite;
exports.removeTeamMember = teamCollaboration.removeTeamMember;
exports.getTeamMembers = teamCollaboration.getTeamMembers;
exports.checkTeamAccess = teamCollaboration.checkTeamAccess;
exports.getTeamOwnerData = teamCollaboration.getTeamOwnerData;
exports.updateTeamMemberRole = teamCollaboration.updateTeamMemberRole;

// Export Activity Logs functions
exports.getActivityLogs = activityLogs.getActivityLogs;
exports.logJobSpecCreate = activityLogs.logJobSpecCreate;
exports.logJobSpecUpdate = activityLogs.logJobSpecUpdate;
exports.logJobSpecDelete = activityLogs.logJobSpecDelete;

// Export Job Specs functions
exports.getTeamJobSpecs = jobSpecs.getTeamJobSpecs;
exports.deleteJobSpec = jobSpecs.deleteJobSpec;

// Export SMS Tracking functions
exports.logSmsVerification = smsTracking.logSmsVerification;
exports.getUserSmsUsage = smsTracking.getUserSmsUsage;

// Export CV Builder functions
exports.saveCVBuilderData = cvBuilder.saveCVBuilderData;
exports.getCVBuilderData = cvBuilder.getCVBuilderData;
exports.deleteCVBuilderData = cvBuilder.deleteCVBuilderData;
exports.parseCVForBuilder = cvBuilder.parseCVForBuilder;
