import React from 'react';
import { Card } from '../UI';
import { Sparkles, BarChart2, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts';

export default function AnalyticsPage({ subjects, semesters = [] }) {
  const totalSubjectsCount = subjects.length;

  // Sort semesters by number/name to ensure chronological order
  const chronologicalSemesters = [...semesters].sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  // Prepare radar chart data
  const radarData = subjects.map(sub => {
    const att = parseFloat(sub.attendance || 100);
    const ca = sub.metrics?.percentage || 0;
    const endSem = sub.endSemObtained && sub.endSemTotal 
      ? (parseFloat(sub.endSemObtained) / parseFloat(sub.endSemTotal)) * 100 
      : 0;

    return {
      subject: sub.code || sub.name.substring(0, 6),
      'Attendance %': att,
      'CA Score %': ca,
      'End Sem %': endSem
    };
  });

  const attendanceData = subjects.map(sub => ({
    name: sub.code || sub.name.substring(0, 6),
    'Attendance %': parseFloat(sub.attendance || 100),
    'Score %': sub.metrics?.percentage || 0
  }));

  // Correlation Scatter plot data: x = attendance, y = class score
  const scatterData = subjects.map(sub => ({
    code: sub.code || 'Sub',
    attendance: parseFloat(sub.attendance || 100),
    score: sub.metrics?.percentage || 0,
    credits: sub.credits || 3
  }));

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header card */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-soft">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Visual Analytics Board</span>
            <Sparkles size={16} className="text-indigo-400 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Detailed radar projections, visual comparison maps, and statistical metrics across your course modules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Comparisons (Lg: 6/12) */}
        <div className="lg:col-span-6">
          <Card className="!p-5 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart2 size={14} className="text-indigo-500" />
                <span>Multidimensional Index radar</span>
              </h3>
              {totalSubjectsCount === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 select-none bg-slate-50/20 rounded-2xl border border-dashed border-slate-200/80">
                  <svg className="w-16 h-16 text-slate-300 mb-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span className="text-xs font-bold text-slate-500">No Subjects Logged</span>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Log subjects to view multidimensional radar charts.</p>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" r="80%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#cbd5e1' }} />
                      <Radar name="CA Score %" dataKey="CA Score %" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                      <Radar name="Attendance %" dataKey="Attendance %" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Attendance vs Performance Scores (Lg: 6/12) */}
        <div className="lg:col-span-6">
          <Card className="!p-5 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" />
                <span>Attendance vs Class Score Comparison</span>
              </h3>
              {totalSubjectsCount === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 select-none bg-slate-50/20 rounded-2xl border border-dashed border-slate-200/80">
                  <svg className="w-16 h-16 text-slate-300 mb-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                  </svg>
                  <span className="text-xs font-bold text-slate-500">No Subjects Logged</span>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Log subjects to compare attendance against grade standing.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Attendance %" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="Score %" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Time-Series SGPA Progression (Lg: 6/12) */}
        <div className="lg:col-span-6">
          <Card className="!p-5 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" />
                <span>Time-Series SGPA Progression</span>
              </h3>
              {chronologicalSemesters.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 select-none bg-slate-50/20 rounded-2xl border border-dashed border-slate-200/80">
                  <svg className="w-16 h-16 text-slate-300 mb-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                  <span className="text-xs font-bold text-slate-500">No Semester History</span>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Perform SGPA calculations and save them to the Overall CGPA tab to trace semesters progression.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chronologicalSemesters} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sgpa" name="Semester SGPA" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Attendance vs Performance Scatter Chart (Lg: 6/12) */}
        <div className="lg:col-span-6">
          <Card className="!p-5 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart2 size={14} className="text-indigo-500" />
                <span>Attendance vs. Performance Scatter Plot</span>
              </h3>
              {totalSubjectsCount === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 select-none bg-slate-50/20 rounded-2xl border border-dashed border-slate-200/80">
                  <svg className="w-16 h-16 text-slate-300 mb-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span className="text-xs font-bold text-slate-500">No Subjects Logged</span>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Log subjects to analyze marks-attendance statistical correlations.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                      <CartesianGrid stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="attendance" name="Attendance" unit="%" domain={[50, 100]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                      <YAxis type="number" dataKey="score" name="Performance Score" unit="%" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                      <ZAxis type="number" dataKey="credits" range={[60, 200]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Legend />
                      <Scatter name="Subjects (Dot size reflects credits)" data={scatterData} fill="#8b5cf6" shape="circle" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
