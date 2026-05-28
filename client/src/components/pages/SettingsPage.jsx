import React, { useState } from 'react';
import { Card, Badge } from '../UI';
import { Sparkles, Trash2, ShieldAlert, Sliders, Play, Share2, FileText, Download, Percent, Target } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import ConfirmationModal from '../ConfirmationModal';
import { AnimatePresence } from 'framer-motion';

export default function SettingsPage({ 
  subjects, 
  onDeleteAllSubjects, 
  overallPercentage, 
  totalWeightage, 
  maxPossibleWeightage,
  targetAttendance = 75,
  setTargetAttendance
}) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState('light');
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);

  const handleBackupExport = () => {
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

          {/* Target Attendance Criteria card */}
          <Card className="!p-5 space-y-4 bg-gradient-to-tr from-white to-indigo-50/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={14} className="text-indigo-500" />
              <span>🎯 Target Attendance Criteria</span>
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Attendance Threshold</span>
                  <p className="text-[10px] text-slate-400 font-medium">Standard safety percent for buffer tracking</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 font-black text-xs text-indigo-600">
                  <span>{targetAttendance}%</span>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={targetAttendance}
                  onChange={(e) => setTargetAttendance(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex gap-1.5">
                  {[75, 80, 85, 90].map(val => (
                    <button
                      key={val}
                      onClick={() => setTargetAttendance(val)}
                      className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-colors cursor-pointer ${
                        targetAttendance === val 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
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
                    onClick={() => exportToPDF(subjects, { overallPercentage, totalWeightage, maxPossibleWeightage })}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-soft-sm uppercase tracking-wider font-sans"
                  >
                    <FileText size={11} />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => exportToCSV(subjects, { overallPercentage, totalWeightage, maxPossibleWeightage })}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-soft-sm uppercase tracking-wider font-sans"
                  >
                    <Share2 size={11} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
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
