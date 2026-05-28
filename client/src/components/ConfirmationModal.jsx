import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, Flame, ShieldAlert, X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, variant = 'danger', title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onClose }) {
  
  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Variant Visual Theme Map
  const getThemeMap = () => {
    const maps = {
      info: {
        bg: 'bg-indigo-50/80 border-indigo-100',
        text: 'text-indigo-600',
        glow: 'hover:shadow-indigo-500/10 hover:border-indigo-300',
        btn: 'bg-indigo-600 hover:bg-indigo-500 text-white',
        icon: <Info size={20} />
      },
      success: {
        bg: 'bg-emerald-50/80 border-emerald-100',
        text: 'text-emerald-600',
        glow: 'hover:shadow-emerald-500/10 hover:border-emerald-300',
        btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        icon: <CheckCircle size={20} />
      },
      warning: {
        bg: 'bg-amber-50/80 border-amber-100',
        text: 'text-amber-600',
        glow: 'hover:shadow-amber-500/10 hover:border-amber-300',
        btn: 'bg-amber-500 hover:bg-amber-600 text-white',
        icon: <AlertTriangle size={20} />
      },
      danger: {
        bg: 'bg-rose-50/80 border-rose-100',
        text: 'text-rose-600',
        glow: 'hover:shadow-rose-500/15 hover:border-rose-300 shadow-soft-glow-rose',
        btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20',
        icon: <ShieldAlert size={20} />
      },
      confirm: {
        bg: 'bg-indigo-50/80 border-indigo-100',
        text: 'text-indigo-600',
        glow: 'hover:shadow-indigo-500/15 hover:border-indigo-300 shadow-soft-glow',
        btn: 'bg-gradient-to-tr from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20',
        icon: <Flame size={20} />
      }
    };
    return maps[variant] || maps.danger;
  };

  const theme = getThemeMap();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Premium Glassmorphic Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[3px]"
      />

      {/* Reusable dialog box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-white/95 border border-white/20 backdrop-blur-md rounded-3xl shadow-2xl z-10 overflow-hidden"
      >
        <div className="p-6 md:p-8 space-y-6">
          {/* Main layout row */}
          <div className="flex items-start gap-4">
            {/* Pulsing Animated Icon Container */}
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-soft-sm ${theme.bg} ${theme.text}`}
            >
              {theme.icon}
            </motion.div>

            <div className="space-y-1.5 flex-1 text-left">
              <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none">
                {title || 'Confirmation Required'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {message || 'Please review this computation carefully before committing.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Action buttons with custom glow effects */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100/60">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.btn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
