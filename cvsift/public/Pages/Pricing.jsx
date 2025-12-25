import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../js/firebase-config';
import { CheckCircle2, ArrowLeft, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { trackPaymentInitiated, trackError } from '../utils/analytics';
import useCurrency from '../hooks/useCurrency';
import CurrencySelector from '../components/CurrencySelector';

export default function Pricing() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const { convertAndFormat, currency, loading: currencyLoading } = useCurrency();

  const pricingPlans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'ZAR',
      cvLimit: 10,
      features: [
        'Basic filtering (skills, location)',
        'Email support',
        'Advanced analytics'
      ],
      current: currentUser?.userData?.plan === 'free',
      disabled: currentUser?.userData?.plan === 'free'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 199,
      currency: 'ZAR',
      cvLimit: 50,
      features: [
        'Basic + advanced filtering',
        'Email support',
        'Bulk upload',
        'Job spec creation',
        'Email notifications',
        'Advanced analytics'
      ],
      popular: false,
      current: currentUser?.userData?.plan === 'starter'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 399,
      currency: 'ZAR',
      cvLimit: 150,
      features: [
        'All filtering options',
        'Priority email support',
        'Advanced analytics',
        'Bulk upload',
        'Email notifications',
        'Match CVs to job specs'
      ],
      popular: true,
      current: currentUser?.userData?.plan === 'basic'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 999,
      currency: 'ZAR',
      cvLimit: 600,
      features: [
        'Everything in Basic',
        'Real-Time EEA Compliance Dashboard',
        'Employee Demographics Tracking',
        'EAP Target Monitoring',
        'AI Chatbot Assistant',
        'API access',
        'Team collaboration (3 users)',
        'Custom fields',
        'Priority support'
      ],
      current: currentUser?.userData?.plan === 'professional'
    },
    {
      id: 'business',
      name: 'Business',
      price: 1999,
      currency: 'ZAR',
      cvLimit: 1500,
      features: [
        'Everything in Professional',
        'Advanced EEA Analytics & Reporting',
        'Strategic Hiring Impact Calculator',
        'Automated EEA2 Report Generation',
        'Higher volume (1,500 CVs)',
        'Team collaboration (10 users)',
        'Custom integrations',
        'Priority support'
      ],
      current: currentUser?.userData?.plan === 'business'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      currency: 'ZAR',
      cvLimit: 'Unlimited',
      features: [
        'Everything in Business',
        'Full EEA Compliance Suite',
        'Multi-Company EEA Management',
        'Custom EEA Workflows & Alerts',
        'Unlimited CV processing',
        'Custom integrations',
        'Dedicated account manager',
        'SSO & advanced security',
        'White-label option',
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
      window.location.href = 'mailto:emma@automore.co.za';
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

      const { paymentUrl, paymentData, paymentId } = result.data;

      // Track payment initiation
      trackPaymentInitiated(plan.id, plan.price);

      // Store payment ID in localStorage so we can check status after redirect
      localStorage.setItem('pendingPaymentId', paymentId);

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

      // Track payment initiation error
      trackError('payment_initiation_failed', err.message, 'Pricing');
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
              className="flex items-center space-x-2 text-gray-600 transition-colors hover:text-accent-500"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600">
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
          <h1 className="mb-4 text-4xl font-bold text-secondary-900 md:text-5xl font-heading">
            Choose Your <span className="text-accent-500">Plan</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Upgrade your account to unlock more features and increase your CV upload limit
          </p>
          {currentUser?.userData?.plan && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <span className="inline-block px-4 py-2 text-sm font-medium text-accent-800 bg-accent-100 rounded-full">
                Current Plan: <span className="capitalize">{currentUser.userData.plan}</span>
              </span>
              <CurrencySelector />
            </div>
          )}
          {!currentUser?.userData?.plan && (
            <div className="mt-4 flex justify-center">
              <CurrencySelector />
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

        {/* Pricing Cards - Cleaner 3-column layout */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {pricingPlans.filter(p => p.id !== 'enterprise').map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl p-6 border transition-all hover:shadow-xl ${
                plan.popular
                  ? 'border-accent-500 shadow-lg ring-2 ring-accent-500 ring-opacity-50'
                  : plan.current
                  ? 'border-green-500'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute px-3 py-1 text-xs font-bold text-white bg-accent-500 rounded-full -top-3 left-6">
                  MOST POPULAR
                </div>
              )}

              {plan.current && (
                <div className="absolute px-3 py-1 text-xs font-bold text-white bg-green-500 rounded-full -top-3 left-6">
                  CURRENT
                </div>
              )}

              {/* Header */}
              <div className="mb-6 text-center">
                <h3 className="mb-3 text-xl font-bold text-secondary-900 font-heading">{plan.name}</h3>
                <div className="mb-4">
                  {plan.price !== null ? (
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-gray-900">
                        {currencyLoading ? 'Loading...' : convertAndFormat(plan.price)}
                      </span>
                      <span className="ml-2 text-gray-500">/mo</span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">Custom</div>
                  )}
                </div>
                <div className="inline-block px-4 py-1.5 bg-accent-50 border border-accent-200 rounded-full">
                  <span className="text-sm font-bold text-accent-700">
                    {plan.cvLimit} CVs/month
                  </span>
                </div>
              </div>

              {/* Key Features - Show only top 3 */}
              <ul className="mb-6 space-y-2.5 min-h-[120px]">
                {plan.features.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="text-accent-500 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
                {plan.features.length > 3 && (
                  <li className="text-sm text-gray-500 italic">+ {plan.features.length - 3} more features</li>
                )}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={loading === plan.id || plan.disabled}
                className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
                  plan.current
                    ? 'bg-green-500 text-white cursor-default'
                    : plan.popular
                    ? 'bg-accent-500 text-white hover:bg-accent-600'
                    : plan.disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } ${loading === plan.id ? 'opacity-50 cursor-wait' : ''}`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center space-x-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : plan.current ? (
                  'Current Plan'
                ) : plan.contact ? (
                  'Contact Sales'
                ) : (
                  'Get Started'
                )}
              </button>
              {!plan.current && !plan.contact && plan.price !== null && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Billed monthly. Cancel anytime.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Enterprise Card - Separate */}
        {pricingPlans.filter(p => p.id === 'enterprise').map((plan) => (
          <div key={plan.id} className="max-w-4xl mx-auto mt-12">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2 font-heading">{plan.name}</h3>
                  <p className="text-gray-300 mb-4">For large organizations with complex needs</p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Unlimited CVs</span>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Custom Integrations</span>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Dedicated Support</span>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className="px-8 py-3 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition-all"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Feature Comparison Table */}
        <div className="mt-16 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-secondary-900 mb-8 font-heading">
            Compare <span className="text-accent-500">Plans</span>
          </h2>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Features</th>
                    {pricingPlans.map((plan) => (
                      <th key={plan.id} className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-bold ${plan.popular ? 'text-accent-500' : 'text-gray-900'}`}>
                            {plan.name}
                          </span>
                          {plan.price !== null ? (
                            <span className="text-xs text-gray-500 mt-1">
                              {currencyLoading ? '...' : convertAndFormat(plan.price)}/mo
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 mt-1">Custom</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* CV Limits */}
                  <tr className="bg-accent-50/30">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={pricingPlans.length + 1}>
                      CV Processing
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Monthly CV limit</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">10</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">50</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">150</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">600</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">1,500</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-accent-600">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Bulk upload</td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>

                  {/* Filtering */}
                  <tr className="bg-accent-50/30">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={pricingPlans.length + 1}>
                      Filtering & Search
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Advanced filtering (skills, location, etc.)</td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Match job specs to CVs</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Custom fields</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>

                  {/* Features */}
                  <tr className="bg-accent-50/30">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={pricingPlans.length + 1}>
                      Features & Tools
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Job spec creation</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">AI Chatbot Assistant</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Email notifications</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Advanced analytics</td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Professional CV Builder (with AI parsing)</td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>

                  {/* EEA Compliance */}
                  <tr className="bg-green-50/50">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={pricingPlans.length + 1}>
                      EEA Compliance (South Africa)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Real-time compliance dashboard</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Employee demographics tracking</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">EAP target monitoring</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Automated EEA2 report generation</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Strategic hiring impact calculator</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Multi-company EEA management</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-green-500" /></td>
                  </tr>

                  {/* Collaboration */}
                  <tr className="bg-accent-50/30">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={pricingPlans.length + 1}>
                      Collaboration & Security
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Team collaboration</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">1 user</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">1 user</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">1 user</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">3 users</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">10 users</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Custom integrations</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">SSO & advanced security</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">White-label option</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>

                  {/* Support */}
                  <tr className="bg-accent-50/30">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={pricingPlans.length + 1}>
                      Support
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Email support</td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Priority</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Priority</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Priority</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Dedicated</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Dedicated account manager</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">SLA guarantee</td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                    <td className="px-6 py-4 text-center"><Check size={18} className="mx-auto text-accent-500" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-gray-600">
            Start with our free plan. Upgrade anytime as your needs grow.
          </p>
          <p className="text-sm text-gray-500">
            Need help choosing? <a href="mailto:emma@automore.co.za" className="text-accent-500 hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
}