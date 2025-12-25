import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Palette, Lock } from 'lucide-react';
import { getAllTemplates, COLOR_PRESETS } from '../lib/cvTemplates';
import CVTemplate from '../components/CVTemplate';
import { useAuth } from '../context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { PLAN_NAMES } from '../config/planConfig';

/**
 * CV Builder - Step 1: Template Selection
 * Allows users to choose a CV template and customize the accent color
 */
export default function CVBuilder() {
  const navigate = useNavigate();
  const templates = getAllTemplates();
  const { currentUser, userData } = useAuth();
  const functions = getFunctions();

  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
  const [selectedColor, setSelectedColor] = useState(templates[0].defaultColor);
  const [customColor, setCustomColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasExistingCV, setHasExistingCV] = useState(false);
  const [userPlan, setUserPlan] = useState(PLAN_NAMES.FREE);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Check if user already has a CV Builder draft (free users limited to 1)
  useEffect(() => {
    const checkExistingCV = async () => {
      try {
        setLoading(true);

        // Get user's plan from userData (includes inherited plan for team members)
        const plan = userData?.plan || PLAN_NAMES.FREE;
        setUserPlan(plan);

        // Check if user has existing CV Builder data
        const getCVBuilderData = httpsCallable(functions, 'getCVBuilderData');
        const result = await getCVBuilderData();

        if (result.data.success && result.data.data) {
          setHasExistingCV(true);

          // Only free users are limited to 1 CV
          if (plan === PLAN_NAMES.FREE) {
            setIsLimitReached(true);
          }
        }
      } catch (error) {
        console.error('Error checking existing CV:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && userData) {
      checkExistingCV();
    }
  }, [currentUser, userData, functions]);

  const handleContinue = () => {
    // If limit reached, don't allow continuing
    if (isLimitReached) {
      return;
    }

    // Store template and color selection in session or pass via state
    navigate('/cv-builder/create', {
      state: {
        templateId: selectedTemplate,
        accentColor: selectedColor
      }
    });
  };

  const handleEditExisting = () => {
    navigate('/cv-builder/create');
  };

  const handleUpgrade = () => {
    navigate('/billing');
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setCustomColor('');
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    setSelectedColor(color);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-dominant flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CV Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dominant">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-secondary">CV Builder</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {isLimitReached ? 'View your CV' : 'Step 1 of 2: Choose your template'}
                </p>
              </div>
            </div>

            {!isLimitReached && (
              <button
                onClick={handleContinue}
                className="flex items-center space-x-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors shadow-sm font-medium"
              >
                <span>Continue</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Limit reached message for free users */}
        {isLimitReached && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Lock className="text-amber-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  CV Builder Limit Reached
                </h3>
                <p className="text-amber-800 mb-4">
                  Free users can create and save one CV at a time. You already have a CV saved in your account.
                  You can edit your existing CV or upgrade to a paid plan for unlimited CV creation.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleEditExisting}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
                  >
                    Edit Existing CV
                  </button>
                  <button
                    onClick={handleUpgrade}
                    className="px-4 py-2 bg-white border-2 border-accent text-accent rounded-lg hover:bg-accent/5 transition-colors font-medium"
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Color customization section - disabled if limit reached */}
        <div className={`bg-white rounded-xl shadow-sm p-6 mb-8 ${isLimitReached ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Palette className="text-accent" size={24} />
            <h2 className="text-lg font-semibold text-secondary">Customize Accent Color</h2>
          </div>

          <p className="text-gray-600 text-sm mb-4">
            Choose a color that represents your personal brand. This will be used for headings and accents throughout your CV.
          </p>

          {/* Preset colors */}
          <div className="flex flex-wrap gap-3 mb-4">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleColorSelect(preset.value)}
                className={`relative w-12 h-12 rounded-lg transition-all duration-200 ${
                  selectedColor === preset.value && !customColor
                    ? 'ring-2 ring-offset-2 ring-accent scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
                aria-label={`Select ${preset.name} color`}
              >
                {selectedColor === preset.value && !customColor && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                )}
              </button>
            ))}

            {/* Custom color picker toggle */}
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
                showColorPicker || customColor
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              title="Custom color"
              aria-label="Choose custom color"
            >
              <Palette size={20} className={customColor ? 'text-accent' : 'text-gray-400'} />
            </button>
          </div>

          {/* Custom color input */}
          {showColorPicker && (
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <label htmlFor="custom-color" className="text-sm font-medium text-gray-700">
                Custom Color:
              </label>
              <input
                id="custom-color"
                type="color"
                value={customColor || selectedColor}
                onChange={handleCustomColorChange}
                className="w-16 h-10 rounded cursor-pointer border-2 border-gray-300"
              />
              <input
                type="text"
                value={customColor || selectedColor}
                onChange={(e) => handleCustomColorChange({ target: { value: e.target.value } })}
                placeholder="#3B82F6"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          {/* Selected color preview */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600">Selected Color:</span>
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg shadow-sm border border-gray-200"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm font-mono text-gray-700">{selectedColor}</span>
            </div>
          </div>
        </div>

        {/* Template selection - disabled if limit reached */}
        <div className={isLimitReached ? 'opacity-50 pointer-events-none' : ''}>
          <h2 className="text-xl font-semibold text-secondary mb-2">Choose a Template</h2>
          <p className="text-gray-600 mb-6">
            Select a professional template that matches your style and industry.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <CVTemplate
                key={template.id}
                template={template}
                isSelected={selectedTemplate === template.id}
                onSelect={() => setSelectedTemplate(template.id)}
                customColor={selectedColor}
              />
            ))}
          </div>
        </div>

        {/* Bottom action bar for mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors shadow-sm font-medium"
          >
            <span>Continue to Form</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Spacer for mobile fixed button */}
        <div className="h-20 md:hidden" />
      </div>
    </div>
  );
}
