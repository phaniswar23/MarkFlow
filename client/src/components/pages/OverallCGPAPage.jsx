import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../UI';
import { Sparkles, Plus, Trash2, TrendingUp, Compass, Target, Download, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { exportElement } from '../../utils/exportUtils';

export default function OverallCGPAPage({ currentSemesterSGPA = 0, currentSemesterCredits = 0, semesters, setSemesters }) {

  const [targetCGPA, setTargetCGPA] = useState(8.5);
  const [remainingSemesters, setRemainingSemesters] = useState(3);

  const handleRowChange = (id, field, value) => {
    const updated = semesters.map(sem => {
      if (sem.id === id) {
        return {
          ...sem,
          [field]: parseFloat(value) || 0
        };
      }
      return sem;
    });
    setSemesters(updated);
  };

  const handleAddSemester = () => {
    const newSem = {
      id: Math.random().toString(),
      name: `Semester ${semesters.length + 1}`,
      sgpa: 8.0,
      credits: 20
    };
    setSemesters([...semesters, newSem]);
  };

  const handleRemoveSemester = (id) => {
    setSemesters(semesters.filter(sem => sem.id !== id));
  };

  const handleImportCurrentSemester = () => {
    if (currentSemesterSGPA === 0) return;
    const newSem = {
      id: 'current',
      name: 'Current Semester',
      sgpa: Math.round(currentSemesterSGPA * 100) / 100,
      credits: currentSemesterCredits || 20
    };
    // Check if current already imported to prevent duplicates
    if (semesters.some(s => s.id === 'current')) {
      setSemesters(semesters.map(s => s.id === 'current' ? newSem : s));
    } else {
      setSemesters([...semesters, newSem]);
    }
  };

  // Calculations
  const totalCredits = semesters.reduce((sum, s) => sum + (s.credits || 0), 0);
  const totalCreditPoints = semesters.reduce((sum, s) => sum + ((s.sgpa || 0) * (s.credits || 0)), 0);
  
  const finalCGPA = totalCredits > 0 ? (totalCreditPoints / totalCredits) : 0;

  // Best & Lowest
  let bestSem = null;
  let worstSem = null;
  let highestGPA = -1;
  let lowestGPA = 11;

  semesters.forEach(s => {
    if (s.sgpa > highestGPA) {
      highestGPA = s.sgpa;
      bestSem = s;
    }
    if (s.sgpa < lowestGPA) {
      lowestGPA = s.sgpa;
      worstSem = s;
    }
  });

  // Required GPA prediction
  // Target points needed = targetCGPA * (totalCredits + remainingSemesters * averageCreditsPerSem)
  const averageCreditsPerSem = totalCredits > 0 ? (totalCredits / semesters.length) : 20;
  const futureCreditsTotal = remainingSemesters * averageCreditsPerSem;
  const targetTotalCredits = totalCredits + futureCreditsTotal;
  const requiredTotalPoints = targetCGPA * targetTotalCredits;
  const pointsNeeded = requiredTotalPoints - totalCreditPoints;
  const requiredGPA = futureCreditsTotal > 0 ? (pointsNeeded / futureCreditsTotal) : 0;

  const chartData = semesters.map(s => ({
    name: s.name,
    SGPA: s.sgpa,
    CGPA: Math.round((semesters.filter(item => parseInt(item.name.replace('Semester ', '')) <= parseInt(s.name.replace('Semester ', ''))).reduce((sum, item) => sum + (item.sgpa * item.credits), 0) / semesters.filter(item => parseInt(item.name.replace('Semester ', '')) <= parseInt(s.name.replace('Semester ', ''))).reduce((sum, item) => sum + item.credits, 0)) * 100) / 100
  }));

  const handleExport = (type) => {
    if (!semesters || semesters.length === 0) {
      alert("Please add at least one semester with SGPA and Credits before exporting!");
      return;
    }
    exportElement('overall-cgpa-container', type, `MarkFlow_Overall_CGPA_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div id="overall-cgpa-container" className="space-y-6 text-left select-none">
      {/* Header section */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-soft">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Overall CGPA Calculator</span>
            <Sparkles size={16} className="text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Monitor your cumulative overall grade point average across all semesters and run projections to reach your academic targets.
          </p>
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left column semester records */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-start">
          <Card className="!p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="space-y-0.5 text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semester Board Records</h3>
                <p className="text-[10px] text-slate-400 font-medium max-w-[280px] sm:max-w-md leading-normal">
                  Export as PDF to download a comprehensive report, or PNG to save a shareable image card.
                </p>
              </div>
              
              <div className="flex gap-2 items-center flex-wrap">
                {currentSemesterSGPA > 0 && (
                  <button
                    onClick={handleImportCurrentSemester}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Import Current ({currentSemesterSGPA.toFixed(2)})</span>
                  </button>
                )}
                <button
                  onClick={handleAddSemester}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>Add Semester</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Download a comprehensive, high-fidelity PDF report of all logged semesters"
                >
                  <Download size={12} />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => handleExport('png')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Save your cumulative CGPA trajectory and semester board as a shareable PNG image card"
                >
                  <Image size={12} />
                  <span>Export PNG</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              <AnimatePresence initial={false}>
                {semesters.map(sem => (
                  <motion.div
                    key={sem.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl"
                  >
                    <span className="text-xs font-extrabold text-slate-700 w-1/3 truncate">{sem.name}</span>
                    
                    <div className="flex items-center gap-3 justify-end flex-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">SGPA:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={sem.sgpa}
                          onChange={(e) => handleRowChange(sem.id, 'sgpa', e.target.value)}
                          className="w-14 text-center p-1 text-xs bg-white border border-slate-200 rounded font-bold text-slate-700 outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Credits:</label>
                        <input
                          type="number"
                          min="1"
                          value={sem.credits}
                          onChange={(e) => handleRowChange(sem.id, 'credits', e.target.value)}
                          className="w-14 text-center p-1 text-xs bg-white border border-slate-200 rounded font-bold text-slate-700 outline-none"
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveSemester(sem.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>

          <Card className="!p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-indigo-500" />
              <span>Cumulative CGPA Progress Trajectory</span>
            </h3>
            {semesters.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                Log semesters to view progress graph.
              </div>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="SGPA" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="CGPA" stroke="#6366f1" strokeWidth={3.5} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Right column details & Projections (Lg: 5/12) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
          <Card className="flex flex-col justify-between items-center text-center p-6 bg-gradient-to-b from-white to-slate-50/20">
            <div className="space-y-3.5 w-full flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Cumulative CGPA</span>
              
              <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-4 border-emerald-50 shadow-soft-sm bg-white select-none">
                <div className="text-center">
                  <span className="text-3xl font-black text-emerald-600 tracking-tight">{finalCGPA.toFixed(2)}</span>
                  <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider mt-0.5">CGPA</span>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-slate-100/60 grid grid-cols-2 gap-4 text-left">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Best Semester</span>
                  <span className="text-xs font-bold text-slate-800 block truncate mt-0.5">{bestSem ? `${bestSem.name} (${bestSem.sgpa})` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Completed Credits</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{totalCredits} Credits</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="!p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={14} className="text-indigo-500" />
              <span>Future CGPA Target Calculator</span>
            </h3>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-500">Target CGPA Goal</label>
                  <span className="text-xs font-black text-indigo-600">{targetCGPA.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="0.05"
                  value={targetCGPA}
                  onChange={(e) => setTargetCGPA(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-500">Remaining Semesters</label>
                  <span className="text-xs font-black text-slate-700">{remainingSemesters} Semesters</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={remainingSemesters}
                  onChange={(e) => setRemainingSemesters(parseInt(e.target.value) || 1)}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100/60 flex items-start gap-2.5 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/40">
                <Compass size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Required GPA Forecast</span>
                  <div className="mt-1">
                    {requiredGPA > 10 ? (
                      <span className="text-xs font-extrabold text-rose-500">Mathematical impossibility! Requires &gt;10.00 GPA. Increase remaining semesters or lower target goal.</span>
                    ) : requiredGPA < 0 ? (
                      <span className="text-xs font-bold text-slate-500">Already surpassed! Target met.</span>
                    ) : (
                      <span className="text-xs font-extrabold text-slate-700">
                        You need to maintain an average of <strong className="text-indigo-600">{requiredGPA.toFixed(2)}</strong> across the remaining {remainingSemesters} semesters.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
