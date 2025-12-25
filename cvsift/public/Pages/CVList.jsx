import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
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
  TrendingUp,
  Check,
  FileBarChart,
  List
} from 'lucide-react';
import { canCreateJobSpecs, hasFeatureAccess } from '../config/planConfig';
import ConfirmDialog from '../components/ConfirmDialog';
import MatchBreakdownReport from '../components/MatchBreakdownReport';
import { useToast } from '../components/Toast';
import { trackCVListFilter, trackCVBulkDelete, trackCVDelete, trackError } from '../utils/analytics';

/**
 * Calculate years of experience from a work experience entry
 * Parses duration strings like "Jan 2020 - Dec 2022" or "2020 - Present"
 */
function calculateExperienceYears(experience) {
  if (!experience.duration && !experience.startDate && !experience.endDate) {
    return 0;
  }

  try {
    // Try to extract years from duration string (e.g., "Jan 2020 - Dec 2022", "2020 - Present")
    const duration = experience.duration || `${experience.startDate || ''} - ${experience.endDate || ''}`;
    const yearMatches = duration.match(/\b(19|20)\d{2}\b/g);

    if (yearMatches && yearMatches.length >= 1) {
      const startYear = parseInt(yearMatches[0]);
      let endYear;

      // If duration contains "Present" or "Current", use current year
      if (duration.toLowerCase().includes('present') || duration.toLowerCase().includes('current')) {
        endYear = new Date().getFullYear();
      } else if (yearMatches.length >= 2) {
        // Use the last year found in the string
        endYear = parseInt(yearMatches[yearMatches.length - 1]);
      } else {
        // Only one year found and no "present" - assume 1 year duration
        return 1;
      }

      return Math.max(0, endYear - startYear);
    }

    return 0;
  } catch (error) {
    console.warn('Error calculating experience years:', error);
    return 0;
  }
}

/**
 * Custom Select Dropdown Component
 * Beautiful, accessible dropdown to replace ugly HTML selects
 */
function CustomSelect({ value, onChange, options, placeholder = 'Select...', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`} style={{ zIndex: isOpen ? 1000 : 'auto' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg flex items-center justify-between hover:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
      >
        <span className={`text-sm ${value === 'all' || !value ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[1001] w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-accent-50 transition-colors flex items-center justify-between ${
                value === option.value ? 'bg-accent-50 text-accent-600 font-medium' : 'text-gray-700'
              }`}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={16} className="text-accent-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CVList() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [cvs, setCvs] = useState([]);
  const [filteredCvs, setFilteredCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCvs, setSelectedCvs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    demographic: false,
    professional: false,
    advanced: false,
    custom: false
  });

  // Job spec matching state
  const [jobSpecs, setJobSpecs] = useState([]);
  const [selectedJobSpec, setSelectedJobSpec] = useState(null);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, cvId: null, isBulk: false });
  const [deleting, setDeleting] = useState(false);
  const [matchReportCV, setMatchReportCV] = useState(null);

  // Custom fields state
  const [customFieldConfigs, setCustomFieldConfigs] = useState([]);
  const [visibleCustomColumns, setVisibleCustomColumns] = useState([]);
  const [customFieldFilters, setCustomFieldFilters] = useState({});

  // Refs for synchronized scrolling
  const tableContainerRef = useRef(null);
  const topScrollerRef = useRef(null);

  const userPlan = userData?.plan || 'free';
  const hasCustomFieldsAccess = userData ? hasFeatureAccess(userPlan, 'customFields') : false;

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
    if (!currentUser || !userData) return;

    fetchCVs();
    fetchJobSpecs();
    if (hasCustomFieldsAccess) {
      fetchCustomFieldConfigs();
    }
  }, [currentUser, userData, hasCustomFieldsAccess]);

  // Apply filters and search
  useEffect(() => {
    if (!currentUser) return;
    applyFilters();
  }, [cvs, searchTerm, filters, selectedJobSpec, customFieldFilters, currentUser]);

  // Sync top scroller width with table width
  useEffect(() => {
    const syncScrollerWidth = () => {
      if (tableContainerRef.current && topScrollerRef.current) {
        const table = tableContainerRef.current.querySelector('table');
        if (table) {
          const scrollerContent = topScrollerRef.current.querySelector('div');
          if (scrollerContent) {
            scrollerContent.style.width = `${table.scrollWidth}px`;
          }
        }
      }
    };

    // Sync on mount and when data changes
    syncScrollerWidth();

    // Add resize observer to handle window resizing and dynamic content
    const resizeObserver = new ResizeObserver(syncScrollerWidth);
    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [filteredCvs, visibleCustomColumns, selectedJobSpec]);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      console.log('Fetching CVs for user:', currentUser.uid);

      const teamAccess = userData?.teamAccess;

      // Always use Cloud Function for PII decryption (both owners and team members)
      console.log('Fetching CVs via Cloud Function for user:', currentUser.uid);

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

        console.log('CVs fetched:', cvsData.length);
        setCvs(cvsData);
        setFilteredCvs(cvsData);
      } else {
        throw new Error('Failed to fetch CVs');
      }
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

  const fetchCustomFieldConfigs = async () => {
    if (!currentUser) return;

    try {
      const docRef = doc(db, 'customFieldConfigs', currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const fields = docSnap.data().fields || [];
        setCustomFieldConfigs(fields);
        // Initialize filters for each custom field
        const initialFilters = {};
        fields.forEach(field => {
          initialFilters[field.name] = '';
        });
        setCustomFieldFilters(initialFilters);
      } else {
        // No custom fields configured, initialize empty
        setCustomFieldConfigs([]);
        setCustomFieldFilters({});
      }
    } catch (error) {
      console.error('Error loading custom field configs:', error);
      // On error, initialize empty to prevent crashes
      setCustomFieldConfigs([]);
      setCustomFieldFilters({});
    }
  };

  const fetchJobSpecs = async () => {
    try {
      const teamAccess = userData?.teamAccess;
      const isTeamMember = teamAccess?.isTeamMember;

      if (isTeamMember) {
        // Team members: use Cloud Function to access owner's job specs
        const functions = getFunctions();
        const getTeamJobSpecs = httpsCallable(functions, 'getTeamJobSpecs');
        const result = await getTeamJobSpecs();

        if (result.data.success) {
          const specs = result.data.jobSpecs.map(spec => ({
            id: spec.id,
            ...spec,
            createdAt: spec.createdAt?._seconds
              ? new Date(spec.createdAt._seconds * 1000)
              : new Date(spec.createdAt)
          }));
          // Sort by createdAt
          specs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setJobSpecs(specs);
        } else {
          setJobSpecs([]);
        }
      } else {
        // Owner: direct Firestore access
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
      }
    } catch (error) {
      // If index error, try without orderBy (only for owners)
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        try {
          const simpleQuery = query(
            collection(db, 'jobSpecs'),
            where('userId', '==', currentUser.uid),
            where('isActive', '==', true)
          );
          const querySnapshot = await getDocs(simpleQuery);
          const specs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Sort in memory
          specs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setJobSpecs(specs);
        } catch (retryError) {
          console.error('Error fetching job specs (retry):', retryError);
        }
      } else {
        console.error('Error fetching job specs:', error);
      }
    }
  };

  const handleJobSpecChange = async (specId) => {
    // Check if user can use job specs (Basic, Professional, Enterprise)
    if (!canCreateJobSpecs(userData?.plan)) {
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
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack,
        name: error.name
      });

      // Provide user-friendly error message with more context
      let errorMessage = 'Failed to calculate match scores. ';

      if (error.code === 'functions/internal') {
        errorMessage += 'There was an internal error in the matching function. Please check the Firebase Functions logs for details.';
      } else if (error.code === 'functions/unauthenticated') {
        errorMessage += 'You must be logged in to use this feature.';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage += 'You do not have permission to perform this action.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'An unknown error occurred.';
      }

      alert(errorMessage + '\n\nPlease check the browser console for more details.');
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

  /**
   * Apply all active filters to the CV list
   *
   * IMPORTANT FILTERING LOGIC:
   * - DEMOGRAPHIC FILTERS (gender, age, race): Respect "includeUnknown" setting for compliance
   * - PROFESSIONAL FILTERS (skills, location, experience): STRICT - exclude CVs without data
   *
   * This separation ensures:
   * 1. Demographic filtering is compliant (can include CVs with missing data to avoid discrimination)
   * 2. Professional filtering is accurate (only show CVs that actually match criteria)
   */
  const applyFilters = () => {
    console.log('=== APPLYING FILTERS ===');
    console.log('Total CVs before filtering:', cvs.length);
    console.log('Active filters:', { skills: filters.skills, experienceYears: filters.experienceYears, location: filters.location });
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

    // Location filter - PROFESSIONAL FILTER: Don't use includeUnknown for professional criteria
    if (filters.location) {
      filtered = filtered.filter(cv => {
        const hasLocation = cv.metadata?.location;
        if (!hasLocation) return false; // Exclude CVs without location data when filtering by location
        return cv.metadata.location.toLowerCase().includes(filters.location.toLowerCase());
      });
    }

    // Skills filter - PROFESSIONAL FILTER: Exclude CVs without skills when filtering by skills
    if (filters.skills) {
      const skillTerms = filters.skills.toLowerCase().split(',').map(s => s.trim());
      filtered = filtered.filter(cv => {
        const hasSkills = cv.metadata?.skills && cv.metadata.skills.length > 0;
        if (!hasSkills) {
          console.log(`CV ${cv.fileName} excluded: no skills data`);
          return false; // Exclude CVs without skills when filtering by skills
        }

        const matchesSkill = cv.metadata.skills.some(skill =>
          skillTerms.some(term => skill.toLowerCase().includes(term))
        );

        if (!matchesSkill) {
          console.log(`CV ${cv.fileName} excluded: has skills [${cv.metadata.skills.slice(0, 5).join(', ')}...] but none match filter terms [${skillTerms.join(', ')}]`);
        } else {
          console.log(`CV ${cv.fileName} INCLUDED: matches skill filter`);
        }

        return matchesSkill;
      });
    }

    // Experience years filter - PROFESSIONAL FILTER: Only match CVs with actual experience data
    if (filters.experienceYears !== 'all') {
      filtered = filtered.filter(cv => {
        const hasExperience = cv.metadata?.experience && cv.metadata.experience.length > 0;
        // STRICT: If no experience data, exclude from experience-based filtering
        if (!hasExperience) {
          console.log(`CV ${cv.fileName} excluded: no experience data`);
          return false;
        }

        // Calculate total years of experience from all positions
        let totalYears = 0;
        cv.metadata.experience.forEach((exp, idx) => {
          const years = calculateExperienceYears(exp);
          console.log(`CV ${cv.fileName} - Position ${idx + 1}: "${exp.title}" | Duration: "${exp.duration}" | Calculated: ${years} years`);
          totalYears += years;
        });

        // If we couldn't calculate years, fall back to position count estimate
        if (totalYears === 0) {
          totalYears = cv.metadata.experience.length * 1.5; // Rough estimate: 1.5 years per position
          console.log(`CV ${cv.fileName}: Using fallback - ${cv.metadata.experience.length} positions * 1.5 = ${totalYears} years`);
        }

        let matches = false;
        switch (filters.experienceYears) {
          case '0-2':
            matches = totalYears <= 2;
            break;
          case '3-5':
            matches = totalYears >= 3 && totalYears <= 5;
            break;
          case '6-10':
            matches = totalYears >= 6 && totalYears <= 10;
            break;
          case '10+':
            matches = totalYears > 10;
            break;
          default:
            matches = true;
        }

        console.log(`CV ${cv.fileName}: ${totalYears} years experience, filter: ${filters.experienceYears}, ${matches ? 'INCLUDED' : 'excluded'}`);
        return matches;
      });
    }

    // Custom field filters
    if (hasCustomFieldsAccess && customFieldConfigs.length > 0 && customFieldFilters) {
      customFieldConfigs.forEach(field => {
        const filterValue = customFieldFilters[field.name];
        if (filterValue && filterValue !== '') {
          filtered = filtered.filter(cv => {
            const cvFieldValue = cv.customFields?.[field.name];

            // Handle different field types
            if (field.type === 'boolean') {
              return cvFieldValue === (filterValue === 'true');
            } else if (field.type === 'select' || field.type === 'text') {
              if (!cvFieldValue) return false;
              return String(cvFieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
            } else if (field.type === 'number') {
              if (!cvFieldValue) return false;
              return cvFieldValue === Number(filterValue);
            } else if (field.type === 'date') {
              if (!cvFieldValue) return false;
              return cvFieldValue === filterValue;
            }
            return true;
          });
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

    console.log('=== FILTERING COMPLETE ===');
    console.log('CVs after filtering:', filtered.length);
    console.log('Filtered CV filenames:', filtered.map(cv => cv.fileName));

    setFilteredCvs(filtered);

    // Track filter usage (only if filters are actually applied)
    const hasActiveFilters =
      searchTerm ||
      filters.status !== 'all' ||
      filters.fileType !== 'all' ||
      filters.gender !== 'all' ||
      filters.race !== 'all' ||
      filters.location ||
      filters.skills ||
      filters.ageMin ||
      filters.ageMax ||
      filters.dateFrom ||
      filters.dateTo ||
      selectedJobSpec;

    if (hasActiveFilters) {
      const activeFilters = [];
      if (searchTerm) activeFilters.push('search');
      if (filters.status !== 'all') activeFilters.push('status');
      if (filters.fileType !== 'all') activeFilters.push('fileType');
      if (filters.gender !== 'all') activeFilters.push('gender');
      if (filters.race !== 'all') activeFilters.push('race');
      if (filters.location) activeFilters.push('location');
      if (filters.skills) activeFilters.push('skills');
      if (filters.ageMin || filters.ageMax) activeFilters.push('age');
      if (filters.dateFrom || filters.dateTo) activeFilters.push('date');
      if (selectedJobSpec) activeFilters.push('jobSpec');

      trackCVListFilter(activeFilters, cvs.length, filtered.length);
    }
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
    try {
      setDeleting(true);

      // Use Cloud Function for deletion (handles both owner and team member cases)
      const functions = getFunctions();
      const deleteCV = httpsCallable(functions, 'deleteCV');
      const result = await deleteCV({ cvId });

      if (result.data.success) {
        // Track CV deletion
        trackCVDelete();

        // Update local state
        setCvs(prev => prev.filter(c => c.id !== cvId));
        setSelectedCvs(prev => prev.filter(id => id !== cvId));
        toast.success('CV deleted successfully');
      } else {
        throw new Error(result.data.message || 'Failed to delete CV');
      }
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast.error('Failed to delete CV. Please try again.');

      // Track deletion error
      trackError('cv_delete_failed', error.message, 'CVList');
    } finally {
      setDeleting(false);
      setDeleteModal({ isOpen: false, cvId: null, isBulk: false });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCvs.length === 0) return;

    try {
      setDeleting(true);

      // Use Cloud Function for each deletion (handles both owner and team member cases)
      const functions = getFunctions();
      const deleteCV = httpsCallable(functions, 'deleteCV');

      let successCount = 0;
      let failCount = 0;

      // Delete each CV
      for (const cvId of selectedCvs) {
        try {
          const result = await deleteCV({ cvId });
          if (result.data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error('Error deleting CV:', cvId, error);
          failCount++;
        }
      }

      // Track bulk deletion
      if (successCount > 0) {
        trackCVBulkDelete(successCount);
      }

      // Update local state
      setCvs(prev => prev.filter(c => !selectedCvs.includes(c.id)));

      if (failCount === 0) {
        toast.success(`${successCount} CV(s) deleted successfully`);
      } else {
        toast.warning(`${successCount} CV(s) deleted, ${failCount} failed`);
      }

      setSelectedCvs([]);
    } catch (error) {
      console.error('Error deleting CVs:', error);
      toast.error('Failed to delete some CVs. Please try again.');

      // Track bulk deletion error
      trackError('cv_bulk_delete_failed', error.message, 'CVList');
    } finally {
      setDeleting(false);
      setDeleteModal({ isOpen: false, cvId: null, isBulk: false });
    }
  };

  const openDeleteModal = (cvId = null, isBulk = false) => {
    setDeleteModal({ isOpen: true, cvId, isBulk });
  };

  const confirmDelete = async () => {
    if (deleteModal.isBulk) {
      await handleBulkDelete();
    } else {
      await handleDeleteCV(deleteModal.cvId);
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

    // Count custom field filters
    if (customFieldFilters) {
      Object.values(customFieldFilters).forEach(value => {
        if (value && value !== '') count++;
      });
    }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-dominant-50/30 to-secondary-50/30">
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
              <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary-900 font-heading">CV Library</h1>
                <p className="text-xs text-gray-600">Document Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title Banner */}
        <div className="mb-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-8 shadow-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 font-heading">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <FileText size={28} />
                </div>
                CV Library
              </h1>
              <p className="text-accent-100 text-lg">
                {filteredCvs.length} {filteredCvs.length === 1 ? 'CV' : 'CVs'} found
                {getActiveFilterCount() > 0 && ` • ${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} active`}
              </p>
              {userData?.teamAccess?.isTeamMember && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full border border-white/30">
                    <Users size={14} />
                    <span>Team Member View</span>
                  </div>
                  <span className="text-accent-100 text-xs">Viewing team owner's CVs</span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur hover:bg-white/30 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
            >
              <Upload size={20} />
              Upload CVs
            </button>
          </div>
        </div>

        {/* Mobile Upload Button */}
        <button
          onClick={() => navigate('/upload')}
          className="lg:hidden w-full mb-6 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-accent-500/30"
        >
          <Upload size={20} />
          Upload CVs
        </button>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-lg">
          {/* Job Spec Selector - Available for Basic, Professional, Enterprise */}
          {(canCreateJobSpecs(userData?.plan) || jobSpecs.length > 0) && (
            <div className="mb-6 pb-6 border-b-2 border-gray-100">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[280px]">
                  {matchingInProgress ? (
                    <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 size={16} className="animate-spin text-accent-500" />
                      <span>Calculating matches...</span>
                    </div>
                  ) : (
                    <CustomSelect
                      value={selectedJobSpec || ''}
                      onChange={(value) => handleJobSpecChange(value)}
                      options={[
                        { value: '', label: 'Match to Job Spec' },
                        ...jobSpecs.map(spec => ({
                          value: spec.id,
                          label: `${spec.title}${spec.department ? ` - ${spec.department}` : ''}`
                        }))
                      ]}
                      placeholder="Select a job specification..."
                    />
                  )}
                </div>
                {jobSpecs.length === 0 && canCreateJobSpecs(userData?.plan) && (
                  <button
                    onClick={() => navigate('/job-specs')}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all hover:scale-105 shadow-md border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <span>Create Job Spec</span>
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

          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-md">
                <Search className="text-white" size={18} />
              </div>
              <input
                type="text"
                placeholder="Search by filename, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none font-medium transition-all"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all hover:scale-105 shadow-md relative ${
                showFilters
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-accent-500/30'
                  : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={20} />
              <span>Filters</span>
              {getActiveFilterCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>

            {/* Custom Fields Column Toggle */}
            {hasCustomFieldsAccess && customFieldConfigs && customFieldConfigs.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnPicker(!showColumnPicker)}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all hover:scale-105 shadow-md relative ${
                    showColumnPicker
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/30'
                      : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List size={20} />
                  <span>Columns</span>
                  {visibleCustomColumns.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                      {visibleCustomColumns.length}
                    </span>
                  )}
                </button>

                {/* Column Picker Dropdown */}
                {showColumnPicker && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-purple-200 rounded-xl shadow-2xl z-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-secondary-900 flex items-center gap-2 font-heading">
                        <List size={18} className="text-purple-500" />
                        Custom Columns
                      </h4>
                      <button
                        onClick={() => setShowColumnPicker(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Select which custom fields to show as columns in the table
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {customFieldConfigs.map(field => (
                        <label
                          key={field.id}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={visibleCustomColumns.includes(field.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVisibleCustomColumns([...visibleCustomColumns, field.name]);
                              } else {
                                setVisibleCustomColumns(visibleCustomColumns.filter(n => n !== field.name));
                              }
                            }}
                            className="w-4 h-4 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">
                              {field.label}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({field.type})
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {visibleCustomColumns.length > 0 && (
                      <button
                        onClick={() => setVisibleCustomColumns([])}
                        className="mt-3 w-full text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upgrade Prompt Modal */}
          {showUpgradePrompt && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                    <Award className="text-accent-500" size={24} />
                  </div>
                  <button
                    onClick={() => setShowUpgradePrompt(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-secondary-900 mb-2 font-heading">
                  Upgrade to Premium
                </h3>
                <p className="text-gray-600 mb-4">
                  CV matching with job specifications is a premium feature. Upgrade your plan to unlock this powerful tool.
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors font-medium"
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
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-100 text-accent-700 text-xs rounded-full">
                  Status: {filters.status}
                  <button onClick={() => setFilters({ ...filters, status: 'all' })} className="hover:bg-accent-200 rounded-full p-0.5">
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
                  className="text-xs text-gray-600 hover:text-accent-500 underline"
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
              <div className="p-4 bg-gradient-to-r from-accent-50 to-amber-50 border border-accent-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Showing {filteredCvs.length} of {cvs.length} CVs
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {getActiveFilterCount() > 0 ? `${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} active` : 'No filters applied'}
                    </p>
                  </div>
                  <Filter className="text-accent-500" size={24} />
                </div>
              </div>

              {/* Basic Filters - Always Visible */}
              <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-accent-500" />
                  Quick Filters
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <CustomSelect
                      value={filters.status}
                      onChange={(value) => setFilters({ ...filters, status: value })}
                      options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'processing', label: 'Processing' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'error', label: 'Error' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
                    <CustomSelect
                      value={filters.fileType}
                      onChange={(value) => setFilters({ ...filters, fileType: value })}
                      options={[
                        { value: 'all', label: 'All Types' },
                        { value: 'pdf', label: 'PDF' },
                        { value: 'word', label: 'Word' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-accent-400 outline-none transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-accent-400 outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Demographic Filters - Collapsible */}
              <div className={`border border-gray-200 rounded-lg ${expandedSections.demographic ? 'overflow-visible' : 'overflow-hidden'}`}>
                <button
                  onClick={() => toggleSection('demographic')}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-purple-500" />
                    <h3 className="text-sm font-semibold text-secondary-900 font-heading">Demographic Filters</h3>
                    {(filters.gender !== 'all' || filters.ageMin || filters.ageMax || filters.race !== 'all') && (
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  {expandedSections.demographic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.demographic && (
                  <div className="p-6 bg-white">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <CustomSelect
                      value={filters.gender}
                      onChange={(value) => setFilters({ ...filters, gender: value })}
                      options={[
                        { value: 'all', label: 'All Genders' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'non-binary', label: 'Non-Binary' },
                        { value: 'prefer-not-to-say', label: 'Prefer Not to Say' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age Min</label>
                    <input
                      type="number"
                      placeholder="Min age"
                      value={filters.ageMin}
                      onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-accent-400 outline-none transition-colors text-sm"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-accent-400 outline-none transition-colors text-sm"
                      min="18"
                      max="99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Race/Ethnicity</label>
                    <CustomSelect
                      value={filters.race}
                      onChange={(value) => setFilters({ ...filters, race: value })}
                      options={[
                        { value: 'all', label: 'All Races' },
                        { value: 'african', label: 'African' },
                        { value: 'coloured', label: 'Coloured' },
                        { value: 'indian', label: 'Indian' },
                        { value: 'white', label: 'White' },
                        { value: 'asian', label: 'Asian' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                  </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Filters - Collapsible */}
              <div className={`border border-gray-200 rounded-lg ${expandedSections.professional ? 'overflow-visible' : 'overflow-hidden'}`}>
                <button
                  onClick={() => toggleSection('professional')}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-green-500" />
                    <h3 className="text-sm font-semibold text-secondary-900 font-heading">Professional Filters</h3>
                    {(filters.location || filters.skills || filters.experienceYears !== 'all') && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  {expandedSections.professional ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.professional && (
                  <div className="p-6 bg-white">
                    <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="e.g., Cape Town, Johannesburg"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-accent-400 outline-none transition-colors text-sm placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    <input
                      type="text"
                      placeholder="e.g., React, Python, Java"
                      value={filters.skills}
                      onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-accent-400 outline-none transition-colors text-sm placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Separate multiple skills with commas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                    <CustomSelect
                      value={filters.experienceYears}
                      onChange={(value) => setFilters({ ...filters, experienceYears: value })}
                      options={[
                        { value: 'all', label: 'All Experience Levels' },
                        { value: '0-2', label: 'Entry Level (0-2 years)' },
                        { value: '3-5', label: 'Mid Level (3-5 years)' },
                        { value: '6-10', label: 'Senior (6-10 years)' },
                        { value: '10+', label: 'Expert (10+ years)' },
                      ]}
                    />
                  </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Fields Filters - Collapsible */}
              {hasCustomFieldsAccess && customFieldConfigs && customFieldConfigs.length > 0 && (
                <div className={`border border-gray-200 rounded-lg ${expandedSections.custom ? 'overflow-visible' : 'overflow-hidden'}`}>
                  <button
                    onClick={() => toggleSection('custom')}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <List size={16} className="text-purple-500" />
                      <h3 className="text-sm font-semibold text-secondary-900 font-heading">Custom Fields</h3>
                      {customFieldFilters && Object.values(customFieldFilters).some(v => v !== '') && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    {expandedSections.custom ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {expandedSections.custom && (
                    <div className="p-6 bg-white">
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {customFieldConfigs.map(field => (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {field.label}
                              <span className="text-xs text-gray-500 ml-1">({field.type})</span>
                            </label>
                            {field.type === 'boolean' ? (
                              <CustomSelect
                                value={(customFieldFilters && customFieldFilters[field.name]) || ''}
                                onChange={(value) => setCustomFieldFilters({ ...(customFieldFilters || {}), [field.name]: value })}
                                options={[
                                  { value: '', label: 'All' },
                                  { value: 'true', label: 'Yes' },
                                  { value: 'false', label: 'No' }
                                ]}
                              />
                            ) : field.type === 'select' ? (
                              <CustomSelect
                                value={(customFieldFilters && customFieldFilters[field.name]) || ''}
                                onChange={(value) => setCustomFieldFilters({ ...(customFieldFilters || {}), [field.name]: value })}
                                options={[
                                  { value: '', label: 'All' },
                                  ...(field.options || []).map(opt => ({ value: opt, label: opt }))
                                ]}
                              />
                            ) : field.type === 'date' ? (
                              <input
                                type="date"
                                value={(customFieldFilters && customFieldFilters[field.name]) || ''}
                                onChange={(e) => setCustomFieldFilters({ ...(customFieldFilters || {}), [field.name]: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-accent-400 outline-none transition-colors text-sm"
                              />
                            ) : (
                              <input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={(customFieldFilters && customFieldFilters[field.name]) || ''}
                                onChange={(e) => setCustomFieldFilters({ ...(customFieldFilters || {}), [field.name]: e.target.value })}
                                placeholder={`Filter by ${field.label.toLowerCase()}`}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-accent-400 outline-none transition-colors text-sm placeholder-gray-400"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Advanced Options - Collapsible */}
              <div className={`border border-gray-200 rounded-lg ${expandedSections.advanced ? 'overflow-visible' : 'overflow-hidden'}`}>
                <button
                  onClick={() => toggleSection('advanced')}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-blue-500" />
                    <h3 className="text-sm font-semibold text-secondary-900 font-heading">Advanced Options</h3>
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
                      className="w-4 h-4 text-accent-500 border-gray-300 rounded focus:ring-accent-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-accent-500 transition-colors">
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
                      className="w-4 h-4 text-accent-500 border-gray-300 rounded focus:ring-accent-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-accent-500 transition-colors">
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
          <div className="bg-gradient-to-r from-accent-50 to-accent-100 border-2 border-accent-200 rounded-2xl p-6 mb-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-md">
                <Check className="text-white" size={24} />
              </div>
              <span className="text-accent-900 font-bold text-lg">
                {selectedCvs.length} CV{selectedCvs.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Only show delete button for Owner and Admin, not Members */}
              {(!userData?.teamAccess?.isTeamMember || userData?.teamAccess?.role === 'admin') && (
                <button
                  onClick={() => openDeleteModal(null, true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-red-500/30"
                >
                  <Trash2 size={18} />
                  <span>Delete Selected</span>
                </button>
              )}
              <button
                onClick={() => setSelectedCvs([])}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-accent-500 animate-spin" size={48} />
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
              className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            >
              Upload CVs
            </button>
          </div>
        )}

        {/* No Results State */}
        {!loading && cvs.length > 0 && filteredCvs.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="text-white" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-2 font-heading">No CVs found</h3>
            <p className="text-gray-600 mb-8 text-lg">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({
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
                });
                setSelectedJobSpec(null);
                setCustomFieldFilters({});
              }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-accent-500/30"
            >
              <X size={20} />
              Clear all filters
            </button>
          </div>
        )}

        {/* CV List Table */}
        {!loading && filteredCvs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            {/* Top Scrollbar - Orange */}
            <div
              ref={topScrollerRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-thin"
              style={{
                height: '8px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#3B82F6 transparent'
              }}
              onScroll={(e) => {
                if (tableContainerRef.current) {
                  tableContainerRef.current.scrollLeft = e.target.scrollLeft;
                }
              }}
            >
              <div style={{ width: 'fit-content', minWidth: '100%', height: '1px' }}>
                {/* Spacer to create scrollable area matching table width */}
              </div>
            </div>

            <div
              ref={tableContainerRef}
              className="overflow-x-auto table-container-no-scrollbar"
              onScroll={(e) => {
                if (topScrollerRef.current) {
                  topScrollerRef.current.scrollLeft = e.target.scrollLeft;
                }
              }}
            >
              <table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-gray-50 to-accent-50/30 border-b-2 border-gray-100">
                <tr>
                  <th className="sticky left-0 z-20 bg-gradient-to-r from-gray-50 to-accent-50/30 px-6 py-4 text-left border-r border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedCvs.length === filteredCvs.length}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-accent-500 rounded-lg focus:ring-accent-500 focus:ring-2"
                    />
                  </th>
                  <th className="sticky left-[72px] z-20 bg-gradient-to-r from-gray-50 to-accent-50/30 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[280px]">
                    File Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Uploaded
                  </th>
                  {selectedJobSpec && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Match Score
                    </th>
                  )}
                  {/* Custom Field Columns */}
                  {visibleCustomColumns.map(fieldName => {
                    const field = customFieldConfigs.find(f => f.name === fieldName);
                    return field ? (
                      <th key={fieldName} className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider min-w-[180px]">
                        {field.label}
                      </th>
                    ) : null;
                  })}
                  <th className="sticky right-0 z-20 bg-gradient-to-r from-gray-50 to-accent-50/30 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200 min-w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCvs.map((cv) => (
                  <tr key={cv.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-accent-50/30 transition-all group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-gradient-to-r group-hover:from-gray-50 group-hover:to-accent-50/30 px-6 py-4 border-r border-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedCvs.includes(cv.id)}
                        onChange={() => handleSelectCV(cv.id)}
                        className="w-4 h-4 text-accent-500 rounded focus:ring-accent-500"
                      />
                    </td>
                    <td className="sticky left-[72px] z-10 bg-white group-hover:bg-gradient-to-r group-hover:from-gray-50 group-hover:to-accent-50/30 px-6 py-4 border-r border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="text-accent-500" size={20} />
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
                        <div className="flex items-center gap-2">
                          {getMatchScoreBadge(getMatchScore(cv))}
                          {getMatchScore(cv) !== null && (
                            <button
                              onClick={() => setMatchReportCV(cv)}
                              className="p-1.5 text-gray-600 hover:text-accent-500 hover:bg-accent-50 rounded-lg transition-colors"
                              title="View Match Breakdown"
                            >
                              <FileBarChart size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    {/* Custom Field Cells */}
                    {visibleCustomColumns.map(fieldName => {
                      const field = customFieldConfigs.find(f => f.name === fieldName);
                      if (!field) return null; // Field config not found, skip rendering
                      const value = cv.customFields?.[fieldName];
                      return (
                        <td key={fieldName} className="px-6 py-4 text-sm">
                          {value !== undefined && value !== null && value !== '' ? (
                            field?.type === 'boolean' ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {value ? (
                                  <>
                                    <Check size={12} className="mr-1" />
                                    Yes
                                  </>
                                ) : (
                                  <>
                                    <X size={12} className="mr-1" />
                                    No
                                  </>
                                )}
                              </span>
                            ) : field?.type === 'date' ? (
                              <span className="text-gray-700">
                                {new Date(value).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-gray-700 font-medium">
                                {String(value)}
                              </span>
                            )
                          ) : (
                            <span className="text-gray-400 italic text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 bg-white group-hover:bg-gradient-to-r group-hover:from-gray-50 group-hover:to-accent-50/30 px-6 py-4 border-l border-gray-100">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/cv/${cv.id}`)}
                          className="p-2 text-gray-600 hover:text-accent-500 hover:bg-accent-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <a
                          href={cv.downloadURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:text-accent-500 hover:bg-accent-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                        {/* Only show delete button for Owner and Admin, not Members */}
                        {(!userData?.teamAccess?.isTeamMember || userData?.teamAccess?.role === 'admin') && (
                          <button
                            onClick={() => openDeleteModal(cv.id, false)}
                            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, cvId: null, isBulk: false })}
        onConfirm={confirmDelete}
        title={deleteModal.isBulk ? 'Delete Multiple CVs' : 'Delete CV'}
        message={
          deleteModal.isBulk
            ? `Are you sure you want to delete ${selectedCvs.length} CV(s)? This action cannot be undone.`
            : 'Are you sure you want to delete this CV? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        confirmLoading={deleting}
      />

      {/* Match Breakdown Report */}
      {matchReportCV && selectedJobSpec && (
        <MatchBreakdownReport
          cv={matchReportCV}
          jobSpec={jobSpecs.find(spec => spec.id === selectedJobSpec)}
          matchScore={getMatchScore(matchReportCV)}
          onClose={() => setMatchReportCV(null)}
        />
      )}
    </div>
  );
}