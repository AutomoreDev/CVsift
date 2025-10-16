import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../js/firebase-config';
import { LineChart, Line, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Upload,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

export default function Analytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalUploads: 0,
    uploadsThisMonth: 0,
    uploadsLastMonth: 0,
    totalFilters: 0,
    filtersThisMonth: 0,
    averageUploadSize: 0,
    recentActivity: [],
    uploadTrend: 0,
    filterTrend: 0,
    dailyUploads: []
  });

  useEffect(() => {
    loadAnalytics();
  }, [currentUser]);

  const loadAnalytics = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get current month dates
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      console.log('Loading CVs for user:', currentUser.uid);

      // Get user's CVs
      const cvsQuery = query(
        collection(db, 'cvs'),
        where('userId', '==', currentUser.uid),
        orderBy('uploadedAt', 'desc')
      );

      console.log('Executing Firestore query...');
      const cvsSnapshot = await getDocs(cvsQuery);
      console.log('Query completed. Documents found:', cvsSnapshot.docs.length);

      const cvs = cvsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('CVs data:', cvs);

      // Calculate statistics
      const totalUploads = cvs.length;
      const uploadsThisMonth = cvs.filter(cv => {
        const cvDate = cv.uploadedAt?.toDate();
        return cvDate >= firstDayThisMonth;
      }).length;

      const uploadsLastMonth = cvs.filter(cv => {
        const cvDate = cv.uploadedAt?.toDate();
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
        date: cv.uploadedAt?.toDate(),
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
        const cvDate = cv.uploadedAt?.toDate();
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
        totalFilters: 0, // Will implement when filter functionality is added
        filtersThisMonth: 0,
        averageUploadSize: totalUploads > 0 ? (uploadsThisMonth / totalUploads * 100).toFixed(1) : 0,
        recentActivity,
        uploadTrend,
        filterTrend: 0,
        dailyUploads
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

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = "orange" }) => {
    const colorClasses = {
      orange: "bg-orange-100 text-orange-500",
      purple: "bg-purple-100 text-purple-500",
      lime: "bg-lime-100 text-lime-600",
      blue: "bg-blue-100 text-blue-500"
    };

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
            <Icon size={24} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center text-sm font-medium ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-600 text-sm">{title}</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CV</span>
              </div>
              <span className="text-2xl font-bold">Sift</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <BarChart3 className="mr-3 text-orange-500" size={32} />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Track your CV filtering performance and insights
          </p>
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
            subtitle={`Out of ${currentUser?.userData?.cvUploadLimit || 10} limit`}
            icon={TrendingUp}
            trend={analytics.uploadTrend}
            color="purple"
          />
          <StatCard
            title="Filters Applied"
            value={analytics.filtersThisMonth}
            subtitle="This month"
            icon={Filter}
            trend={analytics.filterTrend}
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="mr-2 text-orange-500" size={20} />
              Upload Trend (Last 30 Days)
            </h2>
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
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No upload data yet</p>
                  <p className="text-sm text-gray-400">Start uploading CVs to see trends</p>
                </div>
              </div>
            )}
          </div>

          {/* Usage Overview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="mr-2 text-orange-500" size={20} />
              Usage Overview
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Monthly Upload Limit</span>
                  <span className="text-sm font-bold text-gray-900">
                    {analytics.uploadsThisMonth} / {currentUser?.userData?.cvUploadLimit || 10}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min((analytics.uploadsThisMonth / (currentUser?.userData?.cvUploadLimit || 10)) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average daily uploads</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(analytics.uploadsThisMonth / new Date().getDate()).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current plan</span>
                    <span className="text-sm font-medium text-orange-500 capitalize">
                      {currentUser?.userData?.plan || 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Growth this month</span>
                    <span className={`text-sm font-medium ${
                      analytics.uploadTrend >= 0 ? 'text-green-600' : 'text-red-600'
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="mr-2 text-orange-500" size={20} />
            Recent Activity
          </h2>

          {analytics.recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No activity yet</p>
              <p className="text-sm text-gray-400">Upload your first CV to see activity here</p>
              <button
                onClick={() => navigate('/upload')}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Upload CV
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Upload className="text-orange-500" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {activity.date ? new Date(activity.date).toLocaleDateString() : 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activity.date ? new Date(activity.date).toLocaleTimeString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
