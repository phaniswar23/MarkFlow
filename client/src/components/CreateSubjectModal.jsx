import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlusCircle, AlertCircle, Sparkles, BarChart2 } from 'lucide-react';
import { Card, CircularProgress, ProportionalMathView } from './UI';
import { calculateSubjectMarks, validateMarks, safeNumber } from '../utils/calcEngine';

export default function CreateSubjectModal({ isOpen, onClose, onCreate, subjects, addToast }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [caCount, setCaCount] = useState(2);
  const [weightage, setWeightage] = useState(30);
  const [assessments, setAssessments] = useState([
    { name: 'CA1', obtainedMarks: 0, totalMarks: 30 },
    { name: 'CA2', obtainedMarks: 0, totalMarks: 30 }
  ]);
  const [errors, setErrors] = useState({});
  const [selectionLogic, setSelectionLogic] = useState('all');
  const [customBestOfX, setCustomBestOfX] = useState(2);
  const [customBestOfY, setCustomBestOfY] = useState(2);

  const firstInputRef = useRef(null);

  // Focus on code input on open (code is now the primary mandatory field)
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Dynamically re-provision assessments list when caCount changes, retaining typed marks
  useEffect(() => {
    const newAss = [];
    for (let i = 1; i <= caCount; i++) {
      const existing = assessments[i - 1];
      newAss.push({
        name: `CA${i}`,
        obtainedMarks: existing ? existing.obtainedMarks : 0,
        totalMarks: existing ? existing.totalMarks : 30
      });
    }
    setAssessments(newAss);

    // Keep custom bounds safe
    if (customBestOfY > caCount) {
      setCustomBestOfY(caCount);
    }
    if (customBestOfX > caCount) {
      setCustomBestOfX(Math.min(customBestOfX, caCount));
    }
  }, [caCount]);

  if (!isOpen) return null;

  const finalSelectionLogic = selectionLogic === 'custom'
    ? `best_${customBestOfX}_${customBestOfY}`
    : selectionLogic;

  // Run live calculations inside the creation modal
  const liveResults = calculateSubjectMarks({
    weightage,
    selectionLogic: finalSelectionLogic,
    assessments
  });

  const validate = () => {
    const tempErrors = {};
    const trimmedCode = code.trim().toUpperCase();
    
    // Subject Name is fully optional. If empty, default to uppercase Subject Code
    const trimmedName = name.trim();
    const finalSubjectName = trimmedName ? trimmedName : trimmedCode;

    // Subject Code is mandatory
    if (!trimmedCode) {
      tempErrors.code = 'Subject code is required';
    } else {
      // In-memory duplicate code check (case-insensitive)
      const codeExists = subjects.some(s => s.code.trim().toLowerCase() === trimmedCode.toLowerCase());
      if (codeExists) {
        addToast('Subject code already exists', 'error');
        tempErrors.code = 'Duplicate subject code';
      }
    }

    // In-memory duplicate name check (case-insensitive) using finalSubjectName
    if (finalSubjectName) {
      const nameExists = subjects.some(s => s.name.trim().toLowerCase() === finalSubjectName.toLowerCase());
      if (nameExists) {
        addToast('Subject name already exists', 'error');
        tempErrors.name = 'Duplicate subject name';
      }
    }

    const w = parseFloat(weightage);
    if (isNaN(w) || w <= 0 || w > 100) {
      tempErrors.weightage = 'Weightage must be between 1 and 100';
    }

    // Validate custom selection logic bounds
    if (selectionLogic === 'custom') {
      if (customBestOfX > customBestOfY) {
        tempErrors.logic = 'Best CAs cannot exceed the pool limit';
      }
      if (customBestOfY > caCount) {
        tempErrors.logic = `Pool limit cannot exceed total CAs (${caCount})`;
      }
    }

    // Validate each entered assessment
    assessments.forEach((ass, index) => {
      const validation = validateMarks(ass.obtainedMarks, ass.totalMarks);
      if (!validation.valid && ass.obtainedMarks !== '') {
        tempErrors[`obt-${index}`] = validation.error;
      }
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    
    // If Name is blank, auto-assign Code as the Name
    const finalSubjectName = trimmedName ? trimmedName : trimmedCode;

    onCreate({
      name: finalSubjectName,
      code: trimmedCode,
      weightage: parseFloat(weightage),
      selectionLogic: finalSelectionLogic,
      assessments: assessments.map(a => ({
        ...a,
        obtainedMarks: a.obtainedMarks === '' ? 0 : parseFloat(a.obtainedMarks) || 0,
        totalMarks: parseFloat(a.totalMarks) || 30
      }))
    });

    // Reset Form states
    setName('');
    setCode('');
    setCaCount(2);
    setWeightage(30);
    setSelectionLogic('all');
    setCustomBestOfX(2);
    setCustomBestOfY(2);
    setAssessments([
      { name: 'CA1', obtainedMarks: 0, totalMarks: 30 },
      { name: 'CA2', obtainedMarks: 0, totalMarks: 30 }
    ]);
    setErrors({});
    onClose();
  };

  const handleAssessmentChange = (index, field, value) => {
    const updated = [...assessments];
    const cleanValue = typeof value === 'string' ? value.replace(/^0+(?=\d)/, '') : value;
    updated[index][field] = cleanValue === '' ? '' : cleanValue;
    setAssessments(updated);

    // Instant validation
    const item = updated[index];
    const validation = validateMarks(item.obtainedMarks, item.totalMarks);
    const newErrors = { ...errors };
    if (!validation.valid && item.obtainedMarks !== '') {
      newErrors[`obt-${index}`] = validation.error;
    } else {
      delete newErrors[`obt-${index}`];
    }
    setErrors(newErrors);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-0 sm:p-4">
      {/* Overlay shade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900"
      />

      {/* Dialog card (responsive width and height) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative w-full max-w-4xl h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto bg-[#f8fafc] sm:rounded-2xl rounded-none shadow-2xl z-10 border-0 sm:border border-slate-100 scrollbar-thin flex flex-col"
      >
        <div className="p-5 md:p-8 space-y-6 flex-1 flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-calm-indigo">
                <PlusCircle size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 leading-none">Create & Log Subject</h2>
                <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Specify cased codes, weights, and CA scores in one step</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Core Layout Split */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
            
            {/* Left Column: Form & Assessment inputs (Lg: 7/12) */}
            <div className="lg:col-span-7 space-y-4 flex flex-col justify-start">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. MAT201 (Mandatory)"
                    value={code}
                    ref={firstInputRef}
                    onChange={(e) => setCode(e.target.value)}
                    className={`w-full px-3.5 py-2 text-sm bg-white border ${errors.code ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-calm-indigo/20'} rounded-xl focus:ring-2 outline-none font-medium text-slate-800 transition-all`}
                  />
                  {errors.code && (
                    <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} />
                      {errors.code}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Name <span className="text-slate-400">(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 focus:ring-calm-indigo/20 rounded-xl focus:ring-2 outline-none font-medium text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Number of CAs</label>
                  <select
                    value={caCount}
                    onChange={(e) => setCaCount(parseInt(e.target.value))}
                    className="w-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 focus:ring-2 focus:ring-calm-indigo/20 rounded-xl px-3 py-2 outline-none transition-all cursor-pointer"
                  >
                    <option value="1">1 CA Exam</option>
                    <option value="2">2 CA Exams</option>
                    <option value="3">3 CA Exams</option>
                    <option value="4">4 CA Exams</option>
                    <option value="5">5 CA Exams</option>
                    <option value="6">6 CA Exams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Weightage (Marks)</label>
                  <input
                    type="number"
                    placeholder="e.g. 30"
                    value={weightage}
                    min="1"
                    max="100"
                    inputMode="numeric"
                    onChange={(e) => setWeightage(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className={`w-full px-3.5 py-2 text-sm bg-white border ${errors.weightage ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-calm-indigo/20'} rounded-xl focus:ring-2 outline-none font-medium text-slate-800 transition-all`}
                  />
                  {errors.weightage && (
                    <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} />
                      {errors.weightage}
                    </span>
                  )}
                </div>
              </div>

              {/* Selection Logic & Custom Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Selection Logic</label>
                  <select
                    value={selectionLogic}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectionLogic(val);
                      if (val === 'custom') {
                        setCustomBestOfX(Math.min(2, caCount));
                        setCustomBestOfY(Math.min(3, caCount));
                      }
                    }}
                    className="w-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 focus:ring-2 focus:ring-calm-indigo/20 rounded-xl px-3 py-2 outline-none transition-all cursor-pointer"
                  >
                    <option value="all">All CAs Mandatory</option>
                    {caCount >= 3 && <option value="best_2_3">Best 2 of 3 CAs</option>}
                    {caCount >= 4 && <option value="best_3_4">Best 3 of 4 CAs</option>}
                    {caCount >= 4 && <option value="best_2_4">Best 2 of 4 CAs</option>}
                    <option value="custom">Customize Rules...</option>
                  </select>
                </div>

                {selectionLogic === 'custom' ? (
                  <div className="flex flex-col justify-end">
                    <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/60 p-2 rounded-xl h-[38px] justify-center shadow-soft-sm">
                      <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wide">Best</span>
                      <input
                        type="number"
                        min="1"
                        max={customBestOfY}
                        value={customBestOfX}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setCustomBestOfX(Math.min(val, customBestOfY));
                        }}
                        className="w-12 text-center p-1 text-xs bg-white border border-slate-200 rounded-md font-bold text-slate-800"
                      />
                      <span className="text-xs font-bold text-slate-400">of</span>
                      <input
                        type="number"
                        min={customBestOfX}
                        max={caCount}
                        value={customBestOfY}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setCustomBestOfY(Math.min(Math.max(val, customBestOfX), caCount));
                        }}
                        className="w-12 text-center p-1 text-xs bg-white border border-slate-200 rounded-md font-bold text-slate-800"
                      />
                      <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wide">CAs</span>
                    </div>
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}
              </div>

              {/* Dynamic Assessment Marks section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Enter CA Marks</label>
                <div className="sm:max-h-[190px] sm:overflow-y-auto overflow-visible pr-1 space-y-2 border border-slate-100 rounded-xl bg-white p-3 shadow-inner scrollbar-thin">
                  {assessments.map((ass, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between gap-3 p-2 bg-slate-50 border border-slate-100 rounded-lg"
                    >
                      <span className="text-xs font-extrabold text-slate-600 min-w-[50px]">{ass.name}</span>
                      
                      <div className="flex items-center gap-2 justify-end flex-1">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              placeholder="Obt"
                              value={ass.obtainedMarks}
                              inputMode="decimal"
                              onChange={(e) => handleAssessmentChange(index, 'obtainedMarks', e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value === '0' || e.target.value === 0) {
                                  handleAssessmentChange(index, 'obtainedMarks', '');
                                } else {
                                  e.target.select();
                                }
                              }}
                              className={`w-16 text-center px-1.5 py-1 text-xs rounded-md outline-none font-bold transition-all border ${errors[`obt-${index}`] ? 'border-rose-300 bg-rose-50/35 text-rose-600 focus:ring-2 focus:ring-rose-200' : 'bg-white border-slate-200 focus:border-calm-indigo focus:ring-1 focus:ring-calm-indigo/20'}`}
                            />
                            <span className="text-slate-400 font-bold">/</span>
                            <input
                              type="number"
                              placeholder="Tot"
                              value={ass.totalMarks}
                              inputMode="decimal"
                              onChange={(e) => handleAssessmentChange(index, 'totalMarks', e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value === '0' || e.target.value === 0) {
                                  handleAssessmentChange(index, 'totalMarks', '');
                                } else {
                                  e.target.select();
                                }
                              }}
                              className="w-16 text-center px-1.5 py-1 text-xs bg-white border border-slate-200 rounded-md outline-none font-bold focus:border-calm-indigo focus:ring-1 focus:ring-calm-indigo/20"
                            />
                          </div>
                          {errors[`obt-${index}`] && (
                            <span className="text-[9px] text-rose-500 font-semibold mt-0.5">{errors[`obt-${index}`]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Live Visualizations (Lg: 5/12) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-100 rounded-2xl p-5 shadow-soft mt-2 lg:mt-0">
              
              <div className="space-y-4 text-center flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Live Assessment Preview</span>
                
                <CircularProgress percentage={liveResults.percentage} size={110} />

                <div className="mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ESTIMATED SCORE</span>
                  <div className="text-2xl font-black text-slate-800 mt-0.5">
                    {liveResults.weightedMarks.toFixed(2)}
                    <span className="text-sm font-semibold text-slate-400 mx-1">/</span>
                    <span className="text-sm font-bold text-slate-500">{weightage || 30}</span>
                  </div>
                </div>
              </div>

              {/* Math Easing Bar */}
              <div className="mt-4 w-full">
                <ProportionalMathView formulaProps={liveResults.formulaProps} />
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100/60 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-calm-indigo hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-glow transition-all cursor-pointer"
                >
                  Create Subject
                </button>
              </div>

            </div>

          </form>

        </div>
      </motion.div>
    </div>
  );
}

