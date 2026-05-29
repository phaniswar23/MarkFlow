import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, School, Check, X, ShieldAlert } from 'lucide-react';

export default function DisclaimerModal({ isOpen, onAccept }) {
  const [isChecked, setIsChecked] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  if (!isOpen) return null;

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* High-End Glassmorphic Backdrop */}
        <div className="absolute inset-0 bg-slate-950 backdrop-blur-2xl" />

        {/* Serious Block Screen */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-md bg-slate-900 border border-rose-950/40 rounded-3xl p-8 shadow-2xl z-10 text-center space-y-6"
        >
          <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-550/20 flex items-center justify-center text-rose-500 animate-bounce">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-white tracking-tight">Access Blocked</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              You have declined the educational disclaimer. To protect academic integrity and manage expectations, access to MarkFlow Academic OS is strictly restricted until the agreement terms are accepted.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsBlocked(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
            >
              Review Disclaimer & Accept
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* High-End Glassmorphic Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
      />

      {/* Reusable Dialog Box */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/80 backdrop-blur-md rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh] text-left select-none"
      >
        {/* Header Block */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <span className="text-xl animate-pulse">🔒</span>
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight leading-none">
                Academic Agreement & Privacy Terms
              </h3>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 block">MarkFlow Student Developer project</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          
          {/* Developer Statement & Educational Independence */}
          <div className="space-y-3.5 bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-2xl">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <School size={14} className="text-indigo-400" />
              <span>🏫 Student Ownership & Independent Project</span>
            </h4>
            <div className="pl-6 space-y-2 text-xs text-slate-300 font-medium leading-relaxed">
              <p>
                <strong className="text-white">Independent Student Project:</strong> I am a university student. This platform is a purely independent, self-developed project that I designed and built because I believed it would be highly useful for fellow students to plan their study routines and targets.
              </p>
              <p>
                <strong className="text-white">No Institutional Affiliation:</strong> I am not working under, sponsored by, or affiliated with any university, college, or official academic institution. This is entirely my own personal project aimed at improving my software thinking, logical development skills, and technical capability.
              </p>
            </div>
          </div>

          {/* Section 2: Accuracy & Verification Disclaimer */}
          <div className="space-y-3.5 bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              <span>⚠️ Marks Calculation & False Hope Disclaimer</span>
            </h4>
            <div className="pl-6 space-y-2 text-xs text-slate-300 font-medium leading-relaxed">
              <p>
                <strong className="text-white">Estimation Purposes Only:</strong> MarkFlow is designed to perform semester SGPA, CGPA, and subject-wise grade estimations and academic calculations based on raw user inputs. It does NOT generate or represent your final official academic results.
              </p>
              <p>
                <strong className="text-white">Official Grades May Vary:</strong> The marks computed and estimated by this website may vary from your official university or college portal grades due to institutional moderations, curves, or weight changes. I have tried my absolute best to implement all calculation engines and formulas correctly, but discrepancies can occur.
              </p>
              <p>
                <strong className="text-rose-400 font-extrabold">Notice on Expectation:</strong> I sincerely apologize if any forecast or bunk plan gives you false hope; you must always verify your marks through your official university portal. The developers bear zero responsibility or liability for any academic decisions, grade disputes, or actions you take based on this website.
              </p>
            </div>
          </div>

          {/* Section 3: Privacy & Data Handling */}
          <div className="space-y-3.5 bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} className="text-emerald-400" />
              <span>🔒 Premium Privacy Architecture</span>
            </h4>
            <div className="pl-6 space-y-2 text-xs text-slate-300 font-medium leading-relaxed">
              <p>
                <strong className="text-white">Zero Data Harvesting:</strong> MarkFlow does not collect, harvest, sell, or share any personal details or academic records.
              </p>
              <p>
                <strong className="text-white">100% Local Storage:</strong> All subject records, credit loads, attendance slide limits, and grade point averages are saved securely on your own device inside local browser memory.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Accept Row */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/40 shrink-0 space-y-4">
          <label className="flex items-start gap-3 text-xs font-semibold text-slate-300 cursor-pointer select-none group">
            <div className="relative flex items-center shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-4.5 h-4.5 border-2 border-slate-700 bg-slate-800 rounded-md transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center">
                {isChecked && <Check size={11} className="text-white font-black stroke-[3.5]" />}
              </div>
            </div>
            <span className="group-hover:text-slate-300 transition-colors leading-relaxed">
              I understand that this is an independent student project, and accept that calculations are estimations only and must be verified officially.
            </span>
          </label>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
            <button
              onClick={() => setIsBlocked(true)}
              className="w-full sm:w-auto px-5 py-3 border border-slate-700 hover:bg-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
            >
              Decline Terms
            </button>
            <button
              onClick={() => {
                if (isChecked) {
                  localStorage.setItem('markflow_disclaimer_accepted', 'true');
                  onAccept();
                }
              }}
              disabled={!isChecked}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isChecked 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-40 shadow-none'
              }`}
            >
              <span>Unlock Academic OS ➡️</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
