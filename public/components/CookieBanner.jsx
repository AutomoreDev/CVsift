import { useEffect } from 'react';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';

/**
 * Cookie Consent Banner Component
 * 100% Free, GDPR/CCPA compliant, Google Consent Mode v2 integrated
 *
 * @param {string} language - Language code (default: 'en')
 * @param {string} privacyPolicyUrl - URL to privacy policy page
 */
export default function CookieBanner({
  language = 'en',
  privacyPolicyUrl = '/privacy'
}) {
  useEffect(() => {
    CookieConsent.run({
      // UI Configuration
      guiOptions: {
        consentModal: {
          layout: 'box inline',
          position: 'bottom right',
          equalWeightButtons: false,
          flipButtons: false
        },
        preferencesModal: {
          layout: 'box',
          position: 'right',
          equalWeightButtons: false,
          flipButtons: false
        }
      },

      // Consent categories
      categories: {
        necessary: {
          enabled: true,
          readOnly: true
        },
        analytics: {
          enabled: false,
          readOnly: false,
          // Automatically update Google Consent Mode
          autoClear: {
            cookies: [
              {
                name: /^(_ga|_gid)/  // Google Analytics cookies
              }
            ]
          },
          services: {
            ga: {
              label: 'Google Analytics',
              onAccept: () => {
                // Update Google Consent Mode
                if (window.gtag) {
                  window.gtag('consent', 'update', {
                    analytics_storage: 'granted'
                  });
                }
              },
              onReject: () => {
                if (window.gtag) {
                  window.gtag('consent', 'update', {
                    analytics_storage: 'denied'
                  });
                }
              }
            }
          }
        },
        advertising: {
          enabled: false,
          readOnly: false,
          services: {
            adsense: {
              label: 'Google AdSense',
              onAccept: () => {
                if (window.gtag) {
                  window.gtag('consent', 'update', {
                    ad_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted'
                  });
                }
              },
              onReject: () => {
                if (window.gtag) {
                  window.gtag('consent', 'update', {
                    ad_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied'
                  });
                }
              }
            }
          }
        }
      },

      // Language configuration
      language: {
        default: language,
        autoDetect: 'browser',
        translations: {
          en: {
            consentModal: {
              title: 'Cookie Preferences',
              description: 'CVSift uses cookies to keep you securely logged in, analyze how recruiters use our platform, and display relevant ads to Free plan users. Your privacy matters to us - you have full control over your preferences.',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Reject all',
              showPreferencesBtn: 'Manage preferences',
              footer: `
                <a href="${privacyPolicyUrl}">Privacy Policy</a>
              `
            },
            preferencesModal: {
              title: 'Cookie Preferences',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Reject all',
              savePreferencesBtn: 'Save preferences',
              closeIconLabel: 'Close',
              serviceCounterLabel: 'Service|Services',
              sections: [
                {
                  title: 'How CVSift Uses Cookies',
                  description: 'CVSift uses cookies to provide our AI-powered CV screening platform. Essential cookies keep you logged in and protect your recruitment data. Optional cookies help us improve the platform and show relevant content. By clicking "Accept All", you consent to our use of cookies as described below.'
                },
                {
                  title: 'Strictly Necessary Cookies <span class="pm__badge">Always Enabled</span>',
                  description: 'These cookies are essential for CVSift to function. They enable secure authentication to your account, protect your CV data and job specifications, and maintain your active recruitment sessions. Without these cookies, you cannot access the platform.',
                  linkedCategory: 'necessary',
                  cookieTable: {
                    headers: {
                      name: 'Cookie',
                      domain: 'Domain',
                      description: 'Description',
                      expiration: 'Expiration'
                    },
                    body: [
                      {
                        name: 'cc_cookie',
                        domain: '.cvsift-3dff8.web.app',
                        description: 'Stores your cookie consent preferences',
                        expiration: '6 months'
                      },
                      {
                        name: 'Firebase Auth',
                        domain: '.firebaseapp.com',
                        description: 'Maintains your secure login session',
                        expiration: 'Session/Persistent'
                      },
                      {
                        name: 'localStorage',
                        domain: 'Browser storage',
                        description: 'Temporarily stores payment transaction IDs during checkout',
                        expiration: 'Until cleared'
                      }
                    ]
                  }
                },
                {
                  title: 'Analytics Cookies',
                  description: 'Analytics cookies help us understand how recruiters and hiring managers use CVSift. We collect anonymous data about feature usage, CV upload patterns, and matching performance to improve our AI algorithms and user experience. This data is never linked to specific candidates or CVs.',
                  linkedCategory: 'analytics',
                  cookieTable: {
                    headers: {
                      name: 'Cookie',
                      domain: 'Domain',
                      description: 'Description',
                      expiration: 'Expiration'
                    },
                    body: [
                      {
                        name: '_ga',
                        domain: '.cvsift-3dff8.web.app',
                        description: 'Tracks anonymous usage patterns to improve CVSift features',
                        expiration: '2 years'
                      },
                      {
                        name: '_gid',
                        domain: '.cvsift-3dff8.web.app',
                        description: 'Tracks session-based interactions with the platform',
                        expiration: '24 hours'
                      },
                      {
                        name: 'Firebase Analytics',
                        domain: '.firebaseapp.com',
                        description: 'Tracks CV uploads, matching performance, and feature usage',
                        expiration: 'Varies'
                      }
                    ]
                  }
                },
                {
                  title: 'Advertising Cookies',
                  description: 'Advertising cookies enable us to offer CVSift for free to users on our Free plan. These cookies help display relevant recruitment and HR-related ads, measure ad effectiveness, and keep CVSift accessible to small businesses and startups. Paid plan users never see ads.',
                  linkedCategory: 'advertising',
                  cookieTable: {
                    headers: {
                      name: 'Cookie',
                      domain: 'Domain',
                      description: 'Description'
                    },
                    body: [
                      {
                        name: 'Google AdSense',
                        domain: '.google.com',
                        description: 'Displays recruitment-relevant ads to Free plan users only'
                      }
                    ]
                  }
                },
                {
                  title: 'More Information',
                  description: `For complete details about how CVSift protects your recruitment data and candidate privacy, please read our <a href="${privacyPolicyUrl}" target="_blank">Privacy Policy</a>. If you have questions, contact us at emma@automore.co.za.`
                }
              ]
            }
          }
        }
      }
    });
  }, [language, privacyPolicyUrl]);

  return null; // This component doesn't render anything itself
}

/**
 * Helper function to show cookie preferences modal
 * Use this in your footer or settings page
 */
export function showCookiePreferences() {
  if (CookieConsent.showPreferences) {
    CookieConsent.showPreferences();
  }
}

/**
 * Helper function to check if a category is accepted
 * @param {string} category - Category name ('analytics', 'advertising', etc.)
 * @returns {boolean}
 */
export function isCategoryAccepted(category) {
  const cookie = CookieConsent.getCookie();
  return cookie?.categories?.includes(category) || false;
}

/**
 * Helper function to get all accepted categories
 * @returns {Array<string>}
 */
export function getAcceptedCategories() {
  const cookie = CookieConsent.getCookie();
  return cookie?.categories || [];
}
