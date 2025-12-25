import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { currentUser, refreshUserData } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState('checking'); // checking, pending, complete, error
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Get payment ID from localStorage (set before redirecting to PayFast)
    const pendingPaymentId = localStorage.getItem('pendingPaymentId');

    if (!pendingPaymentId) {
      // No pending payment, just redirect
      setPaymentStatus('complete');
      return;
    }

    // Poll for payment status
    let pollCount = 0;
    const maxPolls = 20; // Poll for up to 40 seconds (20 * 2 seconds)

    const checkPaymentStatus = async () => {
      try {
        const functions = getFunctions();
        const getPaymentStatus = httpsCallable(functions, 'getPaymentStatus');
        const result = await getPaymentStatus({ paymentId: pendingPaymentId });

        if (result.data.payment) {
          const payment = result.data.payment;
          setPaymentDetails(payment);

          if (payment.status === 'COMPLETE') {
            setPaymentStatus('complete');
            localStorage.removeItem('pendingPaymentId');

            // Force refresh user data to show updated balance/plan
            if (refreshUserData) {
              await refreshUserData();
            }

            return true; // Stop polling
          } else if (payment.status === 'CANCELLED') {
            setPaymentStatus('error');
            localStorage.removeItem('pendingPaymentId');
            return true; // Stop polling
          } else {
            setPaymentStatus('pending');
          }
        }

        pollCount++;
        if (pollCount >= maxPolls) {
          setPaymentStatus('pending'); // Still pending after max polls
          return true; // Stop polling
        }

        return false; // Continue polling
      } catch (error) {
        console.error('Error checking payment status:', error);
        pollCount++;
        if (pollCount >= maxPolls) {
          setPaymentStatus('error');
          return true;
        }
        return false;
      }
    };

    // Initial check
    checkPaymentStatus().then(shouldStop => {
      if (shouldStop) return;

      // Continue polling every 2 seconds
      const pollInterval = setInterval(async () => {
        const shouldStop = await checkPaymentStatus();
        if (shouldStop) {
          clearInterval(pollInterval);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    });
  }, [currentUser]);

  // Countdown timer for redirect
  useEffect(() => {
    if (paymentStatus === 'complete') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentStatus, navigate]);

  // Render different states
  if (paymentStatus === 'checking' || paymentStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-blue-500 animate-pulse" size={48} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Processing Your Payment
          </h1>

          <p className="text-gray-600 mb-8">
            We're confirming your payment with PayFast. This usually takes just a few moments...
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800">
              Please don't close this window. Your account will be updated automatically once payment is confirmed.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-500" size={48} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Issue
          </h1>

          <p className="text-gray-600 mb-8">
            We encountered an issue confirming your payment. Please contact support if this issue persists.
          </p>

          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
          >
            Return to Pricing
          </button>
        </div>
      </div>
    );
  }

  // Complete status
  const isPack = paymentDetails?.purchaseType === 'cv_pack';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-green-500" size={48} />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>

        <p className="text-gray-600 mb-8">
          {isPack
            ? `Thank you for your purchase! ${paymentDetails?.cvCount || ''} CVs have been added to your account.`
            : 'Thank you for upgrading your CVSift plan. Your account has been updated and you can now enjoy all the premium features.'
          }
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-green-800">
            {isPack
              ? 'Your CV pack has been added to your account. These CVs never expire and will be used automatically when your monthly limit is reached.'
              : 'Your monthly subscription is now active. You will receive a confirmation email shortly.'
            }
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
        >
          Go to Dashboard
        </button>

        <p className="text-sm text-gray-500 mt-4">
          Redirecting automatically in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}