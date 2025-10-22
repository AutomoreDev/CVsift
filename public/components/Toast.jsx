import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(7);
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    info: (message, duration) => addToast(message, 'info', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const getConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: CheckCircle2,
          bgGradient: 'from-green-50 to-green-100',
          iconBg: 'from-green-500 to-green-600',
          border: 'border-green-200',
          textColor: 'text-green-900'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgGradient: 'from-red-50 to-red-100',
          iconBg: 'from-red-500 to-red-600',
          border: 'border-red-200',
          textColor: 'text-red-900'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgGradient: 'from-orange-50 to-orange-100',
          iconBg: 'from-orange-500 to-orange-600',
          border: 'border-orange-200',
          textColor: 'text-orange-900'
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgGradient: 'from-blue-50 to-blue-100',
          iconBg: 'from-blue-500 to-blue-600',
          border: 'border-blue-200',
          textColor: 'text-blue-900'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={`bg-gradient-to-r ${config.bgGradient} border ${config.border} rounded-2xl shadow-2xl p-4 flex items-start gap-3 min-w-[320px] max-w-md animate-slideInRight`}>
      <div className={`w-10 h-10 bg-gradient-to-br ${config.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <Icon className="text-white" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${config.textColor} font-semibold text-sm leading-relaxed`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg p-1.5 transition-all flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default ToastProvider;
