/**
 * ComplianceLevelCard Component
 * Displays compliance data for a single occupational level
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { formatOccupationalLevel, getStatusColors } from '../../lib/eea/constants.js';

export default function ComplianceLevelCard({ levelCompliance }) {
  const statusColors = getStatusColors(levelCompliance.status);

  const getStatusIcon = (status) => {
    return status === 'COMPLIANT' ? (
      <CheckCircle2 className="w-4 h-4" />
    ) : (
      <AlertTriangle className="w-4 h-4" />
    );
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return 'Compliant';
      case 'NEAR_COMPLIANT':
        return 'Near Target';
      case 'NON_COMPLIANT':
        return 'Action Required';
      default:
        return 'Unknown';
    }
  };

  // Calculate progress bar width (capped at 100%)
  const progressWidth = Math.min(
    (levelCompliance.currentPercentage / levelCompliance.targetPercentage) * 100,
    100
  );

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 ${statusColors.border} p-6 hover:shadow-md transition-shadow`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {formatOccupationalLevel(levelCompliance.level)}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">Occupational Level</p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${statusColors.badge}`}>
          {getStatusIcon(levelCompliance.status)}
          <span className="text-sm font-medium">{getStatusLabel(levelCompliance.status)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-700">
            Current: <strong>{levelCompliance.currentPercentage}%</strong>
          </span>
          <span className="text-gray-700">
            Target: <strong>{levelCompliance.targetPercentage}%</strong>
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${
              levelCompliance.status === 'COMPLIANT'
                ? 'bg-green-500'
                : levelCompliance.status === 'NEAR_COMPLIANT'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{levelCompliance.totalEmployees}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 mb-1">Designated</p>
          <p className="text-2xl font-bold text-blue-900">{levelCompliance.designated}</p>
        </div>
        <div
          className={`rounded-lg p-3 border ${
            levelCompliance.gap > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}
        >
          <p
            className={`text-xs mb-1 ${
              levelCompliance.gap > 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            Gap
          </p>
          <p
            className={`text-2xl font-bold ${
              levelCompliance.gap > 0 ? 'text-red-900' : 'text-green-900'
            }`}
          >
            {levelCompliance.gap > 0 ? '+' : ''}
            {levelCompliance.gap}%
          </p>
        </div>
      </div>

      {/* Demographics Breakdown */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Demographics Breakdown</p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="text-center">
            <p className="text-gray-600 mb-1">AM</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.AM}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">AF</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.AF}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">CM</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.CM}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">CF</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.CF}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">IM</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.IM}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">IF</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.IF}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">WM</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.WM}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">WF</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.WF}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">FM</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.foreignMale}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">FF</p>
            <p className="font-bold text-gray-900">{levelCompliance.demographics.foreignFemale}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          AM=African Male, AF=African Female, CM=Coloured Male, CF=Coloured Female,
          IM=Indian Male, IF=Indian Female, WM=White Male, WF=White Female,
          FM=Foreign Male, FF=Foreign Female
        </p>
      </div>

      {/* Action Items */}
      {levelCompliance.gapCount > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">Action Required</p>
              <p className="text-sm text-blue-800">
                Hire <strong>{levelCompliance.gapCount}</strong> designated group{' '}
                {levelCompliance.gapCount === 1 ? 'employee' : 'employees'} to achieve compliance
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
