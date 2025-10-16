import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../js/firebase-config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  FileText,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  Upload,
  AlertCircle,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Briefcase,
  Settings,
  Target,
  Award,
  TrendingUp
} from 'lucide-react';

export default function CVList() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [cvs, setCvs] = useState([]);
  const [filteredCvs, setFilteredCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCvs, setSelectedCvs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    demographic: false,
    professional: false,
    advanced: false
  });

  // Job spec matching state
  const [jobSpecs, setJobSpecs] = useState([]);
  const [selectedJobSpec, setSelectedJobSpec] = useState(null);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    fileType: 'all',
    // Demographic filters
    gender: 'all',
    ageMin: '',
    ageMax: '',
    race: 'all',
    location: '',
    skills: '',
    experienceYears: 'all',
    // Smart filtering options
    onlyParsed: false, // Only show CVs that have been successfully parsed
    includeUnknown: true // Include CVs with missing demographic data
  });

  // Fetch CVs from Firestore
  useEffect(() => {
    fetchCVs();
    fetchJobSpecs();
  }, [currentUser]);

  // Apply filters and search
  useEffect(() => {
    applyFilters();
  }, [cvs, searchTerm, filters, selectedJobSpec]);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      console.log('Fetching CVs for user:', currentUser.uid);

      const q = query(
        collection(db, 'cvs'),
        where('userId', '==', currentUser.uid),
        orderBy('uploadedAt', 'desc')
      );

      console.log('Executing query...');
      const querySnapshot = await getDocs(q);
      console.log('Query successful. Found documents:', querySnapshot.docs.length);

      const cvsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
      }));

      console.log('CVs data:', cvsData);
      setCvs(cvsData);
      setFilteredCvs(cvsData);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Check for index error
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.error('FIRESTORE INDEX REQUIRED!');
        console.error('Create a composite index for: userId (Ascending) + uploadedAt (Descending)');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchJobSpecs = async () => {
    try {
      const q = query(
        collection(db, 'jobSpecs'),
        where('userId', '==', currentUser.uid),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const specs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setJobSpecs(specs);
    } catch (error) {
      console.error('Error fetching job specs:', error);
    }
  };

  const handleJobSpecChange = async (specId) => {
    if (userData?.plan === 'free') {
      setShowUpgradePrompt(true);
      return;
    }

    if (!specId) {
      setSelectedJobSpec(null);
      return;
    }

    setSelectedJobSpec(specId);

    // Calculate matches for all CVs
    await calculateMatches(specId);
  };

  const calculateMatches = async (jobSpecId) => {
    setMatchingInProgress(true);

    try {
      const functions = getFunctions();
      const batchCalculate = httpsCallable(functions, 'batchCalculateMatches');

      const cvIds = cvs.map(cv => cv.id);
      const result = await batchCalculate({ cvIds, jobSpecId });

      if (result.data.success) {
        // Refresh CVs to get updated match scores
        await fetchCVs();
      }
    } catch (error) {
      console.error('Error calculating matches:', error);
      alert('Failed to calculate match scores. Please try again.');
    } finally {
      setMatchingInProgress(false);
    }
  };

  const getMatchScore = (cv) => {
    if (!selectedJobSpec || !cv.matchScores) return null;
    return cv.matchScores[selectedJobSpec]?.score || null;
  };

  const getMatchScoreBadge = (score) => {
    if (score === null || score === undefined) {
      return (
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
          No Match
        </span>
      );
    }

    let bgColor = 'bg-red-100 text-red-700';
    let label = 'Poor Match';

    if (score >= 80) {
      bgColor = 'bg-green-100 text-green-700';
      label = 'Excellent';
    } else if (score >= 60) {
      bgColor = 'bg-blue-100 text-blue-700';
      label = 'Good';
    } else if (score >= 40) {
      bgColor = 'bg-yellow-100 text-yellow-700';
      label = 'Fair';
    }

    return (
      <span className={`px-2 py-1 text-xs ${bgColor} rounded-full font-medium flex items-center gap-1`}>
        <Target size={12} />
        {score}% {label}
      </span>
    );
  };

  const applyFilters = () => {
    let filtered = [...cvs];

    // Only show parsed CVs if requested
    if (filters.onlyParsed) {
      filtered = filtered.filter(cv => cv.parsed && cv.status === 'completed');
    }

    // Search filter - only search in parsed metadata
    if (searchTerm) {
      filtered = filtered.filter(cv =>
        cv.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.metadata?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.metadata?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.metadata?.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(cv => cv.status === filters.status);
    }

    // File type filter
    if (filters.fileType !== 'all') {
      filtered = filtered.filter(cv => cv.fileType.includes(filters.fileType));
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(cv => cv.uploadedAt >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(cv => cv.uploadedAt <= toDate);
    }

    // SMART DEMOGRAPHIC FILTERS
    // These respect the "includeUnknown" setting

    // Gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(cv => {
        const hasGender = cv.metadata?.gender;
        if (!hasGender) return filters.includeUnknown;
        return cv.metadata.gender.toLowerCase() === filters.gender.toLowerCase();
      });
    }

    // Age filter
    if (filters.ageMin) {
      filtered = filtered.filter(cv => {
        const hasAge = cv.metadata?.age;
        if (!hasAge) return filters.includeUnknown;
        return cv.metadata.age >= parseInt(filters.ageMin);
      });
    }

    if (filters.ageMax) {
      filtered = filtered.filter(cv => {
        const hasAge = cv.metadata?.age;
        if (!hasAge) return filters.includeUnknown;
        return cv.metadata.age <= parseInt(filters.ageMax);
      });
    }

    // Race filter - CRITICAL for compliance
    if (filters.race !== 'all') {
      filtered = filtered.filter(cv => {
        const hasRace = cv.metadata?.race;
        if (!hasRace) return filters.includeUnknown;
        return cv.metadata.race.toLowerCase() === filters.race.toLowerCase();
      });
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(cv => {
        const hasLocation = cv.metadata?.location;
        if (!hasLocation) return filters.includeUnknown;
        return cv.metadata.location.toLowerCase().includes(filters.location.toLowerCase());
      });
    }

    // Skills filter
    if (filters.skills) {
      const skillTerms = filters.skills.toLowerCase().split(',').map(s => s.trim());
      filtered = filtered.filter(cv => {
        const hasSkills = cv.metadata?.skills && cv.metadata.skills.length > 0;
        if (!hasSkills) return filters.includeUnknown;
        return cv.metadata.skills.some(skill =>
          skillTerms.some(term => skill.toLowerCase().includes(term))
        );
      });
    }

    // Experience years filter
    if (filters.experienceYears !== 'all') {
      filtered = filtered.filter(cv => {
        const hasExperience = cv.metadata?.experience && cv.metadata.experience.length > 0;
        if (!hasExperience) return filters.includeUnknown;

        const experienceCount = cv.metadata.experience.length;
        switch (filters.experienceYears) {
          case '0-2':
            return experienceCount <= 2;
          case '3-5':
            return experienceCount >= 3 && experienceCount <= 5;
          case '6-10':
            return experienceCount >= 6 && experienceCount <= 10;
          case '10+':
            return experienceCount > 10;
          default:
            return true;
        }
      });
    }

    // Sort by match score if job spec is selected
    if (selectedJobSpec) {
      filtered.sort((a, b) => {
        const scoreA = getMatchScore(a) || 0;
        const scoreB = getMatchScore(b) || 0;
        return scoreB - scoreA; // Highest score first
      });
    }

    setFilteredCvs(filtered);
  };

  const handleSelectCV = (cvId) => {
    setSelectedCvs(prev =>
      prev.includes(cvId)
        ? prev.filter(id => id !== cvId)
        : [...prev, cvId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCvs.length === filteredCvs.length) {
      setSelectedCvs([]);
    } else {
      setSelectedCvs(filteredCvs.map(cv => cv.id));
    }
  };

  const handleDeleteCV = async (cvId) => {
    if (!confirm('Are you sure you want to delete this CV?')) return;

    try {
      const cv = cvs.find(c => c.id === cvId);
      
      // Delete from Storage
      if (cv.storagePath) {
        const storageRef = ref(storage, cv.storagePath);
        await deleteObject(storageRef);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'cvs', cvId));

      // Update local state
      setCvs(prev => prev.filter(c => c.id !== cvId));
      setSelectedCvs(prev => prev.filter(id => id !== cvId));
    } catch (error) {
      console.error('Error deleting CV:', error);
      alert('Failed to delete CV. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCvs.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedCvs.length} CV(s)?`)) return;

    try {
      const deletePromises = selectedCvs.map(cvId => handleDeleteCV(cvId));
      await Promise.all(deletePromises);
      setSelectedCvs([]);
    } catch (error) {
      console.error('Error deleting CVs:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.fileType !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.gender !== 'all') count++;
    if (filters.ageMin) count++;
    if (filters.ageMax) count++;
    if (filters.race !== 'all') count++;
    if (filters.location) count++;
    if (filters.skills) count++;
    if (filters.experienceYears !== 'all') count++;
    if (filters.onlyParsed) count++;
    if (!filters.includeUnknown) count++;
    return count;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      processing: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processing' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error' }
    };

    const badge = badges[status] || badges.processing;

    return (
      <span className={`${badge.bg} ${badge.text} text-xs font-medium px-2.5 py-1 rounded-full`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Dashboard</span>
              </button>
            </div>

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
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CV Library</h1>
            <p className="text-gray-600">
              {filteredCvs.length} {filteredCvs.length === 1 ? 'CV' : 'CVs'} found
            </p>
          </div>

          <button
            onClick={() => navigate('/upload')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 flex items-center space-x-2 shadow-lg shadow-orange-500/30"
          >
            <Upload size={20} />
            <span>Upload CVs</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by filename, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-colors relative ${
                showFilters
                  ? 'bg-orange-500 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={20} />
              <span>Filters</span>
              {getActiveFilterCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>

          {/* Job Spec Selector */}
          {(userData?.plan !== 'free' || jobSpecs.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-orange-500" />
                  <label className="text-sm font-medium text-gray-700">
                    Match to Job Spec:
                  </label>
                </div>
                <select
                  value={selectedJobSpec || ''}
                  onChange={(e) => handleJobSpecChange(e.target.value)}
                  disabled={matchingInProgress}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">No job spec selected</option>
                  {jobSpecs.map(spec => (
                    <option key={spec.id} value={spec.id}>
                      {spec.title} {spec.department && `- ${spec.department}`}
                    </option>
                  ))}
                </select>
                {matchingInProgress && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Calculating matches...</span>
                  </div>
                )}
                {jobSpecs.length === 0 && userData?.plan !== 'free' && (
                  <button
                    onClick={() => navigate('/job-specs')}
                    className="text-sm text-orange-500 hover:text-orange-600 font-medium whitespace-nowrap"
                  >
                    Create Job Spec →
                  </button>
                )}
              </div>
              {selectedJobSpec && !matchingInProgress && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <TrendingUp size={16} className="text-blue-600" />
                  <span>CVs are sorted by match score (highest first)</span>
                </div>
              )}
            </div>
          )}

          {/* Upgrade Prompt Modal */}
          {showUpgradePrompt && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="text-orange-500" size={24} />
                  </div>
                  <button
                    onClick={() => setShowUpgradePrompt(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Upgrade to Premium
                </h3>
                <p className="text-gray-600 mb-4">
                  CV matching with job specifications is a premium feature. Upgrade your plan to unlock this powerful tool.
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  View Plans
                </button>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.status !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  Status: {filters.status}
                  <button onClick={() => setFilters({ ...filters, status: 'all' })} className="hover:bg-orange-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.race !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Race: {filters.race}
                  <button onClick={() => setFilters({ ...filters, race: 'all' })} className="hover:bg-purple-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.gender !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Gender: {filters.gender}
                  <button onClick={() => setFilters({ ...filters, gender: 'all' })} className="hover:bg-blue-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.location && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Location: {filters.location}
                  <button onClick={() => setFilters({ ...filters, location: '' })} className="hover:bg-green-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.skills && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                  Skills: {filters.skills}
                  <button onClick={() => setFilters({ ...filters, skills: '' })} className="hover:bg-indigo-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}
              {getActiveFilterCount() > 1 && (
                <button
                  onClick={() => setFilters({
                    status: 'all',
                    dateFrom: '',
                    dateTo: '',
                    fileType: 'all',
                    gender: 'all',
                    ageMin: '',
                    ageMax: '',
                    race: 'all',
                    location: '',
                    skills: '',
                    experienceYears: 'all',
                    onlyParsed: false,
                    includeUnknown: true
                  })}
                  className="text-xs text-gray-600 hover:text-orange-500 underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              {/* Result Summary */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Showing {filteredCvs.length} of {cvs.length} CVs
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {getActiveFilterCount() > 0 ? `${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} active` : 'No filters applied'}
                    </p>
                  </div>
                  <Filter className="text-orange-500" size={24} />
                </div>
              </div>

              {/* Basic Filters - Always Visible */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Settings size={16} className="text-gray-600" />
                  Quick Filters
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
                    <select
                      value={filters.fileType}
                      onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="pdf">PDF</option>
                      <option value="word">Word</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Demographic Filters - Collapsible */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('demographic')}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Demographic Filters</h3>
                    {(filters.gender !== 'all' || filters.ageMin || filters.ageMax || filters.race !== 'all') && (
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  {expandedSections.demographic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.demographic && (
                  <div className="p-4 bg-white">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={filters.gender}
                      onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    >
                      <option value="all">All Genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-Binary</option>
                      <option value="prefer-not-to-say">Prefer Not to Say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age Min</label>
                    <input
                      type="number"
                      placeholder="Min age"
                      value={filters.ageMin}
                      onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      min="18"
                      max="99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age Max</label>
                    <input
                      type="number"
                      placeholder="Max age"
                      value={filters.ageMax}
                      onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      min="18"
                      max="99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Race/Ethnicity</label>
                    <select
                      value={filters.race}
                      onChange={(e) => setFilters({ ...filters, race: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    >
                      <option value="all">All Races</option>
                      <option value="african">African</option>
                      <option value="coloured">Coloured</option>
                      <option value="indian">Indian</option>
                      <option value="white">White</option>
                      <option value="asian">Asian</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Filters - Collapsible */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('professional')}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-green-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Professional Filters</h3>
                    {(filters.location || filters.skills || filters.experienceYears !== 'all') && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  {expandedSections.professional ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.professional && (
                  <div className="p-4 bg-white">
                    <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="e.g., Cape Town, Johannesburg"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    <input
                      type="text"
                      placeholder="e.g., React, Python, Java"
                      value={filters.skills}
                      onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple skills with commas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                    <select
                      value={filters.experienceYears}
                      onChange={(e) => setFilters({ ...filters, experienceYears: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    >
                      <option value="all">All Experience Levels</option>
                      <option value="0-2">Entry Level (0-2 positions)</option>
                      <option value="3-5">Mid Level (3-5 positions)</option>
                      <option value="6-10">Senior (6-10 positions)</option>
                      <option value="10+">Expert (10+ positions)</option>
                    </select>
                  </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Options - Collapsible */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('advanced')}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Advanced Options</h3>
                    {(filters.onlyParsed || !filters.includeUnknown) && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  {expandedSections.advanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.advanced && (
                  <div className="p-4 bg-white">
                    <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.onlyParsed}
                      onChange={(e) => setFilters({ ...filters, onlyParsed: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-orange-500 transition-colors">
                        Only show successfully parsed CVs
                      </span>
                      <p className="text-xs text-gray-500">
                        Exclude CVs that are still processing or failed to parse
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.includeUnknown}
                      onChange={(e) => setFilters({ ...filters, includeUnknown: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-orange-500 transition-colors">
                        Include CVs with missing demographic data
                      </span>
                      <p className="text-xs text-gray-500">
                        When filtering by race/gender/age, also show CVs where this info wasn't found
                      </p>
                    </div>
                  </label>

                      {/* Help Text */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={14} />
                          <p className="text-xs text-blue-800">
                            <strong>Tip:</strong> Turn off "Include missing data" to see only CVs with complete demographic information for compliance reporting.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedCvs.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-orange-800 font-medium">
              {selectedCvs.length} CV{selectedCvs.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                <Trash2 size={18} />
                <span>Delete Selected</span>
              </button>
              <button
                onClick={() => setSelectedCvs([])}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-orange-500 animate-spin" size={48} />
          </div>
        )}

        {/* Empty State */}
        {!loading && cvs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No CVs uploaded yet</h3>
            <p className="text-gray-600 mb-6">Start by uploading your first batch of CVs</p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            >
              Upload CVs
            </button>
          </div>
        )}

        {/* No Results State */}
        {!loading && cvs.length > 0 && filteredCvs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No CVs found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ status: 'all', dateFrom: '', dateTo: '', fileType: 'all' });
              }}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* CV List Table */}
        {!loading && filteredCvs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCvs.length === filteredCvs.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  {selectedJobSpec && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match Score
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCvs.map((cv) => (
                  <tr key={cv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCvs.includes(cv.id)}
                        onChange={() => handleSelectCV(cv.id)}
                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="text-orange-500" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{cv.fileName}</p>
                          {cv.metadata?.name && (
                            <p className="text-sm text-gray-500">{cv.metadata.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(cv.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatFileSize(cv.fileSize)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{formatDate(cv.uploadedAt)}</span>
                      </div>
                    </td>
                    {selectedJobSpec && (
                      <td className="px-6 py-4">
                        {getMatchScoreBadge(getMatchScore(cv))}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/cv/${cv.id}`)}
                          className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <a
                          href={cv.downloadURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                        <button
                          onClick={() => handleDeleteCV(cv.id)}
                          className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}