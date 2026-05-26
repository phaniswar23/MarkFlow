import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ArrowLeft, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Card, CircularProgress, Badge, ProportionalMathView } from './UI';
import { calculateSubjectMarks, validateMarks, safeNumber } from '../utils/calcEngine';

export default function SubjectDetailsPanel({ subject, onClose, onSave, onDelete }) {
  // Local state initialized from active subject
  const [name, setName] = useState(subject.name || '');
  const [code, setCode] = useState(subject.code || '');
  const [weightage, setWeightage] = useState(subject.weightage || 30);
  const initialLogic = subject.selectionLogic || 'all';
  const isPreset = ['all', 'best_2_3', 'best_3_4', 'best_2_4'].includes(initialLogic);

  const [logicMode, setLogicMode] = useState(isPreset ? initialLogic : 'custom');
  const [customBestOfX, setCustomBestOfX] = useState(() => {
    if (!isPreset && initialLogic.startsWith('best_')) {
      const parts = initialLogic.split('_');
      return parseInt(parts[1]) || 2;
    }
    return 2;
  });
  const [customBestOfY, setCustomBestOfY] = useState(() => {
    if (!isPreset && initialLogic.startsWith('best_')) {
      const parts = initialLogic.split('_');
      return parseInt(parts[2]) || 3;
    }
    return 3;
  });

  const [assessments, setAssessments] = useState(subject.assessments || [
    { name: 'CA1', obtainedMarks: 0, totalMarks: 30 },
    { name: 'CA2', obtainedMarks: 0, totalMarks: 30 }
  ]);

  const selectionLogic = logicMode === 'custom'
    ? `best_${customBestOfX}_${customBestOfY}`
    : logicMode;

  // Validation errors
  const [errors, setErrors] = useState({});
  const inputRefs = useRef([]);

  // Adjust custom rules if assessments count changes
  useEffect(() => {
    const totalCount = assessments.length;
    if (customBestOfY > totalCount) {
      setCustomBestOfY(totalCount);
    }
    if (customBestOfX > totalCount) {
      setCustomBestOfX(Math.min(customBestOfX, totalCount));
    }
  }, [assessments]);

  // Sync state changes with parent on every change
  useEffect(() => {
    const updatedSubject = {
      ...subject,
      name,
      code,
      weightage: parseFloat(weightage) || 0,
      selectionLogic,
      assessments: assessments.map(a => ({
        ...a,
        obtainedMarks: a.obtainedMarks === '' ? '' : parseFloat(a.obtainedMarks) || 0,
        totalMarks: parseFloat(a.totalMarks) || 30
      }))
    };
    onSave(updatedSubject);
  }, [name, code, weightage, selectionLogic, assessments]);

  // Calculation Results
  const results = calculateSubjectMarks({
    weightage,
    selectionLogic,
    assessments
  });

  // Prepare chart data for Trend Graph
  const chartData = assessments.map((ass, i) => {
    const obt = safeNumber(ass.obtainedMarks);
    const tot = safeNumber(ass.totalMarks) || 30;
    const percentage = tot > 0 ? (obt / tot) * 100 : 0;
    
    return {
      name: ass.name || `CA${i + 1}`,
      percentage: Math.round(percentage * 10) / 10,
      score: `${obt}/${tot}`
    };
  });

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 border border-slate-100 rounded-xl shadow-lg text-left select-none">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1.5">{data.name}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-extrabold text-slate-800">{data.percentage}%</span>
            <span className="text-[10px] font-semibold text-slate-400">({data.score})</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Performance soft colors & glows
  let glowStyle = 'brand';
  let progressColor = 'text-calm-indigo';
  let bannerColor = 'bg-indigo-50 border-indigo-100 text-indigo-800';

  if (results.percentage >= 75) {
    glowStyle = 'teal';
    progressColor = 'text-calm-teal';
    bannerColor = 'bg-teal-50/50 border-teal-100 text-teal-800';
  } else if (results.percentage < 40) {
    glowStyle = 'rose';
    progressColor = 'text-calm-rose';
    bannerColor = 'bg-rose-50/50 border-rose-100 text-rose-800';
  }

  // Handle adding assessment
  const handleAddAssessment = () => {
    const nextNum = assessments.length + 1;
    const newAss = {
      name: `CA${nextNum}`,
      obtainedMarks: 0,
      totalMarks: 30
    };
    setAssessments([...assessments, newAss]);
  };

  // Handle removing assessment (keep min 2)
  const handleRemoveAssessment = (index) => {
    if (assessments.length <= 2) return;
    const updated = assessments.filter((_, i) => i !== index);
    setAssessments(updated);
    
    // Clear validation error if any
    const newErrors = { ...errors };
    delete newErrors[`obt-${index}`];
    delete newErrors[`tot-${index}`];
    setErrors(newErrors);
  };

  // Handle marks editing with instant validation
  const handleAssessmentChange = (index, field, value) => {
    const updated = [...assessments];
    const cleanValue = typeof value === 'string' ? value.replace(/^0+(?=\d)/, '') : value;
    
    if (cleanValue === '') {
      updated[index][field] = '';
    } else {
      updated[index][field] = cleanValue;
    }
    
    setAssessments(updated);

    // Validate instant
    const item = updated[index];
    const validation = validateMarks(item.obtainedMarks, item.totalMarks);
    
    const newErrors = { ...errors };
    if (!validation.valid && item.obtainedMarks !== '') {
      newErrors[`${field}-${index}`] = validation.error;
    } else {
      delete newErrors[`obt-${index}`];
      delete newErrors[`tot-${index}`];
    }
    setErrors(newErrors);
  };

  // Enter triggers auto-focus next input
  const handleKeyDown = (e, index, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Find next numerical assessment input
      const nextIdx = index + 1;
      const refIdx = field === 'obt' ? index * 2 + 1 : (index + 1) * 2;
      const nextInput = document.getElementById(`input-${field === 'obt' ? 'tot' : 'obt'}-${field === 'obt' ? index : nextIdx}`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  // Help explanations for logic selection
  const logicExplanations = {
    all: 'All continuous assessments are mandatory and averaged together.',
    best_2_3: 'Takes the top 2 highest scoring continuous assessments out of 3.',
    best_3_4: 'Takes the top 3 highest scoring continuous assessments out of 4.',
    best_2_4: 'Takes the top 2 highest scoring continuous assessments out of 4.',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-none">
      {/* Dark overlay with graceful fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900"
      />

      {/* Main Slide-in Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-2xl bg-[#f8fafc] h-full shadow-2xl flex flex-col z-10 overflow-hidden border-l border-slate-100"
      >
        {/* Panel Header */}
        <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>All Subjects</span>
          </button>
          
          <button
            onClick={() => {
              onDelete(subject.id || subject._id);
            }}
            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
          >
            Delete Subject
          </button>
        </div>

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          
          {/* Card 1: Subject Meta details */}
          <Card className="!p-5 animate-none">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Subject Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-calm-indigo/20 focus:border-calm-indigo outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. MAT201"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-calm-indigo/20 focus:border-calm-indigo outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Weightage (Marks Value)</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={weightage}
                  min="0"
                  max="100"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                      setWeightage(val);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-calm-indigo/20 focus:border-calm-indigo outline-none transition-all font-medium text-slate-800"
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Live Results Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card glowType={glowStyle} className="flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
              <CircularProgress percentage={results.percentage} color={progressColor} />
              
              <div className="mt-4 flex flex-col items-center">
                <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Weighted Score</span>
                <div className="text-2xl font-extrabold text-slate-800 mt-1 flex items-baseline gap-1">
                  <span>{results.weightedMarks.toFixed(2)}</span>
                  <span className="text-xs font-semibold text-slate-400">/ {weightage}</span>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Metrics Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-xs text-slate-500 font-medium">Selected Logic:</span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{results.selectionLabel}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-xs text-slate-500 font-medium">CA Average:</span>
                    <span className="text-xs font-semibold text-slate-700">{results.averageMarks.toFixed(2)} / {results.averageTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Obtained Percentage:</span>
                    <span className={`text-xs font-bold ${progressColor}`}>{results.percentage.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Progress bar smooth */}
              <div className="mt-4">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${progressColor === 'text-calm-teal' ? 'bg-calm-teal' : progressColor === 'text-calm-rose' ? 'bg-calm-rose' : 'bg-calm-indigo'}`}
                    animate={{ width: `${results.percentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Formula View Banner */}
          <div className="w-full">
            <ProportionalMathView formulaProps={results.formulaProps} bannerColor={bannerColor} />
          </div>

          {/* Performance Trend Graph AreaChart Card */}
          <Card className="!p-5 select-none overflow-hidden border border-slate-100/80 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Performance Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Continuous Assessment (CA) percentage trajectory</p>
              </div>
              
              {/* Rising / Falling Trend indicator badge */}
              {assessments.length >= 2 && (() => {
                const first = safeNumber(assessments[0].obtainedMarks) / (safeNumber(assessments[0].totalMarks) || 30);
                const last = safeNumber(assessments[assessments.length - 1].obtainedMarks) / (safeNumber(assessments[assessments.length - 1].totalMarks) || 30);
                const diff = (last - first) * 100;
                
                if (diff > 0) {
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      Rising Trend (+{Math.round(diff)}%)
                    </span>
                  );
                } else if (diff < 0) {
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      Falling Trend ({Math.round(diff)}%)
                    </span>
                  );
                } else {
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      Stable Trend
                    </span>
                  );
                }
              })()}
            </div>

            <div className="h-36 w-full mt-2" style={{ minHeight: '144px' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5a67d8" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#5a67d8" stopOpacity={0.00}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#5a67d8" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorTrend)" 
                    activeDot={{ r: 5, stroke: '#5a67d8', strokeWidth: 2, fill: '#ffffff' }}
                  >
                    <LabelList 
                      dataKey="percentage" 
                      position="top" 
                      offset={10} 
                      style={{ fill: '#4f46e5', fontSize: 10, fontWeight: 800, fontFamily: 'monospace' }}
                      formatter={(val) => `${val}%`}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Card 3: Continuous Assessment dynamic inputs */}
          <Card className="!p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Continuous Assessment (CA) Input</h3>
                <p className="text-xs text-slate-400 mt-0.5">Enter obtained scores against test totals</p>
              </div>

              <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2 shrink-0">
                <select
                  value={logicMode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLogicMode(val);
                    if (val === 'custom') {
                      setCustomBestOfX(Math.min(2, assessments.length));
                      setCustomBestOfY(Math.min(3, assessments.length));
                    }
                  }}
                  className="w-full sm:w-48 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-1.5 outline-none transition-all cursor-pointer"
                >
                  <option value="all">All CA Mandatory (default)</option>
                  <option value="best_2_3">Best 2 of 3 CAs</option>
                  <option value="best_3_4">Best 3 of 4 CAs</option>
                  <option value="best_2_4">Best 2 of 4 CAs</option>
                  <option value="custom">Customize Rules...</option>
                </select>

                {logicMode === 'custom' && (
                  <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/60 p-1.5 rounded-lg text-xs shadow-soft-sm shrink-0 w-full sm:w-auto justify-center">
                    <span className="font-extrabold text-indigo-600 text-[10px] uppercase">Best</span>
                    <input
                      type="number"
                      min="1"
                      max={customBestOfY}
                      value={customBestOfX}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setCustomBestOfX(Math.min(val, customBestOfY));
                      }}
                      className="w-10 text-center p-0.5 text-[11px] bg-white border border-slate-200 rounded font-bold text-slate-800"
                    />
                    <span className="text-[10px] font-bold text-slate-400 font-sans">of</span>
                    <input
                      type="number"
                      min={customBestOfX}
                      max={assessments.length}
                      value={customBestOfY}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setCustomBestOfY(Math.min(Math.max(val, customBestOfX), assessments.length));
                      }}
                      className="w-10 text-center p-0.5 text-[11px] bg-white border border-slate-200 rounded font-bold text-slate-800"
                    />
                    <span className="font-extrabold text-indigo-600 text-[10px] uppercase">CAs</span>
                  </div>
                )}
              </div>
            </div>

            {/* Explanation box */}
            <div className="mb-4 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-2.5">
              <HelpCircle size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 font-medium leading-relaxed font-sans">
                {logicExplanations[selectionLogic] || `Takes the top ${customBestOfX} highest scoring continuous assessments out of ${customBestOfY}.`}
              </p>
            </div>

            {/* Dynamic CA rows list */}
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {assessments.map((ass, index) => {
                  const isSelected = results.selectedIds.includes(ass._id || ass.id || String(index));
                  return (
                    <motion.div
                      key={ass._id || ass.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-grow-glow ${
                        isSelected 
                          ? 'bg-slate-50/50 border-slate-200' 
                          : 'bg-white border-dashed border-slate-200 opacity-60'
                      }`}
                    >
                      {/* Name editor inline */}
                      <div className="flex items-center gap-1.5 w-1/4 sm:w-1/4 shrink-0">
                        {isSelected && (
                          <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0" title="Included in result calculation">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                        <input
                          type="text"
                          value={ass.name}
                          placeholder={`CA${index + 1}`}
                          onChange={(e) => {
                            const updated = [...assessments];
                            updated[index].name = e.target.value;
                            setAssessments(updated);
                          }}
                          className="w-full text-xs sm:text-sm font-bold text-slate-700 bg-transparent hover:bg-slate-100/50 focus:bg-white px-1.5 py-0.5 rounded outline-none transition-all"
                        />
                      </div>

                      {/* Marks inputs */}
                      <div className="flex items-center gap-1.5 justify-end flex-1">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              id={`input-obt-${index}`}
                              placeholder="Obtained"
                              value={ass.obtainedMarks}
                              inputMode="decimal"
                              onChange={(e) => handleAssessmentChange(index, 'obtainedMarks', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'obt')}
                              onFocus={(e) => {
                                if (e.target.value === '0' || e.target.value === 0) {
                                  handleAssessmentChange(index, 'obtainedMarks', '');
                                } else {
                                  e.target.select();
                                }
                              }}
                              className="w-14 sm:w-20 text-center px-1.5 py-1 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200/50 focus:bg-white border border-slate-200 focus:border-calm-indigo focus:ring-1 focus:ring-calm-indigo/10 rounded-lg outline-none font-semibold transition-all"
                            />
                            <span className="text-slate-400 font-bold text-xs">/</span>
                            <input
                              type="number"
                              id={`input-tot-${index}`}
                              placeholder="Total"
                              value={ass.totalMarks}
                              inputMode="decimal"
                              onChange={(e) => handleAssessmentChange(index, 'totalMarks', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'tot')}
                              onFocus={(e) => {
                                if (e.target.value === '0' || e.target.value === 0) {
                                  handleAssessmentChange(index, 'totalMarks', '');
                                } else {
                                  e.target.select();
                                }
                              }}
                              className="w-14 sm:w-20 text-center px-1.5 py-1 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200/50 focus:bg-white border border-slate-200 focus:border-calm-indigo focus:ring-1 focus:ring-calm-indigo/10 rounded-lg outline-none font-semibold transition-all"
                            />
                          </div>
                          {/* Floating error labels */}
                          {errors[`obtainedMarks-${index}`] && (
                            <span className="text-[8px] sm:text-[10px] text-rose-500 font-medium mt-0.5 flex items-center gap-0.5">
                              <AlertCircle size={9} />
                              {errors[`obtainedMarks-${index}`]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete row button (only if > 2) */}
                      <div className="w-8 flex justify-end shrink-0">
                        {assessments.length > 2 ? (
                          <button
                            onClick={() => handleRemoveAssessment(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove CA test"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <div className="w-6 h-6" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Add Assessment Button */}
            <button
              onClick={handleAddAssessment}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-200 text-slate-500 hover:text-calm-indigo hover:border-calm-indigo/50 hover:bg-slate-50/50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Dynamic Continuous Assessment (CA) Test</span>
            </button>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
