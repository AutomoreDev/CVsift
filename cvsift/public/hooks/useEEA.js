/**
 * useEEA Hook
 * Custom hook for managing EEA compliance data
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../js/firebase-config.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ComplianceEngine } from '../lib/eea/complianceEngine.js';

/**
 * Custom hook for EEA compliance data
 * @returns {Object} EEA data and methods
 */
export function useEEA() {
  const { currentUser, userData } = useAuth();
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [sectorTargets, setSectorTargets] = useState(new Map());
  const [complianceReport, setComplianceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load company data
   */
  const loadCompany = useCallback(async () => {
    if (!currentUser) return null;

    try {
      const companiesRef = collection(db, 'companies');
      const companyQuery = query(companiesRef, where('ownerId', '==', currentUser.uid));
      const companySnapshot = await getDocs(companyQuery);

      if (!companySnapshot.empty) {
        const companyDoc = companySnapshot.docs[0];
        const data = companyDoc.data();

        // Convert Firestore Timestamps to JS Dates
        const companyData = {
          id: companyDoc.id,
          ...data,
          eeReportingPeriod: {
            from: data.eeReportingPeriod?.from?.toDate?.() || data.eeReportingPeriod?.from,
            to: data.eeReportingPeriod?.to?.toDate?.() || data.eeReportingPeriod?.to,
          },
          eePlanDuration: {
            from: data.eePlanDuration?.from?.toDate?.() || data.eePlanDuration?.from,
            to: data.eePlanDuration?.to?.toDate?.() || data.eePlanDuration?.to,
          },
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };

        return companyData;
      }

      return null;
    } catch (err) {
      console.error('Error loading company:', err);
      throw err;
    }
  }, [currentUser]);

  /**
   * Load employees for a company
   */
  const loadEmployees = useCallback(async (companyId) => {
    if (!companyId) return [];

    try {
      const employeesRef = collection(db, 'employees');
      const employeesQuery = query(employeesRef, where('companyId', '==', companyId));
      const employeesSnapshot = await getDocs(employeesQuery);

      const employeesData = employeesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          employmentDate: data.employmentDate?.toDate?.() || data.employmentDate,
          terminationDate: data.terminationDate?.toDate?.() || data.terminationDate,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };
      });

      return employeesData;
    } catch (err) {
      console.error('Error loading employees:', err);
      throw err;
    }
  }, []);

  /**
   * Load sector targets for a sector
   */
  const loadSectorTargets = useCallback(async (sector) => {
    if (!sector) return new Map();

    try {
      const targetsRef = collection(db, 'sectorTargets');
      const targetsQuery = query(targetsRef, where('sector', '==', sector));
      const targetsSnapshot = await getDocs(targetsQuery);

      const targetsMap = new Map();
      targetsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        targetsMap.set(data.occupationalLevel, data.totalTarget);
      });

      return targetsMap;
    } catch (err) {
      console.error('Error loading sector targets:', err);
      throw err;
    }
  }, []);

  /**
   * Load all EEA data
   */
  const loadData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load company
      const companyData = await loadCompany();
      setCompany(companyData);

      if (!companyData) {
        setLoading(false);
        return;
      }

      // Load employees
      const employeesData = await loadEmployees(companyData.id);
      setEmployees(employeesData);

      // Load sector targets
      const targetsMap = await loadSectorTargets(companyData.sector);
      setSectorTargets(targetsMap);

      // Calculate compliance if we have data
      if (employeesData.length > 0 && targetsMap.size > 0) {
        const report = ComplianceEngine.calculateComplianceReport(
          employeesData,
          targetsMap,
          companyData.name,
          companyData.id
        );
        setComplianceReport(report);
      } else {
        setComplianceReport(null);
      }
    } catch (err) {
      console.error('Error loading EEA data:', err);
      setError(err.message || 'Failed to load EEA data');
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadCompany, loadEmployees, loadSectorTargets]);

  /**
   * Refresh data
   */
  const refetch = useCallback(() => {
    return loadData();
  }, [loadData]);

  /**
   * Get compliance summary
   */
  const getComplianceSummary = useCallback(() => {
    if (!complianceReport) return null;
    return ComplianceEngine.getComplianceSummary(complianceReport);
  }, [complianceReport]);

  /**
   * Predict hiring impact
   */
  const predictHiringImpact = useCallback((level, newHire) => {
    if (!employees || !sectorTargets) return null;

    const target = sectorTargets.get(level);
    if (!target) return null;

    return ComplianceEngine.predictHiringImpact(employees, level, newHire, target);
  }, [employees, sectorTargets]);

  /**
   * Predict termination impact
   */
  const predictTerminationImpact = useCallback((employeeId) => {
    if (!employees || !sectorTargets) return null;

    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    const target = sectorTargets.get(employee.occupationalLevel);
    if (!target) return null;

    return ComplianceEngine.predictTerminationImpact(employees, employeeId, target);
  }, [employees, sectorTargets]);

  /**
   * Get hiring recommendations
   */
  const getHiringRecommendations = useCallback((level) => {
    if (!complianceReport) return [];

    const levelCompliance = complianceReport.levels.find(l => l.level === level);
    if (!levelCompliance) return [];

    return ComplianceEngine.getHiringRecommendations(levelCompliance);
  }, [complianceReport]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // Data
    company,
    employees,
    sectorTargets,
    complianceReport,

    // State
    loading,
    error,

    // Methods
    refetch,
    getComplianceSummary,
    predictHiringImpact,
    predictTerminationImpact,
    getHiringRecommendations,
  };
}

export default useEEA;
