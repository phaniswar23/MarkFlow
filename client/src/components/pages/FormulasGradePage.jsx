import React, { useState } from 'react';
import { Card, Badge } from '../UI';
import { Sparkles, HelpCircle, ChevronRight, ChevronDown, Award, Shield, AlertTriangle, School } from 'lucide-react';
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
            <span>Reference & Formulas</span>
            <Sparkles size={16} className="text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Educational guidelines explaining grading point matrices, attendance safety marks, and mathematical CGPA formulas.
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
          {/* Section 1: Privacy & Data Handling */}
          <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 space-y-3.5">
            <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} className="text-indigo-500" />
              <span>🔒 Privacy & Data Handling</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-indigo-500 font-black">⚡</span>
                <p><strong className="text-slate-800">Zero Data Collection:</strong> MarkFlow does not collect, store, or share any type of personal information or academic data.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-indigo-500 font-black">⚡</span>
                <p><strong className="text-slate-800">100% Local Storage:</strong> All of your calculated grade averages, subject inputs, and assessment logs stay entirely within your private browser storage.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-indigo-500 font-black">⚡</span>
                <p><strong className="text-slate-800">Independent Session:</strong> While the interface features a "MongoDB Synced" badge, the data handling ensures complete user-side privacy, and no details are transmitted to external entities.</p>
              </li>
            </ul>
          </div>

          {/* Section 2: Accuracy & Verification Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-100/50 space-y-3.5">
            <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>⚠️ Accuracy & Verification</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-amber-500 font-black">⚡</span>
                <p><strong className="text-slate-800">Estimated Results:</strong> The platform is an academic utility designed to help you estimate your Class Assessment (CA) marks and analyze your performance ahead of end-semester examinations.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-amber-500 font-black">⚡</span>
                <p><strong className="text-slate-800">Official Verification Required:</strong> While the tool attempts to keep calculations accurate, you must always verify your marks through your official university or college portal.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-amber-500 font-black">⚡</span>
                <p><strong className="text-slate-800">Final Authority:</strong> In the event of any discrepancy or mismatch between MarkFlow and your institution, official academic records are considered final.</p>
              </li>
            </ul>
          </div>

          {/* Section 3: Affiliation & Liability */}
          <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100/50 space-y-3.5">
            <h4 className="text-xs font-black text-rose-750 uppercase tracking-wider flex items-center gap-2">
              <School size={14} className="text-rose-500" />
              <span>🏫 Affiliation & Liability</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-rose-500 font-black">⚡</span>
                <p><strong className="text-slate-800">No Institutional Ties:</strong> This platform is independently developed solely for educational and self-analysis purposes. It is not affiliated with, endorsed by, or associated with any university, college, or academic institution.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-[10px] mt-0.5 text-rose-500 font-black">⚡</span>
                <p><strong className="text-slate-800">User Responsibility:</strong> By using the application, you acknowledge that all results are estimated calculations only, and the developers bear no responsibility for any academic decisions you make based on this tool.</p>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
