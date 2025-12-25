/**
 * Currency Conversion Utility
 * Uses Frankfurter API (free, no API key required, no limits)
 * Supports real-time currency conversion for pricing display
 */

// Supported currencies with symbols and names
export const SUPPORTED_CURRENCIES = {
  ZAR: { symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  NGN: { symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' }
};

// Default base currency (all your prices are in ZAR)
const BASE_CURRENCY = 'ZAR';

// Cache for exchange rates
let ratesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Fetch latest exchange rates from Frankfurter API
 * @returns {Promise<Object>} Exchange rates object
 */
export async function fetchExchangeRates() {
  try {
    // Check cache first
    if (ratesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log('💱 Using cached exchange rates');
      return ratesCache;
    }

    console.log('💱 Fetching fresh exchange rates...');
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${BASE_CURRENCY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const rates = data.rates;

    // Frankfurter doesn't support NGN and KES
    // Calculate them indirectly: ZAR → USD → NGN/KES
    // As of 2025: 1 USD ≈ 1550 NGN, 1 USD ≈ 135 KES
    if (rates.USD) {
      const usdRate = rates.USD; // ZAR to USD rate
      const usdToNGN = 1550; // USD to NGN (approximate, updated periodically)
      const usdToKES = 135;  // USD to KES (approximate, updated periodically)

      rates.NGN = usdRate * usdToNGN; // ZAR to NGN
      rates.KES = usdRate * usdToKES; // ZAR to KES
    }

    // Cache the rates
    ratesCache = rates;
    cacheTimestamp = Date.now();

    console.log('💱 Exchange rates updated:', rates);
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);

    // Return fallback rates if API fails (approximate rates as of 2025)
    return {
      USD: 0.055,
      EUR: 0.051,
      GBP: 0.043,
      AUD: 0.084,
      CAD: 0.075,
      INR: 4.50,
      NGN: 85.25,  // 1 ZAR ≈ 85.25 NGN (calculated via USD: 0.055 * 1550)
      KES: 7.425,  // 1 ZAR ≈ 7.425 KES (calculated via USD: 0.055 * 135)
      ZAR: 1.0
    };
  }
}

/**
 * Convert amount from ZAR to target currency
 * @param {number} amountZAR - Amount in South African Rand
 * @param {string} targetCurrency - Target currency code (USD, EUR, GBP, etc.)
 * @param {Object} rates - Exchange rates object (optional, will fetch if not provided)
 * @returns {Promise<number>} Converted amount
 */
export async function convertFromZAR(amountZAR, targetCurrency, rates = null) {
  if (targetCurrency === 'ZAR') {
    return amountZAR;
  }

  const exchangeRates = rates || await fetchExchangeRates();
  const rate = exchangeRates[targetCurrency];

  if (!rate) {
    console.warn(`Exchange rate not found for ${targetCurrency}, using ZAR`);
    return amountZAR;
  }

  return amountZAR * rate;
}

/**
 * Format currency amount with proper symbol and decimals
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'ZAR') {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];

  if (!currencyInfo) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  // For currencies with very low per-unit values (NGN, KES, INR), round to whole numbers
  // For others, show 2 decimal places for accuracy
  const shouldRound = ['NGN', 'KES', 'INR'].includes(currency);

  let formattedAmount;
  if (shouldRound) {
    const roundedAmount = Math.round(amount);
    formattedAmount = roundedAmount.toLocaleString('en-US');
  } else {
    // Show 2 decimal places for currencies like USD, EUR, GBP, ZAR
    formattedAmount = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return `${currencyInfo.symbol}${formattedAmount}`;
}

/**
 * Get currency info
 * @param {string} currency - Currency code
 * @returns {Object} Currency info object
 */
export function getCurrencyInfo(currency) {
  return SUPPORTED_CURRENCIES[currency] || null;
}

/**
 * Detect user's currency based on their location
 * Uses browser's Intl API and timezone
 * @returns {string} Detected currency code
 */
export function detectUserCurrency() {
  try {
    // Try to get currency from browser locale
    const locale = navigator.language || navigator.userLanguage;

    // Map common locales to currencies
    const localeToCurrency = {
      'en-US': 'USD',
      'en-GB': 'GBP',
      'en-AU': 'AUD',
      'en-CA': 'CAD',
      'en-IN': 'INR',
      'en-ZA': 'ZAR',
      'af-ZA': 'ZAR',
      'zu-ZA': 'ZAR',
      'en-NG': 'NGN',
      'en-KE': 'KES'
    };

    // Check exact locale match
    if (localeToCurrency[locale]) {
      return localeToCurrency[locale];
    }

    // Check country code from locale (e.g., en-US -> US)
    const countryCode = locale.split('-')[1];
    const countryToCurrency = {
      'US': 'USD',
      'GB': 'GBP',
      'AU': 'AUD',
      'CA': 'CAD',
      'IN': 'INR',
      'ZA': 'ZAR',
      'NG': 'NGN',
      'KE': 'KES'
    };

    if (countryCode && countryToCurrency[countryCode]) {
      return countryToCurrency[countryCode];
    }

    // Try timezone-based detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      if (timezone.includes('Africa/Johannesburg') || timezone.includes('Africa/Cape_Town')) {
        return 'ZAR';
      }
      if (timezone.includes('America/New_York') || timezone.includes('America/Chicago')) {
        return 'USD';
      }
      if (timezone.includes('Europe/London')) {
        return 'GBP';
      }
      if (timezone.includes('Europe/')) {
        return 'EUR';
      }
      if (timezone.includes('Australia/')) {
        return 'AUD';
      }
      if (timezone.includes('Asia/Kolkata')) {
        return 'INR';
      }
      if (timezone.includes('Africa/Lagos')) {
        return 'NGN';
      }
      if (timezone.includes('Africa/Nairobi')) {
        return 'KES';
      }
    }

    // Default to ZAR (your base currency)
    return 'ZAR';
  } catch (error) {
    console.error('Error detecting currency:', error);
    return 'ZAR';
  }
}

/**
 * Get user's selected currency from localStorage or detect it
 * @returns {string} Currency code
 */
export function getUserCurrency() {
  try {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      return saved;
    }
  } catch (error) {
    console.error('Error reading currency from localStorage:', error);
  }

  return detectUserCurrency();
}

/**
 * Save user's preferred currency to localStorage
 * @param {string} currency - Currency code
 */
export function setUserCurrency(currency) {
  try {
    if (SUPPORTED_CURRENCIES[currency]) {
      localStorage.setItem('preferredCurrency', currency);
      console.log(`💱 Currency preference saved: ${currency}`);
    }
  } catch (error) {
    console.error('Error saving currency to localStorage:', error);
  }
}

/**
 * Convert and format a price from ZAR to user's currency
 * @param {number} priceZAR - Price in ZAR
 * @param {string} targetCurrency - Target currency (optional, will use user's currency)
 * @returns {Promise<string>} Formatted price string
 */
export async function convertAndFormatPrice(priceZAR, targetCurrency = null) {
  const currency = targetCurrency || getUserCurrency();
  const convertedAmount = await convertFromZAR(priceZAR, currency);
  return formatCurrency(convertedAmount, currency);
}

/**
 * Get all supported currencies as array for dropdown
 * @returns {Array} Array of currency objects
 */
export function getAllCurrencies() {
  return Object.keys(SUPPORTED_CURRENCIES).map(code => ({
    code,
    ...SUPPORTED_CURRENCIES[code]
  }));
}

/**
 * Clear exchange rate cache (useful for testing or manual refresh)
 */
export function clearRatesCache() {
  ratesCache = null;
  cacheTimestamp = null;
  console.log('💱 Exchange rates cache cleared');
}

/**
 * Check if exchange rates are cached and still valid
 * @returns {boolean} True if cache is valid
 */
export function isCacheValid() {
  return ratesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION);
}

/**
 * Get time until cache expires
 * @returns {number} Milliseconds until cache expires (0 if expired/no cache)
 */
export function getCacheTimeRemaining() {
  if (!cacheTimestamp) return 0;
  const remaining = CACHE_DURATION - (Date.now() - cacheTimestamp);
  return Math.max(0, remaining);
}
