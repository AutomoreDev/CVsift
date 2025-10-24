import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Smartphone } from 'lucide-react';
import { PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier, getMultiFactorResolver } from 'firebase/auth';
import { auth } from '../js/firebase-config';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // MFA state
  const [showMfaVerification, setShowMfaVerification] = useState(false);
  const [mfaResolver, setMfaResolver] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [verificationId, setVerificationId] = useState('');

  // Use ref for recaptchaVerifier to avoid async state update issues
  const recaptchaVerifierRef = useRef(null);

  const { signin, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Initialize reCAPTCHA when MFA verification is shown
  useEffect(() => {
    if (showMfaVerification && !recaptchaVerifierRef.current) {
      // Wait for DOM to be ready
      setTimeout(() => {
        try {
          const container = document.getElementById('mfa-recaptcha-container');
          if (!container) return;

          container.innerHTML = '';

          const verifier = new RecaptchaVerifier(auth, 'mfa-recaptcha-container', {
            size: 'invisible'
          });

          verifier.render().then(() => {
            recaptchaVerifierRef.current = verifier;
          }).catch((error) => {
            console.error('Error rendering reCAPTCHA:', error);
          });
        } catch (error) {
          console.error('Error initializing reCAPTCHA:', error);
        }
      }, 100);
    }

    return () => {
      if (recaptchaVerifierRef.current && !showMfaVerification) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (error) {
          console.error('Error clearing reCAPTCHA:', error);
        }
      }
    };
  }, [showMfaVerification]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await signin(formData.email.trim(), formData.password);
      navigate('/dashboard');
    } catch (error) {
      // Handle MFA required error
      if (error.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error);
        setMfaResolver(resolver);
        setShowMfaVerification(true);
        setLoading(false);

        // Send SMS code automatically
        setTimeout(() => {
          handleSendMfaCode(resolver);
        }, 500);
        return;
      }

      let errorMessage = 'Failed to sign in. Please try again.';

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. If you recently enabled MFA, please reset your password.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ submit: errorMessage });
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrors({});

    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      // Handle MFA required error for Google Sign-In
      if (error.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error);
        setMfaResolver(resolver);
        setShowMfaVerification(true);
        setGoogleLoading(false);

        // Send SMS code automatically
        setTimeout(() => {
          handleSendMfaCode(resolver);
        }, 500);
        return;
      }

      setErrors({
        submit: error.message || 'Failed to sign in with Google. Please try again.'
      });
      setGoogleLoading(false);
    }
  };

  // MFA: Send SMS verification code
  const handleSendMfaCode = async (resolver) => {
    if (!recaptchaVerifierRef.current) {
      setTimeout(() => handleSendMfaCode(resolver), 500);
      return;
    }

    setMfaLoading(true);
    try {
      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[0],
        session: resolver.session
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifierRef.current);

      setVerificationId(verId);

      // Log SMS verification for tracking
      try {
        const functions = getFunctions();
        const logSms = httpsCallable(functions, 'logSmsVerification');
        const phoneNumber = resolver.hints[0]?.phoneNumber || 'unknown';
        await logSms({
          phoneNumber: phoneNumber,
          purpose: 'mfa_signin'
        });
      } catch (logError) {
        console.error('Failed to log SMS verification:', logError);
        // Don't block the flow if logging fails
      }
    } catch (error) {
      setErrors({ submit: `Failed to send verification code: ${error.message}` });
    } finally {
      setMfaLoading(false);
    }
  };

  // MFA: Verify code and complete sign-in
  const handleVerifyMfaCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ submit: 'Please enter a valid 6-digit code' });
      return;
    }

    setMfaLoading(true);
    setErrors({});

    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      await mfaResolver.resolveSignIn(multiFactorAssertion);
      navigate('/dashboard');
    } catch (error) {
      if (error.code === 'auth/invalid-verification-code') {
        setErrors({ submit: 'Invalid verification code. Please try again.' });
      } else if (error.code === 'auth/code-expired') {
        setErrors({ submit: 'Verification code expired. Please request a new code.' });
      } else {
        setErrors({ submit: 'Failed to verify code. Please try again.' });
      }
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">CV</span>
            </div>
            <span className="text-3xl font-bold">Sift</span>
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!showMfaVerification ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                <p className="text-gray-600">Sign in to your CVSift account</p>
              </div>

              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800 text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link to="/reset-password" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || googleLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="text-orange-500 font-semibold hover:text-orange-600">
                Sign Up
              </a>
            </p>
          </div>
            </>
          ) : (
            <>
              {/* MFA Verification Form */}
              <div className="mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Smartphone className="text-orange-500" size={32} />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Two-Factor Authentication</h1>
                <p className="text-gray-600 text-center">Enter the 6-digit code sent to your phone</p>
              </div>

              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800 text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-center text-2xl tracking-widest"
                  />
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                <button
                  onClick={handleVerifyMfaCode}
                  disabled={mfaLoading || verificationCode.length !== 6}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {mfaLoading ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <button
                  onClick={() => {
                    setShowMfaVerification(false);
                    setVerificationCode('');
                    setErrors({});
                  }}
                  disabled={mfaLoading}
                  className="w-full text-gray-600 hover:text-gray-900 py-3 font-medium transition-colors disabled:opacity-50"
                >
                  Back to Sign In
                </button>
              </div>

              <div id="mfa-recaptcha-container"></div>
            </>
          )}
        </div>

        <div className="text-center text-sm text-gray-500 mt-6 space-y-2">
          <p>Protected by enterprise-grade security</p>
          <div className="flex items-center justify-center space-x-4">
            <a href="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/terms-of-service" className="hover:text-orange-500 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}