import React from 'react';
import { Card, CircularProgress, Badge } from '../UI';
import { Sparkles, GraduationCap, Award, AlertTriangle, ChevronRight, BarChart2, TrendingUp, Briefcase, BookOpen } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function DashboardPage({ subjects, onNavigate, semesters = [] }) {
  const totalSubjectsCount = subjects.length;
  
  // Calculate average attendance
  const validAttendance = subjects.filter(s => s.attendance !== undefined && s.attendance !== '');
  const avgAttendance = validAttendance.length > 0 
    ? validAttendance.reduce((sum, s) => sum + parseFloat(s.attendance || 0), 0) / validAttendance.length 
    : 0;

  // Find lowest attendance subject
  let lowestAttSubject = null;
  let lowestAttVal = 101;
  subjects.forEach(sub => {
    const att = parseFloat(sub.attendance || 100);
    if (att < lowestAttVal) {
      lowestAttVal = att;
      lowestAttSubject = sub;
    }
  });

  // Find best and weakest subject based on obtained percentage
  let bestSubject = null;
  let weakSubject = null;
  let highestPerc = -1;
  let lowestPerc = 101;

  subjects.forEach(sub => {
    const perc = sub.metrics?.percentage || 0;
    if (perc > highestPerc) {
      highestPerc = perc;
      bestSubject = sub;
    }
    if (perc < lowestPerc) {
      lowestPerc = perc;
      weakSubject = sub;
    }
  });

  // Calculate SGPA and CGPA estimates
  // Assuming standard grade points based on letter grades or percentages
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

  const totalCredits = subjects.reduce((sum, s) => sum + (parseFloat(s.credits) || 3), 0);
  const totalPoints = subjects.reduce((sum, s) => {
    const gp = getGradePoint(s.metrics?.percentage || 0);
    return sum + (gp * (parseFloat(s.credits) || 3));
  }, 0);
  
  const currentSGPA = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  const backlogCount = subjects.filter(s => s.metrics?.percentage < 40).length;

  // Calculate CGPA based on semesters
  const totalSemestersCredits = semesters.reduce((sum, s) => sum + (parseFloat(s.credits) || 0), 0);
  const totalSemestersPoints = semesters.reduce((sum, s) => sum + ((parseFloat(s.sgpa) || 0) * (parseFloat(s.credits) || 0)), 0);
  
  const totalCumulativeCredits = totalSemestersCredits + totalCredits;
  const totalCumulativePoints = totalSemestersPoints + totalPoints;
  
  const currentCGPAValue = totalCumulativeCredits > 0 ? (totalCumulativePoints / totalCumulativeCredits) : 0;
  const hasBacklogs = backlogCount > 0;

  // Gather risk alerts
  const riskAlerts = [];
  subjects.forEach(sub => {
    if (sub.attendance !== undefined && parseFloat(sub.attendance) < 75) {
      riskAlerts.push({
        type: 'attendance',
        subject: sub.name,
        code: sub.code,
        message: `Attendance is critically low (${sub.attendance}%). Need 75%+ to be eligible.`
      });
    }
    if (sub.metrics?.percentage < 40) {
      riskAlerts.push({
        type: 'grade',
        subject: sub.name,
        code: sub.code,
        message: `Class Score is critically low (${sub.metrics?.percentage.toFixed(1)}%). At risk of failing.`
      });
    }
  });

  // Dynamic alert styling
  const alertCount = riskAlerts.length;
  let alertCardBg = 'bg-gradient-to-tr from-white to-slate-50/20 border-slate-100/70 text-slate-500';
  let alertTextColor = 'text-slate-500';
  let alertIconContainerBg = 'bg-slate-100 text-slate-400';

  if (alertCount > 0) {
    alertCardBg = 'bg-rose-500/5 border-rose-250/30 text-rose-500 animate-pulse';
    alertTextColor = 'text-rose-500 bg-rose-500/10 animate-pulse';
    alertIconContainerBg = 'bg-rose-500/10 text-rose-500 animate-pulse';
  }

  // Graph Data
  const gpaTrendData = subjects.map((sub, idx) => ({
    name: sub.code || `Sub ${idx + 1}`,
    score: sub.metrics?.percentage || 0,
    gp: getGradePoint(sub.metrics?.percentage || 0)
  }));

  const gradeDistribution = [
    { name: 'O (90+)', count: subjects.filter(s => (s.metrics?.percentage || 0) >= 90).length },
    { name: 'A+ (80-89)', count: subjects.filter(s => { const p = s.metrics?.percentage || 0; return p >= 80 && p < 90; }).length },
    { name: 'A (70-79)', count: subjects.filter(s => { const p = s.metrics?.percentage || 0; return p >= 70 && p < 80; }).length },
    { name: 'B+ (60-69)', count: subjects.filter(s => { const p = s.metrics?.percentage || 0; return p >= 60 && p < 70; }).length },
    { name: 'Passing (<60)', count: subjects.filter(s => { const p = s.metrics?.percentage || 0; return p >= 40 && p < 60; }).length },
    { name: 'Fail (<40)', count: subjects.filter(s => (s.metrics?.percentage || 0) < 40).length }
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#f43f5e'];

  return (
    <div className="space-y-6 text-left select-none">
      {/* High-Conversion "Quick Calc" Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/20 p-6 rounded-3xl shadow-soft-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-indigo-500/10 hover:border-indigo-400/30">
        <div className="flex items-center gap-4 text-left">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <span className="text-xl animate-pulse">⚡</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">EST. SGPA IN 10 SECONDS</span>
            <p className="text-sm text-slate-200 font-bold leading-relaxed max-w-2xl">
              Looking for a fast estimate? Try the <strong className="text-white underline decoration-indigo-400 underline-offset-4 font-black">Instant Semester SGPA Calculator</strong> without logging full profiles.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('semester-cgpa')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all transform hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 cursor-pointer whitespace-nowrap"
        >
          <span>Run Instant Estimate ⚡</span>
        </button>
      </div>

      {/* Dashboard Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Academic Dashboard</h1>
          <p className="text-xs text-slate-400 font-bold">Monitor your live standing, forecast projections, and log credentials.</p>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between p-5 relative overflow-hidden bg-gradient-to-tr from-white to-indigo-50/10">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estimated SGPA</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {currentSGPA > 0 ? currentSGPA.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[9px] text-slate-400 font-bold">Based on current credits</span>
            <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
              <GraduationCap size={13} />
            </div>
          </div>
        </Card>
 
        <Card className="flex flex-col justify-between p-5 relative overflow-hidden">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Subjects</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {totalSubjectsCount}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[9px] text-slate-400 font-bold">{totalCredits} Total Credits</span>
            <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
              <Award size={13} />
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 relative overflow-hidden">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Avg Attendance</span>
            <span className="text-2xl font-black text-teal-600 mt-1 block">
              {avgAttendance > 0 ? `${avgAttendance.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 w-full">
            {lowestAttSubject ? (
              <div className="text-[9px] font-bold text-slate-500 leading-tight">
                {(() => {
                  const sub = lowestAttSubject;
                  const tot = parseFloat(sub.totalClasses) || 40;
                  const att = parseFloat(sub.attendedClasses) || Math.round((parseFloat(sub.attendance) || 100) * tot / 100);
                  const targetFraction = 0.75;
                  const attPct = parseFloat(sub.attendance) || 0;
                  const safeBunks = attPct >= 75 ? Math.max(0, Math.floor(att / targetFraction - tot)) : 0;
                  const mustAttend = attPct < 75 ? Math.max(0, Math.ceil((targetFraction * tot - att) / (1 - targetFraction))) : 0;

                  return attPct >= 75 ? (
                    <span className="text-emerald-600">
                      💡 {sub.code}: <strong>{safeBunks}</strong> bunks safe.
                    </span>
                  ) : (
                    <span className="text-rose-600 animate-pulse">
                      ⚠️ {sub.code}: Attend <strong>{mustAttend}</strong> lectures.
                    </span>
                  );
                })()}
              </div>
            ) : (
              <span className="text-[9px] text-slate-400 font-bold">Safety threshold 75%</span>
            )}
            <div className="flex items-center justify-between w-full pt-1 border-t border-slate-50">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Lowest: {lowestAttSubject ? `${parseFloat(lowestAttVal).toFixed(0)}%` : 'N/A'}</span>
              <div className="h-6 w-6 rounded-lg bg-teal-50 flex items-center justify-center text-teal-500">
                <TrendingUp size={13} />
              </div>
            </div>
          </div>
        </Card>

        <Card className={`flex flex-col justify-between p-5 relative overflow-hidden ${alertCardBg}`}>
          <div>
            <span className={`text-[10px] font-black uppercase tracking-wider block ${alertCount > 0 ? alertTextColor : 'text-slate-400'}`}>Active Alerts</span>
            <span className={`text-2xl font-black mt-1 block ${alertTextColor}`}>
              {alertCount}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500">{alertCount > 0 ? 'Action required' : 'All clear'}</span>
            <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${alertIconContainerBg}`}>
              <AlertTriangle size={13} />
            </div>
          </div>
        </Card>
      </div>

      {/* Placement Eligibility Tracker Widget */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-soft">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-500">
              <Briefcase size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Placement Eligibility Checker</h3>
          </div>
          {(() => {
            const isInitialEmptyState = currentCGPAValue === 0 && backlogCount === 0 && totalSubjectsCount === 0;
            let eligibilityMsg = "Checking criteria...";
            let eligibilityColor = "text-slate-500 bg-slate-50 border-slate-100";
            let status = "Pending";

            if (isInitialEmptyState) {
              eligibilityMsg = "No academic data logged yet.";
              eligibilityColor = "text-blue-600 bg-blue-50/50 border-blue-100/60";
              status = "Awaiting Data";
            } else if (currentCGPAValue >= 7.5 && !hasBacklogs) {
              eligibilityMsg = "🎉 Outstanding Standing! You are fully eligible for Dream & Super Dream placement companies (CGPA > 7.5, Backlogs: 0).";
              eligibilityColor = "text-emerald-600 bg-emerald-50/50 border-emerald-100/60";
              status = "Eligible for Dream Companies";
            } else if (currentCGPAValue >= 6.5 && !hasBacklogs) {
              eligibilityMsg = "✅ Good Standing! You are eligible for standard Corporate & IT Services companies (CGPA > 6.5, Backlogs: 0). Boost CGPA above 7.5 to unlock Dream roles.";
              eligibilityColor = "text-indigo-600 bg-indigo-50/50 border-indigo-100/60";
              status = "Eligible for Core/IT Companies";
            } else {
              eligibilityMsg = "⚠️ Attention Required! Current metrics do not meet standard corporate criteria (CGPA < 6.5 or active backlogs present). Focus on clearing backlogs and boosting semesters.";
              eligibilityColor = "text-rose-600 bg-rose-50/50 border-rose-100/60";
              status = "Ineligible / Needs Improvement";
            }

            return (
              <div className="space-y-3">
                <div className={`p-4 border rounded-2xl text-xs font-bold leading-relaxed ${eligibilityColor}`}>
                  <strong>Status: {status}</strong>
                  <p className="mt-1 font-medium">
                    {isInitialEmptyState ? "Fill in your scores in the Subject-wise tab to check your corporate placement eligibility status." : eligibilityMsg}
                  </p>
                </div>
                <div className="flex gap-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <div>CGPA Check: <span className={isInitialEmptyState ? "text-slate-400" : (currentCGPAValue >= 7.5 ? "text-emerald-600" : "text-amber-600")}>{isInitialEmptyState ? "0.00" : currentCGPAValue.toFixed(2)} / 10.0</span></div>
                  <div>Active Backlogs: <span className={isInitialEmptyState ? "text-slate-400" : (hasBacklogs ? "text-rose-600 animate-pulse" : "text-emerald-600")}>{isInitialEmptyState ? "0" : backlogCount}</span></div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Grid: Analytics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Charts (Lg: 8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="!p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <BarChart2 size={16} className="text-indigo-500" />
              <span>Subject Performance Trajectory</span>
            </h3>
            {totalSubjectsCount === 0 ? (
              <div className="h-64 sm:h-80 flex flex-col items-center justify-center text-center p-6 select-none bg-slate-50/20 rounded-2xl border border-dashed border-slate-200/80 relative overflow-hidden">
                {/* Faint Line Chart SVG Skeleton Background */}
                <div className="absolute inset-0 opacity-[0.04] flex items-center justify-center pointer-events-none">
                  <svg className="w-full h-full p-4" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                    <line x1="10" y1="90" x2="90" y2="90" />
                    <line x1="10" y1="10" x2="10" y2="90" />
                    <path d="M 10 70 L 30 50 L 50 80 L 70 30 L 90 40" />
                    <circle cx="10" cy="70" r="2" />
                    <circle cx="30" cy="50" r="2" />
                    <circle cx="50" cy="80" r="2" />
                    <circle cx="70" cy="30" r="2" />
                    <circle cx="90" cy="40" r="2" />
                  </svg>
                </div>
                <div className="relative z-10 space-y-1 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-500">No Performance Trajectory</span>
                  <p className="text-[10px] text-slate-400 max-w-[200px]">Log your subjects in the Subject-wise calculator tab to generate premium charts.</p>
                  <button
                    onClick={() => onNavigate('subject-wise')}
                    className="mt-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow transition-all transform hover:scale-[1.02] cursor-pointer"
                  >
                    + Log First Subject
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gpaTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gpaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ stroke: '#f1f5f9' }} />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#gpaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="!p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-indigo-500" />
              <span>Grade Distribution</span>
            </h3>
            {totalSubjectsCount === 0 ? (
              <div className="h-64 sm:h-80 flex flex-col items-center justify-center text-center p-6 select-none bg-slate-50/20 rounded-2xl border border-dashed border-slate-200/80 relative overflow-hidden">
                {/* Faint Donut Chart SVG Skeleton Background */}
                <div className="absolute inset-0 opacity-[0.06] flex items-center justify-center pointer-events-none">
                  <svg className="w-28 h-28" viewBox="0 0 36 36" fill="none" stroke="currentColor">
                    <circle cx="18" cy="18" r="15.915" strokeWidth="3" strokeDasharray="100" strokeDashoffset="0" opacity="0.2" />
                    <circle cx="18" cy="18" r="15.915" strokeWidth="3.5" strokeDasharray="35 65" strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" strokeWidth="3.5" strokeDasharray="20 80" strokeDashoffset="-35" opacity="0.75" />
                    <circle cx="18" cy="18" r="15.915" strokeWidth="3.5" strokeDasharray="15 85" strokeDashoffset="-55" opacity="0.5" />
                    <circle cx="18" cy="18" r="15.915" strokeWidth="3.5" strokeDasharray="10 90" strokeDashoffset="-70" opacity="0.3" />
                  </svg>
                </div>
                <div className="relative z-10 space-y-1 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-500">No Grades Distributed Yet</span>
                  <p className="text-[10px] text-slate-400 max-w-[200px]">Grades distribution will update dynamically as scores are logged.</p>
                  <button
                    onClick={() => onNavigate('subject-wise')}
                    className="mt-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow transition-all transform hover:scale-[1.02] cursor-pointer"
                  >
                    + Log First Subject
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={45}>
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Alerts & Subject Rankings (Lg: 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="!p-5 flex flex-col justify-start">
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider text-[10px] text-slate-400">Top & Bottom Performers</h3>
            
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <span className="text-[9px] font-black text-emerald-600 block uppercase tracking-wider">Highest Scoring Subject</span>
                {bestSubject ? (
                  <div className="mt-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">{bestSubject.name}</span>
                    <span className="text-[10px] font-bold text-emerald-600 font-mono mt-0.5 block">
                      {bestSubject.metrics?.percentage.toFixed(1)}% ({bestSubject.code})
                    </span>
                  </div>
                ) : (
                  <div className="py-2 flex flex-col items-center justify-center text-center p-2 bg-slate-50/20 rounded-xl border border-dashed border-slate-200/80">
                    <svg className="w-8 h-8 text-slate-300 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <span className="text-[9px] font-bold text-slate-400">No subjects logged.</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                <span className="text-[9px] font-black text-rose-600 block uppercase tracking-wider">Needs Attention</span>
                {weakSubject ? (
                  <div className="mt-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">{weakSubject.name}</span>
                    <span className="text-[10px] font-bold text-rose-600 font-mono mt-0.5 block">
                      {weakSubject.metrics?.percentage.toFixed(1)}% ({weakSubject.code})
                    </span>
                  </div>
                ) : (
                  <div className="py-2 flex flex-col items-center justify-center text-center p-2 bg-slate-50/20 rounded-xl border border-dashed border-slate-200/80">
                    <svg className="w-8 h-8 text-slate-300 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <span className="text-[9px] font-bold text-slate-400">No subjects logged.</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="!p-5 flex flex-col justify-start flex-1">
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider text-[10px] text-slate-400">Critical Risk Notifications</h3>
            
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin flex-1">
              {riskAlerts.length > 0 ? (
                riskAlerts.map((alert, idx) => (
                  <div key={idx} className="flex gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-left">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black text-slate-700 block leading-tight">{alert.subject} ({alert.code})</span>
                      <p className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-2">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">All Systems Normal</span>
                  <p className="text-[9px] text-slate-400 mt-0.5 max-w-[150px]">Your credit standings and attendance scores are entirely healthy!</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
