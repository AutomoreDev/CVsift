import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../js/firebase-config';
import { Upload, Filter, BarChart3, LogOut, User, Settings, CreditCard, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, ChevronDown, Briefcase } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadRecentActivity();
  }, [currentUser]);

  const loadRecentActivity = async () => {
    if (!currentUser) return;

    try {
      setLoadingActivity(true);

      // Get recent CVs (last 5)
      const cvsQuery = query(
        collection(db, 'cvs'),
        where('userId', '==', currentUser.uid),
        orderBy('uploadedAt', 'desc'),
        limit(5)
      );

      const cvsSnapshot = await getDocs(cvsQuery);
      const cvs = cvsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRecentActivity(cvs);
      setLoadingActivity(false);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setLoadingActivity(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle className="text-green-500" size={18} />;
    if (status === 'error') return <AlertCircle className="text-red-500" size={18} />;
    return <Clock className="text-orange-500" size={18} />;
  };

  const getStatusText = (status) => {
    if (status === 'completed') return 'Parsed successfully';
    if (status === 'error') return 'Parsing failed';
    return 'Processing...';
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Unknown';

    const timestamp = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Calculate usage percentage
  const usagePercentage = ((currentUser?.userData?.cvUploadsThisMonth || 0) / (currentUser?.userData?.cvUploadLimit || 10)) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CV</span>
              </div>
              <span className="text-2xl font-bold">Sift</span>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                </span>
                <ChevronDown size={16} className="text-gray-600" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Account Settings</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser?.displayName?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your CV filtering today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* CV Uploads Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Upload className="text-orange-500" size={24} />
              </div>
              <span className="text-sm font-medium text-gray-500">This Month</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {currentUser?.userData?.cvUploadsThisMonth || 0}
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              CVs Uploaded / {currentUser?.userData?.cvUploadLimit || 10}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {usagePercentage >= 100 ? 'Limit reached' : `${Math.round(100 - usagePercentage)}% remaining`}
            </p>
          </div>

          {/* Filters Applied Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Filter className="text-purple-500" size={24} />
              </div>
              <span className="text-sm font-medium text-gray-500">All Time</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-gray-600 text-sm">Filters Applied</p>
            <div className="mt-4 flex items-center text-xs text-green-600">
              <TrendingUp size={14} className="mr-1" />
              <span>Ready to start filtering</span>
            </div>
          </div>

          {/* Current Plan Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center">
                <CreditCard className="text-lime-600" size={24} />
              </div>
              <span className="text-sm font-medium text-gray-500">Current Plan</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1 capitalize">
              {currentUser?.userData?.plan || 'Free'}
            </h3>
            <p className="text-gray-600 text-sm mb-3">Active Subscription</p>
            <button 
              onClick={() => navigate('/pricing')}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              Upgrade Plan →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center space-x-4 p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-md transition-all hover:-translate-y-1 border-2 border-orange-200"
            >
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Upload className="text-white" size={28} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 mb-1">Upload CVs</h3>
                <p className="text-sm text-gray-600">Add new candidates</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/cvs')}
              className="flex items-center space-x-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all hover:-translate-y-1 border-2 border-purple-200"
            >
              <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Filter className="text-white" size={28} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 mb-1">View CVs</h3>
                <p className="text-sm text-gray-600">Browse & filter</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/job-specs')}
              className="flex items-center space-x-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all hover:-translate-y-1 border-2 border-blue-200"
            >
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="text-white" size={28} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 mb-1">Job Specs</h3>
                <p className="text-sm text-gray-600">Match CVs</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center space-x-4 p-6 bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl hover:shadow-md transition-all hover:-translate-y-1 border-2 border-lime-200"
            >
              <div className="w-14 h-14 bg-lime-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="text-white" size={28} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 mb-1">View Analytics</h3>
                <p className="text-sm text-gray-600">See insights</p>
              </div>
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              <button
                onClick={() => navigate('/cvs')}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                View All
              </button>
            </div>

            {loadingActivity ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading activity...</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No CVs uploaded yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start by uploading your first batch of CVs to begin filtering and finding the perfect candidates
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-orange-500/30"
                >
                  Upload Your First CV
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((cv) => (
                  <div
                    key={cv.id}
                    onClick={() => navigate(`/cv/${cv.id}`)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Upload className="text-orange-500" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-orange-500 transition-colors">
                          {cv.metadata?.name || cv.fileName || 'Unknown CV'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(cv.status)}
                          <span className="text-sm text-gray-500">{getStatusText(cv.status)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-medium text-gray-900">{formatTimeAgo(cv.uploadedAt)}</p>
                      <p className="text-xs text-gray-400">
                        {cv.uploadedAt?.toDate ? cv.uploadedAt.toDate().toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upgrade Card - Takes 1 column */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-bold mb-4">Upgrade to Pro</h3>
              <p className="text-sm opacity-90 mb-4">
                Unlock unlimited CV uploads and advanced filtering features
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Unlimited CV uploads</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full bg-white text-orange-500 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}