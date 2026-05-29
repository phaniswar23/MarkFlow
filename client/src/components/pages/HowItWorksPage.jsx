import React, { useState } from 'react';
import { Card, Badge } from '../UI';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BookOpen, Calculator, GraduationCap, Calendar, 
  Award, Clock, Trash2, Shield, Settings, Info, Play, Pause,
  ChevronRight, RefreshCw, AlertCircle, HelpCircle, CheckCircle2,
  Tv, Layers, Eye, Smartphone, HelpCircle as HelpIcon, ArrowRight,
  Database, ToggleLeft, ToggleRight, ArrowUpRight, Check, AlertTriangle,
  Sliders, Target
} from 'lucide-react';

// Premium hand-drawn styled SVG curved arrow with an optional label
const HandDrawnArrow = ({ className = "", rotate = 0, text = "", colorClass = "text-indigo-500" }) => {
  return (
    <div 
      className={`absolute pointer-events-none select-none flex flex-col items-center z-40 ${className}`} 
      style={{ transform: `rotate(${rotate}deg)`, transformOrigin: 'center' }}
    >
      <svg width="46" height="36" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${colorClass} drop-shadow-sm`}>
        {/* Curved arrow line */}
        <path 
          d="M10,32 C20,12 35,8 48,16" 
          stroke="currentColor" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeDasharray="4 4"
          className="animate-pulse"
        />
        {/* Arrow head */}
        <path 
          d="M40,9 L52,18 L38,24" 
          stroke="currentColor" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      {text && (
        <span className={`text-[7px] font-black uppercase tracking-wider bg-slate-900 text-white border border-slate-750 px-1.5 py-0.5 rounded-md shadow-lg -mt-1 select-none whitespace-nowrap`} style={{ transform: `rotate(${-rotate}deg)` }}>
          {text}
        </span>
      )}
    </div>
  );
};

// Premium mouse cursor component
const MouseCursor = ({ className = "", colorClass = "text-emerald-500" }) => {
  return (
    <div className={`absolute pointer-events-none select-none z-50 ${className}`}>
      {/* Dynamic ping circle overlay */}
      <span className="absolute -top-1 -left-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${colorClass} drop-shadow-lg`}>
        <path d="M4.5 3V17.5L9.5 13.5L14.5 21.5L17.5 19.5L12.5 12L18.5 11.5L4.5 3Z" fill="currentColor" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    </div>
  );
};

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Category Walkthrough Simulator Frames
  const walkthroughVideos = {
    overview: {
      title: "Interactive Academic OS Simulation",
      steps: [
        {
          label: "1. Create Your Course",
          description: "Click the '+' Floating Action Button or press 'Ctrl + S' to define subject code, credit load, and target grading scheme.",
          badge: "Getting Started",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-3 shadow-soft text-slate-800 overflow-hidden">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">CS</div>
                  <div>
                    <h6 className="text-[11px] font-bold">Computer Science</h6>
                    <span className="text-[9px] text-slate-400">Code: CS-301 • Credits: 4</span>
                  </div>
                </div>
                <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[8px] font-black uppercase">Active</Badge>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-indigo-500 rounded-full" />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>Attendance: 80%</span>
                <span className="text-indigo-600">Goal: 90%</span>
              </div>
              
              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[35px] right-[40px]" rotate={55} text="Target Scheme" />
              <MouseCursor className="top-[50px] left-[15px]" />
            </div>
          )
        },
        {
          label: "2. Verify Database Integration",
          description: "Observe the live 'MongoDB Synced' badge. MarkFlow saves data locally first, then syncs instantly if your host backend goes online.",
          badge: "Live Database Sync",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-3 shadow-soft text-slate-850 text-center overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <Database size={11} />
                <span>MongoDB Synced</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                Offline failover active. Changes are safely saved locally to your device and synchronized as soon as the database connects.
              </p>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[32px] right-[25%]" rotate={-35} text="Live sync status" colorClass="text-emerald-500" />
            </div>
          )
        },
        {
          label: "3. Course Detail Analysis",
          description: "Click any course card to reveal the comprehensive analysis dashboard featuring end-semester forecast models and attendance sliders.",
          badge: "Course Details",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-indigo-100 bg-indigo-50/20 space-y-2.5 text-slate-800 overflow-hidden">
              <span className="text-[8px] font-black uppercase text-indigo-600 tracking-wider">Analysis Console</span>
              <h6 className="text-[11px] font-bold">Final Exam Target Calculator</h6>
              <div className="bg-white border border-indigo-50 p-2 rounded-lg text-center shadow-soft-sm">
                <span className="text-[9px] text-slate-400 font-medium block">Required in Final Exam</span>
                <span className="text-sm font-black text-indigo-600">54 / 100</span>
              </div>
              <p className="text-[9px] text-slate-400 text-center">Calculated based on current class weights.</p>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[-10px] left-[35%]" rotate={90} text="Target Forecast" />
              <MouseCursor className="bottom-[15px] right-[50px]" />
            </div>
          )
        }
      ]
    },
    'ca-weightage': {
      title: "Selective CA Marks Compilation",
      steps: [
        {
          label: "1. Define Selection Parameters",
          description: "Set total assignments count (e.g. 3 CAs) and select logic rules: 'Best 2 out of 3' or 'Sum of all assessments'.",
          badge: "Configurations",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-3 shadow-soft text-slate-800 overflow-hidden">
              <div className="space-y-1.5">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider block">Best-Of Selection Logic</span>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 rounded-lg border border-indigo-100 bg-indigo-50/20 text-center text-[10px] font-black text-indigo-600">
                    Best 2 of 3
                  </div>
                  <div className="flex-1 p-2 rounded-lg border border-slate-100 text-center text-[10px] font-bold text-slate-400">
                    Sum of All
                  </div>
                </div>
              </div>
              <div className="text-[9px] text-slate-400 font-medium text-center">
                System automatically discards the lowest scoring assignment!
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[30px] right-[40px]" rotate={45} text="Active Rule" />
            </div>
          )
        },
        {
          label: "2. Record Marks Proportionality",
          description: "Input obtained and maximum values for each assignment. MarkFlow scales them automatically out of your target syllabus weight.",
          badge: "Auto-Scaling",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-2 shadow-soft text-slate-800 overflow-hidden">
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between text-[10px] font-bold border-b border-slate-50 pb-1">
                  <span>CA 1</span>
                  <span className="text-indigo-600">24 / 30 Marks</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold border-b border-slate-50 pb-1">
                  <span>CA 2</span>
                  <span className="text-indigo-600">27 / 30 Marks</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-350">
                  <span className="line-through">CA 3 (Discarded)</span>
                  <span>15 / 30 Marks</span>
                </div>
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="bottom-[5px] left-[35%]" rotate={-90} text="Discarded score" colorClass="text-rose-500" />
            </div>
          )
        },
        {
          label: "3. Direct Subject Injector",
          description: "Click 'Inject to Course' to transfer compiled CA results into a designated subject card without manual entry.",
          badge: "Integration",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-3 shadow-soft text-slate-800 text-center overflow-hidden">
              <div className="p-2.5 bg-emerald-50/30 border border-emerald-100 rounded-lg inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                <Check size={12} />
                <span>Marks Scaling: 25.50 / 30</span>
              </div>
              <button className="w-full py-2 bg-indigo-600 rounded-lg text-white font-black text-[10px] uppercase shadow-md shadow-indigo-600/10">
                Inject into Course Card
              </button>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[-5px] right-[25%]" rotate={60} text="Ready to inject" colorClass="text-emerald-500" />
              <MouseCursor className="bottom-[10px] right-[40px]" />
            </div>
          )
        }
      ]
    },
    'subject-wise': {
      title: "Dynamic Grade Target Predictor",
      steps: [
        {
          label: "1. Lock Grading Thresholds",
          description: "Define the percentage boundary for your dream letter grade (e.g. 'O Grade >= 90%').",
          badge: "Grading Boundaries",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-2.5 shadow-soft text-slate-800 overflow-hidden">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-650">Target Grade</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-650 font-black">O Grade (10 GP)</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-650">Required Threshold</span>
                <span className="font-bold text-indigo-600">90%</span>
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[30px] left-[15px]" rotate={-45} text="Threshold Limit" />
            </div>
          )
        },
        {
          label: "2. Input Assessment Log",
          description: "Slide or type obtained values. The system automatically computes continuous assessments weights.",
          badge: "Class Assessments",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-2 shadow-soft text-slate-800 overflow-hidden">
              <div className="space-y-2 text-left">
                <div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>Attendance Marks (Out of 5)</span>
                    <span className="text-indigo-600">5.0 / 5</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full w-full bg-indigo-500 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>Continuous Assessment (CA Weight: 30)</span>
                    <span className="text-indigo-600">25.5 / 30</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full w-[85%] bg-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[25px] right-[40px]" rotate={60} text="Class Weights" />
            </div>
          )
        },
        {
          label: "3. Read Forecast Predictions",
          description: "Read the target card: MarkFlow warns you with the exact marks required in the Final Examination to secure your target grade.",
          badge: "Target Forecast",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-teal-100 bg-teal-50/10 space-y-3 shadow-soft text-slate-800 text-center overflow-hidden">
              <div className="text-[10px] font-black text-teal-650 uppercase tracking-wider">Predictor Results</div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-450 block font-medium">To reach O Grade in Final Exam (Weight 50):</span>
                <span className="text-lg font-black text-indigo-650">59.50 / 100</span>
              </div>
              <div className="text-[8px] text-slate-400">Minimum class score required.</div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[30px] right-[10%]" rotate={-25} text="Syllabus Target" colorClass="text-emerald-500" />
            </div>
          )
        }
      ]
    },
    'bunk-planner': {
      title: "Smart Attendance Bunk Planner",
      steps: [
        {
          label: "1. Establish Minimum Criteria",
          description: "Set your institutional minimum target (e.g. 75%). This applies a safety limit to all calculations.",
          badge: "Target Settings",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-3 shadow-soft text-slate-850 overflow-hidden">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span>Minimum Target</span>
                <span className="text-teal-650 bg-teal-50/60 border border-teal-100 px-2 py-0.5 rounded-lg">75% Attendance</span>
              </div>
              <div className="text-[9px] text-slate-400 leading-relaxed">
                Global boundary value. Used across all courses to compute safe/critical margins.
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[25px] left-[15px]" rotate={-45} text="Safety Limit" colorClass="text-teal-500" />
            </div>
          )
        },
        {
          label: "2. Safe to Bunk Lecture Margins",
          description: "Check the 'Safe to Bunk' indicator. MarkFlow calculates how many future lectures you can afford to skip safely.",
          badge: "Bunkable Margin",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-teal-100 bg-teal-50/15 text-center shadow-soft text-slate-800 space-y-2 overflow-hidden">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-[9px] font-black text-teal-600 uppercase">
                Safe Status
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-450 block font-medium">Current Attendance: 82%</span>
                <span className="text-base font-black text-teal-600">Safe to bunk 2 classes</span>
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="bottom-[10px] right-[45px]" rotate={45} text="Bunk Safety" colorClass="text-teal-500" />
            </div>
          )
        },
        {
          label: "3. Attendance Recovery Strategy",
          description: "If attendance drops below target, get consecutive attend metrics showing exactly how many classes you must attend in a row to recover.",
          badge: "Warning Recovery",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-rose-100 bg-rose-50/10 text-center shadow-soft text-slate-800 space-y-2 overflow-hidden">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[9px] font-black text-rose-600 uppercase">
                Attendance Deficit
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-450 block font-medium">Current Attendance: 71%</span>
                <span className="text-base font-black text-rose-550 flex items-center justify-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>Attend 3 lectures</span>
                </span>
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[30px] right-[15%]" rotate={-25} text="Recovery Action" colorClass="text-rose-500" />
            </div>
          )
        }
      ]
    },
    'gpa-estimators': {
      title: "Semester SGPA & CGPA Aggregator",
      steps: [
        {
          label: "1. Credit Hour Weighting",
          description: "Ensure each subject has correct credits assigned. Credit weighting scales grade point products correctly.",
          badge: "SGPA Weights",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-2 shadow-soft text-slate-800 text-left overflow-hidden">
              <div className="flex justify-between items-center text-[10px] border-b border-slate-50 pb-1 font-bold">
                <span>Discrete Maths (4 Credits)</span>
                <span className="text-indigo-600 font-mono">10 GP (Outstanding)</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span>Technical Writing (2 Credits)</span>
                <span className="text-indigo-650 font-mono">8 GP (Very Good)</span>
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[18px] left-[35%]" rotate={60} text="Grading Weights" />
            </div>
          )
        },
        {
          label: "2. Set Inclusion Toggles",
          description: "Select which courses to include. Toggle exclusion for non-credit courses to maintain strict accuracy.",
          badge: "Exclusion Toggles",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-2 shadow-soft text-slate-800 text-center overflow-hidden">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span>Include in Semester SGPA</span>
                <div className="text-indigo-600">
                  <ToggleRight size={24} className="cursor-pointer" />
                </div>
              </div>
              <div className="text-[8px] text-slate-400">Toggle non-credit modules off to keep SGPA perfect.</div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <MouseCursor className="top-[15px] right-[40px]" />
              <HandDrawnArrow className="top-[25px] left-[25px]" rotate={-35} text="Exclude Toggles" />
            </div>
          )
        },
        {
          label: "3. Map Historical Semesters",
          description: "Input your completed semester credit point totals to generate your continuous overall CGPA curve.",
          badge: "Cumulative CGPA",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-slate-900 shadow-soft text-white text-center space-y-2.5 overflow-hidden">
              <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Cumulative Result Summary</div>
              <div className="flex justify-around">
                <div className="text-center">
                  <span className="text-[8px] text-slate-400 block uppercase">Semester 1</span>
                  <span className="text-xs font-bold text-white">8.50 SGPA</span>
                </div>
                <div className="text-center border-l border-slate-800 pl-4">
                  <span className="text-[8px] text-slate-400 block uppercase">Semester 2</span>
                  <span className="text-xs font-bold text-white">9.10 SGPA</span>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-2 text-[10px] font-black text-emerald-400 flex items-center justify-center gap-1">
                <Award size={12} />
                <span>CGPA: 8.80</span>
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="bottom-[15px] right-[10%]" rotate={-25} text="Cumulative CGPA" colorClass="text-emerald-500" />
            </div>
          )
        }
      ]
    },
    'advanced-features': {
      title: "Trash Recovery & History Locks",
      steps: [
        {
          label: "1. Monitor The Activity Log",
          description: "View chronological event streams recording all grade edits, planner changes, and attendance recalculations.",
          badge: "Event Logs",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white space-y-2.5 shadow-soft text-slate-800 text-left overflow-hidden">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-[9px] shrink-0">1</div>
                <div>
                  <h6 className="text-[9px] font-bold leading-tight">Attendance Adjusted</h6>
                  <p className="text-[8px] text-slate-400">CS-301 attendance adjusted to 80%</p>
                </div>
              </div>
              <div className="flex items-start gap-2 border-t border-slate-50 pt-2">
                <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center font-bold text-[9px] shrink-0">2</div>
                <div>
                  <h6 className="text-[9px] font-bold leading-tight">Course Created</h6>
                  <p className="text-[8px] text-slate-400">Added Computer Science (CS-301)</p>
                </div>
              </div>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[30px] right-[40px]" rotate={45} text="Activity logs" />
            </div>
          )
        },
        {
          label: "2. Safety Pin Important Logs",
          description: "Click the pin icon to prevent specific activity logs from getting flushed out during local storage cache purges.",
          badge: "Pins Locker",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-slate-100 bg-white shadow-soft text-slate-855 text-center space-y-2 overflow-hidden">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600">
                <Clock size={10} />
                <span>Pinned Session Lock</span>
              </div>
              <p className="text-[9px] text-slate-400">Pinned items are excluded from manual clears.</p>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <HandDrawnArrow className="top-[25px] right-[10%]" rotate={-30} text="Session Lock" />
            </div>
          )
        },
        {
          label: "3. Safety Trash Recovery",
          description: "Accidentally deleted a course? Open the Trash Bin tab under History, and hit 'Restore' to undo changes instantly.",
          badge: "Safety Trash",
          renderPreview: () => (
            <div className="relative p-4 rounded-xl border border-rose-100 bg-rose-50/10 text-center shadow-soft text-slate-800 space-y-2 overflow-hidden">
              <div className="text-[10px] text-rose-650 font-bold flex items-center justify-center gap-1.5">
                <Trash2 size={12} className="text-rose-500" />
                <span>1 Deleted Course in Trash</span>
              </div>
              <button className="w-full py-1.5 bg-rose-550 hover:bg-rose-600 rounded-lg text-white font-black text-[9px] uppercase transition-all shadow-md shadow-rose-600/10">
                Restore Course Back
              </button>

              {/* Premium Guided Overlay Arrows & Cursors */}
              <MouseCursor className="bottom-[10px] right-[40px]" />
              <HandDrawnArrow className="top-[-5px] left-[35%]" rotate={60} text="Instant Undo" colorClass="text-rose-500" />
            </div>
          )
        }
      ]
    }
  };

  const modules = [
    {
      id: 'overview',
      title: 'Academic OS Overview',
      tagline: 'An end-to-end academic tracker built for extreme clarity and performance.',
      icon: <Sparkles className="text-indigo-400" size={20} />,
      content: (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/40 to-indigo-100/10 border border-indigo-100/50 space-y-3">
            <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
              <span>🚀 Welcome to MarkFlow Academic OS</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              MarkFlow is a personal workspace designed to take the guesswork out of university grading. By combining live calculations with attendance trackers and prediction engines, it helps you plan your academic strategy dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Storage & Sync</span>
              <h5 className="text-xs font-bold text-slate-800">Local-First Architecture</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All data resides safely on your device in **local storage**. If a MongoDB server is detected, it automatically synchronizes changes across sessions invisibly!
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
              <span className="text-[10px] font-black uppercase text-teal-500 tracking-wider">Fast & Physics-Based</span>
              <h5 className="text-xs font-bold text-slate-800">Reactive Calculations</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                No slow reloads or spin cycles. All weights, bunk safety margins, and estimated GPAs recalculate in real-time as you type or slide numbers.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ca-weightage',
      title: 'CA Weightage Calculator',
      tagline: 'Continuous Assessments (CAs), scaled accurately to match your class weights.',
      icon: <Calculator className="text-indigo-400" size={20} />,
      content: (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-indigo-50/20 border border-indigo-100/40 space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">1</div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">Continuous Assessment Inputs</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Input multiple assessments (e.g. CA 1, CA 2, quizzes, assignments). You specify how many marks each was worth and what you obtained.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">2</div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">Selective Best-Of Logic</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Set logic filters like **"Best 2 out of 3"** or **"Best 1 out of 2"**. MarkFlow automatically selects the highest-scoring combinations.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">3</div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">Proportional Scaling Formula</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  The selected CAs are automatically summed, averaged, and scaled proportionally to match the specific subject weight limits.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center select-text space-y-2">
            <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold block">Internal Scaling Math</span>
            <div className="text-xs font-mono font-bold text-white py-1">
              Scaled Score = (Sum of Best Obtained CAs ÷ Sum of Best Max CAs) × Target Weight
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'subject-wise',
      title: 'Subject-wise Tracker',
      tagline: 'The hub for deep grade tracking, custom weights, and end-sem estimators.',
      icon: <GraduationCap className="text-indigo-400" size={20} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-teal-500" />
                <span>Credit Load Ratings</span>
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Specify credits (e.g. 2, 3, or 4 credits) per subject. This allows GPA estimators to apply appropriate weights during SGPA compilation.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-500" />
                <span>Target Estimator</span>
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Input your CA scores, and see the exact marks you need to secure in the **End-Semester Examination** to reach your target letter grade!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-100/50 flex gap-3 text-xs text-amber-800 leading-relaxed font-medium">
            <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-850 font-bold mb-0.5">Live-Recalculating Slide Panels</strong>
              Double-clicking or clicking "Details" on any subject card slides open the detail console. Sliding attendance or typing in assignment marks updates estimated percentages instantly.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'bunk-planner',
      title: 'Bunk Planner Engine',
      tagline: 'Academic balance. Track your attendance limits and bunk safety margins.',
      icon: <Calendar className="text-indigo-400" size={20} />,
      content: (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-teal-50/20 border border-teal-100/40 space-y-4">
            <h4 className="text-xs font-black text-teal-850 uppercase tracking-wide">Dynamic Attendance Formulas</h4>
            
            <div className="space-y-3.5">
              <div className="flex items-start gap-2.5">
                <div className="h-2 w-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Safe to Bunk:</strong> When your current attendance percentage is strictly above your target limit (e.g. 75%), MarkFlow computes exactly how many upcoming lectures you can bunk without dropping below the threshold.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="h-2 w-2 rounded-full bg-rose-450 mt-1.5 shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Must Attend:</strong> If your attendance slips below the threshold, the calculator switches modes and alerts you with the exact number of consecutive lectures you must attend to recover.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
            <span className="text-[10px] font-black uppercase text-teal-500 tracking-wider">Target Thresholds</span>
            <h5 className="text-xs font-bold text-slate-800">Global Adjustment</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Set your target attendance in the Planner settings (defaults to 75%). The planner will automatically adjust status colors: **Teal** (Safe), **Amber** (Close to limit), or **Rose** (Needs attention).
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'gpa-estimators',
      title: 'SGPA & CGPA compilation',
      tagline: 'Compile semester grades and forecast overall cumulative grade point averages.',
      icon: <Award className="text-indigo-400" size={20} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <GraduationCap size={14} className="text-indigo-500" />
                <span>Semester SGPA</span>
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Accumulates total grade points from selected subjects, filters out subjects manually marked to exclude, and calculates the semester SGPA dynamically.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Award size={14} className="text-teal-500" />
                <span>Overall CGPA</span>
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Add previously completed semester scores with their total credit hours. MarkFlow automatically handles weighted sums across all semesters to present your current CGPA.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 font-mono text-center text-[10px] space-y-1">
            <div className="font-bold text-white">GPA = Σ(Credits × Grade Points) ÷ Σ(Total Credits)</div>
          </div>
        </div>
      )
    },
    {
      id: 'advanced-features',
      title: 'History & Safety Trash Bin',
      tagline: 'Track edits and protect against accidental deletions with local backups.',
      icon: <Clock className="text-indigo-400" size={20} />,
      content: (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
            <div className="flex gap-2">
              <Trash2 className="text-rose-500 shrink-0 mt-0.5" size={16} />
              <div>
                <h5 className="text-xs font-bold text-slate-800">The 10-Day Safety Trash Bin</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Deleted subjects, CA logs, and semester scores are not gone forever! They go into the Trash Bin where they can be restored in one click. By default, trash is auto-deleted after 10 days.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Clock className="text-indigo-500 shrink-0 mt-0.5" size={16} />
              <div>
                <h5 className="text-xs font-bold text-slate-800">Pin-enabled Activity Logs</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Keep track of all actions, calculations, and updates. Pin important activities to keep a snapshot reference of past calculations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentModule = modules.find(m => m.id === activeTab) || modules[0];
  const activeWalkthrough = walkthroughVideos[activeTab] || walkthroughVideos.overview;

  const handleNextStep = () => {
    setCurrentStepIndex((prev) => (prev + 1) % activeWalkthrough.steps.length);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentStepIndex(0);
  };

  return (
    <div className="space-y-6 text-left select-none animate-fadeIn">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-teal-500/5 blur-2xl" />
        
        <div className="relative space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-[10px] font-black text-indigo-300 uppercase tracking-widest animate-pulse-glow">
            <Sparkles size={11} />
            <span>Interactive Academic OS Walkthrough</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            How MarkFlow Works
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Discover the calculations, estimation models, and features built inside this workspace. Select any module to view details, formulas, and visual walkthrough simulators.
          </p>
        </div>
      </div>

      {/* Big Picture Workflow Map */}
      <Card className="!p-6 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden text-white rounded-3xl">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

        <div className="space-y-1.5 pb-5 border-b border-slate-850">
          <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1.5">
            <Layers size={10} className="animate-spin-slow" />
            <span>System Pipeline Blueprint</span>
          </span>
          <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
            <span>MarkFlow End-To-End Academic OS Flow</span>
            <Sparkles size={14} className="text-indigo-400 animate-pulse" />
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            At a glance, here is how your course data transitions step-by-step from raw inputs into live database backups, predictive targets, and continuous CGPA progress curves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 items-stretch relative">
          
          {/* STAGE 1 */}
          <div className="relative flex flex-col justify-between p-4.5 bg-slate-950/65 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all group">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="h-7 w-7 rounded-xl bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 flex items-center justify-center font-bold text-xs">01</span>
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">Config Stage</span>
              </div>
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                  <BookOpen size={12} className="text-indigo-400" />
                  <span>1. Setup Courses</span>
                </h5>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Define your subject code, credit load weighting, and lock grading targets (e.g. Outstanding &gt;= 90% boundary).
                </p>
              </div>
            </div>
            
            {/* Flow Connector Arrow for Medium+ screens */}
            <div className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-slate-900 border border-slate-800 items-center justify-center text-indigo-400 shadow-md group-hover:scale-110 transition-transform">
              <ChevronRight size={14} className="animate-pulse" />
            </div>
          </div>

          {/* STAGE 2 */}
          <div className="relative flex flex-col justify-between p-4.5 bg-slate-950/65 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all group">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="h-7 w-7 rounded-xl bg-teal-500/15 border border-teal-400/20 text-teal-300 flex items-center justify-center font-bold text-xs">02</span>
                <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/15">Syllabus Logs</span>
              </div>
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Sliders size={12} className="text-teal-400" />
                  <span>2. Log Raw Marks</span>
                </h5>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Slide attendance lists and log continuous assignments (CAs). The system auto-calculates proportion values.
                </p>
              </div>
            </div>
            
            {/* Flow Connector Arrow for Medium+ screens */}
            <div className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-slate-900 border border-slate-800 items-center justify-center text-teal-400 shadow-md group-hover:scale-110 transition-transform">
              <ChevronRight size={14} className="animate-pulse" />
            </div>
          </div>

          {/* STAGE 3 */}
          <div className="relative flex flex-col justify-between p-4.5 bg-slate-950/65 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all group">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="h-7 w-7 rounded-xl bg-amber-500/15 border border-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs">03</span>
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest bg-amber-50/10 px-2 py-0.5 rounded border border-amber-500/15">AI Predictor</span>
              </div>
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Target size={12} className="text-amber-400" />
                  <span>3. Predict Forecasts</span>
                </h5>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Run target forecasts to discover minimum marks required in final exams and bunk-safety limits interactively.
                </p>
              </div>
            </div>
            
            {/* Flow Connector Arrow for Medium+ screens */}
            <div className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-slate-900 border border-slate-800 items-center justify-center text-amber-400 shadow-md group-hover:scale-110 transition-transform">
              <ChevronRight size={14} className="animate-pulse" />
            </div>
          </div>

          {/* STAGE 4 */}
          <div className="relative flex flex-col justify-between p-4.5 bg-slate-950/65 border border-slate-800 hover:border-indigo-500/30 rounded-2xl transition-all group">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="h-7 w-7 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-bold text-xs">04</span>
                <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-400/25 animate-pulse animate-pulse-glow">Aggregation</span>
              </div>
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Award size={12} className="text-indigo-300" />
                  <span>4. Aggregate GPA</span>
                </h5>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Combine individual semester grades to plot your cumulative overall CGPA progress trajectory curve dynamically!
                </p>
              </div>
            </div>
          </div>

        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Module Sidebar Selector */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="!p-3.5 bg-white border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider pl-2 block mb-1">Interactive Chapters</span>
            <div className="space-y-1">
              {modules.map(mod => {
                const isActive = activeTab === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleTabChange(mod.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer outline-none ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/30 text-indigo-650 font-black border border-indigo-100/50 shadow-soft-sm' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-850 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${isActive ? 'text-indigo-650' : 'text-slate-400'}`}>
                        {mod.icon}
                      </span>
                      <span>{mod.title}</span>
                    </div>
                    <ChevronRight size={13} className={isActive ? 'text-indigo-650' : 'text-slate-300'} />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Quick Stats / Help */}
          <Card className="!p-4 bg-slate-900 border border-slate-800 text-slate-350 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Tv size={12} />
              <span>Interactive Screencasts</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              Use the **Walkthrough Screen Simulator** to interactively play through custom-styled components built straight from the MarkFlow interface!
            </p>
          </Card>
        </div>

        {/* Dynamic Detail Viewer & Simulator Panel */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Detailed Category Info Card */}
              <Card className="!p-6 bg-white border border-slate-100 shadow-soft">
                <div className="space-y-1.5 pb-4 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-850 flex items-center gap-2">
                    {currentModule.icon}
                    <span>{currentModule.title}</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {currentModule.tagline}
                  </p>
                </div>

                <div className="pt-5">
                  {currentModule.content}
                </div>
              </Card>

              {/* Interactive Step-by-Step UI Screencast Simulator */}
              <Card className="!p-6 bg-[#0f172a] border border-slate-800 shadow-xl overflow-hidden relative text-white rounded-3xl">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1">
                      <Smartphone size={10} />
                      <span>Walkthrough Screen Simulator</span>
                    </span>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {activeWalkthrough.title}
                    </h4>
                  </div>
                  <Badge className="bg-indigo-500/10 border-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-wider py-1 px-2.5">
                    {activeWalkthrough.steps[currentStepIndex].badge}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 items-center">
                  {/* Left Side: Dynamic Real Interactive CSS Mockup Frame matching the actual site exactly! */}
                  <div className="md:col-span-6 relative min-h-[180px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-6 text-center select-none">
                    <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500/80" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500/80" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                    </div>
                    
                    <div className="w-full">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStepIndex}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          {activeWalkthrough.steps[currentStepIndex].renderPreview()}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Right Side: Step-by-Step Info & Next controls */}
                  <div className="md:col-span-6 flex flex-col justify-between h-full py-2 space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase text-slate-500">Step {currentStepIndex + 1} of {activeWalkthrough.steps.length}</span>
                        <h5 className="text-sm font-bold text-white">
                          {activeWalkthrough.steps[currentStepIndex].label}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        {activeWalkthrough.steps[currentStepIndex].description}
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleNextStep}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all cursor-pointer shadow-lg shadow-indigo-600/20 outline-none"
                      >
                        <span>Next Step Preview</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
