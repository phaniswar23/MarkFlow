import React, { useState, useMemo } from 'react';
import { Card, Badge } from '../UI';
import { Sparkles, Trash2, RotateCcw, Search, Filter, Clock, Pin, PinOff, Calendar, FileText, RefreshCw, Calculator, GraduationCap, BookOpen, Award, CheckCircle, ChevronRight, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPage({ 
  historyList = [], 
  trashList = [],
  onRestoreTrashItem,
  onPermanentDeleteTrashItem,
  onClearTrash,
  autoDeleteTrash = false,
  onToggleAutoDeleteTrash,
  onDeleteItem, 
  onClearAll, 
  onTogglePin, 
  onRecalculate, 
  onNavigate 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // all, 1h, 24h, 7d, 10d, month
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, ca, subject, sgpa, cgpa, attendance, predictions, exports
  const [activeTab, setActiveTab] = useState('timeline'); // timeline, trash

  // Format relative timestamp
  const getRelativeTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  // Group items by days
  const groupTimeline = (items) => {
    const today = [];
    const yesterday = [];
    const last7Days = [];
    const older = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 86400000 * 7;

    items.forEach(item => {
      const time = new Date(item.timestamp).getTime();
      if (time >= startOfToday) {
        today.push(item);
      } else if (time >= startOfYesterday) {
        yesterday.push(item);
      } else if (time >= startOf7Days) {
        last7Days.push(item);
      } else {
        older.push(item);
      }
    });

    return { today, yesterday, last7Days, older };
  };

  // Resolve Category Visual Elements
  const getCategoryTheme = (type) => {
    const themes = {
      ca: { color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: <Calculator size={14} /> },
      subject: { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <GraduationCap size={14} /> },
      semester_sgpa: { color: 'text-teal-600 bg-teal-50 border-teal-100', icon: <BookOpen size={14} /> },
      overall_cgpa: { color: 'text-purple-600 bg-purple-50 border-purple-100', icon: <Award size={14} /> },
      attendance: { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <CheckCircle size={14} /> },
      predictions: { color: 'text-pink-600 bg-pink-50 border-pink-100', icon: <Sparkles size={14} /> },
      exports: { color: 'text-slate-600 bg-slate-50 border-slate-100', icon: <Share2 size={14} /> }
    };
    return themes[type] || { color: 'text-slate-500 bg-slate-50 border-slate-100', icon: <Clock size={14} /> };
  };

  // Perform multi-dimensional filters
  const filteredItems = useMemo(() => {
    return historyList
      .filter(item => {
        // 1. Search filter
        const q = searchQuery.toLowerCase().trim();
        return item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);
      })
      .filter(item => {
        // 2. Category filter
        if (categoryFilter === 'all') return true;
        return item.type === categoryFilter;
      })
      .filter(item => {
        // 3. Time filter
        if (timeFilter === 'all') return true;
        const diff = Date.now() - new Date(item.timestamp).getTime();
        if (timeFilter === '1h') return diff <= 3600000;
        if (timeFilter === '24h') return diff <= 86400000;
        if (timeFilter === '7d') return diff <= 86400000 * 7;
        if (timeFilter === '10d') return diff <= 86400000 * 10;
        if (timeFilter === 'month') return diff <= 86400000 * 30;
        return true;
      });
  }, [historyList, searchQuery, categoryFilter, timeFilter]);

  const filteredTrash = useMemo(() => {
    return trashList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      return item.title.toLowerCase().includes(q) || (item.originalData && JSON.stringify(item.originalData).toLowerCase().includes(q));
    });
  }, [trashList, searchQuery]);

  // Statistics calculations
  const stats = useMemo(() => {
    return {
      total: historyList.length,
      subjects: historyList.filter(h => h.type === 'subject').length,
      calculations: historyList.filter(h => ['ca', 'semester_sgpa', 'overall_cgpa'].includes(h.type)).length,
      pinned: historyList.filter(h => h.pinned).length
    };
  }, [historyList]);

  const grouped = groupTimeline(filteredItems);

  const renderSection = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1.5 flex items-center gap-1.5">
          <Calendar size={11} />
          <span>{title}</span>
        </h4>
        <div className="relative border-l border-slate-200/60 ml-3.5 pl-5 space-y-4">
          {items.map(item => {
            const theme = getCategoryTheme(item.type);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="relative bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-soft p-4 rounded-2xl transition-all text-left flex items-start gap-3 w-full"
              >
                {/* Timeline connector dot */}
                <div className="absolute -left-[27.5px] top-4 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-500 shadow-sm z-10" />

                {/* Category Icon */}
                <div className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 ${theme.color}`}>
                  {theme.icon}
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h5 className="text-xs font-bold text-slate-800 tracking-tight leading-none flex items-center gap-1.5">
                      <span>{item.title}</span>
                      {item.pinned && <Pin size={10} className="text-amber-500 fill-amber-500" />}
                    </h5>
                    <span className="text-[9px] font-semibold text-slate-400 font-mono">
                      {getRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                    {onRecalculate && ['ca', 'semester_sgpa', 'overall_cgpa'].includes(item.type) && (
                      <button
                        onClick={() => onRecalculate(item)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={9} />
                        <span>Recompute</span>
                      </button>
                    )}

                    <button
                      onClick={() => onTogglePin(item.id)}
                      className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                      title={item.pinned ? 'Unpin computation' : 'Pin computation'}
                    >
                      {item.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete activity log"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left select-none max-w-5xl mx-auto">
      
      {/* Overview Banner */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Academic Activity Memory</span>
            <Clock size={16} className="text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            A secure automated timeline tracking your Continuous Assessment estimations, overall SGPA projections, and exports.
          </p>
        </div>
        {activeTab === 'timeline' && historyList.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear Memory Log</span>
          </button>
        )}
        {activeTab === 'trash' && trashList.length > 0 && (
          <button
            onClick={onClearTrash}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear Trash Bin</span>
          </button>
        )}
      </div>

      {/* Tab Switcher: Timeline vs. Trash Bin */}
      <div className="flex bg-slate-100 p-1 rounded-2xl max-w-xs shadow-inner border border-slate-200/40">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'timeline' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Memory Timeline
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'trash' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Trash Bin ({trashList.length}) 🗑️
        </button>
      </div>

      {/* Primary KPI Overview Cards (Only shown for Timeline) */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="!p-4 bg-gradient-to-tr from-white to-indigo-50/10">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Operations</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">{stats.total}</span>
          </Card>
          <Card className="!p-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Logged Subjects</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{stats.subjects}</span>
          </Card>
          <Card className="!p-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Calculations Made</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{stats.calculations}</span>
          </Card>
          <Card className="!p-4 bg-gradient-to-tr from-white to-amber-50/10">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pinned Items</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.pinned}</span>
          </Card>
        </div>
      )}

      {/* Filter / Settings Systems */}
      <div className="space-y-3.5 bg-white border border-slate-100 p-5 rounded-2xl shadow-soft">
        
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'timeline' ? "Search calculations, grades, or activity details..." : "Search deleted items..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all"
          />
        </div>

        {activeTab === 'timeline' && (
          <>
            {/* Time filters */}
            <div className="flex gap-1.5 flex-wrap pt-1 border-t border-slate-50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider py-1 mr-1.5 flex items-center">Timeframe:</span>
              {[
                { id: 'all', label: 'All History' },
                { id: '1h', label: 'Last 1 Hour' },
                { id: '24h', label: 'Last 24 Hours' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '10d', label: 'Last 10 Days' },
                { id: 'month', label: 'This Month' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTimeFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${timeFilter === opt.id ? 'bg-indigo-600 text-white shadow' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Category filters */}
            <div className="flex gap-1.5 flex-wrap pt-1 border-t border-slate-50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider py-1 mr-2 flex items-center">Category:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'ca', label: 'CA Calculations' },
                { id: 'subject', label: 'Subject Analytics' },
                { id: 'semester_sgpa', label: 'Semester SGPA' },
                { id: 'overall_cgpa', label: 'Overall CGPA' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'predictions', label: 'Predictions' },
                { id: 'exports', label: 'Exports' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setCategoryFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${categoryFilter === opt.id ? 'bg-indigo-600 text-white shadow' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {activeTab === 'trash' && (
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-slate-50">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center">Trash Settings:</span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoDeleteTrash}
                onChange={onToggleAutoDeleteTrash}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-slate-200"></div>
              <span className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Auto-delete older than 10 days
              </span>
            </label>
          </div>
        )}

      </div>

      {/* Conditional Active Tab View */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'timeline' ? (
            filteredItems.length === 0 ? (
              <motion.div
                key="empty-timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 bg-white border border-slate-100 rounded-3xl text-center space-y-4"
              >
                <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Clock size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-600 uppercase">No academic activity yet.</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Any changes or CA calculations will be recorded automatically here.</p>
                </div>
                <button
                  onClick={() => onNavigate('ca-weightage')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer"
                >
                  Start Calculating
                </button>
              </motion.div>
            ) : (
              <motion.div key="timeline-list" className="space-y-6">
                {renderSection('Today', grouped.today)}
                {renderSection('Yesterday', grouped.yesterday)}
                {renderSection('Last 7 Days', grouped.last7Days)}
                {renderSection('Older', grouped.older)}
              </motion.div>
            )
          ) : (
            filteredTrash.length === 0 ? (
              <motion.div
                key="empty-trash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 bg-white border border-slate-100 rounded-3xl text-center space-y-4"
              >
                <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Trash2 size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-600 uppercase">Trash Bin is Empty</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Any subjects, sessions, or semesters you delete will appear here for easy recovery.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="trash-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">
                  <span>Deleted Items ({filteredTrash.length})</span>
                  <span>Deleted Date</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {filteredTrash.map(item => {
                    const theme = getCategoryTheme(item.type === 'ca_session' ? 'ca' : item.type);
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-100 hover:border-indigo-150 p-4.5 rounded-2xl flex items-start gap-4 transition-all"
                      >
                        {/* Type Icon */}
                        <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${theme.color}`}>
                          {theme.icon}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1 text-left">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h5 className="text-xs font-extrabold text-slate-800 tracking-tight leading-none">
                              {item.title}
                            </h5>
                            <span className="text-[9px] font-bold text-slate-400 font-mono">
                              Deleted {getRelativeTime(item.deletedAt)}
                            </span>
                          </div>

                          {/* Quick summary based on delete data */}
                          <div className="text-[10px] font-semibold text-slate-500">
                            {item.type === 'subject' && (
                              <span>Credits: {item.originalData.credits} • Attendance: {item.originalData.attendance}% • CA: {item.originalData.weightage}%</span>
                            )}
                            {item.type === 'ca_session' && (
                              <span>Logic: {item.originalData.selectionLogic?.replace('_', ' ').replace('_', ' ').toUpperCase()} • Percentage: {
                                typeof item.originalData.caPercentage === 'number' 
                                  ? item.originalData.caPercentage.toFixed(1) 
                                  : isNaN(parseFloat(item.originalData.caPercentage)) 
                                    ? 'N/A' 
                                    : parseFloat(item.originalData.caPercentage).toFixed(1)
                              }%</span>
                            )}
                            {item.type === 'semester' && (
                              <span>
                                SGPA: {typeof item.originalData.sgpa === 'number' 
                                  ? item.originalData.sgpa.toFixed(2) 
                                  : isNaN(parseFloat(item.originalData.sgpa)) 
                                    ? 'N/A' 
                                    : parseFloat(item.originalData.sgpa).toFixed(2)} • Credits: {item.originalData.credits}
                              </span>
                            )}
                            {item.type === 'history_log' && (
                              <span>Type: {item.originalData.type?.toUpperCase()} • Summary: {item.originalData.summary}</span>
                            )}
                          </div>

                          {/* Action triggers */}
                          <div className="flex items-center gap-2.5 pt-3">
                            <button
                              onClick={() => onRestoreTrashItem(item)}
                              className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw size={11} />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => onPermanentDeleteTrashItem(item.id)}
                              className="px-3 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 size={11} />
                              <span>Delete Forever</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
