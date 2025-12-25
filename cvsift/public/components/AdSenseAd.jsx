import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as CookieConsent from 'vanilla-cookieconsent';

/**
 * Check if user has given ad consent via vanilla-cookieconsent
 */
const hasAdConsent = () => {
  try {
    const cookie = CookieConsent.getCookie();
    return cookie?.categories?.includes('advertising') || false;
  } catch (error) {
    // If cookie consent hasn't loaded yet, default to denied (privacy-first)
    return false;
  }
};

/**
 * AdSense Component - Only shows ads for Free plan users with consent
 * Non-intrusive placement with proper styling
 *
 * Props:
 * - slot: AdSense ad slot ID (required)
 * - format: Ad format (default: 'auto')
 * - style: Custom styles for the ad container
 * - className: Additional CSS classes
 */
export default function AdSenseAd({
  slot,
  format = 'auto',
  style = {},
  className = '',
  fullWidthResponsive = true
}) {
  const { currentUser } = useAuth();
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Check consent status
    const checkConsent = () => {
      setConsentGiven(hasAdConsent());
    };

    // Check immediately
    checkConsent();

    // Listen for consent changes
    const interval = setInterval(checkConsent, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Only load ads for free users with consent
    if (shouldShowAds() && consentGiven) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [currentUser, consentGiven]);

  // Determine if user should see ads
  const shouldShowAds = () => {
    // Don't show ads if user is not logged in
    if (!currentUser) return false;

    // Get user plan from userData
    const userPlan = currentUser?.userData?.plan;

    // Only show ads to Free plan users
    if (userPlan === 'free' || userPlan === 'Free') return true;

    // Don't show ads to paid users
    return false;
  };

  // Don't render anything if ads shouldn't be shown or consent not given
  if (!shouldShowAds() || !consentGiven) {
    return null;
  }

  return (
    <div className={`adsense-container my-6 ${className}`} style={style}>
      <div className="text-xs text-gray-400 text-center mb-1">Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-8629316693437703"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive}
      ></ins>
    </div>
  );
}

// Preset ad components for common placements

/**
 * Horizontal Banner Ad - Good for top/bottom of pages
 */
export function HorizontalBannerAd({ className = '' }) {
  return (
    <AdSenseAd
      slot="1234567890" // Replace with your actual ad slot ID
      format="horizontal"
      className={className}
      style={{ minHeight: '90px' }}
    />
  );
}

/**
 * Sidebar Ad - Good for side panels
 */
export function SidebarAd({ className = '' }) {
  return (
    <AdSenseAd
      slot="0987654321" // Replace with your actual ad slot ID
      format="vertical"
      className={className}
      style={{ minHeight: '250px', minWidth: '250px' }}
    />
  );
}

/**
 * In-Feed Ad - Good for list views
 */
export function InFeedAd({ className = '' }) {
  return (
    <AdSenseAd
      slot="1122334455" // Replace with your actual ad slot ID
      format="fluid"
      className={className}
      style={{ minHeight: '100px' }}
    />
  );
}

/**
 * Small Rectangle Ad - Good for dashboard cards
 */
export function SmallRectangleAd({ className = '' }) {
  return (
    <AdSenseAd
      slot="5566778899" // Replace with your actual ad slot ID
      format="rectangle"
      className={className}
      style={{ minHeight: '250px', minWidth: '250px' }}
    />
  );
}

/**
 * Public Ad Component - Shows ads on public pages (no login required)
 * Used for landing page, about page, etc.
 *
 * This component shows ads to ALL visitors (logged in or not) with ad consent.
 * Only checks for cookie consent, not user authentication.
 */
export function PublicAd({
  slot,
  format = 'auto',
  style = {},
  className = '',
  fullWidthResponsive = true
}) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Check consent status
    const checkConsent = () => {
      setConsentGiven(hasAdConsent());
    };

    // Check immediately
    checkConsent();

    // Listen for consent changes
    const interval = setInterval(checkConsent, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load ads when consent is given
    if (consentGiven && !adLoaded) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [consentGiven, adLoaded]);

  // Don't render anything if consent not given
  if (!consentGiven) {
    return null;
  }

  return (
    <div className={`adsense-container my-6 ${className}`} style={style}>
      <div className="text-xs text-gray-400 text-center mb-1">Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-8629316693437703"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive}
      ></ins>
    </div>
  );
}

/**
 * Public Horizontal Banner Ad - For public pages like landing/about
 */
export function PublicHorizontalBannerAd({ className = '' }) {
  return (
    <PublicAd
      slot="1234567890" // Replace with your actual ad slot ID
      format="horizontal"
      className={className}
      style={{ minHeight: '90px' }}
    />
  );
}
