/**
 * Firebase Analytics Utility
 * Centralized event tracking for CVSift
 *
 * Event Categories:
 * - User Actions: sign_up, login, logout
 * - CV Operations: cv_upload, cv_delete, cv_view, cv_download
 * - Job Specs: job_spec_create, job_spec_match, job_spec_view
 * - Subscription: plan_upgrade, plan_downgrade, payment_initiated, payment_completed
 * - Engagement: page_view, feature_usage, search, filter_applied
 */

import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '../js/firebase-config';
import * as CookieConsent from 'vanilla-cookieconsent';

/**
 * Check if analytics is available
 */
const isAnalyticsAvailable = () => {
  return analytics !== null && analytics !== undefined;
};

/**
 * Check if user has given analytics consent via vanilla-cookieconsent
 */
const hasAnalyticsConsent = () => {
  try {
    const cookie = CookieConsent.getCookie();
    return cookie?.categories?.includes('analytics') || false;
  } catch (error) {
    // If cookie consent hasn't loaded yet, default to denied (privacy-first)
    return false;
  }
};

/**
 * Log a custom event
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (!isAnalyticsAvailable()) {
    console.warn('Analytics not available. Event not logged:', eventName);
    return;
  }

  // Check for user consent before tracking
  if (!hasAnalyticsConsent()) {
    console.log('📊 Analytics consent not granted. Event not logged:', eventName);
    return;
  }

  try {
    logEvent(analytics, eventName, {
      ...eventParams,
      timestamp: new Date().toISOString(),
      app_version: '1.1.0' // Update from version.json if needed
    });
    console.log('📊 Analytics Event:', eventName, eventParams);
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
};

/**
 * Set user ID for analytics
 * @param {string} userId - Firebase Auth user ID
 */
export const setAnalyticsUserId = (userId) => {
  if (!isAnalyticsAvailable()) return;

  try {
    setUserId(analytics, userId);
    console.log('📊 Analytics User ID set:', userId);
  } catch (error) {
    console.error('Error setting user ID:', error);
  }
};

/**
 * Set user properties for segmentation
 * @param {object} properties - User properties
 */
export const setAnalyticsUserProperties = (properties) => {
  if (!isAnalyticsAvailable()) return;

  try {
    setUserProperties(analytics, properties);
    console.log('📊 Analytics User Properties set:', properties);
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};

// ============================================
// USER AUTHENTICATION EVENTS
// ============================================

export const trackSignUp = (method = 'email') => {
  trackEvent('sign_up', {
    method: method // 'email', 'google', etc.
  });
};

export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method: method
  });
};

export const trackLogout = () => {
  trackEvent('logout');
};

// ============================================
// CV OPERATIONS EVENTS
// ============================================

export const trackCVUpload = (fileSize, fileType, parseStatus = 'pending') => {
  trackEvent('cv_upload', {
    file_size_kb: Math.round(fileSize / 1024),
    file_type: fileType,
    parse_status: parseStatus
  });
};

export const trackCVBulkUpload = (count, totalSizeMB) => {
  trackEvent('cv_bulk_upload', {
    cv_count: count,
    total_size_mb: totalSizeMB
  });
};

export const trackCVParsed = (success, duration, cvId) => {
  trackEvent('cv_parsed', {
    success: success,
    duration_seconds: duration,
    cv_id: cvId
  });
};

export const trackCVView = (cvId) => {
  trackEvent('cv_view', {
    cv_id: cvId
  });
};

export const trackCVDownload = (cvId, fileName) => {
  trackEvent('cv_download', {
    cv_id: cvId,
    file_name: fileName
  });
};

export const trackCVDelete = (cvId) => {
  trackEvent('cv_delete', {
    cv_id: cvId
  });
};

export const trackCVCustomFieldUpdate = (cvId, fieldCount) => {
  trackEvent('cv_custom_field_update', {
    cv_id: cvId,
    field_count: fieldCount
  });
};

export const trackCVBulkDelete = (count) => {
  trackEvent('cv_bulk_delete', {
    delete_count: count
  });
};

export const trackCVListFilter = (filterTypes, totalCount, filteredCount) => {
  trackEvent('cv_list_filter', {
    filter_types: filterTypes.join(','),
    total_cvs: totalCount,
    filtered_cvs: filteredCount,
    filter_count: filterTypes.length
  });
};

export const trackCVRetryParsing = (cvId) => {
  trackEvent('cv_retry_parsing', {
    cv_id: cvId
  });
};

export const trackCVSummaryView = (cvId, action) => {
  trackEvent('cv_summary_view', {
    cv_id: cvId,
    action: action // 'show' or 'hide'
  });
};

export const trackLinkedInClick = (cvId) => {
  trackEvent('linkedin_click', {
    cv_id: cvId
  });
};

// ============================================
// JOB SPEC & MATCHING EVENTS
// ============================================

export const trackJobSpecCreate = (skillCount, requiredYearsMin, requiredYearsMax) => {
  trackEvent('job_spec_create', {
    skill_count: skillCount,
    required_years_min: requiredYearsMin,
    required_years_max: requiredYearsMax
  });
};

export const trackJobSpecUpdate = (skillCount, requiredYearsMin, requiredYearsMax) => {
  trackEvent('job_spec_update', {
    skill_count: skillCount,
    required_years_min: requiredYearsMin,
    required_years_max: requiredYearsMax
  });
};

export const trackJobSpecMatch = (jobSpecId, cvCount, avgMatchScore, topMatchScore) => {
  trackEvent('job_spec_match', {
    job_spec_id: jobSpecId,
    cv_count: cvCount,
    avg_match_score: avgMatchScore,
    top_match_score: topMatchScore
  });
};

export const trackMatchScoreCalculated = (jobSpecId, cvId, matchScore, duration) => {
  trackEvent('match_score_calculated', {
    job_spec_id: jobSpecId,
    cv_id: cvId,
    match_score: matchScore,
    duration_ms: duration
  });
};

export const trackJobSpecView = (jobSpecId) => {
  trackEvent('job_spec_view', {
    job_spec_id: jobSpecId
  });
};

export const trackJobSpecDelete = () => {
  trackEvent('job_spec_delete');
};

// ============================================
// SUBSCRIPTION & PAYMENT EVENTS
// ============================================

export const trackPlanView = (planName, planPrice) => {
  trackEvent('plan_view', {
    plan_name: planName,
    plan_price: planPrice,
    currency: 'ZAR'
  });
};

export const trackPlanUpgrade = (fromPlan, toPlan, price) => {
  trackEvent('plan_upgrade', {
    from_plan: fromPlan,
    to_plan: toPlan,
    price: price,
    currency: 'ZAR',
    value: price // For conversion tracking
  });
};

export const trackPlanDowngrade = (fromPlan, toPlan) => {
  trackEvent('plan_downgrade', {
    from_plan: fromPlan,
    to_plan: toPlan
  });
};

export const trackPaymentInitiated = (amount, paymentType, planName) => {
  trackEvent('begin_checkout', { // Standard GA4 event
    value: amount,
    currency: 'ZAR',
    payment_type: paymentType, // 'subscription' or 'cv_pack'
    plan_name: planName
  });
};

export const trackPaymentCompleted = (amount, paymentType, planName, transactionId) => {
  trackEvent('purchase', { // Standard GA4 event
    transaction_id: transactionId,
    value: amount,
    currency: 'ZAR',
    payment_type: paymentType,
    plan_name: planName
  });
};

export const trackCVPackPurchase = (packSize, price, transactionId) => {
  trackEvent('cv_pack_purchase', {
    pack_size: packSize,
    price: price,
    currency: 'ZAR',
    transaction_id: transactionId
  });
};

// ============================================
// USER ENGAGEMENT EVENTS
// ============================================

export const trackPageView = (pageName, pageUrl) => {
  trackEvent('page_view', {
    page_name: pageName,
    page_url: pageUrl
  });
};

export const trackSearch = (searchQuery, resultsCount) => {
  trackEvent('search', { // Standard GA4 event
    search_term: searchQuery,
    results_count: resultsCount
  });
};

export const trackFilterApplied = (filterType, filterValue, resultsCount) => {
  trackEvent('filter_applied', {
    filter_type: filterType, // 'skills', 'location', 'experience', etc.
    filter_value: filterValue,
    results_count: resultsCount
  });
};

export const trackFeatureUsage = (featureName, featureCategory = 'general') => {
  trackEvent('feature_usage', {
    feature_name: featureName,
    feature_category: featureCategory
  });
};

export const trackChatbotMessage = (messageLength, responseTime) => {
  trackEvent('chatbot_message', {
    message_length: messageLength,
    response_time_ms: responseTime
  });
};

export const trackExportData = (exportType, recordCount) => {
  trackEvent('export_data', {
    export_type: exportType, // 'csv', 'pdf', 'json'
    record_count: recordCount
  });
};

// ============================================
// TEAM COLLABORATION EVENTS
// ============================================

export const trackTeamInviteSent = (inviteeEmail, role) => {
  trackEvent('team_invite_sent', {
    role: role
  });
};

export const trackTeamInviteAccepted = (role) => {
  trackEvent('team_invite_accepted', {
    role: role
  });
};

export const trackTeamMemberRemoved = (role) => {
  trackEvent('team_member_removed', {
    role: role
  });
};

// ============================================
// ERROR TRACKING
// ============================================

export const trackError = (errorType, errorMessage, errorLocation) => {
  trackEvent('error_occurred', {
    error_type: errorType, // 'upload_failed', 'parsing_error', 'payment_failed'
    error_message: errorMessage,
    error_location: errorLocation // component/page name
  });
};

export const trackCVParsingError = (cvId, errorMessage) => {
  trackEvent('cv_parsing_error', {
    cv_id: cvId,
    error_message: errorMessage
  });
};

// ============================================
// PERFORMANCE TRACKING
// ============================================

export const trackPerformance = (metricName, value, unit = 'ms') => {
  trackEvent('performance_metric', {
    metric_name: metricName,
    value: value,
    unit: unit
  });
};

// ============================================
// CUSTOM DIMENSIONS (User Properties)
// ============================================

export const updateUserProperties = (userData) => {
  if (!userData) return;

  // Helper function to safely convert dates
  const safeConvertDate = (dateValue) => {
    if (!dateValue) return null;

    try {
      // Handle Firestore Timestamp objects
      if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toISOString().split('T')[0];
      }
      // Handle timestamp in seconds (Firestore server timestamp format)
      if (dateValue?.seconds) {
        return new Date(dateValue.seconds * 1000).toISOString().split('T')[0];
      }
      // Handle ISO strings or Date objects
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error converting date for analytics:', error);
      return null;
    }
  };

  const properties = {
    plan: userData.plan || 'free',
    cv_upload_limit: userData.cvUploadLimit || 0,
    cv_count: userData.cvCount || 0,
    team_member: userData.teamAccess?.isTeamMember ? 'true' : 'false',
    master_account: userData.isMasterAccount ? 'true' : 'false',
    account_created: safeConvertDate(userData.createdAt)
  };

  setAnalyticsUserProperties(properties);
};

// ============================================
// USER LIFECYCLE EVENTS
// ============================================

export const trackOnboarding = (step, completed = false) => {
  trackEvent('onboarding', {
    step: step,
    completed: completed
  });
};

export const trackUserRetention = (daysSinceSignup, sessionCount) => {
  trackEvent('user_retention', {
    days_since_signup: daysSinceSignup,
    session_count: sessionCount
  });
};

// ============================================
// CUSTOM CONVERSIONS
// ============================================

export const trackConversion = (conversionType, value = null) => {
  const params = {
    conversion_type: conversionType // 'first_cv_upload', 'first_match', 'first_purchase'
  };

  if (value !== null) {
    params.value = value;
    params.currency = 'ZAR';
  }

  trackEvent('conversion', params);
};

// Export analytics object for direct use if needed
export { analytics };
