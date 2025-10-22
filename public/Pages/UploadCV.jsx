import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { storage, db } from '../js/firebase-config';
import { getCVLimit } from '../config/planConfig';
import JSZip from 'jszip';
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Archive
} from 'lucide-react';

export default function UploadCV() {
  const { currentUser, refreshUserData, userData } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [extracting, setExtracting] = useState(false);

  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.apple.pages',
    'application/x-iwork-pages-sffpages'
  ];

  const allowedZipTypes = [
    'application/zip',
    'application/x-zip-compressed'
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB per CV
  const maxZipSize = 50 * 1024 * 1024; // 50MB for ZIP files
  const maxFiles = 50; // Maximum files per upload (increased for bulk uploads)

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  // Handle file selection
  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  // Extract files from ZIP
  const extractZipFile = async (zipFile) => {
    setExtracting(true);
    const newErrors = [];
    const extractedFiles = [];

    try {
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(zipFile);

      for (const [filename, fileData] of Object.entries(zipContents.files)) {
        // Skip directories and hidden files
        if (fileData.dir || filename.startsWith('__MACOSX/') || filename.startsWith('.')) {
          continue;
        }

        // Get file extension
        const ext = filename.split('.').pop().toLowerCase();

        // Check if it's a valid CV file
        if (!['pdf', 'doc', 'docx', 'pages'].includes(ext)) {
          newErrors.push(`${filename}: Skipped (not a supported document format)`);
          continue;
        }

        // Extract file as blob
        const blob = await fileData.async('blob');

        // Create File object with proper MIME type
        let mimeType = 'application/pdf';
        if (ext === 'doc') mimeType = 'application/msword';
        if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (ext === 'pages') mimeType = 'application/vnd.apple.pages';

        const file = new File([blob], filename, { type: mimeType });

        // Check file size
        if (file.size > maxFileSize) {
          newErrors.push(`${filename}: File too large (max 5MB)`);
          continue;
        }

        extractedFiles.push(file);
      }

      if (extractedFiles.length === 0) {
        newErrors.push(`${zipFile.name}: No valid CV files found in ZIP`);
      }
    } catch (error) {
      newErrors.push(`${zipFile.name}: Failed to extract ZIP file`);
      console.error('ZIP extraction error:', error);
    }

    setExtracting(false);
    return { extractedFiles, newErrors };
  };

  // Validate and add files
  const handleFiles = async (newFiles) => {
    const validFiles = [];
    const newErrors = [];

    // Check user's upload limit including CV packs
    const userPlan = currentUser?.userData?.plan || 'free';
    const uploadLimit = getCVLimit(userPlan);
    const currentUploads = currentUser?.userData?.cvUploadsThisMonth || 0;
    const cvPackBalance = currentUser?.userData?.cvPackBalance || 0;

    // Check if user has reached their limit (skip check for unlimited plans)
    if (uploadLimit !== -1 && currentUploads >= uploadLimit && cvPackBalance === 0) {
      setErrors([`You have reached your monthly upload limit of ${uploadLimit} CVs. Purchase a CV Pack or upgrade your plan to upload more CVs.`]);
      return;
    }

    for (const file of newFiles) {
      // Check if it's a ZIP file
      if (allowedZipTypes.includes(file.type) || file.name.toLowerCase().endsWith('.zip')) {
        // Check ZIP size
        if (file.size > maxZipSize) {
          newErrors.push(`${file.name}: ZIP file too large. Maximum size is 50MB.`);
          continue;
        }

        // Extract ZIP contents
        const { extractedFiles, newErrors: extractErrors } = await extractZipFile(file);
        newErrors.push(...extractErrors);

        // Process extracted files
        for (const extractedFile of extractedFiles) {
          // Check for duplicates
          if (files.some(f => f.name === extractedFile.name && f.size === extractedFile.size)) {
            newErrors.push(`${extractedFile.name}: File already added.`);
            continue;
          }

          validFiles.push({
            file: extractedFile,
            id: Math.random().toString(36).substring(7),
            status: 'pending',
            progress: 0,
            error: null,
            fromZip: true
          });
        }
      } else {
        // Regular file processing
        // Check file type (also check extension for Pages files since MIME type may vary)
        const fileExt = file.name.split('.').pop().toLowerCase();
        const isValidType = allowedTypes.includes(file.type) || fileExt === 'pages';

        if (!isValidType) {
          newErrors.push(`${file.name}: Invalid file type. Only PDF, Word, and Pages documents are allowed.`);
          continue;
        }

        // Check file size
        if (file.size > maxFileSize) {
          newErrors.push(`${file.name}: File too large. Maximum size is 5MB.`);
          continue;
        }

        // Check for duplicates
        if (files.some(f => f.name === file.name && f.size === file.size)) {
          newErrors.push(`${file.name}: File already added.`);
          continue;
        }

        validFiles.push({
          file,
          id: Math.random().toString(36).substring(7),
          status: 'pending',
          progress: 0,
          error: null
        });
      }
    }

    // Check total file count
    if (files.length + validFiles.length > maxFiles) {
      newErrors.push(`Total files exceed maximum of ${maxFiles} files`);
      setErrors(newErrors);
      return;
    }

    // Check if adding these files would exceed the user's monthly limit
    if (uploadLimit !== -1 && currentUploads + validFiles.length > uploadLimit) {
      const remainingUploads = uploadLimit - currentUploads;
      newErrors.push(`Adding ${validFiles.length} file(s) would exceed your monthly limit. You can upload ${remainingUploads} more CV(s) this month.`);
      setErrors(newErrors);
      return;
    }

    setFiles([...files, ...validFiles]);
    if (newErrors.length > 0) {
      setErrors(newErrors);
    }
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  // Upload single file
  const uploadFile = async (fileObj) => {
    const { file, id } = fileObj;

    try {
      // Determine the effective user ID (team owner if team member, otherwise current user)
      const teamAccess = userData?.teamAccess;
      const effectiveUserId = teamAccess?.isTeamMember && teamAccess?.teamOwnerId
        ? teamAccess.teamOwnerId
        : currentUser.uid;

      console.log('Uploading CV for user:', effectiveUserId, '(Team member:', teamAccess?.isTeamMember, ')');

      // Create storage reference using effective user ID
      const storageRef = ref(storage, `cvs/${effectiveUserId}/${Date.now()}_${file.name}`);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({ ...prev, [id]: progress }));
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              // Get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              // Save metadata to Firestore using effective user ID (owner for team members)
              const cvData = {
                userId: effectiveUserId,
                uploadedBy: currentUser.uid, // Track who actually uploaded it
                uploadedByEmail: currentUser.email,
                uploadedByName: currentUser.displayName || currentUser.email,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                downloadURL: downloadURL,
                storagePath: uploadTask.snapshot.ref.fullPath,
                uploadedAt: serverTimestamp(),
                status: 'processing',
                parsed: false,
                metadata: {
                  name: null,
                  email: null,
                  phone: null,
                  skills: [],
                  experience: [],
                  education: []
                }
              };

              const docRef = await addDoc(collection(db, 'cvs'), cvData);
              console.log('CV document created with ID:', docRef.id, 'for user:', effectiveUserId);

              // Increment user's CV upload counter or deduct from CV pack
              // Always update the owner's count, not the team member's
              const userRef = doc(db, 'users', effectiveUserId);
              const userPlan = currentUser?.userData?.plan || 'free';
              const uploadLimit = getCVLimit(userPlan);
              const currentUploads = currentUser?.userData?.cvUploadsThisMonth || 0;
              const cvPackBalance = currentUser?.userData?.cvPackBalance || 0;

              // If user has exceeded monthly limit, use CV pack balance
              if (uploadLimit !== -1 && currentUploads >= uploadLimit && cvPackBalance > 0) {
                await updateDoc(userRef, {
                  cvPackBalance: increment(-1)
                });
                console.log('Deducted 1 CV from pack balance');
              } else {
                await updateDoc(userRef, {
                  cvUploadsThisMonth: increment(1)
                });
                console.log('User counter incremented successfully');
              }

              resolve({ id, docId: docRef.id, downloadURL });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      throw error;
    }
  };

  // Upload all files
  const handleUploadAll = async () => {
    // Only upload files that are pending (not already uploaded)
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // Double-check upload limit before proceeding
    const userPlan = currentUser?.userData?.plan || 'free';
    const uploadLimit = getCVLimit(userPlan);
    const currentUploads = currentUser?.userData?.cvUploadsThisMonth || 0;

    if (uploadLimit !== -1 && currentUploads + pendingFiles.length > uploadLimit) {
      const remainingUploads = uploadLimit - currentUploads;
      setErrors([`You can only upload ${remainingUploads} more CV(s) this month. Please upgrade your plan for more uploads.`]);
      return;
    }

    setUploading(true);
    const uploadPromises = [];

    for (const fileObj of pendingFiles) {
      const promise = uploadFile(fileObj)
        .then((result) => {
          setFiles(prev =>
            prev.map(f =>
              f.id === result.id
                ? { ...f, status: 'success', downloadURL: result.downloadURL }
                : f
            )
          );
        })
        .catch((error) => {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileObj.id
                ? { ...f, status: 'error', error: error.message }
                : f
            )
          );
        });

      uploadPromises.push(promise);
    }

    await Promise.all(uploadPromises);
    setUploading(false);

    // Refresh user data to update the upload counter
    await refreshUserData();

    // Check if all uploads were successful
    const allSuccess = files.every(f => f.status === 'success');
    if (allSuccess) {
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-purple-50/30">
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
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Upload className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Upload CVs</h1>
                <p className="text-xs text-gray-600">Bulk Upload Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Title Banner */}
        <div className="mb-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Upload size={28} />
                </div>
                Upload CVs
              </h1>
              <p className="text-orange-100 text-lg">
                Upload PDF, Word, or Apple Pages documents individually, or upload a ZIP file containing multiple CVs for bulk processing
              </p>
            </div>
            <div className="hidden lg:block">
              <FileText className="w-24 h-24 text-white/20" />
            </div>
          </div>
        </div>

        {/* Upload Limit Indicator */}
        {(() => {
          const userPlan = currentUser?.userData?.plan || 'free';
          const uploadLimit = getCVLimit(userPlan);
          const currentUploads = currentUser?.userData?.cvUploadsThisMonth || 0;
          const cvPackBalance = currentUser?.userData?.cvPackBalance || 0;
          const isUnlimited = uploadLimit === -1;
          const isNearLimit = !isUnlimited && currentUploads >= uploadLimit * 0.8 && cvPackBalance === 0;
          const isAtLimit = !isUnlimited && currentUploads >= uploadLimit && cvPackBalance === 0;
          const usagePercentage = isUnlimited ? 0 : (currentUploads / uploadLimit) * 100;

          return (
            <div className={`mb-6 rounded-2xl p-5 shadow-lg border ${
              isAtLimit
                ? 'bg-red-50 border-red-200'
                : isNearLimit
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isAtLimit
                      ? 'bg-red-100'
                      : isNearLimit
                        ? 'bg-orange-100'
                        : 'bg-blue-100'
                  }`}>
                    <Upload className={
                      isAtLimit
                        ? 'text-red-500'
                        : isNearLimit
                          ? 'text-orange-500'
                          : 'text-blue-500'
                    } size={20} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${
                      isAtLimit
                        ? 'text-red-900'
                        : isNearLimit
                          ? 'text-orange-900'
                          : 'text-blue-900'
                    }`}>
                      {isUnlimited ? 'Unlimited Uploads' : `${currentUploads} / ${uploadLimit} CVs Uploaded This Month`}
                    </h3>
                    <p className={`text-sm ${
                      isAtLimit
                        ? 'text-red-700'
                        : isNearLimit
                          ? 'text-orange-700'
                          : 'text-blue-700'
                    }`}>
                      {isUnlimited
                        ? 'Enterprise plan with unlimited CV uploads'
                        : isAtLimit
                          ? 'Upload limit reached. Purchase a CV Pack or upgrade your plan to continue.'
                          : cvPackBalance > 0
                            ? `${uploadLimit - currentUploads} monthly uploads + ${cvPackBalance} CV pack credits`
                            : `${uploadLimit - currentUploads} upload(s) remaining`
                      }
                    </p>
                  </div>
                </div>
                {!isUnlimited && (
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          isAtLimit
                            ? 'bg-red-500'
                            : isNearLimit
                              ? 'bg-orange-500'
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      ></div>
                    </div>
                    {(isAtLimit || isNearLimit) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate('/settings?tab=cvpacks')}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold text-sm transition-all hover:scale-105 shadow-lg"
                        >
                          Buy CV Pack
                        </button>
                        <button
                          onClick={() => navigate('/pricing')}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold text-sm transition-all hover:scale-105 shadow-lg"
                        >
                          Upgrade Plan
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-red-900 font-bold mb-2 flex items-center gap-2">Upload Errors</h3>
                <ul className="space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-700">• {error}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setErrors([])}
                className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all shadow-lg ${
            isDragging
              ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 scale-105'
              : 'border-gray-300 bg-white hover:border-orange-400 hover:shadow-xl'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
            isDragging ? 'scale-110' : ''
          } transition-transform`}>
            <Upload className="text-white" size={40} />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Drag and drop your CVs or ZIP files here
          </h3>
          <p className="text-gray-600 mb-8 text-lg">
            {extracting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin text-orange-500" size={20} />
                <span className="font-semibold text-orange-600">Extracting ZIP file...</span>
              </span>
            ) : (
              'or click the button below to browse files'
            )}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.pages,.zip"
            onChange={handleFileInput}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || extracting}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {extracting ? 'Extracting ZIP...' : 'Browse Files'}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <FileText size={14} />
              <span>PDF, DOC, DOCX, PAGES, ZIP</span>
            </div>
            <span>•</span>
            <span>Max 5MB per CV, 50MB per ZIP</span>
          </div>
        </div>

        {/* Upload Complete Message */}
        {files.length > 0 && files.every(f => f.status === 'success') && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <CheckCircle2 className="text-white" size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-green-900 font-bold text-xl mb-2">All files uploaded successfully!</h3>
                <p className="text-green-700 font-medium">
                  Your CVs are now being processed. Redirecting to dashboard...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Files List */}
        {files.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-orange-50/30 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="text-white" size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Selected Files ({files.length})
                </h3>
              </div>

              {!uploading && files.some(f => f.status === 'pending') && (
                <button
                  onClick={handleUploadAll}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-orange-500/30"
                >
                  <Upload size={18} />
                  <span>Upload All</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {files.map((fileObj, index) => (
                <div
                  key={fileObj.id}
                  className="px-6 py-5 flex items-center gap-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50/30 transition-all group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* File Icon */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 relative shadow-md transition-transform group-hover:scale-110 ${
                    fileObj.status === 'success' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    fileObj.status === 'error' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {fileObj.status === 'success' ? (
                      <CheckCircle2 className="text-white" size={28} />
                    ) : fileObj.status === 'error' ? (
                      <AlertCircle className="text-white" size={28} />
                    ) : (
                      <FileText className="text-white" size={28} />
                    )}
                    {fileObj.fromZip && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md" title="Extracted from ZIP">
                        <Archive className="text-white" size={14} />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-lg">
                      {fileObj.file.name}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      {(fileObj.file.size / 1024).toFixed(1)} KB
                    </p>

                    {/* Progress Bar */}
                    {fileObj.status === 'pending' && uploading && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all shadow-sm flex items-center justify-end pr-2"
                            style={{ width: `${uploadProgress[fileObj.id] || 0}%` }}
                          >
                            {uploadProgress[fileObj.id] > 10 && (
                              <span className="text-xs text-white font-bold">
                                {Math.round(uploadProgress[fileObj.id])}%
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 font-semibold">
                          {Math.round(uploadProgress[fileObj.id] || 0)}% uploaded
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {fileObj.status === 'error' && (
                      <p className="text-sm text-red-600 mt-2 font-semibold flex items-center gap-1">
                        <AlertCircle size={14} />
                        {fileObj.error}
                      </p>
                    )}

                    {/* Success Message */}
                    {fileObj.status === 'success' && (
                      <p className="text-sm text-green-600 mt-2 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        Upload complete!
                      </p>
                    )}
                  </div>

                  {/* Status Icon / Remove Button */}
                  <div className="flex-shrink-0">
                    {fileObj.status === 'pending' && uploading ? (
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Loader2 className="text-orange-500 animate-spin" size={24} />
                      </div>
                    ) : !uploading ? (
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="w-10 h-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center"
                      >
                        <X size={22} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}