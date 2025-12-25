/**
 * CompanySetup Component
 * Form for setting up company EEA profile
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../js/firebase-config.js';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import { ECONOMIC_SECTORS, PROVINCES, EAP_TYPES } from '../../lib/eea/constants.js';
import EEANavbar from './EEANavbar.jsx';

export default function CompanySetup() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    dtiRegistrationName: '',
    dtiRegistrationNumber: '',
    payeSarsNumber: '',
    uifReferenceNumber: '',
    eeReferenceNumber: '',
    sector: 'FINANCIAL_INSURANCE',
    eapType: 'NATIONAL',
    province: '',
    eeReportingPeriodFrom: '',
    eeReportingPeriodTo: '',
    eePlanDurationFrom: '',
    eePlanDurationTo: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.sector || !formData.eapType) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.eapType === 'PROVINCIAL' && !formData.province) {
        throw new Error('Please select a province for Provincial EAP');
      }

      // Prepare company data
      const companyData = {
        name: formData.name,
        dtiRegistrationName: formData.dtiRegistrationName || formData.name,
        dtiRegistrationNumber: formData.dtiRegistrationNumber || '',
        payeSarsNumber: formData.payeSarsNumber || '',
        uifReferenceNumber: formData.uifReferenceNumber || '',
        eeReferenceNumber: formData.eeReferenceNumber || '',
        sector: formData.sector,
        eapType: formData.eapType,
        province: formData.eapType === 'PROVINCIAL' ? formData.province : null,
        eeReportingPeriod: {
          from: formData.eeReportingPeriodFrom ? Timestamp.fromDate(new Date(formData.eeReportingPeriodFrom)) : Timestamp.now(),
          to: formData.eeReportingPeriodTo ? Timestamp.fromDate(new Date(formData.eeReportingPeriodTo)) : Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        },
        eePlanDuration: {
          from: formData.eePlanDurationFrom ? Timestamp.fromDate(new Date(formData.eePlanDurationFrom)) : Timestamp.now(),
          to: formData.eePlanDurationTo ? Timestamp.fromDate(new Date(formData.eePlanDurationTo)) : Timestamp.fromDate(new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)),
        },
        ownerId: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Debug logging
      console.log('Creating company with data:', companyData);
      console.log('Current user UID:', currentUser.uid);

      // Save to Firestore
      const companiesRef = collection(db, 'companies');
      const docRef = await addDoc(companiesRef, companyData);
      console.log('Company created successfully with ID:', docRef.id);

      // Navigate back to EEA dashboard
      navigate('/eea');
    } catch (err) {
      console.error('Error creating company:', err);
      console.error('Error code:', err.code);
      console.error('Error details:', err);
      setError(`${err.code || 'Error'}: ${err.message || 'Failed to create company profile'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <EEANavbar showBackToDashboard />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Company Profile Setup</h1>
          </div>
          <p className="text-gray-600">
            Set up your company profile to begin tracking Employment Equity compliance
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ABC Company (Pty) Ltd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DTI Registration Name
                </label>
                <input
                  type="text"
                  name="dtiRegistrationName"
                  value={formData.dtiRegistrationName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Official DTI name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DTI Registration Number
                </label>
                <input
                  type="text"
                  name="dtiRegistrationNumber"
                  value={formData.dtiRegistrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 2021/123456/07"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAYE/SARS Number
                </label>
                <input
                  type="text"
                  name="payeSarsNumber"
                  value={formData.payeSarsNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PAYE number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UIF Reference Number
                </label>
                <input
                  type="text"
                  name="uifReferenceNumber"
                  value={formData.uifReferenceNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="UIF number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EE Reference Number
                </label>
                <input
                  type="text"
                  name="eeReferenceNumber"
                  value={formData.eeReferenceNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Employment Equity number"
                />
              </div>
            </div>
          </div>

          {/* EE Configuration */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment Equity Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Economic Sector <span className="text-red-500">*</span>
                </label>
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ECONOMIC_SECTORS.map(sector => (
                    <option key={sector.value} value={sector.value}>
                      {sector.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EAP Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="eapType"
                  value={formData.eapType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {EAP_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.eapType === 'PROVINCIAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Province</option>
                    {PROVINCES.map(province => (
                      <option key={province.value} value={province.value}>
                        {province.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Reporting Periods */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporting Periods (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reporting Period From
                </label>
                <input
                  type="date"
                  name="eeReportingPeriodFrom"
                  value={formData.eeReportingPeriodFrom}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reporting Period To
                </label>
                <input
                  type="date"
                  name="eeReportingPeriodTo"
                  value={formData.eeReportingPeriodTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EE Plan Duration From
                </label>
                <input
                  type="date"
                  name="eePlanDurationFrom"
                  value={formData.eePlanDurationFrom}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EE Plan Duration To
                </label>
                <input
                  type="date"
                  name="eePlanDurationTo"
                  value={formData.eePlanDurationTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              If not specified, defaults will be used (1-year reporting period, 5-year plan duration)
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/eea')}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Company Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}
