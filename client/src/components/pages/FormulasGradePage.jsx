import React, { useState } from 'react';
import { Card, Badge } from '../UI';
import { Sparkles, HelpCircle, ChevronRight, ChevronDown, Award, Shield, AlertTriangle, School, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FormulasGradePage() {
  const [activeSection, setActiveSection] = useState('grades');

  const formulaDetails = {
    ca: {
      title: 'Continuous Assessment (CA) Rules',
      formula: 'X = (Obtained Marks × Weightage) ÷ Total Marks',
      description: 'Calculates the proportional contribution of selected continuous assessments (like quizzes, tests, labs) against target subject weightages.',
      example: 'If your best 2 CAs scored 24/30 and 27/30: Sum Obtained = 51, Sum Total = 60. Under a 30-mark weightage: (51 ÷ 60) × 30 = 25.50 / 30.'
    },
    sgpa: {
      title: 'Semester Grade Point Average (SGPA)',
      formula: 'SGPA = Σ(Subject Credits × Subject Grade Point) ÷ Σ(Total Credits)',
      description: 'Weighted sum of earned grade points mapped against corresponding credit ratings inside a single semester.',
      example: 'Subject A (4 credits, O Grade/10pts) + Subject B (3 credits, A Grade/8pts): Sum Points = (4×10) + (3×8) = 64. Total Credits = 7. SGPA = 64 ÷ 7 = 9.14.'
    },
    cgpa: {
      title: 'Cumulative Grade Point Average (CGPA)',
      formula: 'CGPA = Σ(Semester Credit Points) ÷ Σ(All Completed Credits)',
      description: 'Tracks overall academic standing across multiple semesters proportionally based on cumulative credits completed.',
      example: 'Sem 1 (20 credits, 8.2 SGPA) + Sem 2 (22 credits, 8.5 SGPA): Total Credit Points = (20×8.2) + (22×8.5) = 351. Total Credits = 42. CGPA = 351 ÷ 42 = 8.36.'
    }
  };

  const gradeMappings = [
    { range: '90% +', grade: 'O', gp: 10, label: 'Outstanding', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { range: '80% - 89%', grade: 'A+', gp: 9, label: 'Excellent', color: 'bg-teal-50 text-teal-600 border-teal-100' },
    { range: '70% - 79%', grade: 'A', gp: 8, label: 'Very Good', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { range: '60% - 69%', grade: 'B+', gp: 7, label: 'Good', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { range: '51% - 59%', grade: 'B', gp: 6, label: 'Above Average', color: 'bg-slate-50 text-slate-600 border-slate-200' },
    { range: '41% - 50%', grade: 'C', gp: 5, label: 'Average', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { range: '40%', grade: 'D', gp: 4, label: 'Pass', color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { range: 'Below 40%', grade: 'E/F/G', gp: 0, label: 'Fail / Re-appear', color: 'bg-rose-50 text-rose-600 border-rose-100' }
  ];

  const attendanceRules = [
    { range: '90% +', points: '5 / 5', label: 'Safety Zone' },
    { range: '85% - 89%', points: '4 / 5', label: 'Satisfactory' },
    { range: '80% - 84%', points: '3 / 5', label: 'Warning' },
    { range: '75% - 79%', points: '2 / 5', label: 'Critical' },
    { range: 'Below 75%', points: '0 / 5', label: 'Ineligible (Deported)' }
  ];

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header card */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-soft">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Formulas & Disclaimers</span>
            <Sparkles size={16} className="text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Educational guidelines explaining grading point matrices, CGPA formulas, and project responsibility disclaimers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Selector (Lg: 4/12) */}
        <div className="lg:col-span-4">
          <Card className="!p-3 space-y-1">
            {[
              { key: 'grades', label: 'Letter Grade System' },
              { key: 'formulas', label: 'Mathematical Formulas' },
              { key: 'attendance', label: 'Attendance Rules' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${activeSection === tab.key ? 'bg-indigo-50 text-indigo-600 font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <span>{tab.label}</span>
                <ChevronRight size={13} />
              </button>
            ))}
          </Card>
        </div>

        {/* Content displays (Lg: 8/12) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeSection === 'grades' && (
              <motion.div
                key="grades"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <Card className="!p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Award size={16} className="text-indigo-500" />
                    <span>Academic Grade Point Matrix</span>
                  </h3>
                  
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                          <th className="py-2.5 pl-3">Percentage Range</th>
                          <th className="py-2.5 text-center">Letter Grade</th>
                          <th className="py-2.5 text-center">Grade Points</th>
                          <th className="py-2.5 pr-3 text-right">Performance Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradeMappings.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-50/50 hover:bg-slate-50/10">
                            <td className="py-2.5 pl-3 font-bold text-slate-600">{row.range}</td>
                            <td className="py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${row.color}`}>
                                {row.grade}
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-700 font-mono">{row.gp} Points</td>
                            <td className="py-2.5 pr-3 text-right font-medium text-slate-400">{row.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeSection === 'formulas' && (
              <motion.div
                key="formulas"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {Object.keys(formulaDetails).map(key => {
                  const details = formulaDetails[key];
                  return (
                    <Card key={key} className="!p-5 space-y-3">
                      <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">{details.title}</h4>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs text-center font-bold tracking-wide select-text">
                        {details.formula}
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{details.description}</p>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-400 font-medium">
                        <strong className="text-slate-500 uppercase font-black text-[9px] tracking-wider block mb-0.5">Practical Example:</strong>
                        {details.example}
                      </div>
                    </Card>
                  );
                })}
              </motion.div>
            )}

            {activeSection === 'attendance' && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <Card className="!p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle size={16} className="text-indigo-500" />
                    <span>Attendance Marks Allocation System</span>
                  </h3>
                  
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                          <th className="py-2.5 pl-3">Attendance Percentage</th>
                          <th className="py-2.5 text-center">Marks Awarded</th>
                          <th className="py-2.5 pr-3 text-right">Eligibility Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRules.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-50/50 hover:bg-slate-50/10">
                            <td className="py-2.5 pl-3 font-bold text-slate-600">{row.range}</td>
                            <td className="py-2.5 text-center font-bold text-indigo-600 font-mono">{row.points} Marks</td>
                            <td className="py-2.5 pr-3 text-right">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${row.points.startsWith('0') ? 'bg-rose-50 text-rose-600 border border-rose-100/40' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/40'}`}>
                                {row.label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Institutional Terms & Privacy Architecture */}
      <Card className="!p-6 space-y-6 mt-8 border border-slate-100 bg-white shadow-soft">
        <div className="space-y-1.5 pb-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>📜 Institutional Terms & Privacy Architecture</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">Reference Log</span>
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Permanent reference record detailing MarkFlow's local-first architecture, calculations accuracy guidelines, and self-educational legal standing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section 1: Student Ownership & Independent Project */}
          <div className="p-4 rounded-2xl bg-indigo-50/20 border border-indigo-100/50 space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-indigo-700" style={{ color: 'var(--color-brand-medium)' }}>
              <School size={14} className="text-indigo-550" />
              <span>🏫 Student Project & Educational Independence</span>
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-indigo-500 font-black">⚡</span>
                <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Independent Student Project:</strong> I am a university student. This platform is a purely independent, self-developed project that I designed and built because I believed it would be highly useful for fellow students to plan their study routines.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-indigo-500 font-black">⚡</span>
                <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">No Institutional Ties:</strong> I am not working under, sponsored by, or affiliated with any university, college, or academic institution. This is entirely my own personal project aimed at improving my software thinking and developer capability.</p>
              </li>
            </ul>
          </div>

          {/* Section 2: Accuracy & Verification Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50/20 border border-amber-100/50 space-y-3.5">
            <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>⚠️ Marks Calculation & Expectation Notice</span>
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-amber-500 font-black">⚡</span>
                <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Estimation Purposes Only:</strong> The platform is designed to help you estimate your semester SGPA, CGPA targets, and subject-wise grades. It does NOT represent your final official academic results.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-amber-500 font-black">⚡</span>
                <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Official Grades May Vary:</strong> Computed results may vary from your official university portal marks. I have tried my absolute best to implement all modules correctly, but you must always verify your marks through your official portal. The developer bears zero responsibility for any decisions made based on this tool.</p>
              </li>
            </ul>
          </div>

          {/* Section 3: Privacy & Data Handling */}
          <div className="p-4 rounded-2xl bg-rose-50/20 border border-rose-100/50 space-y-3.5">
            <h4 className="text-xs font-black text-rose-750 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} className="text-rose-500" />
              <span>🔒 Privacy & Data Handling</span>
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-rose-500 font-black">⚡</span>
                <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Zero Data Harvesting:</strong> MarkFlow does not collect, harvest, sell, or share any personal information or academic data.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-rose-500 font-black">⚡</span>
                <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">100% Local Storage:</strong> All subject records, credit loads, and averages are saved securely on your own device inside your private browser storage.</p>
              </li>
            </ul>
          </div>

          {/* Highlighted Developer Contact Banner */}
          <div className="md:col-span-3 p-5 rounded-2xl bg-amber-550/10 border border-amber-500/25 text-amber-600 dark:text-amber-200 flex gap-3 text-xs leading-relaxed font-semibold">
            <Info size={16} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <strong className="block text-amber-800 dark:text-amber-300 font-bold mb-1 uppercase tracking-wide text-[10px]">Report Issues or Share Feedback</strong>
              If you find any calculation errors, mismatches, or have suggestions to improve the platform, please immediately contact the student developer through the <strong className="underline text-indigo-600 dark:text-indigo-400 cursor-pointer">About Developer</strong> tab or submit a <strong className="underline text-indigo-600 dark:text-indigo-400 cursor-pointer">Feedback</strong> form in the top bar.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
