/**
 * EEA Page
 * Main page for Employment Equity Act compliance tracking
 */

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { canAccessEEA } from '../config/planConfig.js';
import EEADashboard from '../components/eea/EEADashboard.jsx';
import CompanySetup from '../components/eea/CompanySetup.jsx';
import CompanySettings from '../components/eea/CompanySettings.jsx';
import EmployeeImport from '../components/eea/EmployeeImport.jsx';
import EmployeeList from '../components/eea/EmployeeList.jsx';
import HiringImpactCalculator from '../components/eea/HiringImpactCalculator.jsx';
import ReportGenerator from '../components/eea/ReportGenerator.jsx';
import { Lock, TrendingUp } from 'lucide-react';
import { useEEA } from '../hooks/useEEA.js';

export default function EEAPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check plan access (including master role)
  const hasAccess = userData?.role === 'master' || canAccessEEA(userData?.plan);

  // Determine which sub-page to show
  const path = location.pathname;

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  // Access denied - show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 text-center">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            EEA Compliance Tracking
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            This feature is available for <strong>Professional</strong>, <strong>Business</strong>, and <strong>Enterprise</strong> plans.
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              What You'll Get:
            </h3>
            <ul className="text-left text-blue-800 space-y-2 max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Real-time Employment Equity compliance tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Automated BBEEE calculations by occupational level</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Predictive hiring impact calculator</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>DoL report generation (EEA2, EEA4, EEA12, EEA13)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Disability compliance monitoring (3% target)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Historical tracking and trend analysis</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/pricing')}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold text-lg"
            >
              Back to Dashboard
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Questions? <a href="mailto:support@cvsift.com" className="text-blue-600 hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    );
  }

  // Has access - route to appropriate sub-page
  const { company } = useEEA();

  const renderContent = () => {
    if (path === '/eea/setup') {
      return <CompanySetup />;
    }

    if (path === '/eea/settings') {
      return <CompanySettings />;
    }

    if (path === '/eea/import') {
      return <EmployeeImport companyId={company?.id} onComplete={() => navigate('/eea')} />;
    }

    if (path === '/eea/employees') {
      return <EmployeeList companyId={company?.id} />;
    }

    if (path === '/eea/calculator') {
      return <HiringImpactCalculator />;
    }

    if (path === '/eea/reports') {
      return <ReportGenerator />;
    }

    // Default: show dashboard
    return <EEADashboard />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderContent()}
    </div>
  );
}
