import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from './Toast';
import {
  Activity,
  FileText,
  Trash2,
  Edit3,
  Eye,
  Briefcase,
  Plus,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
  Filter,
  X
} from 'lucide-react';

export default function ActivityLog() {
  const { currentUser } = useAuth();
  const userData = currentUser?.userData;
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (userData) {
      loadActivityLogs();
    }
  }, [userData]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const functions = getFunctions();
      const getActivityLogs = httpsCallable(functions, 'getActivityLogs');

      const result = await getActivityLogs();

      if (result.data.success) {
        setLogs(result.data.logs || []);
      }
    } catch (error) {
      console.error('Error loading activity logs:', error);

      if (error.code === 'permission-denied') {
        toast.error('Activity logs are only available for Professional, Business, and Enterprise plans');
      } else {
        toast.error('Failed to load activity logs');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get icon for action type
  const getActionIcon = (action) => {
    switch (action) {
      case 'cv_uploaded':
        return <Plus className="text-green-600" size={18} />;
      case 'cv_deleted':
        return <Trash2 className="text-red-600" size={18} />;
      case 'cv_updated':
        return <Edit3 className="text-blue-600" size={18} />;
      case 'cv_viewed':
        return <Eye className="text-gray-600" size={18} />;
      case 'jobspec_created':
        return <Plus className="text-green-600" size={18} />;
      case 'jobspec_updated':
        return <Edit3 className="text-blue-600" size={18} />;
      case 'jobspec_deleted':
        return <Trash2 className="text-red-600" size={18} />;
      default:
        return <Activity className="text-gray-600" size={18} />;
    }
  };

  // Get color scheme for action type
  const getActionColors = (action) => {
    if (action.includes('deleted')) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900'
      };
    } else if (action.includes('uploaded') || action.includes('created')) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900'
      };
    } else if (action.includes('updated')) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900'
      };
    } else {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-secondary-900'
      };
    }
  };

  // Format action text
  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (filterResource !== 'all' && log.resourceType !== filterResource) return false;
    return true;
  });

  // Get unique actions and resources for filters
  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueResources = [...new Set(logs.map(log => log.resourceType))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading activity logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 font-heading">Activity Log</h2>
            <p className="text-sm text-gray-600">Track all team member actions and changes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              showFilters
                ? 'bg-accent-100 text-accent-700 border-2 border-accent-300'
                : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>

          <button
            onClick={loadActivityLogs}
            className="px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl font-semibold hover:from-accent-600 hover:to-accent-700 transition-all flex items-center gap-2 shadow-lg shadow-accent-500/30"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gradient-to-br from-gray-50 to-accent-50 border-2 border-accent-200 rounded-xl p-5 animate-slideUp">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-secondary-900 flex items-center gap-2 font-heading">
              <Filter size={18} />
              Filter Activity
            </h3>
            <button
              onClick={() => {
                setFilterAction('all');
                setFilterResource('all');
              }}
              className="text-sm text-accent-600 hover:text-accent-700 font-semibold flex items-center gap-1"
            >
              <X size={16} />
              Clear filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Action Type</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {formatAction(action)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Resource Type</label>
              <select
                value={filterResource}
                onChange={(e) => setFilterResource(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all"
              >
                <option value="all">All Resources</option>
                {uniqueResources.map(resource => (
                  <option key={resource} value={resource}>
                    {resource.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(filterAction !== 'all' || filterResource !== 'all') && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <span className="font-semibold">Active filters:</span>
              {filterAction !== 'all' && (
                <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full font-medium">
                  {formatAction(filterAction)}
                </span>
              )}
              {filterResource !== 'all' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                  {filterResource.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-secondary-900">{logs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">CV Actions</p>
              <p className="text-2xl font-bold text-secondary-900">
                {logs.filter(log => log.resourceType === 'cv').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Briefcase className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Job Spec Actions</p>
              <p className="text-2xl font-bold text-secondary-900">
                {logs.filter(log => log.resourceType === 'jobspec').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-600 text-lg font-semibold">No activity logs found</p>
              <p className="text-gray-500 text-sm">
                {logs.length === 0
                  ? "Team member actions will appear here once they start using the system"
                  : "Try adjusting your filters to see more results"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log, index) => {
              const colors = getActionColors(log.action);

              return (
                <div
                  key={log.id || index}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 ${colors.bg} border-2 ${colors.border} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {getActionIcon(log.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-secondary-900">
                            {formatAction(log.action)}
                          </p>
                          {log.resourceName && (
                            <p className="text-sm text-gray-700 mt-1">
                              <span className="font-medium">{log.resourceName}</span>
                            </p>
                          )}
                          {log.metadata?.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {log.metadata.description}
                            </p>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={14} />
                            <span>{formatTimestamp(log.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* User info */}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User size={14} />
                          <span className="font-medium">{log.userName}</span>
                        </div>

                        {log.isTeamMemberAction && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                            Team Member
                          </span>
                        )}

                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                          {log.role}
                        </span>

                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {log.resourceType?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filteredLogs.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Showing {filteredLogs.length} of {logs.length} total activities
        </p>
      )}
    </div>
  );
}
