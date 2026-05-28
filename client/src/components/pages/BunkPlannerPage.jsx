import React, { useState, useEffect } from 'react';
import { Card } from '../UI';
import { 
  Calendar, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle, 
  Sliders, 
  PlusCircle, 
  Activity, 
  ChevronRight, 
  Percent, 
  ShieldAlert,
  Info
} from 'lucide-react';

export default function BunkPlannerPage({ subjects, onSaveSubject, showAdvanced, setShowAdvanced, targetAttendance, setTargetAttendance }) {
  // Timetable state
  const [timetable, setTimetable] = useState(() => {
    const saved = localStorage.getItem('markflow-timetable');
    return saved ? JSON.parse(saved) : [
      { id: '1', day: 'Monday', subjectCode: 'CSE-301', time: '09:00 AM' },
      { id: '2', day: 'Wednesday', subjectCode: 'MAT-201', time: '11:00 AM' },
      { id: '3', day: 'Friday', subjectCode: 'CSE-301', time: '02:00 PM' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('markflow-timetable', JSON.stringify(timetable));
  }, [timetable]);

  const [newDay, setNewDay] = useState('Monday');
  const [newSubject, setNewSubject] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM');
  const [selectedSimClass, setSelectedSimClass] = useState(null);

  const [totalClasses, setTotalClasses] = useState('');
  const [attendedClasses, setAttendedClasses] = useState('');
  // Advanced States
  const [graceClasses, setGraceClasses] = useState('');
  const [futureClasses, setFutureClasses] = useState('');
  const [plannedBunks, setPlannedBunks] = useState('');
  const [weeksRemaining, setWeeksRemaining] = useState('');
  const [classesPerWeek, setClassesPerWeek] = useState('');

  // Calculations
  const tot = parseFloat(totalClasses) || 0;
  const grace = parseFloat(graceClasses) || 0;
  
  // Attended classes including grace leaves (clamped to not exceed total classes)
  const att = Math.min(tot, (parseFloat(attendedClasses) || 0) + grace);
  
  // Raw attendance percentage
  const attPct = tot > 0 ? (att / tot) * 100 : 0;
  
  const targetFraction = (parseFloat(targetAttendance) || 75) / 100;
  
  // Safe bunk calculation: (att / targetFraction) - tot
  const safeBunks = attPct >= targetAttendance ? Math.max(0, Math.floor(att / targetFraction - tot)) : 0;
  
  // Consecutive recovery classes calculation: (targetFraction * tot - att) / (1 - targetFraction)
  const mustAttend = attPct < targetAttendance ? Math.max(0, Math.ceil((targetFraction * tot - att) / (1 - targetFraction))) : 0;

  // Advanced calculations
  const projectedTotal = tot + (parseFloat(futureClasses) || 0);
  const projectedAttended = Math.min(projectedTotal, att + Math.max(0, (parseFloat(futureClasses) || 0) - (parseFloat(plannedBunks) || 0)));
  const projectedPct = projectedTotal > 0 ? (projectedAttended / projectedTotal) * 100 : 0;

  const totalFutureClasses = (parseInt(weeksRemaining) || 0) * (parseInt(classesPerWeek) || 0);
  const overallSemesterTotal = tot + totalFutureClasses;
  const maxTotalBunksAllowed = Math.max(0, Math.floor(overallSemesterTotal * (1 - targetFraction)));
  const totalBunksUsedSoFar = Math.max(0, tot - att);
  const remainingBunksAllowed = Math.max(0, maxTotalBunksAllowed - totalBunksUsedSoFar);

  return (
    <div className="space-y-6 text-left select-none animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-500">
              <Calendar size={18} />
            </span>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              Attendance Bunk Planner
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Configure your classes, customize your target attendance, and simulate advanced predictive schedules with premium academic insights.
          </p>
        </div>
        
        {/* ADVANCED TOGGLE SWITCH */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            showAdvanced 
              ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sliders size={12} />
          {showAdvanced ? 'Disable Advanced Features' : 'Enable Advanced Features'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: CORE INPUTS */}
        <div className={`space-y-6 transition-all duration-300 ${showAdvanced ? 'lg:col-span-8' : 'lg:col-span-7'}`}>
          <Card className="!p-6 space-y-6 bg-white border border-slate-100 shadow-soft-sm rounded-3xl">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={12} className="text-slate-400" />
                Planner Sandbox Configuration
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Enter your class details and dynamically tune your attendance goals.</p>
            </div>

            <div className="space-y-5">
              
              {/* TARGET ATTENDANCE THRESHOLD SLIDER */}
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                    <Percent size={13} className="text-indigo-500" />
                    Target Attendance Goal
                  </label>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg">
                    {targetAttendance}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={targetAttendance}
                    onChange={(e) => setTargetAttendance(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex gap-2">
                    {[75, 80, 85, 90].map(val => (
                      <button
                        key={val}
                        onClick={() => setTargetAttendance(val)}
                        className={`px-2 py-1 text-[9px] font-bold rounded ${
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

              {/* CORE ATTENDANCE INPUTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Classes Conducted</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 40"
                    value={totalClasses}
                    onFocus={() => { if (totalClasses === 0 || totalClasses === "0") setTotalClasses(""); }}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      if (valStr === "") {
                        setTotalClasses("");
                        return;
                      }
                      const val = Math.max(1, parseInt(valStr) || 0);
                      setTotalClasses(val);
                      if (val > 0 && attendedClasses !== "") {
                        setAttendedClasses(Math.min(parseInt(attendedClasses) || 0, val));
                      }
                    }}
                    className="w-full px-4 py-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700 shadow-inner-sm animate-pulse-once"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Classes Attended</label>
                  <input
                    type="number"
                    min="0"
                    max={totalClasses || 9999}
                    placeholder="e.g. 32"
                    value={attendedClasses}
                    onFocus={() => { if (attendedClasses === 0 || attendedClasses === "0") setAttendedClasses(""); }}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      if (valStr === "") {
                        setAttendedClasses("");
                        return;
                      }
                      const val = parseInt(valStr) || 0;
                      setAttendedClasses(totalClasses !== "" ? Math.min(val, tot) : val);
                    }}
                    className="w-full px-4 py-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-400 focus:bg-white transition-all text-slate-700 shadow-inner-sm animate-pulse-once"
                  />
                </div>
              </div>

            </div>
          </Card>

          {/* ADVANCED PANELS (LOCKED) */}
          {showAdvanced && (
            <Card className="col-span-full !p-6 border-indigo-150 bg-indigo-50/10 shadow-soft-sm rounded-3xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 border border-dashed border-indigo-300 animate-slideUp">
              <div className="flex items-start gap-4 text-left">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
                  <span className="text-xl">🔒</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Premium Advanced Module</span>
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">Advanced Buffer Simulator & Predictive Analytics</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
                    This advanced buffer forecasting and simulator tool is currently under development. To unlock these advanced analysis tools, please contact the developer or check back later!
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-indigo-600/10 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap">
                In Progress ⚡
              </div>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: PREMIUM WIDGET ANALYSERS */}
        <div className={`flex flex-col justify-start transition-all duration-300 ${showAdvanced ? 'lg:col-span-4' : 'lg:col-span-5'}`}>
          <Card className="flex flex-col justify-between items-center text-center p-6 bg-gradient-to-b from-white to-slate-50/30 flex-1 border border-slate-100 shadow-soft-lg rounded-3xl">
            <div className="space-y-5 w-full flex flex-col items-center py-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Real-time Buffer Analysis
              </span>
              
              {/* CIRCULAR PROGRESS */}
              <div className="relative flex items-center justify-center h-36 w-36 rounded-full border-4 border-indigo-50/50 shadow-soft bg-white select-none">
                <div className="text-center">
                  <span className={`text-4xl font-black ${attPct >= targetAttendance ? 'text-emerald-600' : 'text-rose-600'} tracking-tight`}>
                    {attPct.toFixed(1)}%
                  </span>
                  <span className="text-[8px] font-extrabold text-slate-400 block uppercase tracking-wider mt-0.5">ATTENDANCE</span>
                </div>
              </div>

              {/* DYNAMIC CARD NOTIFICATION */}
              <div className={`p-4 border rounded-2xl text-xs font-bold leading-relaxed w-full transition-all flex items-start gap-2.5 ${
                attPct >= targetAttendance 
                  ? 'text-emerald-600 bg-emerald-50/40 border-emerald-100/60' 
                  : 'text-rose-600 bg-rose-50/40 border-rose-100/60'
              }`}>
                {attPct >= targetAttendance ? (
                  <>
                    <Activity size={16} className="shrink-0 mt-0.5" />
                    <p className="text-left leading-normal">
                      🎉 <strong>Safe Standing!</strong> You can safely BUNK the next <strong>{safeBunks}</strong> consecutive class{safeBunks !== 1 ? 'es' : ''} and still remain above your target of {targetAttendance}%.
                    </p>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <p className="text-left leading-normal">
                      ⚠️ <strong>Attendance Alert!</strong> You are currently below target. You must ATTEND the next <strong>{mustAttend}</strong> consecutive class{mustAttend !== 1 ? 'es' : ''} to recover to {targetAttendance}%.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="w-full pt-4 border-t border-slate-100/60 space-y-3.5 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <Info size={11} className="text-slate-400" />
                  Consecutive Skip Buffer:
                </span>
                <span className={`font-black ${attPct >= targetAttendance ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {attPct >= targetAttendance ? `+${safeBunks} Classes` : `-${mustAttend} Classes Needed`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <Percent size={11} className="text-slate-400" />
                  Target Threshold:
                </span>
                <span className="font-black text-slate-700">{targetAttendance}%</span>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* TIMETABLE PREDICTIVE SCHEDULER (LOCKED) */}
      {showAdvanced && (
        <Card className="!p-6 bg-white border border-slate-100 rounded-3xl shadow-soft mt-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 border border-dashed border-indigo-300">
          <div className="flex items-start gap-4 text-left">
            <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
              <span className="text-xl">🔒</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Premium Advanced Module</span>
              <h4 className="text-sm font-black text-slate-800 tracking-tight">Timetable Predictive Scheduler</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
                The Timetable Predictive Scheduler is currently under development. Please check back for upcoming semester updates or contact the developer directly to verify integration testing!
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-indigo-600/10 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap">
            In Progress ⚡
          </div>
        </Card>
      )}

    </div>
  );
}
