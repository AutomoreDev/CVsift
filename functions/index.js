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

// Export PayFast functions
exports.createPayment = payfast.createPayment;
exports.payfastWebhook = payfast.payfastWebhook;
exports.getPaymentStatus = payfast.getPaymentStatus;

// Export CV Parser functions
exports.parseCVWithClaude = cvParser.parseCVWithClaude;
exports.retryParsing = cvParser.retryParsing;

// Export CV Matcher functions
exports.calculateMatchScore = cvMatcher.calculateMatchScore;
exports.batchCalculateMatches = cvMatcher.batchCalculateMatches;
