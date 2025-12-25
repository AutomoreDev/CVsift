import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
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
      await resetPassword(email);
      setSuccess(true);
    } catch (error) {
      let errorMessage = 'Failed to send reset email. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }

      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-purple-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">CV</span>
            </div>
            <span className="text-3xl font-bold">Sift</span>
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!success ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-secondary-900 mb-2 font-heading">Reset Password</h1>
                <p className="text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800 text-sm">{errors.submit}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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
                      value={email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition-colors ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="you@company.com"
                      autoFocus
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent-500 hover:bg-accent-600 text-white py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/signin"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-accent-500 font-medium transition-colors"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Back to Sign In
                </a>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-secondary-900 mb-3 font-heading">Check Your Email</h1>
              <p className="text-gray-600 mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-secondary-900 font-semibold mb-6">{email}</p>
              <p className="text-sm text-gray-500 mb-8">
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </p>

              <div className="space-y-3">
                <a
                  href="/signin"
                  className="block w-full bg-accent-500 hover:bg-accent-600 text-white py-3 rounded-lg font-semibold transition-all hover:scale-[1.02]"
                >
                  Back to Sign In
                </a>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="block w-full text-accent-500 hover:text-accent-600 py-2 font-medium transition-colors"
                >
                  Send Another Link
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
