/**
 * CVSift Subscription Plans Configuration
 * Centralized plan definitions and feature access controls
 */

export const PLAN_NAMES = {
  FREE: 'free',
  STARTER: 'starter',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise'
};

export const PLAN_FEATURES = {
  [PLAN_NAMES.FREE]: {
    name: 'Free',
    cvLimit: 10,
    jobSpecLimit: 1, // 1 job spec per month on free plan
    price: 0,
    currency: 'ZAR',
    features: {
      cvUpload: true,
      basicFiltering: true,
      skillsMatch: true,
      locationFilter: true,
      exportCSV: true,
      dataRetentionDays: 7,
      emailSupport: true,
      // Advanced features
      jobSpecCreation: true,
      advancedFiltering: false,
      aiChatbot: false,
      apiAccess: false,
      analytics: true, // Basic analytics
      bulkUpload: false,
      emailNotifications: false,
      teamCollaboration: false,
      customFields: false,
      prioritySupport: false,
      // Analytics Features
      advancedAnalytics: false
    },
    description: [
      'Basic filtering (skills, location)',
      '7-day data retention',
      'Email support',
      'Export to CSV'
    ]
  },

  [PLAN_NAMES.STARTER]: {
    name: 'Starter',
    cvLimit: 50,
    jobSpecLimit: 3, // 3 job specs for starter
    price: 199,
    currency: 'ZAR',
    features: {
      cvUpload: true,
      basicFiltering: true,
      skillsMatch: true,
      locationFilter: true,
      exportCSV: true,
      dataRetentionDays: 30,
      emailSupport: true,
      // Advanced features
      jobSpecCreation: true,
      advancedFiltering: false,
      aiChatbot: false,
      apiAccess: false,
      analytics: true,
      bulkUpload: true,
      emailNotifications: true,
      teamCollaboration: false,
      customFields: false,
      prioritySupport: false,
      // Analytics Features
      advancedAnalytics: false
    },
    description: [
      'Basic + advanced filtering',
      '30-day data retention',
      'Email support',
      'Bulk upload',
      'Job spec creation',
      'Email notifications'
    ]
  },

  [PLAN_NAMES.BASIC]: {
    name: 'Basic',
    cvLimit: 150,
    jobSpecLimit: 10, // 10 job specs for basic
    price: 399,
    currency: 'ZAR',
    features: {
      cvUpload: true,
      basicFiltering: true,
      skillsMatch: true,
      locationFilter: true,
      exportCSV: true,
      dataRetentionDays: 90,
      emailSupport: true,
      // Advanced features
      jobSpecCreation: true,
      advancedFiltering: true,
      aiChatbot: false,
      apiAccess: false,
      analytics: true,
      bulkUpload: true,
      emailNotifications: true,
      teamCollaboration: false,
      customFields: false,
      prioritySupport: false,
      // Analytics Features
      advancedAnalytics: false
    },
    description: [
      'All filtering options',
      '90-day data retention',
      'Priority email support',
      'Advanced export options',
      'Bulk upload',
      'Email notifications'
    ]
  },

  [PLAN_NAMES.PROFESSIONAL]: {
    name: 'Professional',
    cvLimit: 600,
    jobSpecLimit: 30, // 30 job specs for professional
    price: 999,
    currency: 'ZAR',
    features: {
      cvUpload: true,
      basicFiltering: true,
      skillsMatch: true,
      locationFilter: true,
      exportCSV: true,
      dataRetentionDays: 365,
      emailSupport: true,
      // Advanced features
      jobSpecCreation: true,
      advancedFiltering: true,
      aiChatbot: true,
      apiAccess: true,
      analytics: true, // Advanced analytics
      bulkUpload: true,
      emailNotifications: true,
      teamCollaboration: true,
      teamSize: 3,
      customFields: true,
      prioritySupport: true,
      // New Quick Win Features
      advancedAnalytics: true, // Predictive analytics
      eeaCompliance: true // Employment Equity Act compliance tracking
    },
    description: [
      'Everything in Basic',
      'AI Chatbot Assistant',
      'Predictive Analytics',
      'API access',
      '1-year data retention',
      'Team collaboration (3 users)',
      'Custom fields',
      'Priority support'
    ]
  },

  [PLAN_NAMES.BUSINESS]: {
    name: 'Business',
    cvLimit: 1500,
    jobSpecLimit: 100, // 100 job specs for business
    price: 1999,
    currency: 'ZAR',
    features: {
      cvUpload: true,
      basicFiltering: true,
      skillsMatch: true,
      locationFilter: true,
      exportCSV: true,
      dataRetentionDays: 365,
      emailSupport: true,
      // Advanced features
      jobSpecCreation: true,
      advancedFiltering: true,
      aiChatbot: true,
      apiAccess: true,
      analytics: true,
      bulkUpload: true,
      emailNotifications: true,
      teamCollaboration: true,
      teamSize: 10,
      customFields: true,
      prioritySupport: true,
      // Advanced Features
      advancedAnalytics: true,
      customIntegrations: true,
      dedicatedAccountManager: false,
      ssoSecurity: false,
      eeaCompliance: true // Employment Equity Act compliance tracking
    },
    description: [
      'Everything in Professional',
      'Higher volume (1,500 CVs)',
      'Team collaboration (10 users)',
      'Custom integrations',
      'Priority support',
      'Advanced analytics'
    ]
  },

  [PLAN_NAMES.ENTERPRISE]: {
    name: 'Enterprise',
    cvLimit: -1, // Unlimited
    jobSpecLimit: -1, // Unlimited job specs for enterprise
    price: null, // Custom pricing
    currency: 'ZAR',
    features: {
      cvUpload: true,
      basicFiltering: true,
      skillsMatch: true,
      locationFilter: true,
      exportCSV: true,
      dataRetentionDays: -1, // Custom
      emailSupport: true,
      // Advanced features
      jobSpecCreation: true,
      advancedFiltering: true,
      aiChatbot: true,
      apiAccess: true,
      analytics: true, // Advanced analytics
      bulkUpload: true,
      emailNotifications: true,
      teamCollaboration: true,
      teamSize: -1, // Unlimited
      customFields: true,
      prioritySupport: true,
      // Enterprise-only features
      customIntegrations: true,
      dedicatedAccountManager: true,
      ssoSecurity: true,
      whiteLabel: true,
      slaGuarantee: true,
      // New Quick Win Features
      advancedAnalytics: true, // Full predictive + custom reports
      eeaCompliance: true // Employment Equity Act compliance tracking
    },
    description: [
      'Everything in Professional',
      'Custom Analytics Reports',
      'Custom integrations',
      'Dedicated account manager',
      'SSO & advanced security',
      'White-label option',
      'Custom data retention',
      'SLA guarantee',
      'Unlimited users'
    ]
  }
};

/**
 * Check if a user's plan has access to a specific feature
 * @param {string} userPlan - User's current plan (free, basic, professional, enterprise)
 * @param {string} feature - Feature to check access for
 * @returns {boolean} - Whether user has access to the feature
 */
export function hasFeatureAccess(userPlan, feature) {
  if (!userPlan || !PLAN_FEATURES[userPlan]) {
    return PLAN_FEATURES[PLAN_NAMES.FREE].features[feature] || false;
  }

  return PLAN_FEATURES[userPlan].features[feature] || false;
}

/**
 * Get CV upload limit for a plan
 * @param {string} plan - User's plan
 * @returns {number} - CV limit (-1 for unlimited)
 */
export function getCVLimit(plan) {
  if (!plan || !PLAN_FEATURES[plan]) {
    return PLAN_FEATURES[PLAN_NAMES.FREE].cvLimit;
  }
  return PLAN_FEATURES[plan].cvLimit;
}

export function getCVLimitDisplay(plan) {
  const limit = getCVLimit(plan);
  return limit === -1 ? 'Unlimited' : limit.toString();
}

/**
 * Check if plan allows job spec creation
 * @param {string} plan - User's plan
 * @returns {boolean}
 */
export function canCreateJobSpecs(plan) {
  return hasFeatureAccess(plan, 'jobSpecCreation');
}

/**
 * Check if plan allows AI chatbot access
 * @param {string} plan - User's plan
 * @returns {boolean}
 */
export function canAccessChatbot(plan) {
  return hasFeatureAccess(plan, 'aiChatbot');
}

/**
 * @param {string} plan - User's plan
 * @returns {boolean}
 */
export function canAccessAICVSummary(plan) {
  return hasFeatureAccess(plan, 'aiCVSummary');
}

/**
 * @param {string} plan - User's plan
 * @returns {boolean}
 */
export function canAccessEmailTemplates(plan) {
  return hasFeatureAccess(plan, 'emailTemplates');
}

/**
 * @param {string} plan - User's plan
 * @returns {boolean}
 */
export function canAccessInterviewScorecards(plan) {
  return hasFeatureAccess(plan, 'interviewScorecards');
}

/**
 * Check if plan allows Talent Pool
 * @param {string} plan - User's plan
 * @returns {boolean}
 */
export function canAccessTalentPool(plan) {
  return hasFeatureAccess(plan, 'talentPool');
}

/**
 * Check if plan allows Advanced Analytics
 * @param {string} plan - User's plan
 * @returns {boolean}
 */
export function canAccessAdvancedAnalytics(plan) {
  return hasFeatureAccess(plan, 'advancedAnalytics');
}

/**
 * Check if plan allows EEA Compliance tracking
 * @param {string} plan - User's plan
 * @returns {boolean}
 */
export function canAccessEEA(plan) {
  // Master role always has access
  return hasFeatureAccess(plan, 'eeaCompliance');
}

/**
 * Get job spec limit for a plan
 * @param {string} plan - User's plan
 * @returns {number} - Job spec limit (-1 for unlimited, 0 for no access)
 */
export function getJobSpecLimit(plan) {
  if (!plan || !PLAN_FEATURES[plan]) {
    return PLAN_FEATURES[PLAN_NAMES.FREE].jobSpecLimit;
  }
  return PLAN_FEATURES[plan].jobSpecLimit;
}

/**
 * Get job spec limit display text
 * @param {string} plan - User's plan
 * @returns {string} - Display text for job spec limit
 */
export function getJobSpecLimitDisplay(plan) {
  const limit = getJobSpecLimit(plan);
  if (limit === -1) return 'Unlimited';
  if (limit === 0) return 'No access';
  return limit.toString();
}

/**
 * CV Pack Add-ons Configuration
 * One-time purchases to add extra CV processing capacity
 */
export const CV_PACKS = {
  SMALL: {
    id: 'cv_pack_small',
    name: 'Small Pack',
    cvCount: 25,
    price: 99,
    currency: 'ZAR',
    description: 'Add 25 extra CVs to your account',
    popular: false
  },
  MEDIUM: {
    id: 'cv_pack_medium',
    name: 'Medium Pack',
    cvCount: 75,
    price: 249,
    currency: 'ZAR',
    description: 'Add 75 extra CVs to your account',
    savings: '16% savings',
    popular: true
  },
  LARGE: {
    id: 'cv_pack_large',
    name: 'Large Pack',
    cvCount: 200,
    price: 599,
    currency: 'ZAR',
    description: 'Add 200 extra CVs to your account',
    savings: '25% savings',
    popular: false
  },
  JUMBO: {
    id: 'cv_pack_jumbo',
    name: 'Jumbo Pack',
    cvCount: 500,
    price: 1299,
    currency: 'ZAR',
    description: 'Add 500 extra CVs to your account',
    savings: '35% savings',
    popular: false
  }
};

/**
 * Get all available CV packs as an array
 * @returns {Array} Array of CV pack configurations
 */
export function getCVPacks() {
  return Object.values(CV_PACKS);
}

/**
 * Get CV pack by ID
 * @param {string} packId - CV pack identifier
 * @returns {Object|null} CV pack configuration or null if not found
 */
export function getCVPackById(packId) {
  return Object.values(CV_PACKS).find(pack => pack.id === packId) || null;
}

/**
 * Calculate cost per CV for a pack
 * @param {string} packId - CV pack identifier
 * @returns {number} Cost per CV in ZAR
 */
export function getCostPerCV(packId) {
  const pack = getCVPackById(packId);
  if (!pack) return 0;
  return (pack.price / pack.cvCount).toFixed(2);
}
