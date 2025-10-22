import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db } from '../js/firebase-config';
import { canAccessAdvancedAnalytics, PLAN_FEATURES } from '../config/planConfig';
import { LineChart, Line, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Upload,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Target,
  Users,
  Award,
  Zap,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from 'lucide-react';

/**
 * Calculate years of experience from a single experience entry
 */
function calculateExperienceYears(experience) {
  if (!experience.duration && !experience.startDate && !experience.endDate) {
    return 0;
  }

  try {
    // Try to extract years from duration string (e.g., "Jan 2020 - Dec 2022", "2020 - Present")
    const duration = experience.duration || `${experience.startDate || ''} - ${experience.endDate || ''}`;
    const yearMatches = duration.match(/\b(19|20)\d{2}\b/g);

    if (yearMatches && yearMatches.length >= 2) {
      const startYear = parseInt(yearMatches[0]);
      let endYear = parseInt(yearMatches[yearMatches.length - 1]);

      // If duration contains "Present" or "Current", use current year
      if (duration.toLowerCase().includes('present') || duration.toLowerCase().includes('current')) {
        endYear = new Date().getFullYear();
      }

      return Math.max(0, endYear - startYear);
    }

    // If only one year found, assume 1 year
    if (yearMatches && yearMatches.length === 1) {
      return 1;
    }

    return 0;
  } catch (error) {
    console.warn('Error calculating experience years:', error);
    return 0;
  }
}

/**
 * Convert uploadedAt to Date object (handles both Firestore Timestamp and Date)
 */
function toDateObject(uploadedAt) {
  if (!uploadedAt) return new Date(0);
  // If it's already a Date object, return it
  if (uploadedAt instanceof Date) return uploadedAt;
  // If it's a Firestore Timestamp with toDate method
  if (uploadedAt.toDate && typeof uploadedAt.toDate === 'function') {
    return uploadedAt.toDate();
  }
  // If it's a Firestore Timestamp serialized with _seconds
  if (uploadedAt._seconds) {
    return new Date(uploadedAt._seconds * 1000);
  }
  // Try to parse as date string
  const date = new Date(uploadedAt);
  return isNaN(date.getTime()) ? new Date(0) : date;
}

export default function Analytics() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // const [advancedLoading, setAdvancedLoading] = useState(false); // Removed with advanced analytics
  const [analytics, setAnalytics] = useState({
    totalUploads: 0,
    uploadsThisMonth: 0,
    uploadsLastMonth: 0,
    monthlySpend: 0,
    monthlySpendBreakdown: { subscription: 0, cvPacks: 0 },
    averageUploadSize: 0,
    recentActivity: [],
    uploadTrend: 0,
    spendTrend: 0,
    dailyUploads: [],
    // New analytics
    topSkills: [],
    experienceLevels: { junior: 0, mid: 0, senior: 0, unknown: 0 },
    topLocations: [],
    averageCompleteness: 0,
    completenessDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    educationDistribution: [],
    parsingSuccessRate: 0,
    parsedCVs: 0,
    failedCVs: 0
  });
  // Advanced analytics removed - requires candidateStatus tracking implementation
  // const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  // const [dateRange, setDateRange] = useState({
  //   startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
  //   endDate: new Date().toISOString().split('T')[0]
  // });

  useEffect(() => {
    console.log('Analytics useEffect triggered');
    console.log('currentUser:', currentUser?.uid);
    console.log('userData:', userData);
    console.log('userData.teamAccess:', userData?.teamAccess);

    if (!currentUser || !userData) {
      console.log('Skipping analytics load - missing currentUser or userData');
      return;
    }

    console.log('Loading analytics...');
    loadAnalytics();
    // Advanced analytics loading removed
    // if (canAccessAdvancedAnalytics(userData?.plan)) {
    //   loadAnalytics();
    // }
  }, [currentUser, userData]);

  const loadAnalytics = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get current month dates
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Determine effective user ID (team owner if team member, otherwise current user)
      const teamAccess = userData?.teamAccess;
      const effectiveUserId = teamAccess?.isTeamMember && teamAccess?.teamOwnerId
        ? teamAccess.teamOwnerId
        : currentUser.uid;

      console.log('Loading CVs for user:', effectiveUserId, '(Team member:', teamAccess?.isTeamMember, ')');

      // For team members, use Cloud Function to fetch CVs (bypasses security rules)
      let cvs = [];

      if (teamAccess?.isTeamMember && teamAccess?.teamOwnerId) {
        console.log('Fetching team CVs via Cloud Function');
        const functions = getFunctions();
        const getTeamCVs = httpsCallable(functions, 'getTeamCVs');

        const result = await getTeamCVs();

        if (result.data.success) {
          cvs = result.data.cvs.map(cv => ({
            ...cv,
            id: cv.id,
            uploadedAt: toDateObject(cv.uploadedAt)
          }));
          console.log('Team CVs fetched:', cvs.length);
        }
      } else {
        // Owner or solo user - fetch their own CVs directly
        console.log('Current user ID:', currentUser.uid);

        const cvsQuery = query(
          collection(db, 'cvs'),
          where('userId', '==', currentUser.uid)
          // Removed orderBy to avoid index issues - will sort in memory
        );

        console.log('Executing Firestore query...');
        const cvsSnapshot = await getDocs(cvsQuery);
        console.log('Query completed. Documents found:', cvsSnapshot.docs.length);

        cvs = cvsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
      }

      // Sort CVs by uploadedAt
      cvs = cvs.sort((a, b) => {
        const dateA = toDateObject(a.uploadedAt);
        const dateB = toDateObject(b.uploadedAt);
        return dateB - dateA;
      });

      if (cvs.length === 0) {
        console.warn('⚠️ No CVs found for user:', effectiveUserId);
        console.warn('Check Firestore console to verify CVs exist with correct userId');
      }

      console.log('CVs data:', cvs);
      console.log('Sample CV metadata:', cvs[0]?.metadata);
      console.log('Sample CV fields:', Object.keys(cvs[0] || {}));

      // ======= NEW ANALYTICS CALCULATIONS =======

      // Calculate basic statistics FIRST (needed for all calculations below)
      const totalUploads = cvs.length;
      console.log('Total uploads:', totalUploads);

      // 1. SKILLS ANALYTICS - Most common skills across all CVs
      const skillsMap = {};
      cvs.forEach(cv => {
        const skills = cv.metadata?.skills || [];
        if (skills.length > 0) {
          console.log('CV has skills:', skills);
        }
        skills.forEach(skill => {
          skillsMap[skill] = (skillsMap[skill] || 0) + 1;
        });
      });
      console.log('Skills map:', skillsMap);
      const topSkills = Object.entries(skillsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({
          skill,
          count,
          percentage: totalUploads > 0 ? ((count / totalUploads) * 100).toFixed(1) : 0
        }));

      // 2. EXPERIENCE LEVEL DISTRIBUTION
      const experienceLevels = { junior: 0, mid: 0, senior: 0, unknown: 0 };
      cvs.forEach(cv => {
        const experiences = cv.metadata?.experience || [];
        if (experiences.length === 0) {
          experienceLevels.unknown++;
        } else {
          // Calculate total years of experience from all positions
          let totalYears = 0;
          experiences.forEach(exp => {
            const years = calculateExperienceYears(exp);
            totalYears += years;
          });

          // If we couldn't calculate years, fall back to position count estimate
          if (totalYears === 0) {
            totalYears = experiences.length * 1.5; // Rough estimate: 1.5 years per position
          }

          // Categorize based on total years: 0-2 (junior), 3-5 (mid), 6+ (senior)
          if (totalYears <= 2) {
            experienceLevels.junior++;
          } else if (totalYears >= 3 && totalYears <= 5) {
            experienceLevels.mid++;
          } else if (totalYears >= 6) {
            experienceLevels.senior++;
          }
        }
      });

      // 3. LOCATION DISTRIBUTION
      const locationMap = {};
      cvs.forEach(cv => {
        const location = cv.metadata?.location || 'Unknown';
        locationMap[location] = (locationMap[location] || 0) + 1;
      });
      const topLocations = Object.entries(locationMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([location, count]) => ({
          location,
          count,
          percentage: totalUploads > 0 ? ((count / totalUploads) * 100).toFixed(1) : 0
        }));

      // 4. CV COMPLETENESS ANALYSIS
      let totalCompletenessScore = 0;
      const completenessDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
      cvs.forEach(cv => {
        const metadata = cv.metadata || {};
        let score = 0;
        if (metadata.name) score += 15;
        if (metadata.email) score += 15;
        if (metadata.phone) score += 10;
        if (metadata.location) score += 10;
        if (metadata.skills?.length > 0) score += 20;
        if (metadata.experience?.length > 0) score += 20;
        if (metadata.education?.length > 0) score += 10;

        totalCompletenessScore += score;

        if (score >= 90) completenessDistribution.excellent++;
        else if (score >= 70) completenessDistribution.good++;
        else if (score >= 50) completenessDistribution.fair++;
        else completenessDistribution.poor++;
      });
      const averageCompleteness = totalUploads > 0 ? (totalCompletenessScore / totalUploads).toFixed(1) : 0;

      // NOTE: Candidate Status Pipeline removed - requires candidateStatus field implementation

      // 6. EDUCATION LEVEL DISTRIBUTION
      const educationMap = {};
      cvs.forEach(cv => {
        const education = cv.metadata?.education || [];
        if (education.length === 0) {
          educationMap['Not Specified'] = (educationMap['Not Specified'] || 0) + 1;
        } else {
          const highestDegree = education[0]?.degree || 'Unknown';
          educationMap[highestDegree] = (educationMap[highestDegree] || 0) + 1;
        }
      });
      const educationDistribution = Object.entries(educationMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([degree, count]) => ({
          degree,
          count,
          percentage: totalUploads > 0 ? ((count / totalUploads) * 100).toFixed(1) : 0
        }));

      // 7. PARSING SUCCESS RATE
      const parsedCVs = cvs.filter(cv => cv.parsed === true).length;
      const failedCVs = cvs.filter(cv => cv.status === 'error').length;
      const parsingSuccessRate = totalUploads > 0 ? ((parsedCVs / totalUploads) * 100).toFixed(1) : 0;
      const uploadsThisMonth = cvs.filter(cv => {
        const cvDate = toDateObject(cv.uploadedAt);
        return cvDate >= firstDayThisMonth;
      }).length;

      // 8. MONTHLY SPEND CALCULATION
      let monthlySpend = 0;
      let subscriptionCost = 0;
      let cvPacksCost = 0;

      // Get subscription cost from user's current plan
      const userPlan = userData?.plan || 'free';
      if (PLAN_FEATURES[userPlan] && PLAN_FEATURES[userPlan].price) {
        subscriptionCost = PLAN_FEATURES[userPlan].price;
      }

      // Get CV pack purchases for this month from payments collection
      try {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('userId', '==', effectiveUserId),
          where('status', '==', 'complete'),
          where('purchaseType', '==', 'cv_pack')
        );

        const paymentsSnapshot = await getDocs(paymentsQuery);

        paymentsSnapshot.docs.forEach(doc => {
          const payment = doc.data();
          const paymentDate = payment.completedAt?.toDate() || payment.createdAt?.toDate();

          if (paymentDate && paymentDate >= firstDayThisMonth) {
            cvPacksCost += parseFloat(payment.amount) || 0;
          }
        });
      } catch (error) {
        console.log('Could not fetch CV pack purchases:', error);
      }

      monthlySpend = subscriptionCost + cvPacksCost;

      // Calculate spend trend (compare to last month)
      const lastMonthSpend = subscriptionCost; // Simplified - could track historical purchases
      const spendTrend = lastMonthSpend > 0
        ? ((monthlySpend - lastMonthSpend) / lastMonthSpend * 100).toFixed(1)
        : monthlySpend > 0 ? 100 : 0;

      const uploadsLastMonth = cvs.filter(cv => {
        const cvDate = toDateObject(cv.uploadedAt);
        return cvDate >= firstDayLastMonth && cvDate <= lastDayLastMonth;
      }).length;

      // Calculate trend
      const uploadTrend = uploadsLastMonth > 0
        ? ((uploadsThisMonth - uploadsLastMonth) / uploadsLastMonth * 100).toFixed(1)
        : uploadsThisMonth > 0 ? 100 : 0;

      // Get recent activity (last 10 CVs)
      const recentActivity = cvs.slice(0, 10).map(cv => ({
        id: cv.id,
        name: cv.fileName || 'Unknown',
        date: toDateObject(cv.uploadedAt),
        action: 'Uploaded CV'
      }));

      // Calculate daily uploads for the last 30 days
      const dailyUploadMap = {};
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Initialize all days with 0
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyUploadMap[dateKey] = 0;
      }

      // Count uploads per day
      cvs.forEach(cv => {
        const cvDate = toDateObject(cv.uploadedAt);
        if (cvDate && cvDate >= thirtyDaysAgo) {
          const dateKey = cvDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (dailyUploadMap.hasOwnProperty(dateKey)) {
            dailyUploadMap[dateKey]++;
          }
        }
      });

      // Convert to array for chart
      const dailyUploads = Object.entries(dailyUploadMap).map(([date, count]) => ({
        date,
        uploads: count
      }));

      setAnalytics({
        totalUploads,
        uploadsThisMonth,
        uploadsLastMonth,
        monthlySpend,
        monthlySpendBreakdown: { subscription: subscriptionCost, cvPacks: cvPacksCost },
        averageUploadSize: totalUploads > 0 ? (uploadsThisMonth / totalUploads * 100).toFixed(1) : 0,
        recentActivity,
        uploadTrend,
        spendTrend,
        dailyUploads,
        // New analytics data
        topSkills,
        experienceLevels,
        topLocations,
        averageCompleteness,
        completenessDistribution,
        educationDistribution,
        parsingSuccessRate,
        parsedCVs,
        failedCVs
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);

      // Check if it's a missing index error
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.error('FIRESTORE INDEX ERROR: You need to create a composite index.');
        console.error('Click the link in the error below or create an index for:');
        console.error('Collection: cvs');
        console.error('Fields: userId (Ascending), uploadedAt (Descending)');
      }

      setLoading(false);
    }
  };

  // Advanced analytics function removed - requires candidateStatus tracking
  // const loadAdvancedAnalytics = async () => {
  //   if (!currentUser) return;
  //   try {
  //     setAdvancedLoading(true);
  //     console.log('Loading advanced analytics...');
  //     const getAdvancedAnalytics = httpsCallable(functions, 'getAdvancedAnalytics');
  //     const result = await getAdvancedAnalytics({
  //       startDate: dateRange.startDate,
  //       endDate: dateRange.endDate
  //     });
  //     console.log('Advanced analytics loaded:', result.data);
  //     setAdvancedAnalytics(result.data.analytics);
  //     setAdvancedLoading(false);
  //   } catch (error) {
  //     console.error('Error loading advanced analytics:', error);
  //     setAdvancedLoading(false);
  //   }
  // };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = "orange" }) => {
    const colorClasses = {
      orange: "from-orange-500 to-orange-600",
      purple: "from-purple-500 to-purple-600",
      lime: "from-lime-500 to-lime-600",
      blue: "from-blue-500 to-blue-600"
    };

    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 group">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
            <Icon size={24} className="text-white" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full ${
              trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <h3 className="text-4xl font-bold text-gray-900 mb-2">{value}</h3>
        <p className="text-gray-700 font-semibold text-sm">{title}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-orange-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-purple-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all hover:scale-105"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">Dashboard</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
                <p className="text-xs text-gray-600">Performance Insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title Banner */}
        <div className="mb-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <BarChart3 size={28} />
                </div>
                Analytics Dashboard
              </h1>
              <p className="text-orange-100 text-lg">
                Track your CV filtering performance and gain actionable insights
              </p>
            </div>
            <div className="hidden lg:block">
              <Activity className="w-24 h-24 text-white/20" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total CVs Uploaded"
            value={analytics.totalUploads}
            subtitle="All time"
            icon={Upload}
            color="orange"
          />
          <StatCard
            title="Uploads This Month"
            value={analytics.uploadsThisMonth}
            subtitle={
              currentUser?.userData?.plan === 'enterprise' || currentUser?.userData?.cvUploadLimit === -1
                ? 'Unlimited uploads'
                : `Out of ${currentUser?.userData?.cvUploadLimit || 10} limit`
            }
            icon={TrendingUp}
            trend={analytics.uploadTrend}
            color="purple"
          />
          <StatCard
            title="Monthly Spend"
            value={`R${analytics.monthlySpend.toFixed(0)}`}
            subtitle={`Subscription: R${analytics.monthlySpendBreakdown.subscription} | Packs: R${analytics.monthlySpendBreakdown.cvPacks}`}
            icon={BarChart3}
            trend={analytics.spendTrend}
            color="lime"
          />
          <StatCard
            title="Last Month"
            value={analytics.uploadsLastMonth}
            subtitle="Previous period"
            icon={Calendar}
            color="blue"
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Upload Trend Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-white" size={16} />
                </div>
                Upload Trend
              </h2>
              <span className="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">Last 30 Days</span>
            </div>
            {analytics.dailyUploads.length > 0 && analytics.dailyUploads.some(d => d.uploads > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.dailyUploads}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="uploads"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
                    <PieChart className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-700 font-semibold mb-2">No upload data yet</p>
                  <p className="text-sm text-gray-500">Start uploading CVs to see trends</p>
                </div>
              </div>
            )}
          </div>

          {/* Usage Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Activity className="text-white" size={16} />
                </div>
                Usage Overview
              </h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-bold text-gray-900">Monthly Upload Limit</span>
                  <span className="text-lg font-bold text-orange-600">
                    {currentUser?.userData?.plan === 'enterprise' || currentUser?.userData?.cvUploadLimit === -1
                      ? `${analytics.uploadsThisMonth} (Unlimited)`
                      : `${analytics.uploadsThisMonth} / ${currentUser?.userData?.cvUploadLimit || 10}`
                    }
                  </span>
                </div>
                {(currentUser?.userData?.plan !== 'enterprise' && currentUser?.userData?.cvUploadLimit !== -1) && (
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full transition-all shadow-sm flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.min((analytics.uploadsThisMonth / (currentUser?.userData?.cvUploadLimit || 10)) * 100, 100)}%`
                      }}
                    >
                      {analytics.uploadsThisMonth > 0 && (
                        <span className="text-xs text-white font-bold">
                          {Math.round((analytics.uploadsThisMonth / (currentUser?.userData?.cvUploadLimit || 10)) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                    <Activity className="text-blue-600" size={12} />
                  </div>
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">Average daily uploads</span>
                    <span className="text-sm font-bold text-gray-900 px-3 py-1 bg-white rounded-lg shadow-sm">
                      {(analytics.uploadsThisMonth / new Date().getDate()).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">Current plan</span>
                    <span className="text-sm font-bold text-orange-600 capitalize px-3 py-1 bg-orange-50 rounded-lg">
                      {currentUser?.userData?.plan || 'Free'}
                    </span>
                  </div>
                  {(currentUser?.userData?.cvPackBalance || 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                      <span className="text-sm font-medium text-gray-700">CV Pack Balance</span>
                      <span className="text-sm font-bold text-purple-600 px-3 py-1 bg-purple-100 rounded-lg">
                        +{currentUser?.userData?.cvPackBalance || 0} Bonus CVs
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">Growth this month</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                      analytics.uploadTrend >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                    }`}>
                      {analytics.uploadTrend >= 0 ? '+' : ''}{analytics.uploadTrend}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Activity className="text-white" size={16} />
              </div>
              Recent Activity
            </h2>
            <span className="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">Last 10 Actions</span>
          </div>

          {analytics.recentActivity.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-700 font-semibold mb-2">No activity yet</p>
              <p className="text-sm text-gray-500 mb-6">Upload your first CV to see activity here</p>
              <button
                onClick={() => navigate('/upload')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105"
              >
                Upload CV
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-orange-50/50 rounded-xl hover:from-gray-100 hover:to-orange-100/50 transition-all border border-gray-100 hover:border-orange-200 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Upload className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600 truncate max-w-md">{activity.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {activity.date ? new Date(activity.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.date ? new Date(activity.date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NEW ANALYTICS SECTIONS */}

        {/* Skills & Experience Row */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {/* Top Skills */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
                  <Award className="text-white" size={16} />
                </div>
                Top Skills in Database
              </h2>
              <span className="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">
                Top 10
              </span>
            </div>
            {analytics.topSkills.length > 0 ? (
              <div className="space-y-3">
                {analytics.topSkills.map((skill, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{skill.skill}</span>
                      <span className="text-sm font-bold text-lime-600">{skill.count} CVs ({skill.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-lime-500 to-lime-600 h-2.5 rounded-full transition-all group-hover:scale-105"
                        style={{ width: `${skill.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-600">No skills data available yet</p>
              </div>
            )}
          </div>

          {/* Experience Levels */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="text-white" size={16} />
                </div>
                Experience Level Distribution
              </h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-green-700 mb-1">{analytics.experienceLevels.junior}</div>
                  <p className="text-sm font-semibold text-gray-700">Junior Level</p>
                  <p className="text-xs text-gray-600 mt-1">0-2 years exp.</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-blue-700 mb-1">{analytics.experienceLevels.mid}</div>
                  <p className="text-sm font-semibold text-gray-700">Mid Level</p>
                  <p className="text-xs text-gray-600 mt-1">3-5 years exp.</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-purple-700 mb-1">{analytics.experienceLevels.senior}</div>
                  <p className="text-sm font-semibold text-gray-700">Senior Level</p>
                  <p className="text-xs text-gray-600 mt-1">6+ years exp.</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-gray-700 mb-1">{analytics.experienceLevels.unknown}</div>
                  <p className="text-sm font-semibold text-gray-700">Unknown</p>
                  <p className="text-xs text-gray-600 mt-1">No exp. listed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Education Row */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Top Locations */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Target className="text-white" size={16} />
                </div>
                Candidate Locations
              </h2>
              <span className="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">
                Top 8
              </span>
            </div>
            {analytics.topLocations.length > 0 ? (
              <div className="space-y-3">
                {analytics.topLocations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl hover:from-gray-100 hover:to-orange-100 transition-all border border-gray-100">
                    <span className="text-sm font-medium text-gray-900">{location.location}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                          style={{ width: `${location.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-orange-600 min-w-[60px] text-right">
                        {location.count} ({location.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-600">No location data available yet</p>
              </div>
            )}
          </div>

          {/* Education Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Award className="text-white" size={16} />
                </div>
                Education Levels
              </h2>
            </div>
            {analytics.educationDistribution.length > 0 ? (
              <div className="space-y-3">
                {analytics.educationDistribution.map((edu, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-gray-100 hover:to-blue-100 transition-all border border-gray-100">
                    <span className="text-sm font-medium text-gray-900">{edu.degree}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${edu.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-blue-600 min-w-[60px] text-right">
                        {edu.count} ({edu.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-600">No education data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* CV Data Quality */}
        <div className="mt-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-white" size={16} />
                </div>
                CV Data Quality
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700">Average Completeness Score</span>
                    <span className="text-3xl font-bold text-lime-600">{analytics.averageCompleteness}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-lime-500 to-lime-600 h-4 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${analytics.averageCompleteness}%` }}
                    >
                      {analytics.averageCompleteness > 10 && (
                        <span className="text-xs text-white font-bold">{analytics.averageCompleteness}%</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Parsing Success Rate</span>
                    <span className="text-sm font-bold text-green-600">{analytics.parsingSuccessRate}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.parsedCVs} successfully parsed, {analytics.failedCVs} failed
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={16} />
                    <span className="text-sm font-medium text-gray-900">Excellent (90%+)</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">{analytics.completenessDistribution.excellent} CVs</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-blue-600" size={16} />
                    <span className="text-sm font-medium text-gray-900">Good (70-89%)</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{analytics.completenessDistribution.good} CVs</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-yellow-600" size={16} />
                    <span className="text-sm font-medium text-gray-900">Fair (50-69%)</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-700">{analytics.completenessDistribution.fair} CVs</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-red-600" size={16} />
                    <span className="text-sm font-medium text-gray-900">Poor (&lt;50%)</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">{analytics.completenessDistribution.poor} CVs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics Section - Removed (requires candidateStatus tracking) */}
        {false && canAccessAdvancedAnalytics(userData?.plan) && (
          <div className="mt-8 space-y-6">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 shadow-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <Sparkles size={24} />
                    </div>
                    Advanced Analytics
                  </h2>
                  <p className="text-purple-100">
                    Deep insights into your recruitment performance
                  </p>
                </div>
                <button
                  onClick={loadAdvancedAnalytics}
                  disabled={advancedLoading}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Zap size={16} />
                  {advancedLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {advancedLoading ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center">
                <Activity className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
                <p className="text-gray-600">Loading advanced analytics...</p>
              </div>
            ) : advancedAnalytics ? (
              <>
                {/* Time to Hire Metrics */}
                {advancedAnalytics.timeToHire && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Clock className="text-white" size={16} />
                        </div>
                        Time to Hire
                      </h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                        <div className="text-3xl font-bold text-purple-700 mb-2">
                          {advancedAnalytics.timeToHire.averageDays || 0} days
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Average Time to Hire</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                        <div className="text-3xl font-bold text-blue-700 mb-2">
                          {advancedAnalytics.timeToHire.medianDays || 0} days
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Median Time to Hire</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                        <div className="text-3xl font-bold text-green-700 mb-2">
                          {advancedAnalytics.timeToHire.totalHires || 0}
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Total Hires</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hiring Funnel */}
                {advancedAnalytics.funnel && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Target className="text-white" size={16} />
                        </div>
                        Hiring Funnel
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {advancedAnalytics.funnel.stages && advancedAnalytics.funnel.stages.map((stage, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-900 capitalize">{stage.status}</span>
                            <span className="text-sm font-bold text-gray-700">{stage.count} candidates</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-8 shadow-inner overflow-hidden">
                            <div
                              className={`h-8 rounded-full transition-all flex items-center px-3 ${
                                index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                index === 1 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                'bg-gradient-to-r from-green-500 to-green-600'
                              }`}
                              style={{
                                width: `${stage.percentage}%`
                              }}
                            >
                              <span className="text-xs text-white font-bold">{stage.percentage}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {advancedAnalytics.conversionRates && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Conversion Rates</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {Object.entries(advancedAnalytics.conversionRates).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-sm font-bold text-purple-600">{value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Source Effectiveness */}
                {advancedAnalytics.sources && advancedAnalytics.sources.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
                          <Users className="text-white" size={16} />
                        </div>
                        Source Effectiveness
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {advancedAnalytics.sources.map((source, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-lime-50/50 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-gray-900">{source.source}</h4>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-semibold text-gray-700">
                                {source.totalCandidates} candidates
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {source.hires} hired
                              </span>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <div className="text-center p-2 bg-white rounded-lg">
                              <div className="text-lg font-bold text-purple-600">{source.conversionRate}%</div>
                              <div className="text-xs text-gray-600">Conversion</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                              <div className="text-lg font-bold text-blue-600">{source.avgTimeToHire} days</div>
                              <div className="text-xs text-gray-600">Avg Time</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                              <div className="text-lg font-bold text-green-600">
                                {source.qualityScore !== undefined ? source.qualityScore.toFixed(1) : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-600">Quality Score</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diversity Metrics */}
                {advancedAnalytics.diversity && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Users className="text-white" size={16} />
                        </div>
                        Diversity Metrics
                      </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Gender Distribution */}
                      {advancedAnalytics.diversity.genderDistribution && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-3">Gender Distribution</h4>
                          <div className="space-y-2">
                            {Object.entries(advancedAnalytics.diversity.genderDistribution).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
                                <span className="text-sm font-bold text-blue-600">{value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Age Distribution */}
                      {advancedAnalytics.diversity.ageDistribution && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-3">Age Distribution</h4>
                          <div className="space-y-2">
                            {Object.entries(advancedAnalytics.diversity.ageDistribution).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">{key}</span>
                                <span className="text-sm font-bold text-purple-600">{value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Predictive Insights */}
                {advancedAnalytics.insights && advancedAnalytics.insights.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Zap className="text-white" size={16} />
                        </div>
                        Predictive Insights
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {advancedAnalytics.insights.map((insight, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border-l-4 ${
                            insight.type === 'success' ? 'bg-green-50 border-green-500' :
                            insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                            insight.type === 'info' ? 'bg-blue-50 border-blue-500' :
                            'bg-red-50 border-red-500'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {insight.type === 'success' && <CheckCircle className="text-green-600" size={20} />}
                              {insight.type === 'warning' && <AlertTriangle className="text-yellow-600" size={20} />}
                              {insight.type === 'info' && <Sparkles className="text-blue-600" size={20} />}
                              {insight.type === 'alert' && <AlertTriangle className="text-red-600" size={20} />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">{insight.title}</p>
                              <p className="text-sm text-gray-700">{insight.description}</p>
                              {insight.recommendation && (
                                <p className="text-sm text-gray-600 mt-2 italic">
                                  💡 {insight.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-purple-500" />
                </div>
                <p className="text-gray-700 font-semibold mb-2">Advanced Analytics Available</p>
                <p className="text-sm text-gray-500 mb-6">
                  Click refresh to load your advanced recruitment insights
                </p>
                <button
                  onClick={loadAdvancedAnalytics}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:scale-105"
                >
                  Load Advanced Analytics
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
