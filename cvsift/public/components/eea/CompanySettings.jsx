/**
 * CompanySettings Component
 * Edit company EEA profile after creation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../js/firebase-config.js';
import { useEEA } from '../../hooks/useEEA.js';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { ECONOMIC_SECTORS, EAP_TYPES, PROVINCES } from '../../lib/eea/constants.js';
import EEANavbar from './EEANavbar.jsx';

export default function CompanySettings() {
  const navigate = useNavigate();
  const { company, loading: eeaLoading } = useEEA();

  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    eapType: 'NATIONAL',
    province: '',
    eeReferenceNumber: '',
    reportingPeriodFrom: '',
    reportingPeriodTo: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load company data when available
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        sector: company.sector || '',
        eapType: company.eapType || 'NATIONAL',
        province: company.province || '',
        eeReferenceNumber: company.eeReferenceNumber || '',
        reportingPeriodFrom: company.eeReportingPeriod?.from?.toISOString().split('T')[0] || '',
        reportingPeriodTo: company.eeReportingPeriod?.to?.toISOString().split('T')[0] || '',
      });
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }
    if (!formData.sector) {
      setError('Economic sector is required');
      return;
    }
    if (formData.eapType === 'PROVINCIAL' && !formData.province) {
      setError('Province is required for Provincial EAP type');
      return;
    }
    if (!formData.reportingPeriodFrom || !formData.reportingPeriodTo) {
      setError('Reporting period dates are required');
      return;
    }

    const fromDate = new Date(formData.reportingPeriodFrom);
    const toDate = new Date(formData.reportingPeriodTo);

    if (toDate <= fromDate) {
      setError('Reporting period end date must be after start date');
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        name: formData.name.trim(),
        sector: formData.sector,
        eapType: formData.eapType,
        eeReferenceNumber: formData.eeReferenceNumber.trim() || null,
        eeReportingPeriod: {
          from: fromDate,
          to: toDate,
        },
        updatedAt: new Date(),
      };

      // Only include province if Provincial EAP type
      if (formData.eapType === 'PROVINCIAL') {
        updateData.province = formData.province;
      } else {
        updateData.province = null;
      }

      const companyRef = doc(db, 'companies', company.id);
      await updateDoc(companyRef, updateData);

      setSuccess(true);

      // Navigate back to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate('/eea');
      }, 1500);
    } catch (err) {
      console.error('Error updating company:', err);
      setError(`Failed to update company: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (eeaLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading company settings...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No company profile found</h2>
          <p className="text-gray-600 mb-4">Please create a company profile first</p>
          <button
            onClick={() => navigate('/eea/setup')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Create Company Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <EEANavbar showBackToDashboard />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Header */}
          <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          </div>
          <p className="text-gray-600">
            Update your company profile and EEA configuration
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter your company name"
              />
            </div>

            {/* Economic Sector */}
            <div>
              <label htmlFor="sector" className="block text-sm font-semibold text-gray-900 mb-2">
                Economic Sector *
              </label>
              <select
                id="sector"
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select a sector</option>
                {ECONOMIC_SECTORS.map(sector => (
                  <option key={sector.value} value={sector.value}>
                    {sector.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Select the sector that best matches your primary business activity
              </p>
            </div>

            {/* EAP Type */}
            <div>
              <label htmlFor="eapType" className="block text-sm font-semibold text-gray-900 mb-2">
                EAP (Economically Active Population) Type *
              </label>
              <select
                id="eapType"
                name="eapType"
                value={formData.eapType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {EAP_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                National EAP uses country-wide demographics, Provincial uses province-specific data
              </p>
            </div>

            {/* Province (conditional) */}
            {formData.eapType === 'PROVINCIAL' && (
              <div>
                <label htmlFor="province" className="block text-sm font-semibold text-gray-900 mb-2">
                  Province *
                </label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select a province</option>
                  {PROVINCES.map(province => (
                    <option key={province.value} value={province.value}>
                      {province.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* EE Reference Number */}
            <div>
              <label htmlFor="eeReferenceNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                EE Reference Number
              </label>
              <input
                type="text"
                id="eeReferenceNumber"
                name="eeReferenceNumber"
                value={formData.eeReferenceNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Optional: Your DoL EE reference number"
              />
            </div>

            {/* Reporting Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reportingPeriodFrom" className="block text-sm font-semibold text-gray-900 mb-2">
                  Reporting Period From *
                </label>
                <input
                  type="date"
                  id="reportingPeriodFrom"
                  name="reportingPeriodFrom"
                  value={formData.reportingPeriodFrom}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label htmlFor="reportingPeriodTo" className="block text-sm font-semibold text-gray-900 mb-2">
                  Reporting Period To *
                </label>
                <input
                  type="date"
                  id="reportingPeriodTo"
                  name="reportingPeriodTo"
                  value={formData.reportingPeriodTo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-semibold">
                  ✓ Company settings updated successfully! Redirecting...
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/eea')}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
  );
}
