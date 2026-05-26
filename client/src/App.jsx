import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, GraduationCap, Calculator, Award, Sparkles, RefreshCw, BarChart2, Search, Trash2, Edit3, AlertTriangle, Filter, ArrowUpDown, Terminal, MessageSquare, Download, FileText, Share2, X, ArrowLeft } from 'lucide-react';
import { Card, SyncStatus, Badge, CardProgressRing } from './components/UI';
import SubjectDetailsPanel from './components/SubjectDetailsPanel';
import AboutMePanel from './components/AboutMePanel';
import FeedbackModal from './components/FeedbackModal';
import CreateSubjectModal from './components/CreateSubjectModal';
import ConfirmationModal from './components/ConfirmationModal';
import { ToastContainer } from './components/Toast';
import { calculateSubjectMarks } from './utils/calcEngine';
import { exportToCSV, exportToPDF } from './utils/exportUtils';

const API_BASE_URL = 'http://localhost:5001/api';

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all'); // all, excellent, passing, needs_attention
  const [sortBy, setSortBy] = useState('highest'); // DEFAULT highest first

  // Modals & Panels triggers
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  
  // Undo States and Refs
  const [undoSubject, setUndoSubject] = useState(null);
  const [undoSubjectTimer, setUndoSubjectTimer] = useState(0);
  const undoSubjectTimerRef = useRef(null);

  const [undoAllList, setUndoAllList] = useState(null);
  const [undoAllTimer, setUndoAllTimer] = useState(0);
  const undoAllTimerRef = useRef(null);
  const [showPreDeleteSuggestion, setShowPreDeleteSuggestion] = useState(false);

  // Confirmation Modal states
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Toast Notification states
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'error') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenCreateModal = () => {
    const accepted = localStorage.getItem('markflow-disclaimer-accepted') === 'true';
    if (accepted) {
      setShowCreateModal(true);
    } else {
      setShowDisclaimerModal(true);
    }
  };

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('markflow-disclaimer-accepted', 'true');
    setShowDisclaimerModal(false);
    setShowCreateModal(true);
  };

  // 1. Initial Load: Check MongoDB status and sync subjects
  useEffect(() => {
    const initData = async () => {
      // First load from localStorage to guarantee instant layout render
      const localData = localStorage.getItem('markflow-subjects');
      let parsedLocal = [];
      if (localData) {
        try {
          parsedLocal = JSON.parse(localData);
          setSubjects(parsedLocal);
        } catch (e) {
          console.error('Error parsing local storage subjects:', e);
        }
      }

      // Try syncing with Backend MongoDB
      setSyncing(true);
      try {
        const healthRes = await fetch(`${API_BASE_URL}/health`);
        const healthData = await healthRes.json();
        
        if (healthData.status === 'ok') {
          setBackendConnected(true);
          
          // Fetch from MongoDB
          const res = await fetch(`${API_BASE_URL}/subjects`);
          const dbSubjects = await res.json();
          
          if (Array.isArray(dbSubjects) && dbSubjects.length > 0) {
            const formatted = dbSubjects.map(s => ({ ...s, id: s._id || s.id }));
            setSubjects(formatted);
            localStorage.setItem('markflow-subjects', JSON.stringify(formatted));
          } else if (parsedLocal.length > 0) {
            console.log('Syncing local storage data to empty MongoDB database...');
            for (const sub of parsedLocal) {
              const { id, _id, ...cleanSub } = sub;
              await fetch(`${API_BASE_URL}/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanSub)
              });
            }
            const refetchRes = await fetch(`${API_BASE_URL}/subjects`);
            const refetched = await refetchRes.json();
            const formatted = refetched.map(s => ({ ...s, id: s._id || s.id }));
            setSubjects(formatted);
          }
        }
      } catch (err) {
        console.log('MongoDB server not detected. Operating in Local Storage fallback mode.');
        setBackendConnected(false);
      } finally {
        setSyncing(false);
      }
    };

    initData();
  }, []);

  // Helper: Save local
  const saveToLocalStorage = (data) => {
    localStorage.setItem('markflow-subjects', JSON.stringify(data));
  };

  // 2. Add New Subject (Triggered after CreateSubjectModal passes strict checks)
  const handleCreateSubject = async (newSubjectData) => {
    // Optimistically update frontend state
    const tempId = 'temp_' + Date.now();
    const tempSubject = { ...newSubjectData, id: tempId };
    const updatedSubjects = [tempSubject, ...subjects];
    setSubjects(updatedSubjects);
    saveToLocalStorage(updatedSubjects);
    addToast('Subject created successfully', 'success');

    // Persist to Backend if available
    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE_URL}/subjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubjectData)
        });
        
        if (res.ok) {
          const saved = await res.json();
          // Swap temp ID with actual DB ID
          const resolved = updatedSubjects.map(sub => 
            sub.id === tempId ? { ...saved, id: saved._id || saved.id } : sub
          );
          setSubjects(resolved);
          saveToLocalStorage(resolved);
        } else {
          const errData = await res.json();
          addToast(errData.message || 'Error saving subject to database', 'error');
          // Revert state if backend returned duplicate error
          const reverted = updatedSubjects.filter(sub => sub.id !== tempId);
          setSubjects(reverted);
          saveToLocalStorage(reverted);
        }
      } catch (err) {
        console.error('Error saving subject to MongoDB, keeping local version:', err);
      }
    }
  };

  // 3. Save Active Subject (Auto-saves live as user types in details panel)
  const handleSaveSubject = async (updatedSubject) => {
    const updatedList = subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s);
    setSubjects(updatedList);
    saveToLocalStorage(updatedList);

    // Save to Database asynchronously
    if (backendConnected && !updatedSubject.id.startsWith('temp_')) {
      try {
        const res = await fetch(`${API_BASE_URL}/subjects/${updatedSubject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSubject)
        });
        
        if (!res.ok) {
          const errData = await res.json();
          addToast(errData.message || 'Error syncing changes', 'error');
        }
      } catch (err) {
        console.error('Failed to sync changes with MongoDB:', err);
      }
    }
  };

  // 4. Delete Subject with 5-Second Undo Option
  const handleDeleteSubject = (id) => {
    const sub = subjects.find(s => s.id === id);
    if (!sub) return;

    // Clear any previous delete timeout
    if (undoSubjectTimerRef.current) {
      clearInterval(undoSubjectTimerRef.current);
    }

    // If there was a previously pending subject, commit it permanently first
    if (undoSubject) {
      commitDeleteSubject(undoSubject.id, subjects.filter(s => s.id !== undoSubject.id));
    }

    if (activeSubject && activeSubject.id === id) {
      setActiveSubject(null);
    }

    // Optimistically remove from state list immediately for responsive UI
    const remaining = subjects.filter(s => s.id !== id);
    setSubjects(remaining);

    // Save the backup to state
    setUndoSubject(sub);
    setUndoSubjectTimer(5000); // 5000ms countdown

    const intervalTime = 100;
    let timeLeft = 5000;
    
    undoSubjectTimerRef.current = setInterval(() => {
      timeLeft -= intervalTime;
      setUndoSubjectTimer(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(undoSubjectTimerRef.current);
        commitDeleteSubject(sub.id, remaining);
        setUndoSubject(null);
      }
    }, intervalTime);
  };

  const commitDeleteSubject = async (id, currentList) => {
    saveToLocalStorage(currentList);
    if (backendConnected && !id.toString().startsWith('temp_')) {
      try {
        await fetch(`${API_BASE_URL}/subjects/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Failed to delete subject from MongoDB:', err);
      }
    }
  };

  const handleUndoSubjectDelete = () => {
    if (!undoSubject) return;
    if (undoSubjectTimerRef.current) {
      clearInterval(undoSubjectTimerRef.current);
    }
    const restored = [undoSubject, ...subjects];
    setSubjects(restored);
    setUndoSubject(null);
    addToast(`Restored subject: ${undoSubject.name}`, 'success');
  };

  // 5. Delete All Subjects with 10-Second Undo Option
  const triggerDeleteAllProcess = () => {
    if (subjects.length === 0) return;
    // Suggest downloading the report first!
    setShowPreDeleteSuggestion(true);
  };

  const handleDeleteAllSubjects = () => {
    setShowPreDeleteSuggestion(false);
    setConfirmDeleteAll(false);

    if (subjects.length === 0) return;

    if (undoAllTimerRef.current) {
      clearInterval(undoAllTimerRef.current);
    }

    // If there was a pending subject delete, commit it now
    if (undoSubject) {
      commitDeleteSubject(undoSubject.id, subjects.filter(s => s.id !== undoSubject.id));
      setUndoSubject(null);
    }

    const backup = [...subjects];
    setUndoAllList(backup);
    setUndoAllTimer(10000); // 10 seconds

    setSubjects([]);
    setActiveSubject(null);

    const intervalTime = 100;
    let timeLeft = 10000;

    undoAllTimerRef.current = setInterval(() => {
      timeLeft -= intervalTime;
      setUndoAllTimer(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(undoAllTimerRef.current);
        commitDeleteAll();
        setUndoAllList(null);
      }
    }, intervalTime);
  };

  const commitDeleteAll = async () => {
    saveToLocalStorage([]);
    if (backendConnected) {
      try {
        await fetch(`${API_BASE_URL}/subjects`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Failed to clear subjects from database:', err);
      }
    }
  };

  const handleUndoDeleteAll = () => {
    if (!undoAllList) return;
    if (undoAllTimerRef.current) {
      clearInterval(undoAllTimerRef.current);
    }
    setSubjects(undoAllList);
    setUndoAllList(null);
    addToast('Restored all subjects successfully', 'success');
  };

  // Helper to resolve stylized avatars with Lucide icons for subject cards
  const getSubjectAvatar = (code, name, percentage) => {
    const char = (code || 'A').toUpperCase().charAt(0);
    let icon = <GraduationCap size={15} />;
    
    if (['M', 'P', 'C'].includes(char)) icon = <GraduationCap size={15} />;
    else if (['E', 'L', 'H'].includes(char)) icon = <BookOpen size={15} />;
    else if (['C', 'S', 'I', 'T'].includes(char)) icon = <Terminal size={15} />;
    else icon = <Award size={15} />;

    let avatarBg = 'bg-indigo-50/60 border-indigo-100/50 text-indigo-500';
    if (percentage >= 75) {
      avatarBg = 'bg-emerald-50/60 border-emerald-100/50 text-emerald-500';
    } else if (percentage < 40) {
      avatarBg = 'bg-rose-50/60 border-rose-100/50 text-rose-500';
    }

    return (
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border shrink-0 shadow-soft-sm ${avatarBg}`}>
        {icon}
      </div>
    );
  };

  // Global calculations
  const totalSubjectsCount = subjects.length;
  const overallAverages = subjects.map(sub => ({
    ...sub,
    metrics: calculateSubjectMarks(sub)
  }));
  
  const totalWeightage = overallAverages.reduce((sum, item) => sum + (parseFloat(item.metrics.weightedMarks) ? item.metrics.weightedMarks : 0), 0);
  const maxPossibleWeightage = subjects.reduce((sum, item) => sum + (parseFloat(item.weightage) ? parseFloat(item.weightage) : 0), 0);
  const overallPercentage = maxPossibleWeightage > 0 ? (totalWeightage / maxPossibleWeightage) * 100 : 0;

  // Search, Filter & Sort logic applied to list
  const filteredSubjects = overallAverages
    .filter(({ name, code }) => {
      const q = searchQuery.toLowerCase().trim();
      return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    })
    .filter(({ metrics }) => {
      if (performanceFilter === 'excellent') return metrics.percentage >= 75;
      if (performanceFilter === 'passing') return metrics.percentage >= 40 && metrics.percentage < 75;
      if (performanceFilter === 'needs_attention') return metrics.percentage < 40;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'highest') return b.metrics.percentage - a.metrics.percentage;
      if (sortBy === 'lowest') return a.metrics.percentage - b.metrics.percentage;
      return 0; 
    });

  // Visual cues for overall stats
  let summaryGlowColor = 'border-slate-100';
  let percentageTextColor = 'text-slate-800';
  if (overallPercentage >= 75) {
    summaryGlowColor = 'border-teal-100 shadow-soft-glow-teal';
    percentageTextColor = 'text-calm-teal';
  } else if (overallPercentage < 40 && totalSubjectsCount > 0) {
    summaryGlowColor = 'border-rose-100 shadow-soft-glow-rose';
    percentageTextColor = 'text-calm-rose';
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 font-sans bg-[#f8fafc]">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header section with connection signals */}
      <header className="bg-white border-b border-slate-100 py-4 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/80 select-none">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">MarkFlow</h1>
            <span className="text-[10px] font-semibold text-slate-400">Continuous Assessment Calculator</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {syncing && <RefreshCw size={13} className="animate-spin text-slate-400" />}
          <SyncStatus isConnected={backendConnected} />
        </div>
      </header>

      {/* Main Student Hub Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 mt-6 flex-1 flex flex-col gap-6">
        
        {/* Dynamic Metric Dashboard card */}
        <div className={`bg-white border rounded-2xl p-6 shadow-soft transition-grow-glow flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${summaryGlowColor}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 select-none">
                <span>Semester Stats</span>
                <Sparkles size={16} className="text-amber-400" />
              </h2>
              {totalSubjectsCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Export Dropdown Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/10 text-slate-600 hover:text-calm-indigo rounded-xl text-xs font-bold transition-all cursor-pointer outline-none focus:ring-2 focus:ring-indigo-100"
                      title="Export assessment data as PDF or CSV"
                    >
                      <Download size={12} />
                      <span>Export</span>
                    </button>
                    
                    {showExportDropdown && (
                      <>
                        {/* Overlay backdrop to dismiss dropdown */}
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setShowExportDropdown(false)}
                        />
                        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-40 animate-none">
                          <button
                            onClick={() => {
                              exportToPDF(subjects, { overallPercentage, totalWeightage, maxPossibleWeightage });
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:text-calm-indigo hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <FileText size={13} className="text-slate-400" />
                            <span>Export as PDF Report</span>
                          </button>
                          <button
                            onClick={() => {
                              exportToCSV(subjects, { overallPercentage, totalWeightage, maxPossibleWeightage });
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:text-calm-indigo hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Share2 size={13} className="text-slate-400" />
                            <span>Export as CSV Sheet</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={triggerDeleteAllProcess}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none focus:ring-2 focus:ring-rose-200 animate-none"
                    title="Clear all modules permanently"
                  >
                    <Trash2 size={12} />
                    <span>Delete All</span>
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 max-w-lg leading-relaxed select-none">
              Live updates of standard internal markings based on continuous calculations.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:flex items-center gap-3 sm:gap-6 w-full md:w-auto shrink-0 select-none border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0 text-center sm:text-left">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SUBJECTS</span>
              <span className="text-xl sm:text-2xl font-black text-slate-700 font-sans">{totalSubjectsCount}</span>
            </div>
            
            <div className="flex flex-col sm:border-l sm:border-slate-100 sm:pl-6">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ESTIMATED CA</span>
              <span className="text-xl sm:text-2xl font-black text-slate-700 font-sans">
                {totalWeightage.toFixed(1).replace('.0', '')}
                <span className="text-xs sm:text-sm font-medium text-slate-400">/{maxPossibleWeightage}</span>
              </span>
            </div>

            <div className="flex flex-col sm:border-l sm:border-slate-100 sm:pl-6">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">INTERNAL AVG</span>
              <span className={`text-xl sm:text-2xl font-black ${percentageTextColor}`}>
                {overallPercentage.toFixed(1).replace('.0', '')}%
              </span>
            </div>
          </div>
        </div>

        {/* Undo Banners Container */}
        <AnimatePresence>
          {undoSubject && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="overflow-hidden w-full select-none"
            >
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white shadow-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 shrink-0">
                    <Trash2 size={14} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-white leading-none">Subject Deleted</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-none">
                      Deleted <strong className="text-slate-200">{undoSubject.name}</strong>. Permanently saving in <strong className="text-rose-400">{(undoSubjectTimer / 1000).toFixed(1)}s</strong>...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndoSubjectDelete}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-soft outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    Undo Deletion
                  </button>
                  <button
                    onClick={() => {
                      if (undoSubjectTimerRef.current) {
                        clearInterval(undoSubjectTimerRef.current);
                      }
                      commitDeleteSubject(undoSubject.id, subjects.filter(s => s.id !== undoSubject.id));
                      setUndoSubject(null);
                    }}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Dismiss & Save Now"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-1 overflow-hidden mt-1.5 rounded-full">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-100" 
                  style={{ width: `${(undoSubjectTimer / 5000) * 100}%` }}
                />
              </div>
            </motion.div>
          )}

          {undoAllList && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="overflow-hidden w-full select-none"
            >
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white shadow-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 shrink-0">
                    <Trash2 size={14} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-white leading-none">All Subjects Cleared</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-none">
                      Semester board cleared. Permanently wiping in <strong className="text-rose-400">{(undoAllTimer / 1000).toFixed(1)}s</strong>...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndoDeleteAll}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-soft outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    Undo (Restore Board)
                  </button>
                  <button
                    onClick={() => {
                      if (undoAllTimerRef.current) {
                        clearInterval(undoAllTimerRef.current);
                      }
                      commitDeleteAll();
                      setUndoAllList(null);
                    }}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Dismiss & Clear Now"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-1 overflow-hidden mt-1.5 rounded-full">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-100" 
                  style={{ width: `${(undoAllTimer / 10000) * 100}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search Row (SaaS Style) - Hidden on Mobile, Flex on Desktop */}
        <div className="hidden md:flex bg-white border border-slate-100 p-4 rounded-2xl shadow-soft flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search subject by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-calm-indigo/20 focus:border-calm-indigo rounded-xl outline-none transition-all text-slate-800"
            />
          </div>

          {/* Filtering tabs */}
          <div className="flex flex-wrap items-center gap-2 max-w-full overflow-hidden">
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-0.5 overflow-x-auto max-w-full flex-nowrap scrollbar-none">
              {[
                { key: 'all', label: 'All CAs' },
                { key: 'excellent', label: 'Excellent (≥75%)' },
                { key: 'passing', label: 'Passing (40-75%)' },
                { key: 'needs_attention', label: 'Attention (<40%)' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPerformanceFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer outline-none focus:ring-2 focus:ring-calm-indigo/10 shrink-0 ${
                    performanceFilter === tab.key
                      ? 'bg-white text-calm-indigo shadow-soft font-extrabold border border-slate-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sorting menu */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-0.5">
              <ArrowUpDown size={12} className="text-slate-400 mr-1.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-slate-600 outline-none pr-4 cursor-pointer py-1.5"
              >
                <option value="recent">Recently Added</option>
                <option value="highest">Highest Score</option>
                <option value="lowest">Lowest Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subjects & Utilities Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Render Subject Cards list */}
          <AnimatePresence>
            {filteredSubjects.map(({ id, name, code, weightage, selectionLogic, assessments, metrics }) => {
              
              // Color variables for separate card glows
              let cardGlow = 'none';
              let accentColor = 'bg-calm-indigo';
              let statusLabel = 'Average';
              let statusChipStyle = 'bg-amber-50 text-amber-600 border-amber-100/50';
              
              if (metrics.percentage >= 75) {
                cardGlow = 'teal';
                accentColor = 'bg-calm-teal';
                statusLabel = 'Excellent';
                statusChipStyle = 'bg-emerald-50 text-emerald-600 border-emerald-100/50';
              } else if (metrics.percentage < 40) {
                cardGlow = 'rose';
                accentColor = 'bg-calm-rose';
                statusLabel = 'At Risk';
                statusChipStyle = 'bg-rose-50 text-rose-600 border-rose-100/50';
              }

              // Pre-format dynamic human-readable timestamps
              const lastUpdated = metrics.updatedAt ? new Date(metrics.updatedAt) : new Date();
              const timeString = lastUpdated.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <Card
                    onClick={() => setActiveSubject({ id, name, code, weightage, selectionLogic, assessments })}
                    glowType={cardGlow}
                    className="flex flex-col justify-between min-h-[190px] cursor-pointer relative overflow-hidden group border border-slate-100 select-none !p-5 sm:!p-6 bg-gradient-to-b from-white to-slate-50/35 hover:-translate-y-1.5 hover:shadow-soft-lg transition-all duration-300 ease-out"
                  >
                    {/* Tiny accent strip */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor} opacity-70 group-hover:opacity-100 transition-opacity`} />

                    <div>
                      <div className="flex items-start justify-between gap-3">
                        {/* Styled Header Info with Category Icon */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getSubjectAvatar(code, name, metrics.percentage)}
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="text-[14px] sm:text-[15px] font-black text-slate-800 group-hover:text-calm-indigo transition-colors leading-snug truncate" title={name}>
                              {name || 'Untitled Subject'}
                            </h3>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] font-bold text-slate-400 tracking-wide font-mono">
                                {code || 'NO CODE'}
                              </span>
                              <span className="text-slate-300 font-sans text-xs">•</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border ${statusChipStyle}`}>
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Controls safely aligned inline next to the progress ring */}
                          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSubject({ id, name, code, weightage, selectionLogic, assessments });
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 hover:text-calm-indigo hover:shadow-sm rounded-lg transition-all cursor-pointer"
                              title="Edit Marks"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setSubjectToDelete({ id, name });
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:shadow-sm rounded-lg transition-all cursor-pointer"
                              title="Delete Subject"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                          <CardProgressRing percentage={metrics.percentage} />
                        </div>
                      </div>

                      {/* Assessments list overview */}
                      <div className="flex flex-wrap gap-1.5 mt-3.5 justify-start">
                        {assessments.slice(0, 3).map((ass, i) => (
                          <div 
                            key={ass._id || ass.id || i}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-slate-50 border border-slate-100 text-slate-500"
                          >
                            {ass.name}: {ass.obtainedMarks !== '' ? ass.obtainedMarks : 0}/{ass.totalMarks}
                          </div>
                        ))}
                        {assessments.length > 3 && (
                          <div className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">
                            +{assessments.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Score and Timestamp Summary */}
                    <div className="mt-6 pt-3 border-t border-slate-100/60 flex items-center justify-between">
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1">
                          <BarChart2 size={12} className="text-slate-400" />
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Internal Score</span>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400/80 mt-0.5">Updated {timeString}</span>
                      </div>
                      <span className="text-base font-black text-slate-800">
                        {metrics.weightedMarks.toFixed(2)}
                        <span className="text-xs font-medium text-slate-400 font-sans mx-1">/</span>
                        <span className="text-xs font-bold text-slate-500">{weightage}</span>
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>


        </section>

        {/* Empty State Design Illustration */}
        {filteredSubjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-6 bg-white border border-slate-100 rounded-2xl shadow-soft text-center select-none"
          >
            <div className="h-20 w-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-calm-indigo/80 mb-4 shadow-soft">
              <BookOpen size={36} />
            </div>
            <h3 className="text-base font-bold text-slate-700">No subjects added yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              {searchQuery || performanceFilter !== 'all' 
                ? 'No subjects match your active search or filter rules.' 
                : 'Click below to create your first subject and calculate CA averages.'
              }
            </p>
            <button
              onClick={handleOpenCreateModal}
            className="mt-5 px-5 py-2 bg-calm-indigo hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-glow transition-all cursor-pointer outline-none focus:ring-2 focus:ring-calm-indigo/20 active:scale-95"
            >
              {searchQuery || performanceFilter !== 'all' ? 'Clear Filters' : 'Create First Subject'}
            </button>
          </motion.div>
        )}

        {/* Highlighted Warning-Style Disclaimer Card */}
        <div className="bg-amber-50/50 border border-amber-100 p-5 sm:p-6 rounded-2xl mt-8 text-left shadow-soft select-none">
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
              <AlertTriangle size={14} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Disclaimer & Usage Agreement</h4>
              
              <p className="text-[11px] text-slate-500 leading-relaxed font-bold text-indigo-700">
                🔒 Privacy Promise: MarkFlow is committed to student data privacy. I do not collect, store, or share any type of personal information or academic data. All calculations and assessment logs stay entirely within your private browser storage.
              </p>
              
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                MarkFlow is an independently developed academic utility designed to help students estimate their Class Assessment (CA) marks and understand their performance ahead of end-semester examinations.
              </p>
              
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                While I try to keep calculations accurate, students should always verify marks through their official university or college portal. In case of any difference, official records will be considered final.
              </p>
              
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                This platform is built solely for educational and self-analysis purposes. It is not affiliated with, endorsed by, or associated with any university, college, or academic institution.
              </p>
              
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                By using MarkFlow, you acknowledge that all results are estimated calculations only, and the developers bear no responsibility for any academic decisions made based on this application.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Floating Action Glassmorphic Icons bottom-right */}
      <div className="fixed bottom-6 right-6 flex flex-row gap-2 z-40 items-center select-none">
        
        {/* About Me Trigger */}
        <button
          onClick={() => setShowAbout(true)}
          className="h-10 px-3.5 rounded-full backdrop-blur-md bg-white/85 hover:bg-white border border-slate-200/60 hover:border-indigo-100 shadow-lg text-slate-600 hover:text-calm-indigo flex items-center gap-2 text-xs font-bold transition-all transition-grow-glow outline-none focus:ring-2 focus:ring-calm-indigo/20 active:scale-95 cursor-pointer"
          title="About Developer"
        >
          <Terminal size={14} className="text-calm-indigo" />
          <span>About Me</span>
        </button>

        {/* Feedback / Bug Report Trigger */}
        <button
          onClick={() => setShowFeedback(true)}
          className="h-10 px-3.5 rounded-full backdrop-blur-md bg-white/85 hover:bg-white border border-slate-200/60 hover:border-indigo-100 shadow-lg text-slate-600 hover:text-calm-indigo flex items-center gap-2 text-xs font-bold transition-all transition-grow-glow outline-none focus:ring-2 focus:ring-calm-indigo/20 active:scale-95 cursor-pointer"
          title="Report Bug / Give Feedback"
        >
          <MessageSquare size={14} className="text-calm-indigo" />
          <span>Feedback</span>
        </button>

      </div>

      {/* Slide in Subject Detail Modal */}
      <AnimatePresence>
        {activeSubject && (
          <SubjectDetailsPanel
            subject={activeSubject}
            onClose={() => setActiveSubject(null)}
            onSave={handleSaveSubject}
            onDelete={(id) => {
              setSubjectToDelete(subjects.find(s => s.id === id || s._id === id));
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Subject Modal Dialog */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateSubjectModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateSubject}
            subjects={subjects}
            addToast={addToast}
          />
        )}
      </AnimatePresence>

      {/* Usage Disclaimer Agreement Modal overlay */}
      <AnimatePresence>
        {showDisclaimerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisclaimerModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative z-10 text-left select-none"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight leading-none">Usage Disclaimer</h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Important Agreement</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-500 font-medium leading-relaxed max-h-60 overflow-y-auto pr-1">
                <p>
                  MarkFlow is an independent academic tool built solely to help students calculate, track, and forecast their Continuous Assessment (CA) standings.
                </p>
                <p className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-emerald-800 text-[11px] font-bold">
                  🔒 Privacy First: This application does not collect, record, or track any type of personal or academic data. All of your subject records are stored safely, privately, and entirely on your local device.
                </p>
                <p>
                  All estimations are made proportionally based on standard rules. Results are estimates only and should be verified against your official university or college academic portal. Official college records will be considered final.
                </p>
                <p>
                  By clicking <strong>Agree & Continue</strong>, you acknowledge that the developer bears no responsibility for any academic decisions made based on estimations provided by this application.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setShowDisclaimerModal(false)}
                  className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptDisclaimer}
                  className="py-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-soft hover:shadow-indigo-500/20 transition-all cursor-pointer text-center"
                >
                  Agree & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete All Suggestion Modal */}
      <AnimatePresence>
        {showPreDeleteSuggestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreDeleteSuggestion(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative z-10 text-left select-none"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight leading-none">Download Report?</h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Highly Recommended</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-5">
                Clearing your semester board is a permanent action. We highly recommend downloading your Continuous Assessment (CA) report in PDF or CSV format first so you have a record of your marks!
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    exportToPDF(subjects, { overallPercentage, totalWeightage, maxPossibleWeightage });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-200 hover:bg-indigo-50/20 text-calm-indigo font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Download PDF Report</span>
                </button>
                
                <button
                  onClick={() => {
                    exportToCSV(subjects, { overallPercentage, totalWeightage, maxPossibleWeightage });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>Download CSV Sheet</span>
                </button>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100/60">
                  <button
                    onClick={() => setShowPreDeleteSuggestion(false)}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllSubjects}
                    className="py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-soft hover:shadow-rose-500/20 transition-all cursor-pointer text-center animate-none"
                  >
                    Clear Everything
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal Dialog: Delete Single Card */}
      <AnimatePresence>
        {subjectToDelete && (
          <ConfirmationModal
            isOpen={!!subjectToDelete}
            title="Delete Subject"
            message={`Are you sure you want to delete ${subjectToDelete.name}? This will remove all CA scores forever.`}
            confirmText="Delete"
            onConfirm={() => handleDeleteSubject(subjectToDelete.id || subjectToDelete._id)}
            onClose={() => setSubjectToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal Dialog: Delete All Cards */}
      <AnimatePresence>
        {confirmDeleteAll && (
          <ConfirmationModal
            isOpen={confirmDeleteAll}
            title="Delete All Subjects"
            message="Are you sure you want to clear your entire semester board? This action is permanent and cannot be undone."
            confirmText="Delete All"
            onConfirm={handleDeleteAllSubjects}
            onClose={() => setConfirmDeleteAll(false)}
          />
        )}
      </AnimatePresence>

      {/* About Me Drawer Panel */}
      <AnimatePresence>
        {showAbout && (
          <AboutMePanel onClose={() => setShowAbout(false)} />
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) for mobile viewports */}
      <div className="fixed bottom-24 right-6 z-40 md:hidden select-none">
        <motion.button
          onClick={handleOpenCreateModal}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-xl hover:shadow-indigo-500/30 transition-all border border-indigo-400/20 active:scale-95 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-300 p-0"
          title="Add New Subject"
        >
          <div className="flex items-center justify-center h-full w-full">
            <Plus size={22} className="shrink-0" />
          </div>
        </motion.button>
      </div>

      {/* Bottom Navigation for mobile viewports */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-lg border-t border-slate-100/80 py-3.5 px-8 flex items-center justify-between shadow-[0_-8px_30px_rgb(0,0,0,0.06)] rounded-t-3xl select-none">
        
        {/* Dynamic Back / Reset Button */}
        <button
          onClick={() => {
            if (activeSubject) {
              setActiveSubject(null);
            } else if (searchQuery || performanceFilter !== 'all') {
              setSearchQuery('');
              setPerformanceFilter('all');
              addToast('Filters reset to default', 'success');
            } else {
              addToast('Already on Dashboard', 'success');
            }
          }}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-all duration-200 cursor-pointer group active:scale-95 py-1 px-3 rounded-xl hover:bg-slate-50"
        >
          <div className="p-0.5 transition-colors">
            <ArrowLeft size={18} className="text-slate-400 group-hover:text-indigo-600" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-sans group-hover:text-indigo-600">Back</span>
        </button>

        {/* Highly Highlighted About Me Section Button (Featuring easy-to-understand solid human profile logo) */}
        <button
          onClick={() => setShowAbout(true)}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 transition-all duration-200 cursor-pointer relative -mt-5 active:scale-95"
        >
          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 border-2 border-white hover:scale-105 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600/90 mt-1 font-sans">About Me</span>
        </button>

        {/* Feedback Section Button */}
        <button
          onClick={() => setShowFeedback(true)}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-all duration-200 cursor-pointer group active:scale-95 py-1 px-3 rounded-xl hover:bg-slate-50"
        >
          <div className="p-0.5 transition-colors">
            <MessageSquare size={18} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-sans group-hover:text-indigo-600">Feedback</span>
        </button>

      </div>

      {/* Feedback Modal Overlay */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackModal onClose={() => setShowFeedback(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
