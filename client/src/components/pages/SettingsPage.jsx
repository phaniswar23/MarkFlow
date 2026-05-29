import React, { useState } from 'react';
import { Card, Badge } from '../UI';
import { Sparkles, Trash2, ShieldAlert, Sliders, Play, Share2, FileText, Download, Percent, Target, Clock, HelpCircle, RefreshCw } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import ConfirmationModal from '../ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage({ 
  subjects, 
  onDeleteAllSubjects, 
  overallPercentage, 
  totalWeightage, 
  maxPossibleWeightage,
  targetAttendance = 75,
  setTargetAttendance,
  themeMode,
  setThemeMode,
  animationsEnabled,
  setAnimationsEnabled,
  brandColor,
  setBrandColor,
  addToast
}) {
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!exceptionReason.trim()) {
      addToast("Please select or enter a valid academic reason.", "error");
      return;
    }
    setIsSubmittingRequest(true);
    setTimeout(() => {
      setIsSubmittingRequest(false);
      setIsRequestPending(true);
      addToast("Exception request registered! Reviewing request soon.", "success");
    }, 2000);
  };

  const handleBackupExport = () => {
    if (!subjects || subjects.length === 0) {
      addToast("No academic data logged yet! Add some subjects before downloading a backup JSON.", "error");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(subjects));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "markflow_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header card */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-soft">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>System Settings</span>
            <Sparkles size={16} className="text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Customize animation parameters, download secure backups, export grades, or wipe data board records safely.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Config Cards (Lg: 8/12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* UI Customize */}
          <Card className="!p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-500" />
              <span>Interface Customize</span>
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Theme Scheme</span>
                  <p className="text-[10px] text-slate-400 font-medium">Switch dashboard styling appearance</p>
                </div>
                <div className="flex bg-slate-100 rounded-xl p-0.5 select-none">
                  {['light', 'dark', 'system'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setThemeMode(mode)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${themeMode === mode ? 'bg-white text-indigo-600 shadow-soft font-extrabold' : 'text-slate-500'}`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Smooth Transitions</span>
                  <p className="text-[10px] text-slate-400 font-medium">Toggle micro-animations and slide panels</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={animationsEnabled}
                    onChange={(e) => setAnimationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-calm-indigo"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* Color Accent Theme Selector */}
          <Card className="!p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-500" />
              <span>Color Accent Theme</span>
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Accent Palette</span>
                <p className="text-[10px] text-slate-400 font-medium">Select a dynamic brand focus accent for buttons, badges, and charts</p>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {[
                  { id: 'indigo', name: 'Indigo', color: 'bg-[#4f46e5]' },
                  { id: 'emerald', name: 'Emerald', color: 'bg-[#10b981]' },
                  { id: 'red', name: 'Red', color: 'bg-[#dc2626]' },
                  { id: 'violet', name: 'Violet', color: 'bg-[#7c3aed]' },
                  { id: 'blue', name: 'Blue', color: 'bg-[#2563eb]' },
                  { id: 'teal', name: 'Teal', color: 'bg-[#0d9488]' },
                  { id: 'orange', name: 'Orange', color: 'bg-[#ea580c]' },
                  { id: 'pink', name: 'Pink', color: 'bg-[#db2777]' },
                  { id: 'amber', name: 'Amber', color: 'bg-[#d97706]' },
                  { id: 'purple', name: 'Purple', color: 'bg-[#9333ea]' },
                  { id: 'rose', name: 'Rose', color: 'bg-[#e11d48]' },
                  { id: 'cyan', name: 'Cyan', color: 'bg-[#0891b2]' }
                ].map(item => {
                  const isActive = brandColor === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setBrandColor(item.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 outline-none ${
                        isActive 
                          ? 'border-indigo-500 bg-indigo-50/20 shadow-soft-sm font-black' 
                          : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className={`h-5 w-5 rounded-full shrink-0 shadow-inner ${item.color} ${isActive ? 'ring-2 ring-indigo-500/30 scale-110' : ''}`} />
                      <span className="text-[9px] uppercase tracking-wider font-bold">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Backup & Exports */}
          <Card className="!p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Download size={14} className="text-indigo-500" />
              <span>Backup, Import & Reports Export</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Marks Backup</span>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Download private raw JSON backup records</p>
                </div>
                <button
                  onClick={handleBackupExport}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-soft-sm"
                >
                  <Download size={12} />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Grading Reports</span>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Export academic stats to PDF or CSV</p>
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      if (!subjects || subjects.length === 0) {
                        addToast("No academic data logged yet! Add some subjects before exporting a PDF report.", "error");
                        return;
                      }
                      exportToPDF(subjects, { overallPercentage, totalWeightage, maxPossibleWeightage });
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-soft-sm uppercase tracking-wider font-sans"
                  >
                    <FileText size={11} />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!subjects || subjects.length === 0) {
                        addToast("No academic data logged yet! Add some subjects before exporting a CSV sheet.", "error");
                        return;
                      }
                      exportToCSV(subjects, { overallPercentage, totalWeightage, maxPossibleWeightage });
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-soft-sm uppercase tracking-wider font-sans"
                  >
                    <Share2 size={11} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Disclaimer Configuration Card */}
          <Card className="!p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-500" />
              <span>Disclaimer Configuration</span>
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Don't Show Disclaimer</span>
                  <p className="text-[10px] text-slate-400 font-medium">Request a temporary 24-hour exception to bypass disclaimer popups</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showExceptionForm}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setExceptionReason('');
                        setIsRequestPending(false);
                      }
                      setShowExceptionForm(e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-calm-indigo"></div>
                </label>
              </div>

              {/* Exception submission form */}
              <AnimatePresence>
                {showExceptionForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-100 pt-4 space-y-4 text-left overflow-hidden"
                  >
                    {isRequestPending ? (
                      <div className="p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                          <RefreshCw size={15} className="animate-spin text-amber-700 dark:text-amber-400" />
                          <span className="text-xs font-black uppercase tracking-wider">REQUEST UNDER REVIEW</span>
                        </div>
                        <p className="text-xs text-amber-950 dark:text-amber-100 font-black leading-normal">
                          Please wait. Reviewing request soon... (Pending administrative validation)
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleRequestSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                            Enter valid academic reason
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. I need to make a live presentation..."
                            value={exceptionReason}
                            onChange={(e) => setExceptionReason(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:border-indigo-400 transition-all text-slate-700 placeholder-slate-400"
                          />
                        </div>

                        {/* Suggestions container */}
                        <div className="space-y-2">
                          <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Suggested Options (Click to Autofill):
                          </span>
                          <div className="space-y-1.5 grid grid-cols-1 gap-1.5">
                            {[
                              "I am doing a live academic presentation in class and need a clean popup-free experience.",
                              "I have thoroughly reviewed all calculating equations and accept the academic estimation policy.",
                              "I am running rapid sandboxed developer tests and need to bypass repetitive disclaimer alerts.",
                              "I want to focus solely on quick predictive schedule modeling without initial disclaimer confirmations.",
                              "I am in a private tutoring session and want to show students a clean dashboard instantly.",
                              "I am doing a screen recording demonstration of MarkFlow for my university peers."
                            ].map((suggestion, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setExceptionReason(suggestion)}
                                className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-xl text-[10px] text-slate-700 font-bold transition-all hover:scale-[1.01]"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingRequest || !exceptionReason.trim()}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                        >
                          {isSubmittingRequest ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>Submitting Exception...</span>
                            </>
                          ) : (
                            <span>Submit Exception Request</span>
                          )}
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>

        {/* Right Column Danger Zone (Lg: 4/12) */}
        <div className="lg:col-span-4">
          <Card className="!p-5 border-rose-100 bg-rose-50/5 shadow-soft space-y-4">
            <h3 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-500" />
              <span>System Danger Zone</span>
            </h3>
            
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Permanent destructive settings. Before wiping, consider downloading a JSON backup or exporting your grades to PDF report first.
            </p>

            <button
              onClick={() => setShowConfirmWipe(true)}
              disabled={subjects.length === 0}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                subjects.length === 0 
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-soft-sm'
              }`}
            >
              <Trash2 size={12} />
              <span>Wipe Board completely</span>
            </button>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog Overlay */}
      <AnimatePresence>
        {showConfirmWipe && (
          <ConfirmationModal
            isOpen={showConfirmWipe}
            variant="danger"
            title="Wipe Board completely"
            message="Are you sure you want to clear your entire semester board? This action is permanent and cannot be undone."
            confirmText="Wipe Everything"
            cancelText="Cancel"
            onConfirm={onDeleteAllSubjects}
            onClose={() => setShowConfirmWipe(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
