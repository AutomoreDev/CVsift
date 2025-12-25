import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../js/firebase-config';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Edit2, Trash2, MapPin, Calendar, Users, Award, Code, GraduationCap, ArrowLeft, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { canCreateJobSpecs, getJobSpecLimit } from '../config/planConfig';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { trackJobSpecCreate, trackJobSpecUpdate, trackJobSpecDelete, trackError } from '../utils/analytics';

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
        <span className={`text-sm ${!value || value === '' || value === 'any' ? 'text-gray-500' : 'text-secondary-900 font-medium'}`}>
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

export default function JobSpecs() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [jobSpecs, setJobSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, specId: null });
  const [deleting, setDeleting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    requirements: true,
    demographic: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    locationType: 'onsite',
    department: '',
    minExperience: '',
    maxExperience: '',
    requiredSkills: '',
    preferredSkills: '',
    education: '',
    gender: 'any',
    race: 'any',
    minAge: '',
    maxAge: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    if (!currentUser || !userData) return;
    loadJobSpecs();
  }, [currentUser, userData]);

  const loadJobSpecs = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const teamAccess = userData?.teamAccess;
      let specs = [];

      // For team members, use Cloud Function to bypass security rules
      if (teamAccess?.isTeamMember && teamAccess?.teamOwnerId) {
        console.log('Fetching team job specs via Cloud Function');
        const functions = getFunctions();
        const getTeamJobSpecs = httpsCallable(functions, 'getTeamJobSpecs');

        const result = await getTeamJobSpecs();

        if (result.data.success) {
          specs = result.data.jobSpecs;
          console.log('Team job specs fetched:', specs.length);
        }
      } else {
        // Owner or solo user - fetch their own job specs directly
        console.log('Loading job specs for user:', currentUser.uid);

        try {
          const specsQuery = query(
            collection(db, 'jobSpecs'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );

          const snapshot = await getDocs(specsQuery);
          specs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          // If index error, try without orderBy
          if (error.code === 'failed-precondition' || error.message.includes('index')) {
            const simpleQuery = query(
              collection(db, 'jobSpecs'),
              where('userId', '==', currentUser.uid)
            );
            const snapshot = await getDocs(simpleQuery);
            specs = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            // Sort in memory
            specs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          } else {
            throw error;
          }
        }
      }

      setJobSpecs(specs);
    } catch (error) {
      console.error('Error loading job specs:', error);
      alert(`Error loading job specs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (!userData || !canCreateJobSpecs(userData?.plan)) {
      setShowUpgradePrompt(true);
      return;
    }

    // Check if user has reached their job spec limit
    const jobSpecLimit = getJobSpecLimit(userData?.plan);
    if (jobSpecLimit !== -1 && jobSpecs.length >= jobSpecLimit) {
      toast.error(`You've reached your plan's limit of ${jobSpecLimit} job specifications. Upgrade your plan to create more.`);
      setShowUpgradePrompt(true);
      return;
    }

    setEditingSpec(null);
    setFormData({
      title: '',
      location: '',
      locationType: 'onsite',
      department: '',
      minExperience: '',
      maxExperience: '',
      requiredSkills: '',
      preferredSkills: '',
      education: '',
      gender: 'any',
      race: 'any',
      minAge: '',
      maxAge: '',
      description: '',
      isActive: true
    });
    setShowForm(true);
  };

  const handleEdit = (spec) => {
    setEditingSpec(spec);
    setFormData({
      title: spec.title || '',
      location: spec.location || '',
      locationType: spec.locationType || 'onsite',
      department: spec.department || '',
      minExperience: spec.minExperience || '',
      maxExperience: spec.maxExperience || '',
      requiredSkills: Array.isArray(spec.requiredSkills) ? spec.requiredSkills.join(', ') : '',
      preferredSkills: Array.isArray(spec.preferredSkills) ? spec.preferredSkills.join(', ') : '',
      education: spec.education || '',
      gender: spec.gender || 'any',
      race: spec.race || 'any',
      minAge: spec.minAge || '',
      maxAge: spec.maxAge || '',
      description: spec.description || '',
      isActive: spec.isActive !== false
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Use Cloud Function for deletion (handles both owner and team member cases)
      const functions = getFunctions();
      const deleteJobSpec = httpsCallable(functions, 'deleteJobSpec');
      const result = await deleteJobSpec({ jobSpecId: deleteModal.specId });

      if (result.data.success) {
        setJobSpecs(jobSpecs.filter(spec => spec.id !== deleteModal.specId));
        toast.success('Job specification deleted successfully');

        // Track job spec deletion
        trackJobSpecDelete();
      } else {
        throw new Error(result.data.message || 'Failed to delete job specification');
      }
    } catch (error) {
      console.error('Error deleting job spec:', error);
      toast.error('Failed to delete job specification');

      // Track deletion error
      trackError('job_spec_delete_failed', error.message, 'JobSpecs');
    } finally {
      setDeleting(false);
      setDeleteModal({ isOpen: false, specId: null });
    }
  };

  const openDeleteModal = (specId) => {
    setDeleteModal({ isOpen: true, specId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user can create job specs (Basic, Professional, Enterprise)
    if (!userData || !canCreateJobSpecs(userData?.plan)) {
      setShowUpgradePrompt(true);
      setShowForm(false);
      return;
    }

    try {
      // Determine effective user ID (team owner if team member, otherwise current user)
      const teamAccess = userData?.teamAccess;
      const effectiveUserId = teamAccess?.isTeamMember && teamAccess?.teamOwnerId
        ? teamAccess.teamOwnerId
        : currentUser.uid;

      const specData = {
        userId: effectiveUserId,
        createdBy: currentUser.uid, // Track who actually created it
        createdByEmail: currentUser.email,
        createdByName: currentUser.displayName || currentUser.email,
        title: formData.title,
        location: formData.location,
        locationType: formData.locationType,
        department: formData.department,
        minExperience: formData.minExperience ? parseInt(formData.minExperience) : null,
        maxExperience: formData.maxExperience ? parseInt(formData.maxExperience) : null,
        requiredSkills: formData.requiredSkills
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0),
        preferredSkills: formData.preferredSkills
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0),
        education: formData.education,
        gender: formData.gender,
        race: formData.race,
        minAge: formData.minAge ? parseInt(formData.minAge) : null,
        maxAge: formData.maxAge ? parseInt(formData.maxAge) : null,
        description: formData.description,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString()
      };

      if (editingSpec) {
        await updateDoc(doc(db, 'jobSpecs', editingSpec.id), specData);
        toast.success('Job specification updated successfully');

        // Track job spec update
        trackJobSpecUpdate(
          specData.requiredSkills.length,
          specData.minExperience || 0,
          specData.maxExperience || 0
        );

        // Log activity for job spec update
        try {
          const functions = getFunctions();
          const logJobSpecUpdate = httpsCallable(functions, 'logJobSpecUpdate');
          await logJobSpecUpdate({
            jobSpecId: editingSpec.id,
            jobSpecTitle: specData.title,
            userId: currentUser.uid,
            teamOwnerId: effectiveUserId
          });
        } catch (logError) {
          console.error('Error logging job spec update:', logError);
          // Don't fail the operation if logging fails
        }
      } else {
        specData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'jobSpecs'), specData);
        toast.success('Job specification created successfully');

        // Track job spec creation
        trackJobSpecCreate(
          specData.requiredSkills.length,
          specData.minExperience || 0,
          specData.maxExperience || 0
        );

        // Log activity for job spec creation
        try {
          const functions = getFunctions();
          const logJobSpecCreate = httpsCallable(functions, 'logJobSpecCreate');
          await logJobSpecCreate({
            jobSpecId: docRef.id,
            jobSpecTitle: specData.title,
            userId: currentUser.uid,
            teamOwnerId: effectiveUserId
          });
        } catch (logError) {
          console.error('Error logging job spec creation:', logError);
          // Don't fail the operation if logging fails
        }
      }

      setShowForm(false);
      loadJobSpecs();
    } catch (error) {
      console.error('Error saving job spec:', error);
      toast.error('Failed to save job specification: ' + error.message);

      // Track save error
      trackError('job_spec_save_failed', error.message, 'JobSpecs');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job specifications...</p>
        </div>
      </div>
    );
  }

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
                <Briefcase className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary-900 font-heading">Job Specifications</h1>
                <p className="text-xs text-gray-600">CV Matching Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-slideUp">
            <div className="p-6 border-b border-accent-200 bg-gradient-to-r from-accent-50 to-amber-50">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Award className="text-white" size={24} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 font-heading">
                    Upgrade to Premium
                  </h3>
                </div>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6 text-base leading-relaxed">
                Job Specifications with CV matching is a premium feature. Upgrade your plan to unlock more job specs:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="text-white" size={14} />
                  </div>
                  <span className="font-medium">Starter: 3 job specifications</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="text-white" size={14} />
                  </div>
                  <span className="font-medium">Basic: 10 job specifications</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl p-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="text-white" size={14} />
                  </div>
                  <span className="font-medium">Professional: 30 job specifications</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 bg-gradient-to-r from-accent-50 to-accent-100/50 rounded-xl p-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="text-white" size={14} />
                  </div>
                  <span className="font-medium">Business & Enterprise: Unlimited job specs</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="text-white" size={14} />
                  </div>
                  <span className="font-medium">AI-powered CV matching with fit scores</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="text-white" size={14} />
                  </div>
                  <span className="font-medium">Advanced filtering by match percentage</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="text-white" size={14} />
                  </div>
                  <span className="font-medium">Detailed match breakdown reports</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => navigate('/settings')}
                className="w-full py-3.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-accent-500/30"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Specs List */}
      {!showForm && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Title Banner */}
          <div className="mb-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-8 shadow-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 font-heading">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Briefcase size={28} />
                  </div>
                  Job Specifications
                </h1>
                <p className="text-accent-100 text-lg mb-2">
                  Create job specs to match CVs with AI-powered fit scores
                </p>
                {userData && canCreateJobSpecs(userData?.plan) && (
                  <div className="flex items-center gap-2 text-accent-100 text-sm">
                    <span className="font-semibold">
                      {jobSpecs.length} / {getJobSpecLimit(userData?.plan) === -1 ? 'Unlimited' : getJobSpecLimit(userData?.plan)} Job Specs Used
                    </span>
                  </div>
                )}
              </div>
              {/* Only show create button for Owner and Admin, not Members */}
              {(!userData?.teamAccess?.isTeamMember || userData?.teamAccess?.role === 'admin') && (
                <button
                  onClick={handleCreateNew}
                  className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur hover:bg-white/30 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                >
                  <Plus size={20} />
                  New Job Spec
                </button>
              )}
            </div>
          </div>

          {/* Mobile Create Button - Only for Owner and Admin */}
          {(!userData?.teamAccess?.isTeamMember || userData?.teamAccess?.role === 'admin') && (
            <button
              onClick={handleCreateNew}
              className="lg:hidden w-full mb-6 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-accent-500/30"
            >
              <Plus size={20} />
              New Job Spec
            </button>
          )}

          {jobSpecs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Briefcase className="text-white" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-2 font-heading">
                No Job Specifications Yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                {(!userData?.teamAccess?.isTeamMember || userData?.teamAccess?.role === 'admin')
                  ? 'Create your first job specification to start matching CVs with AI-powered fit scores'
                  : 'No job specifications available yet. Contact your team owner to create job specifications.'}
              </p>
              {/* Only show create button for Owner and Admin, not Members */}
              {(!userData?.teamAccess?.isTeamMember || userData?.teamAccess?.role === 'admin') && (
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-accent-500/30"
                >
                  <Plus size={24} />
                  Create Job Specification
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobSpecs.map((spec, index) => (
                <div
                  key={spec.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-secondary-900 mb-1 group-hover:text-accent-600 transition-colors font-heading">
                        {spec.title}
                      </h3>
                      {spec.department && (
                        <p className="text-sm text-gray-600 font-medium">{spec.department}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {spec.isActive ? (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full shadow-md">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {spec.location && (
                      <div className="flex items-center gap-3 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-accent-50/30 rounded-lg p-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                          <MapPin size={14} className="text-white" />
                        </div>
                        <span className="font-medium">{spec.location} <span className="text-gray-500">({spec.locationType})</span></span>
                      </div>
                    )}
                    {(spec.minExperience || spec.maxExperience) && (
                      <div className="flex items-center gap-3 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-accent-50/30 rounded-lg p-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <Calendar size={14} className="text-white" />
                        </div>
                        <span className="font-medium">
                          {spec.minExperience || 0} - {spec.maxExperience || '∞'} years experience
                        </span>
                      </div>
                    )}
                    {spec.education && (
                      <div className="flex items-center gap-3 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-accent-50/30 rounded-lg p-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                          <GraduationCap size={14} className="text-white" />
                        </div>
                        <span className="font-medium">{spec.education}</span>
                      </div>
                    )}
                    {spec.requiredSkills && spec.requiredSkills.length > 0 && (
                      <div className="flex items-start gap-3 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-accent-50/30 rounded-lg p-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                          <Code size={14} className="text-white" />
                        </div>
                        <span className="line-clamp-2 font-medium">
                          {spec.requiredSkills.slice(0, 3).join(', ')}
                          {spec.requiredSkills.length > 3 && ` +${spec.requiredSkills.length - 3} more`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Only show edit/delete buttons for Owner and Admin, not Members */}
                  {(!userData?.teamAccess?.isTeamMember || userData?.teamAccess?.role === 'admin') && (
                    <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                      <button
                        onClick={() => handleEdit(spec)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all font-semibold hover:scale-105"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(spec.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-xl hover:from-red-100 hover:to-red-200 transition-all font-semibold hover:scale-105"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job Spec Form */}
      {showForm && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-accent-500 to-accent-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-heading">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Briefcase size={20} className="text-white" />
                </div>
                {editingSpec ? 'Edit Job Specification' : 'Create New Job Specification'}
              </h2>
              <p className="text-accent-100 mt-2">
                Define requirements to match the perfect candidates
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Basic Information */}
              <div className={`border border-gray-200 rounded-lg ${expandedSections.basic ? 'overflow-visible' : 'overflow-hidden'}`}>
                <button
                  type="button"
                  onClick={() => toggleSection('basic')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-accent-50 to-amber-50 hover:from-accent-100 hover:to-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shadow-sm">
                      <Briefcase size={16} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 font-heading">Basic Information</h3>
                  </div>
                  {expandedSections.basic ? (
                    <ChevronUp size={20} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-600" />
                  )}
                </button>

                {expandedSections.basic && (
                  <div className="p-6 bg-gradient-to-br from-accent-50 to-amber-50">
                    <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300"
                      placeholder="e.g. Engineering & Technology"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 mt-5">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300"
                      placeholder="e.g. Tech City, California, United States"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Location Type
                    </label>
                    <CustomSelect
                      value={formData.locationType}
                      onChange={(value) => setFormData({ ...formData, locationType: value })}
                      options={[
                        { value: 'onsite', label: 'On-site' },
                        { value: 'remote', label: 'Remote' },
                        { value: 'hybrid', label: 'Hybrid' }
                      ]}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-semibold text-secondary-900 mb-2">
                    Job Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300 resize-none"
                    placeholder="Write clean, efficient, and well-documented code.&#10;&#10;Collaborate with cross-functional teams, including product management and design, to define and build new features."
                  />
                </div>
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div className={`border border-gray-200 rounded-lg ${expandedSections.requirements ? 'overflow-visible' : 'overflow-hidden'}`}>
                <button
                  type="button"
                  onClick={() => toggleSection('requirements')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                      <Award size={16} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 font-heading">Requirements</h3>
                  </div>
                  {expandedSections.requirements ? (
                    <ChevronUp size={20} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-600" />
                  )}
                </button>

                {expandedSections.requirements && (
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
                    <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Min. Experience (years)
                    </label>
                    <input
                      type="number"
                      name="minExperience"
                      value={formData.minExperience}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Max. Experience (years)
                    </label>
                    <input
                      type="number"
                      name="maxExperience"
                      value={formData.maxExperience}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300"
                      placeholder="12"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-semibold text-secondary-900 mb-2">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="requiredSkills"
                    value={formData.requiredSkills}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300"
                    placeholder="Python, Java, JavaScript, TypeScript, SQL, Django, Flask, Spring, React, Node.js, PostgreSQL, MongoDB"
                  />
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-semibold text-secondary-900 mb-2">
                    Preferred Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="preferredSkills"
                    value={formData.preferredSkills}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300"
                    placeholder="AWS, Docker, Kubernetes, CI/CD, Microservices"
                  />
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-semibold text-secondary-900 mb-2">
                    Education Level
                  </label>
                  <CustomSelect
                    value={formData.education}
                    onChange={(value) => setFormData({ ...formData, education: value })}
                    options={[
                      { value: '', label: 'Any' },
                      { value: 'High School', label: 'High School' },
                      { value: 'Associate Degree', label: 'Associate Degree' },
                      { value: "Bachelor's Degree", label: "Bachelor's Degree" },
                      { value: "Master's Degree", label: "Master's Degree" },
                      { value: 'Doctorate', label: 'Doctorate' }
                    ]}
                    placeholder="Select education level"
                  />
                </div>
                  </div>
                )}
              </div>

              {/* Demographic Preferences */}
              <div className={`border border-gray-200 rounded-lg ${expandedSections.demographic ? 'overflow-visible' : 'overflow-hidden'}`}>
                <button
                  type="button"
                  onClick={() => toggleSection('demographic')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                      <Users size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-secondary-900 font-heading">Demographic Preferences</h3>
                      <p className="text-xs text-gray-600">Optional filters for compliance requirements</p>
                    </div>
                  </div>
                  {expandedSections.demographic ? (
                    <ChevronUp size={20} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-600" />
                  )}
                </button>

                {expandedSections.demographic && (
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Gender Preference
                    </label>
                    <CustomSelect
                      value={formData.gender}
                      onChange={(value) => setFormData({ ...formData, gender: value })}
                      options={[
                        { value: 'any', label: 'Any' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Race Preference
                    </label>
                    <CustomSelect
                      value={formData.race}
                      onChange={(value) => setFormData({ ...formData, race: value })}
                      options={[
                        { value: 'any', label: 'Any' },
                        { value: 'african', label: 'African' },
                        { value: 'asian', label: 'Asian' },
                        { value: 'coloured', label: 'Coloured' },
                        { value: 'indian', label: 'Indian' },
                        { value: 'white', label: 'White' }
                      ]}
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 mt-5">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Min. Age
                    </label>
                    <input
                      type="number"
                      name="minAge"
                      value={formData.minAge}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300"
                      placeholder="18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Max. Age
                    </label>
                    <input
                      type="number"
                      name="maxAge"
                      value={formData.maxAge}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all placeholder-gray-400 hover:border-gray-300"
                      placeholder="65"
                    />
                  </div>
                </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 text-accent-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-accent-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-secondary-900 block">
                      Active Job Specification
                    </span>
                    <span className="text-xs text-gray-600">
                      Make this job spec available for CV matching
                    </span>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold hover:scale-[1.02] shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all font-semibold shadow-lg shadow-accent-500/30 hover:shadow-xl hover:scale-[1.02]"
                >
                  {editingSpec ? 'Update Job Specification' : 'Create Job Specification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, specId: null })}
        onConfirm={handleDelete}
        title="Delete Job Specification"
        message="Are you sure you want to delete this job specification? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        confirmLoading={deleting}
      />
    </div>
  );
}
