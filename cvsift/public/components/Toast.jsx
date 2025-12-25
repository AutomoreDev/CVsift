import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { toastIn, toastOut } from '../utils/animations';

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
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 w-auto pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const toastRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    if (toastRef.current) {
      toastIn(toastRef.current, {
        onComplete: () => {
          // Ensure opacity is set to 1 after animation completes
          if (toastRef.current) {
            toastRef.current.style.opacity = '1';
          }
        }
      });
    }
  }, []);

  const handleClose = () => {
    if (toastRef.current && !isExiting) {
      setIsExiting(true);
      toastOut(toastRef.current, {
        onComplete: () => {
          onClose();
        },
      });
    }
  };

  const getConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-white',
          iconBg: 'from-green-500 to-green-600',
          border: 'border-l-4 border-green-500 border-r border-t border-b border-gray-200',
          textColor: 'text-gray-900'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-white',
          iconBg: 'from-red-500 to-red-600',
          border: 'border-l-4 border-red-500 border-r border-t border-b border-gray-200',
          textColor: 'text-gray-900'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-white',
          iconBg: 'from-amber-500 to-amber-600',
          border: 'border-l-4 border-amber-500 border-r border-t border-b border-gray-200',
          textColor: 'text-gray-900'
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-white',
          iconBg: 'from-accent-500 to-accent-600',
          border: 'border-l-4 border-accent-500 border-r border-t border-b border-gray-200',
          textColor: 'text-gray-900'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div
      ref={toastRef}
      className={`${config.bgColor} ${config.border} rounded-xl shadow-2xl p-4 flex items-start gap-3 w-[420px] opacity-100`}
      style={{ opacity: '1' }}
    >
      <div className={`w-10 h-10 bg-gradient-to-br ${config.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <Icon className="text-white" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${config.textColor} font-semibold text-sm leading-relaxed break-words`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={handleClose}
        className="text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg p-1.5 transition-all flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default ToastProvider;
