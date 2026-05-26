import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { Card } from './UI';

export default function FeedbackModal({ onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('suggestion');
  const [message, setMessage] = useState('');

  // Status & Validation
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Name is required';
    
    if (!email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Enter a valid email address';
    }

    if (!message.trim()) tempErrors.message = 'Please describe your feedback';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, type, message })
      });

      if (response.ok) {
        setSuccess(true);
        // Auto close after 2.5 seconds
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        const errData = await response.json();
        setErrors({ server: errData.message || 'Failed to submit feedback.' });
      }
    } catch (err) {
      console.log('Backend server not connected. Mocking successful local fallback feedback submission.');
      
      // Local fallback success trace
      console.log('\n--- OFFLINE FEEDBACK LOG ---');
      console.log(`Name: ${name}`);
      console.log(`Email: ${email}`);
      console.log(`Type: ${type}`);
      console.log(`Message: ${message}`);
      console.log('----------------------------\n');
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    setSubmitting(false);
    }
  };

  // Prevent background scroll when modal is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Background shade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative w-full max-w-lg bg-[#f8fafc] rounded-2xl shadow-2xl z-10 overflow-hidden border border-slate-100"
      >
        {/* Form Container */}
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form-view"
              exit={{ opacity: 0, y: -10 }}
              className="p-6 md:p-8 space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-calm-indigo">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 leading-none">Share Your Feedback</h2>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Help make MarkFlow even better</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form elements */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {errors.server && (
                  <div className="p-3 text-xs bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errors.server}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Phaniswar"
                      value={name}
                      autoFocus
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-3.5 py-2 text-sm bg-white border ${errors.name ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-calm-indigo/20'} rounded-xl focus:ring-2 outline-none font-medium text-slate-800 transition-all`}
                    />
                    {errors.name && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} />
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Your Email</label>
                    <input
                      type="email"
                      placeholder="e.g. phaniswar@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3.5 py-2 text-sm bg-white border ${errors.email ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-calm-indigo/20'} rounded-xl focus:ring-2 outline-none font-medium text-slate-800 transition-all`}
                    />
                    {errors.email && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} />
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Feedback Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 focus:ring-2 focus:ring-calm-indigo/20 rounded-xl px-3 py-2 outline-none transition-all"
                  >
                    <option value="suggestion">💡 Suggestion or Feature Request</option>
                    <option value="bug_report">🐛 Bug Report / Calculator Error</option>
                    <option value="marks_issue">📊 Calculation & Marks Issue</option>
                    <option value="ui_issue">🎨 Interface / Design Improvement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Message Details</label>
                  <textarea
                    rows="4"
                    placeholder="Provide details about what you found or suggest..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm bg-white border ${errors.message ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-calm-indigo/20'} rounded-xl focus:ring-2 outline-none font-medium text-slate-800 transition-all resize-none`}
                  />
                  {errors.message && (
                    <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} />
                      {errors.message}
                    </span>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100/60 mt-5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-calm-indigo hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-glow transition-all"
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                    <Send size={12} />
                  </button>
                </div>

              </form>
            </motion.div>
          ) : (
            // Success view
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center flex flex-col items-center justify-center space-y-4"
            >
              <div className="h-16 w-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-calm-teal shadow-soft">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Success!</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Thanks for helping improve MarkFlow.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
