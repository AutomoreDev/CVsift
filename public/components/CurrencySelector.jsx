import React, { useState, useEffect } from 'react';
import { getAllCurrencies, getUserCurrency, setUserCurrency } from '../utils/currency';

/**
 * Currency Selector Component
 * Allows users to select their preferred currency for pricing display
 *
 * @param {function} onCurrencyChange - Callback when currency changes
 * @param {string} className - Additional CSS classes
 */
export default function CurrencySelector({ onCurrencyChange, className = '' }) {
  const [selectedCurrency, setSelectedCurrency] = useState('ZAR');
  const [isOpen, setIsOpen] = useState(false);
  const currencies = getAllCurrencies();

  useEffect(() => {
    // Load user's preferred currency on mount
    const userCurrency = getUserCurrency();
    setSelectedCurrency(userCurrency);
  }, []);

  const handleCurrencyChange = (currencyCode) => {
    setSelectedCurrency(currencyCode);
    setUserCurrency(currencyCode);
    setIsOpen(false);

    // Dispatch custom event to notify all useCurrency hooks
    window.dispatchEvent(new CustomEvent('currencyChanged', {
      detail: { currency: currencyCode }
    }));

    if (onCurrencyChange) {
      onCurrencyChange(currencyCode);
    }
  };

  const selectedCurrencyInfo = currencies.find(c => c.code === selectedCurrency);

  return (
    <div className={`currency-selector relative ${className}`}>
      {/* Currency Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label="Select currency"
      >
        <span className="text-xl">{selectedCurrencyInfo?.flag}</span>
        <span className="font-medium">{selectedCurrency}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
                Select Currency
              </div>
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencyChange(currency.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    selectedCurrency === currency.code
                      ? 'bg-orange-50 text-orange-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{currency.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-xs text-gray-500">{currency.name}</div>
                  </div>
                  {selectedCurrency === currency.code && (
                    <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compact Currency Selector (for mobile/smaller spaces)
 */
export function CompactCurrencySelector({ onCurrencyChange, className = '' }) {
  const [selectedCurrency, setSelectedCurrency] = useState('ZAR');
  const currencies = getAllCurrencies();

  useEffect(() => {
    const userCurrency = getUserCurrency();
    setSelectedCurrency(userCurrency);
  }, []);

  const handleChange = (e) => {
    const currencyCode = e.target.value;
    setSelectedCurrency(currencyCode);
    setUserCurrency(currencyCode);

    // Dispatch custom event to notify all useCurrency hooks
    window.dispatchEvent(new CustomEvent('currencyChanged', {
      detail: { currency: currencyCode }
    }));

    if (onCurrencyChange) {
      onCurrencyChange(currencyCode);
    }
  };

  return (
    <div className={`compact-currency-selector ${className}`}>
      <select
        value={selectedCurrency}
        onChange={handleChange}
        className="px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.flag} {currency.code} - {currency.symbol}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Currency Display Badge (read-only indicator)
 */
export function CurrencyBadge({ currency, className = '' }) {
  const currencies = getAllCurrencies();
  const currencyInfo = currencies.find(c => c.code === currency);

  if (!currencyInfo) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-sm ${className}`}>
      <span>{currencyInfo.flag}</span>
      <span className="font-medium">{currencyInfo.code}</span>
    </div>
  );
}
