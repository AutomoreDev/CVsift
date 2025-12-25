/**
 * HiringImpactCalculator Component
 * Predict the impact of hiring decisions on compliance
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { useEEA } from '../../hooks/useEEA.js';
import { OCCUPATIONAL_LEVELS, RACES, GENDERS, formatOccupationalLevel, formatRace, getStatusColors } from '../../lib/eea/constants.js';
import { ComplianceEngine } from '../../lib/eea/complianceEngine.js';
import EEANavbar from './EEANavbar.jsx';

export default function HiringImpactCalculator() {
  const navigate = useNavigate();
  const { employees, sectorTargets, loading } = useEEA();
  const [selectedLevel, setSelectedLevel] = useState('PROFESSIONALLY_QUALIFIED_MID_MANAGEMENT');
  const [selectedRace, setSelectedRace] = useState('AFRICAN');
  const [selectedGender, setSelectedGender] = useState('FEMALE');
  const [hasDisability, setHasDisability] = useState(false);
  const [numberOfHires, setNumberOfHires] = useState(1);
  const [prediction, setPrediction] = useState(null);

  const calculateImpact = () => {
    if (!employees || !sectorTargets) return;

    const target = sectorTargets.get(selectedLevel);
    if (!target) return;

    const impact = ComplianceEngine.predictHiringImpact(
      employees,
      selectedLevel,
      {
        race: selectedRace,
        gender: selectedGender,
        hasDisability,
      },
      target,
      numberOfHires
    );

    setPrediction(impact);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading calculator...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <EEANavbar showBackToDashboard />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Header */}
          <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Hiring Impact Calculator</h1>
          </div>
          <p className="text-gray-600">
            Predict how new hires will affect your compliance status
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Hire Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupational Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {OCCUPATIONAL_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Race
                </label>
                <select
                  value={selectedRace}
                  onChange={(e) => setSelectedRace(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {RACES.map(race => (
                    <option key={race.value} value={race.value}>
                      {race.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GENDERS.map(gender => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasDisability}
                    onChange={(e) => setHasDisability(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Has Disability</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Hires
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={numberOfHires}
                  onChange={(e) => setNumberOfHires(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Calculate the impact of hiring multiple people with this profile</p>
              </div>

              <button
                onClick={calculateImpact}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Calculate Impact
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Impact Prediction</h2>

            {!prediction ? (
              <div className="text-center py-12">
                <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  Select a candidate profile and click "Calculate Impact" to see results
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Candidate Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {prediction.numberOfHires > 1 ? `${prediction.numberOfHires} Hires` : 'Candidate Profile'}
                  </h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Level:</strong> {formatOccupationalLevel(prediction.level)}</p>
                    <p><strong>Demographics:</strong> {formatRace(prediction.race)} {prediction.gender.toLowerCase()}</p>
                    {prediction.hasDisability && <p><strong>Disability:</strong> Yes</p>}
                    {prediction.numberOfHires > 1 && <p><strong>Count:</strong> {prediction.numberOfHires} people</p>}
                  </div>
                </div>

                {/* Before vs After */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Current</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Total Employees</p>
                        <p className="text-2xl font-bold text-gray-900">{prediction.current.totalEmployees}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Designated %</p>
                        <p className="text-2xl font-bold text-gray-900">{prediction.current.percentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Gap</p>
                        <p className={`text-2xl font-bold ${prediction.current.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {prediction.current.gap > 0 ? '+' : ''}{prediction.current.gap}%
                        </p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getStatusColors(prediction.current.status).badge
                        }`}>
                          {prediction.current.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                    <h4 className="text-xs font-semibold text-green-700 mb-2 uppercase">
                      After {prediction.numberOfHires > 1 ? `${prediction.numberOfHires} Hires` : 'Hire'}
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-green-700">Total Employees</p>
                        <p className="text-2xl font-bold text-green-900">{prediction.predicted.totalEmployees}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700">Designated %</p>
                        <p className="text-2xl font-bold text-green-900">{prediction.predicted.percentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700">Gap</p>
                        <p className={`text-2xl font-bold ${prediction.predicted.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {prediction.predicted.gap > 0 ? '+' : ''}{prediction.predicted.gap}%
                        </p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getStatusColors(prediction.predicted.status).badge
                        }`}>
                          {prediction.predicted.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Impact Summary */}
                <div className={`rounded-lg p-4 border-2 ${
                  prediction.improvement > 0
                    ? 'bg-green-50 border-green-300'
                    : prediction.improvement < 0
                    ? 'bg-red-50 border-red-300'
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-start gap-3">
                    {prediction.improvement > 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : prediction.improvement < 0 ? (
                      <TrendingDown className="w-6 h-6 text-red-600 flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${
                        prediction.improvement > 0
                          ? 'text-green-900'
                          : prediction.improvement < 0
                          ? 'text-red-900'
                          : 'text-gray-900'
                      }`}>
                        {prediction.improvement > 0
                          ? 'Positive Impact'
                          : prediction.improvement < 0
                          ? 'Negative Impact'
                          : 'Neutral Impact'}
                      </h3>
                      <p className={`text-sm ${
                        prediction.improvement > 0
                          ? 'text-green-800'
                          : prediction.improvement < 0
                          ? 'text-red-800'
                          : 'text-gray-800'
                      }`}>
                        {prediction.improvement > 0
                          ? `${prediction.numberOfHires > 1 ? 'These hires' : 'This hire'} will improve your compliance by ${prediction.improvement}% and bring you closer to your target.`
                          : prediction.improvement < 0
                          ? `${prediction.numberOfHires > 1 ? 'These hires' : 'This hire'} will worsen your compliance gap by ${Math.abs(prediction.improvement)}%.`
                          : `${prediction.numberOfHires > 1 ? 'These hires' : 'This hire'} will not significantly change your compliance status.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Recommendation</h3>
                  <p className="text-sm text-blue-800">
                    {prediction.improvement > 0
                      ? `✓ ${prediction.numberOfHires > 1 ? 'These candidate profiles are' : 'This candidate profile is'} recommended for improving your EEA compliance.`
                      : prediction.improvement < 0
                      ? '⚠ Consider prioritizing candidates from designated groups to improve compliance.'
                      : `${prediction.numberOfHires > 1 ? 'These hires' : 'This hire'} will maintain your current compliance level.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Reference: Designated Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Designated Groups (improve compliance):</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• African Males & Females</li>
                <li>• Coloured Males & Females</li>
                <li>• Indian Males & Females</li>
                <li>• White Females</li>
                <li>• People with disabilities (any group)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Non-Designated Groups:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• White Males</li>
                <li>• Foreign Nationals (all groups)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Note: Hiring from non-designated groups may widen your compliance gap.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
