import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, title, message, confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900"
      />

      {/* Dialog box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl z-10 overflow-hidden border border-slate-100"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-calm-rose shrink-0">
              <AlertTriangle size={20} />
            </div>

            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-none">
                {title || 'Are you sure?'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {message || 'This action cannot be undone.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 bg-calm-rose hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-glow-rose transition-all cursor-pointer"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
