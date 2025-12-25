import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { useAnalytics } from './hooks/useAnalytics';
import CookieBanner from './components/CookieBanner';

// Import Pages
import LandingPage from './Pages/LandingPage';
import SignUp from './Pages/SignUp';
import SignIn from './Pages/SignIn';
import ResetPassword from './Pages/ResetPassword';
import Dashboard from './Pages/Dashboard';
import UploadCV from './Pages/UploadCV';
import CVList from './Pages/CVList';
import CVDetail from './Pages/CVDetail';
import Pricing from './Pages/Pricing';
import PaymentSuccess from './Pages/PaymentSuccess';
import PaymentCancel from './Pages/PaymentCancel';
import Analytics from './Pages/Analytics';
import AccountSettings from './Pages/AccountSettings';
import JobSpecs from './Pages/JobSpecs';
import Chatbot from './Pages/Chatbot';
import AcceptInvite from './Pages/AcceptInvite';
import MasterAccountDashboard from './Pages/MasterAccountDashboard';
import EEAPage from './Pages/EEA';
import TermsOfService from './Pages/TermsOfService';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import AboutUs from './Pages/AboutUs';
import Contact from './Pages/Contact';
import Blog from './Pages/Blog';
import CVBuilder from './Pages/CVBuilder';
import CVBuilderForm from './Pages/CVBuilderForm';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }
  
  return children;
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function AppRoutes() {
  // Enable automatic page view tracking and user tracking
  useAnalytics();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        } 
      />
      <Route
        path="/signin"
        element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Accept Team Invitation (Public - no auth required initially) */}
      <Route path="/accept-invite" element={<AcceptInvite />} />

      {/* Legal & Info Pages */}
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/blog" element={<Blog />} />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute>
            <UploadCV />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/cvs"
        element={
          <ProtectedRoute>
            <CVList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cv/:id"
        element={
          <ProtectedRoute>
            <CVDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cv-builder"
        element={
          <ProtectedRoute>
            <CVBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cv-builder/create"
        element={
          <ProtectedRoute>
            <CVBuilderForm />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/pricing" 
        element={
          <ProtectedRoute>
            <Pricing />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payment/success" 
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/payment/cancel"
        element={
          <ProtectedRoute>
            <PaymentCancel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/job-specs"
        element={
          <ProtectedRoute>
            <JobSpecs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chatbot"
        element={
          <ProtectedRoute>
            <Chatbot />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eea"
        element={
          <ProtectedRoute>
            <EEAPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eea/setup"
        element={
          <ProtectedRoute>
            <EEAPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eea/import"
        element={
          <ProtectedRoute>
            <EEAPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eea/employees"
        element={
          <ProtectedRoute>
            <EEAPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eea/calculator"
        element={
          <ProtectedRoute>
            <EEAPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eea/reports"
        element={
          <ProtectedRoute>
            <EEAPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eea/settings"
        element={
          <ProtectedRoute>
            <EEAPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master-dashboard"
        element={
          <ProtectedRoute>
            <MasterAccountDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <CookieBanner language="en" privacyPolicyUrl="/privacy-policy" />
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}