import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, GraduationCap, Calculator, Award, Sparkles, RefreshCw, BarChart2, Search, Trash2, Edit3, AlertTriangle, Filter, ArrowUpDown, Terminal, MessageSquare, Download, FileText, Share2, X, ArrowLeft, User, Menu, Home, Settings, HelpCircle, ChevronRight, ChevronLeft, Clock, Calendar } from 'lucide-react';
import { Card, SyncStatus, Badge, CardProgressRing } from './components/UI';
import SubjectDetailsPanel from './components/SubjectDetailsPanel';
import DeveloperProfilePanel from './components/DeveloperProfilePanel';
import FeedbackModal from './components/FeedbackModal';
import CreateSubjectModal from './components/CreateSubjectModal';
import ConfirmationModal from './components/ConfirmationModal';
import DisclaimerModal from './components/DisclaimerModal';
import { ToastContainer } from './components/Toast';
import { calculateSubjectMarks } from './utils/calcEngine';
import { exportToCSV, exportToPDF } from './utils/exportUtils';

// Modular Subpages
import DashboardPage from './components/pages/DashboardPage';
import CAWeightagePage from './components/pages/CAWeightagePage';
import SubjectWisePage from './components/pages/SubjectWisePage';
import SemesterCGPAPage from './components/pages/SemesterCGPAPage';
import OverallCGPAPage from './components/pages/OverallCGPAPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import FormulasGradePage from './components/pages/FormulasGradePage';
import SettingsPage from './components/pages/SettingsPage';
import AboutDeveloperPage from './components/pages/AboutDeveloperPage';
import HistoryPage from './components/pages/HistoryPage';
import BunkPlannerPage from './components/pages/BunkPlannerPage';

const API_BASE_URL = 'http://localhost:5001/api';

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // History State
  const [historyList, setHistoryList] = useState(() => {
    const saved = localStorage.getItem('markflow-history');
    return saved ? JSON.parse(saved) : [];
  });

  // CA Sessions State
  const [recentCASessions, setRecentCASessions] = useState(() => {
    const saved = localStorage.getItem('markflow-recent-ca');
    return saved ? JSON.parse(saved) : [];
  });
  const [caToSubjectTransferData, setCaToSubjectTransferData] = useState(null);

  // Trash Bin State
  const [trashList, setTrashList] = useState(() => {
    const saved = localStorage.getItem('markflow-trash');
    return saved ? JSON.parse(saved) : [];
  });

  const [autoDeleteTrash, setAutoDeleteTrash] = useState(() => {
    return localStorage.getItem('markflow-trash-autodelete') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('markflow-trash', JSON.stringify(trashList));
  }, [trashList]);

  useEffect(() => {
    localStorage.setItem('markflow-trash-autodelete', autoDeleteTrash ? 'true' : 'false');
  }, [autoDeleteTrash]);

  // Effect to automatically delete items in Trash older than 10 days
  useEffect(() => {
    if (autoDeleteTrash && trashList.length > 0) {
      const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
      const filtered = trashList.filter(item => {
        const diff = Date.now() - new Date(item.deletedAt).getTime();
        return diff < tenDaysMs;
      });
      if (filtered.length !== trashList.length) {
        setTrashList(filtered);
      }
    }
  }, [autoDeleteTrash, trashList]);

  const addToTrash = (type, title, originalData) => {
    const trashItem = {
      id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type, // 'subject', 'ca_session', 'semester'
      title,
      deletedAt: new Date().toISOString(),
      originalData
    };
    setTrashList(prev => [trashItem, ...prev]);
  };

  const handleRestoreTrashItem = (item) => {
    if (item.type === 'subject') {
      const restored = [item.originalData, ...subjects];
      setSubjects(restored);
      saveToLocalStorage(restored);
      addToast(`Restored subject: ${item.originalData.name}`, 'success');
      if (backendConnected) {
        try {
          const { id, _id, ...cleanSubject } = item.originalData;
          fetch(`${API_BASE_URL}/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanSubject)
          });
        } catch (e) {
          console.error(e);
        }
      }
    } else if (item.type === 'ca_session') {
      setRecentCASessions(prev => {
        const updated = [item.originalData, ...prev];
        localStorage.setItem('markflow-recent-ca', JSON.stringify(updated));
        return updated;
      });
      addToast(`Restored CA session: ${item.originalData.name}`, 'success');
    } else if (item.type === 'semester') {
      setOverallSemesters(prev => [...prev, item.originalData]);
      addToast(`Restored semester: ${item.originalData.name}`, 'success');
    } else if (item.type === 'history_log') {
      setHistoryList(prev => {
        const updated = [item.originalData, ...prev];
        localStorage.setItem('markflow-history', JSON.stringify(updated));
        return updated;
      });
      addToast(`Restored activity log: ${item.originalData.title}`, 'success');
    }

    setTrashList(prev => prev.filter(t => t.id !== item.id));
  };

  const handlePermanentDeleteTrashItem = (itemId) => {
    setTrashList(prev => prev.filter(t => t.id !== itemId));
    addToast('Permanently deleted from Trash Bin', 'info');
  };

  const handleClearTrash = () => {
    setTrashList([]);
    addToast('Trash Bin cleared', 'info');
  };

  const handleSetSemesters = (updated) => {
    const nextSemesters = typeof updated === 'function' ? updated(overallSemesters) : updated;
    if (nextSemesters.length < overallSemesters.length) {
      const deletedItem = overallSemesters.find(oldSem => !nextSemesters.some(newSem => newSem.id === oldSem.id));
      if (deletedItem) {
        addToTrash('semester', `Semester: ${deletedItem.name}`, deletedItem);
      }
    }
    setOverallSemesters(nextSemesters);
  };

  const addRecentCASession = (session) => {
    setRecentCASessions(prev => {
      const updated = [session, ...prev];
      localStorage.setItem('markflow-recent-ca', JSON.stringify(updated));
      return updated;
    });
  };

  const handleNavigateToSubjectWiseFromCA = (caData) => {
    setCaToSubjectTransferData(caData);
    setActivePage('subject-wise');
  };

  const addHistoryItem = (type, title, summary, payload = {}) => {
    const newItem = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type,
      title,
      summary,
      timestamp: new Date().toISOString(),
      pinned: false,
      payload
    };
    setHistoryList(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem('markflow-history', JSON.stringify(updated));
      return updated;
    });
  };

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all'); // all, excellent, passing, needs_attention
  const [sortBy, setSortBy] = useState('highest'); // DEFAULT highest first

  // Modals & Panels triggers
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(() => {
    return localStorage.getItem('markflow_disclaimer_accepted') === 'true';
  });
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(() => {
    return localStorage.getItem('markflow_disclaimer_accepted') !== 'true';
  });

  // Router & Navigation states
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [caUnsaved, setCaUnsaved] = useState(false);
  const [subjectWiseUnsaved, setSubjectWiseUnsaved] = useState(false);
  const [semesterCGPAUnsaved, setSemesterCGPAUnsaved] = useState(false);
  const [pendingPage, setPendingPage] = useState(null);

  const handlePageChange = (targetPage) => {
    const hasUnsaved = (activePage === 'ca-weightage' && caUnsaved) || 
                       (activePage === 'subject-wise' && subjectWiseUnsaved) || 
                       (activePage === 'semester-cgpa' && semesterCGPAUnsaved);
    if (hasUnsaved) {
      setPendingPage(targetPage);
    } else {
      setActivePage(targetPage);
    }
  };

  const [globalTargetAttendance, setGlobalTargetAttendance] = useState(() => parseInt(localStorage.getItem('markflow-target-attendance')) || 75);

  useEffect(() => {
    localStorage.setItem('markflow-target-attendance', globalTargetAttendance);
  }, [globalTargetAttendance]);
  
  // Global Advanced Features Toggle state
  const [showAdvanced, setShowAdvanced] = useState(() => {
    return localStorage.getItem('markflow-show-advanced') === 'true';
  });

  const handleSetShowAdvanced = (val) => {
    setShowAdvanced(val);
    localStorage.setItem('markflow-show-advanced', val ? 'true' : 'false');
  };
  const [overallSemesters, setOverallSemesters] = useState(() => {
    try {
      const saved = localStorage.getItem('markflow-overall-semesters');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse overall semesters:", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('markflow-overall-semesters', JSON.stringify(overallSemesters));
  }, [overallSemesters]);
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

  // Mobile FAB Tooltip state & timer
  const [showTooltip, setShowTooltip] = useState(false);
  useEffect(() => {
    // Show tooltip initially after 2 seconds
    const initialTimeout = setTimeout(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    }, 2000);

    const interval = setInterval(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const addToast = (message, type = 'error') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenCreateModal = () => {
    const accepted = localStorage.getItem('markflow_disclaimer_accepted') === 'true';
    if (accepted) {
      setShowCreateModal(true);
    } else {
      setShowDisclaimerModal(true);
    }
  };

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('markflow_disclaimer_accepted', 'true');
    setHasAcceptedDisclaimer(true);
    setShowDisclaimerModal(false);
    addToast("Disclaimer accepted. Welcome to MarkFlow Academic OS! 🎉", "success");
  };

  // Keyboard Shortcut: Ctrl + S, Cmd + S, Alt/Option + S, or Cmd + Shift + S to open the Create Subject Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isSKey = e.key === 's' || e.key === 'S' || e.code === 'KeyS';
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

      if (hasModifier && isSKey) {
        // Prevent browser save dialog or option insertions
        e.preventDefault();
        e.stopPropagation();
        console.log('MarkFlow: Subject Creation Shortcut triggered successfully.');
        handleOpenCreateModal();
      }
    };

    // Listen on capture phase to beat native OS browser shortcuts
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

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

  // Register Service Worker for PWA/Offline Failover
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('MarkFlow PWA ServiceWorker registered with scope:', reg.scope))
          .catch(err => console.log('MarkFlow ServiceWorker registration failed:', err));
      });
    }
  }, []);

  // Proactive Route Check: Redirect mode=quick to Semester SGPA Page on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'quick') {
      setActivePage('semester-cgpa');
    }
  }, []);

  // 2. Add New Subject (Triggered after CreateSubjectModal passes strict checks)
  const handleCreateSubject = async (newSubjectData) => {
    // Optimistically update frontend state
    const tempId = 'temp_' + Date.now();
    const tempSubject = { ...newSubjectData, id: tempId };
    const updatedSubjects = [tempSubject, ...subjects];
    setSubjects(updatedSubjects);
    saveToLocalStorage(updatedSubjects);
    addToast('Subject created successfully', 'success');

    // Automatically Log to History
    addHistoryItem(
      'subject',
      'Subject Created',
      `Added ${newSubjectData.name} (${newSubjectData.code}) with credit limit ${newSubjectData.credits || 3}`,
      newSubjectData
    );

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
    const exists = subjects.some(s => s.id === updatedSubject.id);
    if (!exists) {
      const updatedList = [updatedSubject, ...subjects];
      setSubjects(updatedList);
      saveToLocalStorage(updatedList);

      addHistoryItem(
        'subject',
        'Subject Created',
        `Added ${updatedSubject.name} (${updatedSubject.code}) with credit limit ${updatedSubject.credits || 3}`,
        updatedSubject
      );
      addToast('Subject created successfully', 'success');

      if (backendConnected) {
        try {
          const { id, _id, ...cleanSubject } = updatedSubject;
          const res = await fetch(`${API_BASE_URL}/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanSubject)
          });
          
          if (res.ok) {
            const saved = await res.json();
            const resolved = updatedList.map(sub => 
              sub.id === updatedSubject.id ? { ...saved, id: saved._id || saved.id } : sub
            );
            setSubjects(resolved);
            saveToLocalStorage(resolved);
          } else {
            const errData = await res.json();
            addToast(errData.message || 'Error saving subject to database', 'error');
            const reverted = updatedList.filter(sub => sub.id !== updatedSubject.id);
            setSubjects(reverted);
            saveToLocalStorage(reverted);
          }
        } catch (err) {
          console.error('Error saving subject to MongoDB, keeping local version:', err);
        }
      }
      return;
    }

    const updatedList = subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s);
    setSubjects(updatedList);
    saveToLocalStorage(updatedList);

    // Automatically Log to History if attendance or score changed
    const original = subjects.find(s => s.id === updatedSubject.id);
    if (original) {
      if (original.attendance !== updatedSubject.attendance) {
        addHistoryItem(
          'attendance',
          'Attendance Updated',
          `${updatedSubject.name} (${updatedSubject.code}) attendance adjusted to ${updatedSubject.attendance}%`,
          { id: updatedSubject.id, attendance: updatedSubject.attendance }
        );
      } else {
        addHistoryItem(
          'predictions',
          'Subject Scores Computed',
          `Recalculated grade estimates and overall assessment metrics for ${updatedSubject.name}`,
          updatedSubject
        );
      }
    }

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
    const sub = subjects.find(s => s.id === id) || undoSubject;
    if (sub) {
      addToTrash('subject', `Subject: ${sub.name} (${sub.code})`, sub);
      addToast(`Subject deleted. You can restore it from the Trash Bin!`, 'info');
    }
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
    if (undoAllList) {
      undoAllList.forEach(sub => {
        addToTrash('subject', `Subject: ${sub.name} (${sub.code})`, sub);
      });
      addToast('All subjects deleted. You can restore them from the Trash Bin!', 'info');
    }
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
  const overallAverages = (subjects || []).map(sub => {
    if (!sub) return {};
    return {
      ...sub,
      metrics: calculateSubjectMarks(sub)
    };
  }).filter(s => s && s.code);
  
  const totalWeightage = overallAverages.reduce((sum, item) => sum + (item.metrics && parseFloat(item.metrics.weightedMarks) ? parseFloat(item.metrics.weightedMarks) : 0), 0);
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

  // Sidebar Navigation list
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={16} /> },
    { id: 'ca-weightage', label: 'CA Weightage', icon: <Calculator size={16} /> },
    { id: 'subject-wise', label: 'Subject-wise', icon: <GraduationCap size={16} /> },
    { id: 'bunk-planner', label: 'Bunk Planner', icon: <Calendar size={16} /> },
    { id: 'semester-cgpa', label: 'Semester SGPA', icon: <BookOpen size={16} /> },
    { id: 'overall-cgpa', label: 'Overall CGPA', icon: <Award size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
    { id: 'history', label: 'History', icon: <Clock size={16} /> },
    { id: 'formulas', label: 'Formulas & Grades', icon: <HelpCircle size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    { id: 'about', label: 'About Developer', icon: <User size={16} /> }
  ];

  // Callback to update includeInCGPA from SemesterCGPAPage
  const handleUpdateSubjectCGPAStatus = async (subId, include) => {
    const sub = subjects.find(s => (s.id || s._id) === subId);
    if (!sub) return;
    const updated = { ...sub, includeInCGPA: include };
    await handleSaveSubject(updated);
  };

  // Helper calculations for Overall CGPA Page import
  const includedSubjects = (subjects || []).filter(s => s && s.includeInCGPA !== false && s.code);
  const semesterCredits = includedSubjects.reduce((sum, s) => sum + (parseFloat(s.credits) || 3), 0);
  const getGradePoint = (percentage) => {
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 51) return 6;
    if (percentage >= 41) return 5;
    if (percentage === 40) return 4;
    return 0;
  };
  const semesterPoints = includedSubjects.reduce((sum, s) => {
    if (!s) return sum;
    const metrics = calculateSubjectMarks(s);
    const gp = getGradePoint(metrics?.percentage || 0);
    return sum + (gp * (parseFloat(s.credits) || 3));
  }, 0);
  const semesterSGPA = semesterCredits > 0 ? (semesterPoints / semesterCredits) : 0;

  const handleDeleteCASession = (id) => {
    const session = recentCASessions.find(s => s.id === id);
    setRecentCASessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('markflow-recent-ca', JSON.stringify(updated));
      return updated;
    });
    if (session) {
      addToTrash('ca_session', `CA Session: ${session.name} (${session.code})`, session);
    }
    addToast('CA Session deleted', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] font-sans text-slate-800 antialiased overflow-hidden">
      {/* Toast Notification System */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Desktop Left Sidebar Panel */}
      <aside 
        className={`hidden md:flex flex-col justify-between shrink-0 bg-slate-900 border-r border-slate-800 text-slate-400 select-none transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex flex-col">
          {/* Sidebar Brand Header */}
          <div className="p-5 flex items-center gap-3 border-b border-slate-800/60 h-16">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
              <GraduationCap size={20} />
            </div>
            {!sidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-left"
              >
                <h1 className="text-sm font-black text-white tracking-tight leading-none">MarkFlow</h1>
                <span className="text-[10px] font-bold text-slate-500 mt-1 block">Academic OS</span>
              </motion.div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5">
            {sidebarItems.map(item => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all transform hover:translate-x-1.5 hover:scale-[1.02] group relative cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/25 ${isActive ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/15' : 'hover:bg-slate-800/40 hover:text-white'}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarIndicator"
                      className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-indigo-200"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {item.label}
                    </motion.span>
                  )}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 bg-slate-900 border border-slate-800 text-white text-[10px] py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-lg whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Collapsible toggle footer */}
        <div className="p-3.5 border-t border-slate-800/60">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-slate-400 outline-none"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop shade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900"
            />
            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 bg-slate-900 border-r border-slate-800 text-slate-400 h-full flex flex-col justify-between"
            >
              <div>
                <div className="p-5 flex items-center justify-between border-b border-slate-800/60 h-16">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                      <GraduationCap size={18} />
                    </div>
                    <div className="text-left">
                      <h1 className="text-sm font-black text-white tracking-tight leading-none">MarkFlow</h1>
                      <span className="text-[10px] font-bold text-slate-500 mt-1 block font-sans">Academic OS</span>
                    </div>
                  </div>
                  <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <nav className="p-4 space-y-1.5">
                  {sidebarItems.map(item => {
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handlePageChange(item.id);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all transform hover:translate-x-1.5 duration-250 cursor-pointer relative ${isActive ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/15' : 'hover:bg-slate-800/40 hover:text-white'}`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-indigo-200" />
                        )}
                        <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-slate-800/60 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Designed for Simplicity</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Core Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen overflow-hidden">
        {/* Sticky Top Header */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-30 sticky top-0">
          <div className="flex items-center gap-2.5">
            {/* Logo for mobile */}
            <div className="flex md:hidden items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <GraduationCap size={16} />
              </div>
              <h1 className="text-xs font-black text-slate-800 tracking-tight leading-none">MarkFlow</h1>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                {sidebarItems.find(i => i.id === activePage)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {syncing && <RefreshCw size={13} className="animate-spin text-slate-400" />}
            <SyncStatus isConnected={backendConnected} />
            
            <button
              onClick={() => setShowFeedback(true)}
              className="flex h-8 px-3.5 rounded-xl border border-slate-200 hover:border-indigo-100 hover:bg-indigo-50/10 text-slate-500 hover:text-indigo-600 items-center gap-1.5 text-[10px] font-black uppercase tracking-wider shadow-soft-sm cursor-pointer outline-none transition-all"
            >
              <MessageSquare size={13} />
              <span>Feedback</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Body Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin">
          <div className="max-w-6xl mx-auto pb-24 md:pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {activePage === 'dashboard' && (
                  <DashboardPage 
                    subjects={overallAverages}
                    onNavigate={handlePageChange}
                    semesters={overallSemesters}
                  />
                )}
                
                {activePage === 'ca-weightage' && (
                  <CAWeightagePage 
                    recentCASessions={recentCASessions}
                    setCaUnsaved={setCaUnsaved}
                    onSaveCASession={(session) => {
                      addRecentCASession(session);
                      addHistoryItem(
                        'ca',
                        'CA Weightage Calculated',
                        `Quick calculation for ${session.code || 'Unknown'}`
                      );
                      addToast('CA Session Saved', 'success');
                    }}
                    onNavigateToSubjectWise={handleNavigateToSubjectWiseFromCA}
                    onDeleteCASession={handleDeleteCASession}
                    addToast={addToast}
                  />
                )}
                
                {activePage === 'subject-wise' && (
                  <SubjectWisePage 
                    subjects={subjects}
                    onSaveSubject={handleSaveSubject}
                    onDeleteSubject={handleDeleteSubject}
                    handleOpenCreateModal={handleOpenCreateModal}
                    transferData={caToSubjectTransferData}
                    clearTransferData={() => setCaToSubjectTransferData(null)}
                    undoSubject={undoSubject}
                    undoSubjectTimer={undoSubjectTimer}
                    onUndoSubjectDelete={handleUndoSubjectDelete}
                    addToast={addToast}
                    setSubjectWiseUnsaved={setSubjectWiseUnsaved}
                  />
                )}

                {activePage === 'bunk-planner' && (
                  <BunkPlannerPage 
                    subjects={subjects}
                    onSaveSubject={handleSaveSubject}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={handleSetShowAdvanced}
                    targetAttendance={globalTargetAttendance}
                    setTargetAttendance={setGlobalTargetAttendance}
                  />
                )}

                {activePage === 'semester-cgpa' && (
                  <SemesterCGPAPage 
                    subjects={subjects}
                    onUpdateCGPAStatus={handleUpdateSubjectCGPAStatus}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={handleSetShowAdvanced}
                    addToast={addToast}
                    semesters={overallSemesters}
                    setSemesters={handleSetSemesters}
                    setSemesterCGPAUnsaved={setSemesterCGPAUnsaved}
                  />
                )}

                {activePage === 'overall-cgpa' && (
                  <OverallCGPAPage 
                    currentSemesterSGPA={semesterSGPA}
                    currentSemesterCredits={semesterCredits}
                    semesters={overallSemesters}
                    setSemesters={handleSetSemesters}
                  />
                )}

                {activePage === 'analytics' && (
                  <AnalyticsPage 
                    subjects={overallAverages}
                    semesters={overallSemesters}
                  />
                )}

                {activePage === 'history' && (
                  <HistoryPage 
                    historyList={historyList}
                    trashList={trashList}
                    onRestoreTrashItem={handleRestoreTrashItem}
                    onPermanentDeleteTrashItem={handlePermanentDeleteTrashItem}
                    onClearTrash={handleClearTrash}
                    autoDeleteTrash={autoDeleteTrash}
                    onToggleAutoDeleteTrash={() => setAutoDeleteTrash(!autoDeleteTrash)}
                    onDeleteItem={(id) => {
                      const log = historyList.find(h => h.id === id);
                      const updated = historyList.filter(h => h.id !== id);
                      setHistoryList(updated);
                      localStorage.setItem('markflow-history', JSON.stringify(updated));
                      if (log) {
                        addToTrash('history_log', `Activity Log: ${log.title}`, log);
                        addToast(`Activity log deleted. You can restore it from the Trash Bin!`, 'info');
                      }
                    }}
                    onClearAll={() => {
                      if (historyList.length > 0) {
                        historyList.forEach(log => {
                          addToTrash('history_log', `Activity Log: ${log.title}`, log);
                        });
                        addToast(`All activity logs deleted. You can restore them from the Trash Bin!`, 'info');
                      }
                      setHistoryList([]);
                      localStorage.setItem('markflow-history', JSON.stringify([]));
                      localStorage.removeItem('markflow-draft-caCount');
                      localStorage.removeItem('markflow-draft-totalMarksPerCA');
                      localStorage.removeItem('markflow-draft-weightage');
                      localStorage.removeItem('markflow-draft-selectionLogic');
                      localStorage.removeItem('markflow-draft-assessments');
                    }}
                    onTogglePin={(id) => {
                      const updated = historyList.map(h => h.id === id ? { ...h, pinned: !h.pinned } : h);
                      setHistoryList(updated);
                      localStorage.setItem('markflow-history', JSON.stringify(updated));
                    }}
                    onRecalculate={(item) => {
                      if (item.type === 'ca') {
                        setActivePage('ca-weightage');
                      } else {
                        setActivePage('subject-wise');
                      }
                    }}
                    onNavigate={(page) => setActivePage(page)}
                  />
                )}

                {activePage === 'formulas' && (
                  <FormulasGradePage />
                )}

                {activePage === 'settings' && (
                  <SettingsPage 
                    subjects={subjects}
                    onDeleteAllSubjects={triggerDeleteAllProcess}
                    overallPercentage={overallPercentage}
                    totalWeightage={totalWeightage}
                    maxPossibleWeightage={maxPossibleWeightage}
                    targetAttendance={globalTargetAttendance}
                    setTargetAttendance={setGlobalTargetAttendance}
                  />
                )}

                {activePage === 'about' && (
                  <AboutDeveloperPage />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden backdrop-blur-md bg-slate-950/80 border-t border-slate-800/80 px-4 h-16 flex items-center justify-around select-none">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
          { id: 'ca-weightage', label: 'CA Calc', icon: <Calculator size={18} /> },
          { id: 'subject-wise', label: 'Subject', icon: <GraduationCap size={18} /> },
          { id: 'bunk-planner', label: 'Bunk Plan', icon: <Calendar size={18} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
        ].map(item => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] transition-all cursor-pointer ${
                isActive ? 'text-indigo-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{item.icon}</span>
              <span className="text-[9px] mt-1 tracking-wider uppercase font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Modals & Dialogs */}
      
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

      {/* Feedback Modal Overlay */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackModal onClose={() => setShowFeedback(false)} />
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
                    addHistoryItem('exports', 'Report Exported (PDF)', 'Continuous assessment data exported as PDF report');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-200 hover:bg-indigo-50/20 text-indigo-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Download PDF Report</span>
                </button>
                
                <button
                  onClick={() => {
                    exportToCSV(subjects, { overallPercentage, totalWeightage, maxPossibleWeightage });
                    addHistoryItem('exports', 'Report Exported (CSV)', 'Continuous assessment data exported as CSV worksheet');
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

      {/* Confirmation Modal Dialog: Unsaved Changes Sidebar Exits */}
      <AnimatePresence>
        {pendingPage && (
          <ConfirmationModal
            isOpen={!!pendingPage}
            variant="danger"
            title={
              activePage === 'ca-weightage' ? "Unsaved CA Marks" :
              activePage === 'subject-wise' ? "Unsaved Subject Marks" :
              "Unsaved Semester Records"
            }
            message={
              activePage === 'ca-weightage' ? "You have unsaved CA calculation marks! We highly recommend clicking 'Save & Close' first, otherwise you will lose this data. Are you sure you want to leave?" :
              activePage === 'subject-wise' ? "You have unsaved subject calculation details! We highly recommend clicking 'Save Subject' first, otherwise you will lose this data. Are you sure you want to leave?" :
              "You have unsaved semester calculations or sandbox rows configured! We highly recommend clicking 'Save & Close Record' first, otherwise you will lose this data. Are you sure you want to leave?"
            }
            confirmText="Leave Page"
            cancelText="Stay Here"
            onConfirm={() => {
              setCaUnsaved(false);
              setSubjectWiseUnsaved(false);
              setSemesterCGPAUnsaved(false);
              setActivePage(pendingPage);
              setPendingPage(null);
            }}
            onClose={() => setPendingPage(null)}
          />
        )}
      </AnimatePresence>
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

      {/* Usage Disclaimer Agreement Modal overlay */}
      <AnimatePresence>
        {showDisclaimerModal && (
          <DisclaimerModal
            isOpen={showDisclaimerModal}
            onAccept={handleAcceptDisclaimer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
