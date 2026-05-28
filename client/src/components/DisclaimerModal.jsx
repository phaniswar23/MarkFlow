import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, School, Check } from 'lucide-react';

export default function DisclaimerModal({ isOpen, onAccept }) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* High-End Glassmorphic Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
      />

      {/* Reusable Dialog Box */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 backdrop-blur-md rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh] text-left select-none"
      >
        {/* Header Block */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <span className="text-xl animate-pulse">⚡</span>
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight leading-none flex items-center gap-1.5">
              <span>Welcome to MarkFlow Academic OS</span> 🔒
            </h3>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1 block">MarkFlow Academic OS Agreement</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          
          {/* Section 1: Privacy & Data Handling */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} />
              <span>🔒 Privacy & Data Handling</span>
            </h4>
            <div className="pl-6 space-y-2 text-xs text-slate-300 font-medium leading-relaxed">
              <p>
                <strong className="text-white">Zero Data Collection:</strong> MarkFlow does not collect, store, or share any type of personal information or academic data.
              </p>
              <p>
                <strong className="text-white">100% Local Storage:</strong> All of your calculated grade averages, subject inputs, and assessment logs stay entirely within your private browser storage.
              </p>
              <p>
                <strong className="text-white">Independent Session:</strong> While the interface features a "MongoDB Synced" badge, the data handling ensures complete user-side privacy, and no details are transmitted to external entities.
              </p>
            </div>
          </div>

          {/* Section 2: Accuracy & Verification Disclaimer */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>⚠️ Accuracy & Verification Disclaimer</span>
            </h4>
            <div className="pl-6 space-y-2 text-xs text-slate-300 font-medium leading-relaxed">
              <p>
                <strong className="text-white">Estimated Results:</strong> The platform is an academic utility designed to help you estimate your Class Assessment (CA) marks and analyze your performance ahead of end-semester examinations.
              </p>
              <p>
                <strong className="text-white">Official Verification Required:</strong> While the tool attempts to keep calculations accurate, you must always verify your marks through your official university or college portal.
              </p>
              <p>
                <strong className="text-white">Final Authority:</strong> In the event of any discrepancy or mismatch between MarkFlow and your institution, official academic records are considered final.
              </p>
            </div>
          </div>

          {/* Section 3: Affiliation & Liability */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <School size={14} />
              <span>🏫 Affiliation & Liability</span>
            </h4>
            <div className="pl-6 space-y-2 text-xs text-slate-300 font-medium leading-relaxed">
              <p>
                <strong className="text-white">No Institutional Ties:</strong> This platform is independently developed solely for educational and self-analysis purposes. It is not affiliated with, endorsed by, or associated with any university, college, or academic institution.
              </p>
              <p>
                <strong className="text-white">User Responsibility:</strong> By using the application, you acknowledge that all results are estimated calculations only, and the developers bear no responsibility for any academic decisions you make based on this tool.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Accept Row */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/40 shrink-0 space-y-4">
          <label className="flex items-start gap-3 text-xs font-semibold text-slate-400 cursor-pointer select-none group">
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
              I have read, understood, and accept all the privacy terms and academic calculation conditions outlined above.
            </span>
          </label>

          <div className="flex items-center justify-end">
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
