import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Edit2, Trash2, MapPin, Calendar, Users, Award, Code, GraduationCap, ArrowLeft, X, Check } from 'lucide-react';

export default function JobSpecs() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [jobSpecs, setJobSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

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
    loadJobSpecs();
  }, [currentUser]);

  const loadJobSpecs = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const specsQuery = query(
        collection(db, 'jobSpecs'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(specsQuery);
      const specs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setJobSpecs(specs);
    } catch (error) {
      console.error('Error loading job specs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (userData?.plan === 'free') {
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

  const handleDelete = async (specId) => {
    if (!window.confirm('Are you sure you want to delete this job specification?')) return;

    try {
      await deleteDoc(doc(db, 'jobSpecs', specId));
      setJobSpecs(jobSpecs.filter(spec => spec.id !== specId));
    } catch (error) {
      console.error('Error deleting job spec:', error);
      alert('Failed to delete job specification');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const specData = {
        userId: currentUser.uid,
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
      } else {
        specData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'jobSpecs'), specData);
      }

      setShowForm(false);
      loadJobSpecs();
    } catch (error) {
      console.error('Error saving job spec:', error);
      alert('Failed to save job specification');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job specifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="text-orange-500" />
                  Job Specifications
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Create job specs to match CVs with fit scores
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus size={20} />
              New Job Spec
            </button>
          </div>
        </div>
      </div>

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
              Job Specifications with CV matching is a premium feature. Upgrade your plan to unlock:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Create unlimited job specifications</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>AI-powered CV matching with fit scores</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Advanced filtering by match percentage</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Detailed match breakdown reports</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/settings')}
              className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Job Specs List */}
      {!showForm && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {jobSpecs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="text-orange-500" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Job Specifications Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first job specification to start matching CVs with fit scores
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus size={20} />
                Create Job Specification
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobSpecs.map(spec => (
                <div
                  key={spec.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {spec.title}
                      </h3>
                      {spec.department && (
                        <p className="text-sm text-gray-600">{spec.department}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {spec.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {spec.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{spec.location} ({spec.locationType})</span>
                      </div>
                    )}
                    {(spec.minExperience || spec.maxExperience) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span>
                          {spec.minExperience || 0} - {spec.maxExperience || '∞'} years exp.
                        </span>
                      </div>
                    )}
                    {spec.education && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap size={16} className="text-gray-400" />
                        <span>{spec.education}</span>
                      </div>
                    )}
                    {spec.requiredSkills && spec.requiredSkills.length > 0 && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Code size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {spec.requiredSkills.slice(0, 3).join(', ')}
                          {spec.requiredSkills.length > 3 && ` +${spec.requiredSkills.length - 3} more`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(spec)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(spec.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job Spec Form */}
      {showForm && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingSpec ? 'Edit Job Specification' : 'New Job Specification'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase size={18} className="text-orange-500" />
                  Basic Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g. Engineering"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g. Cape Town"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Type
                    </label>
                    <select
                      name="locationType"
                      value={formData.locationType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="onsite">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Brief description of the role..."
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award size={18} className="text-orange-500" />
                  Requirements
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min. Experience (years)
                    </label>
                    <input
                      type="number"
                      name="minExperience"
                      value={formData.minExperience}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max. Experience (years)
                    </label>
                    <input
                      type="number"
                      name="maxExperience"
                      value={formData.maxExperience}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="∞"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="requiredSkills"
                    value={formData.requiredSkills}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g. React, Node.js, PostgreSQL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="preferredSkills"
                    value={formData.preferredSkills}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g. AWS, Docker, Kubernetes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education Level
                  </label>
                  <select
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="High School">High School</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="Doctorate">Doctorate</option>
                  </select>
                </div>
              </div>

              {/* Demographic Preferences */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={18} className="text-orange-500" />
                  Demographic Preferences (Optional)
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender Preference
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="any">Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Race Preference
                    </label>
                    <select
                      name="race"
                      value={formData.race}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="any">Any</option>
                      <option value="african">African</option>
                      <option value="asian">Asian</option>
                      <option value="coloured">Coloured</option>
                      <option value="indian">Indian</option>
                      <option value="white">White</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min. Age
                    </label>
                    <input
                      type="number"
                      name="minAge"
                      value={formData.minAge}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max. Age
                    </label>
                    <input
                      type="number"
                      name="maxAge"
                      value={formData.maxAge}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="65"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="pt-6 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (available for CV matching)
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  {editingSpec ? 'Update Job Spec' : 'Create Job Spec'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
