/**
 * useAnalytics Hook
 * React hook for easy analytics tracking throughout the app
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  trackPageView,
  setAnalyticsUserId,
  updateUserProperties
} from '../utils/analytics';

/**
 * Hook to automatically track page views on route changes
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const pageName = getPageName(location.pathname);
    trackPageView(pageName, location.pathname);
  }, [location]);
};

/**
 * Hook to set user ID and properties when user authenticates
 */
export const useUserTracking = () => {
  const { currentUser, userData } = useAuth();

  useEffect(() => {
    if (currentUser) {
      // Set user ID for analytics
      setAnalyticsUserId(currentUser.uid);

      // Set user properties if userData is available
      if (userData) {
        updateUserProperties(userData);
      }
    }
  }, [currentUser, userData]);
};

/**
 * Main analytics hook - combines page and user tracking
 */
export const useAnalytics = () => {
  usePageTracking();
  useUserTracking();
};

/**
 * Helper function to extract page name from pathname
 */
const getPageName = (pathname) => {
  const routes = {
    '/': 'Landing Page',
    '/dashboard': 'Dashboard',
    '/upload': 'Upload CV',
    '/cvs': 'CV List',
    '/cvs/:id': 'CV Detail',
    '/job-specs': 'Job Specs',
    '/job-specs/:id': 'Job Spec Detail',
    '/analytics': 'Analytics',
    '/pricing': 'Pricing',
    '/account-settings': 'Account Settings',
    '/sign-in': 'Sign In',
    '/sign-up': 'Sign Up',
    '/about': 'About Us',
    '/contact': 'Contact',
    '/terms': 'Terms of Service',
    '/privacy': 'Privacy Policy',
    '/chatbot': 'AI Chatbot',
    '/master-dashboard': 'Master Dashboard',
    '/accept-invite': 'Accept Team Invite'
  };

  // Try exact match first
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Try pattern matching for dynamic routes
  for (const [route, name] of Object.entries(routes)) {
    if (route.includes(':') && matchRoute(pathname, route)) {
      return name;
    }
  }

  // Default to pathname if no match
  return pathname.replace('/', ' ').trim() || 'Home';
};

/**
 * Helper to match dynamic routes
 */
const matchRoute = (pathname, route) => {
  const pathParts = pathname.split('/').filter(Boolean);
  const routeParts = route.split('/').filter(Boolean);

  if (pathParts.length !== routeParts.length) return false;

  return routeParts.every((part, i) => {
    return part.startsWith(':') || part === pathParts[i];
  });
};

export default useAnalytics;
