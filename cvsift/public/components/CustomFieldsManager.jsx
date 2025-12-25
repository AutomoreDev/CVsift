import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../js/firebase-config';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit2, Save, X, Type, Hash, Calendar, CheckSquare, List, Sparkles, BookTemplate, AlertTriangle, Info, Check } from 'lucide-react';
import { useToast } from './Toast';
import { hasFeatureAccess } from '../config/planConfig';
import ConfirmDialog from './ConfirmDialog';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type, description: 'Short text input' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Numeric values' },
  { value: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { value: 'boolean', label: 'Yes/No', icon: CheckSquare, description: 'True/false checkbox' },
  { value: 'select', label: 'Dropdown', icon: List, description: 'Single choice from list' }
];

const FIELD_TEMPLATES = {
  recruitment: {
    name: 'Recruitment Agency',
    icon: Sparkles,
    color: 'blue',
    fields: [
      { name: 'notice_period', label: 'Notice Period', type: 'select', required: true, options: ['Immediate', '1 Week', '2 Weeks', '1 Month', '2 Months', '3 Months'] },
      { name: 'salary_expectation', label: 'Salary Expectation', type: 'text', required: false },
      { name: 'available_for_relocation', label: 'Available for Relocation', type: 'boolean', required: false },
      { name: 'driver_license', label: 'Has Driver License', type: 'boolean', required: false },
      { name: 'security_clearance', label: 'Security Clearance', type: 'select', required: false, options: ['None', 'Confidential', 'Secret', 'Top Secret'] },
      { name: 'interview_availability', label: 'Interview Availability', type: 'date', required: false }
    ]
  },
  corporate: {
    name: 'Corporate HR',
    icon: Sparkles,
    color: 'purple',
    fields: [
      { name: 'employee_id', label: 'Employee ID', type: 'text', required: false },
      { name: 'department', label: 'Department', type: 'select', required: true, options: ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations'] },
      { name: 'seniority_level', label: 'Seniority Level', type: 'select', required: true, options: ['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'] },
      { name: 'hire_date', label: 'Hire Date', type: 'date', required: false },
      { name: 'performance_rating', label: 'Performance Rating', type: 'select', required: false, options: ['1 - Needs Improvement', '2 - Meets Expectations', '3 - Exceeds Expectations', '4 - Outstanding', '5 - Exceptional'] },
      { name: 'internal_referral', label: 'Internal Referral', type: 'boolean', required: false }
    ]
  },
  construction: {
    name: 'Construction/Trades',
    icon: Sparkles,
    color: 'orange',
    fields: [
      { name: 'trade_certification', label: 'Trade Certification', type: 'text', required: true },
      { name: 'years_in_trade', label: 'Years in Trade', type: 'number', required: true },
      { name: 'has_own_tools', label: 'Has Own Tools', type: 'boolean', required: false },
      { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', required: false, options: ['None', 'Car', 'Bakkie', 'Van', 'Truck'] },
      { name: 'willing_to_travel', label: 'Willing to Travel', type: 'boolean', required: false },
      { name: 'site_experience', label: 'Site Experience', type: 'select', required: false, options: ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'All'] }
    ]
  },
  tech: {
    name: 'Tech/IT',
    icon: Sparkles,
    color: 'green',
    fields: [
      { name: 'github_profile', label: 'GitHub Profile', type: 'text', required: false },
      { name: 'linkedin_profile', label: 'LinkedIn Profile', type: 'text', required: false },
      { name: 'portfolio_url', label: 'Portfolio URL', type: 'text', required: false },
      { name: 'remote_work_preference', label: 'Remote Work Preference', type: 'select', required: false, options: ['On-site', 'Hybrid', 'Remote', 'Flexible'] },
      { name: 'tech_stack', label: 'Primary Tech Stack', type: 'text', required: false },
      { name: 'certifications_count', label: 'Number of Certifications', type: 'number', required: false }
    ]
  }
};

export default function CustomFieldsManager() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Confirmation dialog states
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, fieldId: null, fieldLabel: '' });
  const [templateDialog, setTemplateDialog] = useState({ isOpen: false, templateKey: null, templateName: '' });

  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    options: [], // For select type
    conditionalOn: null, // For conditional fields
    conditionalValue: null
  });

  const userPlan = currentUser?.userData?.plan || 'free';
  const hasAccess = hasFeatureAccess(userPlan, 'customFields');

  useEffect(() => {
    loadCustomFields();
  }, [currentUser]);

  const loadCustomFields = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const docRef = doc(db, 'customFieldConfigs', currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCustomFields(docSnap.data().fields || []);
      }
    } catch (error) {
      console.error('Error loading custom fields:', error);
      toast.error('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  const saveCustomFields = async (updatedFields) => {
    if (!currentUser) return;

    try {
      setSaving(true);
      const docRef = doc(db, 'customFieldConfigs', currentUser.uid);
      await setDoc(docRef, {
        userId: currentUser.uid,
        fields: updatedFields,
        updatedAt: new Date()
      });

      setCustomFields(updatedFields);
      toast.success('Custom fields saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving custom fields:', error);
      toast.error('Failed to save custom fields');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = async () => {
    // Validate
    if (!newField.name.trim() || !newField.label.trim()) {
      toast.error('Field name and label are required');
      return;
    }

    // Check for duplicate field names
    if (customFields.some(f => f.name === newField.name)) {
      toast.error('A field with this name already exists');
      return;
    }

    // Validate field name (alphanumeric and underscores only)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newField.name)) {
      toast.error('Field name must start with a letter and contain only letters, numbers, and underscores');
      return;
    }

    // For select type, validate options
    if (newField.type === 'select' && newField.options.length === 0) {
      toast.error('Dropdown fields must have at least one option');
      return;
    }

    const fieldToAdd = {
      ...newField,
      id: `custom_${Date.now()}`,
      createdAt: new Date()
    };

    const updatedFields = [...customFields, fieldToAdd];
    const success = await saveCustomFields(updatedFields);

    if (success) {
      setNewField({ name: '', label: '', type: 'text', required: false, options: [], conditionalOn: null, conditionalValue: null });
      setIsAddingNew(false);
    }
  };

  const handleUpdateField = async (fieldId) => {
    const updatedFields = customFields.map(f =>
      f.id === fieldId ? { ...editingField } : f
    );

    const success = await saveCustomFields(updatedFields);
    if (success) {
      setEditingField(null);
    }
  };

  const handleDeleteField = (fieldId) => {
    const field = customFields.find(f => f.id === fieldId);
    const fieldLabel = field?.label || 'this field';

    setDeleteDialog({
      isOpen: true,
      fieldId: fieldId,
      fieldLabel: fieldLabel
    });
  };

  const confirmDelete = async () => {
    const updatedFields = customFields.filter(f => f.id !== deleteDialog.fieldId);
    await saveCustomFields(updatedFields);
    setDeleteDialog({ isOpen: false, fieldId: null, fieldLabel: '' });
  };

  const handleAddOption = (fieldState, setFieldState) => {
    const optionValue = prompt('Enter option value:');
    if (optionValue && optionValue.trim()) {
      setFieldState({
        ...fieldState,
        options: [...(fieldState.options || []), optionValue.trim()]
      });
    }
  };

  const handleRemoveOption = (index, fieldState, setFieldState) => {
    setFieldState({
      ...fieldState,
      options: fieldState.options.filter((_, i) => i !== index)
    });
  };

  const handleApplyTemplate = (templateKey) => {
    const template = FIELD_TEMPLATES[templateKey];
    if (!template) return;

    if (customFields.length > 0) {
      setTemplateDialog({
        isOpen: true,
        templateKey: templateKey,
        templateName: template.name
      });
    } else {
      // No existing fields, apply directly
      applyTemplate(templateKey);
    }
  };

  const applyTemplate = async (templateKey) => {
    const template = FIELD_TEMPLATES[templateKey];
    if (!template) return;

    const newFields = template.fields.map((field, index) => ({
      ...field,
      id: `custom_${Date.now()}_${index}`,
      createdAt: new Date()
    }));

    const success = await saveCustomFields(newFields);
    if (success) {
      toast.success(`Applied "${template.name}" template successfully`);
      setShowTemplates(false);
      setTemplateDialog({ isOpen: false, templateKey: null, templateName: '' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="bg-accent-50 border border-accent-200 rounded-xl p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto">
            <List size={32} className="text-accent-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-secondary-900 mb-2 font-heading">Custom Fields</h3>
        <p className="text-gray-600 mb-4">
          Custom fields allow you to add your own data fields to CVs for tracking additional information.
        </p>
        <p className="text-accent-600 font-semibold mb-4">
          Available on Professional, Business, and Enterprise plans
        </p>
        <button
          onClick={() => window.location.href = '/pricing'}
          className="px-6 py-2 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition-colors"
        >
          Upgrade Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 font-heading">Custom Fields</h3>
          <p className="text-sm text-gray-600 mt-1">
            Add custom fields to track additional information on CVs
          </p>
        </div>
        {!isAddingNew && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center space-x-2 px-4 py-2 border border-purple-300 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              <Sparkles size={18} />
              <span>Templates</span>
            </button>
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition-colors"
            >
              <Plus size={18} />
              <span>Add Field</span>
            </button>
          </div>
        )}
      </div>

      {/* Templates Section */}
      {showTemplates && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-secondary-900 flex items-center space-x-2 font-heading">
                <Sparkles className="text-purple-500" size={20} />
                <span>Field Templates</span>
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Quick start with pre-configured field sets for common industries
              </p>
            </div>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(FIELD_TEMPLATES).map(([key, template]) => {
              const Icon = template.icon;
              const colorClasses = {
                blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
                purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
                orange: 'from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700',
                green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              };

              return (
                <button
                  key={key}
                  onClick={() => handleApplyTemplate(key)}
                  className={`text-left p-4 bg-gradient-to-br ${colorClasses[template.color]} text-white rounded-xl shadow-md hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon size={24} />
                      <h5 className="font-bold text-lg">{template.name}</h5>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {template.fields.length} fields
                    </span>
                  </div>
                  <p className="text-sm text-white/90 mb-3">
                    {template.fields.slice(0, 3).map(f => f.label).join(', ')}
                    {template.fields.length > 3 && ` +${template.fields.length - 3} more`}
                  </p>
                  <div className="text-xs text-white/80">
                    Click to apply this template
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Existing Fields */}
      {customFields.length > 0 ? (
        <div className="space-y-3">
          {customFields.map((field) => (
            <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {editingField?.id === field.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                      <input
                        type="text"
                        value={editingField.name}
                        onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Cannot be changed after creation</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Label</label>
                      <input
                        type="text"
                        value={editingField.label}
                        onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {editingField.type === 'select' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                      <div className="space-y-2">
                        {editingField.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                              {option}
                            </span>
                            <button
                              onClick={() => handleRemoveOption(index, editingField, setEditingField)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddOption(editingField, setEditingField)}
                          className="text-sm text-accent-500 hover:text-accent-600 font-medium"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingField.required}
                      onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                      className="w-4 h-4 text-accent-500 border-gray-300 rounded focus:ring-accent-500"
                    />
                    <label className="text-sm text-gray-700">Required field</label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingField(null)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateField(field.id)}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition-colors disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {React.createElement(FIELD_TYPES.find(t => t.value === field.type)?.icon || Type, {
                          size: 18,
                          className: 'text-gray-400'
                        })}
                        <span className="font-semibold text-secondary-900">{field.label}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {field.name}
                      </span>
                      <span className="text-xs px-2 py-1 bg-accent-100 text-accent-600 rounded-full">
                        {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                      </span>
                      {field.required && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    {field.type === 'select' && field.options?.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Options: {field.options.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingField({ ...field })}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isAddingNew && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <List size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No custom fields defined yet</p>
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-6 py-2 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition-colors"
            >
              Create Your First Field
            </button>
          </div>
        )
      )}

      {/* Add New Field Form */}
      {isAddingNew && (
        <div className="bg-accent-50 border border-accent-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-secondary-900 font-heading">Add New Custom Field</h4>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewField({ name: '', label: '', type: 'text', required: false, options: [], conditionalOn: null, conditionalValue: null });
              }}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                placeholder="e.g., years_of_experience"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used internally (lowercase, underscores only)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                placeholder="e.g., Years of Experience"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Shown to users in the interface
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
            <div className="grid grid-cols-5 gap-2">
              {FIELD_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setNewField({ ...newField, type: type.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newField.type === type.value
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} className={newField.type === type.value ? 'text-accent-500 mx-auto' : 'text-gray-400 mx-auto'} />
                    <p className={`text-xs font-medium mt-1 ${newField.type === type.value ? 'text-accent-600' : 'text-gray-600'}`}>
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {newField.type === 'select' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dropdown Options <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {newField.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                      {option}
                    </span>
                    <button
                      onClick={() => handleRemoveOption(index, newField, setNewField)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddOption(newField, setNewField)}
                  className="text-sm text-accent-500 hover:text-accent-600 font-medium"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {/* Conditional Logic */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                <Info className="text-white" size={20} />
              </div>
              <div>
                <label className="block text-base font-bold text-secondary-900">
                  Conditional Display
                </label>
                <p className="text-xs text-gray-600">
                  Show this field only when another field has a specific value
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Show when field:</label>
                <select
                  value={newField.conditionalOn || ''}
                  onChange={(e) => setNewField({ ...newField, conditionalOn: e.target.value || null, conditionalValue: null })}
                  className="w-full px-4 py-3 text-sm bg-white border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-700 hover:border-blue-300 cursor-pointer"
                >
                  <option value="">Always show this field</option>
                  {customFields.filter(f => f.type === 'boolean' || f.type === 'select').map(field => (
                    <option key={field.id} value={field.name}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              {newField.conditionalOn && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Equals value:</label>
                  {(() => {
                    const conditionalField = customFields.find(f => f.name === newField.conditionalOn);
                    if (conditionalField?.type === 'boolean') {
                      return (
                        <select
                          value={newField.conditionalValue === null ? '' : String(newField.conditionalValue)}
                          onChange={(e) => setNewField({ ...newField, conditionalValue: e.target.value === 'true' })}
                          className="w-full px-4 py-3 text-sm bg-white border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-700 hover:border-blue-300 cursor-pointer"
                        >
                          <option value="">Select value...</option>
                          <option value="true">✓ Yes</option>
                          <option value="false">✗ No</option>
                        </select>
                      );
                    } else if (conditionalField?.type === 'select') {
                      return (
                        <select
                          value={newField.conditionalValue || ''}
                          onChange={(e) => setNewField({ ...newField, conditionalValue: e.target.value })}
                          className="w-full px-4 py-3 text-sm bg-white border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-700 hover:border-blue-300 cursor-pointer"
                        >
                          <option value="">Select value...</option>
                          {conditionalField.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Active Filters Display */}
              {newField.conditionalOn && newField.conditionalValue !== null && newField.conditionalValue !== '' && (
                <div className="animate-slideUp">
                  <label className="block text-sm font-semibold text-blue-700 mb-2">Active filters:</label>
                  <div className="flex items-start gap-3 text-sm text-blue-900 bg-white rounded-lg px-4 py-3 border-2 border-blue-300 shadow-sm">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="text-white" size={14} />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Conditional display enabled</p>
                      <p className="text-blue-700">
                        Field will appear when <span className="font-bold">"{customFields.find(f => f.name === newField.conditionalOn)?.label}"</span> equals <span className="font-bold">"{newField.conditionalValue === true ? 'Yes' : newField.conditionalValue === false ? 'No' : newField.conditionalValue}"</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
              className="w-4 h-4 text-accent-500 border-gray-300 rounded focus:ring-accent-500"
            />
            <label className="text-sm text-gray-700">Make this field required</label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-accent-200">
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewField({ name: '', label: '', type: 'text', required: false, options: [], conditionalOn: null, conditionalValue: null });
              }}
              className="px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddField}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition-colors disabled:opacity-50"
            >
              <Plus size={18} />
              <span>Add Field</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, fieldId: null, fieldLabel: '' })}
        onConfirm={confirmDelete}
        title={`Delete "${deleteDialog.fieldLabel}"?`}
        message="This will permanently remove this custom field from your configuration. The data in existing CVs will not be deleted, but you won't be able to view or edit it through the interface anymore."
        confirmText="Delete Field"
        cancelText="Cancel"
        type="danger"
        icon={Trash2}
        confirmLoading={saving}
      />

      {/* Template Confirmation Dialog */}
      <ConfirmDialog
        isOpen={templateDialog.isOpen}
        onClose={() => setTemplateDialog({ isOpen: false, templateKey: null, templateName: '' })}
        onConfirm={() => applyTemplate(templateDialog.templateKey)}
        title={`Apply "${templateDialog.templateName}" Template?`}
        message={`This will replace your current ${customFields.length} custom field${customFields.length !== 1 ? 's' : ''} with the "${templateDialog.templateName}" template. Your existing custom field configuration will be overwritten, but data in CVs will remain intact.`}
        confirmText="Apply Template"
        cancelText="Cancel"
        type="warning"
        icon={Sparkles}
        confirmLoading={saving}
      />
    </div>
  );
}
