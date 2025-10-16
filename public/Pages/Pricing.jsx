import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../js/firebase-config';
import { CheckCircle2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function Pricing() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const pricingPlans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'ZAR',
      cvLimit: 10,
      features: [
        'Basic filtering (skills, location)',
        '7-day data retention',
        'Email support',
        'Export to CSV'
      ],
      current: currentUser?.userData?.plan === 'free',
      disabled: currentUser?.userData?.plan === 'free'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 299,
      currency: 'ZAR',
      cvLimit: 500,
      features: [
        'All filtering options',
        '90-day data retention',
        'Priority email support',
        'Advanced export options',
        'Bulk upload',
        'Email notifications'
      ],
      popular: true,
      current: currentUser?.userData?.plan === 'basic'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 799,
      currency: 'ZAR',
      cvLimit: 2000,
      features: [
        'Everything in Basic',
        'API access',
        '1-year data retention',
        'Advanced analytics dashboard',
        'Team collaboration (3 users)',
        'Custom fields',
        'Priority support'
      ],
      current: currentUser?.userData?.plan === 'professional'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      currency: 'ZAR',
      cvLimit: 'Unlimited',
      features: [
        'Everything in Professional',
        'Custom integrations',
        'Dedicated account manager',
        'SSO & advanced security',
        'White-label option',
        'Custom data retention',
        'SLA guarantee'
      ],
      contact: true,
      current: currentUser?.userData?.plan === 'enterprise'
    }
  ];

  const handleSelectPlan = async (plan) => {
    if (!currentUser) {
      navigate('/signup');
      return;
    }

    if (plan.contact) {
      window.location.href = 'mailto:sales@cvsift.com';
      return;
    }

    if (plan.id === 'free' || plan.disabled) {
      return;
    }

    try {
      setLoading(plan.id);
      setError(null);

      // Call cloud function to create payment
      const createPayment = httpsCallable(functions, 'createPayment');
      const result = await createPayment({
        plan: plan.id,
        amount: plan.price,
        itemName: `CVSift ${plan.name} Plan - Monthly Subscription`
      });

      const { paymentUrl, paymentData } = result.data;

      // Create form and submit to PayFast
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentUrl;

      Object.keys(paymentData).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentData[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 transition-colors hover:text-orange-500"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <span className="text-xl font-bold text-white">CV</span>
              </div>
              <span className="text-2xl font-bold">Sift</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-12 mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Choose Your <span className="text-orange-500">Plan</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Upgrade your account to unlock more features and increase your CV upload limit
          </p>
          {currentUser?.userData?.plan && (
            <div className="mt-4">
              <span className="inline-block px-4 py-2 text-sm font-medium text-orange-800 bg-orange-100 rounded-full">
                Current Plan: <span className="capitalize">{currentUser.userData.plan}</span>
              </span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl p-4 mx-auto mb-6 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-medium text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-8 border-2 transition-all ${
                plan.popular
                  ? 'border-orange-500 shadow-2xl shadow-orange-500/20 scale-105'
                  : plan.current
                  ? 'border-green-500'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute px-4 py-1 text-sm font-semibold text-white -translate-x-1/2 bg-orange-500 rounded-full -top-4 left-1/2">
                  Most Popular
                </div>
              )}

              {plan.current && (
                <div className="absolute px-4 py-1 text-sm font-semibold text-white -translate-x-1/2 bg-green-500 rounded-full -top-4 left-1/2">
                  Current Plan
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline mb-1">
                  {plan.price !== null ? (
                    <>
                      <span className="mr-1 text-sm text-gray-500">{plan.currency}</span>
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="ml-2 text-gray-500">/month</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold">Custom</span>
                  )}
                </div>
                <div className="inline-block px-3 py-1 mt-4 bg-gray-100 rounded-full">
                  <span className="text-sm font-semibold text-gray-700">
                    {plan.cvLimit} CVs/month
                  </span>
                </div>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <CheckCircle2 className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={loading === plan.id || plan.disabled}
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${
                  plan.current
                    ? 'bg-green-500 text-white cursor-default'
                    : plan.popular
                    ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                    : plan.disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${loading === plan.id ? 'opacity-50 cursor-wait' : ''}`}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : plan.current ? (
                  <span>Current Plan</span>
                ) : plan.contact ? (
                  <span>Contact Sales</span>
                ) : plan.disabled ? (
                  <span>Current Plan</span>
                ) : (
                  <span>Upgrade Now</span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-gray-600">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="text-sm text-gray-500">
            Need help choosing? <a href="mailto:support@cvsift.com" className="text-orange-500 hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
}