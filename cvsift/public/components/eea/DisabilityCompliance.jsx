/**
 * DisabilityCompliance Component
 * Displays disability compliance status (3% target)
 */

import React from 'react';
import { Heart, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DisabilityCompliance({ compliance }) {
  if (!compliance) return null;

  const isCompliant = compliance.status === 'COMPLIANT';
  const progressWidth = Math.min((compliance.current / compliance.target) * 100, 100);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
        isCompliant ? 'border-green-300' : 'border-red-300'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${isCompliant ? 'bg-green-100' : 'bg-red-100'}`}>
            <Heart className={`w-6 h-6 ${isCompliant ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Disability Compliance</h3>
            <p className="text-sm text-gray-600">3% Employment Equity Target</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${
            isCompliant
              ? 'bg-green-100 border-green-300 text-green-800'
              : 'bg-red-100 border-red-300 text-red-800'
          }`}
        >
          {isCompliant ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isCompliant ? 'Compliant' : 'Below Target'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-700">
            Current: <strong>{compliance.current}%</strong>
          </span>
          <span className="text-gray-700">
            Target: <strong>{compliance.target}%</strong>
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all ${
              isCompliant ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Current Percentage</p>
          <p className="text-3xl font-bold text-gray-900">{compliance.current}%</p>
        </div>
        <div
          className={`rounded-lg p-4 border ${
            compliance.gap > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}
        >
          <p
            className={`text-sm mb-1 ${
              compliance.gap > 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            Gap to Target
          </p>
          <p
            className={`text-3xl font-bold ${
              compliance.gap > 0 ? 'text-red-900' : 'text-green-900'
            }`}
          >
            {compliance.gap > 0 ? '+' : ''}
            {compliance.gap}%
          </p>
        </div>
      </div>

      {/* Information */}
      <div className={`rounded-lg p-4 border ${isCompliant ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <p className={`text-sm ${isCompliant ? 'text-green-800' : 'text-blue-800'}`}>
          {isCompliant ? (
            <>
              <strong>Excellent!</strong> Your company meets the 3% disability employment target as per the Employment Equity Act.
            </>
          ) : (
            <>
              <strong>Note:</strong> The Employment Equity Act requires that people with disabilities constitute at least 3% of your workforce. Consider implementing targeted recruitment programs to attract qualified candidates with disabilities.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
