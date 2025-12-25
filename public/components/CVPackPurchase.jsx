import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../js/firebase-config';
import { getCVPacks } from '../config/planConfig';
import { Package, CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import useCurrency from '../hooks/useCurrency';
import { CompactCurrencySelector } from './CurrencySelector';

export default function CVPackPurchase() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const { convertAndFormat, convertPrice, formatPrice, currency, loading: currencyLoading } = useCurrency();

  const cvPacks = getCVPacks();
  const cvPackBalance = currentUser?.userData?.cvPackBalance || 0;

  const handlePurchasePack = async (pack) => {
    try {
      setLoading(pack.id);
      setError(null);

      // Call cloud function to create payment
      const createPayment = httpsCallable(functions, 'createPayment');
      const result = await createPayment({
        purchaseType: 'cv_pack',
        cvPackId: pack.id,
        cvCount: pack.cvCount,
        amount: pack.price,
        itemName: pack.name
      });

      const { paymentUrl, paymentData, paymentId } = result.data;

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
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <Package className="text-white" size={20} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-2xl font-bold text-gray-900">CV Packs</h2>
          <p className="text-sm text-gray-600">Purchase extra CVs to supplement your monthly plan</p>
        </div>
        <CompactCurrencySelector />
      </div>

      {/* Current Balance */}
      {cvPackBalance > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">Available CV Pack Balance</p>
              <p className="text-2xl font-bold text-green-900">{cvPackBalance} CVs</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50">
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

      {/* How It Works */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="font-semibold text-blue-900 mb-2">How CV Packs Work</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>CV Packs never expire - use them anytime</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>Used automatically when your monthly limit is reached</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>Works with all subscription plans</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>Larger packs offer better value per CV</span>
          </li>
        </ul>
      </div>

      {/* CV Pack Options */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cvPacks.map((pack) => (
          <div
            key={pack.id}
            className={`relative bg-white rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
              pack.popular
                ? 'border-purple-500 shadow-xl shadow-purple-500/20'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            {pack.popular && (
              <div className="absolute px-3 py-1 text-xs font-semibold text-white bg-purple-500 rounded-full -top-3 left-1/2 -translate-x-1/2">
                Best Value
              </div>
            )}

            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg mb-3">
                <Package className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{pack.name}</h3>
              <div className="inline-block px-3 py-1 bg-purple-100 rounded-full">
                <span className="text-sm font-bold text-purple-900">{pack.cvCount} CVs</span>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="flex items-baseline justify-center mb-1">
                <span className="text-3xl font-bold text-gray-900">
                  {currencyLoading ? 'Loading...' : convertAndFormat(pack.price)}
                </span>
              </div>
              {pack.savings && (
                <p className="text-xs font-semibold text-green-600">{pack.savings}</p>
              )}
              {!currencyLoading && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatPrice(convertPrice(pack.price) / pack.cvCount, currency)} per CV
                </p>
              )}
            </div>

            <button
              onClick={() => handlePurchasePack(pack)}
              disabled={loading === pack.id}
              className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                pack.popular
                  ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${loading === pack.id ? 'opacity-50 cursor-wait' : ''}`}
            >
              {loading === pack.id ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Purchase Pack</span>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>All transactions are processed securely through PayFast</p>
      </div>
    </div>
  );
}
