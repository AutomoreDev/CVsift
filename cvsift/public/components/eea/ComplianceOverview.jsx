/**
 * ComplianceOverview Component
 * Displays overall EEA compliance status and summary statistics
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp, Users, Target } from 'lucide-react';
import { getStatusColors } from '../../lib/eea/constants.js';
import { ComplianceEngine } from '../../lib/eea/complianceEngine.js';
import ComplianceChart from './ComplianceChart.jsx';

export default function ComplianceOverview({ report }) {
  if (!report) return null;

  const summary = ComplianceEngine.getComplianceSummary(report);
  const statusColors = getStatusColors(summary.overallStatus);

  const getStatusIcon = (status) => {
    if (status === 'COMPLIANT') {
      return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    }
    return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return 'Fully Compliant';
      case 'NEAR_COMPLIANT':
        return 'Near Compliance';
      case 'NON_COMPLIANT':
        return 'Action Required';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Overall Compliance Status</h2>
          <p className="text-sm text-gray-600">
            Report generated on {report.reportDate.toLocaleDateString()}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${statusColors.border} ${statusColors.bg}`}>
          {getStatusIcon(summary.overallStatus)}
          <span className={`font-semibold ${statusColors.text}`}>
            {getStatusText(summary.overallStatus)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Employees */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Active Employees</span>
          </div>
          <p className="text-3xl font-bold text-blue-900">{summary.totalEmployees}</p>
          <p className="text-sm text-blue-700 mt-1">
            {summary.totalDesignated} designated ({summary.overallPercentage}%)
          </p>
        </div>

        {/* Compliance Rate */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Compliance Rate</span>
          </div>
          <p className="text-3xl font-bold text-green-900">{summary.complianceRate}%</p>
          <p className="text-sm text-green-700 mt-1">
            {summary.compliantLevels} of {summary.totalLevels} levels
          </p>
        </div>

        {/* Levels Status */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Needs Attention</span>
          </div>
          <p className="text-3xl font-bold text-yellow-900">{summary.nonCompliantLevels}</p>
          <p className="text-sm text-yellow-700 mt-1">
            {summary.nearCompliantLevels} near target
          </p>
        </div>

        {/* Hires Needed */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Action Items</span>
          </div>
          <p className="text-3xl font-bold text-purple-900">{summary.totalHiresNeeded}</p>
          <p className="text-sm text-purple-700 mt-1">
            {summary.totalHiresNeeded === 1 ? 'hire needed' : 'hires needed'}
          </p>
        </div>
      </div>

      {/* D3.js Compliance Visualization */}
      <div className="mb-6">
        <ComplianceChart report={report} />
      </div>

      {/* Disability Compliance */}
      <div className={`rounded-lg p-4 border-2 ${
        report.disabilityCompliance.status === 'COMPLIANT'
          ? 'bg-green-50 border-green-300'
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Disability Compliance (3% Target)
            </h3>
            <p className={`text-sm ${
              report.disabilityCompliance.status === 'COMPLIANT'
                ? 'text-green-700'
                : 'text-red-700'
            }`}>
              Current: {report.disabilityCompliance.current}% | Target: {report.disabilityCompliance.target}% |
              Gap: {report.disabilityCompliance.gap > 0 ? '+' : ''}{report.disabilityCompliance.gap}%
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg border ${
            report.disabilityCompliance.status === 'COMPLIANT'
              ? 'bg-green-100 border-green-300 text-green-800'
              : 'bg-red-100 border-red-300 text-red-800'
          }`}>
            {report.disabilityCompliance.status === 'COMPLIANT' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Action Banner */}
      {summary.totalHiresNeeded > 0 && (
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Recommended Actions</h4>
              <p className="text-sm text-blue-800">
                To achieve full compliance across all occupational levels, you need to hire{' '}
                <strong>{summary.totalHiresNeeded}</strong> designated group{' '}
                {summary.totalHiresNeeded === 1 ? 'employee' : 'employees'}. Review individual level
                cards below for specific hiring recommendations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
