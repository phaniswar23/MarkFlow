import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../UI';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  HelpCircle, 
  AlertCircle, 
  ClipboardList, 
  GraduationCap, 
  Target, 
  Percent, 
  Sliders,
  Shield,
  Activity,
  Award,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  X,
  RefreshCw,
  Download,
  Image,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportElement } from '../../utils/exportUtils';
import { calculateSubjectMarks } from '../../utils/calcEngine';

export default function SemesterCGPAPage({ subjects, onUpdateCGPAStatus, addToast, showAdvanced, setShowAdvanced, semesters = [], setSemesters, setSemesterCGPAUnsaved }) {
  const [activeMode, setActiveMode] = useState('quick'); // 'quick' or 'detailed'
  const quickInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'quick') {
      setActiveMode('quick');
      setTimeout(() => {
        if (quickInputRef.current) {
          quickInputRef.current.focus();
        }
      }, 150);
    }
  }, []);

  const [copied, setCopied] = useState(false);

  const handleShareInvite = () => {
    const inviteLink = window.location.origin + "/?mode=quick";
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      if (addToast) {
        addToast("Quick calculator link copied successfully! Share it with your friends.", "success");
      }
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy link:", err);
      if (addToast) addToast("Failed to copy calculator link. Please try again.", "error");
    });
  };
  
  const [savedCalculations, setSavedCalculations] = useState(() => {
    try {
      const saved = localStorage.getItem('markflow-saved-calculations');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse saved calculations:", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('markflow-saved-calculations', JSON.stringify(savedCalculations));
  }, [savedCalculations]);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showOverallModal, setShowOverallModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [modalSemesterNumber, setModalSemesterNumber] = useState('');
  const [modalCustomLabel, setModalCustomLabel] = useState('');

  // Sandbox Modal States
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [editingSandboxId, setEditingSandboxId] = useState(null);
  const [sandboxFormError, setSandboxFormError] = useState('');
  const [sandboxForm, setSandboxForm] = useState({
    name: '',
    code: '',
    credits: 3,
    inputMode: 'simple',
    grade: 'A',
    attendance: 85,
    attendanceWeight: 5,
    caObt: '',
    caTot: 30,
    caWeight: 30,
    midObt: '',
    midTot: 30,
    midWeight: 20,
    midApplicable: true,
    endObt: '',
    endTot: 100,
    endWeight: 50,
    endApplicable: true
  });

  // Undo States
  const [undoActive, setUndoActive] = useState(false);
  const [undoTimer, setUndoTimer] = useState(0);
  const [undoMessage, setUndoMessage] = useState('');
  const [undoActionType, setUndoActionType] = useState(null); // 'delete_calculation' or 'add_overall'
  const [undoPayload, setUndoPayload] = useState(null);
  const undoRef = useRef(null);

  useEffect(() => {
    if (undoActive && undoTimer > 0) {
      undoRef.current = setTimeout(() => {
        setUndoTimer(prev => prev - 1);
      }, 1000);
    } else if (undoActive && undoTimer === 0) {
      setUndoActive(false);
      setUndoActionType(null);
      setUndoPayload(null);
    }
    return () => clearTimeout(undoRef.current);
  }, [undoActive, undoTimer]);

  const handleOpenSaveModal = () => {
    setModalSemesterNumber('');
    setModalCustomLabel('');
    setShowSaveModal(true);
  };

  const handleOpenOverallModal = () => {
    setModalSemesterNumber('');
    setModalCustomLabel('');
    setShowOverallModal(true);
  };

  const handleConfirmSave = () => {
    if (!modalSemesterNumber) {
      if (addToast) addToast("Semester number is mandatory!", "error");
      return;
    }
    const newRecord = {
      id: 'save_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      semesterNumber: parseInt(modalSemesterNumber),
      customLabel: modalCustomLabel,
      sgpa: finalSGPA,
      credits: totalCredits,
      numSubjects: activeRows.length,
      addedToOverall: false,
      mode: activeMode,
      subjectsData: JSON.parse(JSON.stringify(activeRows)),
      timestamp: new Date().toLocaleDateString()
    };
    setSavedCalculations([newRecord, ...savedCalculations]);
    setShowSaveModal(false);
    if (addToast) addToast("Calculation saved successfully!", "success");
  };

  const handleConfirmOverall = () => {
    if (!modalSemesterNumber) {
      if (addToast) addToast("Semester number is mandatory!", "error");
      return;
    }
    const semNum = parseInt(modalSemesterNumber);
    const targetName = `Semester ${semNum}`;
    
    // Check if duplicate in Overall CGPA
    if (semesters && semesters.some(s => s.name.toLowerCase() === targetName.toLowerCase() || s.id === `quick_sem_${semNum}`)) {
      if (addToast) addToast(`Semester ${semNum} already exists in Overall CGPA!`, "error");
      return;
    }

    // Add to Overall CGPA
    const newSem = {
      id: `quick_sem_${semNum}`,
      name: targetName,
      sgpa: Math.round(finalSGPA * 100) / 100,
      credits: totalCredits || 20
    };

    setSemesters([...(semesters || []), newSem]);

    // Also save as card in SemesterCGPAPage
    const newRecord = {
      id: `quick_sem_${semNum}`,
      semesterNumber: semNum,
      customLabel: modalCustomLabel || "Added to Overall CGPA",
      sgpa: finalSGPA,
      credits: totalCredits,
      numSubjects: activeRows.length,
      addedToOverall: true,
      mode: activeMode,
      subjectsData: JSON.parse(JSON.stringify(activeRows)),
      timestamp: new Date().toLocaleDateString()
    };

    setSavedCalculations([newRecord, ...savedCalculations]);
    setShowOverallModal(false);

    // Setup 5-second Undo
    setUndoPayload({
      addedId: `quick_sem_${semNum}`,
      recordId: newRecord.id
    });
    setUndoActionType('add_overall');
    setUndoMessage(`Semester ${semNum} added to Overall CGPA.`);
    setUndoTimer(5);
    setUndoActive(true);

    if (addToast) addToast(`Added Semester ${semNum} to Overall CGPA successfully!`, "success");
  };

  const handleDeleteCalculation = (record) => {
    const idx = savedCalculations.findIndex(c => c.id === record.id);
    if (idx === -1) return;

    const originalList = [...savedCalculations];
    const removedItem = savedCalculations[idx];

    // Remove locally
    const updated = savedCalculations.filter(c => c.id !== record.id);
    setSavedCalculations(updated);

    // If added to Overall CGPA, remove it from Overall CGPA semesters too
    let removedSem = null;
    if (record.addedToOverall) {
      removedSem = semesters.find(s => s.id === record.id || s.name === `Semester ${record.semesterNumber}`);
      if (removedSem) {
        setSemesters(prev => prev.filter(s => s.id !== removedSem.id));
      }
    }

    // Setup 5-second Undo
    setUndoPayload({
      index: idx,
      deletedItem: removedItem,
      removedSem: removedSem
    });
    setUndoActionType('delete_calculation');
    setUndoMessage(`Saved record for Semester ${record.semesterNumber} deleted.`);
    setUndoTimer(5);
    setUndoActive(true);

    if (addToast) addToast(`Deleted Semester ${record.semesterNumber} record.`, "info");
  };

  const handleUndo = () => {
    if (undoActionType === 'delete_calculation') {
      const restoredItem = undoPayload.deletedItem;
      const updated = [...savedCalculations];
      updated.splice(undoPayload.index, 0, restoredItem);
      setSavedCalculations(updated);

      // Restore in Overall CGPA if it was added there
      if (restoredItem.addedToOverall && undoPayload.removedSem) {
        setSemesters(prev => [...prev, undoPayload.removedSem]);
      }
      if (addToast) addToast("Deletion undone! Record restored.", "success");
    } else if (undoActionType === 'add_overall') {
      // Remove from Overall CGPA
      setSemesters(prev => prev.filter(s => s.id !== undoPayload.addedId));
      // Remove local saved card
      setSavedCalculations(prev => prev.filter(c => c.id !== undoPayload.recordId));
      if (addToast) addToast("Added Semester removed from Overall CGPA.", "info");
    }
    setUndoActive(false);
    setUndoTimer(0);
    setUndoActionType(null);
    setUndoPayload(null);
  };

  const isSemAdded = (semNum) => {
    if (!semNum) return false;
    return Array.isArray(semesters) && semesters.some(s => s && (s.id === `quick_sem_${semNum}` || s.name === `Semester ${semNum}`));
  };
  
  // Quick Mode States
  const [numSubjects, setNumSubjects] = useState('');
  const [quickRows, setQuickRows] = useState([]);
  const [quickErrors, setQuickErrors] = useState({});
  const [quickCalculated, setQuickCalculated] = useState(false);

  // Detailed Mode States
  const [sandboxRows, setSandboxRows] = useState([]);
  const [detailedNumSubjects, setDetailedNumSubjects] = useState('');
  const [detailedCalculated, setDetailedCalculated] = useState(false);

  useEffect(() => {
    if (setSemesterCGPAUnsaved) {
      const hasUnsavedData = 
        (quickRows && quickRows.length > 0) || 
        (sandboxRows && sandboxRows.length > 0) || 
        (numSubjects !== undefined && numSubjects !== '') || 
        (detailedNumSubjects !== undefined && detailedNumSubjects !== '');
      setSemesterCGPAUnsaved(hasUnsavedData);
    }
  }, [quickRows, sandboxRows, numSubjects, detailedNumSubjects, setSemesterCGPAUnsaved]);

  useEffect(() => {
    return () => {
      if (setSemesterCGPAUnsaved) {
        setSemesterCGPAUnsaved(false);
      }
    };
  }, [setSemesterCGPAUnsaved]);

  // Sandbox Target Optimizer State
  const [targetSGPA, setTargetSGPA] = useState(8.5);

  // Advanced Mode Past Semester Inputs
  const [sem1SGPA, setSem1SGPA] = useState('');
  const [sem2SGPA, setSem2SGPA] = useState('');

  // Grade points mappings
  const gradePoints = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'D': 4, 'Fail': 0
  };

  // Reverse mapping for Grade Booster advisor
  const nextGradeMap = {
    'Fail': 'D', 'D': 'C', 'C': 'B', 'B': 'B+', 'B+': 'A', 'A': 'A+', 'A+': 'O'
  };

  const getAttendancePoints = (percentage, weightage) => {
    const score = parseFloat(percentage || 0);
    const weight = parseFloat(weightage || 5);
    let mult = 0;
    if (score >= 90) mult = 1.0;
    else if (score >= 85) mult = 0.8;
    else if (score >= 80) mult = 0.6;
    else if (score >= 75) mult = 0.4;
    return mult * weight;
  };

  const getGradeLetter = (score) => {
    if (score >= 90) return 'O';
    if (score >= 80) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B+';
    if (score >= 51) return 'B';
    if (score >= 41) return 'C';
    if (score === 40) return 'D';
    return 'Fail';
  };

  const resolveGradePoints = (weightageInput) => {
    if (!weightageInput) return 0;
    const trimmed = String(weightageInput).trim();
    // If numeric percentage (e.g. 85, 92, 76)
    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
      const letter = getGradeLetter(num);
      return gradePoints[letter] || 0;
    }
    // If letter grade entered directly (e.g. 'O', 'A+')
    const upper = trimmed.toUpperCase();
    return gradePoints[upper] !== undefined ? gradePoints[upper] : 0;
  };

  const getGradeLetterFromPoints = (points) => {
    const gp = Math.round(points);
    const entry = Object.entries(gradePoints).find(([k, v]) => v === gp);
    return entry ? entry[0] : 'Fail';
  };

  // Sync with active logged subjects initially for Detailed Mode
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const filtered = subjects.filter(sub => sub.includeInCGPA !== false);
      const initial = filtered.map(sub => {
        const attWeightageLimit = 5;
        const caWeightageLimit = 25;
        const midWeightageLimit = 20;
        const endWeightageLimit = 50;

        const roundValue = (val) => Math.round(val * 10) / 10;

        // 1. Attendance proportional score
        const attObtVal = roundValue((parseFloat(sub.attendance || 0) / 100) * attWeightageLimit);

        // 2. CA proportional score using calcEngine calculateSubjectMarks
        const subCaWeight = parseFloat(sub.weightage) || 25;
        const caMetrics = calculateSubjectMarks(sub);
        const caObtVal = roundValue(subCaWeight > 0 ? (caMetrics.weightedMarks / subCaWeight) * caWeightageLimit : 0);

        // 3. Midterm proportional score
        const midTot = parseFloat(sub.midtermTotal) || 30;
        const midObtVal = roundValue(midTot > 0 ? (parseFloat(sub.midtermObtained || 0) / midTot) * midWeightageLimit : 0);

        // 4. End Sem proportional score
        const endTot = parseFloat(sub.endSemTotal) || 100;
        const endObtVal = roundValue(endTot > 0 ? (parseFloat(sub.endSemObtained || 0) / endTot) * endWeightageLimit : 0);

        const marksData = {
          attendance: attObtVal,
          attendanceWeight: attWeightageLimit,
          caObt: caObtVal,
          caTot: 30,
          caWeight: caWeightageLimit,
          midObt: midObtVal,
          midTot: 30,
          midWeight: midWeightageLimit,
          midApplicable: sub.midtermApplicable !== false,
          endObt: endObtVal,
          endTot: 100,
          endWeight: endWeightageLimit,
          endApplicable: sub.endSemApplicable !== false
        };

        const tempRow = {
          id: sub.id || sub._id || Math.random().toString(),
          name: sub.name,
          code: sub.code,
          credits: parseFloat(sub.credits) || 3,
          marksData: marksData,
          isDbSubject: true
        };

        return {
          ...tempRow,
          grade: calculateSandboxRowGrade(tempRow)
        };
      });
      setSandboxRows(initial);
    } else {
      setSandboxRows([]);
    }
  }, [subjects]);

  // Quick Mode Handlers
  const handleNumSubjectsChange = (numStr) => {
    setNumSubjects(numStr);
    const n = Math.max(0, parseInt(numStr) || 0);
    const newRows = [];
    for (let i = 1; i <= n; i++) {
      newRows.push({
        id: Math.random().toString(),
        name: `Course ${i}`,
        code: `C${i}`,
        credits: '',
        weightage: ''
      });
    }
    setQuickRows(newRows);
    setQuickErrors({});
    setQuickCalculated(false);
  };

  const handleQuickRowChange = (id, field, value) => {
    setQuickCalculated(false);
    const updated = quickRows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setQuickRows(updated);

    // Clear error inline when they enter/type
    if (quickErrors[id]?.[field]) {
      setQuickErrors(prev => {
        const next = { ...prev };
        if (next[id]) {
          delete next[id][field];
          if (Object.keys(next[id]).length === 0) delete next[id];
        }
        return next;
      });
    }
  };

  const handleQuickCalculate = () => {
    const errs = {};
    let isValid = true;

    quickRows.forEach((row) => {
      const rowErrs = {};
      if (row.credits === '') {
        rowErrs.credits = "Credits required";
        isValid = false;
      }
      if (row.weightage === '') {
        rowErrs.weightage = "Weightage required";
        isValid = false;
      }
      if (Object.keys(rowErrs).length > 0) {
        errs[row.id] = rowErrs;
      }
    });

    setQuickErrors(errs);

    if (!isValid) {
      if (addToast) {
        addToast("Please fill in all required credits and weightages first", "error");
      }
      return;
    }

    setQuickCalculated(true);
  };

  // Detailed Mode Handlers
  const calculateSandboxRowGrade = (row) => {
    if (!row) return 'Pending';
    if (!detailedCalculated && !row.isDbSubject) return 'Pending';
    const m = row.marksData || {};
    
    const hasAnyMarks = (m.attendance !== '' && m.attendance !== undefined && m.attendance !== null) ||
                         (m.caObt !== '' && m.caObt !== undefined && m.caObt !== null) || 
                         (m.midApplicable && m.midObt !== '' && m.midObt !== undefined && m.midObt !== null) || 
                         (m.endApplicable && m.endObt !== '' && m.endObt !== undefined && m.endObt !== null);
    if (!hasAnyMarks) return 'Pending';

    const obtained = parseFloat(m.attendance || 0) + 
                     parseFloat(m.caObt || 0) + 
                     (m.midApplicable ? parseFloat(m.midObt || 0) : 0) + 
                     (m.endApplicable ? parseFloat(m.endObt || 0) : 0);

    return getGradeLetter(obtained);
  };

  const handleDetailedNumSubjectsChange = (numStr) => {
    setDetailedNumSubjects(numStr);
    const n = Math.max(0, parseInt(numStr) || 0);
    const newRows = [];
    for (let i = 1; i <= n; i++) {
      newRows.push({
        id: 'sandbox_' + i + '_' + Date.now(),
        name: `Subject ${i}`,
        code: `SUB${100 + i}`,
        credits: 3,
        inputMode: 'marks',
        grade: 'A',
        expanded: i === 1,
        marksData: {
          attendance: '',
          attendanceWeight: '',
          caObt: '',
          caTot: 30,
          caWeight: '',
          midObt: '',
          midTot: 30,
          midWeight: '',
          midApplicable: true,
          endObt: '',
          endTot: 100,
          endWeight: '',
          endApplicable: true
        }
      });
    }
    setSandboxRows(newRows);
    setDetailedErrors({});
    setDetailedCalculated(false);
  };

  const handleDetailedFieldChange = (rowId, field, subfield, value) => {
    if (subfield && subfield !== 'midApplicable' && subfield !== 'endApplicable') {
      setDetailedCalculated(false);
    }
    const updated = sandboxRows.map(row => {
      if (row.id === rowId) {
        if (subfield) {
          const val = subfield === 'midApplicable' || subfield === 'endApplicable' ? value : value;
          const updatedMarks = { 
            ...row.marksData, 
            [subfield]: val 
          };
          const updatedRow = { ...row, marksData: updatedMarks };
          updatedRow.grade = calculateSandboxRowGrade(updatedRow);
          return updatedRow;
        } else {
          const updatedRow = { ...row, [field]: value };
          if (field === 'credits') {
            updatedRow.credits = parseFloat(value) || 0;
          }
          updatedRow.grade = calculateSandboxRowGrade(updatedRow);
          return updatedRow;
        }
      }
      return row;
    });
    setSandboxRows(updated);
  };

  const handleDetailedRemoveRow = (id) => {
    const targetRow = sandboxRows.find(row => row.id === id);
    if (targetRow && targetRow.isDbSubject && onUpdateCGPAStatus) {
      onUpdateCGPAStatus(id, false);
    } else {
      setSandboxRows(sandboxRows.filter(row => row.id !== id));
    }
  };


  // Aggregate values based on active mode
  let totalCredits = 0;
  let totalGradePoints = 0;
  const activeRows = activeMode === 'quick' ? quickRows : sandboxRows;
  const calculated = activeMode === 'quick' ? quickCalculated : detailedCalculated;

  if (activeMode === 'quick') {
    if (quickCalculated) {
      totalCredits = quickRows.reduce((sum, r) => sum + (parseFloat(r.credits) || 0), 0);
      totalGradePoints = quickRows.reduce((sum, r) => {
        const gp = resolveGradePoints(r.weightage);
        return sum + (gp * (parseFloat(r.credits) || 0));
      }, 0);
    }
  } else {
    if (detailedCalculated) {
      totalCredits = sandboxRows.reduce((sum, r) => sum + (parseFloat(r.credits) || 0), 0);
      totalGradePoints = sandboxRows.reduce((sum, r) => {
        const activeGrade = calculateSandboxRowGrade(r);
        const gp = gradePoints[activeGrade] || 0;
        return sum + (gp * (parseFloat(r.credits) || 0));
      }, 0);
    }
  }

  const finalSGPA = totalCredits > 0 ? (totalGradePoints / totalCredits) : 0;

  // SGPA to Percentage Converter (Standard scale: (SGPA - 0.75) * 10)
  const convertedPercentage = finalSGPA > 0 ? Math.max(0, (finalSGPA - 0.75) * 10) : 0;

  const allPending = activeMode === 'detailed' && sandboxRows.length > 0 && sandboxRows.every(r => calculateSandboxRowGrade(r) === 'Pending');

  let gpaIndicator = 'Average';
  let indicatorColor = 'text-amber-500';
  if (allPending) {
    gpaIndicator = 'Awaiting Marks';
    indicatorColor = 'text-slate-400';
  } else if (finalSGPA >= 9.0) {
    gpaIndicator = 'Outstanding';
    indicatorColor = 'text-indigo-600';
  } else if (finalSGPA >= 8.0) {
    gpaIndicator = 'Excellent';
    indicatorColor = 'text-emerald-500';
  } else if (finalSGPA < 5.0 && totalCredits > 0) {
    gpaIndicator = 'Needs Attention';
    indicatorColor = 'text-rose-500';
  }

  // Count backlogs
  const backlogCount = activeMode === 'quick' 
    ? quickRows.filter(r => resolveGradePoints(r.weightage) === 0 && quickCalculated).length
    : sandboxRows.filter(r => calculateSandboxRowGrade(r) === 'Fail').length;

  // Find High-Credit subjects (Credits >= 4)
  const highCreditSubjects = activeRows.filter(r => (parseFloat(r.credits) || 0) >= 4);

  // Grade Booster calculation
  const getBoosterAdvice = () => {
    if (!calculated || totalCredits === 0) return null;
    
    let bestIncrease = 0;
    let bestSubjectName = '';
    let fromGrade = '';
    let toGrade = '';

    activeRows.forEach(row => {
      let currentPoints = 0;
      let currentGradeLetter = '';

      if (activeMode === 'quick') {
        currentPoints = resolveGradePoints(row.weightage);
        currentGradeLetter = isNaN(parseFloat(row.weightage)) ? String(row.weightage).trim().toUpperCase() : getGradeLetterFromPoints(currentPoints);
      } else {
        const activeGrade = calculateSandboxRowGrade(row);
        currentPoints = gradePoints[activeGrade] || 0;
        currentGradeLetter = activeGrade;
      }

      if (currentPoints < 10) {
        const nextGradeLetter = nextGradeMap[currentGradeLetter] || 'O';
        const nextPoints = gradePoints[nextGradeLetter] || 10;
        const ptsDiff = nextPoints - currentPoints;
        const rowCredits = parseFloat(row.credits) || 0;
        
        // Potential GP increase = ptsDiff * credits
        const hypotheticalGP = totalGradePoints + (ptsDiff * rowCredits);
        const hypoSGPA = hypotheticalGP / totalCredits;
        const sgpaIncrease = hypoSGPA - finalSGPA;

        if (sgpaIncrease > bestIncrease) {
          bestIncrease = sgpaIncrease;
          bestSubjectName = row.name || 'Untitled Subject';
          fromGrade = currentGradeLetter;
          toGrade = nextGradeLetter;
        }
      }
    });

    if (bestIncrease > 0) {
      return {
        subjectName: bestSubjectName,
        fromGrade,
        toGrade,
        increase: bestIncrease,
        targetSGPA: finalSGPA + bestIncrease
      };
    }

    return null;
  };

  const handleExport = (type) => {
    if (!calculated) {
      if (addToast) {
        addToast("Please complete your SGPA calculation first before exporting!", "error");
      } else {
        alert("Please complete your SGPA calculation first before exporting!");
      }
      return;
    }
    exportElement('semester-calc-container', type, `MarkFlow_Semester_SGPA_${new Date().toISOString().slice(0, 10)}`);
  };

  const boosterAdvice = getBoosterAdvice();

  return (
    <div id="semester-calc-container" className="space-y-6 text-left select-none animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Semester SGPA Calculator</span>
            <Sparkles size={16} className="text-indigo-400 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Compute your current semester's grade points using the super-fast Quick Mode or detailed Academic Sandbox Board.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              showAdvanced 
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm animate-pulse-once' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sliders size={12} />
            {showAdvanced ? 'Disable Advanced Features' : 'Enable Advanced Features'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            title="Download a comprehensive PDF report of your semester results and GPA details"
          >
            <Download size={12} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => handleExport('png')}
            className="px-4 py-2.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            title="Save your SGPA calculator board as a PNG image card to share or keep"
          >
            <Image size={12} />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* MODE SELECTOR TOGGLE TABS */}
      <div className="flex bg-slate-100/80 border border-slate-200/40 p-1 rounded-2xl max-w-md shadow-inner-sm">
        <button
          onClick={() => setActiveMode('quick')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeMode === 'quick'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/20'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Quick Calculation
        </button>
        <button
          onClick={() => setActiveMode('detailed')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeMode === 'detailed'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/20'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Detailed Semester Calculation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: ACTIVE MODE CALCULATOR */}
        <div className="lg:col-span-8 flex flex-col justify-start space-y-6">
          
          {/* MODE 1: QUICK CALCULATION */}
          {activeMode === 'quick' && (
            <Card className="!p-6 flex-1 flex flex-col justify-between bg-white border border-slate-100 rounded-3xl shadow-soft-sm">
              <div className="space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList size={12} className="text-slate-400" />
                      Step 1: Enter Number of Subjects
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Generates clean sandbox rows dynamically for instant estimation.</p>
                  </div>

                  <button
                    onClick={handleShareInvite}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      copied 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm animate-pulse' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 hover:scale-[1.02]'
                    }`}
                    title="Copy calculator link to share the instant calculator with friends"
                  >
                    {copied ? (
                      <>
                        <span>✓ Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={11} />
                        <span>Share Calculator</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="max-w-xs space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Number of Subjects</label>
                  <input
                    ref={quickInputRef}
                    type="number"
                    min="1"
                    max="15"
                    placeholder="e.g. 5"
                    value={numSubjects}
                    onChange={(e) => handleNumSubjectsChange(e.target.value)}
                    className="w-full px-4 py-3.5 text-xs bg-slate-50 border border-slate-250 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700 shadow-inner-sm"
                  />
                </div>

                {quickRows.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-100/60">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2">
                      <span className="w-1/3">Course Title & Code</span>
                      <span className="w-24 text-center">Credits</span>
                      <span className="w-32 text-center">Weightage / Grade</span>
                    </div>

                    <div className="space-y-3 max-h-[550px] overflow-y-auto scrollbar-thin pr-1">
                      {quickRows.map((row, index) => {
                        const errs = quickErrors[row.id] || {};
                        const isHighCredit = (parseFloat(row.credits) || 0) >= 4;
                        return (
                          <div key={row.id} className="flex items-center justify-between gap-4 p-3 bg-slate-50/40 border border-slate-100/40 rounded-2xl hover:border-slate-200/60 transition-all">
                            
                            {/* Course Read-only Badge (Saves time, no manual typing needed) */}
                            <div className="w-1/3 flex items-center gap-2">
                              <span className="text-[9px] font-mono font-black px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg shadow-sm shrink-0">
                                {row.code}
                              </span>
                              <span className="text-xs font-extrabold text-slate-700 truncate flex items-center gap-1.5">
                                {row.name}
                                {isHighCredit && showAdvanced && (
                                  <Shield size={10} className="text-indigo-500 fill-indigo-50" title="High-Credit Subject!" />
                                )}
                              </span>
                            </div>

                            {/* Credits (Required) */}
                            <div className="w-24 flex-col">
                              <input
                                type="number"
                                min="1"
                                max="6"
                                placeholder="Credits"
                                value={row.credits}
                                onChange={(e) => handleQuickRowChange(row.id, 'credits', e.target.value)}
                                className={`w-full text-center px-3 py-2 text-xs bg-white border rounded-xl font-bold outline-none transition-all ${
                                  errs.credits ? 'border-rose-400 ring-2 ring-rose-500/5' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10'
                                }`}
                              />
                              {errs.credits && (
                                <span className="text-[8px] text-rose-500 font-bold block text-center mt-0.5">{errs.credits}</span>
                              )}
                            </div>

                            {/* Weightage / Grade (Required) */}
                            <div className="w-32 flex-col">
                              <input
                                type="text"
                                placeholder="e.g. 85 or A+"
                                value={row.weightage}
                                onChange={(e) => handleQuickRowChange(row.id, 'weightage', e.target.value)}
                                className={`w-full text-center px-3 py-2 text-xs bg-white border rounded-xl font-bold outline-none transition-all ${
                                  errs.weightage ? 'border-rose-400 ring-2 ring-rose-500/5' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10'
                                }`}
                              />
                              {errs.weightage && (
                                <span className="text-[8px] text-rose-500 font-bold block text-center mt-0.5">{errs.weightage}</span>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Validation Warning Banner to prevent toast spamming and clarify what is missing */}
                    {Object.keys(quickErrors).length > 0 && (
                      <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-2.5 text-[10px] text-rose-700 font-bold leading-normal animate-shake mt-3">
                        <AlertCircle size={14} className="shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <span>Some subjects are missing required inputs! Please fill in all <strong>Credits</strong> and <strong>Weightages</strong> highlighted in red.</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleQuickCalculate}
                      className="w-full mt-3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-soft transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Sparkles size={13} />
                      Calculate SGPA
                    </button>
                  </div>
                )}

                {quickRows.length === 0 && (
                  <div className="py-12 flex flex-col justify-center items-center text-center text-xs text-slate-400/80 gap-3 border border-dashed border-slate-200 bg-slate-50/20 rounded-2xl p-6">
                    <ClipboardList size={32} className="text-slate-300 animate-pulse" />
                    <div>
                      <p className="font-bold text-slate-500">Generate subjects to begin calculation</p>
                      <p className="text-[10px] text-slate-400 mt-1">Enter your semester subject count above to generate dynamic quick rows.</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* MODE 2: DETAILED SEMESTER CALCULATION */}
          {activeMode === 'detailed' && (
            <Card className="!p-6 flex-1 flex flex-col justify-between bg-white border border-slate-100 rounded-3xl shadow-soft-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-slate-400" />
                    Step 1: Enter Number of Subjects
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Generates dynamic, fully customizable inline subjects cards and assessment calculators.</p>
                </div>

                {/* Subjects Count Input */}
                <div className="max-w-xs space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Number of Subjects</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    placeholder="e.g. 5"
                    value={detailedNumSubjects}
                    onChange={(e) => handleDetailedNumSubjectsChange(e.target.value)}
                    className="w-full px-4 py-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700 shadow-inner-sm"
                  />
                </div>

                {sandboxRows.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-100/60">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2">
                      <span>Subject Sandbox List ({sandboxRows.length})</span>
                      <span className="text-[9px] text-slate-400 lowercase font-medium">Configure all parameters below</span>
                    </div>

                    <div className="space-y-4 max-h-[550px] overflow-y-auto scrollbar-thin pr-1">
                      {sandboxRows.map((row, index) => {
                        const activeGrade = calculateSandboxRowGrade(row);
                        const isHighCredit = (parseFloat(row.credits) || 0) >= 4;
                        const m = row.marksData || {};
                        const isAttExceeded = parseFloat(m.attendance || 0) > 5;
                        const isCaExceeded = parseFloat(m.caObt || 0) > 25;
                        const isMidExceeded = m.midApplicable && parseFloat(m.midObt || 0) > 20;
                        const isEndExceeded = m.endApplicable && parseFloat(m.endObt || 0) > 50;
                        const isTotalExceeded = (parseFloat(m.attendance || 0) + parseFloat(m.caObt || 0) + (m.midApplicable ? parseFloat(m.midObt || 0) : 0) + (m.endApplicable ? parseFloat(m.endObt || 0) : 0)) > 100;
                        const hasExceeded = detailedCalculated && (isAttExceeded || isCaExceeded || isMidExceeded || isEndExceeded || isTotalExceeded);

                        return (
                          <div 
                            key={row.id} 
                            className={`p-4 bg-slate-50/40 border rounded-3xl transition-all duration-200 ${
                              row.expanded 
                                ? 'border-indigo-150 shadow-soft-sm bg-white' 
                                : 'border-slate-100 hover:border-slate-250/60'
                            }`}
                          >
                            
                            {/* Accordion Header / Top Level Fields */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              
                              {/* Subject Index & Course Code Input */}
                              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <span className="text-[10px] font-black font-mono px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shadow-sm shrink-0">
                                  #{index + 1}
                                </span>
                                <div className="space-y-0.5 flex-1">
                                  <input
                                    type="text"
                                    placeholder="Course Code (Mandatory) *"
                                    value={row.code}
                                    onChange={(e) => handleDetailedFieldChange(row.id, 'code', null, e.target.value.toUpperCase())}
                                    className="w-full px-3 py-1.5 text-xs font-mono font-bold uppercase bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:bg-white text-slate-700 transition-all shadow-inner-sm"
                                  />
                                </div>
                              </div>

                              {/* Credits Dropdown */}
                              <div className="w-28 shrink-0">
                                <select
                                  value={row.credits}
                                  onChange={(e) => handleDetailedFieldChange(row.id, 'credits', null, e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 text-slate-600 cursor-pointer transition-all"
                                >
                                  {[1, 2, 3, 4, 5, 6].map(c => (
                                    <option key={c} value={c}>{c} Credits</option>
                                  ))}
                                </select>
                              </div>

                              {/* Resolved Live Grade Indicator Badge */}
                              <div className="flex items-center gap-2 shrink-0">
                                {hasExceeded && (
                                  <span className="px-2.5 py-1 rounded-xl text-xs font-black border bg-rose-50 text-rose-600 border-rose-100 shadow-sm animate-pulse flex items-center gap-1">
                                    ⚠️ Exceeds Max
                                  </span>
                                )}
                                <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${
                                  activeGrade === 'Pending'
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 shadow-sm'
                                    : activeGrade === 'Fail'
                                      ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-100/50'
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100/50'
                                }`}>
                                  Resolved: {activeGrade}
                                </span>

                                {/* Expand/Collapse Trigger */}
                                <button
                                  type="button"
                                  onClick={() => handleDetailedFieldChange(row.id, 'expanded', null, !row.expanded)}
                                  className={`p-1.5 rounded-lg border hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer ${
                                    row.expanded ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-white border-slate-200'
                                  }`}
                                  title={row.expanded ? "Collapse Marks Details" : "Expand Marks Details"}
                                >
                                  <Sliders size={13} />
                                </button>
                              </div>

                            </div>

                            {/* Accordion Content: Dynamic Weightage & Marks Calculator */}
                            {row.expanded && (
                              <div className="mt-4 pt-4 border-t border-slate-100/60 space-y-4 animate-fadeIn">
                                
                                 {/* Weightages Summary Warning / Error Exceeded Banner */}
                                 {hasExceeded ? (
                                   <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-2.5 text-[10px] text-rose-700 font-bold leading-normal animate-shake">
                                     <AlertCircle size={14} className="shrink-0 text-rose-500 mt-0.5" />
                                     <div>
                                       <span>Warning: Entered weightage exceeds maximum limits!</span>
                                       <ul className="list-disc list-inside mt-1 font-medium text-[9px] text-rose-600 space-y-0.5">
                                         {isAttExceeded && <li>Attendance weightage exceeds max limit of 5% (Entered: {m.attendance})</li>}
                                         {isCaExceeded && <li>CA weightage exceeds max limit of 25% (Entered: {m.caObt})</li>}
                                         {isMidExceeded && <li>Midterm weightage exceeds max limit of 20% (Entered: {m.midObt})</li>}
                                         {isEndExceeded && <li>End Sem weightage exceeds max limit of 50% (Entered: {m.endObt})</li>}
                                         {isTotalExceeded && <li>Total sum of weightages exceeds 100%!</li>}
                                       </ul>
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] bg-slate-50 border border-slate-150/40 p-2.5 rounded-2xl">
                                     <span className="font-extrabold text-slate-500 flex items-center gap-1">
                                       ⚙️ Direct Component Scoring:
                                     </span>
                                     <span className="font-black text-indigo-600 uppercase tracking-wider">
                                       Enter your obtained score directly out of each component's max weightage (Total Max: 100%)
                                     </span>
                                   </div>
                                 )}

                                 {/* Live Math Formula Rendering */}
                                 {detailedCalculated && !hasExceeded && (
                                   <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl flex items-center justify-between text-xs font-mono text-indigo-950 shadow-inner-sm animate-fadeIn">
                                     <span className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-wider flex items-center gap-1">🔬 Live Evaluation Formula:</span>
                                     <div className="flex items-center gap-1 font-bold">
                                       <span className="bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">{parseFloat(m.attendance || 0)} <span className="text-[9px] text-indigo-400 font-medium">Att</span></span>
                                       <span>+</span>
                                       <span className="bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">{parseFloat(m.caObt || 0)} <span className="text-[9px] text-indigo-400 font-medium">CA</span></span>
                                       <span>+</span>
                                       <span className="bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">{m.midApplicable ? parseFloat(m.midObt || 0) : 0} <span className="text-[9px] text-indigo-400 font-medium">Mid</span></span>
                                       <span>+</span>
                                       <span className="bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">{m.endApplicable ? parseFloat(m.endObt || 0) : 0} <span className="text-[9px] text-indigo-400 font-medium">End</span></span>
                                       <span>=</span>
                                       <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow-soft font-black">{parseFloat(m.attendance || 0) + parseFloat(m.caObt || 0) + (m.midApplicable ? parseFloat(m.midObt || 0) : 0) + (m.endApplicable ? parseFloat(m.endObt || 0) : 0)}%</span>
                                     </div>
                                   </div>
                                 )}
 
                                 {/* Dynamic Grid of Marks Inputs */}
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                   
                                   {/* 1. Attendance percentage */}
                                   <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2">
                                     <span className="text-[10px] font-black text-slate-400 block uppercase">1. Attendance</span>
                                     <div className="space-y-1.5">
                                       <div>
                                         <label className="block text-[8px] text-slate-400 font-bold uppercase">Obtained Weightage</label>
                                         <input
                                           type="number"
                                           placeholder="e.g. 5"
                                           value={m.attendance}
                                           onChange={(e) => handleDetailedFieldChange(row.id, null, 'attendance', e.target.value)}
                                           className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 text-slate-700 shadow-inner-sm"
                                         />
                                       </div>
                                     </div>
                                   </div>
 
                                   {/* 2. CA Standings */}
                                   <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2">
                                     <span className="text-[10px] font-black text-slate-400 block uppercase">2. CA</span>
                                     <div className="space-y-1.5">
                                       <div>
                                         <label className="block text-[8px] text-slate-400 font-bold uppercase">Obtained Weightage</label>
                                         <input
                                           type="number"
                                           placeholder="e.g. 23"
                                           value={m.caObt}
                                           onChange={(e) => handleDetailedFieldChange(row.id, null, 'caObt', e.target.value)}
                                           className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 text-slate-700 shadow-inner-sm"
                                         />
                                       </div>
                                     </div>
                                   </div>
 
                                   {/* 3. Midterm Standings */}
                                   <div className={`p-4 border rounded-2xl space-y-2 transition-all duration-200 ${
                                     m.midApplicable ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-100/30 border-dashed border-slate-200 opacity-60'
                                   }`}>
                                     <div className="flex items-center justify-between">
                                       <span className="text-[10px] font-black text-slate-400 block uppercase">3. Midterm</span>
                                       <label className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 cursor-pointer select-none">
                                         <input
                                           type="checkbox"
                                           checked={m.midApplicable}
                                           onChange={(e) => handleDetailedFieldChange(row.id, null, 'midApplicable', e.target.checked)}
                                           className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500"
                                         />
                                         Active
                                       </label>
                                     </div>
                                     {m.midApplicable && (
                                       <div className="space-y-1.5">
                                         <div>
                                           <label className="block text-[8px] text-slate-400 font-bold uppercase">Obtained Weightage</label>
                                           <input
                                             type="number"
                                             placeholder="e.g. 18"
                                             value={m.midObt}
                                             onChange={(e) => handleDetailedFieldChange(row.id, null, 'midObt', e.target.value)}
                                             className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 text-slate-700 shadow-inner-sm"
                                           />
                                         </div>
                                       </div>
                                     )}
                                   </div>
 
                                   {/* 4. End Sem Standings */}
                                   <div className={`p-4 border rounded-2xl space-y-2 transition-all duration-200 ${
                                     m.endApplicable ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-100/30 border-dashed border-slate-200 opacity-60'
                                   }`}>
                                     <div className="flex items-center justify-between">
                                       <span className="text-[10px] font-black text-slate-400 block uppercase">4. End Sem</span>
                                       <label className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 cursor-pointer select-none">
                                         <input
                                           type="checkbox"
                                           checked={m.endApplicable}
                                           onChange={(e) => handleDetailedFieldChange(row.id, null, 'endApplicable', e.target.checked)}
                                           className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500"
                                         />
                                         Active
                                       </label>
                                     </div>
                                     {m.endApplicable && (
                                       <div className="space-y-1.5">
                                         <div>
                                           <label className="block text-[8px] text-slate-400 font-bold uppercase">Obtained Weightage</label>
                                           <input
                                             type="number"
                                             placeholder="e.g. 45"
                                             value={m.endObt}
                                             onChange={(e) => handleDetailedFieldChange(row.id, null, 'endObt', e.target.value)}
                                             className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 text-slate-700 shadow-inner-sm"
                                           />
                                         </div>
                                       </div>
                                     )}
                                   </div>
 
                                 </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
 
                    <button
                      onClick={() => setDetailedCalculated(true)}
                      className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-soft transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Sparkles size={13} />
                      Calculate Detailed SGPA
                    </button>
                  </div>
                )}
              </div>

              {sandboxRows.length === 0 && (
                <div className="py-12 flex flex-col justify-center items-center text-center text-xs text-slate-400/80 gap-3 border border-dashed border-slate-200 bg-slate-50/20 rounded-2xl p-6">
                  <GraduationCap size={32} className="text-slate-300 animate-pulse" />
                  <div>
                    <p className="font-bold text-slate-500">Configure subjects to begin sandbox SGPA calculation</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">
                      Enter the number of semester subjects above to dynamically generate dynamic inline cards and assessment calculators.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ADVANCED OPTIONAL ANALYTICS DASHBOARD */}
          {showAdvanced && (
            <div className="space-y-6 animate-slideUp">
              
              {/* DYNAMIC WHAT-IF TARGET SGPA OPTIMIZER */}
              <Card className="!p-6 bg-slate-50/50 border border-slate-100 shadow-soft-sm rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-500">
                    <Target size={18} />
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 tracking-tight">
                      "What-If" Target SGPA Optimizer
                    </h3>
                    <p className="text-[10px] text-slate-400">Calculate average grade points needed on remaining subjects to hit your goal.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold">Target Semester SGPA:</span>
                    <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 border border-indigo-100 rounded-md">
                      {targetSGPA.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4.0"
                    max="10.0"
                    step="0.1"
                    value={targetSGPA}
                    onChange={(e) => setTargetSGPA(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  {(() => {
                    if (!calculated) {
                      return (
                        <div className="text-[10px] text-slate-400/80 italic mt-2 text-center">
                          Calculate your current SGPA first to activate targets and simulation forecasts.
                        </div>
                      );
                    }

                    const totalTargetGP = targetSGPA * totalCredits;
                    const pointsNeeded = totalTargetGP - totalGradePoints;

                    if (pointsNeeded <= 0) {
                      return (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] text-emerald-700 font-bold leading-normal">
                          🎉 Goal Achieved! Your current cumulative score ({finalSGPA.toFixed(2)} SGPA) is already above or equal to your target of {targetSGPA.toFixed(1)}. Outstanding semester performance!
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] text-amber-700 font-bold leading-normal">
                          📈 Target Forecast: You need exactly <span className="font-extrabold text-amber-800">{pointsNeeded.toFixed(1)} additional grade points</span> to hit your {targetSGPA.toFixed(1)} SGPA goal. Drag to optimize your forecast.
                        </div>
                      );
                    }
                  })()}
                </div>
              </Card>

              {calculated ? (
                <div>
                  {/* ADVANCED PANEL: GRADE BOOSTER & HISTORICAL PATHWAY */}
                  <Card className="!p-5 space-y-4 border border-emerald-100 bg-emerald-50/5 rounded-3xl shadow-soft-sm">
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-emerald-500" />
                        Diagnostic Boost Advisors
                      </h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">Identify highest leverage targets and semester history.</p>
                    </div>

                    <div className="space-y-3.5">
                      {/* Grade Booster Advise box */}
                      {boosterAdvice ? (
                        <div className="p-3 bg-emerald-900 text-white rounded-2xl space-y-1.5 shadow-sm">
                          <span className="text-[8px] font-black text-emerald-300 uppercase tracking-wider block">📈 AI Grade Booster Advisor</span>
                          <p className="text-[10px] leading-relaxed text-emerald-100">
                            Raise <strong className="text-white">{boosterAdvice.subjectName}</strong> by 1 grade level (from <strong className="text-white">{boosterAdvice.fromGrade}</strong> to <strong className="text-white">{boosterAdvice.toGrade}</strong>). 
                            This increases your SGPA by <strong className="text-white">+{boosterAdvice.increase.toFixed(2)}</strong> points, elevating your final GPA forecast to <strong className="text-white">{boosterAdvice.targetSGPA.toFixed(2)}</strong>!
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-[9px] text-slate-500 italic text-center">
                          All subjects are at peak 'O' grades. No grade booster targets available.
                        </div>
                      )}

                      {/* High-Credit Guardians */}
                      {highCreditSubjects.length > 0 && (
                        <div className="p-3 bg-white border border-slate-100 rounded-2xl space-y-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Shield size={11} className="text-indigo-500" />
                            High-Credit Guardians ({highCreditSubjects.length})
                          </span>
                          <div className="space-y-1">
                            {highCreditSubjects.map(sub => (
                              <div key={sub.id} className="text-[9px] text-slate-600 font-bold flex justify-between">
                                <span>🛡️ {sub.name}</span>
                                <span className="text-slate-400 font-black">{sub.credits} Credits (Double Impact!)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="!p-6 border border-dashed border-slate-200 rounded-3xl text-center bg-slate-50/20 py-8 flex flex-col justify-center items-center gap-3">
                  <Sliders size={28} className="text-indigo-500/80 animate-pulse" />
                  <div>
                    <p className="text-xs font-black text-slate-700">Advanced Features Standby</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
                      Please enter your credits and weightages and click <strong>"Calculate SGPA"</strong> first to unlock your Placement Drive Eligibility Trackers and AI Grade Booster Advisors!
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: SGPA RESULTS PANEL */}
        <div className="lg:col-span-4 flex flex-col justify-start space-y-6">
          <Card className="flex flex-col justify-start items-center text-center p-6 bg-gradient-to-b from-white to-slate-50/30 border border-slate-100 shadow-soft-lg rounded-3xl h-fit space-y-6">
            <div className="space-y-4 w-full flex flex-col items-center py-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Semester Performance Index</span>
              
              <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-indigo-50 shadow-soft-sm bg-white select-none">
                <div className="text-center">
                  <span className="text-4xl font-black text-indigo-600 tracking-tight">{finalSGPA.toFixed(2)}</span>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider mt-0.5">SGPA</span>
                </div>
              </div>

              <div className="mt-2 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Academic standing</span>
                <span className={`text-base font-black ${indicatorColor} mt-0.5 block`}>{gpaIndicator}</span>
              </div>
            </div>

            {/* Backlog Alert Badge */}
            {backlogCount > 0 && (
              <div className="w-full mb-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-[10px] text-rose-700 font-bold leading-normal animate-shake">
                <AlertCircle size={14} className="shrink-0 text-rose-500" />
                <span>⚠️ {backlogCount} Fail/Backlog grade{backlogCount > 1 ? 's' : ''} detected. Ensure to schedule recovery exams!</span>
              </div>
            )}

            <div className="w-full pt-4 border-t border-slate-100/60 space-y-3.5 text-left">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-xs text-slate-500 font-medium">Total Semester Credits:</span>
                <span className="text-xs font-black text-slate-700">{totalCredits} Credits</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-xs text-slate-500 font-medium">Total Grade Points:</span>
                <span className="text-xs font-black text-slate-700">{totalGradePoints} Points</span>
              </div>

              {/* DYNAMIC SGPA PERCENTAGE CONVERTER */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Percent size={11} className="text-indigo-400" />
                  Estimated Percentage:
                </span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100/40 px-2.5 py-0.5 rounded-lg shadow-sm">
                  {convertedPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Action Card (only if successfully calculated) */}
          {calculated && (
            <Card className="!p-5 space-y-4 border border-slate-100 bg-white shadow-soft rounded-3xl w-full">
              <div>
                <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={13} className="text-indigo-500" />
                  Semester Actions
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Persist your calculation or add it to Overall CGPA.</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleOpenOverallModal}
                  className="w-full py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Add to Overall CGPA</span>
                </button>
                
                <button
                  onClick={handleOpenSaveModal}
                  className="w-full py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 border border-slate-200/50"
                >
                  <CheckCircle2 size={13} />
                  <span>Save & Close Record</span>
                </button>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-soft active:scale-95"
                    title="Export Semester Report as PDF"
                  >
                    <Download size={13} />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleExport('png')}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-soft active:scale-95"
                    title="Export Semester View as PNG"
                  >
                    <Image size={13} />
                    <span>PNG</span>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Saved calculations record deck */}
          {savedCalculations.length > 0 && (
            <div className="space-y-3 w-full">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">
                Saved Semester Records ({savedCalculations.length})
              </span>
              <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                {savedCalculations.map(c => {
                  const alreadyInOverall = isSemAdded(c.semesterNumber);
                  return (
                    <Card 
                      key={c.id} 
                      onClick={() => {
                        setSelectedCard(c);
                        setShowDetailsModal(true);
                      }}
                      className="!p-4 bg-white border border-slate-100 hover:border-slate-200 shadow-soft-sm rounded-2xl space-y-3 relative group transition-all cursor-pointer hover:shadow-soft active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md shadow-sm">
                            Semester {c.semesterNumber}
                          </span>
                          {c.customLabel && (
                            <p className="text-[10px] font-bold text-slate-500 mt-1 max-w-[200px] truncate" title={c.customLabel}>
                              🏷️ {c.customLabel}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCalculation(c);
                          }}
                          className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Delete Saved Card"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] border-t border-slate-50 pt-2 text-slate-500">
                        <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {parseFloat(c.sgpa).toFixed(2)} SGPA
                        </span>
                        <span className="font-medium">{c.credits} Credits</span>
                        <span className="font-medium">{c.numSubjects} Subjects</span>
                      </div>

                      {alreadyInOverall && (
                        <div className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={10} /> Added to Overall
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* FLOATING UNDO ACTION BAR */}
      {undoActive && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900/95 backdrop-blur border border-slate-800 text-white rounded-2xl shadow-soft flex items-center justify-between gap-4 animate-slideUp max-w-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping shrink-0" />
            <p className="text-xs font-bold">{undoMessage} <span className="text-slate-400">({undoTimer}s)</span></p>
          </div>
          <button
            onClick={handleUndo}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg shadow transition-all cursor-pointer uppercase tracking-wider"
          >
            Undo
          </button>
        </div>
      )}

      {/* SAVE & CLOSE MODAL */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl shadow-soft-lg max-w-md w-full p-6 text-left space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-indigo-500" />
                    Save Semester Record
                  </h3>
                  <p className="text-[10px] text-slate-400">Save this calculation to your offline records library.</p>
                </div>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Semester Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="e.g. 3"
                    value={modalSemesterNumber}
                    onChange={(e) => setModalSemesterNumber(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Course Titles / Codes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INT221, CSE357 or Fall 2026"
                    value={modalCustomLabel}
                    onChange={(e) => setModalCustomLabel(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700"
                  />
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Enter the courses or notes you want to easily recognize later without confusion.
                  </p>
                </div>

                {/* Auto Calculated stats */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-500">Auto Calculated:</span>
                  <div className="flex gap-3 text-indigo-700 font-black">
                    <span>📚 {activeRows.length} Subjects</span>
                    <span>🛡️ {totalCredits} Credits</span>
                    <span>📈 {finalSGPA.toFixed(2)} SGPA</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer text-center"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD TO OVERALL CGPA MODAL */}
      <AnimatePresence>
        {showOverallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl shadow-soft-lg max-w-md w-full p-6 text-left space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={15} className="text-indigo-500" />
                    Add to Overall CGPA
                  </h3>
                  <p className="text-[10px] text-slate-400">Directly link this semester's score calculations to your cumulative CGPA.</p>
                </div>
                <button
                  onClick={() => setShowOverallModal(false)}
                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Which Semester is Mandatory? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="e.g. 3"
                    value={modalSemesterNumber}
                    onChange={(e) => setModalSemesterNumber(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700"
                  />
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Enter the semester number. The system will automatically block further additions for this semester once confirmed.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Course Titles / Codes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE357, INT221"
                    value={modalCustomLabel}
                    onChange={(e) => setModalCustomLabel(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700"
                  />
                </div>

                {/* Auto Calculated stats */}
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
                  <span className="text-[10px] font-extrabold text-indigo-900 block">🔬 Automatically Extracted Parameters:</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded-xl border border-indigo-100/50">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">Subjects</span>
                      <span className="text-xs font-black text-indigo-700">{activeRows.length}</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-indigo-100/50">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">Credits</span>
                      <span className="text-xs font-black text-indigo-700">{totalCredits}</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-indigo-100/50">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">SGPA</span>
                      <span className="text-xs font-black text-indigo-700">{finalSGPA.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowOverallModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOverall}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer text-center flex items-center justify-center gap-1 active:scale-95"
                >
                  <Plus size={12} />
                  Confirm Add
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED CARD VIEWER MODAL */}
      <AnimatePresence>
        {showDetailsModal && selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl shadow-soft-lg max-w-lg w-full p-6 text-left space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md shadow-sm">
                    Semester {selectedCard?.semesterNumber} Record
                  </span>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                    {selectedCard?.customLabel || `Semester ${selectedCard?.semesterNumber} Details`}
                  </h3>
                  <p className="text-[9px] text-slate-400">Recorded on {selectedCard?.timestamp || new Date().toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCard(null);
                  }}
                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Subject details table breakdown */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Course Breakdown</span>
                {selectedCard?.subjectsData && selectedCard?.subjectsData.length > 0 ? (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Subject Name</th>
                          <th className="py-2.5 px-3 text-center">Credits</th>
                          <th className="py-2.5 px-3 text-right">Grade / Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                        {selectedCard?.subjectsData?.map((sub, idx) => (
                          <tr key={sub.id || idx} className="hover:bg-slate-50/20">
                            <td className="py-2.5 px-3">
                              <div className="font-extrabold text-slate-700">{sub.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{sub.code}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center">{sub.credits}</td>
                            <td className="py-2.5 px-3 text-right text-indigo-600 font-black">
                              {selectedCard?.mode === 'quick' ? sub.weightage : sub.grade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-500 italic text-center leading-normal">
                    Detailed subject breakdown is not available for this legacy record.
                  </div>
                )}
              </div>

              {/* Calculated Stats Card */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[8px] font-extrabold text-slate-400 block uppercase tracking-wider">SGPA Result</span>
                  <span className="text-sm font-black text-indigo-700">{parseFloat(selectedCard?.sgpa || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[8px] font-extrabold text-slate-400 block uppercase tracking-wider">Total Credits</span>
                  <span className="text-sm font-black text-indigo-700">{selectedCard?.credits}</span>
                </div>
                <div>
                  <span className="text-[8px] font-extrabold text-slate-400 block uppercase tracking-wider">Total Courses</span>
                  <span className="text-sm font-black text-indigo-700">{selectedCard?.numSubjects}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    const record = selectedCard;
                    if (!record || !record.subjectsData) {
                      if (addToast) addToast("No subject breakdown data found for this card.", "error");
                      return;
                    }
                    if (record.mode === 'quick') {
                      setActiveMode('quick');
                      setNumSubjects(String(record.subjectsData.length));
                      setQuickRows(record.subjectsData);
                      setQuickCalculated(true);
                    } else {
                      setActiveMode('detailed');
                      setSandboxRows(record.subjectsData);
                    }
                    setShowDetailsModal(false);
                    setSelectedCard(null);
                    if (addToast) addToast(`Loaded Semester ${record.semesterNumber} into the board!`, "success");
                  }}
                  className="py-3 border border-indigo-200 text-indigo-600 hover:bg-indigo-50/20 font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-soft-sm"
                >
                  <RefreshCw size={13} />
                  Load into Board
                </button>

                <button
                  onClick={() => {
                    const record = selectedCard;
                    if (!record) return;
                    const alreadyInOverall = isSemAdded(record.semesterNumber);
                    if (alreadyInOverall) {
                      setSemesters(prev => prev.filter(s => s.id !== `quick_sem_${record.semesterNumber}` && s.name !== `Semester ${record.semesterNumber}`));
                      if (addToast) addToast(`Removed Semester ${record.semesterNumber} from Overall CGPA`, "info");
                    } else {
                      const newSem = {
                        id: `quick_sem_${record.semesterNumber}`,
                        name: `Semester ${record.semesterNumber}`,
                        sgpa: Math.round(record.sgpa * 100) / 100,
                        credits: record.credits || 20
                      };
                      setSemesters([...(semesters || []), newSem]);
                      if (addToast) addToast(`Added Semester ${record.semesterNumber} to Overall CGPA`, "success");
                    }
                    setShowDetailsModal(false);
                    setSelectedCard(null);
                  }}
                  className={`py-3 font-bold text-xs rounded-xl shadow transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    selectedCard && isSemAdded(selectedCard.semesterNumber) 
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {selectedCard && isSemAdded(selectedCard.semesterNumber) ? (
                    <>
                      <Trash2 size={13} />
                      Remove from Overall
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      Add to Overall
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD / EDIT SANDBOX SUBJECT MODAL */}
      <AnimatePresence>
        {showSandboxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto scrollbar-thin">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl shadow-soft-lg max-w-2xl w-full p-6 text-left space-y-6 my-8"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap size={16} className="text-indigo-500" />
                    {editingSandboxId ? 'Edit Sandbox Subject' : 'Add Sandbox Subject'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Configure parameters, credits, and grade inputs below.</p>
                </div>
                <button
                  onClick={() => setShowSandboxModal(false)}
                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Course Identity Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE101"
                    value={sandboxForm.code}
                    onChange={(e) => {
                      setSandboxFormError('');
                      setSandboxForm({ ...sandboxForm, code: e.target.value });
                    }}
                    className={`w-full px-4 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold focus:bg-white transition-all text-slate-700 ${
                      sandboxFormError ? 'border-rose-400 ring-2 ring-rose-500/5' : 'border-slate-200 focus:border-indigo-400'
                    }`}
                  />
                  {sandboxFormError && (
                    <span className="text-[9px] text-rose-500 font-bold mt-1 block">{sandboxFormError}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Course Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Data Structures"
                    value={sandboxForm.name}
                    onChange={(e) => setSandboxForm({ ...sandboxForm, name: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Credits
                  </label>
                  <select
                    value={sandboxForm.credits}
                    onChange={(e) => setSandboxForm({ ...sandboxForm, credits: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map(c => (
                      <option key={c} value={c}>{c} Credits</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assessment Mode Selector Tabs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-2">
                    Calculation Input Mode
                  </label>
                  <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => setSandboxForm({ ...sandboxForm, inputMode: 'simple' })}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        sandboxForm.inputMode === 'simple'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Simple Grade Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setSandboxForm({ ...sandboxForm, inputMode: 'marks' })}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        sandboxForm.inputMode === 'marks'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Assessment Marks Calculator Mode
                    </button>
                  </div>
                </div>

                {/* MODE A: SIMPLE GRADE INPUTS */}
                {sandboxForm.inputMode === 'simple' && (
                  <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl space-y-2">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                      Select Letter Grade
                    </label>
                    <select
                      value={sandboxForm.grade}
                      onChange={(e) => setSandboxForm({ ...sandboxForm, grade: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 cursor-pointer text-slate-700"
                    >
                      <option value="O">O (Outstanding - 10 Grade Points)</option>
                      <option value="A+">A+ (Excellent - 9 Grade Points)</option>
                      <option value="A">A (Very Good - 8 Grade Points)</option>
                      <option value="B+">B+ (Good - 7 Grade Points)</option>
                      <option value="B">B (Above Average - 6 Grade Points)</option>
                      <option value="C">C (Average - 5 Grade Points)</option>
                      <option value="D">D (Pass - 4 Grade Points)</option>
                      <option value="Fail">Fail (0 Grade Points)</option>
                    </select>
                  </div>
                )}

                {/* MODE B: DETAILED ASSESSMENT MARKS CALCULATOR */}
                {sandboxForm.inputMode === 'marks' && (
                  <div className="space-y-4">
                    
                    {/* Live marks preview banner */}
                    {(() => {
                      const calculatedGrade = calculateSandboxRowGrade({ ...sandboxForm, marksData: { ...sandboxForm } });
                      const totalWeightSum = (5) + parseFloat(sandboxForm.caWeight || 30) + 
                        (sandboxForm.midApplicable ? parseFloat(sandboxForm.midWeight || 20) : 0) + 
                        (sandboxForm.endApplicable ? parseFloat(sandboxForm.endWeight || 50) : 0);
                      return (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between gap-4 flex-wrap text-[10px]">
                          <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                            🔬 Dynamic Grade Forecast:
                          </span>
                          <div className="flex gap-4 font-black text-emerald-700">
                            <span>Sum of Weights: <strong className={totalWeightSum !== 100 ? 'text-rose-500 font-black' : ''}>{totalWeightSum}%</strong></span>
                            <span>Grade: <strong>{calculatedGrade} ({gradePoints[calculatedGrade]})</strong></span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Marks Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Attendance Marks */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black text-slate-500 block uppercase">1. Attendance (Weight: 5%)</span>
                        <div className="space-y-1">
                          <label className="block text-[9px] text-slate-400 font-bold uppercase">Attendance Percentage</label>
                          <input
                            type="number"
                            placeholder="e.g. 90"
                            value={sandboxForm.attendance}
                            onChange={(e) => setSandboxForm({ ...sandboxForm, attendance: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold outline-none text-slate-700"
                          />
                        </div>
                      </div>

                      {/* Continuous Assessment (CA) Marks */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black text-slate-500 block uppercase">2. CA Standings (Weight: 30%)</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-slate-400 font-bold uppercase">Obtained Marks</label>
                            <input
                              type="number"
                              placeholder="e.g. 24"
                              value={sandboxForm.caObt}
                              onChange={(e) => setSandboxForm({ ...sandboxForm, caObt: e.target.value })}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold outline-none text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-400 font-bold uppercase">Total CA Max</label>
                            <input
                              type="number"
                              placeholder="e.g. 30"
                              value={sandboxForm.caTot}
                              onChange={(e) => setSandboxForm({ ...sandboxForm, caTot: e.target.value })}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold outline-none text-slate-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mid Term Exam Marks */}
                      <div className={`p-3 border rounded-2xl space-y-2 transition-all ${
                        sandboxForm.midApplicable ? 'bg-slate-50 border-slate-100' : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 block uppercase">3. Midterm (Weight: 20%)</span>
                          <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sandboxForm.midApplicable}
                              onChange={(e) => setSandboxForm({ ...sandboxForm, midApplicable: e.target.checked })}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Applicable
                          </label>
                        </div>
                        {sandboxForm.midApplicable && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase">Obtained</label>
                              <input
                                type="number"
                                placeholder="e.g. 20"
                                value={sandboxForm.midObt}
                                onChange={(e) => setSandboxForm({ ...sandboxForm, midObt: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold outline-none text-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase">Max Total</label>
                              <input
                                type="number"
                                placeholder="e.g. 30"
                                value={sandboxForm.midTot}
                                onChange={(e) => setSandboxForm({ ...sandboxForm, midTot: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold outline-none text-slate-700"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* End Term Exam Marks */}
                      <div className={`p-3 border rounded-2xl space-y-2 transition-all ${
                        sandboxForm.endApplicable ? 'bg-slate-50 border-slate-100' : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 block uppercase">4. End Term (Weight: 50%)</span>
                          <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sandboxForm.endApplicable}
                              onChange={(e) => setSandboxForm({ ...sandboxForm, endApplicable: e.target.checked })}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Applicable
                          </label>
                        </div>
                        {sandboxForm.endApplicable && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase">Obtained</label>
                              <input
                                type="number"
                                placeholder="e.g. 70"
                                value={sandboxForm.endObt}
                                onChange={(e) => setSandboxForm({ ...sandboxForm, endObt: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold outline-none text-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase">Max Total</label>
                              <input
                                type="number"
                                placeholder="e.g. 100"
                                value={sandboxForm.endTot}
                                onChange={(e) => setSandboxForm({ ...sandboxForm, endTot: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold outline-none text-slate-700"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSandboxModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSandboxSubject}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer text-center flex items-center justify-center gap-1 active:scale-95"
                >
                  <Plus size={12} />
                  {editingSandboxId ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

