import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../js/firebase-config';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Download,
  Trash2,
  FileText,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Loader2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  List,
  Edit2,
  Save,
  X
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { hasFeatureAccess } from '../config/planConfig';

export default function CVDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const toast = useToast();

  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [retryModal, setRetryModal] = useState(false);

  // Custom fields state
  const [customFieldConfigs, setCustomFieldConfigs] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [editingCustomFields, setEditingCustomFields] = useState(false);
  const [savingCustomFields, setSavingCustomFields] = useState(false);

  const userPlan = userData?.plan || 'free';
  const hasCustomFieldsAccess = hasFeatureAccess(userPlan, 'customFields');

  useEffect(() => {
    fetchCVDetail();
    if (hasCustomFieldsAccess) {
      loadCustomFieldConfigs();
    }
  }, [id, hasCustomFieldsAccess]);

  const fetchCVDetail = async () => {
    try {
      setLoading(true);

      // Check if user is a team member
      const isTeamMember = userData?.teamAccess?.isTeamMember;

      if (isTeamMember) {
        // Team members: use Cloud Function to access owner's CVs
        const getTeamCV = httpsCallable(functions, 'getTeamCV');
        const result = await getTeamCV({ cvId: id });

        if (result.data.success && result.data.cv) {
          const cvData = {
            ...result.data.cv,
            uploadedAt: result.data.cv.uploadedAt?.toDate?.() ||
                        (result.data.cv.uploadedAt?._seconds ? new Date(result.data.cv.uploadedAt._seconds * 1000) : new Date())
          };
          setCv(cvData);

          // Load custom field values
          if (cvData.customFields) {
            setCustomFieldValues(cvData.customFields);
          }
        } else {
          setError('CV not found');
        }
      } else {
        // Owner: direct Firestore access
        const cvDoc = await getDoc(doc(db, 'cvs', id));

        if (cvDoc.exists()) {
          const cvData = {
            id: cvDoc.id,
            ...cvDoc.data(),
            uploadedAt: cvDoc.data().uploadedAt?.toDate() || new Date()
          };
          setCv(cvData);

          // Load custom field values
          if (cvData.customFields) {
            setCustomFieldValues(cvData.customFields);
          }
        } else {
          setError('CV not found');
        }
      }
    } catch (err) {
      console.error('Error fetching CV:', err);
      setError('Failed to load CV details');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomFieldConfigs = async () => {
    if (!currentUser) return;

    try {
      const configDoc = await getDoc(doc(db, 'customFieldConfigs', currentUser.uid));
      if (configDoc.exists()) {
        setCustomFieldConfigs(configDoc.data().fields || []);
      }
    } catch (err) {
      console.error('Error loading custom field configs:', err);
    }
  };

  const handleSaveCustomFields = async () => {
    try {
      setSavingCustomFields(true);

      await updateDoc(doc(db, 'cvs', id), {
        customFields: customFieldValues
      });

      // Update local state
      setCv(prev => ({ ...prev, customFields: customFieldValues }));

      toast.success('Custom fields saved successfully');
      setEditingCustomFields(false);
    } catch (err) {
      console.error('Error saving custom fields:', err);
      toast.error('Failed to save custom fields');
    } finally {
      setSavingCustomFields(false);
    }
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Use Cloud Function for deletion (handles both owner and team member cases)
      const deleteCV = httpsCallable(functions, 'deleteCV');
      const result = await deleteCV({ cvId: id });

      if (result.data.success) {
        toast.success('CV deleted successfully');

        // Navigate back to CV list after brief delay
        setTimeout(() => {
          navigate('/cvs');
        }, 1000);
      } else {
        throw new Error(result.data.message || 'Failed to delete CV');
      }
    } catch (err) {
      console.error('Error deleting CV:', err);
      toast.error('Failed to delete CV. Please try again.');
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const handleRetryParsing = async () => {
    try {
      setRetrying(true);
      setRetryModal(false);

      // Call the Cloud Function to retry parsing
      const retryParsingFunction = httpsCallable(functions, 'retryParsing');
      const result = await retryParsingFunction({ cvId: id });

      console.log('Retry result:', result.data);

      toast.success('CV reprocessing initiated! Refreshing data...');

      // Refresh the CV data after a short delay
      setTimeout(() => {
        fetchCVDetail();
        setRetrying(false);
      }, 2000);
    } catch (err) {
      console.error('Error retrying CV parsing:', err);
      toast.error('Failed to retry parsing. Please try again.');
      setRetrying(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="text-orange-500 animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <button
            onClick={() => navigate('/cvs')}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            ← Back to CV List
          </button>
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
              onClick={() => navigate('/cvs')}
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to CV List</span>
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* CV Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="text-orange-500" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{cv.fileName}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>{formatDate(cv.uploadedAt)}</span>
                  </div>
                  <span>•</span>
                  <span>{formatFileSize(cv.fileSize)}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cv.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : cv.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cv.status || 'Processing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <a
                href={cv.downloadURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={18} />
                <span className="font-medium">Download</span>
              </a>
              {(cv.status === 'error' || !cv.parsed) && (
                <button
                  onClick={() => setRetryModal(true)}
                  disabled={retrying}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retrying ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Retrying...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      <span>Retry Parsing</span>
                    </>
                  )}
                </button>
              )}
              {/* Only show delete button for Owner and Admin, not Members */}
              {(!userData?.teamAccess?.isTeamMember || userData?.teamAccess?.role === 'admin') && (
                <button
                  onClick={() => setDeleteModal(true)}
                  disabled={deleting}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* View Original Button */}
          <a
            href={cv.downloadURL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-orange-500 hover:text-orange-600 font-medium"
          >
            <ExternalLink size={16} />
            <span>View Original Document</span>
          </a>
        </div>

        {/* CV Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            {cv.metadata && (cv.metadata.name || cv.metadata.email || cv.metadata.phone) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <User size={20} className="text-orange-500" />
                  <span>Personal Information</span>
                </h2>
                
                <div className="space-y-3">
                  {cv.metadata.name && (
                    <div className="flex items-start space-x-3">
                      <User size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                        <p className="text-gray-900 font-medium">{cv.metadata.name}</p>
                      </div>
                    </div>
                  )}

                  {cv.metadata.email && (
                    <div className="flex items-start space-x-3">
                      <Mail size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <a 
                          href={`mailto:${cv.metadata.email}`}
                          className="text-gray-900 font-medium hover:text-orange-500"
                        >
                          {cv.metadata.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {cv.metadata.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <a 
                          href={`tel:${cv.metadata.phone}`}
                          className="text-gray-900 font-medium hover:text-orange-500"
                        >
                          {cv.metadata.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {cv.metadata.location && (
                    <div className="flex items-start space-x-3">
                      <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="text-gray-900 font-medium">{cv.metadata.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {cv.metadata?.skills && cv.metadata.skills.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Award size={20} className="text-orange-500" />
                  <span>Skills</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cv.metadata.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {cv.metadata?.experience && cv.metadata.experience.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Briefcase size={20} className="text-orange-500" />
                  <span>Work Experience</span>
                </h2>
                <div className="space-y-4">
                  {cv.metadata.experience.map((exp, idx) => (
                    <div key={idx} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                      <h3 className="font-bold text-gray-900 mb-1">{exp.title || exp.position}</h3>
                      <p className="text-gray-700 mb-1">{exp.company}</p>
                      {exp.duration && (
                        <p className="text-sm text-gray-500 mb-2">{exp.duration}</p>
                      )}
                      {exp.description && (
                        <p className="text-sm text-gray-600">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cv.metadata?.education && cv.metadata.education.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <GraduationCap size={20} className="text-orange-500" />
                  <span>Education</span>
                </h2>
                <div className="space-y-4">
                  {cv.metadata.education.map((edu, idx) => (
                    <div key={idx} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                      <h3 className="font-bold text-gray-900 mb-1">{edu.degree || edu.qualification}</h3>
                      <p className="text-gray-700 mb-1">{edu.institution || edu.school}</p>
                      {edu.year && (
                        <p className="text-sm text-gray-500">{edu.year}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {cv.status === 'error' && cv.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 mb-2">Processing Error</h3>
                    <p className="text-sm text-red-800 mb-3 whitespace-pre-wrap">
                      {cv.errorMessage}
                    </p>
                    {cv.errorMessage.includes('Pages format') && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                        <p className="text-xs font-semibold text-gray-900 mb-1">How to fix this:</p>
                        <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                          <li>Open your CV in Apple Pages</li>
                          <li>Go to <strong>File → Export To → PDF</strong></li>
                          <li>Save the PDF and upload it to CVSift</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No Parsed Data Message */}
            {cv.status !== 'error' && (!cv.metadata || (!cv.metadata.name && !cv.metadata.email && !cv.metadata.skills?.length && !cv.metadata.experience?.length && !cv.metadata.education?.length)) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-1">CV Processing</h3>
                    <p className="text-sm text-yellow-800">
                      This CV is still being processed. Extracted information will appear here once processing is complete.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* File Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">File Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">File Type</p>
                  <p className="text-gray-900 font-medium uppercase">
                    {cv.fileType?.split('/')[1] || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">File Size</p>
                  <p className="text-gray-900 font-medium">{formatFileSize(cv.fileSize)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Uploaded</p>
                  <p className="text-gray-900 font-medium">{formatDate(cv.uploadedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Status</p>
                  <p className="text-gray-900 font-medium capitalize">{cv.status || 'Processing'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Parsed</p>
                  <p className="text-gray-900 font-medium">{cv.parsed ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Custom Fields */}
            {hasCustomFieldsAccess && customFieldConfigs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <List size={20} className="text-purple-500" />
                    <span>Custom Fields</span>
                  </h2>
                  {!editingCustomFields ? (
                    <button
                      onClick={() => setEditingCustomFields(true)}
                      className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center space-x-1"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingCustomFields(false);
                          setCustomFieldValues(cv.customFields || {});
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center space-x-1"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSaveCustomFields}
                        disabled={savingCustomFields}
                        className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center space-x-1 disabled:opacity-50"
                      >
                        {savingCustomFields ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {customFieldConfigs.map((field) => {
                    // Check conditional logic
                    if (field.conditionalOn) {
                      const conditionalValue = customFieldValues[field.conditionalOn];
                      if (conditionalValue !== field.conditionalValue) {
                        return null; // Hide field if condition not met
                      }
                    }

                    return (
                    <div key={field.id}>
                      <label className="block text-xs text-gray-500 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {editingCustomFields ? (
                        <>
                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={customFieldValues[field.name] || ''}
                              onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          )}
                          {field.type === 'number' && (
                            <input
                              type="number"
                              value={customFieldValues[field.name] || ''}
                              onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          )}
                          {field.type === 'date' && (
                            <input
                              type="date"
                              value={customFieldValues[field.name] || ''}
                              onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                          {field.type === 'boolean' && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={customFieldValues[field.name] === true}
                                onChange={(e) => handleCustomFieldChange(field.name, e.target.checked)}
                                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-700">
                                {customFieldValues[field.name] ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}
                          {field.type === 'select' && (
                            <select
                              value={customFieldValues[field.name] || ''}
                              onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              <option value="">Select {field.label.toLowerCase()}</option>
                              {field.options?.map((option, idx) => (
                                <option key={idx} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-900 font-medium text-sm">
                          {customFieldValues[field.name] !== undefined && customFieldValues[field.name] !== null && customFieldValues[field.name] !== ''
                            ? field.type === 'boolean'
                              ? customFieldValues[field.name] ? 'Yes' : 'No'
                              : customFieldValues[field.name]
                            : <span className="text-gray-400 italic">Not set</span>
                          }
                        </p>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <a
                  href={cv.downloadURL}
                  download
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <Download size={18} />
                  <span className="font-medium">Download CV</span>
                </a>
                <button
                  onClick={() => navigate('/cvs')}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <FileText size={18} />
                  <span className="font-medium">View All CVs</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete CV"
        message="Are you sure you want to delete this CV? This action cannot be undone and will permanently remove all associated data."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        confirmLoading={deleting}
      />

      {/* Retry Parsing Confirmation Dialog */}
      <ConfirmDialog
        isOpen={retryModal}
        onClose={() => setRetryModal(false)}
        onConfirm={handleRetryParsing}
        title="Retry CV Parsing"
        message="This will reprocess the CV document with Claude AI. The process may take a few moments. Do you want to continue?"
        confirmText="Retry Parsing"
        cancelText="Cancel"
        type="info"
        icon={RefreshCw}
        confirmLoading={retrying}
      />
    </div>
  );
}