import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { storage, db } from '../js/firebase-config';
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
  const { currentUser, refreshUserData } = useAuth();
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
      // Create storage reference
      const storageRef = ref(storage, `cvs/${currentUser.uid}/${Date.now()}_${file.name}`);
      
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
              
              // Save metadata to Firestore
              const cvData = {
                userId: currentUser.uid,
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
              console.log('CV document created with ID:', docRef.id);

              // Increment user's CV upload counter
              const userRef = doc(db, 'users', currentUser.uid);
              await updateDoc(userRef, {
                cvUploadsThisMonth: increment(1)
              });
              console.log('User counter incremented successfully');

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
    if (files.length === 0) return;

    setUploading(true);
    const uploadPromises = [];

    for (const fileObj of files) {
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload CVs</h1>
          <p className="text-gray-600">
            Upload PDF, Word, or Apple Pages documents individually, or upload a ZIP file containing multiple CVs for bulk processing.
          </p>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-red-800 font-medium mb-2">Upload Errors</h3>
                <ul className="space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-700">• {error}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setErrors([])}
                className="text-red-500 hover:text-red-700"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 bg-white hover:border-orange-400'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="text-orange-500" size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Drag and drop your CVs or ZIP files here
          </h3>
          <p className="text-gray-600 mb-6">
            {extracting ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader2 className="animate-spin" size={16} />
                <span>Extracting ZIP file...</span>
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
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {extracting ? 'Extracting ZIP...' : 'Browse Files'}
          </button>

          <p className="text-sm text-gray-500 mt-4">
            Supported formats: PDF, DOC, DOCX, PAGES, ZIP • Max 5MB per CV, 50MB per ZIP
          </p>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                Selected Files ({files.length})
              </h3>
              
              {!uploading && (
                <button
                  onClick={handleUploadAll}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-all hover:scale-105 flex items-center space-x-2"
                >
                  <Upload size={18} />
                  <span>Upload All</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-200">
              {files.map((fileObj) => (
                <div key={fileObj.id} className="px-6 py-4 flex items-center space-x-4">
                  {/* File Icon */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                    {fileObj.status === 'success' ? (
                      <CheckCircle2 className="text-green-500" size={24} />
                    ) : fileObj.status === 'error' ? (
                      <AlertCircle className="text-red-500" size={24} />
                    ) : (
                      <FileText className="text-gray-400" size={24} />
                    )}
                    {fileObj.fromZip && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center" title="Extracted from ZIP">
                        <Archive className="text-white" size={12} />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {fileObj.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(fileObj.file.size / 1024).toFixed(1)} KB
                    </p>

                    {/* Progress Bar */}
                    {fileObj.status === 'pending' && uploading && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress[fileObj.id] || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(uploadProgress[fileObj.id] || 0)}% uploaded
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {fileObj.status === 'error' && (
                      <p className="text-sm text-red-600 mt-1">{fileObj.error}</p>
                    )}

                    {/* Success Message */}
                    {fileObj.status === 'success' && (
                      <p className="text-sm text-green-600 mt-1">Upload complete!</p>
                    )}
                  </div>

                  {/* Status Icon / Remove Button */}
                  <div className="flex-shrink-0">
                    {fileObj.status === 'pending' && uploading ? (
                      <Loader2 className="text-orange-500 animate-spin" size={20} />
                    ) : !uploading ? (
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Complete Message */}
        {files.length > 0 && files.every(f => f.status === 'success') && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-green-800 font-medium mb-1">All files uploaded successfully!</h3>
                <p className="text-sm text-green-700">
                  Your CVs are now being processed. Redirecting to dashboard...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}