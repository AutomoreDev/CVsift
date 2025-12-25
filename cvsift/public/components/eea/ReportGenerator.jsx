/**
 * ReportGenerator Component
 * Generate EEA compliance reports (EEA2, EEA4, EEA12, EEA13)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { useEEA } from '../../hooks/useEEA.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import EEANavbar from './EEANavbar.jsx';
import { addReportHeader, addPageFooters, addCompanyInfo, checkPageBreak } from '../../lib/eea/pdfHelper.js';
import { isDesignatedGroup } from '../../lib/eea/constants.js';

export default function ReportGenerator() {
  const navigate = useNavigate();
  const { company, complianceReport, loading, employees } = useEEA();
  const [generating, setGenerating] = useState(null);

  /**
   * Generate EEA2 PDF Report - Workforce Profile (Internal Report)
   */
  const generateEEA2PDF = () => {
    if (!company || !complianceReport) return;

    setGenerating('EEA2-PDF');

    try {
      const doc = new jsPDF();

      // Add header with disclaimer
      let yPosition = addReportHeader(
        doc,
        'WORKFORCE ANALYSIS REPORT',
        'Internal Compliance Report',
        'This is an internal compliance analysis report. Official Department of Labour submissions require Form EEA2.'
      );

      // Company Information
      yPosition = addCompanyInfo(doc, company, yPosition);

      // Overall Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Overall Compliance Summary', 14, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Employees: ${complianceReport.totalEmployees}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Designated Group: ${complianceReport.designatedCount} (${(complianceReport.designatedPercentage * 100).toFixed(1)}%)`, 14, yPosition);
      yPosition += 5;
      doc.text(`Disability: ${complianceReport.disabilityCompliance.currentCount} (${complianceReport.disabilityCompliance.currentPercentage}%)`, 14, yPosition);
      yPosition += 5;
      doc.text(`Overall Status: ${complianceReport.overallStatus.replace(/_/g, ' ')}`, 14, yPosition);
      yPosition += 10;

      // Workforce Profile Table (for each level)
      complianceReport.levels.forEach((level) => {
        // Check if we need a new page
        yPosition = checkPageBreak(doc, yPosition);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(level.levelName, 14, yPosition);
        yPosition += 5;

        // Prepare table data
        const tableData = [
          ['African Male', level.demographics.africanMale.toString()],
          ['African Female', level.demographics.africanFemale.toString()],
          ['Coloured Male', level.demographics.colouredMale.toString()],
          ['Coloured Female', level.demographics.colouredFemale.toString()],
          ['Indian Male', level.demographics.indianMale.toString()],
          ['Indian Female', level.demographics.indianFemale.toString()],
          ['White Male', level.demographics.whiteMale.toString()],
          ['White Female', level.demographics.whiteFemale.toString()],
          ['Foreign Male', level.demographics.foreignMale.toString()],
          ['Foreign Female', level.demographics.foreignFemale.toString()],
          ['Total', level.totalEmployees.toString()],
          ['Designated Group %', `${(level.designatedPercentage * 100).toFixed(1)}%`],
          ['Target %', `${(level.target * 100).toFixed(1)}%`],
          ['Gap', `${level.gap > 0 ? '+' : ''}${level.gap}%`],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [['Demographic', 'Count']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 9 },
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      });

      // Add footers
      addPageFooters(doc);

      // Save PDF
      const fileName = `Workforce_Analysis_Report_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating Workforce Analysis PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  /**
   * Generate EEA2 Excel Report - Workforce Profile (Internal Report)
   */
  const generateEEA2Excel = () => {
    if (!company || !complianceReport) return;

    setGenerating('EEA2-EXCEL');

    try {
      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['WORKFORCE ANALYSIS REPORT'],
        ['Internal Compliance Report'],
        [''],
        ['Company Information'],
        ['Company Name', company.name],
        ['Economic Sector', company.sector.replace(/_/g, ' ')],
        ['EE Reference Number', company.eeReferenceNumber || 'N/A'],
        ['Reporting Period From', company.eeReportingPeriod?.from?.toLocaleDateString() || 'N/A'],
        ['Reporting Period To', company.eeReportingPeriod?.to?.toLocaleDateString() || 'N/A'],
        ['Report Generated', new Date().toLocaleDateString()],
        [''],
        ['Overall Summary'],
        ['Total Employees', complianceReport.totalEmployees],
        ['Designated Group Count', complianceReport.designatedCount],
        ['Designated Group %', `${(complianceReport.designatedPercentage * 100).toFixed(1)}%`],
        ['Disability Count', complianceReport.disabilityCompliance.currentCount],
        ['Disability %', `${complianceReport.disabilityCompliance.currentPercentage}%`],
        ['Overall Status', complianceReport.overallStatus.replace(/_/g, ' ')],
        [''],
        ['DISCLAIMER', 'This is an internal compliance analysis report. Official Department of Labour submissions require Form EEA2.'],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Workforce Profile Sheet
      const profileData = [
        ['Occupational Level', 'AM', 'AF', 'CM', 'CF', 'IM', 'IF', 'WM', 'WF', 'FM', 'FF', 'Total', 'Designated %', 'Target %', 'Gap %', 'Status']
      ];

      complianceReport.levels.forEach(level => {
        profileData.push([
          level.levelName,
          level.demographics.africanMale,
          level.demographics.africanFemale,
          level.demographics.colouredMale,
          level.demographics.colouredFemale,
          level.demographics.indianMale,
          level.demographics.indianFemale,
          level.demographics.whiteMale,
          level.demographics.whiteFemale,
          level.demographics.foreignMale,
          level.demographics.foreignFemale,
          level.totalEmployees,
          `${(level.designatedPercentage * 100).toFixed(1)}%`,
          `${(level.target * 100).toFixed(1)}%`,
          `${level.gap > 0 ? '+' : ''}${(level.gap * 100).toFixed(1)}%`,
          level.status.replace(/_/g, ' '),
        ]);
      });

      const profileSheet = XLSX.utils.aoa_to_sheet(profileData);
      XLSX.utils.book_append_sheet(wb, profileSheet, 'Workforce Profile');

      // Individual Employee Details Sheet
      const employeeData = [
        ['Employee Number', 'First Name', 'Last Name', 'Gender', 'Race', 'Disability', 'Foreign National', 'Occupational Level', 'Annual Income']
      ];

      employees.forEach(emp => {
        if (emp.status === 'ACTIVE') {
          employeeData.push([
            emp.employeeNumber,
            emp.firstName,
            emp.lastName,
            emp.gender,
            emp.race,
            emp.hasDisability ? 'Yes' : 'No',
            emp.isForeignNational ? 'Yes' : 'No',
            emp.occupationalLevel.replace(/_/g, ' '),
            emp.annualFixedIncome,
          ]);
        }
      });

      const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);
      XLSX.utils.book_append_sheet(wb, employeeSheet, 'Employee Details');

      // Save Excel file
      const fileName = `Workforce_Analysis_Report_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error generating Workforce Analysis Excel:', error);
      alert('Failed to generate Excel report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  /**
   * Calculate income statistics by demographic group
   */
  const calculateIncomeStats = () => {
    const stats = {
      designated: { total: 0, count: 0, employees: [] },
      nonDesignated: { total: 0, count: 0, employees: [] },
      byLevel: {}
    };

    employees.forEach(emp => {
      if (emp.status !== 'ACTIVE' || !emp.annualFixedIncome) return;

      const empIsDesignated = isDesignatedGroup(emp);
      const income = parseFloat(emp.annualFixedIncome);

      if (empIsDesignated) {
        stats.designated.total += income;
        stats.designated.count++;
        stats.designated.employees.push({ ...emp, income });
      } else {
        stats.nonDesignated.total += income;
        stats.nonDesignated.count++;
        stats.nonDesignated.employees.push({ ...emp, income });
      }

      // By level
      const level = emp.occupationalLevel;
      if (!stats.byLevel[level]) {
        stats.byLevel[level] = {
          designated: { total: 0, count: 0 },
          nonDesignated: { total: 0, count: 0 }
        };
      }

      if (empIsDesignated) {
        stats.byLevel[level].designated.total += income;
        stats.byLevel[level].designated.count++;
      } else {
        stats.byLevel[level].nonDesignated.total += income;
        stats.byLevel[level].nonDesignated.count++;
      }
    });

    return stats;
  };

  /**
   * Generate EEA4 PDF Report - Income Differentials (Internal Report)
   */
  const generateEEA4PDF = () => {
    if (!company || !employees) return;

    setGenerating('EEA4-PDF');

    try {
      const doc = new jsPDF();
      const incomeStats = calculateIncomeStats();

      // Add header with disclaimer
      let yPosition = addReportHeader(
        doc,
        'INCOME ANALYSIS REPORT',
        'Internal Compliance Report',
        'This is an internal income analysis report. Official Department of Labour submissions require Form EEA4.'
      );

      // Company Information
      yPosition = addCompanyInfo(doc, company, yPosition);

      // Overall Income Differentials
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Overall Income Analysis', 14, yPosition);
      yPosition += 7;

      const designatedAvg = incomeStats.designated.count > 0
        ? incomeStats.designated.total / incomeStats.designated.count
        : 0;
      const nonDesignatedAvg = incomeStats.nonDesignated.count > 0
        ? incomeStats.nonDesignated.total / incomeStats.nonDesignated.count
        : 0;
      const differential = nonDesignatedAvg > 0
        ? ((designatedAvg - nonDesignatedAvg) / nonDesignatedAvg * 100)
        : 0;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Designated Group Average: R ${designatedAvg.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Non-Designated Group Average: R ${nonDesignatedAvg.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Income Differential: ${differential.toFixed(1)}%`, 14, yPosition);
      yPosition += 10;

      // Income by Occupational Level
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Income Differentials by Occupational Level', 14, yPosition);
      yPosition += 7;

      const levelData = [];
      Object.keys(incomeStats.byLevel).forEach(level => {
        const levelStats = incomeStats.byLevel[level];
        const dAvg = levelStats.designated.count > 0
          ? levelStats.designated.total / levelStats.designated.count
          : 0;
        const ndAvg = levelStats.nonDesignated.count > 0
          ? levelStats.nonDesignated.total / levelStats.nonDesignated.count
          : 0;
        const diff = ndAvg > 0 ? ((dAvg - ndAvg) / ndAvg * 100) : 0;

        levelData.push([
          level.replace(/_/g, ' '),
          `R ${dAvg.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
          `R ${ndAvg.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
          `${diff.toFixed(1)}%`
        ]);
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Occupational Level', 'Designated Avg', 'Non-Designated Avg', 'Differential']],
        body: levelData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // Compliance Statement
      yPosition = checkPageBreak(doc, yPosition);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Compliance Statement', 14, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const pageWidth = doc.internal.pageSize.width;
      const statement = differential >= -20 && differential <= 20
        ? 'The company is compliant with income differential requirements (within ±20%).'
        : 'The company should review compensation policies to address income differentials.';
      doc.text(statement, 14, yPosition, { maxWidth: pageWidth - 28 });

      // Add footers
      addPageFooters(doc);

      const fileName = `Income_Analysis_Report_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating Income Analysis PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  /**
   * Generate EEA4 Excel Report - Income Differentials (Internal Report)
   */
  const generateEEA4Excel = () => {
    if (!company || !employees) return;

    setGenerating('EEA4-EXCEL');

    try {
      const wb = XLSX.utils.book_new();
      const incomeStats = calculateIncomeStats();

      // Summary Sheet
      const designatedAvg = incomeStats.designated.count > 0
        ? incomeStats.designated.total / incomeStats.designated.count
        : 0;
      const nonDesignatedAvg = incomeStats.nonDesignated.count > 0
        ? incomeStats.nonDesignated.total / incomeStats.nonDesignated.count
        : 0;
      const differential = nonDesignatedAvg > 0
        ? ((designatedAvg - nonDesignatedAvg) / nonDesignatedAvg * 100)
        : 0;

      const summaryData = [
        ['INCOME ANALYSIS REPORT'],
        ['Internal Compliance Report'],
        [''],
        ['Company Information'],
        ['Company Name', company.name],
        ['Economic Sector', company.sector.replace(/_/g, ' ')],
        ['EE Reference Number', company.eeReferenceNumber || 'N/A'],
        ['Report Generated', new Date().toLocaleDateString()],
        [''],
        ['Overall Income Analysis'],
        ['Designated Group Count', incomeStats.designated.count],
        ['Designated Group Average Income', designatedAvg.toFixed(2)],
        ['Non-Designated Group Count', incomeStats.nonDesignated.count],
        ['Non-Designated Group Average Income', nonDesignatedAvg.toFixed(2)],
        ['Income Differential %', differential.toFixed(1) + '%'],
        [''],
        ['DISCLAIMER', 'This is an internal income analysis report. Official Department of Labour submissions require Form EEA4.'],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // By Level Sheet
      const levelData = [
        ['Occupational Level', 'Designated Count', 'Designated Avg', 'Non-Designated Count', 'Non-Designated Avg', 'Differential %']
      ];

      Object.keys(incomeStats.byLevel).forEach(level => {
        const levelStats = incomeStats.byLevel[level];
        const dAvg = levelStats.designated.count > 0
          ? levelStats.designated.total / levelStats.designated.count
          : 0;
        const ndAvg = levelStats.nonDesignated.count > 0
          ? levelStats.nonDesignated.total / levelStats.nonDesignated.count
          : 0;
        const diff = ndAvg > 0 ? ((dAvg - ndAvg) / ndAvg * 100) : 0;

        levelData.push([
          level.replace(/_/g, ' '),
          levelStats.designated.count,
          dAvg.toFixed(2),
          levelStats.nonDesignated.count,
          ndAvg.toFixed(2),
          diff.toFixed(1) + '%'
        ]);
      });

      const levelSheet = XLSX.utils.aoa_to_sheet(levelData);
      XLSX.utils.book_append_sheet(wb, levelSheet, 'By Occupational Level');

      // Detailed Employee Data
      const employeeData = [
        ['Employee Number', 'Name', 'Gender', 'Race', 'Occupational Level', 'Annual Income', 'Designated Group']
      ];

      employees.forEach(emp => {
        if (emp.status === 'ACTIVE' && emp.annualFixedIncome) {
          const empIsDesignated = isDesignatedGroup(emp);

          employeeData.push([
            emp.employeeNumber,
            `${emp.firstName} ${emp.lastName}`,
            emp.gender,
            emp.race,
            emp.occupationalLevel.replace(/_/g, ' '),
            emp.annualFixedIncome,
            empIsDesignated ? 'Yes' : 'No'
          ]);
        }
      });

      const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);
      XLSX.utils.book_append_sheet(wb, employeeSheet, 'Employee Details');

      const fileName = `Income_Analysis_Report_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error generating Income Analysis Excel:', error);
      alert('Failed to generate Excel report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  /**
   * Generate EEA12 PDF Report - Consultation Certificate (Official DoL Form)
   */
  const generateEEA12PDF = () => {
    if (!company) return;

    setGenerating('EEA12-PDF');

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 30;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FORM EEA12', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(14);
      doc.text('CONSULTATION CERTIFICATE', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Company Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Company Details:', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Company Name: ${company.name}`, 20, yPosition);
      yPosition += 7;
      doc.text(`EE Reference Number: ${company.eeReferenceNumber || '___________________'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Economic Sector: ${company.sector.replace(/_/g, ' ')}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Total Employees: ${employees.filter(e => e.status === 'ACTIVE').length}`, 20, yPosition);
      yPosition += 15;

      // Consultation Statement
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Consultation Statement:', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const statement = `This is to certify that ${company.name} has consulted with employee representatives regarding the Employment Equity Plan in accordance with Section 17 of the Employment Equity Act, 1998.`;
      doc.text(statement, 20, yPosition, { maxWidth: pageWidth - 40, align: 'justify' });
      yPosition += 30;

      // Consultation Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Consultation Details:', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date of Consultation: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Representatives Consulted: `, 20, yPosition);
      yPosition += 7;
      doc.text(`☐ Trade Union Representatives`, 25, yPosition);
      yPosition += 7;
      doc.text(`☐ Employee Representatives`, 25, yPosition);
      yPosition += 7;
      doc.text(`☐ Employees (in absence of representatives)`, 25, yPosition);
      yPosition += 15;

      // Matters Consulted
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Matters Consulted:', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const matters = [
        '☑ Employment Equity Plan',
        '☑ Annual Report on Employment Equity',
        '☑ Affirmative Action Measures',
        '☑ Workforce Profile and Analysis',
        '☑ Measures to address under-representation'
      ];
      matters.forEach(matter => {
        doc.text(matter, 20, yPosition);
        yPosition += 7;
      });
      yPosition += 10;

      // Signatures
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Signatures:', 14, yPosition);
      yPosition += 15;

      // Employer signature
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Employer Representative:', 20, yPosition);
      yPosition += 15;
      doc.line(20, yPosition, 90, yPosition);
      yPosition += 5;
      doc.setFontSize(9);
      doc.text('Signature', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.text('Name: _________________________', 20, yPosition);
      yPosition += 7;
      doc.text('Position: ______________________', 20, yPosition);
      yPosition += 7;
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 15;

      // Employee representative signature
      yPosition = checkPageBreak(doc, yPosition);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Employee Representative:', 20, yPosition);
      yPosition += 15;
      doc.line(20, yPosition, 90, yPosition);
      yPosition += 5;
      doc.setFontSize(9);
      doc.text('Signature', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.text('Name: _________________________', 20, yPosition);
      yPosition += 7;
      doc.text('Organization: __________________', 20, yPosition);
      yPosition += 7;
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);

      // Add footers
      addPageFooters(doc);

      const fileName = `EEA12_Consultation_Certificate_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating EEA12 PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  /**
   * Generate EEA13 PDF Report - Employment Equity Plan (Official DoL Form)
   */
  const generateEEA13PDF = () => {
    if (!company || !complianceReport) return;

    setGenerating('EEA13-PDF');

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 25;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FORM EEA13', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(14);
      doc.text('EMPLOYMENT EQUITY PLAN', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Company Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Company Information', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Company Name: ${company.name}`, 20, yPosition);
      yPosition += 6;
      doc.text(`EE Reference Number: ${company.eeReferenceNumber || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Economic Sector: ${company.sector.replace(/_/g, ' ')}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Total Employees: ${complianceReport.totalEmployees}`, 20, yPosition);
      yPosition += 6;
      const planStart = new Date();
      const planEnd = new Date();
      planEnd.setFullYear(planEnd.getFullYear() + 1);
      doc.text(`Plan Period: ${planStart.toLocaleDateString()} to ${planEnd.toLocaleDateString()}`, 20, yPosition);
      yPosition += 12;

      // Current Workforce Profile
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Current Workforce Profile', 14, yPosition);
      yPosition += 10;

      const currentProfileData = [];
      complianceReport.levels.slice(0, 5).forEach(level => {
        currentProfileData.push([
          level.levelName.substring(0, 20),
          level.totalEmployees,
          `${(level.designatedPercentage * 100).toFixed(0)}%`,
          `${(level.target * 100).toFixed(0)}%`,
          level.gap > 0 ? `+${level.gap}%` : `${level.gap}%`
        ]);
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Level', 'Total', 'Current %', 'Target %', 'Gap']],
        body: currentProfileData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });

      yPosition = doc.lastAutoTable.finalY + 12;

      // Objectives and Affirmative Action Measures
      yPosition = checkPageBreak(doc, yPosition, 70);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Objectives and Affirmative Action Measures', 14, yPosition);
      yPosition += 10;

      const objectives = [
        {
          level: 'Top Management',
          objective: 'Increase designated group representation',
          measures: ['Targeted recruitment', 'Leadership development programs'],
          timeline: '12 months'
        },
        {
          level: 'Senior Management',
          objective: 'Achieve EAP targets',
          measures: ['Succession planning', 'Mentorship programs'],
          timeline: '12 months'
        },
        {
          level: 'Professionally Qualified',
          objective: 'Maintain compliance levels',
          measures: ['Skills development', 'Fair promotion practices'],
          timeline: '12 months'
        }
      ];

      objectives.forEach((obj, idx) => {
        yPosition = checkPageBreak(doc, yPosition);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`3.${idx + 1} ${obj.level}`, 20, yPosition);
        yPosition += 7;

        doc.setFont('helvetica', 'normal');
        doc.text(`Objective: ${obj.objective}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Measures:`, 25, yPosition);
        yPosition += 6;
        obj.measures.forEach(measure => {
          doc.text(`• ${measure}`, 30, yPosition);
          yPosition += 5;
        });
        yPosition += 1;
        doc.text(`Timeline: ${obj.timeline}`, 25, yPosition);
        yPosition += 10;
      });

      // Numerical Targets
      yPosition = checkPageBreak(doc, yPosition, 70);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Numerical Targets (12 Month Period)', 14, yPosition);
      yPosition += 10;

      const targetsData = [];
      complianceReport.levels.slice(0, 5).forEach(level => {
        const newHires = Math.max(1, Math.ceil(Math.abs(level.gap) * level.totalEmployees / 100));
        targetsData.push([
          level.levelName.substring(0, 20),
          level.totalEmployees,
          level.gap > 0 ? newHires : 0,
          level.gap > 0 ? `${(((level.totalEmployees + newHires) * level.target) / level.totalEmployees * 100).toFixed(0)}%` : `${(level.designatedPercentage * 100).toFixed(0)}%`
        ]);
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Occupational Level', 'Current Total', 'Planned Hires', 'Projected %']],
        body: targetsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });

      yPosition = doc.lastAutoTable.finalY + 12;

      // Monitoring and Evaluation
      yPosition = checkPageBreak(doc, yPosition);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('5. Monitoring and Evaluation', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const monitoring = [
        '• Quarterly reviews of workforce demographics',
        '• Monthly tracking of recruitment and promotions',
        '• Annual compliance reporting to Department of Labour',
        '• Regular consultation with employee representatives',
        '• Skills development tracking and reporting'
      ];

      monitoring.forEach(item => {
        doc.text(item, 20, yPosition);
        yPosition += 6;
      });

      // Add footers
      addPageFooters(doc);

      const fileName = `EEA13_Employment_Equity_Plan_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating EEA13 PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const reports = [
    {
      id: 'EEA2',
      name: 'Workforce Analysis Report',
      description: 'Internal compliance report showing workforce demographics by occupational level. Not an official DoL submission.',
      status: 'Available',
      available: true,
    },
    {
      id: 'EEA4',
      name: 'Income Analysis Report',
      description: 'Internal report on income differentials between designated and non-designated groups. Not an official DoL submission.',
      status: 'Available',
      available: true,
    },
    {
      id: 'EEA12',
      name: 'EEA12 - Consultation Certificate',
      description: 'Official Department of Labour Form: Certificate of consultation with employee representatives.',
      status: 'Available',
      available: true,
    },
    {
      id: 'EEA13',
      name: 'EEA13 - Employment Equity Plan',
      description: 'Official Department of Labour Form: Complete employment equity plan for submission.',
      status: 'Available',
      available: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
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
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Report Generation</h1>
          </div>
          <p className="text-gray-600">
            Generate Department of Labour compliance reports
          </p>
        </div>

        {/* Company Info */}
        {company && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Company Name</p>
                <p className="font-semibold text-gray-900">{company.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Economic Sector</p>
                <p className="font-semibold text-gray-900">{company.sector.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-gray-600">EE Reference Number</p>
                <p className="font-semibold text-gray-900">{company.eeReferenceNumber || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-600">Reporting Period</p>
                <p className="font-semibold text-gray-900">
                  {company.eeReportingPeriod?.from?.toLocaleDateString()} - {company.eeReportingPeriod?.to?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      report.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status}
                    </span>
                    {report.available ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (report.id === 'EEA2') generateEEA2PDF();
                            else if (report.id === 'EEA4') generateEEA4PDF();
                            else if (report.id === 'EEA12') generateEEA12PDF();
                            else if (report.id === 'EEA13') generateEEA13PDF();
                          }}
                          disabled={!complianceReport || generating === `${report.id}-PDF`}
                          className="px-3 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download as PDF"
                        >
                          {generating === `${report.id}-PDF` ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                              PDF
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              PDF
                            </>
                          )}
                        </button>
                        {(report.id === 'EEA2' || report.id === 'EEA4') && (
                          <button
                            onClick={() => {
                              if (report.id === 'EEA2') generateEEA2Excel();
                              else if (report.id === 'EEA4') generateEEA4Excel();
                            }}
                            disabled={!complianceReport || generating === `${report.id}-EXCEL`}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download as Excel"
                          >
                            {generating === `${report.id}-EXCEL` ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                Excel
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Excel
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 border-2 border-gray-300 text-gray-400 rounded-lg cursor-not-allowed inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Generate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">About Reports</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <p className="font-semibold mb-1">Internal Compliance Reports:</p>
              <ul className="ml-4 space-y-1">
                <li><strong>Workforce Analysis Report:</strong> Internal report showing workforce demographics across all occupational levels. Not an official DoL submission.</li>
                <li><strong>Income Analysis Report:</strong> Internal report analyzing income differences between designated and non-designated groups. Not an official DoL submission.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Official Department of Labour Forms:</p>
              <ul className="ml-4 space-y-1">
                <li><strong>EEA12 (Consultation Certificate):</strong> Official form confirming consultation with employee representatives on the EE plan.</li>
                <li><strong>EEA13 (Employment Equity Plan):</strong> Official form outlining your employment equity plan with targets and timeframes.</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Internal reports (Workforce & Income Analysis) are available in both PDF and Excel formats. Official DoL forms (EEA12 & EEA13) are available as PDF documents for print or digital submission.
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
