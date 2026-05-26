import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Database } from 'lucide-react';

/**
 * Premium Card with custom micro-shadows and subtle interactive glows
 */
export const Card = ({ children, className = '', glowType = 'none', onClick, ...props }) => {
  const glowClasses = {
    none: 'hover:shadow-soft',
    brand: 'hover:shadow-soft-glow hover:border-calm-indigo/20',
    teal: 'hover:shadow-soft-glow-teal hover:border-calm-teal/20',
    rose: 'hover:shadow-soft-glow-rose hover:border-calm-rose/20',
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { y: -2, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white border border-slate-100 rounded-2xl p-6 shadow-soft transition-grow-glow text-left w-full outline-none focus:ring-2 focus:ring-calm-indigo/20 ${onClick ? 'cursor-pointer' : ''} ${glowClasses[glowType]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated Circular Progress indicator
 */
export const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = 'text-calm-indigo' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          className="text-slate-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Foreground circle with smooth animations */}
        <motion.circle
          className={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-sans tracking-tight text-slate-800">
          {percentage.toFixed(1).replace('.0', '')}%
        </span>
      </div>
    </div>
  );
};

/**
 * Muted status tag/badge
 */
export const Badge = ({ children, variant = 'indigo' }) => {
  const styles = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      {children}
    </span>
  );
};

/**
 * Live Database Sync indicator banner
 */
export const SyncStatus = ({ isConnected }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-soft text-xs font-medium text-slate-500">
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database size={13} className="text-slate-400" />
          <span>MongoDB Synced</span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
          <WifiOff size={13} className="text-slate-400" />
          <span>Local Storage Mode</span>
        </>
      )}
    </div>
  );
};

/**
 * Premium Live Proportional Math equation representation
 * Shows ONLY the final "Solve for X" simplified formula, beautifully formatted and mobile-responsive.
 */
export const ProportionalMathView = ({ formulaProps, bannerColor = 'bg-indigo-50/50 border-indigo-100/50 text-slate-700' }) => {
  const { sumObtained = 0, sumTotal = 60, weightage = 30, result = 0 } = formulaProps || {};
  
  return (
    <div className={`p-4 rounded-2xl border text-center ${bannerColor} transition-all duration-300 w-full overflow-hidden select-none shadow-soft-sm`}>
      <div className="flex flex-col gap-2.5 items-center justify-center">
        {/* Title Badges */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <span className="text-[9px] font-black text-calm-indigo bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-md uppercase font-sans tracking-wider shrink-0">
            Live Math Formula
          </span>
          <span className="text-[9px] font-bold text-slate-400 font-sans tracking-wider uppercase">
            Rule of Proportions
          </span>
        </div>
        
        {/* Equation Grid/Flow */}
        <div className="text-sm sm:text-base font-black font-mono text-slate-800 tracking-wide flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          <span className="text-calm-indigo font-extrabold">X</span>
          <span className="text-slate-400 font-sans font-medium text-xs sm:text-sm">=</span>
          <span className="text-slate-400 font-sans font-medium text-xs sm:text-sm">(</span>
          
          {/* Obtained Marks (Amber) */}
          <span className="text-amber-600 font-black bg-amber-50/80 border border-amber-100 px-1.5 py-0.5 rounded-lg text-xs sm:text-sm" title="Obtained CA Marks">
            {sumObtained}
          </span>
          
          <span className="text-slate-400 font-sans font-medium text-xs sm:text-sm">×</span>
          
          {/* Weightage (Indigo) */}
          <span className="text-indigo-600 font-black bg-indigo-50/80 border border-indigo-100 px-1.5 py-0.5 rounded-lg text-xs sm:text-sm" title="Weightage Marks">
            {weightage}
          </span>
          
          <span className="text-slate-400 font-sans font-medium text-xs sm:text-sm">)</span>
          <span className="text-slate-400 font-sans font-medium text-xs sm:text-sm">÷</span>
          
          {/* Total Marks (Emerald) */}
          <span className="text-emerald-600 font-black bg-emerald-50/80 border border-emerald-100 px-1.5 py-0.5 rounded-lg text-xs sm:text-sm" title="Total CA Marks">
            {sumTotal}
          </span>
          
          <span className="text-slate-400 font-sans font-medium text-xs sm:text-sm">=</span>
          
          {/* Result Score */}
          <span className="text-calm-indigo font-black underline decoration-2 underline-offset-2 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-xl text-xs sm:text-sm">
            {result.toFixed(2)}
          </span>
        </div>
        
        {/* Text fallback legend */}
        <span className="text-[9px] font-semibold text-slate-400 font-sans uppercase tracking-wider leading-none">
          X = (Obtained Marks × Weightage) ÷ Total Marks
        </span>
      </div>
    </div>
  );
};

/**
 * Compact animated circular progress ring for subject cards with rating-colored glow Drop-Shadows
 */
export const CardProgressRing = ({ percentage, size = 46, strokeWidth = 3.5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  // Grade color matching: Excellent >= 75 (teal/green), Average >= 40 (amber), Risk < 40 (rose/red)
  let circleColor = 'text-emerald-500';
  let glowColor = 'drop-shadow-[0_0_3px_rgba(16,185,129,0.3)]';
  let bgStroke = 'text-emerald-100/40';

  if (percentage >= 75) {
    circleColor = 'text-emerald-500';
    glowColor = 'drop-shadow-[0_0_3px_rgba(16,185,129,0.3)]';
    bgStroke = 'text-emerald-100/40';
  } else if (percentage >= 40) {
    circleColor = 'text-amber-500';
    glowColor = 'drop-shadow-[0_0_3px_rgba(245,158,11,0.3)]';
    bgStroke = 'text-amber-100/40';
  } else {
    circleColor = 'text-rose-500';
    glowColor = 'drop-shadow-[0_0_3px_rgba(244,63,94,0.3)]';
    bgStroke = 'text-rose-100/40';
  }

  return (
    <div className="relative flex items-center justify-center shrink-0 select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          className={bgStroke}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated foreground circle */}
        <motion.circle
          className={`${circleColor} ${glowColor}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex items-center justify-center">
        <span className="text-[10px] font-black font-sans tracking-tight text-slate-800">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

