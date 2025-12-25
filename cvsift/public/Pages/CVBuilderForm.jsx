import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { storage, db, functions } from '../js/firebase-config';
import {
  ArrowLeft,
  Save,
  Download,
  Plus,
  Trash2,
  Upload,
  User,
  Briefcase,
  GraduationCap,
  Zap,
  Award,
  Globe,
  Heart,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { DEFAULT_CV_DATA, LANGUAGE_PROFICIENCY, validateCVData } from '../lib/cvTemplates';
import { generateCVPDF, downloadPDF } from '../lib/pdfGenerator';

/**
 * CV Builder Form - Step 2: Data Entry
 * Allows users to fill in their CV information with live preview
 */
export default function CVBuilderForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  // Get template and color from previous step
  const { templateId = 'professional', accentColor = '#3B82F6' } = location.state || {};

  // Form data state
  const [cvData, setCvData] = useState(DEFAULT_CV_DATA);
  const [activeSection, setActiveSection] = useState('personalInfo');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (cvData.personalInfo.fullName || cvData.personalInfo.email) {
        handleSaveDraft(true); // Silent save
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [cvData]);

  // Handle image upload
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(['Please select a valid image file']);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(['Image size should be less than 5MB']);
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setCvData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          profileImage: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCvData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        profileImage: null
      }
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form field changes
  const handlePersonalInfoChange = (field, value) => {
    setCvData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleSummaryChange = (value) => {
    setCvData((prev) => ({ ...prev, summary: value }));
  };

  // Handle array field changes (experience, education, etc.)
  const handleArrayFieldChange = (section, index, field, value) => {
    setCvData((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAddArrayItem = (section) => {
    const newItem = { id: Date.now() };

    // Add default fields based on section
    if (section === 'experience') {
      Object.assign(newItem, {
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      });
    } else if (section === 'education') {
      Object.assign(newItem, {
        degree: '',
        institution: '',
        location: '',
        startDate: '',
        endDate: '',
        gpa: '',
        description: ''
      });
    } else if (section === 'skills') {
      Object.assign(newItem, { category: '', items: [] });
    } else if (section === 'certifications') {
      Object.assign(newItem, { name: '', issuer: '', date: '', url: '' });
    } else if (section === 'languages') {
      Object.assign(newItem, { language: '', proficiency: 'Professional' });
    } else if (section === 'awards') {
      Object.assign(newItem, { title: '', issuer: '', date: '', description: '' });
    } else if (section === 'portfolio') {
      Object.assign(newItem, { title: '', description: '', url: '', technologies: [] });
    }

    setCvData((prev) => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
  };

  const handleRemoveArrayItem = (section, index) => {
    setCvData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  // Handle skills (special case with array of items)
  const handleSkillsChange = (index, field, value) => {
    if (field === 'items') {
      // Convert comma-separated string to array
      const itemsArray = value.split(',').map(item => item.trim()).filter(Boolean);
      handleArrayFieldChange('skills', index, field, itemsArray);
    } else {
      handleArrayFieldChange('skills', index, field, value);
    }
  };

  // Handle interests (array of strings)
  const handleInterestsChange = (value) => {
    const interestsArray = value.split(',').map(item => item.trim()).filter(Boolean);
    setCvData((prev) => ({ ...prev, interests: interestsArray }));
  };

  // Handle resume upload and parsing
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrors(['Please upload a PDF or Word document']);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(['File size should be less than 5MB']);
      return;
    }

    setParsing(true);
    setErrors([]);

    try {
      // Upload to Firebase Storage
      const storagePath = `cv-builder/temp/${currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // Call Cloud Function to parse CV
      const parseCVForBuilder = httpsCallable(functions, 'parseCVForBuilder');
      const result = await parseCVForBuilder({
        fileUrl,
        storagePath,
        fileName: file.name
      });

      if (result.data.success && result.data.metadata) {
        const metadata = result.data.metadata;

        // Map parsed data to form structure
        const parsedData = {
          personalInfo: {
            fullName: metadata.name || '',
            email: metadata.email || '',
            phone: metadata.phone || '',
            location: metadata.location || '',
            visaStatus: cvData.personalInfo.visaStatus, // Keep existing
            linkedin: metadata.linkedin || '',
            website: metadata.portfolio || metadata.website || '',
            github: metadata.github || '',
            profileImage: cvData.personalInfo.profileImage // Keep existing
          },
          summary: metadata.summary || '',
          experience: metadata.experience?.map((exp, index) => ({
            id: Date.now() + index,
            jobTitle: exp.title || exp.position || '',
            company: exp.company || '',
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            current: exp.current || false,
            description: exp.description || exp.responsibilities?.join('\n') || ''
          })) || cvData.experience,
          education: metadata.education?.map((edu, index) => ({
            id: Date.now() + 1000 + index,
            degree: edu.degree || '',
            institution: edu.school || edu.institution || '',
            location: edu.location || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || '',
            gpa: edu.gpa || '',
            description: edu.description || ''
          })) || cvData.education,
          skills: metadata.skills?.length > 0 ? [{
            id: Date.now() + 2000,
            category: 'Technical Skills',
            items: Array.isArray(metadata.skills) ? metadata.skills : []
          }] : cvData.skills,
          certifications: metadata.certifications?.map((cert, index) => ({
            id: Date.now() + 3000 + index,
            name: cert.name || cert.title || '',
            issuer: cert.issuer || cert.organization || '',
            date: cert.date || cert.year || '',
            url: cert.url || ''
          })) || cvData.certifications,
          languages: metadata.languages?.map((lang, index) => ({
            id: Date.now() + 4000 + index,
            language: typeof lang === 'string' ? lang : lang.name || '',
            proficiency: lang.level || 'Professional'
          })) || cvData.languages,
          portfolio: cvData.portfolio, // Keep existing
          awards: cvData.awards, // Keep existing
          interests: metadata.interests || cvData.interests
        };

        setCvData(parsedData);
        setSuccessMessage('Resume parsed successfully! Review and edit the imported data.');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error('Failed to parse resume');
      }
    } catch (error) {
      console.error('Error parsing resume:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to parse resume. Please fill in the form manually.';

      if (error.code === 'functions/unauthenticated') {
        errorMessage = 'Authentication error. Please sign in again.';
      } else if (error.code === 'functions/not-found') {
        errorMessage = 'File not found. Please try uploading again.';
      } else if (error.code === 'functions/internal') {
        errorMessage = error.message || 'Internal error while parsing. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors([errorMessage]);
    } finally {
      setParsing(false);
      // Reset file input
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  // Save draft to Firestore
  const handleSaveDraft = async (silent = false) => {
    if (!currentUser) {
      setErrors(['You must be logged in to save a draft']);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      // Upload profile image to Firebase Storage if present
      let profileImageUrl = cvData.personalInfo.profileImage;

      if (imageFile) {
        const imageRef = ref(storage, `cv-builder/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        profileImageUrl = await getDownloadURL(imageRef);
      }

      // Prepare data for encryption
      const dataToSave = {
        ...cvData,
        personalInfo: {
          ...cvData.personalInfo,
          profileImage: profileImageUrl
        }
      };

      // Call Cloud Function to encrypt and save
      const saveCVBuilderData = httpsCallable(functions, 'saveCVBuilderData');
      const result = await saveCVBuilderData({
        cvData: dataToSave,
        templateId,
        accentColor
      });

      if (!silent) {
        setSuccessMessage('Draft saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!silent) {
        setErrors([error.message || 'Failed to save draft']);
      }
    } finally {
      setSaving(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    // Validate data
    const validation = validateCVData(cvData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setExporting(true);
    setErrors([]);

    try {
      // Upload profile image if present and not yet uploaded
      let finalCvData = { ...cvData };

      if (imageFile && currentUser) {
        const imageRef = ref(storage, `cv-builder/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        const profileImageUrl = await getDownloadURL(imageRef);

        finalCvData = {
          ...cvData,
          personalInfo: {
            ...cvData.personalInfo,
            profileImage: profileImageUrl
          }
        };
      }

      // Generate PDF
      const doc = await generateCVPDF(finalCvData, templateId, accentColor);

      // Download PDF
      const fileName = `${cvData.personalInfo.fullName || 'Resume'}_CV.pdf`;
      downloadPDF(doc, fileName);

      // Save to Firestore if user is logged in
      if (currentUser) {
        await handleSaveDraft(true);
      }

      setSuccessMessage('CV exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setErrors([error.message || 'Failed to export PDF']);
    } finally {
      setExporting(false);
    }
  };

  // Section navigation
  const sections = [
    { id: 'personalInfo', label: 'Personal Info', icon: User },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Zap },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'languages', label: 'Languages', icon: Globe },
    { id: 'interests', label: 'Interests', icon: Heart },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-dominant">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/cv-builder')}
                className="p-2 text-gray-600 hover:text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back to template selection"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-secondary">CV Builder</h1>
                <p className="text-xs text-gray-600">Step 2 of 2: Fill in your details</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {currentUser && (
                <button
                  onClick={() => handleSaveDraft(false)}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span className="hidden sm:inline">Save Draft</span>
                </button>
              )}

              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="text-green-600" size={20} />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section navigation sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Sections
              </h2>

              {/* Upload Resume Button */}
              <div className="mb-4">
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resume-upload-input"
                />
                <label
                  htmlFor="resume-upload-input"
                  className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    parsing
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100'
                  }`}
                >
                  {parsing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Parsing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload Old Resume</span>
                    </>
                  )}
                </label>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Auto-fill from existing CV
                </p>
              </div>

              <div className="border-t border-gray-200 pt-3 mb-3" />

              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-accent text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Form content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {activeSection === 'personalInfo' && (
                <PersonalInfoSection
                  data={cvData.personalInfo}
                  onChange={handlePersonalInfoChange}
                  imagePreview={imagePreview}
                  onImageSelect={handleImageSelect}
                  onRemoveImage={handleRemoveImage}
                  fileInputRef={fileInputRef}
                />
              )}

              {activeSection === 'summary' && (
                <SummarySection data={cvData.summary} onChange={handleSummaryChange} />
              )}

              {activeSection === 'experience' && (
                <ExperienceSection
                  data={cvData.experience}
                  onChange={handleArrayFieldChange}
                  onAdd={() => handleAddArrayItem('experience')}
                  onRemove={(index) => handleRemoveArrayItem('experience', index)}
                />
              )}

              {activeSection === 'education' && (
                <EducationSection
                  data={cvData.education}
                  onChange={handleArrayFieldChange}
                  onAdd={() => handleAddArrayItem('education')}
                  onRemove={(index) => handleRemoveArrayItem('education', index)}
                />
              )}

              {activeSection === 'skills' && (
                <SkillsSection
                  data={cvData.skills}
                  onChange={handleSkillsChange}
                  onAdd={() => handleAddArrayItem('skills')}
                  onRemove={(index) => handleRemoveArrayItem('skills', index)}
                />
              )}

              {activeSection === 'certifications' && (
                <CertificationsSection
                  data={cvData.certifications}
                  onChange={handleArrayFieldChange}
                  onAdd={() => handleAddArrayItem('certifications')}
                  onRemove={(index) => handleRemoveArrayItem('certifications', index)}
                />
              )}

              {activeSection === 'languages' && (
                <LanguagesSection
                  data={cvData.languages}
                  onChange={handleArrayFieldChange}
                  onAdd={() => handleAddArrayItem('languages')}
                  onRemove={(index) => handleRemoveArrayItem('languages', index)}
                />
              )}

              {activeSection === 'interests' && (
                <InterestsSection
                  data={cvData.interests}
                  onChange={handleInterestsChange}
                />
              )}

              {activeSection === 'preview' && (
                <PreviewSection
                  cvData={cvData}
                  templateId={templateId}
                  accentColor={accentColor}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === SECTION COMPONENTS ===

function PersonalInfoSection({ data, onChange, imagePreview, onImageSelect, onRemoveImage, fileInputRef }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary mb-2">Personal Information</h2>
        <p className="text-gray-600">Your contact details and basic information</p>
      </div>

      {/* Profile Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo (Optional)
        </label>
        <div className="flex items-center space-x-4">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
              <button
                onClick={onRemoveImage}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
              <User size={32} className="text-gray-400" />
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageSelect}
              className="hidden"
              id="profile-image-input"
            />
            <label
              htmlFor="profile-image-input"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Upload size={16} />
              <span className="text-sm">Upload Photo</span>
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="john.doe@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => onChange('location', e.target.value)}
            placeholder="New York, NY"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Visa Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Visa Status (Optional)
        </label>
        <input
          type="text"
          value={data.visaStatus}
          onChange={(e) => onChange('visaStatus', e.target.value)}
          placeholder="e.g., Citizen, Permanent Resident, Work Visa, etc."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-gray-500 mt-2">
          Specify your work authorization status if relevant to your job search.
        </p>
      </div>

      {/* Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-secondary">Online Presence</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile
          </label>
          <input
            type="url"
            value={data.linkedin}
            onChange={(e) => onChange('linkedin', e.target.value)}
            placeholder="linkedin.com/in/johndoe"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Website
          </label>
          <input
            type="url"
            value={data.website}
            onChange={(e) => onChange('website', e.target.value)}
            placeholder="www.johndoe.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Profile
          </label>
          <input
            type="url"
            value={data.github}
            onChange={(e) => onChange('github', e.target.value)}
            placeholder="github.com/johndoe"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
    </div>
  );
}

function SummarySection({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary mb-2">Professional Summary</h2>
        <p className="text-gray-600">A brief overview of your professional background and goals</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Summary
        </label>
        <textarea
          value={data}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Results-driven professional with 5+ years of experience in..."
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <p className="text-sm text-gray-500 mt-2">
          Tip: Keep it concise (2-4 sentences) and highlight your key strengths and career objectives.
        </p>
      </div>
    </div>
  );
}

function ExperienceSection({ data, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary mb-2">Work Experience</h2>
          <p className="text-gray-600">Your employment history and achievements</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Experience</span>
        </button>
      </div>

      {data.map((exp, index) => (
        <div key={exp.id} className="border border-gray-200 rounded-lg p-6 space-y-4 relative">
          {data.length > 1 && (
            <button
              onClick={() => onRemove(index)}
              className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Remove experience"
            >
              <Trash2 size={18} />
            </button>
          )}

          <h3 className="text-lg font-semibold text-secondary">Experience #{index + 1}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={exp.jobTitle}
                onChange={(e) => onChange('experience', index, 'jobTitle', e.target.value)}
                placeholder="Software Engineer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => onChange('experience', index, 'company', e.target.value)}
                placeholder="Tech Corp"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={exp.location}
                onChange={(e) => onChange('experience', index, 'location', e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => onChange('experience', index, 'current', e.target.checked)}
                  className="w-4 h-4 text-accent focus:ring-accent rounded"
                />
                <span className="text-sm text-gray-700">I currently work here</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={exp.startDate}
                onChange={(e) => onChange('experience', index, 'startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date {!exp.current && <span className="text-red-500">*</span>}
              </label>
              <input
                type="month"
                value={exp.endDate}
                onChange={(e) => onChange('experience', index, 'endDate', e.target.value)}
                disabled={exp.current}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={exp.description}
              onChange={(e) => onChange('experience', index, 'description', e.target.value)}
              placeholder="• Led development of key features&#10;• Improved system performance by 30%&#10;• Mentored junior developers"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationSection({ data, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary mb-2">Education</h2>
          <p className="text-gray-600">Your academic qualifications</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Education</span>
        </button>
      </div>

      {data.map((edu, index) => (
        <div key={edu.id} className="border border-gray-200 rounded-lg p-6 space-y-4 relative">
          {data.length > 1 && (
            <button
              onClick={() => onRemove(index)}
              className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Remove education"
            >
              <Trash2 size={18} />
            </button>
          )}

          <h3 className="text-lg font-semibold text-secondary">Education #{index + 1}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => onChange('education', index, 'degree', e.target.value)}
                placeholder="Bachelor of Science in Computer Science"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => onChange('education', index, 'institution', e.target.value)}
                placeholder="University of California"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={edu.location}
                onChange={(e) => onChange('education', index, 'location', e.target.value)}
                placeholder="Berkeley, CA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="month"
                value={edu.startDate}
                onChange={(e) => onChange('education', index, 'startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="month"
                value={edu.endDate}
                onChange={(e) => onChange('education', index, 'endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPA (Optional)
              </label>
              <input
                type="text"
                value={edu.gpa}
                onChange={(e) => onChange('education', index, 'gpa', e.target.value)}
                placeholder="3.8/4.0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Honors, Activities, etc.)
            </label>
            <textarea
              value={edu.description}
              onChange={(e) => onChange('education', index, 'description', e.target.value)}
              placeholder="Graduated with honors, Dean's List..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ data, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary mb-2">Skills</h2>
          <p className="text-gray-600">Your technical and professional competencies</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      {data.map((skillGroup, index) => (
        <div key={skillGroup.id} className="border border-gray-200 rounded-lg p-6 space-y-4 relative">
          {data.length > 1 && (
            <button
              onClick={() => onRemove(index)}
              className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Remove skill category"
            >
              <Trash2 size={18} />
            </button>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={skillGroup.category}
              onChange={(e) => onChange(index, 'category', e.target.value)}
              placeholder="e.g., Programming Languages, Tools, Soft Skills"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skillGroup.items.join(', ')}
              onChange={(e) => onChange(index, 'items', e.target.value)}
              placeholder="JavaScript, React, Node.js, Python"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CertificationsSection({ data, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary mb-2">Certifications</h2>
          <p className="text-gray-600">Professional certifications and licenses</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Certification</span>
        </button>
      </div>

      {data.map((cert, index) => (
        <div key={cert.id} className="border border-gray-200 rounded-lg p-6 space-y-4 relative">
          <button
            onClick={() => onRemove(index)}
            className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove certification"
          >
            <Trash2 size={18} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certification Name
              </label>
              <input
                type="text"
                value={cert.name}
                onChange={(e) => onChange('certifications', index, 'name', e.target.value)}
                placeholder="AWS Certified Solutions Architect"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issuing Organization
              </label>
              <input
                type="text"
                value={cert.issuer}
                onChange={(e) => onChange('certifications', index, 'issuer', e.target.value)}
                placeholder="Amazon Web Services"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Obtained
              </label>
              <input
                type="month"
                value={cert.date}
                onChange={(e) => onChange('certifications', index, 'date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credential URL
              </label>
              <input
                type="url"
                value={cert.url}
                onChange={(e) => onChange('certifications', index, 'url', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LanguagesSection({ data, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary mb-2">Languages</h2>
          <p className="text-gray-600">Languages you can speak and write</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Language</span>
        </button>
      </div>

      {data.map((lang, index) => (
        <div key={lang.id} className="border border-gray-200 rounded-lg p-6 space-y-4 relative">
          <button
            onClick={() => onRemove(index)}
            className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove language"
          >
            <Trash2 size={18} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <input
                type="text"
                value={lang.language}
                onChange={(e) => onChange('languages', index, 'language', e.target.value)}
                placeholder="English"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proficiency
              </label>
              <select
                value={lang.proficiency}
                onChange={(e) => onChange('languages', index, 'proficiency', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {LANGUAGE_PROFICIENCY.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InterestsSection({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary mb-2">Interests</h2>
        <p className="text-gray-600">Your hobbies and personal interests (optional)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interests (comma-separated)
        </label>
        <input
          type="text"
          value={data.join(', ')}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Photography, Hiking, Reading, Open Source Contributions"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-sm text-gray-500 mt-2">
          Adding interests can help show your personality and cultural fit.
        </p>
      </div>
    </div>
  );
}

function PreviewSection({ cvData, templateId, accentColor }) {
  const { personalInfo } = cvData;

  // Render based on template layout
  const renderSingleColumn = () => (
    <div className="bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
      <div className="p-8">
        {/* Header with profile image */}
        <div className="flex items-start gap-6 border-b-2 pb-6 mb-6" style={{ borderColor: accentColor }}>
          {personalInfo.profileImage && (
            <img
              src={personalInfo.profileImage}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4"
              style={{ borderColor: accentColor }}
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2" style={{ color: accentColor }}>
              {personalInfo.fullName || 'Your Name'}
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              {personalInfo.email && <div>{personalInfo.email}</div>}
              <div className="flex flex-wrap gap-2">
                {personalInfo.phone && <span>{personalInfo.phone}</span>}
                {personalInfo.location && <span>• {personalInfo.location}</span>}
                {personalInfo.visaStatus && <span>• {personalInfo.visaStatus}</span>}
              </div>
              {(personalInfo.linkedin || personalInfo.website || personalInfo.github) && (
                <div className="flex flex-wrap gap-2">
                  {personalInfo.linkedin && <span>LinkedIn</span>}
                  {personalInfo.website && <span>• Website</span>}
                  {personalInfo.github && <span>• GitHub</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {cvData.summary && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 uppercase" style={{ color: accentColor }}>Professional Summary</h2>
            <p className="text-gray-700 leading-relaxed text-sm">{cvData.summary}</p>
          </div>
        )}

        {/* Experience */}
        {cvData.experience && cvData.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 uppercase" style={{ color: accentColor }}>Experience</h2>
            <div className="space-y-4">
              {cvData.experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-gray-900">{exp.jobTitle}</h3>
                      <p className="text-gray-600 text-sm italic">{exp.company}</p>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      <div>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</div>
                      {exp.location && <div>{exp.location}</div>}
                    </div>
                  </div>
                  {exp.description && <p className="text-gray-700 text-sm mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {cvData.education && cvData.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 uppercase" style={{ color: accentColor }}>Education</h2>
            <div className="space-y-3">
              {cvData.education.map((edu, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                      <p className="text-gray-600 text-sm italic">{edu.institution}</p>
                      {edu.gpa && <p className="text-gray-600 text-xs">GPA: {edu.gpa}</p>}
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      <div>{edu.startDate} - {edu.endDate}</div>
                      {edu.location && <div>{edu.location}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {cvData.skills && cvData.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 uppercase" style={{ color: accentColor }}>Skills</h2>
            {cvData.skills.map((skillGroup, index) => (
              <div key={index} className="mb-2">
                {skillGroup.category && <h3 className="font-semibold text-gray-900 text-sm mb-1">{skillGroup.category}</h3>}
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs rounded" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {cvData.certifications && cvData.certifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 uppercase" style={{ color: accentColor }}>Certifications</h2>
            <div className="space-y-2">
              {cvData.certifications.map((cert, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900 text-sm">{cert.name}</h3>
                  <p className="text-xs text-gray-600">{cert.issuer} • {cert.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {cvData.languages && cvData.languages.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 uppercase" style={{ color: accentColor }}>Languages</h2>
            <div className="grid grid-cols-2 gap-2">
              {cvData.languages.map((lang, index) => (
                <div key={index} className="text-sm">
                  <span className="font-semibold">{lang.language}</span> - {lang.proficiency}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {cvData.interests && cvData.interests.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3 uppercase" style={{ color: accentColor }}>Interests</h2>
            <p className="text-sm text-gray-700">{cvData.interests.join(' • ')}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTwoColumn = () => (
    <div className="bg-white shadow-lg flex" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
      {/* Left sidebar */}
      <div className="w-2/5 p-6" style={{ backgroundColor: accentColor + '15' }}>
        {/* Profile Image */}
        {personalInfo.profileImage && (
          <div className="mb-6 text-center">
            <img
              src={personalInfo.profileImage}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
            />
          </div>
        )}

        {/* Contact */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: accentColor }}>Contact</h2>
          <div className="text-xs space-y-2 text-gray-700">
            {personalInfo.email && <div className="break-words">{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.location && <div>{personalInfo.location}</div>}
            {personalInfo.visaStatus && <div>{personalInfo.visaStatus}</div>}
          </div>
        </div>

        {/* Links */}
        {(personalInfo.linkedin || personalInfo.website || personalInfo.github) && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: accentColor }}>Links</h2>
            <div className="text-xs space-y-2 text-gray-700">
              {personalInfo.linkedin && <div className="break-words">LinkedIn</div>}
              {personalInfo.website && <div className="break-words">Website</div>}
              {personalInfo.github && <div className="break-words">GitHub</div>}
            </div>
          </div>
        )}

        {/* Skills */}
        {cvData.skills && cvData.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: accentColor }}>Skills</h2>
            {cvData.skills.map((skillGroup, index) => (
              <div key={index} className="mb-3">
                {skillGroup.category && <h3 className="font-semibold text-xs mb-1">{skillGroup.category}</h3>}
                <div className="space-y-1">
                  {skillGroup.items.map((skill, idx) => (
                    <div key={idx} className="text-xs text-gray-700">• {skill}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Languages */}
        {cvData.languages && cvData.languages.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: accentColor }}>Languages</h2>
            {cvData.languages.map((lang, index) => (
              <div key={index} className="mb-2 text-xs">
                <div className="font-semibold">{lang.language}</div>
                <div className="text-gray-600">{lang.proficiency}</div>
              </div>
            ))}
          </div>
        )}

        {/* Interests */}
        {cvData.interests && cvData.interests.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: accentColor }}>Interests</h2>
            <div className="text-xs text-gray-700 space-y-1">
              {cvData.interests.map((interest, idx) => (
                <div key={idx}>• {interest}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right content */}
      <div className="w-3/5 p-6">
        {/* Name */}
        <h1 className="text-4xl font-bold mb-2" style={{ color: accentColor }}>
          {personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="h-1 w-20 mb-6" style={{ backgroundColor: accentColor }}></div>

        {/* Summary */}
        {cvData.summary && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2 uppercase" style={{ color: accentColor }}>About</h2>
            <p className="text-xs text-gray-700 leading-relaxed">{cvData.summary}</p>
          </div>
        )}

        {/* Experience */}
        {cvData.experience && cvData.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: accentColor }}>Experience</h2>
            <div className="space-y-4">
              {cvData.experience.map((exp, index) => (
                <div key={index}>
                  <h3 className="font-bold text-sm">{exp.jobTitle}</h3>
                  <p className="text-xs italic text-gray-600">{exp.company}</p>
                  <p className="text-xs text-gray-500 mb-1">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </p>
                  {exp.description && <p className="text-xs text-gray-700">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {cvData.education && cvData.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: accentColor }}>Education</h2>
            {cvData.education.map((edu, index) => (
              <div key={index} className="mb-3">
                <h3 className="font-bold text-sm">{edu.degree}</h3>
                <p className="text-xs italic text-gray-600">{edu.institution}</p>
                <p className="text-xs text-gray-500">
                  {edu.startDate} - {edu.endDate}
                  {edu.gpa && ` • GPA: ${edu.gpa}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {cvData.certifications && cvData.certifications.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: accentColor }}>Certifications</h2>
            {cvData.certifications.map((cert, index) => (
              <div key={index} className="mb-2">
                <h3 className="font-semibold text-xs">{cert.name}</h3>
                <p className="text-xs text-gray-600">{cert.issuer} • {cert.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAsymmetric = () => (
    <div className="bg-white shadow-lg flex" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
      {/* Narrow left sidebar with accent */}
      <div className="w-1/4 p-4" style={{ backgroundColor: accentColor }}>
        {personalInfo.profileImage && (
          <div className="mb-6">
            <img
              src={personalInfo.profileImage}
              alt="Profile"
              className="w-full aspect-square rounded-lg object-cover border-2 border-white"
            />
          </div>
        )}

        <div className="text-white text-xs space-y-4">
          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm mb-2 uppercase">Contact</h3>
            {personalInfo.email && <div className="mb-1 break-words">{personalInfo.email}</div>}
            {personalInfo.phone && <div className="mb-1">{personalInfo.phone}</div>}
            {personalInfo.location && <div className="mb-1">{personalInfo.location}</div>}
          </div>

          {/* Skills */}
          {cvData.skills && cvData.skills.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2 uppercase">Skills</h3>
              {cvData.skills.map((skillGroup, index) => (
                <div key={index} className="mb-2">
                  {skillGroup.items.map((skill, idx) => (
                    <div key={idx} className="mb-1">• {skill}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {cvData.languages && cvData.languages.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2 uppercase">Languages</h3>
              {cvData.languages.map((lang, index) => (
                <div key={index} className="mb-1">{lang.language}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wide right content */}
      <div className="w-3/4 p-8">
        <h1 className="text-5xl font-bold mb-2 uppercase" style={{ color: accentColor }}>
          {personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="h-1 w-32 mb-6" style={{ backgroundColor: accentColor }}></div>

        {cvData.summary && (
          <div className="mb-6">
            <p className="text-sm text-gray-700 leading-relaxed italic">{cvData.summary}</p>
          </div>
        )}

        {cvData.experience && cvData.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 uppercase" style={{ color: accentColor }}>Experience</h2>
            {cvData.experience.map((exp, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-base">{exp.jobTitle}</h3>
                  <span className="text-xs text-gray-500">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <p className="text-sm italic" style={{ color: accentColor }}>{exp.company}</p>
                {exp.description && <p className="text-sm text-gray-700 mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {cvData.education && cvData.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 uppercase" style={{ color: accentColor }}>Education</h2>
            {cvData.education.map((edu, index) => (
              <div key={index} className="mb-3">
                <h3 className="font-bold text-base">{edu.degree}</h3>
                <p className="text-sm italic" style={{ color: accentColor }}>{edu.institution}</p>
                <p className="text-xs text-gray-600">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </div>
        )}

        {cvData.certifications && cvData.certifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 uppercase" style={{ color: accentColor }}>Certifications</h2>
            {cvData.certifications.map((cert, index) => (
              <div key={index} className="mb-2">
                <h3 className="font-semibold text-sm">{cert.name}</h3>
                <p className="text-xs text-gray-600">{cert.issuer} • {cert.date}</p>
              </div>
            ))}
          </div>
        )}

        {cvData.interests && cvData.interests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 uppercase" style={{ color: accentColor }}>Interests</h2>
            <p className="text-sm text-gray-700">{cvData.interests.join(' • ')}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary mb-2">CV Preview</h2>
        <p className="text-gray-600">Live preview of your {templateId} template with {accentColor} accent color</p>
      </div>

      <div className="bg-gray-100 rounded-lg p-8 overflow-auto">
        <div className="transform scale-75 origin-top">
          {templateId === 'modern' && renderTwoColumn()}
          {templateId === 'creative' && renderAsymmetric()}
          {(templateId === 'professional' || templateId === 'minimal') && renderSingleColumn()}
        </div>
      </div>
    </div>
  );
}
