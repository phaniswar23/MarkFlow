import React, { useState, useEffect, useRef } from 'react';
import { Card, CircularProgress, Badge } from '../UI';
import { calculateSubjectMarks, validateMarks } from '../../utils/calcEngine';
import { 
  Sparkles, 
  Save, 
  CheckCircle, 
  Plus, 
  Layers, 
  AlertCircle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  BarChart2, 
  Trash2,
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../ConfirmationModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export default function CAWeightagePage({ 
  recentCASessions = [], 
  onSaveCASession, 
  onNavigateToSubjectWise, 
  onDeleteCASession,
  setCaUnsaved
}) {
  const [caCount, setCaCount] = useState(() => parseInt(localStorage.getItem('markflow-draft-caCount')) || 3);
  const [totalMarksPerCA, setTotalMarksPerCA] = useState(() => parseInt(localStorage.getItem('markflow-draft-totalMarksPerCA')) || 30);
  const [weightage, setWeightage] = useState(() => parseFloat(localStorage.getItem('markflow-draft-weightage')) || 25);
  const [selectionLogic, setSelectionLogic] = useState(() => localStorage.getItem('markflow-draft-selectionLogic') || 'best_2_3');
  const [customBestOfX, setCustomBestOfX] = useState(2);
  const [customBestOfY, setCustomBestOfY] = useState(3);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  // Undo States
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const deleteIntervalRef = useRef(null);

  const resultsRef = useRef(null);

  const [assessments, setAssessments] = useState(() => {
    const saved = localStorage.getItem('markflow-draft-assessments');
    return saved ? JSON.parse(saved) : [
      { name: 'CA1', obtainedMarks: '', totalMarks: 30 },
      { name: 'CA2', obtainedMarks: '', totalMarks: 30 },
      { name: 'CA3', obtainedMarks: '', totalMarks: 30 }
    ];
  });

  const [errors, setErrors] = useState({});
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => localStorage.getItem('markflow-autosave-enabled') !== 'false');

  const [isCalculated, setIsCalculated] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', variant: 'info', onConfirm: () => {} });
  
  useEffect(() => {
    if (setCaUnsaved) {
      const hasEnteredMarks = assessments && assessments.some(a => a.obtainedMarks !== '');
      setCaUnsaved(isCalculated || hasEnteredMarks);
    }
  }, [isCalculated, assessments, setCaUnsaved]);

  useEffect(() => {
    return () => {
      if (setCaUnsaved) {
        setCaUnsaved(false);
      }
    };
  }, [setCaUnsaved]);

  const triggerAlert = (title, message, variant = 'info', onConfirm = () => {}) => {
    setModalConfig({ isOpen: true, title, message, variant, onConfirm });
  };

  useEffect(() => {
    localStorage.setItem('markflow-autosave-enabled', autoSaveEnabled);
    if (autoSaveEnabled) {
      localStorage.setItem('markflow-draft-caCount', caCount);
      localStorage.setItem('markflow-draft-totalMarksPerCA', totalMarksPerCA);
      localStorage.setItem('markflow-draft-weightage', weightage);
      localStorage.setItem('markflow-draft-selectionLogic', selectionLogic);
      localStorage.setItem('markflow-draft-assessments', JSON.stringify(assessments));
    } else {
      localStorage.removeItem('markflow-draft-caCount');
      localStorage.removeItem('markflow-draft-totalMarksPerCA');
      localStorage.removeItem('markflow-draft-weightage');
      localStorage.removeItem('markflow-draft-selectionLogic');
      localStorage.removeItem('markflow-draft-assessments');
    }
  }, [caCount, totalMarksPerCA, weightage, selectionLogic, assessments, autoSaveEnabled]);

  useEffect(() => {
    const updated = [];
    for (let i = 1; i <= caCount; i++) {
      const existing = assessments[i - 1];
      updated.push({
        name: `CA${i}`,
        obtainedMarks: existing ? existing.obtainedMarks : '',
        totalMarks: totalMarksPerCA
      });
    }
    setAssessments(updated);

    // Constrain selectionLogic based on new caCount
    if (caCount < 3 && selectionLogic === 'best_2_3') {
      setSelectionLogic('all');
    }
    if (caCount < 5 && selectionLogic === 'best_3_5') {
      setSelectionLogic('all');
    }

    if (customBestOfY > caCount) setCustomBestOfY(caCount);
    if (customBestOfX > caCount) setCustomBestOfX(Math.min(customBestOfX, caCount));
  }, [caCount, totalMarksPerCA, selectionLogic]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (deleteIntervalRef.current) {
        clearInterval(deleteIntervalRef.current);
      }
    };
  }, []);

  // Smooth Auto Scroll to Results
  useEffect(() => {
    if (isCalculated && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isCalculated]);

  const finalSelectionLogic = selectionLogic === 'custom' ? `best_${customBestOfX}_${customBestOfY}` : selectionLogic;

  const results = calculateSubjectMarks({
    weightage,
    selectionLogic: finalSelectionLogic,
    assessments: assessments.map(a => ({
      ...a,
      obtainedMarks: a.obtainedMarks === '' ? 0 : parseFloat(a.obtainedMarks) || 0,
      totalMarks: parseFloat(a.totalMarks) || 30
    }))
  });

  const getStatus = (percentage) => {
    if (percentage >= 90) return { label: 'Excellent', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (percentage >= 75) return { label: 'Good', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    if (percentage >= 50) return { label: 'Passing', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { label: 'Needs Attention', color: 'text-rose-600 bg-rose-50 border-rose-100' };
  };
  const perfStatus = getStatus(results.percentage);

  // End-Term Projections (What-If) math
  const otherWeightage = 50 - weightage;
  const otherMarks = otherWeightage > 0 ? (otherWeightage * (results.percentage / 100)) : 0;
  const currentInternalTotal = results.weightedMarks + otherMarks;

  const neededForO = 90 - currentInternalTotal;
  const neededFor75 = 75 - currentInternalTotal;

  const targetO = Math.max(0, Math.min(50, neededForO));
  const target75 = Math.max(0, Math.min(50, neededFor75));

  const isOAchievable = neededForO <= 50;
  const is75Achievable = neededFor75 <= 50;

  const handleAssessmentChange = (index, field, value) => {
    setIsCalculated(false);
    const updated = [...assessments];
    const cleanValue = typeof value === 'string' ? value.replace(/^0+(?=\d)/, '') : value;
    updated[index][field] = cleanValue === '' ? '' : cleanValue;
    setAssessments(updated);

    const validation = validateMarks(updated[index].obtainedMarks, updated[index].totalMarks);
    const newErrors = { ...errors };
    if (!validation.valid && updated[index].obtainedMarks !== '') {
      newErrors[`obt-${index}`] = validation.error;
    } else {
      delete newErrors[`obt-${index}`];
    }
    setErrors(newErrors);
  };

  const handleCalculateCA = () => {
    const newErrors = { ...errors };
    let hasValidationError = false;

    assessments.forEach((ass, index) => {
      const obt = parseFloat(ass.obtainedMarks);
      const tot = parseFloat(ass.totalMarks);
      
      if (ass.obtainedMarks === '') {
        newErrors[`obt-${index}`] = 'Required';
        hasValidationError = true;
      } else if (isNaN(obt)) {
        newErrors[`obt-${index}`] = 'Invalid Number';
        hasValidationError = true;
      } else if (obt < 0) {
        newErrors[`obt-${index}`] = 'Cannot be negative';
        hasValidationError = true;
      } else if (obt > tot) {
        newErrors[`obt-${index}`] = `Max marks is ${tot}`;
        hasValidationError = true;
      } else {
        delete newErrors[`obt-${index}`];
      }
    });

    setErrors(newErrors);

    if (hasValidationError) {
      triggerAlert('Calculation Error', 'Please resolve all errors. Obtained marks cannot exceed total marks.', 'warning');
      return;
    }

    setIsCalculated(true);
  };

  const handleSaveAndClose = (e) => {
    e.preventDefault();
    if (!subCode.trim()) {
      triggerAlert('Required Field Missing', 'Subject Code is mandatory.', 'warning');
      return;
    }
    
    if (onSaveCASession) {
      onSaveCASession({
        id: Date.now().toString(),
        code: subCode.trim().toUpperCase(),
        name: subName.trim() || 'Untitled Session',
        caPercentage: results.percentage,
        caWeightedMarks: results.weightedMarks,
        weightage: weightage,
        assessments: assessments,
        selectionLogic: finalSelectionLogic
      });
      setShowSaveModal(false);
      setSubCode('');
      setSubName('');
      setIsCalculated(false);
    }
  };

  const handleAddToSubjectWise = () => {
    if (onNavigateToSubjectWise) {
      onNavigateToSubjectWise({
        code: 'NEW',
        caPercentage: results.percentage,
        caWeightedMarks: results.weightedMarks,
        weightage: weightage,
        assessments: assessments,
        selectionLogic: finalSelectionLogic
      });
    }
  };

  const toTitleCase = (str) => {
    return str.replace(/\b\w+/g, function(s) {
      return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
    });
  };

  const loadSavedSession = (session) => {
    setCaCount(session.assessments.length);
    setTotalMarksPerCA(session.assessments[0]?.totalMarks || 30);
    setWeightage(session.weightage || 25);
    setSelectionLogic(session.selectionLogic || 'best_2_3');
    setAssessments(session.assessments);
    setIsCalculated(true);
    if (addToast) {
      addToast(`Loaded CA metrics for ${session.code || 'saved session'} successfully.`, 'success');
    }
  };

  // Recent CA deletion undo logic (5s countdown)
  const handleDeleteClick = (sessionId) => {
    if (deleteIntervalRef.current) {
      clearInterval(deleteIntervalRef.current);
    }
    setDeletingSessionId(sessionId);
    setDeleteCountdown(5);

    let currentVal = 5;
    deleteIntervalRef.current = setInterval(() => {
      currentVal -= 1;
      setDeleteCountdown(currentVal);
      if (currentVal <= 0) {
        clearInterval(deleteIntervalRef.current);
        onDeleteCASession(sessionId);
        setDeletingSessionId(null);
      }
     }, 1000);
  };

  const handleCancelDelete = () => {
    if (deleteIntervalRef.current) {
      clearInterval(deleteIntervalRef.current);
    }
    setDeletingSessionId(null);
  };

  // Unified PNG/PDF exporter for any saved session
  const exportSavedSession = async (session, format) => {
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

    const assessmentsListHtml = session.assessments.map(a => {
      const pct = a.totalMarks > 0 ? (parseFloat(a.obtainedMarks || 0) / parseFloat(a.totalMarks)) * 100 : 0;
      return `
        <div style="display: flex; flex-direction: column; gap: 4px; padding: 10px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #475569;">
            <span>${a.name}</span>
            <span>${a.obtainedMarks || 0} / ${a.totalMarks} (${pct.toFixed(0)}%)</span>
          </div>
          <div style="width: 100%; height: 5px; border-radius: 9999px; overflow: hidden; background-color: #e2e8f0;">
            <div style="width: ${pct}%; height: 100%; border-radius: 9999px; background-color: ${pct >= 75 ? '#10b981' : pct >= 40 ? '#6366f1' : '#ef4444'};"></div>
          </div>
        </div>
      `;
    }).join('');

    element.innerHTML = `
      <div style="background-color: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 18px; font-weight: 900; color: #4f46e5; margin: 0;">MarkFlow</h1>
            <span style="font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 3px; display: block; letter-spacing: 0.5px;">Quick CA Calculation</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Date Calculated</span>
            <div style="font-size: 10px; font-weight: 700; color: #475569; margin-top: 2px;">${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background-color: #f8fafc; text-align: center; margin-bottom: 20px; display: flex; justify-content: space-around; align-items: center;">
          <div style="text-align: center;">
            <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">CA Percentage</div>
            <div style="font-size: 24px; font-weight: 900; color: #10b981; margin-top: 4px;">${session.caPercentage.toFixed(1)}%</div>
          </div>
          <div style="height: 35px; width: 1px; background-color: #cbd5e1;"></div>
          <div style="text-align: center;">
            <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Weighted Marks</div>
            <div style="font-size: 24px; font-weight: 900; color: #4f46e5; margin-top: 4px;">${session.caWeightedMarks.toFixed(2)} <span style="font-size: 13px; color: #94a3b8; font-weight: 500;">/ ${session.weightage}</span></div>
          </div>
        </div>

        <h3 style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">CA Assessment Tiers</h3>
        <div>
          ${assessmentsListHtml}
        </div>

        <div style="margin-top: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; font-size: 9px; color: #64748b; font-weight: 600;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Selection Logic:</span>
            <span style="color: #4f46e5; font-weight: 800;">${session.selectionLogic.replace('_', ' ').replace('_', ' ').toUpperCase()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Evaluated Status:</span>
            <span style="color: #10b981; font-weight: 800;">SUCCESS</span>
          </div>
        </div>

        <div style="margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 12px; text-align: center; font-size: 8px; color: #94a3b8; font-weight: 600;">
          Report compiled by MarkFlow Academic OS calculator.
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
        link.download = `MarkFlow_CA_Calculation_${session.code}_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width / 2.2, canvas.height / 2.2]
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2.2, canvas.height / 2.2, undefined, 'FAST');
        pdf.save(`MarkFlow_CA_Report_${session.code}_${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    } catch (err) {
      console.error('Export Error:', err);
      alert('Unable to export calculation details.');
    } finally {
      document.body.removeChild(element);
    }
  };

  const exportCAPage = (format) => {
    exportSavedSession({
      code: subCode || 'UNSPECIFIED',
      name: subName,
      caPercentage: results.percentage,
      caWeightedMarks: results.weightedMarks,
      weightage: weightage,
      assessments: assessments,
      selectionLogic: finalSelectionLogic
    }, format);
  };

  // Compile and download all saved CA Sessions from sidebar as a single PDF report
  const exportAllSessionsToPDF = async () => {
    if (!recentCASessions || recentCASessions.length === 0) return;

    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    element.style.width = '800px';
    element.style.backgroundColor = '#ffffff';
    element.style.fontFamily = "'Inter', 'system-ui', 'sans-serif'";
    element.style.color = '#1e293b';
    element.style.padding = '40px';

    const sessionsHtml = recentCASessions.map(session => {
      const assessmentsListHtml = session.assessments.map(a => `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #475569; padding: 8px 12px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 6px; border: 1px solid #f1f5f9;">
          <span style="font-weight: 500;">${a.name}</span>
          <strong style="color: #1e293b;">${a.obtainedMarks || 0} / ${a.totalMarks}</strong>
        </div>
      `).join('');

      return `
        <div style="border: 1px solid #e2e8f0; border-left: 6px solid #4f46e5; border-radius: 14px; padding: 20px; background-color: #ffffff; margin-bottom: 20px; page-break-inside: avoid; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 15px;">
            <div>
              <h3 style="font-size: 14px; font-weight: 800; color: #1e293b; margin: 0; text-transform: uppercase;">${session.code}</h3>
              <span style="font-size: 10px; font-weight: 700; color: #94a3b8; margin-top: 3px; display: block;">${session.name || 'Untitled Session'}</span>
            </div>
            <span style="font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; background-color: #ecfdf5; color: #10b981; border: 1px solid #10b98120;">
              ${session.caPercentage.toFixed(1)}%
            </span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 8px 0; font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Assessments</h4>
            ${assessmentsListHtml}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 15px;">
            <div>
              <span style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Selection Logic</span>
              <div style="font-size: 11px; font-weight: 700; color: #475569; margin-top: 2px;">${session.selectionLogic.replace('_', ' ').replace('_', ' ').toUpperCase()}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">CA Weightage Marks</span>
              <div style="font-size: 16px; font-weight: 900; color: #1e293b; margin-top: 2px;">
                ${session.caWeightedMarks.toFixed(2)} <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">/ ${session.weightage}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    element.innerHTML = `
      <div style="padding: 10px; background-color: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 900; color: #4f46e5; margin: 0; letter-spacing: -0.8px;">MarkFlow</h1>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 4px; display: block; letter-spacing: 0.5px;">Recent CA Sessions Report</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Date Generated</span>
            <div style="font-size: 12px; font-weight: 700; color: #475569; margin-top: 3px;">${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <h2 style="font-size: 12px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Compiled CA Sessions</h2>

        <div style="display: flex; flex-direction: column;">
          ${sessionsHtml}
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; font-weight: 600; line-height: 1.6; letter-spacing: 0.2px;">
          Report compiled automatically by MarkFlow Academic OS CA Calculator.
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

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`MarkFlow_Recent_CA_Sessions_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      triggerAlert('PDF Exported', 'All Recent CA Sessions exported successfully as a unified PDF report.', 'success');
    } catch (err) {
      console.error('All Sessions PDF Generation Error:', err);
      alert('Unable to generate PDF report.');
    } finally {
      document.body.removeChild(element);
    }
  };

  return (
    <div className="text-left select-none relative max-w-7xl mx-auto h-full flex flex-col lg:flex-row gap-8 items-start px-4 sm:px-6">
      
      {/* LEFT COLUMN: CALCULATOR */}
      <div className="flex-1 space-y-6 w-full">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 tracking-tight">
              <span>Quick CA Calculation</span>
              <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Calculate proportional CA marks independently before adding them to your full subject evaluation.
            </p>
          </div>
        </div>

        <Card className="!p-6 space-y-5 border-slate-100/80 bg-gradient-to-tr from-white to-slate-50/20">
          <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider">CA Configuration</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5">Number of CAs</label>
              <select
                value={caCount}
                onChange={(e) => { setIsCalculated(false); setCaCount(parseInt(e.target.value) || 3); }}
                className="w-full text-xs font-bold text-slate-600 bg-white border border-slate-200 focus:ring-4 focus:ring-indigo-500/5 rounded-xl px-3.5 py-3 outline-none cursor-pointer hover:border-indigo-200 transition-all"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} Assessments</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5">Total Max per CA</label>
              <input
                type="number"
                value={totalMarksPerCA}
                onChange={(e) => { setIsCalculated(false); setTotalMarksPerCA(parseInt(e.target.value) || 30); }}
                className="w-full px-3.5 py-3 text-xs bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5">Final CA Weightage</label>
              <input
                type="number"
                value={weightage}
                onChange={(e) => { setIsCalculated(false); setWeightage(parseFloat(e.target.value) || 25); }}
                className="w-full px-3.5 py-3 text-xs bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5">Selection Logic</label>
              <select
                value={selectionLogic}
                onChange={(e) => {
                  setIsCalculated(false);
                  const val = e.target.value;
                  setSelectionLogic(val);
                  if (val === 'custom') {
                    setCustomBestOfX(Math.min(2, caCount));
                    setCustomBestOfY(Math.min(3, caCount));
                  }
                }}
                className="w-full text-xs font-bold text-slate-600 bg-white border border-slate-200 focus:ring-4 focus:ring-indigo-500/5 rounded-xl px-3.5 py-3 outline-none cursor-pointer hover:border-indigo-200 transition-all"
              >
                <option value="all">Average (All Mandatory)</option>
                {caCount >= 3 && <option value="best_2_3">Best 2 of 3 CAs</option>}
                {caCount >= 5 && <option value="best_3_5">Best 3 of 5 CAs</option>}
                <option value="highest">Highest Score Only</option>
                <option value="custom">Customize Bounds...</option>
              </select>
            </div>
          </div>

          {selectionLogic === 'custom' && (
            <div className="bg-indigo-50/40 border border-indigo-100/60 p-3 rounded-xl flex items-center justify-center gap-2 mt-4">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Best</span>
              <input
                type="number"
                min="1"
                max={customBestOfY}
                value={customBestOfX}
                onChange={(e) => { setIsCalculated(false); setCustomBestOfX(Math.min(parseInt(e.target.value) || 1, customBestOfY)); }}
                className="w-12 text-center p-1.5 text-xs bg-white border border-slate-200 rounded-md font-extrabold"
              />
              <span className="text-[10px] font-bold text-slate-400">of</span>
              <input
                type="number"
                min={customBestOfX}
                max={caCount}
                value={customBestOfY}
                onChange={(e) => { setIsCalculated(false); setCustomBestOfY(Math.min(Math.max(parseInt(e.target.value) || 1, customBestOfX), caCount)); }}
                className="w-12 text-center p-1.5 text-xs bg-white border border-slate-200 rounded-md font-extrabold"
              />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">CAs</span>
            </div>
          )}
        </Card>

        <Card className="!p-6 space-y-4">
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Assessment Entry</h3>
            <div className="flex gap-2 flex-wrap items-center">
              <label className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase cursor-pointer mr-2 select-none">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500/25 h-3.5 w-3.5"
                />
                <span>Autosave Draft</span>
              </label>
              <div className="flex gap-1.5 flex-wrap items-center">
                <button
                  type="button"
                  onClick={() => {
                    const updated = assessments.map(a => ({ ...a, obtainedMarks: totalMarksPerCA, totalMarks: totalMarksPerCA }));
                    setAssessments(updated);
                    setIsCalculated(false);
                  }}
                  className="px-2 py-1 bg-indigo-55 hover:bg-indigo-100/70 border border-indigo-100/50 text-indigo-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="Fill all CAs with maximum possible score"
                >
                  🎯 Max All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const avgVal = Math.round(totalMarksPerCA * 0.7);
                    const updated = assessments.map(a => ({ ...a, obtainedMarks: avgVal, totalMarks: totalMarksPerCA }));
                    setAssessments(updated);
                    setIsCalculated(false);
                  }}
                  className="px-2 py-1 bg-teal-55 hover:bg-teal-100/70 border border-teal-100/50 text-teal-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="Fill all CAs with a 70% average score"
                >
                  📈 Average All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = assessments.map(a => ({ ...a, obtainedMarks: '', totalMarks: totalMarksPerCA }));
                    setAssessments(updated);
                    setIsCalculated(false);
                  }}
                  className="px-2 py-1 bg-rose-55 hover:bg-rose-100/70 border border-rose-100/50 text-rose-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="Clear all scores"
                >
                  🧹 Clear
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {assessments.map((ass, index) => (
              <div key={index} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200/85 transition-all gap-1.5 animate-grow">
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-[10px] font-black text-slate-600 min-w-[40px]">{ass.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Obtained"
                      value={ass.obtainedMarks}
                      onChange={(e) => handleAssessmentChange(index, 'obtainedMarks', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className={`w-24 text-center px-2 py-2 text-xs rounded-xl outline-none font-bold transition-all border ${
                        errors[`obt-${index}`] 
                          ? 'border-rose-400 bg-rose-50/50 text-rose-600 focus:ring-4 focus:ring-rose-500/5' 
                          : 'bg-white border-slate-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5'
                      }`}
                    />
                    <span className="text-slate-400 font-bold">/</span>
                    <input
                      type="number"
                      placeholder="Total"
                      value={ass.totalMarks}
                      onChange={(e) => handleAssessmentChange(index, 'totalMarks', e.target.value)}
                      className="w-16 text-center px-2 py-2 text-xs bg-white border border-slate-200 hover:border-indigo-300 focus:border-indigo-500 rounded-xl font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-indigo-500/5"
                    />
                  </div>
                </div>
                {errors[`obt-${index}`] && (
                  <div className="flex items-center gap-1 text-[9px] font-black text-rose-500 justify-end w-full animate-pulse pr-2">
                    <AlertCircle size={10} />
                    <span>{errors[`obt-${index}`]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleCalculateCA}
            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer transition-all uppercase tracking-wider flex justify-center items-center gap-2 active:scale-98"
          >
            <BarChart2 size={14} />
            Calculate CA Weightage
          </button>
        </Card>

        {/* RESULTS PANEL & EXPORTS SYSTEM */}
        {isCalculated && (
          <motion.div 
            ref={resultsRef}
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6 pb-6"
          >
            <Card className="!p-6 border-indigo-100 bg-gradient-to-b from-white to-slate-50/30 flex flex-col sm:flex-row items-center justify-around gap-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Calculated CA</span>
                <CircularProgress percentage={results.percentage} size={110} color={results.percentage >= 75 ? 'text-emerald-500' : results.percentage >= 50 ? 'text-indigo-500' : 'text-rose-500'} />
                <Badge variant={results.percentage >= 75 ? 'teal' : results.percentage >= 50 ? 'indigo' : 'rose'}>
                  {perfStatus.label}
                </Badge>
              </div>

              <div className="space-y-3 w-full max-w-[240px] text-left">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold">Selected Scores:</span>
                  <span className="text-xs font-black text-slate-700">
                    {results.formulaProps?.scores ? results.formulaProps.scores.map(s => s.obtained).join(' + ') : (results.selectedIds ? 'Averaged' : 'All')}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold">Raw Score:</span>
                  <span className="text-xs font-black text-slate-700">
                    {results.formulaProps?.sumObtained?.toFixed(2) || '?'} / {results.formulaProps?.sumTotal || '?'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold">Converted Weightage:</span>
                  <span className="text-sm font-black text-indigo-600">
                    {results.weightedMarks.toFixed(2)} / {weightage}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">Percentage:</span>
                  <span className="text-sm font-black text-emerald-600">
                    {results.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>

            {/* "What-If" Predictive Exam Target Panel */}
            <div className="p-5 border rounded-2xl backdrop-blur-md bg-indigo-950/5 border-indigo-100/50 space-y-3.5 text-left">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <span>🎯 "What-If" End-Term Projections</span>
                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[8px] font-bold">End-Term: 50% Weight</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className={`p-3 border rounded-xl flex flex-col justify-between ${
                  targetO <= 35 
                    ? 'bg-emerald-50/40 border-emerald-100/50 text-emerald-800' 
                    : targetO <= 45 
                      ? 'bg-amber-50/40 border-amber-100/50 text-amber-800' 
                      : 'bg-rose-50/40 border-rose-100/50 text-rose-800'
                }`}>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide opacity-80">Target "O" Grade (90%+)</span>
                  <span className="text-lg font-black mt-1 font-mono">
                    {isOAchievable ? `${targetO.toFixed(1)} / 50` : 'Impossible ❌'}
                  </span>
                  <p className="text-[9px] font-medium leading-normal mt-1 opacity-90">
                    {isOAchievable 
                      ? `Requires scoring ${((targetO/50)*100).toFixed(0)}% in end-sem. ${targetO <= 35 ? 'Highly achievable! 👍' : 'Needs a near-perfect score! ⚡'}`
                      : 'Mathematically out of reach based on current CA.'}
                  </p>
                </div>

                <div className={`p-3 border rounded-xl flex flex-col justify-between ${
                  target75 <= 35 
                    ? 'bg-emerald-50/40 border-emerald-100/50 text-emerald-800' 
                    : target75 <= 45 
                      ? 'bg-amber-50/40 border-amber-100/50 text-amber-800' 
                      : 'bg-rose-50/40 border-rose-100/50 text-rose-850'
                }`}>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide opacity-80">Safe Zone Target (75%+)</span>
                  <span className="text-lg font-black mt-1 font-mono">
                    {is75Achievable ? `${target75.toFixed(1)} / 50` : 'Impossible ❌'}
                  </span>
                  <p className="text-[9px] font-medium leading-normal mt-1 opacity-95">
                    {is75Achievable 
                      ? `Need ${((target75/50)*100).toFixed(0)}% in end-sem to guarantee safety zone target.`
                      : 'Focus on clearing current assessments.'}
                  </p>
                </div>
              </div>
            </div>

            {/* HIGH-FIDELITY EXPORTS PANEL */}
            <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl flex flex-col gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Download size={13} className="text-indigo-500" />
                Export Assessment Results
              </span>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => exportCAPage('pdf')}
                  className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download size={13} />
                  Download PDF Report
                </button>
                <button
                  onClick={() => exportCAPage('png')}
                  className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download size={13} />
                  Download PNG Card
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex-1 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-soft active:scale-95"
              >
                Save & Close
              </button>
              <button
                onClick={handleAddToSubjectWise}
                className="flex-1 py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                Add to Subject-wise Calculator
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* RIGHT COLUMN: RECENT SESSIONS */}
      <div className="lg:w-80 w-full shrink-0 space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-2">
          <Layers size={14} className="text-slate-400" />
          Recent CA Sessions
        </h3>
        {recentCASessions.length === 0 ? (
          <div className="text-[11px] text-slate-400 p-8 border border-dashed border-slate-200/80 rounded-2xl text-center bg-slate-50/50 font-semibold">
            No saved sessions yet.
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-none pr-1">
            {recentCASessions.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              const isDeleting = deletingSessionId === session.id;

              if (isDeleting) {
                return (
                  <Card 
                    key={session.id}
                    className="!p-4 border border-rose-100 bg-rose-50/20 shadow-soft-sm relative overflow-hidden flex flex-col justify-center items-center text-center gap-2"
                  >
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <AlertCircle size={12} />
                      Deleting Session in {deleteCountdown}s...
                    </span>
                    <button
                      onClick={handleCancelDelete}
                      className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[9px] rounded-lg transition-all active:scale-95 shadow-sm shadow-rose-500/10 cursor-pointer"
                    >
                      Undo Delete
                    </button>
                  </Card>
                );
              }
              
              return (
                 <Card 
                  key={session.id} 
                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                  className={`!p-4 border transition-all cursor-pointer shadow-soft-sm relative overflow-hidden bg-white select-none group ${
                    isExpanded ? 'border-indigo-400 ring-2 ring-indigo-500/5' : 'border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50/60 pr-8 relative">
                    <div>
                      <span className="text-xs font-black text-slate-800 tracking-wide uppercase">{session.code}</span>
                      {session.name && (
                        <span className="block text-[9px] font-bold text-slate-400 truncate max-w-[120px] uppercase tracking-wide mt-0.5">
                          {session.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-sans">
                        {session.caPercentage.toFixed(1)}%
                      </span>
                      {isExpanded ? <ChevronUp size={12} className="text-slate-400 font-sans" /> : <ChevronDown size={12} className="text-slate-400 font-sans" />}
                    </div>

                    {onDeleteCASession && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer z-10"
                        title="Delete Session"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-500 font-semibold">CA Value</span>
                    <span className="text-xs font-black text-indigo-600">
                      {session.caWeightedMarks.toFixed(2)} / {session.weightage}
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
                        {/* MINI PERFORMANCE GRAPH / HORIZONTAL PROGRESS BARS */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                            Assessments & Mini Graph
                          </span>
                          
                          <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-2 rounded-xl">
                            {session.assessments && session.assessments.map((ass, i) => {
                              const pct = ass.totalMarks > 0 ? (parseFloat(ass.obtainedMarks || 0) / parseFloat(ass.totalMarks)) * 100 : 0;
                              return (
                                <div key={i} className="space-y-1">
                                  <div className="flex justify-between items-center text-[9px] font-black text-slate-500">
                                    <span>{ass.name}</span>
                                    <span className="font-extrabold text-slate-700">
                                      {ass.obtainedMarks || 0} / {ass.totalMarks} ({pct.toFixed(0)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      className={`h-full rounded-full ${
                                        pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-indigo-500' : 'bg-rose-500'
                                      }`}
                                      transition={{ duration: 0.4 }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="text-[9px] font-bold text-slate-400 flex justify-between">
                          <span>Logic: {session.selectionLogic.replace('_', ' ').replace('_', ' ').toUpperCase()}</span>
                          <span>Weightage: {session.weightage} Marks</span>
                        </div>

                        <button
                          onClick={() => loadSavedSession(session)}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 shadow-sm cursor-pointer"
                        >
                          <RefreshCw size={10} />
                          Load Session into Calculator
                        </button>

                        <button
                          onClick={() => {
                            if (onNavigateToSubjectWise) {
                              onNavigateToSubjectWise({
                                code: session.code || 'NEW',
                                name: session.name || 'Untitled Session',
                                caPercentage: session.caPercentage,
                                caWeightedMarks: session.caWeightedMarks,
                                weightage: session.weightage,
                                assessments: session.assessments,
                                selectionLogic: session.selectionLogic
                              });
                            }
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 shadow-sm mt-1.5 cursor-pointer"
                        >
                          <Plus size={10} />
                          Add to Subject-wise Calculator
                        </button>

                        <button
                          onClick={() => exportSavedSession(session, 'pdf')}
                          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-sm mt-1.5 cursor-pointer"
                        >
                          <Download size={10} />
                          Export Session PDF
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        )}

        {recentCASessions.length > 0 && (
          <button
            onClick={exportAllSessionsToPDF}
            className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download size={13} />
            Export All Sessions as PDF
          </button>
        )}
      </div>

      {/* SAVE MODAL */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} onClick={() => setShowSaveModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px]" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }} className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative z-10 text-left select-none flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100/60">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                    <Save size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 leading-none">Save & Close</h3>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 block uppercase tracking-wide">Add to Recent Sessions</span>
                  </div>
                </div>
                <button type="button" onClick={() => setShowSaveModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <X size={16} />
                </button>
              </div>
              
              <form onSubmit={handleSaveAndClose} className="space-y-4 pt-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Course Code *</label>
                  <input type="text" placeholder="e.g. CSE302" required value={subCode} onChange={(e) => setSubCode(e.target.value.toUpperCase())} className="w-full px-3.5 py-3 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 rounded-xl outline-none font-bold uppercase tracking-wider text-slate-800 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Course Title</label>
                  <input type="text" placeholder="Optional" value={subName} onChange={(e) => setSubName(toTitleCase(e.target.value))} className="w-full px-3.5 py-3 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 rounded-xl outline-none font-bold text-slate-800 transition-all" />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-soft hover:shadow-indigo-500/20 transition-all cursor-pointer text-center">Save Session</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        variant={modalConfig.variant}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
}
