import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../js/firebase-config';
import { Upload, BarChart3, LogOut, Settings, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, ChevronDown, Briefcase, MessageCircle, FileSearch, Package } from 'lucide-react';
import { canAccessChatbot } from '../config/planConfig';
import VersionBadge from '../components/VersionBadge';

export default function Dashboard() {
  const { currentUser, logout, userData } = useAuth();
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [displayUserData, setDisplayUserData] = useState(null);

  useEffect(() => {
    loadRecentActivity();
    loadDisplayUserData();
  }, [currentUser, userData]);

  const loadDisplayUserData = async () => {
    if (!currentUser || !userData) return;

    try {
      const teamAccess = userData?.teamAccess;

      // If user is a team member, fetch the owner's user data
      if (teamAccess?.isTeamMember && teamAccess?.teamOwnerId) {
        console.log('Dashboard: Fetching team owner data for display');
        const functions = getFunctions();
        const getTeamOwnerData = httpsCallable(functions, 'getTeamOwnerData');

        const result = await getTeamOwnerData();

        if (result.data.success) {
          setDisplayUserData(result.data.ownerData);
        } else {
          // Fallback to own data if fetch fails
          setDisplayUserData(userData);
        }
      } else {
        // Owner or solo user - use their own data
        setDisplayUserData(userData);
      }
    } catch (error) {
      console.error('Error loading display user data:', error);
      // Fallback to own data
      setDisplayUserData(userData);
    }
  };

  const loadRecentActivity = async () => {
    if (!currentUser) return;

    try {
      setLoadingActivity(true);

      const teamAccess = userData?.teamAccess;

      // If user is a team member, use Cloud Function to fetch owner's CVs
      if (teamAccess?.isTeamMember && teamAccess?.teamOwnerId) {
        console.log('Dashboard: Fetching team CVs via Cloud Function for owner:', teamAccess.teamOwnerId);

        const functions = getFunctions();
        const getTeamCVs = httpsCallable(functions, 'getTeamCVs');

        const result = await getTeamCVs();

        if (result.data.success) {
          const cvsData = result.data.cvs.map(cv => ({
            ...cv,
            uploadedAt: cv.uploadedAt?.toDate ? cv.uploadedAt.toDate() :
                        cv.uploadedAt?._seconds ? new Date(cv.uploadedAt._seconds * 1000) :
                        new Date()
          }));

          // Get only the 5 most recent
          const recentCvs = cvsData.slice(0, 5);
          console.log('Dashboard: Team CVs fetched:', recentCvs.length);
          setRecentActivity(recentCvs);
        } else {
          throw new Error('Failed to fetch team CVs');
        }
      } else {
        // Owner or solo user fetches own CVs directly
        console.log('Dashboard: Fetching own CVs for user:', currentUser.uid);

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
      }

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

  // Calculate usage percentage - use displayUserData (which shows owner's data for team members)
  const usagePercentage = ((displayUserData?.cvUploadsThisMonth || 0) / (displayUserData?.cvUploadLimit || 10)) * 100;
  const userPlan = currentUser?.userData?.plan || 'free'; // Keep using userData.plan as it's inherited by team members
  const isPremium = userPlan === 'professional' || userPlan === 'enterprise';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">CV</span>
                </div>
                <span className="text-2xl font-bold">Sift</span>
              </div>

              {/* Current Plan Badge */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-lime-50 to-lime-100 border border-lime-200 rounded-lg">
                <span className="text-xs font-semibold text-gray-600">Plan:</span>
                <span className="text-sm font-bold text-gray-900 capitalize">{userPlan}</span>
                {isPremium && (
                  <CheckCircle size={14} className="text-green-600" />
                )}
                {!isPremium && (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium ml-1"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Master Account Dashboard - Only for Master Role */}
              {userData?.role === 'master' && (
                <button
                  onClick={() => navigate('/master-dashboard')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                  title="Master Account Dashboard"
                >
                  <TrendingUp size={18} />
                  <span className="text-sm font-medium hidden sm:inline">Master Dashboard</span>
                </button>
              )}

              {/* AI Assistant Button - Only for Professional/Enterprise */}
              {canAccessChatbot(userPlan) && (
                <button
                  onClick={() => navigate('/chatbot')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                  title="AI Assistant"
                >
                  <MessageCircle size={18} />
                  <span className="text-sm font-medium hidden sm:inline">AI Assistant</span>
                </button>
              )}

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
            Manage your CVs, create job specifications, and find the perfect candidates.
          </p>
        </div>

        {/* Key Actions - Hero Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/upload')}
            className="group relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
                <Upload className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Upload CVs</h3>
              <p className="text-orange-100 text-sm">
                Add new candidate CVs to your library
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/job-specs')}
            className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
                <Briefcase className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Job Specs</h3>
              <p className="text-blue-100 text-sm">
                Create job specs and match CVs
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/cvs')}
            className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
                <FileSearch className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Browse CVs</h3>
              <p className="text-purple-100 text-sm">
                Search, filter, and view your CV library
              </p>
            </div>
          </button>
        </div>

        {/* Stats & Recent Activity Row */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stats Column */}
          <div className="space-y-6">
            {/* CV Uploads Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Upload className="text-orange-500" size={24} />
                </div>
                <span className="text-sm font-medium text-gray-500">This Month</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {displayUserData?.cvUploadsThisMonth || 0}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                CVs Uploaded{userPlan !== 'enterprise' ? ` / ${displayUserData?.cvUploadLimit || 10}` : ''}
              </p>
              {userPlan !== 'enterprise' && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {usagePercentage >= 100 ? 'Limit reached' : `${Math.round(100 - usagePercentage)}% remaining`}
                  </p>
                </>
              )}
              {userPlan === 'enterprise' && (
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <TrendingUp size={14} className="mr-1" />
                  Unlimited uploads
                </p>
              )}
            </div>

            {/* CV Pack Balance Card */}
            {(displayUserData?.cvPackBalance || 0) > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Package className="text-white" size={24} />
                  </div>
                  <span className="text-sm font-medium text-purple-700">CV Packs</span>
                </div>
                <h3 className="text-3xl font-bold text-purple-900 mb-1">
                  {displayUserData?.cvPackBalance || 0}
                </h3>
                <p className="text-purple-700 text-sm mb-2">
                  Bonus CVs Available
                </p>
                <p className="text-xs text-purple-600">
                  These CVs never expire and are used automatically when your monthly limit is reached
                </p>
              </div>
            )}

            {/* Analytics Quick Link */}
            <button
              onClick={() => navigate('/analytics')}
              className="w-full bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl p-6 shadow-sm border-2 border-lime-200 hover:shadow-md transition-all hover:-translate-y-1 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-lime-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">View Analytics</h3>
                  <p className="text-sm text-gray-600">See insights & trends</p>
                </div>
              </div>
            </button>
          </div>

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
                        <FileText className="text-orange-500" size={18} />
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
        </div>

        {/* Upgrade Prompt - Only for Free/Basic users */}
        {!isPremium && (
          <div className="mt-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 shadow-lg text-white">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex-1 min-w-[280px]">
                <h3 className="text-2xl font-bold mb-2">Ready to unlock more features?</h3>
                <p className="text-orange-100 mb-4">
                  Upgrade to Professional for higher CV limits, AI assistance, and advanced analytics.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                    <span>600+ CVs per month (or 1,500 with Business plan)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                    <span>AI chatbot assistant & advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                    <span>Add CV packs anytime for extra capacity</span>
                  </li>
                </ul>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => navigate('/pricing')}
                  className="bg-white text-orange-500 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all hover:scale-105 shadow-lg"
                >
                  View Plans & Pricing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Version Badge */}
      <VersionBadge position="bottom-right" />
    </div>
  );
}
