import React from 'react';
import { motion } from 'framer-motion';
import { X, Mail, ExternalLink, Globe, Sparkles, Terminal } from 'lucide-react';
import { Card } from './UI';

// Bulletproof custom SVG brands for maximum portability and premium branding
const GithubIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.372.82 1.102.82 2.222v3.293c0 .319.22.594.82.477C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const LinkedinIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// Official original LeetCode logo SVG - Visual Monochrome Premium Accent
const LeetcodeIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.411L7.116 5.826a1.373 1.373 0 0 0-.01 1.937 1.375 1.375 0 0 0 1.937.01l4.436-4.42c.46-.458 1.205-.458 1.666 0l8.283 8.243c.46.457.46 1.2 0 1.657l-1.9 1.89-1.892-1.88a1.378 1.378 0 0 0-1.943.005 1.375 1.375 0 0 0 .005 1.943l1.89 1.88-1.9 1.89a1.377 1.377 0 0 0 .01 1.938c.536.536 1.4.536 1.937.01l4.436-4.42c.46-.458 1.205-.458 1.666 0l1.893 1.88a1.375 1.375 0 0 0 1.942-.005 1.375 1.375 0 0 0-.005-1.943l-1.89-1.88 1.9-1.89a1.375 1.375 0 0 0-.01-1.938L14.444.412A1.374 1.374 0 0 0 13.483 0zm-8.868 8.665a1.375 1.375 0 0 0-.968.41L.412 12.311a1.375 1.375 0 0 0 0 1.946l3.235 3.22c.536.535 1.4.535 1.937 0a1.375 1.375 0 0 0 0-1.946l-2.263-2.247c-.46-.457-.46-1.2 0-1.657l2.263-2.247c.536-.535.536-1.4 0-1.946a1.37 1.37 0 0 0-.97-.412z" />
  </svg>
);

export default function AboutMePanel({ onClose }) {
  const links = [
    {
      name: 'GitHub',
      icon: <GithubIcon size={16} />,
      url: 'https://github.com/phaniswar23',
      color: 'hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_4px_20px_rgba(15,23,42,0.06)]',
    },
    {
      name: 'LinkedIn',
      icon: <LinkedinIcon size={16} />,
      url: 'https://www.linkedin.com/in/phaniswar99/',
      color: 'hover:text-blue-600 hover:bg-blue-50/20 hover:border-blue-200 hover:shadow-[0_4px_20px_rgba(37,99,235,0.12)]',
    },
    {
      name: 'LeetCode',
      icon: <LeetcodeIcon size={16} />,
      url: 'https://leetcode.com/u/phaniswar1207/',
      color: 'hover:text-amber-600 hover:bg-amber-50/20 hover:border-amber-200 hover:shadow-[0_4px_20px_rgba(245,158,11,0.10)]',
    },
    {
      name: 'Portfolio',
      icon: <Globe size={16} />,
      url: 'https://www.phaniswar.me/',
      color: 'hover:text-calm-teal hover:bg-teal-50/20 hover:border-teal-200 hover:shadow-[0_4px_20px_rgba(79,209,197,0.10)]',
    },
    {
      name: 'Email',
      icon: <Mail size={16} />,
      url: 'mailto:phaniswarjanyavula@gmail.com',
      color: 'hover:text-rose-600 hover:bg-rose-50/20 hover:border-rose-200 hover:shadow-[0_4px_20px_rgba(229,115,115,0.10)]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Background shade overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
      />

      {/* Slide-in sidebar Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="relative w-full max-w-md bg-[#f8fafc] h-full shadow-2xl flex flex-col z-10 overflow-hidden border-l border-slate-100"
      >
        {/* Panel Header */}
        <div className="p-4 bg-white border-b border-slate-100/80 flex items-center justify-between select-none">
          <div className="flex items-center gap-2 text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">Developer Profile</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 text-xs font-black uppercase tracking-wider rounded-xl transition-all outline-none cursor-pointer"
          >
            Back
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between select-none">
          
          <div className="space-y-6">
            {/* Visual Avatar Card Container */}
            <motion.div 
              whileHover={{ y: -3, scale: 1.005 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Card 
                glowType="brand" 
                className="text-center flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50/20 relative overflow-hidden border border-slate-100/80 shadow-soft"
              >
                <div className="absolute top-3.5 right-3.5">
                  <Sparkles size={15} className="text-amber-400/85 animate-pulse" />
                </div>

                {/* Minimal Avatar Circle / Profile Image */}
                <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-indigo-50 shadow-soft-sm bg-indigo-50/30 flex items-center justify-center relative group">
                  <img
                    src="/profile.jpg"
                    alt="Phaniswar"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = '<span class="text-calm-indigo text-2xl font-black">P</span>';
                    }}
                  />
                </div>

                {/* Name section with Verified Developer badge */}
                <div className="flex items-center gap-1.5 justify-center mt-4">
                  <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">Phaniswar</h2>
                  <div className="h-4 w-4 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-calm-indigo shrink-0" title="Verified Developer">
                    <svg size={10} className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                </div>

                {/* Harmonized Tag pills highlighting credentials */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-3.5">
                  <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    MERN Stack
                  </span>
                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Full Stack
                  </span>
                  <span className="text-[8px] font-black text-amber-600 bg-amber-50 border border-amber-100/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Student Builder
                  </span>
                </div>
              </Card>
            </motion.div>

            {/* Premium Confident Personal Brand Statement */}
            <div className="space-y-3 text-left">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Mission Statement</h3>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-3.5">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  I am a passionate <strong className="text-calm-indigo font-bold">MERN & Full Stack Developer</strong> dedicated to engineering premium SaaS products, optimizing database pipelines, and crafting seamless user experiences.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed font-medium border-t border-slate-100/60 pt-3">
                  <span className="font-extrabold text-slate-700">MarkFlow</span> was designed to eliminate academic marks ambiguity, empowering student builders with instant, mathematically sound assessment insights.
                </p>
              </div>
            </div>

            {/* Social Connect List with custom hover glows */}
            <div className="space-y-3 text-left">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Connect With Me</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {links.map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-white text-slate-600 font-semibold text-sm shadow-soft transition-grow-glow ${link.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 transition-colors shrink-0">{link.icon}</span>
                      <span className="text-xs font-bold">{link.name}</span>
                    </div>
                    <ExternalLink size={12} className="opacity-45 shrink-0" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Minimal footer note */}
          <div className="pt-8 border-t border-slate-100/60 mt-8 text-center">
            <p className="text-[9px] text-slate-400 font-semibold leading-relaxed tracking-wider uppercase">
              Designed for simplicity • Engineered for speed
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
