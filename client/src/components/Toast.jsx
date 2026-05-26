import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Modern individual Toast Notification component with clean styles and icons
 */
export const Toast = ({ id, message, type = 'error', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 3200);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const styles = {
    error: {
      bg: 'bg-white border-rose-100 shadow-soft-glow-rose',
      icon: <AlertCircle className="text-calm-rose" size={16} />,
      label: 'Error'
    },
    success: {
      bg: 'bg-white border-teal-100 shadow-soft-glow-teal',
      icon: <CheckCircle2 className="text-calm-teal" size={16} />,
      label: 'Success'
    }
  };

  const current = styles[type] || styles.error;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 260 }}
      className={`flex items-center justify-between p-4 rounded-xl border ${current.bg} min-w-[280px] sm:max-w-sm pointer-events-auto`}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">{current.icon}</div>
        <div className="text-xs font-semibold text-slate-700 font-sans tracking-wide">
          {message}
        </div>
      </div>
      
      <button
        onClick={() => onClose(id)}
        className="ml-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
};

/**
 * Toast Container overlay rendering multi-notifications
 */
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none select-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};
