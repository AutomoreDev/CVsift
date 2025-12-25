import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../js/firebase-config';
import { Upload, BarChart3, LogOut, Settings, FileText, Clock, CheckCircle, AlertCircle, ChevronDown, Briefcase, MessageCircle, FileSearch, Package, ArrowRight, Scale, PenTool } from 'lucide-react';
import { canAccessChatbot, canAccessEEA } from '../config/planConfig';
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

      // Always use Cloud Function for PII decryption (both owners and team members)
      console.log('Dashboard: Fetching CVs via Cloud Function for user:', currentUser.uid);

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
        console.log('Dashboard: CVs fetched:', recentCvs.length);
        setRecentActivity(recentCvs);
      } else {
        throw new Error('Failed to fetch CVs');
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
    if (status === 'completed') return <CheckCircle className="text-green-500" size={16} />;
    if (status === 'error') return <AlertCircle className="text-red-500" size={16} />;
    return <Clock className="text-accent-500" size={16} />;
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

  const userPlan = currentUser?.userData?.plan || 'free'; // Keep using userData.plan as it's inherited by team members

  // Rotating tips system - changes every 2 days
  const tips = [
    "Manage your CVs, create job specifications, and find the perfect candidates.",
    "Use job spec matching to automatically rank candidates by their fit for the role.",
    "Filter CVs by skills, experience, and qualifications to find your ideal candidate.",
    "Upload multiple CVs at once to quickly build your candidate database.",
    "View detailed analytics to understand your hiring pipeline and candidate trends.",
    "Create detailed job specifications to streamline your recruitment process.",
  ];

  const getTipIndex = () => {
    const startDate = new Date('2025-01-01').getTime();
    const today = new Date().getTime();
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const cycleIndex = Math.floor(daysSinceStart / 2); // Change every 2 days
    return cycleIndex % tips.length;
  };

  const currentTip = tips[getTipIndex()];

  return (
    <div className="min-h-screen bg-dominant">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Plan */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-accent-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CV</span>
                </div>
                <span className="text-xl font-bold text-secondary-900 font-heading">Sift</span>
              </div>

              {/* Plan Badge */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-gray-100 rounded-lg">
                  <span className="text-xs font-semibold text-gray-700 capitalize">{userPlan}</span>
                </div>
                <div className="px-3 py-1 bg-accent-50 border border-accent-200 rounded-lg">
                  <span className="text-xs font-semibold text-accent-700">
                    {userPlan === 'enterprise'
                      ? `${displayUserData?.cvUploadsThisMonth || 0} CVs Uploaded`
                      : `${displayUserData?.cvUploadsThisMonth || 0}/${displayUserData?.cvUploadLimit || 10} CVs`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Master Dashboard Button */}
              {userData?.role === 'master' && (
                <button
                  onClick={() => navigate('/master-dashboard')}
                  className="px-4 py-2 text-sm font-medium border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all hover:scale-105"
                >
                  Master Dashboard
                </button>
              )}

              {/* AI Assistant Button */}
              {canAccessChatbot(userPlan) && (
                <button
                  onClick={() => navigate('/chatbot')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all hover:scale-105"
                  title="AI Assistant"
                >
                  <MessageCircle size={18} />
                  <span>AI Assistant</span>
                </button>
              )}

              {/* EEA Compliance Button */}
              {(canAccessEEA(userPlan) || userData?.role === 'master') && (
                <button
                  onClick={() => navigate('/eea')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all hover:scale-105"
                  title="EEA Compliance"
                >
                  <Scale size={18} />
                  <span>EEA</span>
                </button>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all hover:scale-105"
                >
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <ChevronDown size={16} className="text-gray-600" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
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
          <h1 className="text-2xl font-semibold text-secondary-900 mb-1 font-heading">
            Welcome back, {currentUser?.displayName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-gray-600">
            {currentTip}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigate('/upload')}
            className="group bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-accent-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer"
          >
            <h3 className="text-xl font-bold text-secondary-900 mb-2 font-heading group-hover:text-accent-600 transition-colors">
              Upload CVs
            </h3>
            <p className="text-sm text-gray-600">Add new candidates</p>
          </button>

          <button
            onClick={() => navigate('/cv-builder')}
            className="group bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-accent-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-bold text-secondary-900 font-heading group-hover:text-accent-600 transition-colors">
                CV Builder
              </h3>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">FREE</span>
            </div>
            <p className="text-sm text-gray-600">Create your professional CV</p>
          </button>

          <button
            onClick={() => navigate('/job-specs')}
            className="group bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-accent-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer"
          >
            <h3 className="text-xl font-bold text-secondary-900 mb-2 font-heading group-hover:text-accent-600 transition-colors">
              Job Specs
            </h3>
            <p className="text-sm text-gray-600">Create job specifications</p>
          </button>

          <button
            onClick={() => navigate('/cvs')}
            className="group bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-accent-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer"
          >
            <h3 className="text-xl font-bold text-secondary-900 mb-2 font-heading group-hover:text-accent-600 transition-colors">
              Browse CVs
            </h3>
            <p className="text-sm text-gray-600">Find the perfect candidates</p>
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="group bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-accent-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer"
          >
            <h3 className="text-xl font-bold text-secondary-900 mb-2 font-heading group-hover:text-accent-600 transition-colors">
              Analytics
            </h3>
            <p className="text-sm text-gray-600">View insights</p>
          </button>
        </div>

        {/* CV Pack Balance Banner */}
        {(displayUserData?.cvPackBalance || 0) > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-purple-900 font-heading">
                  {displayUserData?.cvPackBalance || 0} Bonus CVs Available
                </p>
                <p className="text-sm text-purple-700">These credits never expire</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity - Full Width */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-secondary-900 font-heading">Recent Activity</h2>
              <button
                onClick={() => navigate('/cvs')}
                className="text-sm text-accent-500 hover:text-accent-600 font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight size={14} />
              </button>
            </div>

            {loadingActivity ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-3 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Loading activity...</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2 font-heading">No CVs Yet</h3>
                <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
                  Upload your first CV to start filtering and finding candidates
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-accent-500 hover:bg-accent-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Upload CV
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((cv) => (
                  <button
                    key={cv.id}
                    onClick={() => navigate(`/cv/${cv.id}`)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="text-accent-600" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate group-hover:text-accent-500 transition-colors">
                          {cv.metadata?.name || cv.fileName || 'Unknown CV'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getStatusIcon(cv.status)}
                          <span className="text-xs text-gray-500">{getStatusText(cv.status)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatTimeAgo(cv.uploadedAt)}</span>
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Version Badge */}
      <VersionBadge />
    </div>
  );
}
