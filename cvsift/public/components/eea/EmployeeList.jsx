/**
 * EmployeeList Component
 * View, add, edit, and delete employees
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../js/firebase-config.js';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Filter, Download } from 'lucide-react';
import { OCCUPATIONAL_LEVELS, RACES, GENDERS, formatOccupationalLevel, formatRace } from '../../lib/eea/constants.js';
import * as XLSX from 'xlsx';
import EEANavbar from './EEANavbar.jsx';

export default function EmployeeList({ companyId }) {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterRace, setFilterRace] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, [companyId]);

  useEffect(() => {
    // Apply filters
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLevel) {
      filtered = filtered.filter(emp => emp.occupationalLevel === filterLevel);
    }

    if (filterRace) {
      filtered = filtered.filter(emp => emp.race === filterRace);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, filterLevel, filterRace]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);

      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        employmentDate: doc.data().employmentDate?.toDate?.() || doc.data().employmentDate,
        terminationDate: doc.data().terminationDate?.toDate?.() || doc.data().terminationDate,
      }));

      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await deleteDoc(doc(db, 'employees', employeeId));
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleExport = () => {
    const exportData = filteredEmployees.map(emp => ({
      'Employee Number': emp.employeeNumber,
      'First Name': emp.firstName,
      'Last Name': emp.lastName,
      'Initials': emp.initials || '',
      'Gender': emp.gender,
      'Race': emp.race,
      'Nationality': emp.nationality,
      'Foreign National': emp.isForeignNational ? 'Yes' : 'No',
      'ID Number': emp.idNumber || '',
      'Passport Number': emp.passportNumber || '',
      'Disability': emp.hasDisability ? 'Yes' : 'No',
      'Disability Type': emp.disabilityType || '',
      'Employment Date': emp.employmentDate instanceof Date ? emp.employmentDate.toISOString().split('T')[0] : '',
      'Position': emp.position,
      'Occupational Level': formatOccupationalLevel(emp.occupationalLevel),
      'Annual Fixed Income': emp.annualFixedIncome,
      'Annual Variable Income': emp.annualVariableIncome || 0,
      'Status': emp.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');

    const fileName = `Employees_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return (
      <>
        <EEANavbar showBackToDashboard />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading employees...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <EEANavbar showBackToDashboard />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/eea')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4" style={{display: 'none'}}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to EEA Dashboard</span>
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
              <p className="text-gray-600">Manage your employee records</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={filteredEmployees.length === 0}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export to Excel"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => navigate('/eea/import')}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                Import from Excel
              </button>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or employee number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {OCCUPATIONAL_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterRace}
                onChange={(e) => setFilterRace(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Races</option>
                {RACES.map(race => (
                  <option key={race.value} value={race.value}>{race.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Employees</p>
            <p className="text-3xl font-bold text-gray-900">{employees.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {employees.filter(e => e.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">With Disabilities</p>
            <p className="text-3xl font-bold text-blue-600">
              {employees.filter(e => e.hasDisability).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Showing</p>
            <p className="text-3xl font-bold text-gray-900">{filteredEmployees.length}</p>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">No employees found</p>
              <button
                onClick={handleAddNew}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Add Your First Employee
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Emp #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Race</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.employeeNumber}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{employee.position}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatOccupationalLevel(employee.occupationalLevel)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatRace(employee.race)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{employee.gender}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          employee.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          companyId={companyId}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadEmployees();
          }}
        />
      )}
      </div>
    </>
  );
}

// Employee Modal Component
function EmployeeModal({ employee, companyId, onClose, onSave }) {
  const isEditing = !!employee;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(employee || {
    employeeNumber: '',
    firstName: '',
    lastName: '',
    initials: '',
    gender: 'MALE',
    race: 'AFRICAN',
    nationality: 'South African',
    isForeignNational: false,
    idNumber: '',
    passportNumber: '',
    hasDisability: false,
    disabilityType: '',
    employmentDate: new Date().toISOString().split('T')[0],
    position: '',
    occupationalLevel: 'PROFESSIONALLY_QUALIFIED_MID_MANAGEMENT',
    annualFixedIncome: 0,
    annualVariableIncome: 0,
    status: 'ACTIVE',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const employeeData = {
        ...formData,
        companyId,
        employmentDate: Timestamp.fromDate(new Date(formData.employmentDate)),
        annualFixedIncome: parseFloat(formData.annualFixedIncome),
        annualVariableIncome: parseFloat(formData.annualVariableIncome || 0),
        updatedAt: Timestamp.now(),
      };

      if (isEditing) {
        await updateDoc(doc(db, 'employees', employee.id), employeeData);
      } else {
        employeeData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'employees'), employeeData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Employee' : 'Add New Employee'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee Number *</label>
              <input
                type="text"
                name="employeeNumber"
                value={formData.employeeNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID/Passport Number</label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GENDERS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Race *</label>
              <select
                name="race"
                value={formData.race}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RACES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Employment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Occupational Level *</label>
              <select
                name="occupationalLevel"
                value={formData.occupationalLevel}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {OCCUPATIONAL_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Date *</label>
              <input
                type="date"
                name="employmentDate"
                value={formData.employmentDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income *</label>
              <input
                type="number"
                name="annualFixedIncome"
                value={formData.annualFixedIncome}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Disability */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="hasDisability"
                checked={formData.hasDisability}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Has Disability</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
