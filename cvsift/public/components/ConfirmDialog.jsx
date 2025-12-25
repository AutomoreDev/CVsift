import React, { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { modalIn, modalOut, fadeIn } from '../utils/animations';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'success', 'info'
  icon: CustomIcon,
  confirmLoading = false
}) {
  const backdropRef = useRef(null);
  const dialogRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen && backdropRef.current && dialogRef.current) {
      // Entrance animations
      fadeIn(backdropRef.current, { duration: 0.2 });
      modalIn(dialogRef.current);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isExiting) {
      setIsExiting(true);
      if (dialogRef.current && backdropRef.current) {
        modalOut(dialogRef.current, {
          onComplete: () => {
            setIsExiting(false);
            onClose();
          },
        });
      } else {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  // Icon based on type
  const getIcon = () => {
    if (CustomIcon) return CustomIcon;

    switch (type) {
      case 'danger':
        return Trash2;
      case 'success':
        return CheckCircle;
      case 'info':
        return Info;
      case 'warning':
      default:
        return AlertTriangle;
    }
  };

  // Color scheme based on type
  const getColorClasses = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'from-red-500 to-red-600',
          iconContainer: 'bg-red-100',
          button: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30',
          border: 'border-red-200'
        };
      case 'success':
        return {
          iconBg: 'from-green-500 to-green-600',
          iconContainer: 'bg-green-100',
          button: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/30',
          border: 'border-green-200'
        };
      case 'info':
        return {
          iconBg: 'from-blue-500 to-blue-600',
          iconContainer: 'bg-blue-100',
          button: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30',
          border: 'border-blue-200'
        };
      case 'warning':
      default:
        return {
          iconBg: 'from-amber-500 to-amber-600',
          iconContainer: 'bg-amber-100',
          button: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30',
          border: 'border-amber-200'
        };
    }
  };

  const Icon = getIcon();
  const colors = getColorClasses();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div ref={dialogRef} className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className={`p-6 border-b ${colors.border} bg-gradient-to-r from-dominant-50 to-dominant-100`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${colors.iconContainer} rounded-xl flex items-center justify-center`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${colors.iconBg} rounded-lg flex items-center justify-center shadow-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-900 font-heading">{title}</h3>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
              disabled={confirmLoading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-secondary-700 text-base leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="p-6 bg-dominant-50 rounded-b-2xl flex gap-3">
          <button
            onClick={handleClose}
            disabled={confirmLoading}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmLoading}
            className={`flex-1 px-6 py-3 bg-gradient-to-r ${colors.button} text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
          >
            {confirmLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
