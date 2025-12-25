import { useState, useEffect } from 'react';
import {
  fetchExchangeRates,
  convertFromZAR,
  formatCurrency,
  getUserCurrency,
  SUPPORTED_CURRENCIES
} from '../utils/currency';

/**
 * React Hook for Currency Conversion
 * Automatically converts prices from ZAR to user's selected currency
 *
 * @returns {Object} Currency state and functions
 */
export function useCurrency() {
  const [currency, setCurrency] = useState('ZAR');
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load exchange rates on mount
  useEffect(() => {
    async function loadRates() {
      try {
        setLoading(true);
        const userCurrency = getUserCurrency();
        setCurrency(userCurrency);

        const exchangeRates = await fetchExchangeRates();
        setRates(exchangeRates);
        setError(null);
      } catch (err) {
        console.error('Error loading exchange rates:', err);
        setError('Failed to load exchange rates');
      } finally {
        setLoading(false);
      }
    }

    loadRates();

    // Listen for currency changes from other components
    const handleStorageChange = (e) => {
      if (e.key === 'preferredCurrency' && e.newValue) {
        setCurrency(e.newValue);
      }
    };

    // Listen for custom currency change event
    const handleCurrencyChange = (e) => {
      if (e.detail && e.detail.currency) {
        setCurrency(e.detail.currency);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('currencyChanged', handleCurrencyChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('currencyChanged', handleCurrencyChange);
    };
  }, []);

  /**
   * Convert a price from ZAR to current currency
   * @param {number} priceZAR - Price in ZAR
   * @returns {number} Converted price
   */
  const convertPrice = (priceZAR) => {
    if (priceZAR === null || priceZAR === undefined) return null;
    if (currency === 'ZAR') return priceZAR;
    if (!rates) return priceZAR;

    const rate = rates[currency];
    if (!rate) return priceZAR;

    return priceZAR * rate;
  };

  /**
   * Format a price with currency symbol
   * @param {number} price - Price to format
   * @param {string} targetCurrency - Currency to format in (defaults to current)
   * @returns {string} Formatted price string
   */
  const formatPrice = (price, targetCurrency = null) => {
    if (price === null) return 'Custom';
    return formatCurrency(price, targetCurrency || currency);
  };

  /**
   * Convert and format in one step
   * @param {number} priceZAR - Price in ZAR
   * @returns {string} Formatted converted price
   */
  const convertAndFormat = (priceZAR) => {
    const converted = convertPrice(priceZAR);
    return formatPrice(converted);
  };

  /**
   * Change currency
   * @param {string} newCurrency - New currency code
   */
  const changeCurrency = (newCurrency) => {
    if (SUPPORTED_CURRENCIES[newCurrency]) {
      setCurrency(newCurrency);
    }
  };

  /**
   * Get currency info
   */
  const currencyInfo = SUPPORTED_CURRENCIES[currency];

  return {
    currency,
    currencyInfo,
    rates,
    loading,
    error,
    convertPrice,
    formatPrice,
    convertAndFormat,
    changeCurrency
  };
}

export default useCurrency;
