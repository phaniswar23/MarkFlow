import React, { useState, useEffect } from 'react';
import { Card, CircularProgress, Badge } from '../UI';
import { calculateSubjectMarks, validateMarks } from '../../utils/calcEngine';
import { 
  Sparkles, 
  Calculator, 
  CheckCircle, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Layers, 
  GraduationCap, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  AlertCircle, 
  Check, 
  BookOpen, 
  Clock, 
  Calendar,
  X,
  RefreshCw,
  Info,
  Target,
  Download,
  Sliders,
  Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { exportElement } from '../../utils/exportUtils';

export default function SubjectWisePage({ 
  subjects = [], 
  onSaveSubject, 
  onDeleteSubject, 
  handleOpenCreateModal, 
  transferData, 
  clearTransferData,
  undoSubject,
  undoSubjectTimer,
  onUndoSubjectDelete,
  addToast,
  setSubjectWiseUnsaved,
  defaultCACount = 2,
  defaultMaxMarks = 30,
  defaultWeightage = 25,
  defaultCredits = 3,
  warningsEnabled = true
}) {
  const [activeStep, setActiveStep] = useState(1);
  const [results, setResults] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [triggerShake, setTriggerShake] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);
  const [includeInCGPA, setIncludeInCGPA] = useState(true);
  const [playCA, setPlayCA] = useState(0);
  const [playMid, setPlayMid] = useState(0);
  const [playEnd, setPlayEnd] = useState(0);
  const [playInitialized, setPlayInitialized] = useState(false);

  useEffect(() => {
    if (isCalculated && results && !playInitialized) {
      setPlayCA(results.caPts);
      setPlayMid(results.midPts);
      setPlayEnd(results.endPts);
      setPlayInitialized(true);
    } else if (!isCalculated) {
      setPlayInitialized(false);
    }
  }, [isCalculated, results, playInitialized]);

  const toTitleCase = (str) => {
    return str.replace(/\b\w+/g, function(s) {
      return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
    });
  };

  const parseWeightage = (val, defaultValue) => {
    if (val === undefined || val === null || val === '') return defaultValue;
    const num = parseFloat(val);
    return isNaN(num) ? defaultValue : num;
  };

  const getSavedSubjectResults = (sub) => {
    if (!sub) return null;
    
    // 1. Attendance Points
    const score = parseFloat(sub.attendance || 0);
    let attMultiplier = 0;
    if (score >= 90) attMultiplier = 1.0;
    else if (score >= 85) attMultiplier = 0.8;
    else if (score >= 80) attMultiplier = 0.6;
    else if (score >= 75) attMultiplier = 0.4;
    const attPts = attMultiplier * parseWeightage(sub.attendanceWeightage, 5);

    // 2. CA Points
    const caApplicable = sub.caApplicable !== undefined ? sub.caApplicable : true;
    const caResults = caApplicable ? calculateSubjectMarks({
      weightage: parseWeightage(sub.weightage, 25),
      selectionLogic: sub.selectionLogic || 'all',
      assessments: (sub.assessments || []).map(a => ({
        ...a,
        obtainedMarks: a.obtainedMarks === '' ? 0 : parseFloat(a.obtainedMarks) || 0,
        totalMarks: parseFloat(a.totalMarks) || 30
      }))
    }) : { weightedMarks: 0 };

    // 3. Midterm & Endsem
    const midPts = sub.midtermApplicable ? ((parseFloat(sub.midtermObtained) || 0) / (parseFloat(sub.midtermTotal) || 30)) * parseWeightage(sub.midtermWeightage, 20) : 0;
    const endPts = sub.endSemApplicable ? ((parseFloat(sub.endSemObtained) || 0) / (parseFloat(sub.endSemTotal) || 100)) * parseWeightage(sub.endSemWeightage, 50) : 0;

    const totalWeightage = parseWeightage(sub.attendanceWeightage, 5) + (caApplicable ? parseWeightage(sub.weightage, 25) : 0) + (sub.midtermApplicable ? parseWeightage(sub.midtermWeightage, 20) : 0) + (sub.endSemApplicable ? parseWeightage(sub.endSemWeightage, 50) : 0);
    const finalObtained = attPts + caResults.weightedMarks + midPts + endPts;
    const finalPercentage = totalWeightage > 0 ? (finalObtained / totalWeightage) * 100 : 0;

    const gradeInfo = getGradeInfo(finalPercentage);

    return {
      attPts,
      caPts: caResults.weightedMarks,
      midPts,
      endPts,
      totalWeightage,
      finalObtained,
      finalPercentage,
      gradeInfo
    };
  };

  const sanitizeNumericInput = (val) => {
    if (typeof val !== 'string') val = String(val || '');
    return val.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
  };

  const getCAValidationError = (ass) => {
    if (ass.obtainedMarks === '' || ass.totalMarks === '') return null;
    const obt = parseFloat(ass.obtainedMarks);
    const tot = parseFloat(ass.totalMarks);
    if (isNaN(obt) || isNaN(tot)) return null;
    if (obt > tot) return `Obtained (${obt}) exceeds max (${tot})`;
    return null;
  };

  const getMidtermValidationError = () => {
    if (!midtermApplicable || midtermObtained === '' || midtermTotal === '') return null;
    const obt = parseFloat(midtermObtained);
    const tot = parseFloat(midtermTotal);
    if (isNaN(obt) || isNaN(tot)) return null;
    if (obt > tot) return `Obtained (${obt}) exceeds max (${tot})`;
    return null;
  };

  const getEndSemValidationError = () => {
    if (!endSemApplicable || endSemObtained === '' || endSemTotal === '') return null;
    const obt = parseFloat(endSemObtained);
    const tot = parseFloat(endSemTotal);
    if (isNaN(obt) || isNaN(tot)) return null;
    if (obt > tot) return `Obtained (${obt}) exceeds max (${tot})`;
    return null;
  };

  const hasMarksValidationError = () => {
    if (assessments.some(ass => getCAValidationError(ass))) return true;
    if (getMidtermValidationError()) return true;
    if (getEndSemValidationError()) return true;
    return false;
  };

  const getAttendanceValidationError = () => {
    if (attendance === '') return null;
    const val = parseFloat(attendance);
    if (isNaN(val)) return null;
    if (val > 100) return "Attendance percentage cannot exceed 100%";
    if (val < 0) return "Attendance percentage cannot be negative";
    return null;
  };

  const hasValidationError = () => {
    if (hasMarksValidationError()) return true;
    if (getAttendanceValidationError()) return true;
    return false;
  };

  // Subject Info (Step 1)
  const [subCode, setSubCode] = useState(transferData?.code === 'NEW' ? '' : (transferData?.code || ''));
  const [subName, setSubName] = useState(transferData?.name || '');
  const [subCredits, setSubCredits] = useState(defaultCredits);

  // Attendance (Step 2)
  const [attendance, setAttendance] = useState(100);
  const [attendanceWeightage, setAttendanceWeightage] = useState(5);
  const [totalClasses, setTotalClasses] = useState(40);
  const [attendedClasses, setAttendedClasses] = useState(40);

  // CA configuration (Step 3)
  const [caApplicable, setCaApplicable] = useState(true);
  const [caCount, setCaCount] = useState(transferData?.assessments?.length || defaultCACount);
  const [totalMarksPerCA, setTotalMarksPerCA] = useState(transferData?.assessments?.[0]?.totalMarks || defaultMaxMarks);
  const [caWeightage, setCaWeightage] = useState(transferData?.weightage || defaultWeightage);
  const [selectionLogic, setSelectionLogic] = useState(transferData?.selectionLogic || 'all');
  const [customBestOfX, setCustomBestOfX] = useState(2);
  const [customBestOfY, setCustomBestOfY] = useState(3);
  
  const [assessments, setAssessments] = useState(transferData?.assessments || (() => {
    const arr = [];
    for (let i = 1; i <= defaultCACount; i++) {
      arr.push({ name: `CA${i}`, obtainedMarks: '', totalMarks: defaultMaxMarks });
    }
    return arr;
  })());

  // Real-time synchronization of defaults when not typing a transfer or custom code
  useEffect(() => {
    if (!subCode && !subName) {
      setSubCredits(defaultCredits);
    }
  }, [defaultCredits]);

  useEffect(() => {
    if (!transferData) {
      setCaCount(defaultCACount);
      setCaWeightage(defaultWeightage);
      setTotalMarksPerCA(defaultMaxMarks);
      const arr = [];
      for (let i = 1; i <= defaultCACount; i++) {
        arr.push({ name: `CA${i}`, obtainedMarks: '', totalMarks: defaultMaxMarks });
      }
      setAssessments(arr);
    }
  }, [defaultCACount, defaultMaxMarks, defaultWeightage]);

  // Midterm (Step 4)
  const [midtermApplicable, setMidtermApplicable] = useState(false);
  const [midtermObtained, setMidtermObtained] = useState('');
  const [midtermTotal, setMidtermTotal] = useState('');
  const [midtermWeightage, setMidtermWeightage] = useState('');

  // End Sem (Step 5)
  const [endSemApplicable, setEndSemApplicable] = useState(false);
  const [endSemObtained, setEndSemObtained] = useState('');
  const [endSemTotal, setEndSemTotal] = useState('');
  const [endSemWeightage, setEndSemWeightage] = useState('');

  // Errors for input validation
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const [sandboxTarget, setSandboxTarget] = useState(80);

  useEffect(() => {
    if (setSubjectWiseUnsaved) {
      const hasUnsavedData = 
        (subCode && subCode.trim() !== '') || 
        (subName && subName.trim() !== '') || 
        (assessments && assessments.some(a => a.obtainedMarks !== '')) || 
        (midtermObtained !== undefined && midtermObtained !== '') || 
        (endSemObtained !== undefined && endSemObtained !== '');
      setSubjectWiseUnsaved(hasUnsavedData);
    }
  }, [subCode, subName, assessments, midtermObtained, endSemObtained, setSubjectWiseUnsaved]);

  useEffect(() => {
    return () => {
      if (setSubjectWiseUnsaved) {
        setSubjectWiseUnsaved(false);
      }
    };
  }, [setSubjectWiseUnsaved]);

  const currentTotalWeightage = (parseFloat(attendanceWeightage) || 0) + 
                               (caApplicable ? (parseFloat(caWeightage) || 0) : 0) + 
                               (midtermApplicable ? (parseFloat(midtermWeightage) || 0) : 0) + 
                               (endSemApplicable ? (parseFloat(endSemWeightage) || 0) : 0);

  useEffect(() => {
    if (transferData) {
      setSubCode(transferData.code === 'NEW' ? '' : (transferData.code || ''));
      setSubName(transferData.name === 'New Module' || !transferData.name ? '' : transferData.name);
      setSubCredits(3);
      setCaWeightage(transferData.weightage || 25);
      setSelectionLogic(transferData.selectionLogic || 'all');
      setIsImported(true);
      if (transferData.assessments) {
        setAssessments(transferData.assessments);
        setCaCount(transferData.assessments.length);
        if (transferData.assessments.length > 0) {
          setTotalMarksPerCA(transferData.assessments[0].totalMarks);
        }
      }
      setIsCalculated(false);
      clearTransferData();
      setActiveStep(1); // Stay on Step 1 so the user can enter Course Code and Course Title first
    }
  }, [transferData, clearTransferData]);

  const loadSubject = (sub) => {
    setEditingId(sub.id || sub._id);
    setSubCode(sub.code || '');
    setSubName(sub.name || '');
    setSubCredits(sub.credits || 3);
    const loadedAttendance = sub.attendance !== undefined ? sub.attendance : 100;
    setAttendance(loadedAttendance);
    setAttendanceWeightage(sub.attendanceWeightage || 5);
    setTotalClasses(sub.totalClasses !== undefined ? sub.totalClasses : 40);
    setAttendedClasses(sub.attendedClasses !== undefined ? sub.attendedClasses : Math.round(loadedAttendance * (sub.totalClasses || 40) / 100));
    
    setCaWeightage(sub.weightage || 25);
    setSelectionLogic(sub.selectionLogic || 'all');
    setCaApplicable(sub.caApplicable !== undefined ? sub.caApplicable : true);
    setIsImported(false);
    if (sub.assessments) {
      setAssessments(sub.assessments);
      setCaCount(sub.assessments.length);
      if (sub.assessments.length > 0) {
        setTotalMarksPerCA(sub.assessments[0].totalMarks);
      }
    }
    
    setMidtermApplicable(sub.midtermApplicable || false);
    setMidtermObtained(sub.midtermObtained !== undefined ? sub.midtermObtained : '');
    setMidtermTotal(sub.midtermTotal || 30);
    setMidtermWeightage(sub.midtermWeightage || 20);
    
    setEndSemApplicable(sub.endSemApplicable !== undefined ? sub.endSemApplicable : false);
    setEndSemObtained(sub.endSemObtained !== undefined ? sub.endSemObtained : '');
    setEndSemTotal(sub.endSemTotal || 100);
    setEndSemWeightage(sub.endSemWeightage || 50);
    setIncludeInCGPA(sub.includeInCGPA !== undefined ? sub.includeInCGPA : true);

    setIsCalculated(false);
    setActiveStep(1); // Start at step 1 for review
  };

  const getAttendanceMultiplier = (val) => {
    const score = parseFloat(val || 0);
    if (score >= 90) return 1.0;
    if (score >= 85) return 0.8;
    if (score >= 80) return 0.6;
    if (score >= 75) return 0.4;
    return 0;
  };

  const getAttendancePoints = (percentage, weightage) => {
    const mult = getAttendanceMultiplier(percentage);
    const weight = parseWeightage(weightage, 5);
    return mult * weight;
  };

  const getGradeInfo = (score) => {
    if (score >= 90) return { l: 'O', gp: 10, pass: true, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    if (score >= 80) return { l: 'A+', gp: 9, pass: true, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (score >= 70) return { l: 'A', gp: 8, pass: true, color: 'text-teal-600 bg-teal-50 border-teal-100' };
    if (score >= 60) return { l: 'B+', gp: 7, pass: true, color: 'text-blue-600 bg-blue-50 border-blue-100' };
    if (score >= 51) return { l: 'B', gp: 6, pass: true, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' };
    if (score >= 41) return { l: 'C', gp: 5, pass: true, color: 'text-amber-600 bg-amber-50 border-amber-100' };
    if (score >= 40) return { l: 'D', gp: 4, pass: true, color: 'text-orange-600 bg-orange-50 border-orange-100' };
    return { l: 'Fail', gp: 0, pass: false, color: 'text-rose-600 bg-rose-50 border-rose-100' };
  };

  // Helper validation to ensure evaluation can be calculated
  const isValidationComplete = () => {
    return subCode.trim().length > 0 && subCredits > 0;
  };

  const isEvaluationReady = () => {
    if (!isValidationComplete()) return false;
    
    // Check if CA has entered obtained marks (only if CAs are applicable)
    if (caApplicable) {
      const caEntered = assessments.some(a => a.obtainedMarks !== '');
      if (!caEntered) return false;
    }

    // Check if midterm/end sem are active but empty
    if (midtermApplicable && midtermObtained === '') return false;
    if (endSemApplicable && endSemObtained === '') return false;

    return true;
  };

  const calculateResults = () => {
    if (!isEvaluationReady()) return null;

    const finalSelectionLogic = selectionLogic === 'custom' ? `best_${customBestOfX}_${customBestOfY}` : selectionLogic;
    
    const caResults = caApplicable ? calculateSubjectMarks({
      weightage: parseWeightage(caWeightage, 25),
      selectionLogic: finalSelectionLogic,
      assessments: assessments.map(a => ({
        ...a,
        obtainedMarks: a.obtainedMarks === '' ? 0 : parseFloat(a.obtainedMarks) || 0,
        totalMarks: parseFloat(a.totalMarks) || 30
      }))
    }) : { weightedMarks: 0 };

    const attPts = getAttendancePoints(attendance, parseWeightage(attendanceWeightage, 5));
    const midPts = midtermApplicable ? ((parseFloat(midtermObtained) || 0) / (parseFloat(midtermTotal) || 30)) * parseWeightage(midtermWeightage, 20) : 0;
    const endPts = endSemApplicable ? ((parseFloat(endSemObtained) || 0) / (parseFloat(endSemTotal) || 100)) * parseWeightage(endSemWeightage, 50) : 0;

    const totalWeightage = parseWeightage(attendanceWeightage, 5) + (caApplicable ? parseWeightage(caWeightage, 25) : 0) + (midtermApplicable ? parseWeightage(midtermWeightage, 20) : 0) + (endSemApplicable ? parseWeightage(endSemWeightage, 50) : 0);
    const finalObtained = attPts + caResults.weightedMarks + midPts + endPts;
    const finalPercentage = totalWeightage > 0 ? (finalObtained / totalWeightage) * 100 : 0;

    const gradeInfo = getGradeInfo(finalPercentage);

    return {
      attPts, 
      caPts: caResults.weightedMarks, 
      midPts, 
      endPts,
      totalWeightage, 
      finalObtained, 
      finalPercentage, 
      gradeInfo
    };
  };

  const handleAssessmentChange = (index, field, value) => {
    setIsCalculated(false);
    const updated = [...assessments];
    const sanitized = sanitizeNumericInput(value);
    const cleanValue = sanitized.replace(/^0+(?=\d)/, '');
    updated[index][field] = cleanValue === '' ? '' : cleanValue;
    setAssessments(updated);

    if (errors.ca || errors.emptyCaIndices) {
      setErrors(prev => {
        const next = { ...prev };
        if (next.emptyCaIndices) {
          next.emptyCaIndices = next.emptyCaIndices.filter(i => i !== index);
          if (next.emptyCaIndices.length === 0) {
            delete next.emptyCaIndices;
            delete next.ca;
          }
        }
        return next;
      });
    }
  };

  const handleCaCountChange = (count) => {
    setIsCalculated(false);
    const newCount = parseInt(count) || 3;
    setCaCount(newCount);
    
    setAssessments(prev => {
      const updated = [];
      for (let i = 1; i <= newCount; i++) {
        const existing = prev[i - 1];
        updated.push({
          name: `CA${i}`,
          obtainedMarks: existing ? existing.obtainedMarks : '',
          totalMarks: existing ? existing.totalMarks : totalMarksPerCA
        });
      }
      return updated;
    });

    if (newCount < 3 && selectionLogic === 'best_2_3') {
      setSelectionLogic('all');
    }
  };

  const handleCalculate = () => {
    if (warningsEnabled && (currentTotalWeightage > 100 || hasValidationError())) {
      setTriggerShake(true);
      setTimeout(() => setTriggerShake(false), 500);
      return;
    }

    const valErrors = {};
    if (warningsEnabled) {
      if (!subCode.trim()) valErrors.subCode = "Course Code is required";
      if (!subCredits) valErrors.subCredits = "Credits are required";
    }

    if (Object.keys(valErrors).length > 0 && warningsEnabled) {
      setErrors(valErrors);
      setTriggerShake(true);
      setActiveStep(1);
      setTimeout(() => setTriggerShake(false), 500);
      return;
    }

    const calculated = calculateResults();
    if (calculated) {
      setResults(calculated);
      setIsCalculated(true);
      setActiveStep(6); // Automatically jump to step 6 to view results
    }
  };

  const handleSaveClick = () => {
    if (warningsEnabled && (currentTotalWeightage > 100 || hasValidationError())) {
      setTriggerShake(true);
      setTimeout(() => setTriggerShake(false), 500);
      return;
    }
    if (warningsEnabled && !isValidationComplete()) {
      const valErrors = {};
      if (!subCode.trim()) valErrors.subCode = "Course Code is required";
      if (!subCredits) valErrors.subCredits = "Credits are required";
      setErrors(valErrors);
      setTriggerShake(true);
      setActiveStep(1);
      setTimeout(() => setTriggerShake(false), 500);
      return;
    }
    
    // Automatically perform calculations
    const finalRes = calculateResults();
    if (finalRes) {
      setResults(finalRes);
      setIsCalculated(true);
    }
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    const finalSelectionLogic = selectionLogic === 'custom' ? `best_${customBestOfX}_${customBestOfY}` : selectionLogic;
    
    const subjectData = {
      id: editingId || Date.now().toString(),
      code: subCode.trim() ? subCode.trim().toUpperCase() : 'TEMP',
      name: subName || 'Untitled Subject',
      credits: parseInt(subCredits) || 3,
      attendance: parseFloat(attendance) || 0,
      attendanceWeightage: parseWeightage(attendanceWeightage, 5),
      weightage: parseWeightage(caWeightage, 25),
      selectionLogic: finalSelectionLogic,
      assessments: assessments.map(a => ({
        ...a,
        obtainedMarks: a.obtainedMarks === '' ? 0 : parseFloat(a.obtainedMarks) || 0,
        totalMarks: parseFloat(a.totalMarks) || 30
      })),
      midtermApplicable,
      midtermObtained: midtermApplicable ? (parseFloat(midtermObtained) || 0) : 0,
      midtermTotal: parseFloat(midtermTotal) || 30,
      midtermWeightage: parseWeightage(midtermWeightage, 20),
      endSemApplicable,
      endSemObtained: endSemApplicable ? (parseFloat(endSemObtained) || 0) : 0,
      endSemTotal: parseFloat(endSemTotal) || 100,
      endSemWeightage: parseWeightage(endSemWeightage, 50),
      includeInCGPA: includeInCGPA,
      totalClasses: parseInt(totalClasses) || 40,
      attendedClasses: parseInt(attendedClasses) || 40
    };

    onSaveSubject(subjectData);
    setShowSaveConfirm(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setSubCode('');
    setSubName('');
    setSubCredits(defaultCredits);
    setAttendance(100);
    setAttendanceWeightage(5);
    setTotalClasses(40);
    setAttendedClasses(40);
    setCaCount(defaultCACount);
    setTotalMarksPerCA(defaultMaxMarks);
    setCaWeightage(defaultWeightage);
    setSelectionLogic('all');
    setCaApplicable(true);
    setAssessments((() => {
      const arr = [];
      for (let i = 1; i <= defaultCACount; i++) {
        arr.push({ name: `CA${i}`, obtainedMarks: '', totalMarks: defaultMaxMarks });
      }
      return arr;
    })());
    setMidtermApplicable(false);
    setMidtermObtained('');
    setEndSemApplicable(false);
    setEndSemObtained('');
    setIsCalculated(false);
    setResults(null);
    setIsImported(false);
    setIncludeInCGPA(true);
    setActiveStep(1);
    setErrors({});
  };

  const exportResult = async (format) => {
    if (!isCalculated || !results) return;

    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    element.style.width = '480px';
    element.style.backgroundColor = '#ffffff';
    element.style.fontFamily = "'Inter', 'system-ui', 'sans-serif'";
    element.style.color = '#1e293b';
    element.style.padding = '30px';
    element.style.borderRadius = '24px';
    element.style.border = '1px solid #e2e8f0';

    const caListHtml = assessments.map(a => {
      const pct = a.totalMarks > 0 ? (parseFloat(a.obtainedMarks || 0) / parseFloat(a.totalMarks)) * 100 : 0;
      return `
        <div style="display: flex; flex-direction: column; gap: 4px; padding: 10px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #475569;">
            <span>${a.name}</span>
            <span>${a.obtainedMarks || 0} / ${a.totalMarks} (${pct.toFixed(0)}%)</span>
          </div>
          <div style="width: 100%; height: 5px; border-radius: 9999px; overflow: hidden; background-color: #e2e8f0;">
            <div style="width: ${pct}%; height: 100%; border-radius: 9999px; background-color: #10b981;"></div>
          </div>
        </div>
      `;
    }).join('');

    const midtermHtml = midtermApplicable ? `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 8px; font-size: 11px;">
        <span style="font-weight: 700; color: #475569;">Midterm Exam</span>
        <strong style="color: #1e293b;">${midtermObtained || 0} / ${midtermTotal} (Est: ${results.midPts.toFixed(1)} / ${midtermWeightage})</strong>
      </div>
    ` : '';

    const endSemHtml = endSemApplicable ? `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 8px; font-size: 11px;">
        <span style="font-weight: 700; color: #475569;">End Semester Exam</span>
        <strong style="color: #1e293b;">${endSemObtained || 0} / ${endSemTotal} (Est: ${results.endPts.toFixed(1)} / ${endSemWeightage})</strong>
      </div>
    ` : '';

    element.innerHTML = `
      <div style="background-color: #ffffff; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 18px; font-weight: 900; color: #4f46e5; margin: 0;">MarkFlow</h1>
            <span style="font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 3px; display: block; letter-spacing: 0.5px;">Academic OS Calculator</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Subject Code</span>
            <div style="font-size: 12px; font-weight: 900; color: #1e293b; margin-top: 2px; text-transform: uppercase;">${subCode || 'UNSPECIFIED'}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px;">
          <div style="height: 50px; width: 50px; border-radius: 50%; background-color: #ecfdf5; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: #10b981; border: 1px solid #10b98120;">
            ${results.gradeInfo.l}
          </div>
          <div>
            <h3 style="font-size: 13px; font-weight: 800; color: #1e293b; margin: 0; text-transform: uppercase;">${subName || 'Untitled Subject'}</h3>
            <span style="font-size: 10px; font-weight: 700; color: #94a3b8; margin-top: 2px; display: block;">${subCredits} Credits • ${results.finalPercentage.toFixed(1)}% Score</span>
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background-color: #f8fafc; text-align: center; margin-bottom: 20px; display: flex; justify-content: space-around; align-items: center;">
          <div style="text-align: center;">
            <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Total Score</div>
            <div style="font-size: 20px; font-weight: 900; color: #4f46e5; margin-top: 4px;">${results.finalObtained.toFixed(1)} / ${results.totalWeightage}</div>
          </div>
          <div style="height: 35px; width: 1px; background-color: #cbd5e1;"></div>
          <div style="text-align: center;">
            <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Attendance</div>
            <div style="font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 4px;">${attendance}%</div>
          </div>
        </div>

        <h3 style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">CA Breakdown (Est: ${results.caPts.toFixed(1)} / ${caWeightage})</h3>
        <div>
          ${caListHtml}
        </div>

        ${midtermHtml || endSemHtml ? `
          <h3 style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; margin-top: 15px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Exams Contribution</h3>
          <div>
            ${midtermHtml}
            ${endSemHtml}
          </div>
        ` : ''}

        <div style="margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 12px; text-align: center; font-size: 8px; color: #94a3b8; font-weight: 600;">
          Report generated dynamically by MarkFlow Academic OS.
        </div>
      </div>
    `;

    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      if (format === 'png') {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `MarkFlow_Subject_Calculation_${subCode || 'UNSPECIFIED'}_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width / 2.2, canvas.height / 2.2]
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2.2, canvas.height / 2.2, undefined, 'FAST');
        pdf.save(`MarkFlow_Subject_Report_${subCode || 'UNSPECIFIED'}_${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    } catch (err) {
      console.error('Export Error:', err);
    } finally {
      document.body.removeChild(element);
    }
  };

  const handleToggleInclude = (e, sub) => {
    e.stopPropagation();
    const updated = {
      ...sub,
      includeInCGPA: sub.includeInCGPA !== undefined ? !sub.includeInCGPA : false
    };
    onSaveSubject(updated);
  };

  const handleNext = () => {
    const valErrors = {};

    if (warningsEnabled) {
      if (activeStep === 1) {
        if (!subCode.trim()) valErrors.subCode = "Course Code need to be filled *";
        if (!subCredits) valErrors.subCredits = "Credits need to be filled *";
      } else if (activeStep === 2) {
        if (attendance === '') {
          valErrors.attendance = "Attendance Percentage need to be filled *";
        }
        if (attendanceWeightage === '') {
          valErrors.attendanceWeightage = "Attendance Weightage need to be filled *";
        }
      } else if (activeStep === 3 && caApplicable) {
        if (caWeightage === '') {
          valErrors.caWeightage = "CA Weightage need to be filled *";
        }
        const emptyIndices = assessments
          .map((a, i) => (a.obtainedMarks === '' ? i : -1))
          .filter(i => i !== -1);
        if (emptyIndices.length > 0) {
          valErrors.ca = "Obtained marks need to be filled *";
          valErrors.emptyCaIndices = emptyIndices;
          addToast("Please fill in obtained marks for all CA fields, or disable the CA toggle above.", "error");
        }
      } else if (activeStep === 4 && midtermApplicable) {
        if (midtermObtained === '') {
          valErrors.midterm = "Obtained marks need to be filled *";
        }
        if (midtermTotal === '') {
          valErrors.midtermTotal = "Total max marks need to be filled *";
        }
        if (midtermWeightage === '') {
          valErrors.midtermWeightage = "Midterm weightage need to be filled *";
        }
      } else if (activeStep === 5 && endSemApplicable) {
        if (endSemObtained === '') {
          valErrors.endSem = "Obtained marks need to be filled *";
        }
        if (endSemTotal === '') {
          valErrors.endSemTotal = "Total max marks need to be filled *";
        }
        if (endSemWeightage === '') {
          valErrors.endSemWeightage = "End Sem weightage need to be filled *";
        }
      }
    }

    if (Object.keys(valErrors).length > 0 && warningsEnabled) {
      setErrors(valErrors);
      setTriggerShake(true);
      setTimeout(() => setTriggerShake(false), 500);
      return;
    }
    
    setErrors({});
    if (activeStep < 6) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
    }
  };

  // Step Indicators Config
  const steps = [
    { num: 1, label: 'Subject Info' },
    { num: 2, label: 'Attendance' },
    { num: 3, label: 'CA' },
    { num: 4, label: 'Midterm' },
    { num: 5, label: 'End Sem' },
    { num: 6, label: 'Result' }
  ];

  // Motion variants for shake animation
  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.4 }
    },
    stable: { x: 0 }
  };

  const handleExport = (type) => {
    if (!isCalculated || !results) {
      if (addToast) {
        addToast("Please complete your subject marks calculation first before exporting!", "error");
      } else {
        alert("Please complete your subject marks calculation first before exporting!");
      }
      return;
    }
    exportResult(type);
  };

  // Dynamic formula helper variables
  const attMultiplier = getAttendanceMultiplier(attendance);
  const attPointsText = `${(attMultiplier * 100).toFixed(0)}% × ${attendanceWeightage}`;
  const attPtsResult = (attMultiplier * parseFloat(attendanceWeightage || 0)).toFixed(2);

  return (
    <div id="subject-wise-container" className="text-left select-none relative max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start pb-28 lg:pb-12 px-4 sm:px-6">
      
      {/* LEFT COLUMN: CALCULATOR */}
      <div className="flex-1 w-full space-y-6">
        
        {/* HEADER PANEL */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-500">
                <Calculator size={18} />
              </span>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Subject-wise Calculator
              </h2>
              <Sparkles size={15} className="text-indigo-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Premium academic wizard to configure and evaluate assessment contributions step-by-step.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-center">
            <button 
              onClick={resetForm} 
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <RefreshCw size={12} className="text-slate-500" />
              <span>Reset Form</span>
            </button>
             <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              title="Download a comprehensive PDF report of this subject's assessments and grade estimation"
            >
              <Download size={12} />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport('png')}
              className="px-4 py-2.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              title="Save this subject's CA weightage and grading board as a shareable PNG image card"
            >
              <Image size={12} />
              <span>Export PNG</span>
            </button>
          </div>
        </div>

        {/* STEPPER CONTAINER */}
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-soft-sm overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[620px] md:min-w-0 px-2">
            {steps.map((s, index) => {
              const isActive = activeStep === s.num;
              const isCompleted = activeStep > s.num;
              const isCAImportedStep = s.num === 3 && isImported;
              
              return (
                <React.Fragment key={s.num}>
                  <button 
                    onClick={() => {
                      if (s.num === 1 || isValidationComplete()) {
                        setActiveStep(s.num);
                      } else {
                        setTriggerShake(true);
                        setTimeout(() => setTriggerShake(false), 500);
                      }
                    }}
                    className="flex flex-col items-center gap-2 focus:outline-none group relative cursor-pointer"
                  >
                    <div 
                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110 ring-4 ring-indigo-500/10' 
                          : isCAImportedStep
                            ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-400 ring-4 ring-emerald-500/15 shadow-md shadow-emerald-500/5 animate-pulse'
                            : isCompleted 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60'
                      }`}
                    >
                      {isCAImportedStep ? (
                        <CheckCircle size={14} strokeWidth={3} className="text-emerald-600" />
                      ) : isCompleted ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        s.num
                      )}
                    </div>
                    <span 
                      className={`text-[10px] font-bold tracking-tight transition-all ${
                        isActive 
                          ? 'text-indigo-600 font-extrabold' 
                          : isCAImportedStep
                            ? 'text-emerald-600 font-extrabold'
                            : isCompleted 
                              ? 'text-emerald-600' 
                              : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {s.label} {isCAImportedStep && '✓'}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div 
                      className={`flex-1 h-[2px] mx-2 rounded transition-all duration-300 ${
                        activeStep > s.num ? 'bg-emerald-200' : 'bg-slate-100'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* WEIGHTAGE LIMIT WARNING BANNER */}
        {currentTotalWeightage > 100 && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-rose-700 shadow-soft-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-800">Weightage Limit Exceeded</h4>
              <p className="text-[10px] font-bold text-rose-600 leading-relaxed">
                Total weightage cannot exceed 100%. Currently configured: <strong className="text-rose-700 font-extrabold">{currentTotalWeightage}%</strong>. Please reduce the weightage values in your Attendance ({attendanceWeightage}%), CA ({caWeightage}%), Midterm ({midtermWeightage}%), or End Sem ({endSemWeightage}%) settings.
              </p>
            </div>
          </div>
        )}

        {/* STEP CONTENT SWITCHER */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* STEP 1: SUBJECT INFORMATION */}
            {activeStep === 1 && (
              <motion.div 
                animate={triggerShake ? "shake" : "stable"}
                variants={shakeVariants}
              >
                <Card className="!p-6 space-y-5 border-slate-100/80">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">1</span>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">Subject Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Course Code <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="e.g. CSE202"
                        value={subCode} 
                        onChange={(e) => { 
                          setIsCalculated(false); 
                          setSubCode(e.target.value.toUpperCase()); 
                          if (errors.subCode) setErrors(prev => ({ ...prev, subCode: null }));
                        }} 
                        className={`w-full px-3.5 py-3 text-xs bg-slate-50/50 border rounded-xl outline-none font-bold uppercase tracking-wider text-slate-800 transition-all ${
                          errors.subCode 
                            ? 'border-rose-300 ring-4 ring-rose-500/5 focus:border-rose-400' 
                            : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white'
                        }`} 
                      />
                      {errors.subCode && (
                        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle size={10} />
                          {errors.subCode}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Course Title <span className="text-slate-400">(Optional)</span></label>
                      <input 
                        type="text" 
                        placeholder="e.g. Object Oriented Programming"
                        value={subName} 
                        onChange={(e) => { setIsCalculated(false); setSubName(toTitleCase(e.target.value)); }} 
                        className="w-full px-3.5 py-3 text-xs bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all" 
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Credits <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        min="1" 
                        max="10" 
                        value={subCredits} 
                        onChange={(e) => { 
                          setIsCalculated(false); 
                          const sanitized = sanitizeNumericInput(e.target.value);
                          const val = parseInt(sanitized);
                          setSubCredits(isNaN(val) ? '' : val); 
                          if (errors.subCredits) setErrors(prev => ({ ...prev, subCredits: null }));
                        }} 
                        className={`w-full px-3.5 py-3 text-xs bg-slate-50/50 border rounded-xl outline-none font-bold text-slate-800 transition-all ${
                          errors.subCredits 
                            ? 'border-rose-300 ring-4 ring-rose-500/5 focus:border-rose-400' 
                            : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white'
                        }`} 
                      />
                      {errors.subCredits && (
                        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle size={10} />
                          {errors.subCredits}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100/80 rounded-2xl shadow-soft-sm">
                    <div className="space-y-0.5 max-w-md">
                      <span className="block text-[10px] font-black text-slate-700 uppercase tracking-wide">Include in SGPA / CGPA Calculations</span>
                      <span className="block text-[9px] text-slate-400 font-semibold leading-relaxed">
                        Toggle to count this subject's credits and grade towards your Semester SGPA and CGPA dashboard equations.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={includeInCGPA} 
                        onChange={(e) => { setIsCalculated(false); setIncludeInCGPA(e.target.checked); }} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-slate-200"></div>
                    </label>
                  </div>

                  <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl flex items-start gap-3">
                    <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Course Code and Credits are essential parameters used for GPA and CGPA dashboard equations. Please fill them out correctly to unlock assessment calculators.
                    </span>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: ATTENDANCE */}
            {activeStep === 2 && (
              <Card className="!p-6 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">2</span>
                  <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">Attendance Parameters</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Attendance Percentage (%)</label>
                    <input 
                      type="text" 
                      min="0"
                      max="100"
                      value={attendance} 
                      onChange={(e) => { 
                        setIsCalculated(false); 
                        setAttendance(sanitizeNumericInput(e.target.value)); 
                        if (errors.attendance) setErrors(prev => ({ ...prev, attendance: null }));
                      }} 
                      className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold text-slate-800 transition-all ${
                        (getAttendanceValidationError() || errors.attendance) ? 'border-rose-300 ring-2 ring-rose-500/5 focus:border-rose-400' : 'border-slate-200 focus:border-indigo-400 focus:bg-white'
                      }`} 
                    />
                    {(getAttendanceValidationError() || errors.attendance) && (
                      <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle size={10} />
                        {getAttendanceValidationError() || errors.attendance}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Attendance Weightage (Marks)</label>
                    <input 
                      type="text" 
                      value={attendanceWeightage} 
                      onChange={(e) => { 
                        setIsCalculated(false); 
                        setAttendanceWeightage(sanitizeNumericInput(e.target.value)); 
                        if (errors.attendanceWeightage) setErrors(prev => ({ ...prev, attendanceWeightage: null }));
                      }} 
                      className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold text-slate-800 transition-all ${
                        errors.attendanceWeightage ? 'border-rose-300 ring-2 ring-rose-500/5 focus:border-rose-400' : 'border-slate-200 focus:border-indigo-400 focus:bg-white'
                      }`} 
                    />
                    {errors.attendanceWeightage && (
                      <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle size={10} />
                        {errors.attendanceWeightage}
                      </p>
                    )}
                  </div>
                </div>

                {/* ATTENDANCE BEAUTIFUL FORMULA BOX */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50/60 border border-slate-100/80 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle size={12} className="text-slate-400" />
                      Attendance Formula Tiers
                    </span>
                    <div className="space-y-1.5">
                      {[
                        { tier: '90%+', pct: '100% of weightage' },
                        { tier: '85%+', pct: '80% of weightage' },
                        { tier: '80%+', pct: '60% of weightage' },
                        { tier: '75%+', pct: '40% of weightage' },
                        { tier: 'Below 75%', pct: '0% of weightage' }
                      ].map((t, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-slate-200/40 pb-1 last:border-0 last:pb-0">
                          <span>{t.tier}</span>
                          <span className="text-indigo-600 font-extrabold">{t.pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/50 p-4 rounded-2xl flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Live Expression
                      </span>
                      <h4 className="text-[11px] font-extrabold text-slate-700 mt-2">Dynamic Evaluation</h4>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">
                        Based on your current attendance values:
                      </p>
                    </div>

                    <div className="bg-white border border-indigo-100/40 p-2.5 rounded-xl text-center space-y-1 shadow-soft-sm">
                      <div className="text-[11px] font-mono font-black text-slate-800">
                        {attendance}% attendance → {attMultiplier * 100}% × {attendanceWeightage} marks
                      </div>
                      <div className="text-xs font-black text-indigo-600">
                        = {attPtsResult} / {attendanceWeightage} marks
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

             {/* STEP 3: CA SECTION */}
             {activeStep === 3 && (
               <Card className="!p-6 space-y-5">
                 <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                   <div className="flex items-center gap-2">
                     <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">3</span>
                     <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">Continuous Assessment (CA)</h3>
                   </div>
                   <div className="flex items-center gap-3">
                     {caApplicable && isImported && (
                       <div className="flex items-center gap-2">
                         <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1 animate-pulse">
                           <CheckCircle size={10} />
                           Imported from Quick CA
                         </span>
                         <button 
                           onClick={() => setIsImported(false)}
                           className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                           title="Disconnect Import"
                         >
                           <X size={10} />
                         </button>
                       </div>
                     )}
                     <label className="relative inline-flex items-center cursor-pointer select-none">
                       <input 
                         type="checkbox" 
                         checked={caApplicable} 
                         onChange={(e) => { setIsCalculated(false); setCaApplicable(e.target.checked); }} 
                         className="sr-only peer" 
                       />
                       <div className="w-9 h-5 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-slate-200"></div>
                     </label>
                   </div>
                 </div>

                 <AnimatePresence initial={false}>
                   {caApplicable ? (
                     <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       transition={{ duration: 0.2 }}
                       className="space-y-5 overflow-hidden"
                     >
                       {errors.ca && (
                         <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold mt-1">
                           <AlertCircle size={16} className="shrink-0 mt-0.5" />
                           <div>
                             <p className="font-bold text-rose-800">CA Marks Required</p>
                             <p className="text-[10px] mt-0.5 text-rose-600 leading-normal">
                               Please enter obtained marks for all assessments below to continue. If this subject does not have Continuous Assessments, <strong>disable the CA toggle</strong> in the top-right corner.
                             </p>
                           </div>
                         </div>
                       )}

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">CA Weightage (Marks)</label>
                    <input 
                      type="text" 
                      value={caWeightage} 
                      onChange={(e) => { 
                        setIsCalculated(false); 
                        setCaWeightage(sanitizeNumericInput(e.target.value)); 
                        if (errors.caWeightage) setErrors(prev => ({ ...prev, caWeightage: null }));
                      }} 
                      className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold text-slate-800 focus:border-indigo-400 focus:bg-white transition-all ${
                        errors.caWeightage ? 'border-rose-400 ring-2 ring-rose-500/5 focus:border-rose-400 bg-rose-50/10' : 'border-slate-200'
                      }`} 
                    />
                    {errors.caWeightage && (
                      <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle size={10} />
                        {errors.caWeightage}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">No. of CAs</label>
                    <select 
                      value={caCount} 
                      onChange={(e) => handleCaCountChange(e.target.value)} 
                      className="w-full px-3.5 py-3 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer focus:border-indigo-400 focus:bg-white transition-all"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Assessment' : 'Assessments'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Selection Logic</label>
                    <select 
                      value={selectionLogic} 
                      onChange={(e) => { setIsCalculated(false); setSelectionLogic(e.target.value); }} 
                      className="w-full px-3.5 py-3 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer focus:border-indigo-400 focus:bg-white transition-all"
                    >
                      <option value="all">Average (All Mandatory)</option>
                      <option value="best_2_3">Best 2 of 3 CAs</option>
                      <option value="best_3_5">Best 3 of 5 CAs</option>
                      <option value="highest">Highest Score Only</option>
                    </select>
                  </div>
                </div>

                {/* COMPACT ACADEMIC TABLE */}
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2">
                    <span>Assessment Name</span>
                    <span>Obtained / Total Marks</span>
                  </div>
                  
                  <div className="space-y-2">
                    {assessments.map((ass, index) => {
                      const caErr = getCAValidationError(ass);
                      const isCaEmptyError = errors.emptyCaIndices && errors.emptyCaIndices.includes(index);
                      const hasError = caErr || isCaEmptyError;
                      const errorMsg = caErr || (isCaEmptyError ? "Obtained marks required" : null);
                      return (
                        <div key={index} className="flex flex-col gap-1.5 p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-600">{ass.name}</span>
                            <div className="flex items-center gap-2.5">
                              <input 
                                type="text" 
                                placeholder={focusedInput === `caObt-${index}` ? "" : "Obt"} 
                                value={ass.obtainedMarks} 
                                onChange={(e) => handleAssessmentChange(index, 'obtainedMarks', e.target.value)} 
                                onFocus={(e) => {
                                  e.target.select();
                                  setFocusedInput(`caObt-${index}`);
                                }}
                                onBlur={() => setFocusedInput(null)}
                                className={`w-16 text-center px-2 py-1.5 text-xs bg-white rounded-lg outline-none font-bold transition-all border ${
                                  hasError ? 'border-rose-400 ring-2 ring-rose-500/5 focus:border-rose-400 font-extrabold' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10'
                                }`}
                              />
                              <span className="text-slate-300 font-bold">/</span>
                              <input 
                                type="text" 
                                placeholder="Tot" 
                                value={ass.totalMarks} 
                                onChange={(e) => handleAssessmentChange(index, 'totalMarks', e.target.value)} 
                                onFocus={(e) => e.target.select()}
                                className="w-16 text-center px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-indigo-400" 
                              />
                            </div>
                          </div>
                          {hasError && (
                            <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 self-end">
                              <AlertCircle size={10} />
                              {errorMsg}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SMART EMPTY STATES OR QUICK CA BADGE */}
                {assessments.length === 0 && (
                  <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/30 space-y-3">
                    <p className="text-xs font-semibold text-slate-400">No CA marks entered yet.</p>
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={handleOpenCreateModal}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 font-extrabold text-[10px] rounded-xl transition-all"
                      >
                        Import from Quick CA
                      </button>
                      <button 
                        onClick={() => setAssessments([
                          { name: 'CA1', obtainedMarks: '', totalMarks: 30 },
                          { name: 'CA2', obtainedMarks: '', totalMarks: 30 },
                          { name: 'CA3', obtainedMarks: '', totalMarks: 30 }
                        ])}
                        className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-[10px] rounded-xl transition-all"
                      >
                        Enter Manually
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="py-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                Continuous Assessment (CA) is disabled. Toggle above to add CA weighting metrics.
              </div>
            )}
          </AnimatePresence>
        </Card>
      )}

            {/* STEP 4: MIDTERM */}
            {activeStep === 4 && (
              <Card className="!p-6 space-y-5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">4</span>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">Midterm Examination</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={midtermApplicable} 
                      onChange={(e) => { setIsCalculated(false); setMidtermApplicable(e.target.checked); }} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-slate-200"></div>
                  </label>
                </div>

                <AnimatePresence initial={false}>
                  {midtermApplicable ? (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="flex-col space-y-1.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1.5">
                              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Obtained Marks</label>
                              <input 
                                type="text" 
                                placeholder={focusedInput === 'midtermObtained' ? "" : "e.g. 24"} 
                                value={midtermObtained} 
                                onChange={(e) => { 
                                  setIsCalculated(false); 
                                  setMidtermObtained(sanitizeNumericInput(e.target.value)); 
                                  if (errors.midterm) setErrors(prev => ({ ...prev, midterm: null }));
                                }} 
                                onFocus={(e) => {
                                  e.target.select();
                                  setFocusedInput('midtermObtained');
                                }}
                                onBlur={() => setFocusedInput(null)}
                                className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold text-center transition-all ${
                                  (getMidtermValidationError() || errors.midterm) ? 'border-rose-400 ring-2 ring-rose-500/5 focus:border-rose-400 bg-rose-50/10' : 'border-slate-200 focus:border-indigo-400 focus:bg-white'
                                }`} 
                              />
                            </div>
                            <span className="text-slate-300 font-black mt-6 text-sm">/</span>
                            <div className="flex-1 space-y-1.5">
                              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Total Max Marks</label>
                              <input 
                                type="text" 
                                placeholder="30"
                                value={midtermTotal} 
                                onChange={(e) => { 
                                  setIsCalculated(false); 
                                  setMidtermTotal(sanitizeNumericInput(e.target.value)); 
                                  if (errors.midtermTotal) setErrors(prev => ({ ...prev, midtermTotal: null }));
                                }} 
                                onFocus={(e) => e.target.select()}
                                className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold text-center focus:border-indigo-400 focus:bg-white transition-all ${
                                  errors.midtermTotal ? 'border-rose-400 ring-2 ring-rose-500/5 focus:border-rose-400 bg-rose-50/10' : 'border-slate-200'
                                }`} 
                              />
                            </div>
                          </div>
                          {(getMidtermValidationError() || errors.midterm || errors.midtermTotal) && (
                            <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1 justify-end">
                              <AlertCircle size={10} />
                              {getMidtermValidationError() || errors.midterm || errors.midtermTotal}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Midterm Weightage (Marks)</label>
                          <input 
                            type="text" 
                            placeholder="20"
                            value={midtermWeightage} 
                            onChange={(e) => { 
                              setIsCalculated(false); 
                              setMidtermWeightage(sanitizeNumericInput(e.target.value)); 
                              if (errors.midtermWeightage) setErrors(prev => ({ ...prev, midtermWeightage: null }));
                            }} 
                            className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all ${
                              errors.midtermWeightage ? 'border-rose-400 ring-2 ring-rose-500/5 focus:border-rose-400 bg-rose-50/10' : 'border-slate-200'
                            }`} 
                          />
                          {errors.midtermWeightage && (
                            <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                              <AlertCircle size={10} />
                              {errors.midtermWeightage}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                      Midterms are disabled for this subject. Toggle above to configure midterm score details.
                    </div>
                  )}
                </AnimatePresence>
              </Card>
            )}

            {/* STEP 5: END SEMESTER */}
            {activeStep === 5 && (
              <Card className="!p-6 space-y-5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">5</span>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">End Semester Examination</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={endSemApplicable} 
                      onChange={(e) => { setIsCalculated(false); setEndSemApplicable(e.target.checked); }} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-slate-200"></div>
                  </label>
                </div>

                <AnimatePresence initial={false}>
                  {endSemApplicable ? (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="flex-col space-y-1.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1.5">
                              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Obtained Marks</label>
                              <input 
                                type="text" 
                                placeholder={focusedInput === 'endSemObtained' ? "" : "e.g. 78"} 
                                value={endSemObtained} 
                                onChange={(e) => { 
                                  setIsCalculated(false); 
                                  setEndSemObtained(sanitizeNumericInput(e.target.value)); 
                                  if (errors.endSem) setErrors(prev => ({ ...prev, endSem: null }));
                                }} 
                                onFocus={(e) => {
                                  e.target.select();
                                  setFocusedInput('endSemObtained');
                                }}
                                onBlur={() => setFocusedInput(null)}
                                className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold text-center transition-all ${
                                  (getEndSemValidationError() || errors.endSem) ? 'border-rose-400 ring-2 ring-rose-500/5 focus:border-rose-400 bg-rose-50/10' : 'border-slate-200 focus:border-indigo-400 focus:bg-white'
                                }`} 
                              />
                            </div>
                            <span className="text-slate-300 font-black mt-6 text-sm">/</span>
                            <div className="flex-1 space-y-1.5">
                              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Total Max Marks</label>
                              <input 
                                type="text" 
                                placeholder="100"
                                value={endSemTotal} 
                                onChange={(e) => { 
                                  setIsCalculated(false); 
                                  setEndSemTotal(sanitizeNumericInput(e.target.value)); 
                                  if (errors.endSemTotal) setErrors(prev => ({ ...prev, endSemTotal: null }));
                                }} 
                                onFocus={(e) => e.target.select()}
                                className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold text-center focus:border-indigo-400 focus:bg-white transition-all ${
                                  errors.endSemTotal ? 'border-rose-400 ring-2 ring-rose-500/5 focus:border-rose-400 bg-rose-50/10' : 'border-slate-200'
                                }`} 
                              />
                            </div>
                          </div>
                          {(getEndSemValidationError() || errors.endSem || errors.endSemTotal) && (
                            <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1 justify-end">
                              <AlertCircle size={10} />
                              {getEndSemValidationError() || errors.endSem || errors.endSemTotal}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">End Sem Weightage (Marks)</label>
                          <input 
                            type="text" 
                            placeholder="50"
                            value={endSemWeightage} 
                            onChange={(e) => { 
                              setIsCalculated(false); 
                              setEndSemWeightage(sanitizeNumericInput(e.target.value)); 
                              if (errors.endSemWeightage) setErrors(prev => ({ ...prev, endSemWeightage: null }));
                            }} 
                            className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all ${
                              errors.endSemWeightage ? 'border-rose-400 ring-2 ring-rose-500/5 focus:border-rose-400 bg-rose-50/10' : 'border-slate-200'
                            }`} 
                          />
                          {errors.endSemWeightage && (
                            <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                              <AlertCircle size={10} />
                              {errors.endSemWeightage}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                      End Semester evaluation is disabled. Toggle above to add End Sem weighting metrics.
                    </div>
                  )}
                </AnimatePresence>
              </Card>
            )}

            {/* STEP 6: FINAL RESULTS */}
            {activeStep === 6 && (
              <div className="space-y-5">
                {isCalculated && results ? (
                  <div className="space-y-6">
                    <Card className="!p-6 border-indigo-100 bg-gradient-to-b from-white to-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft-lg">
                      <div className="flex flex-col items-center gap-3 shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Final Grade</span>
                        <div className={`h-24 w-24 rounded-full flex items-center justify-center text-4xl font-black shadow-soft border ${results.gradeInfo.color}`}>
                          {results.gradeInfo.l}
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 border-b border-slate-100 pb-3.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              Attendance:
                            </span>
                            <span className="font-black text-slate-700">{results.attPts.toFixed(2)} / {attendanceWeightage}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold flex items-center gap-1">
                              <BookOpen size={11} className="text-slate-400" />
                              CA Score:
                            </span>
                            <span className="font-black text-slate-700">{results.caPts.toFixed(2)} / {caApplicable ? caWeightage : 0}</span>
                          </div>
                          {midtermApplicable && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold flex items-center gap-1">
                                <Calendar size={11} className="text-slate-400" />
                                Midterm Exam:
                              </span>
                              <span className="font-black text-slate-700">{results.midPts.toFixed(2)} / {midtermWeightage}</span>
                            </div>
                          )}
                          {endSemApplicable && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold flex items-center gap-1">
                                <GraduationCap size={11} className="text-slate-400" />
                                End Sem:
                              </span>
                              <span className="font-black text-slate-700">{results.endPts.toFixed(2)} / {endSemWeightage}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs text-slate-500 font-bold">Total Weighted Score:</span>
                          <span className="text-sm font-black text-indigo-600">
                            {results.finalObtained.toFixed(2)} / {results.totalWeightage}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-bold">Final Percentage:</span>
                          <span className="text-sm font-black text-emerald-600">
                            {results.finalPercentage.toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
                          <button
                            onClick={() => exportResult('pdf')}
                            className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <BookOpen size={11} />
                            Download PDF Report
                          </button>
                          <button
                            onClick={() => exportResult('png')}
                            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Layers size={11} />
                            Download PNG Card
                          </button>
                        </div>
                      </div>
                    </Card>

                    {/* "WHAT-IF" TARGET SCORE OPTIMIZER SANDBOX */}
                    <Card className="!p-6 bg-white border border-indigo-100 shadow-soft-lg">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4 select-none">
                        <Target size={16} className="text-indigo-500 animate-pulse" />
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">"What-If" Target Score Sandbox</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Grade Shortcut Goal</label>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: 'O (90%+)', val: 90 },
                              { label: 'A+ (80%+)', val: 80 },
                              { label: 'A (70%+)', val: 70 },
                              { label: 'B+ (60%+)', val: 60 },
                              { label: 'B (51%+)', val: 51 },
                              { label: 'C (41%+)', val: 41 },
                              { label: 'D (40%+)', val: 40 }
                            ].map(g => (
                              <button
                                key={g.label}
                                type="button"
                                onClick={() => setSandboxTarget(g.val)}
                                className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${sandboxTarget >= g.val && (sandboxTarget < g.val + 10 || g.val === 90) ? 'bg-indigo-600 border-indigo-600 text-white shadow-soft-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-500">Or Adjust Target Cumulative Percentage</label>
                            <span className="text-xs font-black text-indigo-600">{sandboxTarget}%</span>
                          </div>
                          <input
                            type="range"
                            min="40"
                            max="100"
                            step="1"
                            value={sandboxTarget}
                            onChange={(e) => setSandboxTarget(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        {(() => {
                          const targetScoreNeeded = (sandboxTarget / 100) * results.totalWeightage;
                          const obtainedBeforeFinal = results.attPts + results.caPts + (midtermApplicable ? results.midPts : 0);
                          
                          let displayMessage = "";
                          let targetAlertStyle = "";

                          if (endSemApplicable) {
                            const endSemWeight = parseWeightage(endSemWeightage, 50);
                            const endSemMax = parseFloat(endSemTotal) || 100;
                            
                            const neededWeight = targetScoreNeeded - obtainedBeforeFinal;
                            const neededObtained = endSemWeight > 0 ? (neededWeight / endSemWeight) * endSemMax : 0;

                            if (neededObtained > endSemMax) {
                              displayMessage = `⚠️ Mathematical Impossibility! To hit ${sandboxTarget}%, you would need ${neededObtained.toFixed(1)} / ${endSemMax} marks in the End Sem exam. Lower your target score.`;
                              targetAlertStyle = "text-rose-600 bg-rose-50 border-rose-100";
                            } else if (neededObtained <= 0) {
                              displayMessage = `🎉 Already Achieved! You have already secured enough marks to hit ${sandboxTarget}%. You will meet this target even with 0 marks in the End Sem exam.`;
                              targetAlertStyle = "text-emerald-600 bg-emerald-50 border-emerald-100";
                            } else {
                              displayMessage = `🎯 Target Score: You need to obtain exactly ${neededObtained.toFixed(1)} / ${endSemMax} marks (${((neededObtained / endSemMax) * 100).toFixed(1)}%) in your upcoming End Semester Exam to hit ${sandboxTarget}% overall.`;
                              targetAlertStyle = "text-indigo-600 bg-indigo-50 border-indigo-100";
                            }
                          } else {
                            displayMessage = `To hit ${sandboxTarget}%, you need a total of ${targetScoreNeeded.toFixed(1)} weighted marks. Currently you have ${results.finalObtained.toFixed(1)} marks.`;
                            targetAlertStyle = "text-slate-600 bg-slate-50 border-slate-200";
                          }

                          return (
                            <div className={`p-4 border rounded-xl text-xs font-bold leading-relaxed ${targetAlertStyle}`}>
                              {displayMessage}
                            </div>
                          );
                        })()}
                      </div>
                    </Card>

                    {/* LIVE INTERACTIVE MARKS PLAYGROUND */}
                    <Card className="!p-6 bg-white border border-emerald-100 shadow-soft-lg">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4 select-none">
                        <Sliders size={16} className="text-emerald-500 animate-pulse" />
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Live Grade Simulator Playground</h4>
                      </div>

                      {(() => {
                        const playTotalScore = results.attPts + parseFloat(playCA) + (midtermApplicable ? parseFloat(playMid) : 0) + (endSemApplicable ? parseFloat(playEnd) : 0);
                        const playGradeInfo = getGradeInfo(playTotalScore);

                        return (
                          <div className="space-y-5">
                            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                              <div className="text-left">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Simulated Score</span>
                                <span className="text-lg font-black text-slate-800">{playTotalScore.toFixed(1)}%</span>
                              </div>
                              <div className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-black border shadow-soft-sm ${playGradeInfo.color}`}>
                                {playGradeInfo.l}
                              </div>
                            </div>

                            <div className="space-y-4">
                              {/* CA Slider */}
                              {caApplicable && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>Continuous Assessment (CA)</span>
                                    <span>{parseFloat(playCA).toFixed(1)} / {parseWeightage(caWeightage, 25)}</span>
                                  </div>
                                  <input 
                                    type="range"
                                    min="0"
                                    max={parseWeightage(caWeightage, 25)}
                                    step="0.5"
                                    value={playCA}
                                    onChange={(e) => setPlayCA(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                  />
                                </div>
                              )}

                              {/* Midterm Slider */}
                              {midtermApplicable && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>Midterm Exam</span>
                                    <span>{parseFloat(playMid).toFixed(1)} / {parseWeightage(midtermWeightage, 20)}</span>
                                  </div>
                                  <input 
                                    type="range"
                                    min="0"
                                    max={parseWeightage(midtermWeightage, 20)}
                                    step="0.5"
                                    value={playMid}
                                    onChange={(e) => setPlayMid(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                  />
                                </div>
                              )}

                              {/* End Sem Slider */}
                              {endSemApplicable && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>End Semester Exam</span>
                                    <span>{parseFloat(playEnd).toFixed(1)} / {parseWeightage(endSemWeightage, 50)}</span>
                                  </div>
                                  <input 
                                    type="range"
                                    min="0"
                                    max={parseWeightage(endSemWeightage, 50)}
                                    step="0.5"
                                    value={playEnd}
                                    onChange={(e) => setPlayEnd(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                  />
                                </div>
                              )}
                            </div>
                            
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center leading-normal">
                              💡 Slide to adjust CA, midterm, or endsem scores dynamically to evaluate what-if grade outcomes instantly.
                            </p>
                          </div>
                        );
                      })()}
                    </Card>
                  </div>
                ) : (
                  <Card className="!p-8 text-center space-y-4 border-slate-100 bg-slate-50/20">
                    <div className="h-16 w-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-soft-sm">
                      <HelpCircle size={32} className="animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-700">Awaiting Evaluation</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-semibold">
                        Complete remaining required assessments and exams, then click 'Calculate Final Result' below.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* NAVIGATION WIZARD CONTROLS */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <button
            onClick={handleBack}
            disabled={activeStep === 1}
            className="px-4 py-3 bg-white border border-slate-200 text-slate-700 disabled:opacity-40 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-slate-100 outline-none cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
            Back
          </button>
          
          <div className="flex items-center gap-2.5">
            {activeStep < 6 ? (
              <button
                onClick={handleNext}
                disabled={activeStep === 2 && getAttendanceValidationError() !== null}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
              >
                Continue
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleCalculate}
                disabled={!isEvaluationReady() || currentTotalWeightage > 100 || hasValidationError()}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Calculator size={14} />
                Calculate Final Result
              </button>
            )}

            <button
              onClick={handleSaveClick}
              disabled={!isValidationComplete() || currentTotalWeightage > 100 || hasValidationError()}
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer disabled:cursor-not-allowed"
            >
              Save Subject
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: SAVED SUBJECTS */}
      <div className="lg:w-80 w-full shrink-0 space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-2">
          <GraduationCap size={15} className="text-slate-400" />
          Saved Dashboard Subjects
        </h3>
        
        {subjects.length === 0 && !undoSubject ? (
          <div className="text-center p-8 border border-dashed border-slate-200/80 bg-slate-50/40 rounded-3xl space-y-3 shadow-inner-sm select-none">
            <svg className="w-12 h-12 text-slate-300 mx-auto animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">No Saved Subjects</span>
            <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto font-medium">Complete calculations on the left and click 'Save Subject' to populate your live dashboard!</p>
          </div>
        ) : (
          <div className="space-y-3.5 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto overflow-visible scrollbar-thin pr-1">
            {undoSubject && (
              <Card className="!p-4 border border-rose-100 bg-rose-50/20 shadow-soft-sm relative overflow-hidden flex flex-col justify-center items-center text-center gap-2">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <AlertCircle size={12} />
                  Deleted subject in {Math.ceil(undoSubjectTimer / 1000)}s...
                </span>
                <button
                  onClick={onUndoSubjectDelete}
                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[9px] rounded-lg transition-all active:scale-95 shadow-sm shadow-rose-500/10 cursor-pointer"
                >
                  Undo Delete
                </button>
              </Card>
            )}
            
            {subjects.map((sub, idx) => {
              const isEditing = editingId === (sub.id || sub._id);
              const isExpanded = expandedSubjectId === (sub.id || sub._id);
              const subRes = getSavedSubjectResults(sub);
              
              return (
                <Card 
                  key={idx} 
                  onClick={() => setExpandedSubjectId(isExpanded ? null : (sub.id || sub._id))}
                  className={`!p-4 border transition-all cursor-pointer shadow-soft-sm relative group overflow-hidden bg-white select-none ${
                    isExpanded 
                      ? 'border-indigo-400 ring-2 ring-indigo-500/5' 
                      : isEditing
                        ? 'border-indigo-300 bg-indigo-50/10'
                        : 'border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50/60 pr-8 relative">
                    <div>
                      <span className="text-xs font-black text-slate-800 tracking-wide uppercase">{sub.code || 'NO CODE'}</span>
                      {sub.name && (
                        <span className="block text-[9px] font-bold text-slate-400 truncate max-w-[120px] uppercase tracking-wide mt-0.5">
                          {sub.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {subRes && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${subRes.gradeInfo.color.split(' ')[0]}`}>
                          {subRes.gradeInfo.l} ({subRes.finalPercentage.toFixed(0)}%)
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={12} className="text-slate-400 font-sans" /> : <ChevronDown size={12} className="text-slate-400 font-sans" />}
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteSubject(sub.id || sub._id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer z-10"
                      title="Delete Subject"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-500 font-bold">{(sub.credits !== undefined && sub.credits !== null) ? sub.credits : 3} Credits</span>
                    <span className="text-xs font-black text-indigo-600">
                      {subRes ? `${subRes.finalObtained.toFixed(1)} / ${subRes.totalWeightage}` : ''} Marks
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-slate-100/60 space-y-3"
                        onClick={(e) => e.stopPropagation()} // Prevent collapse on internal clicks
                      >

                        {/* PERFORMANCE MINI STACKED GRAPH */}
                        <div className="space-y-1 bg-slate-50 border border-slate-100/60 p-2.5 rounded-xl">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
                            Performance Mini-Graph
                          </span>
                          <div className="w-full bg-slate-200/50 rounded-lg h-3 overflow-hidden flex shadow-inner">
                            {/* Attendance */}
                            <div 
                              className="bg-indigo-500 h-full transition-all duration-300"
                              style={{ width: `${(subRes.attPts / (subRes.totalWeightage || 1)) * 100}%` }}
                              title={`Attendance: ${subRes.attPts.toFixed(1)}`}
                            />
                            {/* CA */}
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300"
                              style={{ width: `${(subRes.caPts / (subRes.totalWeightage || 1)) * 100}%` }}
                              title={`CA: ${subRes.caPts.toFixed(1)}`}
                            />
                            {/* Midterm */}
                            {sub.midtermApplicable && (
                              <div 
                                className="bg-amber-500 h-full transition-all duration-300"
                                style={{ width: `${(subRes.midPts / (subRes.totalWeightage || 1)) * 100}%` }}
                                title={`Midterm: ${subRes.midPts.toFixed(1)}`}
                              />
                            )}
                            {/* End Sem */}
                            {sub.endSemApplicable && (
                              <div 
                                className="bg-teal-500 h-full transition-all duration-300"
                                style={{ width: `${(subRes.endPts / (subRes.totalWeightage || 1)) * 100}%` }}
                                title={`End Sem: ${subRes.endPts.toFixed(1)}`}
                              />
                            )}
                          </div>
                          <div className="flex justify-between text-[7px] font-extrabold text-slate-400 uppercase tracking-wider pt-0.5">
                            <span className="text-indigo-500 flex items-center gap-0.5">■ ATT ({subRes.attPts.toFixed(1)})</span>
                            <span className="text-emerald-500 flex items-center gap-0.5">■ CA ({subRes.caPts.toFixed(1)})</span>
                            <span className="text-amber-500 flex items-center gap-0.5">■ MID ({subRes.midPts.toFixed(1)})</span>
                            <span className="text-teal-500 flex items-center gap-0.5">■ END ({subRes.endPts.toFixed(1)})</span>
                          </div>
                        </div>

                        {/* DETAILED PROGRESS BARS FOR EACH SECTION */}
                        <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
                            Academic Weightage Breakdown
                          </span>
                          
                          {/* Attendance */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span>Attendance ({sub.attendance !== undefined ? sub.attendance : 100}%)</span>
                              <span className="font-extrabold text-slate-700">
                                {subRes.attPts.toFixed(1)} / {sub.attendanceWeightage !== undefined ? sub.attendanceWeightage : 5}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(subRes.attPts / (sub.attendanceWeightage !== undefined ? sub.attendanceWeightage : 5)) * 100}%` }}></div>
                            </div>
                          </div>

                          {/* CA */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span>Continuous Assessment</span>
                              <span className="font-extrabold text-slate-700">
                                {subRes.caPts.toFixed(1)} / {sub.weightage !== undefined ? sub.weightage : 25}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(subRes.caPts / (sub.weightage !== undefined ? sub.weightage : 25)) * 100}%` }}></div>
                            </div>
                          </div>

                          {/* Midterm */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span>Midterm Exam {sub.midtermApplicable ? '' : '(N/A)'}</span>
                              <span className="font-extrabold text-slate-700">
                                {sub.midtermApplicable ? `${subRes.midPts.toFixed(1)} / ${sub.midtermWeightage !== undefined ? sub.midtermWeightage : 20}` : '0.0 / 0'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div className={`${sub.midtermApplicable ? 'bg-amber-500' : 'bg-slate-300'} h-full rounded-full`} style={{ width: `${sub.midtermApplicable ? (subRes.midPts / (sub.midtermWeightage !== undefined ? sub.midtermWeightage : 20)) * 100 : 0}%` }}></div>
                            </div>
                          </div>

                          {/* End Sem */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span>End Semester Exam {sub.endSemApplicable ? '' : '(N/A)'}</span>
                              <span className="font-extrabold text-slate-700">
                                {sub.endSemApplicable ? `${subRes.endPts.toFixed(1)} / ${sub.endSemWeightage !== undefined ? sub.endSemWeightage : 50}` : '0.0 / 0'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div className={`${sub.endSemApplicable ? 'bg-teal-500' : 'bg-slate-300'} h-full rounded-full`} style={{ width: `${sub.endSemApplicable ? (subRes.endPts / (sub.endSemWeightage !== undefined ? sub.endSemWeightage : 50)) * 100 : 0}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* SEMESTER GPA BUTTON (REPLACED TOGGLE - LOCKED WHEN ADDED) */}
                        <button
                          onClick={(e) => handleToggleInclude(e, sub)}
                          disabled={sub.includeInCGPA !== false}
                          className={`w-full py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-soft-sm ${
                            sub.includeInCGPA !== false 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600 cursor-not-allowed opacity-80' 
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer'
                          }`}
                        >
                          <Layers size={11} />
                          {sub.includeInCGPA !== false ? 'Subject Added' : 'Add to Semester GPA'}
                        </button>

                        <button 
                          onClick={() => loadSubject(sub)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 shadow-sm cursor-pointer"
                        >
                          <RefreshCw size={10} />
                          Load into Wizard
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SAVE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSaveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveConfirm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Modal Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft-lg w-full max-w-md relative z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <GraduationCap className="text-indigo-500" size={16} />
                  Save Academic Subject?
                </h3>
                <button 
                  onClick={() => setShowSaveConfirm(false)}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Course Code:</span>
                  <span className="font-black text-slate-800">{subCode}</span>
                </div>
                {subName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Course Title:</span>
                    <span className="font-extrabold text-slate-700 truncate max-w-[200px]">{subName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Credits:</span>
                  <span className="font-black text-slate-800">{subCredits} Credits</span>
                </div>
                {results ? (
                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 mt-1">
                    <span className="text-slate-500 font-bold">Predicted Grade:</span>
                    <span className={`px-2 py-0.5 rounded-md font-black ${results.gradeInfo.color.split(' ')[0]}`}>
                      {results.gradeInfo.l} ({results.finalPercentage.toFixed(1)}%)
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 mt-1">
                    <span className="text-slate-500 font-bold">Evaluation Status:</span>
                    <span className="text-amber-500 font-extrabold">Incomplete Evaluation</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={() => setShowSaveConfirm(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmSave}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10"
                >
                  Confirm & Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
