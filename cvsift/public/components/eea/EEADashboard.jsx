/**
 * EEADashboard Component
 * Main dashboard for EEA compliance tracking
 */

import React from 'react';
import { FileText, Users, Calculator, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEEA } from '../../hooks/useEEA.js';
import ComplianceOverview from './ComplianceOverview.jsx';
import ComplianceLevelCard from './ComplianceLevelCard.jsx';
import DisabilityCompliance from './DisabilityCompliance.jsx';
import EEANavbar from './EEANavbar.jsx';

export default function EEADashboard() {
  const { company, employees, complianceReport, loading } = useEEA();
  const navigate = useNavigate();

  if (loading) {
    return (
      <>
        <EEANavbar showBackToDashboard />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading EEA compliance data...</p>
          </div>
        </div>
      </>
    );
  }

  // No company setup yet
  if (!company) {
    return (
      <>
        <EEANavbar showBackToDashboard />
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to EEA Compliance</h1>
            <p className="text-gray-600 mb-6">
              Get started by setting up your company profile to begin tracking Employment Equity compliance
            </p>
            <button
              onClick={() => navigate('/eea/setup')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Setup Company Profile
            </button>
          </div>
        </div>
      </>
    );
  }

  // No employees imported yet
  if (employees.length === 0) {
    return (
      <>
        <EEANavbar showBackToDashboard />
        <div className="container mx-auto p-6 max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
          <p className="text-gray-600 mb-6">Employment Equity Compliance Dashboard</p>

          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No employees added yet</h2>
            <p className="text-gray-600 mb-6">
              Import your employee data to get started with compliance tracking
            </p>
            <button
              onClick={() => navigate('/eea/import')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Import Employees
            </button>
          </div>
        </div>
      </>
    );
  }

  // Main dashboard with compliance data
  return (
    <>
      <EEANavbar showBackToDashboard />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            </div>
            <p className="text-gray-600">Employment Equity Compliance Dashboard</p>
          </div>
        </div>

      {/* Overall Status */}
      {complianceReport && <ComplianceOverview report={complianceReport} />}

      {/* Compliance by Level */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Compliance by Occupational Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complianceReport?.levels.map((level) => (
            <ComplianceLevelCard key={level.level} levelCompliance={level} />
          ))}
        </div>
      </div>

      {/* Disability Compliance */}
      {complianceReport && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Disability Compliance</h2>
          <DisabilityCompliance compliance={complianceReport.disabilityCompliance} />
        </div>
      )}
      </div>
    </>
  );
}
