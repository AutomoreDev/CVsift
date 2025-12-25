/**
 * Employment Equity Act (EEA) Compliance Engine
 * Core calculation logic for EEA compliance tracking
 */

import { DESIGNATED_GROUPS, DISABILITY_TARGET, getDemographicKey, isDesignatedGroup, getComplianceStatus, formatOccupationalLevel } from './constants.js';

export class ComplianceEngine {
  /**
   * Calculate compliance for a specific occupational level
   * @param {Array} employees - Array of employee objects
   * @param {string} level - Occupational level
   * @param {number} sectorTarget - Sector target percentage (0-1)
   * @returns {Object} Level compliance data
   */
  static calculateLevelCompliance(employees, level, sectorTarget) {
    const levelEmployees = employees.filter(
      (e) => e.occupationalLevel === level && e.status === 'ACTIVE'
    );

    const total = levelEmployees.length;

    // Initialize demographics
    const demographics = {
      AM: 0,
      AF: 0,
      CM: 0,
      CF: 0,
      IM: 0,
      IF: 0,
      WM: 0,
      WF: 0,
      foreignMale: 0,
      foreignFemale: 0,
    };

    // Count demographics
    levelEmployees.forEach((emp) => {
      const key = getDemographicKey(emp);
      if (key in demographics) {
        demographics[key]++;
      }
    });

    // Calculate designated group count
    // Excludes White Males and Foreign Nationals
    // Includes White Females (they ARE designated)
    const designated = levelEmployees.filter(emp => isDesignatedGroup(emp)).length;

    const currentPercentage = total > 0 ? (designated / total) * 100 : 0;
    const targetPercentage = sectorTarget * 100;
    const gap = targetPercentage - currentPercentage;
    const gapCount = total > 0 ? Math.ceil((gap / 100) * total) : 0;

    const status = getComplianceStatus(gap);

    // Calculate designated percentage for easy access
    const designatedPercentage = total > 0 ? designated / total : 0;

    // Create extended demographics with full property names for reporting
    const extendedDemographics = {
      ...demographics,
      africanMale: demographics.AM,
      africanFemale: demographics.AF,
      colouredMale: demographics.CM,
      colouredFemale: demographics.CF,
      indianMale: demographics.IM,
      indianFemale: demographics.IF,
      whiteMale: demographics.WM,
      whiteFemale: demographics.WF,
    };

    return {
      level,
      levelName: formatOccupationalLevel(level), // Add formatted name for reports
      totalEmployees: total,
      designated,
      designatedPercentage, // Add as decimal for calculations
      currentPercentage: Math.round(currentPercentage * 10) / 10,
      target: sectorTarget, // Add raw target for reports
      targetPercentage: Math.round(targetPercentage * 10) / 10,
      gap: Math.round(gap * 10) / 10,
      gapCount: Math.max(0, gapCount),
      status,
      demographics: extendedDemographics,
    };
  }

  /**
   * Calculate overall compliance report
   * @param {Array} employees - Array of employee objects
   * @param {Map} sectorTargets - Map of level -> target percentage
   * @param {string} companyName - Company name
   * @param {string} companyId - Company ID
   * @returns {Object} Complete compliance report
   */
  static calculateComplianceReport(employees, sectorTargets, companyName, companyId) {
    const levels = [];

    // Calculate for each level
    Array.from(sectorTargets.entries()).forEach(([level, target]) => {
      const compliance = this.calculateLevelCompliance(employees, level, target);
      levels.push(compliance);
    });

    // Calculate disability compliance
    const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
    const employeesWithDisabilities = activeEmployees.filter((e) => e.hasDisability).length;
    const totalEmployees = activeEmployees.length;
    const currentDisabilityPercentage = totalEmployees > 0
      ? (employeesWithDisabilities / totalEmployees) * 100
      : 0;
    const disabilityGap = (DISABILITY_TARGET * 100) - currentDisabilityPercentage;

    // Determine overall status
    const nonCompliantCount = levels.filter((l) => l.status === 'NON_COMPLIANT').length;
    const nearCompliantCount = levels.filter((l) => l.status === 'NEAR_COMPLIANT').length;

    let overallStatus;
    if (nonCompliantCount > 0 || disabilityGap > 1) {
      overallStatus = 'NON_COMPLIANT';
    } else if (nearCompliantCount > 0 || disabilityGap > 0) {
      overallStatus = 'NEAR_COMPLIANT';
    } else {
      overallStatus = 'COMPLIANT';
    }

    // Calculate overall totals for reporting
    const overallTotalEmployees = levels.reduce((sum, l) => sum + l.totalEmployees, 0);
    const overallTotalDesignated = levels.reduce((sum, l) => sum + l.designated, 0);
    const overallDesignatedPercentage = overallTotalEmployees > 0 ? (overallTotalDesignated / overallTotalEmployees) : 0;

    return {
      companyId,
      companyName,
      reportDate: new Date(),
      levels,
      // Overall totals
      totalEmployees: overallTotalEmployees,
      designatedCount: overallTotalDesignated,
      designatedPercentage: overallDesignatedPercentage,
      // Disability compliance
      disabilityCompliance: {
        current: Math.round(currentDisabilityPercentage * 10) / 10,
        currentCount: employeesWithDisabilities,
        currentPercentage: Math.round(currentDisabilityPercentage * 10) / 10,
        target: DISABILITY_TARGET * 100,
        gap: Math.round(disabilityGap * 10) / 10,
        status: disabilityGap <= 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
      },
      overallStatus,
    };
  }

  /**
   * Predict impact of hiring a new employee
   * @param {Array} employees - Current employees
   * @param {string} level - Occupational level for new hire
   * @param {Object} newHire - New hire demographics
   * @param {string} newHire.race - Race
   * @param {string} newHire.gender - Gender
   * @param {boolean} newHire.hasDisability - Has disability
   * @param {number} sectorTarget - Sector target for this level
   * @param {number} count - Number of hires with this profile (default: 1)
   * @returns {Object} Hiring impact prediction
   */
  static predictHiringImpact(employees, level, newHire, sectorTarget, count = 1) {
    // Create hypothetical employees
    const hypotheticalEmployees = Array.from({ length: count }, () => ({
      occupationalLevel: level,
      race: newHire.race,
      gender: newHire.gender,
      isForeignNational: false,
      hasDisability: newHire.hasDisability,
      status: 'ACTIVE',
    }));

    // Calculate current state
    const currentCompliance = this.calculateLevelCompliance(employees, level, sectorTarget);

    // Calculate new state with hypothetical hires
    const newEmployees = [...employees, ...hypotheticalEmployees];
    const newCompliance = this.calculateLevelCompliance(newEmployees, level, sectorTarget);

    return {
      level,
      race: newHire.race,
      gender: newHire.gender,
      hasDisability: newHire.hasDisability,
      numberOfHires: count,
      current: {
        totalEmployees: currentCompliance.totalEmployees,
        designated: currentCompliance.designated,
        percentage: currentCompliance.currentPercentage,
        gap: currentCompliance.gap,
        status: currentCompliance.status,
      },
      predicted: {
        totalEmployees: newCompliance.totalEmployees,
        designated: newCompliance.designated,
        percentage: newCompliance.currentPercentage,
        gap: newCompliance.gap,
        status: newCompliance.status,
      },
      improvement: Math.round((currentCompliance.gap - newCompliance.gap) * 10) / 10,
    };
  }

  /**
   * Predict impact of terminating an employee
   * @param {Array} employees - Current employees
   * @param {string} employeeId - Employee ID to terminate
   * @param {number} sectorTarget - Sector target for employee's level
   * @returns {Object} Termination impact prediction
   */
  static predictTerminationImpact(employees, employeeId, sectorTarget) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const level = employee.occupationalLevel;

    // Calculate current state
    const currentCompliance = this.calculateLevelCompliance(employees, level, sectorTarget);

    // Calculate new state without this employee
    const newEmployees = employees.filter(e => e.id !== employeeId);
    const newCompliance = this.calculateLevelCompliance(newEmployees, level, sectorTarget);

    return {
      level,
      employeeId,
      race: employee.race,
      gender: employee.gender,
      current: {
        totalEmployees: currentCompliance.totalEmployees,
        designated: currentCompliance.designated,
        percentage: currentCompliance.currentPercentage,
        gap: currentCompliance.gap,
        status: currentCompliance.status,
      },
      predicted: {
        totalEmployees: newCompliance.totalEmployees,
        designated: newCompliance.designated,
        percentage: newCompliance.currentPercentage,
        gap: newCompliance.gap,
        status: newCompliance.status,
      },
      impact: Math.round((newCompliance.gap - currentCompliance.gap) * 10) / 10,
    };
  }

  /**
   * Calculate optimal hiring recommendations
   * @param {Object} levelCompliance - Level compliance data
   * @returns {Array} Array of hiring recommendations
   */
  static getHiringRecommendations(levelCompliance) {
    if (levelCompliance.status === 'COMPLIANT') {
      return [];
    }

    const recommendations = [];

    // If there's a gap, recommend hiring from designated groups
    if (levelCompliance.gapCount > 0) {
      // Recommend based on current demographics
      const { demographics } = levelCompliance;
      const totalDesignated = demographics.AM + demographics.AF +
                              demographics.CM + demographics.CF +
                              demographics.IM + demographics.IF +
                              demographics.WF;

      // Prioritize groups with lowest representation
      const groups = [
        { race: 'AFRICAN', gender: 'FEMALE', count: demographics.AF, label: 'African Female' },
        { race: 'AFRICAN', gender: 'MALE', count: demographics.AM, label: 'African Male' },
        { race: 'COLOURED', gender: 'FEMALE', count: demographics.CF, label: 'Coloured Female' },
        { race: 'COLOURED', gender: 'MALE', count: demographics.CM, label: 'Coloured Male' },
        { race: 'INDIAN', gender: 'FEMALE', count: demographics.IF, label: 'Indian Female' },
        { race: 'INDIAN', gender: 'MALE', count: demographics.IM, label: 'Indian Male' },
        { race: 'WHITE', gender: 'FEMALE', count: demographics.WF, label: 'White Female' },
      ];

      // Sort by count (ascending) to prioritize underrepresented groups
      groups.sort((a, b) => a.count - b.count);

      recommendations.push({
        type: 'HIRE',
        level: levelCompliance.level,
        count: levelCompliance.gapCount,
        priority: 'HIGH',
        message: `Hire ${levelCompliance.gapCount} designated group ${levelCompliance.gapCount === 1 ? 'employee' : 'employees'} to achieve compliance`,
        recommendedGroups: groups.slice(0, 3).map(g => g.label),
      });
    }

    return recommendations;
  }

  /**
   * Generate compliance summary statistics
   * @param {Object} complianceReport - Complete compliance report
   * @returns {Object} Summary statistics
   */
  static getComplianceSummary(complianceReport) {
    const totalLevels = complianceReport.levels.length;
    const compliantLevels = complianceReport.levels.filter(l => l.status === 'COMPLIANT').length;
    const nearCompliantLevels = complianceReport.levels.filter(l => l.status === 'NEAR_COMPLIANT').length;
    const nonCompliantLevels = complianceReport.levels.filter(l => l.status === 'NON_COMPLIANT').length;

    const totalEmployees = complianceReport.levels.reduce((sum, l) => sum + l.totalEmployees, 0);
    const totalDesignated = complianceReport.levels.reduce((sum, l) => sum + l.designated, 0);
    const overallPercentage = totalEmployees > 0 ? (totalDesignated / totalEmployees) * 100 : 0;

    const totalGap = complianceReport.levels.reduce((sum, l) => sum + Math.max(0, l.gapCount), 0);

    return {
      totalLevels,
      compliantLevels,
      nearCompliantLevels,
      nonCompliantLevels,
      complianceRate: totalLevels > 0 ? Math.round((compliantLevels / totalLevels) * 100) : 0,
      totalEmployees,
      totalDesignated,
      overallPercentage: Math.round(overallPercentage * 10) / 10,
      totalHiresNeeded: totalGap,
      disabilityStatus: complianceReport.disabilityCompliance.status,
      overallStatus: complianceReport.overallStatus,
    };
  }
}

export default ComplianceEngine;
