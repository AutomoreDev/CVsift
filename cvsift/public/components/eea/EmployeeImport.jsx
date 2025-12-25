/**
 * EmployeeImport Component
 * Upload and import employee data via Excel/CSV
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../js/firebase-config.js';
import { Upload, Download, FileSpreadsheet, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import EEANavbar from './EEANavbar.jsx';

export default function EmployeeImport({ companyId, onComplete }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setSuccess(null);

    try {
      // Read and preview file
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Preview first 5 rows
      setPreview(jsonData.slice(0, 5));
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read file. Please ensure it\'s a valid Excel or CSV file.');
    }
  };

  const parseEmployee = (row) => {
    // Parse employee data from row
    const employee = {
      companyId,
      employeeNumber: String(row['Employee Number'] || row['Emp No'] || ''),
      firstName: String(row['First Name'] || ''),
      lastName: String(row['Last Name'] || ''),
      initials: String(row['Initials'] || ''),
      gender: String(row['Gender'] || '').toUpperCase(),
      race: String(row['Race'] || '').toUpperCase(),
      nationality: String(row['Nationality'] || 'South African'),
      isForeignNational: String(row['Foreign National'] || 'No').toLowerCase() === 'yes',
      idNumber: String(row['ID Number'] || ''),
      passportNumber: String(row['Passport Number'] || ''),
      hasDisability: String(row['Disability'] || 'No').toLowerCase() === 'yes',
      disabilityType: String(row['Disability Type'] || ''),
      employmentDate: row['Employment Date'] ? Timestamp.fromDate(new Date(row['Employment Date'])) : Timestamp.now(),
      position: String(row['Position'] || row['Job Title'] || ''),
      occupationalLevel: String(row['Occupational Level'] || '').toUpperCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''),
      annualFixedIncome: parseFloat(row['Annual Fixed Income'] || row['Annual Income'] || 0),
      annualVariableIncome: parseFloat(row['Annual Variable Income'] || 0),
      status: 'ACTIVE',
      terminationDate: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    return employee;
  };

  const validateEmployee = (employee, rowIndex) => {
    const errors = [];

    if (!employee.employeeNumber) {
      errors.push(`Row ${rowIndex + 2}: Missing employee number`);
    }
    if (!employee.firstName) {
      errors.push(`Row ${rowIndex + 2}: Missing first name`);
    }
    if (!employee.lastName) {
      errors.push(`Row ${rowIndex + 2}: Missing last name`);
    }
    if (!['MALE', 'FEMALE'].includes(employee.gender)) {
      errors.push(`Row ${rowIndex + 2}: Invalid gender (must be Male or Female)`);
    }
    if (!['AFRICAN', 'COLOURED', 'INDIAN', 'WHITE'].includes(employee.race)) {
      errors.push(`Row ${rowIndex + 2}: Invalid race (must be African, Coloured, Indian, or White)`);
    }
    if (!employee.occupationalLevel) {
      errors.push(`Row ${rowIndex + 2}: Missing occupational level`);
    }
    if (employee.annualFixedIncome <= 0) {
      errors.push(`Row ${rowIndex + 2}: Invalid annual income`);
    }

    return errors;
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!companyId) {
      setError('Company ID is missing. Please create a company profile first.');
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Read file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('File is empty or has no data rows');
      }

      // Parse and validate all employees
      const employees = [];
      const validationErrors = [];

      jsonData.forEach((row, index) => {
        try {
          const employee = parseEmployee(row);
          const errors = validateEmployee(employee, index);

          if (errors.length > 0) {
            validationErrors.push(...errors);
          } else {
            employees.push(employee);
          }
        } catch (err) {
          validationErrors.push(`Row ${index + 2}: ${err.message}`);
        }
      });

      // If there are validation errors, show them
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors:\n${validationErrors.slice(0, 10).join('\n')}${validationErrors.length > 10 ? `\n... and ${validationErrors.length - 10} more errors` : ''}`);
      }

      // Check for duplicate employee numbers in the database
      const employeeNumbers = employees.map(emp => emp.employeeNumber);
      const employeesRef = collection(db, 'employees');
      const duplicateQuery = query(
        employeesRef,
        where('companyId', '==', companyId),
        where('employeeNumber', 'in', employeeNumbers.slice(0, 10)) // Firestore 'in' query limit is 10
      );

      // For larger imports, we need to batch check in groups of 10
      const duplicateErrors = [];
      for (let i = 0; i < employeeNumbers.length; i += 10) {
        const batch = employeeNumbers.slice(i, i + 10);
        const batchQuery = query(
          employeesRef,
          where('companyId', '==', companyId),
          where('employeeNumber', 'in', batch)
        );
        const existingSnapshot = await getDocs(batchQuery);

        existingSnapshot.forEach(doc => {
          const existingEmployee = doc.data();
          duplicateErrors.push(`Employee number ${existingEmployee.employeeNumber} already exists in the database (${existingEmployee.firstName} ${existingEmployee.lastName})`);
        });
      }

      // If there are duplicate employees, show error
      if (duplicateErrors.length > 0) {
        throw new Error(`Duplicate employees found:\n${duplicateErrors.slice(0, 10).join('\n')}${duplicateErrors.length > 10 ? `\n... and ${duplicateErrors.length - 10} more duplicates` : ''}\n\nPlease remove duplicate employee numbers from your file or delete the existing employees first.`);
      }

      // Check for duplicates within the uploaded file itself
      const employeeNumberCounts = {};
      const fileDuplicates = [];
      employees.forEach((employee, index) => {
        if (employeeNumberCounts[employee.employeeNumber]) {
          fileDuplicates.push(`Row ${index + 2}: Employee number ${employee.employeeNumber} appears multiple times in the file`);
        } else {
          employeeNumberCounts[employee.employeeNumber] = true;
        }
      });

      if (fileDuplicates.length > 0) {
        throw new Error(`Duplicate employee numbers in file:\n${fileDuplicates.slice(0, 10).join('\n')}${fileDuplicates.length > 10 ? `\n... and ${fileDuplicates.length - 10} more duplicates` : ''}\n\nPlease ensure each employee number is unique in your file.`);
      }

      // Import employees to Firestore
      let imported = 0;

      for (const employee of employees) {
        await addDoc(employeesRef, employee);
        imported++;
      }

      setSuccess(`Successfully imported ${imported} employee${imported === 1 ? '' : 's'}!`);
      setFile(null);
      setPreview([]);

      // Call completion callback
      if (onComplete) {
        setTimeout(() => onComplete(), 2000);
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import employees');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    // Define dropdown lists for data validation
    const genderOptions = ['MALE', 'FEMALE'];
    const raceOptions = ['AFRICAN', 'COLOURED', 'INDIAN', 'WHITE', 'FOREIGN_NATIONAL'];
    const nationalityOptions = ['South African', 'Other'];
    const yesNoOptions = ['Yes', 'No'];
    const disabilityTypes = [
      '',
      'Sight (Blind/Severe Visual Limitation)',
      'Hearing (Deaf/Hard of Hearing)',
      'Communication (Speech Impairment)',
      'Physical (Wheelchair User)',
      'Physical (Other)',
      'Intellectual (Learning Difficulty)',
      'Emotional (Mental Health)',
      'Multiple Disabilities'
    ];
    const occupationalLevels = [
      'TOP MANAGEMENT',
      'SENIOR MANAGEMENT',
      'PROFESSIONALLY QUALIFIED MID MANAGEMENT',
      'SKILLED TECHNICAL ACADEMICALLY QUALIFIED',
      'SEMI SKILLED',
      'UNSKILLED',
      'TEMPORARY EMPLOYEES'
    ];

    // Create Employee Data worksheet
    const worksheet = workbook.addWorksheet('Employee Data');

    // Define columns with headers and widths
    worksheet.columns = [
      { header: 'Employee Number', key: 'employeeNumber', width: 15 },
      { header: 'First Name', key: 'firstName', width: 15 },
      { header: 'Last Name', key: 'lastName', width: 15 },
      { header: 'Initials', key: 'initials', width: 10 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Race', key: 'race', width: 18 },
      { header: 'Nationality', key: 'nationality', width: 18 },
      { header: 'Foreign National', key: 'foreignNational', width: 16 },
      { header: 'ID Number', key: 'idNumber', width: 18 },
      { header: 'Passport Number', key: 'passportNumber', width: 18 },
      { header: 'Disability', key: 'disability', width: 12 },
      { header: 'Disability Type', key: 'disabilityType', width: 35 },
      { header: 'Employment Date', key: 'employmentDate', width: 15 },
      { header: 'Position', key: 'position', width: 25 },
      { header: 'Occupational Level', key: 'occupationalLevel', width: 40 },
      { header: 'Annual Fixed Income', key: 'annualFixedIncome', width: 18 },
      { header: 'Annual Variable Income', key: 'annualVariableIncome', width: 20 }
    ];

    // Add sample data rows
    worksheet.addRow(['001', 'John', 'Doe', 'J', 'MALE', 'AFRICAN', 'South African', 'No', '9001015800080', '', 'No', '', '2020-01-15', 'Manager', 'SENIOR MANAGEMENT', '500000', '50000']);
    worksheet.addRow(['002', 'Jane', 'Smith', 'J', 'FEMALE', 'COLOURED', 'South African', 'No', '9102205800081', '', 'Yes', 'Physical (Other)', '2021-06-01', 'Software Engineer', 'PROFESSIONALLY QUALIFIED MID MANAGEMENT', '450000', '30000']);

    // Style header row with CVSift branding
    const headerRow = worksheet.getRow(1);
    headerRow.height = 35;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.border = {
      top: { style: 'medium', color: { argb: 'FF2563EB' } },
      bottom: { style: 'medium', color: { argb: 'FF2563EB' } },
      left: { style: 'thin', color: { argb: 'FF2563EB' } },
      right: { style: 'thin', color: { argb: 'FF2563EB' } }
    };

    // Define dropdown column indices (1-indexed for ExcelJS)
    const dropdownCols = [5, 6, 7, 8, 11, 12, 15]; // Gender, Race, Nationality, Foreign National, Disability, Disability Type, Occupational Level

    // Style data rows with alternating colors
    for (let rowNum = 2; rowNum <= 3; rowNum++) {
      const row = worksheet.getRow(rowNum);
      row.height = 22;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const isDropdownCol = dropdownCols.includes(colNumber);

        if (isDropdownCol) {
          // Light blue tint for dropdown columns
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowNum % 2 === 0 ? 'FFEFF6FF' : 'FFF0F9FF' }
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFBFDBFE' } },
            bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } },
            left: { style: 'thin', color: { argb: 'FFBFDBFE' } },
            right: { style: 'thin', color: { argb: 'FFBFDBFE' } }
          };
        } else {
          // Gray/white alternating for regular columns
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowNum % 2 === 0 ? 'FFF9FAFB' : 'FFFFFFFF' }
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        }
        cell.alignment = { vertical: 'middle' };
      });
    }

    // Add data validation (dropdowns) for rows 2-1000
    // Gender dropdown (column E)
    worksheet.getColumn(5).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${genderOptions.join(',')}"`]
        };
      }
    });
    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`E${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${genderOptions.join(',')}"`]
      };
    }

    // Race dropdown (column F)
    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`F${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${raceOptions.join(',')}"`]
      };
    }

    // Nationality dropdown (column G)
    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`G${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${nationalityOptions.join(',')}"`]
      };
    }

    // Foreign National dropdown (column H)
    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`H${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${yesNoOptions.join(',')}"`]
      };
    }

    // Disability dropdown (column K)
    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`K${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${yesNoOptions.join(',')}"`]
      };
    }

    // Disability Type dropdown (column L)
    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`L${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${disabilityTypes.join(',')}"`]
      };
    }

    // Occupational Level dropdown (column O)
    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`O${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${occupationalLevels.join(',')}"`]
      };
    }

    // Create Instructions worksheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.columns = [{ width: 90 }];

    const instructionsData = [
      'CVSift EEA Employee Import Template',
      '',
      'INSTRUCTIONS',
      '1. Fill in employee data in the "Employee Data" sheet',
      '2. Columns highlighted in light blue have dropdown menus - click the dropdown arrow to select values',
      '3. Dropdown columns: Gender, Race, Nationality, Foreign National, Disability, Disability Type, Occupational Level',
      '4. Employee Numbers must be unique',
      '5. Date format: YYYY-MM-DD (e.g., 2023-01-15)',
      '6. ID Number: 13 digits for South African citizens',
      '7. Passport Number: Required if Foreign National = Yes',
      '8. You can add up to 1000 employee rows',
      '',
      'FIELD DESCRIPTIONS',
      '',
      'Employee Number*: Unique identifier for each employee',
      'First Name*: Employee first name',
      'Last Name*: Employee surname',
      'Initials: Employee initials',
      'Gender* (DROPDOWN): Select MALE or FEMALE',
      'Race* (DROPDOWN): Select AFRICAN, COLOURED, INDIAN, WHITE, or FOREIGN_NATIONAL',
      'Nationality* (DROPDOWN): Select South African or Other',
      'Foreign National* (DROPDOWN): Select Yes or No',
      'ID Number: South African ID number (13 digits)',
      'Passport Number: Required if Foreign National = Yes',
      'Disability* (DROPDOWN): Select Yes or No',
      'Disability Type (DROPDOWN): If Disability = Yes, select type from dropdown',
      'Employment Date*: Date employee started (YYYY-MM-DD)',
      'Position*: Job title or position',
      'Occupational Level* (DROPDOWN): Select from 7 levels',
      'Annual Fixed Income*: Annual salary (numbers only, no commas)',
      'Annual Variable Income: Bonuses, commissions (numbers only, no commas)',
      '',
      'OCCUPATIONAL LEVELS',
      'TOP MANAGEMENT: CEO, CFO, COO, Directors',
      'SENIOR MANAGEMENT: Senior Managers, Heads of Departments',
      'PROFESSIONALLY QUALIFIED MID MANAGEMENT: Managers with professional qualifications',
      'SKILLED TECHNICAL ACADEMICALLY QUALIFIED: Specialists, technicians, qualified professionals',
      'SEMI SKILLED: Operators, administrative staff',
      'UNSKILLED: General workers, cleaners',
      'TEMPORARY EMPLOYEES: Fixed-term or temporary contracts',
      '',
      'DISABILITY TYPES (DoL Categories)',
      '- Sight (Blind/Severe Visual Limitation)',
      '- Hearing (Deaf/Hard of Hearing)',
      '- Communication (Speech Impairment)',
      '- Physical (Wheelchair User)',
      '- Physical (Other)',
      '- Intellectual (Learning Difficulty)',
      '- Emotional (Mental Health)',
      '- Multiple Disabilities',
      '',
      'TIPS FOR BEST RESULTS',
      '✓ Light blue columns indicate dropdown menus - use these to prevent spelling errors',
      '✓ Keep sample rows as reference for formatting',
      '✓ Income values should be numbers only (e.g., 500000, not R500,000)',
      '✓ Use YYYY-MM-DD format for dates (e.g., 2023-01-15)',
      '✓ Ensure all required fields (*) are completed',
      '',
      'SUPPORT',
      'For assistance, contact: emma@automore.co.za',
      'Generated by CVSift - https://cvsift-3dff8.web.app'
    ];

    instructionsData.forEach((text, index) => {
      const row = instructionsSheet.getRow(index + 1);
      row.getCell(1).value = text;
    });

    // Style title row
    const titleRow = instructionsSheet.getRow(1);
    titleRow.height = 28;
    titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.getCell(1).border = {
      top: { style: 'medium', color: { argb: 'FF2563EB' } },
      bottom: { style: 'medium', color: { argb: 'FF2563EB' } },
      left: { style: 'medium', color: { argb: 'FF2563EB' } },
      right: { style: 'medium', color: { argb: 'FF2563EB' } }
    };

    // Style section headers
    const sectionRows = {
      3: 'FF3B82F6',   // INSTRUCTIONS
      13: 'FF60A5FA',  // FIELD DESCRIPTIONS
      33: 'FF3B82F6',  // OCCUPATIONAL LEVELS
      42: 'FF60A5FA',  // DISABILITY TYPES
      52: 'FF3B82F6',  // TIPS
      59: 'FF10B981'   // SUPPORT
    };

    Object.entries(sectionRows).forEach(([rowNum, color]) => {
      const row = instructionsSheet.getRow(parseInt(rowNum));
      row.getCell(1).font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    });

    // Style contact info
    instructionsSheet.getRow(60).getCell(1).font = { size: 11, color: { argb: 'FF059669' } };
    instructionsSheet.getRow(61).getCell(1).font = { size: 10, italic: true, color: { argb: 'FF3B82F6' } };

    // Save the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CVSift_EEA_Employee_Import_Template.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Check if companyId is available
  if (!companyId) {
    return (
      <>
        <EEANavbar showBackToDashboard />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-6 max-w-4xl">
            <button
              onClick={() => navigate('/eea')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4" style={{display: 'none'}}
            >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to EEA Dashboard</span>
          </button>
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Profile Required</h2>
            <p className="text-gray-600 mb-6">
              Please create a company profile first before importing employees
            </p>
            <button
              onClick={() => navigate('/eea/setup')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Create Company Profile
            </button>
          </div>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      <EEANavbar showBackToDashboard />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
          <button
            onClick={() => navigate('/eea')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4" style={{display: 'none'}}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to EEA Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Import Employees</h1>
          </div>
          <p className="text-gray-600">
            Upload an Excel or CSV file with your employee data
          </p>
        </div>

        {/* Download Template */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-10 w-10 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Download Excel Template</h3>
                <p className="text-sm text-gray-600">
                  Use our template to ensure correct formatting
                </p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {file ? (
                <>
                  <p className="text-lg font-medium text-gray-900 mb-2">{file.name}</p>
                  <p className="text-sm text-gray-600">Click to select a different file</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-600">Excel (.xlsx, .xls) or CSV files</p>
                </>
              )}
            </label>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Preview (First 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-3 py-2 border-r border-gray-300 text-left font-semibold">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-300">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-3 py-2 border-r border-gray-300">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">Import Failed</p>
              <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 mb-1">Import Successful</p>
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => navigate('/eea')}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Import Employees</span>
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Import Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Download the template to see the required column format</li>
            <li>Ensure all required fields are filled: Employee Number, First Name, Last Name, Gender, Race, Position, Occupational Level, Annual Income</li>
            <li><strong>Employee Numbers must be unique</strong> - the system will reject duplicates</li>
            <li>Gender must be: Male or Female</li>
            <li>Race must be: African, Coloured, Indian, or White</li>
            <li>Occupational Level must match one of the 6 standard levels</li>
            <li>Dates should be in format: YYYY-MM-DD (e.g., 2020-01-15)</li>
          </ul>
        </div>
      </div>
      </div>
    </>
  );
}
