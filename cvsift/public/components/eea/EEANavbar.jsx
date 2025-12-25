/**
 * EEANavbar Component
 * Consistent navigation bar for all EEA pages
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Users, Calculator, Building2, ArrowLeft } from 'lucide-react';

export default function EEANavbar({ showBackToDashboard = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/eea', label: 'Dashboard', icon: Home },
    { path: '/eea/employees', label: 'Employees', icon: Users },
    { path: '/eea/calculator', label: 'Hiring Calculator', icon: Calculator },
    { path: '/eea/reports', label: 'Reports', icon: FileText },
    { path: '/eea/settings', label: 'Settings', icon: Building2 },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Navigation items */}
          <div className="flex items-center gap-1">
            {showBackToDashboard && (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all mr-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Main Dashboard</span>
              </button>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right side - EEA Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-semibold">EEA Compliance</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
