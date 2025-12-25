import React from 'react';
import versionData from '../../version.json';

/**
 * VersionBadge Component
 * Displays the current system version in the UI
 * Automatically syncs with version.json
 */
export default function VersionBadge({ className = '', position = 'bottom-right' }) {
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'inline': 'inline-block'
  };

  return (
    <div
      className={`${positionClasses[position]} ${className}`}
      title={`CV-Sift ${versionData.releaseName} - Released ${versionData.releaseDate}`}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <span className="text-xs font-medium text-gray-500">
          v{versionData.version}
        </span>
      </div>
    </div>
  );
}

/**
 * Detailed Version Info Component (for About/Settings page)
 */
export function VersionInfo() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        System Version
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Version:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {versionData.version}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Release Name:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {versionData.releaseName}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Release Date:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {versionData.releaseDate}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Features in this Release:
        </h4>
        <ul className="space-y-1">
          {versionData.features.slice(0, 5).map((feature, index) => (
            <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
              <span className="mr-2">•</span>
              <span>{feature}</span>
            </li>
          ))}
          {versionData.features.length > 5 && (
            <li className="text-xs text-gray-500 dark:text-gray-500 italic">
              + {versionData.features.length - 5} more features
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
