import React from 'react';
import { Check } from 'lucide-react';

/**
 * CV Template Preview Card
 * Displays a template option with preview and selection state
 */
export default function CVTemplate({ template, isSelected, onSelect, customColor }) {
  const accentColor = customColor || template.defaultColor;

  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-accent shadow-lg scale-105'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 bg-accent text-white rounded-full p-1.5 shadow-md">
          <Check size={16} strokeWidth={3} />
        </div>
      )}

      {/* Template preview mockup */}
      <div className="p-6 bg-white">
        {template.layout === 'single-column' && (
          <SingleColumnPreview accentColor={accentColor} />
        )}
        {template.layout === 'two-column' && (
          <TwoColumnPreview accentColor={accentColor} />
        )}
        {template.layout === 'asymmetric' && (
          <AsymmetricPreview accentColor={accentColor} />
        )}
      </div>

      {/* Template info */}
      <div className="p-4 bg-gray-50 border-t">
        <h3 className="font-semibold text-lg text-secondary mb-1">{template.name}</h3>
        <p className="text-sm text-gray-600">{template.description}</p>
      </div>
    </div>
  );
}

/**
 * Single column layout preview
 */
function SingleColumnPreview({ accentColor }) {
  return (
    <div className="space-y-2" style={{ minHeight: '200px' }}>
      {/* Header */}
      <div className="space-y-1">
        <div className="h-4 rounded" style={{ backgroundColor: accentColor, width: '60%' }} />
        <div className="h-2 bg-gray-200 rounded" style={{ width: '80%' }} />
      </div>

      {/* Divider */}
      <div className="h-0.5 rounded" style={{ backgroundColor: accentColor, width: '100%' }} />

      {/* Content sections */}
      <div className="space-y-1.5 pt-2">
        <div className="h-2.5 rounded" style={{ backgroundColor: accentColor, width: '40%' }} />
        <div className="h-1.5 bg-gray-200 rounded" style={{ width: '100%' }} />
        <div className="h-1.5 bg-gray-200 rounded" style={{ width: '95%' }} />
      </div>

      <div className="space-y-1.5 pt-2">
        <div className="h-2.5 rounded" style={{ backgroundColor: accentColor, width: '45%' }} />
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-300 rounded" style={{ width: '70%' }} />
          <div className="h-1.5 bg-gray-200 rounded" style={{ width: '100%' }} />
          <div className="h-1.5 bg-gray-200 rounded" style={{ width: '90%' }} />
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <div className="h-2.5 rounded" style={{ backgroundColor: accentColor, width: '35%' }} />
        <div className="h-1.5 bg-gray-200 rounded" style={{ width: '85%' }} />
      </div>
    </div>
  );
}

/**
 * Two column layout preview
 */
function TwoColumnPreview({ accentColor }) {
  const lighterColor = `${accentColor}15`; // Add transparency

  return (
    <div className="flex gap-2" style={{ minHeight: '200px' }}>
      {/* Sidebar */}
      <div
        className="w-2/5 p-2 space-y-2 rounded"
        style={{ backgroundColor: lighterColor }}
      >
        {/* Profile circle */}
        <div
          className="w-12 h-12 rounded-full mx-auto"
          style={{ backgroundColor: accentColor, opacity: 0.3 }}
        />

        {/* Contact section */}
        <div className="space-y-1 pt-2">
          <div className="h-2 rounded" style={{ backgroundColor: accentColor, width: '60%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '100%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '80%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '90%' }} />
        </div>

        {/* Skills section */}
        <div className="space-y-1 pt-2">
          <div className="h-2 rounded" style={{ backgroundColor: accentColor, width: '50%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '95%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '85%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '90%' }} />
        </div>
      </div>

      {/* Main content */}
      <div className="w-3/5 space-y-2">
        {/* Header */}
        <div className="space-y-1">
          <div className="h-3 rounded" style={{ backgroundColor: accentColor, width: '70%' }} />
          <div className="h-0.5 rounded" style={{ backgroundColor: accentColor, width: '100%' }} />
        </div>

        {/* Content blocks */}
        <div className="space-y-1.5 pt-1">
          <div className="h-2 rounded" style={{ backgroundColor: accentColor, width: '50%' }} />
          <div className="h-1.5 bg-gray-200 rounded" style={{ width: '100%' }} />
          <div className="h-1.5 bg-gray-200 rounded" style={{ width: '95%' }} />
        </div>

        <div className="space-y-1 pt-1">
          <div className="h-1.5 bg-gray-300 rounded" style={{ width: '80%' }} />
          <div className="h-1 bg-gray-200 rounded" style={{ width: '100%' }} />
          <div className="h-1 bg-gray-200 rounded" style={{ width: '90%' }} />
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="h-2 rounded" style={{ backgroundColor: accentColor, width: '45%' }} />
          <div className="h-1.5 bg-gray-200 rounded" style={{ width: '95%' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Asymmetric layout preview
 */
function AsymmetricPreview({ accentColor }) {
  return (
    <div className="flex gap-2" style={{ minHeight: '200px' }}>
      {/* Narrow sidebar */}
      <div className="w-1/3 space-y-2">
        <div
          className="w-full h-16 rounded"
          style={{ backgroundColor: accentColor, opacity: 0.2 }}
        />
        <div className="space-y-1">
          <div className="h-2 rounded" style={{ backgroundColor: accentColor, width: '70%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '100%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '85%' }} />
        </div>
        <div className="space-y-1 pt-2">
          <div className="h-2 rounded" style={{ backgroundColor: accentColor, width: '60%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '95%' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '90%' }} />
        </div>
      </div>

      {/* Main content */}
      <div className="w-2/3 space-y-2">
        <div className="space-y-1">
          <div className="h-4 rounded" style={{ backgroundColor: accentColor, width: '65%' }} />
          <div className="h-1.5 bg-gray-200 rounded" style={{ width: '100%' }} />
        </div>

        <div className="h-0.5 rounded" style={{ backgroundColor: accentColor, width: '100%' }} />

        <div className="space-y-1.5 pt-1">
          <div className="h-2.5 rounded" style={{ backgroundColor: accentColor, width: '55%' }} />
          <div className="h-1.5 bg-gray-200 rounded" style={{ width: '100%' }} />
          <div className="h-1.5 bg-gray-200 rounded" style={{ width: '95%' }} />
          <div className="h-1.5 bg-gray-200 rounded" style={{ width: '90%' }} />
        </div>

        <div className="space-y-1 pt-1">
          <div className="h-1.5 bg-gray-300 rounded" style={{ width: '85%' }} />
          <div className="h-1 bg-gray-200 rounded" style={{ width: '100%' }} />
          <div className="h-1 bg-gray-200 rounded" style={{ width: '95%' }} />
        </div>
      </div>
    </div>
  );
}
