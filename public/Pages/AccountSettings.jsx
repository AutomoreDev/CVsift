import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateProfile, updateEmail, updatePassword, multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../js/firebase-config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import CVPackPurchase from '../components/CVPackPurchase';
import CustomFieldsManager from '../components/CustomFieldsManager';
import TeamCollaboration from '../components/TeamCollaboration';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Calendar,
  CreditCard,
  Save,
  AlertCircle,
  CheckCircle2,
  Camera,
  Shield,
  UserPlus,
  Trash2,
  Power,
  Package,
  List,
  Users,
  Smartphone,
  X
} from 'lucide-react';

export default function AccountSettings() {
  const { currentUser, logout, userData } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const functions = getFunctions();

  // Check URL for tab parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');

  // MFA State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [enrolledFactors, setEnrolledFactors] = useState([]);
  const [showMfaEnrollment, setShowMfaEnrollment] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [disableMfaModal, setDisableMfaModal] = useState({ isOpen: false, factorUid: null });

  // Master Management State
  const [isPrimaryMaster, setIsPrimaryMaster] = useState(false);
  const [subMasters, setSubMasters] = useState([]);
  const [subMasterForm, setSubMasterForm] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [masterLoading, setMasterLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, subMasterId: null, email: '' });
  const [toggleModal, setToggleModal] = useState({ isOpen: false, subMasterId: null, email: '', isActive: false });

  // Subscription management state
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState('');
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);

  // Check if current user is primary master
  useEffect(() => {
    const checkPrimaryMasterStatus = async () => {
      try {
        const checkPrimaryMaster = httpsCallable(functions, 'checkPrimaryMaster');
        const result = await checkPrimaryMaster();
        setIsPrimaryMaster(result.data.isPrimaryMaster);

        // If primary master, load sub-masters list
        if (result.data.isPrimaryMaster) {
          loadSubMasters();
        }
      } catch (error) {
        console.error('Error checking primary master status:', error);
      }
    };

    if (currentUser) {
      checkPrimaryMasterStatus();
    }
  }, [currentUser]);

  // Check MFA enrollment status
  useEffect(() => {
    if (currentUser) {
      const user = auth.currentUser;
      if (user) {
        const enrolledMfaFactors = multiFactor(user).enrolledFactors;
        setEnrolledFactors(enrolledMfaFactors);
        setMfaEnabled(enrolledMfaFactors.length > 0);
      }
    }
  }, [currentUser]);

  // Initialize reCAPTCHA when MFA enrollment is shown
  useEffect(() => {
    if (showMfaEnrollment && !recaptchaVerifier) {
      // Use setTimeout to ensure DOM is ready
      const timer = setTimeout(() => {
        try {
          // Clear any existing reCAPTCHA widget
          const container = document.getElementById('recaptcha-container');
          if (!container) return;

          container.innerHTML = '';

          const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'normal',
            callback: (response) => {
              console.log('reCAPTCHA solved successfully');
            },
            'error-callback': (error) => {
              console.error('reCAPTCHA error:', error);
              toast.error('Security verification failed. Please try again.');
            }
          });

          // Render the verifier
          verifier.render().then((widgetId) => {
            console.log('reCAPTCHA widget rendered:', widgetId);
            setRecaptchaVerifier(verifier);
          }).catch((error) => {
            console.error('Error rendering reCAPTCHA:', error);
            // Silently fail - user can try again
          });
        } catch (error) {
          console.error('Error initializing reCAPTCHA:', error);
          // Silently fail - user can try again
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    // Cleanup on unmount or when enrollment is cancelled
    return () => {
      if (recaptchaVerifier && !showMfaEnrollment) {
        try {
          recaptchaVerifier.clear();
          setRecaptchaVerifier(null);
        } catch (error) {
          console.error('Error clearing reCAPTCHA:', error);
        }
      }
    };
  }, [showMfaEnrollment]);

  // MFA Enrollment: Send SMS verification code
  const handleStartMfaEnrollment = async () => {
    console.log('=== MFA Enrollment Started ===');
    console.log('Phone number:', phoneNumber);
    console.log('RecaptchaVerifier exists:', !!recaptchaVerifier);

    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!recaptchaVerifier) {
      console.error('RecaptchaVerifier not initialized!');
      toast.error('Security verification not ready. Please wait a moment and try again.');
      return;
    }

    setMfaLoading(true);
    try {
      console.log('Step 1: Getting current user...');
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      console.log('User ID:', user.uid);

      console.log('Step 2: Getting MFA session...');
      const session = await multiFactor(user).getSession();
      console.log('Session obtained:', !!session);

      // Create phone auth provider
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      console.log('Step 3: Formatted phone number:', formattedPhone);

      const phoneInfoOptions = {
        phoneNumber: formattedPhone,
        session
      };

      console.log('Step 4: Initiating phone verification...');
      const phoneAuthProvider = new PhoneAuthProvider(auth);

      // Add timeout to detect hanging promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Phone verification timeout after 30 seconds')), 30000);
      });

      const verificationId = await Promise.race([
        phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier),
        timeoutPromise
      ]);
      console.log('Step 5: Verification ID received:', verificationId);

      setVerificationId(verificationId);
      setShowVerificationInput(true);
      toast.success('Verification code sent to your phone!');
      console.log('=== MFA Enrollment Success ===');

      // Log SMS verification for tracking
      try {
        const logSms = httpsCallable(functions, 'logSmsVerification');
        await logSms({
          phoneNumber: phoneNumber,
          purpose: 'mfa_enrollment'
        });
      } catch (logError) {
        console.error('Failed to log SMS verification:', logError);
        // Don't block the flow if logging fails
      }
    } catch (error) {
      console.error('=== MFA Enrollment Error ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);

      // Provide specific error messages
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Multi-factor authentication is not enabled. Please contact support to enable MFA for your account.');
      } else if (error.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number format. Please include country code (e.g., +27821234567)');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please try again later.');
      } else if (error.code === 'auth/captcha-check-failed') {
        toast.error('Security verification failed. Please refresh the page and try again. If the issue persists, contact support.');
      } else if (error.code === 'auth/missing-phone-number') {
        toast.error('Please enter a phone number');
      } else {
        toast.error(error.message || 'Failed to send verification code');
      }
    } finally {
      setMfaLoading(false);
      console.log('MFA loading set to false');
    }
  };

  // MFA Enrollment: Verify code and complete enrollment
  const handleCompleteMfaEnrollment = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setMfaLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // Provide a display name for the enrolled factor
      await multiFactor(user).enroll(multiFactorAssertion, phoneNumber);

      toast.success('Two-factor authentication enabled successfully!');

      // Refresh enrolled factors
      const enrolledMfaFactors = multiFactor(user).enrolledFactors;
      setEnrolledFactors(enrolledMfaFactors);
      setMfaEnabled(enrolledMfaFactors.length > 0);

      // Reset form
      setShowMfaEnrollment(false);
      setPhoneNumber('');
      setVerificationCode('');
      setVerificationId('');
      setShowVerificationInput(false);
    } catch (error) {
      console.error('Error completing MFA enrollment:', error);

      // Provide specific error messages
      if (error.code === 'auth/invalid-verification-code') {
        toast.error('Invalid verification code. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        toast.error('Verification code expired. Please request a new code.');
      } else if (error.code === 'auth/session-expired') {
        toast.error('Session expired. Please start the enrollment process again.');
      } else {
        toast.error(error.message || 'Failed to verify code');
      }
    } finally {
      setMfaLoading(false);
    }
  };

  // MFA Unenrollment: Remove a factor
  const handleUnenrollMfa = async () => {
    const { factorUid } = disableMfaModal;
    setMfaLoading(true);
    setDisableMfaModal({ isOpen: false, factorUid: null });

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const mfaUser = multiFactor(user);
      const factor = mfaUser.enrolledFactors.find(f => f.uid === factorUid);

      if (factor) {
        await mfaUser.unenroll(factor);
        toast.success('Two-factor authentication disabled');

        // Refresh enrolled factors
        const enrolledMfaFactors = multiFactor(user).enrolledFactors;
        setEnrolledFactors(enrolledMfaFactors);
        setMfaEnabled(enrolledMfaFactors.length > 0);
      }
    } catch (error) {
      console.error('Error unenrolling MFA:', error);
      toast.error(error.message || 'Failed to disable 2FA');
    } finally {
      setMfaLoading(false);
    }
  };

  const loadSubMasters = async () => {
    try {
      const listSubMasters = httpsCallable(functions, 'listSubMasters');
      const result = await listSubMasters();
      setSubMasters(result.data.subMasters || []);
    } catch (error) {
      console.error('Error loading sub-masters:', error);
      toast.error('Failed to load sub-master accounts');
    }
  };

  const handleAddSubMaster = async (e) => {
    e.preventDefault();
    setMasterLoading(true);

    try {
      const addSubMaster = httpsCallable(functions, 'addSubMaster');
      await addSubMaster({
        email: subMasterForm.email,
        password: subMasterForm.password,
        displayName: subMasterForm.displayName
      });

      toast.success(`Sub-master account created for ${subMasterForm.email}`);
      setSubMasterForm({ email: '', password: '', displayName: '' });
      loadSubMasters(); // Reload list
    } catch (error) {
      console.error('Error adding sub-master:', error);
      toast.error(error.message || 'Failed to add sub-master account');
    } finally {
      setMasterLoading(false);
    }
  };

  const handleToggleSubMaster = async () => {
    try {
      const toggleSubMasterStatus = httpsCallable(functions, 'toggleSubMasterStatus');
      await toggleSubMasterStatus({
        subMasterId: toggleModal.subMasterId,
        isActive: !toggleModal.isActive
      });

      toast.success(`Sub-master account ${!toggleModal.isActive ? 'enabled' : 'disabled'}`);
      setToggleModal({ isOpen: false, subMasterId: null, email: '', isActive: false });
      loadSubMasters();
    } catch (error) {
      console.error('Error toggling sub-master:', error);
      toast.error(error.message || 'Failed to toggle sub-master status');
    }
  };

  const handleDeleteSubMaster = async () => {
    try {
      const deleteSubMaster = httpsCallable(functions, 'deleteSubMaster');
      await deleteSubMaster({ subMasterId: deleteModal.subMasterId });

      toast.success('Sub-master account deleted successfully');
      setDeleteModal({ isOpen: false, subMasterId: null, email: '' });
      loadSubMasters();
    } catch (error) {
      console.error('Error deleting sub-master:', error);
      toast.error(error.message || 'Failed to delete sub-master account');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubMasterFormChange = (e) => {
    setSubMasterForm({
      ...subMasterForm,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update display name in Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName
      });

      // Update display name in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: formData.displayName
      });

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateEmail(auth.currentUser, formData.email);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        email: formData.email
      });

      setSuccess('Email updated successfully!');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign in again to update your email');
      } else {
        setError(err.message || 'Failed to update email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(auth.currentUser, formData.newPassword);
      setSuccess('Password updated successfully!');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign in again to change your password');
      } else {
        setError(err.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCancelSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const cancelSubscription = httpsCallable(functions, 'cancelSubscription');
      const result = await cancelSubscription();

      if (result.data.success) {
        setShowCancelConfirm(false);
        toast.success(result.data.message);
        // Refresh user data to show updated status
        window.location.reload();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleDowngrade = () => {
    setShowDowngradeConfirm(false);
    setShowDowngradeModal(true);
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedDowngradePlan) {
      toast.error('Please select a plan to downgrade to');
      return;
    }

    try {
      setSubscriptionLoading(true);
      const downgradePlan = httpsCallable(functions, 'downgradePlan');
      const result = await downgradePlan({ newPlan: selectedDowngradePlan });

      if (result.data.success) {
        toast.success(result.data.message);
        setShowDowngradeModal(false);
        // Refresh user data to show pending downgrade
        window.location.reload();
      }
    } catch (error) {
      console.error('Error downgrading plan:', error);
      toast.error(error.message || 'Failed to downgrade plan');
    } finally {
      setSubscriptionLoading(false);
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
                <User className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-xs text-gray-600">Profile Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Title Banner */}
        <div className="mb-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <User size={28} />
                </div>
                Account Settings
              </h1>
              <p className="text-orange-100 text-lg">
                Manage your account details and preferences
              </p>
            </div>
            <div className="hidden lg:block">
              <Camera className="w-24 h-24 text-white/20" />
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-2xl flex items-start gap-4 shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <CheckCircle2 className="text-white" size={20} />
            </div>
            <p className="text-green-900 font-semibold">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl flex items-start gap-4 shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertCircle className="text-white" size={20} />
            </div>
            <p className="text-red-900 font-semibold">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-orange-50/30">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                  activeTab === 'profile'
                    ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <User size={18} />
                  <span>Profile</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('account')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                  activeTab === 'account'
                    ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Mail size={18} />
                  <span>Account</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                  activeTab === 'security'
                    ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Lock size={18} />
                  <span>Security</span>
                </div>
              </button>

              {/* CV Packs tab - only visible for Owner and Admin, not Members */}
              {(!userData?.teamAccess?.isTeamMember || userData?.teamAccess?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('cvpacks')}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                    activeTab === 'cvpacks'
                      ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Package size={18} />
                    <span>CV Packs</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => setActiveTab('customfields')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                  activeTab === 'customfields'
                    ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <List size={18} />
                  <span>Custom Fields</span>
                </div>
              </button>

              {/* Team tab - only show for team owners, not team members */}
              {!userData?.teamAccess?.isTeamMember && (
                <button
                  onClick={() => setActiveTab('team')}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                    activeTab === 'team'
                      ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Users size={18} />
                    <span>Team</span>
                  </div>
                </button>
              )}

              {isPrimaryMaster && (
                <button
                  onClick={() => setActiveTab('masters')}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                    activeTab === 'masters'
                      ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Shield size={18} />
                    <span>Master Management</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <User className="text-white" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                </div>

                {/* Profile Photo */}
                <div className="mb-8 flex items-center space-x-6 p-6 bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-2xl border border-gray-200">
                  <div className="relative">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName}
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-white text-3xl font-bold">
                          {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl border-2 border-white flex items-center justify-center hover:scale-110 transition-all shadow-md">
                      <Camera size={18} className="text-white" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{currentUser?.displayName}</h3>
                    <p className="text-gray-600 font-medium">{currentUser?.email}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium transition-all"
                      placeholder="Your full name"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Save size={20} />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <Mail className="text-white" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Account Details</h2>
                </div>

                <div className="space-y-6 mb-8">
                  {/* Team Member Status Banner */}
                  {userData?.teamAccess?.isTeamMember && (
                    <div className="p-5 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl shadow-lg">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <Users className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="text-purple-900 font-bold text-lg mb-1">Team Member Account</p>
                          <p className="text-purple-700 text-sm mb-2">
                            You are a <span className="font-semibold capitalize">{userData.teamAccess.role}</span> with access to the team owner's account
                          </p>
                          <div className="flex items-center gap-2 text-purple-600 text-xs">
                            <Shield size={14} />
                            <span>Access Level: {userData.teamAccess.role === 'admin' ? 'Full Access' : 'Limited Access'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Calendar className="text-gray-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">
                        {userData?.teamAccess?.isTeamMember ? 'Team Member Since' : 'Member Since'}
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold ml-8">
                      {formatDate(currentUser?.userData?.createdAt)}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <CreditCard className="text-gray-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">
                        {userData?.teamAccess?.isTeamMember ? 'Team Account Plan' : 'Current Plan'}
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold ml-8 capitalize">
                      {currentUser?.userData?.plan || 'Free'} Plan
                    </p>
                    {userData?.teamAccess?.isTeamMember && (
                      <p className="text-xs text-purple-600 ml-8 mt-1 flex items-center gap-1">
                        <Users size={12} />
                        Inherited from team owner
                      </p>
                    )}
                    <p className="text-sm text-gray-600 ml-8 mt-1">
                      {currentUser?.userData?.cvUploadsThisMonth || 0}
                      {(currentUser?.userData?.plan !== 'enterprise' && currentUser?.userData?.cvUploadLimit !== -1)
                        ? ` / ${currentUser?.userData?.cvUploadLimit || 10}`
                        : ''} CVs uploaded this month
                    </p>
                    {currentUser?.userData?.subscriptionStatus === 'active' && !userData?.teamAccess?.isTeamMember && (
                      <div className="ml-8 mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-green-600 font-medium mb-2">
                          Active Subscription
                        </p>
                        <div className="flex gap-2">
                          {(() => {
                            const planHierarchy = { free: 0, starter: 1, basic: 2, professional: 3, business: 4, enterprise: 5 };
                            const currentPlan = (currentUser?.userData?.plan || 'free').toLowerCase();
                            const hasDowngradeOptions = planHierarchy[currentPlan] > 1; // starter is level 1, so only basic+ can downgrade

                            return hasDowngradeOptions ? (
                              <button
                                onClick={() => setShowDowngradeConfirm(true)}
                                className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                              >
                                Downgrade Plan
                              </button>
                            ) : null;
                          })()}
                          <button
                            onClick={() => setShowCancelConfirm(true)}
                            className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                          >
                            Cancel Subscription
                          </button>
                        </div>
                      </div>
                    )}
                    {userData?.teamAccess?.isTeamMember && (
                      <div className="ml-8 mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-purple-600 font-medium">
                          Subscription managed by team owner
                        </p>
                      </div>
                    )}
                    {currentUser?.userData?.subscriptionStatus === 'pending_cancellation' && (
                      <div className="ml-8 mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-orange-600 font-medium">
                          Subscription ends at the end of billing period
                        </p>
                      </div>
                    )}
                    {currentUser?.userData?.pendingPlan && (
                      <div className="ml-8 mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-blue-600 font-medium">
                          Scheduled downgrade to {currentUser?.userData?.pendingPlan} at end of billing period
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleUpdateEmail} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      placeholder="your.email@example.com"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Changing your email may require you to sign in again
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || formData.email === currentUser?.email}
                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Save size={20} />
                    <span>{loading ? 'Updating...' : 'Update Email'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                    <Lock className="text-white" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
                </div>

                {currentUser?.providerData?.[0]?.providerId === 'google.com' ? (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <AlertCircle className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="text-blue-900 font-bold text-lg mb-1">Google Account</p>
                        <p className="text-blue-800 font-medium">
                          You're signed in with Google. Password changes must be made through your Google Account settings.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium transition-all"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium transition-all"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !formData.newPassword || !formData.confirmPassword}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Save size={20} />
                      <span>{loading ? 'Updating...' : 'Update Password'}</span>
                    </button>

                    <div className="p-4 bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-700 font-medium">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                  </form>
                )}

                {/* Multi-Factor Authentication Section */}
                <div className="mt-10 pt-10 border-t-2 border-gray-200">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <Smartphone className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Two-Factor Authentication (2FA)</h3>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                  </div>

                  {/* Check if user is on free plan */}
                  {(!currentUser?.userData?.plan || currentUser?.userData?.plan === 'free' || currentUser?.userData?.plan === 'Free') ? (
                    <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl shadow-lg">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <Shield className="text-white" size={24} />
                        </div>
                        <div>
                          <p className="text-orange-900 font-bold text-lg mb-2">Upgrade to Enable 2FA</p>
                          <p className="text-orange-800 font-medium mb-4">
                            Two-factor authentication is available on Starter, Professional, and Enterprise plans.
                          </p>
                          <button
                            onClick={() => navigate('/pricing')}
                            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
                          >
                            View Plans
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* MFA Status Card */}
                      <div className={`p-6 rounded-2xl border-2 shadow-lg ${
                        mfaEnabled
                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                              mfaEnabled
                                ? 'bg-gradient-to-br from-green-500 to-green-600'
                                : 'bg-gradient-to-br from-gray-400 to-gray-500'
                            }`}>
                              <Shield className="text-white" size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-lg text-gray-900 mb-1">
                                {mfaEnabled ? '2FA Enabled' : '2FA Disabled'}
                              </p>
                              <p className="text-sm text-gray-700 font-medium">
                                {mfaEnabled
                                  ? 'Your account is protected with two-factor authentication'
                                  : 'Add an extra layer of security to your account'}
                              </p>
                              {mfaEnabled && enrolledFactors.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {enrolledFactors.map((factor, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                      <Smartphone size={16} className="text-green-600" />
                                      <span className="font-medium text-gray-700">
                                        {factor.displayName || `Phone ending in ${factor.phoneNumber?.slice(-4)}`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowMfaEnrollment(!showMfaEnrollment)}
                            disabled={mfaLoading}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg ${
                              mfaEnabled || showMfaEnrollment
                                ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                          >
                            {mfaLoading ? 'Processing...' : (mfaEnabled ? 'Manage 2FA' : (showMfaEnrollment ? 'Cancel' : 'Enable 2FA'))}
                          </button>
                        </div>
                      </div>

                      {/* MFA Enrollment Form */}
                      {showMfaEnrollment && !mfaEnabled && (
                        <div className="p-6 bg-white border-2 border-blue-200 rounded-2xl shadow-lg">
                          <h4 className="font-bold text-lg text-gray-900 mb-4">Enable Two-Factor Authentication</h4>

                          {!showVerificationInput ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Phone Number (with country code)
                                </label>
                                <input
                                  type="tel"
                                  value={phoneNumber}
                                  onChange={(e) => setPhoneNumber(e.target.value)}
                                  placeholder="+27821234567"
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                  Enter your phone number with country code (e.g., +27 for South Africa)
                                </p>
                              </div>
                              <button
                                onClick={handleStartMfaEnrollment}
                                disabled={mfaLoading || !phoneNumber}
                                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                              >
                                {mfaLoading ? 'Sending...' : 'Send Verification Code'}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800 font-medium">
                                  Verification code sent to {phoneNumber}
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Verification Code
                                </label>
                                <input
                                  type="text"
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value)}
                                  placeholder="123456"
                                  maxLength={6}
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-2xl tracking-widest"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                  Enter the 6-digit code sent to your phone
                                </p>
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    setShowVerificationInput(false);
                                    setVerificationCode('');
                                  }}
                                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                                >
                                  Back
                                </button>
                                <button
                                  onClick={handleCompleteMfaEnrollment}
                                  disabled={mfaLoading || verificationCode.length !== 6}
                                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                  {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Invisible reCAPTCHA container */}
                          <div id="recaptcha-container"></div>
                        </div>
                      )}

                      {/* Manage Enrolled Factors */}
                      {mfaEnabled && showMfaEnrollment && (
                        <div className="p-6 bg-white border-2 border-green-200 rounded-2xl shadow-lg">
                          <h4 className="font-bold text-lg text-gray-900 mb-4">Manage Two-Factor Authentication</h4>

                          <div className="space-y-3">
                            {enrolledFactors.map((factor, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Smartphone size={20} className="text-green-600" />
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {factor.displayName || 'Phone Number'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Enrolled on {factor.enrollmentTime ? new Date(factor.enrollmentTime).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setDisableMfaModal({ isOpen: true, factorUid: factor.uid })}
                                  disabled={mfaLoading}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Information Box */}
                      <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                          <div className="text-sm text-blue-900">
                            <p className="font-bold mb-1">About Two-Factor Authentication</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-800">
                              <li>Requires your phone number for SMS verification</li>
                              <li>You'll need to enter a code sent to your phone when signing in</li>
                              <li>Significantly increases your account security</li>
                              <li>Available on all paid plans</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CV Packs Tab */}
            {activeTab === 'cvpacks' && (
              <CVPackPurchase />
            )}

            {/* Custom Fields Tab */}
            {activeTab === 'customfields' && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <List className="text-white" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Custom Fields</h2>
                </div>
                <CustomFieldsManager />
              </div>
            )}

            {/* Team Collaboration Tab - only for team owners */}
            {activeTab === 'team' && !userData?.teamAccess?.isTeamMember && (
              <TeamCollaboration />
            )}

            {/* Master Management Tab */}
            {activeTab === 'masters' && isPrimaryMaster && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                    <Shield className="text-white" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Master Account Management</h2>
                </div>

                <div className="mb-8 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <AlertCircle className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-orange-900 font-bold mb-1">Primary Master Account</p>
                      <p className="text-orange-800 text-sm">
                        You can create sub-master accounts with full SaaS access. Sub-masters cannot create additional master accounts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add Sub-Master Form */}
                <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-2xl border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-orange-500" />
                    Add New Sub-Master Account
                  </h3>

                  <form onSubmit={handleAddSubMaster} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={subMasterForm.email}
                          onChange={handleSubMasterFormChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium transition-all"
                          placeholder="submaster@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          name="displayName"
                          value={subMasterForm.displayName}
                          onChange={handleSubMasterFormChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Password * (minimum 6 characters)
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={subMasterForm.password}
                        onChange={handleSubMasterFormChange}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium transition-all"
                        placeholder="Enter password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={masterLoading || !subMasterForm.email || !subMasterForm.password}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <UserPlus size={20} />
                      <span>{masterLoading ? 'Creating...' : 'Create Sub-Master Account'}</span>
                    </button>
                  </form>
                </div>

                {/* Sub-Masters List */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-orange-500" />
                    Sub-Master Accounts ({subMasters.length})
                  </h3>

                  {subMasters.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                      <Shield className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-600 font-medium">No sub-master accounts yet</p>
                      <p className="text-sm text-gray-500 mt-1">Create your first sub-master account above</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                              <th className="px-6 py-4 text-left text-sm font-bold">Email</th>
                              <th className="px-6 py-4 text-left text-sm font-bold">Display Name</th>
                              <th className="px-6 py-4 text-left text-sm font-bold">Status</th>
                              <th className="px-6 py-4 text-left text-sm font-bold">Created</th>
                              <th className="px-6 py-4 text-right text-sm font-bold">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {subMasters.map((subMaster) => (
                              <tr key={subMaster.id} className="hover:bg-orange-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">{subMaster.email}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-gray-700 font-medium">{subMaster.displayName}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                      subMaster.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {subMaster.isActive ? 'Active' : 'Disabled'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-gray-600">
                                    {subMaster.createdAt ? new Date(subMaster.createdAt).toLocaleDateString() : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() =>
                                        setToggleModal({
                                          isOpen: true,
                                          subMasterId: subMaster.id,
                                          email: subMaster.email,
                                          isActive: subMaster.isActive
                                        })
                                      }
                                      className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                        subMaster.isActive
                                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                                      }`}
                                      title={subMaster.isActive ? 'Disable' : 'Enable'}
                                    >
                                      <Power size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteModal({
                                          isOpen: true,
                                          subMasterId: subMaster.id,
                                          email: subMaster.email
                                        })
                                      }
                                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all hover:scale-110"
                                      title="Delete"
                                    >
                                      <Trash2 size={16} />
                                    </button>
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, subMasterId: null, email: '' })}
        onConfirm={handleDeleteSubMaster}
        title="Delete Sub-Master Account"
        message={`Are you sure you want to permanently delete the sub-master account for ${deleteModal.email}? This action cannot be undone.`}
        confirmText="Delete Account"
        type="danger"
        icon={Trash2}
      />

      <ConfirmDialog
        isOpen={toggleModal.isOpen}
        onClose={() => setToggleModal({ isOpen: false, subMasterId: null, email: '', isActive: false })}
        onConfirm={handleToggleSubMaster}
        title={toggleModal.isActive ? 'Disable Sub-Master Account' : 'Enable Sub-Master Account'}
        message={`Are you sure you want to ${toggleModal.isActive ? 'disable' : 'enable'} the sub-master account for ${toggleModal.email}?`}
        confirmText={toggleModal.isActive ? 'Disable' : 'Enable'}
        type={toggleModal.isActive ? 'warning' : 'success'}
        icon={Power}
      />

      {/* Disable MFA Confirmation */}
      <ConfirmDialog
        isOpen={disableMfaModal.isOpen}
        onClose={() => setDisableMfaModal({ isOpen: false, factorUid: null })}
        onConfirm={handleUnenrollMfa}
        title="Disable Two-Factor Authentication"
        message="Are you sure you want to disable two-factor authentication? Your account will be less secure without it."
        confirmText="Disable 2FA"
        cancelText="Keep 2FA"
        type="danger"
        icon={Shield}
        confirmLoading={mfaLoading}
      />

      {/* Cancel Subscription Confirmation */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period."
        confirmText="Cancel Subscription"
        cancelText="Keep Subscription"
        type="danger"
        confirmLoading={subscriptionLoading}
      />

      {/* Downgrade Confirmation */}
      <ConfirmDialog
        isOpen={showDowngradeConfirm}
        onClose={() => setShowDowngradeConfirm(false)}
        onConfirm={handleDowngrade}
        title="Downgrade Plan"
        message="Are you sure you want to downgrade your plan? The downgrade will take effect at the end of your billing period. You'll be able to select the new plan in the next step."
        confirmText="Continue"
        cancelText="Cancel"
        type="warning"
      />

      {/* Downgrade Plan Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Downgrade Plan</h3>
            <p className="text-gray-600 mb-6">
              Select the plan you want to downgrade to. The downgrade will take effect at the end of your current billing period.
            </p>

            <div className="space-y-3 mb-6">
              {(() => {
                const availablePlans = ['starter', 'basic', 'professional', 'business'].filter(plan => {
                  const planHierarchy = { free: 0, starter: 1, basic: 2, professional: 3, business: 4, enterprise: 5 };
                  const currentPlan = (currentUser?.userData?.plan || 'free').toLowerCase();
                  return planHierarchy[plan] < planHierarchy[currentPlan];
                });

                if (availablePlans.length === 0) {
                  return (
                    <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
                      <p className="text-blue-900 font-semibold mb-2">You're on the lowest paid plan</p>
                      <p className="text-sm text-blue-700">
                        To downgrade further, you can cancel your subscription and return to the Free plan.
                      </p>
                    </div>
                  );
                }

                return availablePlans.map(plan => (
                  <button
                    key={plan}
                    onClick={() => setSelectedDowngradePlan(plan)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedDowngradePlan === plan
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="font-bold text-gray-900 capitalize">{plan} Plan</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {plan === 'starter' && '50 CVs/month - R199/month'}
                      {plan === 'basic' && '150 CVs/month - R399/month'}
                      {plan === 'professional' && '600 CVs/month - R999/month'}
                      {plan === 'business' && '1,500 CVs/month - R1,999/month'}
                    </div>
                  </button>
                ));
              })()}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDowngradeModal(false);
                  setSelectedDowngradePlan('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-all"
                disabled={subscriptionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDowngrade}
                disabled={!selectedDowngradePlan || subscriptionLoading}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscriptionLoading ? 'Processing...' : 'Confirm Downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
