import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ShieldAlert, Key, X, Clock, HelpCircle, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdvancedFeaturesLockModal({ isOpen, onClose, onUnlockSuccess, addToast, onNavigateToAbout }) {
  const HIGH_SECURITY_KEY = "BETA-ACCESS-MARKFLOW-SECUR"; // Step 1: 26 letters/hyphens
  const HIGH_SECURITY_NUMERIC = "12306717"; // Step 2: 8-digit numeric code
  
  const [step, setStep] = useState(1); // 1 = Access Key, 2 = 8-Digit OTP Boxes
  const [accessKey, setAccessKey] = useState('');
  
  // 8 Separate digit inputs for high security numeric verification
  const [otp, setOtp] = useState(Array(8).fill(''));
  const inputRefs = useRef([]);

  const [lockoutUntil, setLockoutUntil] = useState(() => {
    const saved = localStorage.getItem('markflow-lockout-until');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [timeLeftParts, setTimeLeftParts] = useState({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ms: 0
  });

  const [step2Timer, setStep2Timer] = useState(15);
  const [isSuccessUnlocked, setIsSuccessUnlocked] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  // Sync remaining lockout time with high-precision millisecond countdown
  useEffect(() => {
    let animFrameId;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = lockoutUntil - now;

      if (diff <= 0) {
        setLockoutUntil(0);
        localStorage.setItem('markflow-lock-attempts', '3');
        localStorage.removeItem('markflow-lockout-until');
        setStep(1);
        setOtp(Array(8).fill(''));
      } else {
        // Calculate units
        const ms = diff % 1000;
        const totalSecs = Math.floor(diff / 1000);
        const seconds = totalSecs % 60;
        const totalMins = Math.floor(totalSecs / 60);
        const minutes = totalMins % 60;
        const totalHrs = Math.floor(totalMins / 60);
        const hours = totalHrs % 24;
        const totalDays = Math.floor(totalHrs / 24);
        
        // Approx 30 days per month
        const months = Math.floor(totalDays / 30);
        const days = totalDays % 30;

        setTimeLeftParts({ months, days, hours, minutes, seconds, ms });
        animFrameId = requestAnimationFrame(updateCountdown);
      }
    };

    if (lockoutUntil > Date.now()) {
      animFrameId = requestAnimationFrame(updateCountdown);
    }

    return () => cancelAnimationFrame(animFrameId);
  }, [lockoutUntil]);

  // Step 2 Countdown timer (15 seconds)
  useEffect(() => {
    if (isOpen && step === 2 && !isSuccessUnlocked && lockoutUntil <= Date.now()) {
      setStep2Timer(15);
      const timerInterval = setInterval(() => {
        setStep2Timer(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            handleYearLockout("Verification timer expired! System locked.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [isOpen, step, isSuccessUnlocked, lockoutUntil]);

  // Auto-focus first input when entering Step 2
  useEffect(() => {
    if (isOpen && step === 2 && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0].focus();
      }, 100);
    }
  }, [isOpen, step]);

  const handleYearLockout = (msg) => {
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const unlockTime = Date.now() + oneYear;
    setLockoutUntil(unlockTime);
    localStorage.setItem('markflow-lockout-until', String(unlockTime));
    if (addToast) addToast(msg || "HIGH-SECURITY SYSTEM TRIGGERED! Lockout duration: 365 Days.", "error");
    setStep(1);
    setAccessKey('');
    setOtp(Array(8).fill(''));
  };

  const handleVerifyStep1 = (e) => {
    e.preventDefault();
    if (lockoutUntil > Date.now()) return;

    const trimmedKey = accessKey.trim().toUpperCase();

    if (trimmedKey === HIGH_SECURITY_KEY) {
      if (addToast) addToast("Step 1 Clear! Proceed to high-security terminal...", "success");
      setStep(2);
      setStep2Timer(15);
      setOtp(Array(8).fill(''));
    } else {
      const savedAttempts = localStorage.getItem('markflow-lock-attempts');
      const attempts = savedAttempts !== null ? parseInt(savedAttempts, 10) : 3;
      const nextAttempts = attempts - 1;
      
      if (nextAttempts <= 0) {
        const unlockTime = Date.now() + 5 * 60 * 1000; // 5 mins lockout
        setLockoutUntil(unlockTime);
        localStorage.setItem('markflow-lock-attempts', '3');
        localStorage.setItem('markflow-lockout-until', String(unlockTime));
        if (addToast) addToast("Access locked. Incorrect access key limit reached.", "error");
      } else {
        localStorage.setItem('markflow-lock-attempts', String(nextAttempts));
        if (addToast) addToast(`Incorrect access key. ${nextAttempts} attempts remaining!`, "error");
      }
    }
  };

  // OTP inputs handlers
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next box if filled
    if (newOtp[index] && index < 7 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Focus previous input on backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyStep2 = (e) => {
    if (e) e.preventDefault();
    if (lockoutUntil > Date.now()) return;

    const enteredCode = otp.join('');

    if (enteredCode === HIGH_SECURITY_NUMERIC) {
      if (addToast) addToast("Access Granted! Advanced features unlocked successfully.", "success");
      onUnlockSuccess();
      onClose();
      // Reset states immediately
      setStep(1);
      setAccessKey('');
      setOtp(Array(8).fill(''));
    } else {
      handleYearLockout("INCORRECT HIGH-SECURITY CODE! System locked down for 365 Days.");
    }
  };

  // Auto trigger verification when all 8 boxes are filled
  useEffect(() => {
    if (otp.join('').length === 8 && step === 2 && !isSuccessUnlocked && lockoutUntil <= Date.now()) {
      handleVerifyStep2();
    }
  }, [otp, step]);

  const isLocked = lockoutUntil > Date.now();
  const isOneYearLock = isLocked && (lockoutUntil - Date.now() > 24 * 60 * 60 * 1000);

  const modalVariants = {
    idle: { scale: 1, y: 0, opacity: 1 },
    shake: {
      x: [0, -12, 12, -12, 12, -8, 8, -4, 4, 0],
      y: [0, 5, -5, 5, -5, 3, -3, 2, -2, 0],
      scale: [1, 1.05, 0.98, 1.02, 1],
      transition: { duration: 0.8 }
    }
  };

  const getAttemptsRemaining = () => {
    const saved = localStorage.getItem('markflow-lock-attempts');
    return saved !== null ? parseInt(saved, 10) : 3;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Dynamic theme-fitted backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSuccessUnlocked ? undefined : onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
          />

          {/* Glowing Rainbow Success beam */}
          {isSuccessUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.8, 2.5, 3.5] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="absolute pointer-events-none w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 opacity-20 blur-3xl z-40 animate-pulse"
            />
          )}

          {/* Modal Container: Perfect Light / Dark theme styling */}
          <motion.div
            variants={modalVariants}
            animate={shouldShake ? "shake" : "idle"}
            initial={{ scale: 0.9, y: 15, opacity: 0 }}
            exit={{ scale: 0.9, y: 15, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`relative w-full max-w-md border rounded-3xl p-6 shadow-2xl z-50 text-left transition-all duration-500 overflow-hidden ${
              isSuccessUnlocked 
                ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-500 text-emerald-800 dark:text-white shadow-emerald-500/20'
                : isOneYearLock
                ? 'bg-rose-50 dark:bg-rose-950/95 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-rose-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white shadow-xl dark:shadow-indigo-500/5'
            }`}
          >
            {/* Success flash cover */}
            {isSuccessUnlocked && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay pointer-events-none"
              />
            )}

            {/* Close Button */}
            {!isSuccessUnlocked && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer z-50"
              >
                <X size={15} />
              </button>
            )}

            {/* Glowing High-Security Lock Symbol */}
            <div className="flex flex-col items-center text-center mt-3 mb-6 relative z-10">
              <motion.div
                animate={isSuccessUnlocked ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                  boxShadow: ["0 0 15px rgba(16, 185, 129, 0.2)", "0 0 45px rgba(16, 185, 129, 0.8)", "0 0 15px rgba(16, 185, 129, 0.2)"]
                } : isLocked ? {
                  scale: [1, 1.05, 1],
                  boxShadow: ["0 0 10px rgba(239, 68, 68, 0.2)", "0 0 25px rgba(239, 68, 68, 0.6)", "0 0 10px rgba(239, 68, 68, 0.2)"]
                } : step === 2 ? {
                  scale: [1, 1.1, 1],
                  boxShadow: ["0 0 15px rgba(245, 158, 11, 0.3)", "0 0 35px rgba(245, 158, 11, 0.7)", "0 0 15px rgba(245, 158, 11, 0.3)"]
                } : { 
                  scale: [1, 1.05, 1],
                  boxShadow: ["0 0 10px rgba(99, 102, 241, 0.2)", "0 0 30px rgba(99, 102, 241, 0.5)", "0 0 10px rgba(99, 102, 241, 0.2)"]
                }}
                transition={{ duration: isSuccessUnlocked ? 1.5 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className={`h-20 w-20 rounded-full flex items-center justify-center border shadow-soft mb-3 transition-colors duration-500 relative ${
                  isSuccessUnlocked 
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-400 dark:text-emerald-400'
                    : isLocked 
                    ? 'bg-rose-100 border-rose-300 text-rose-600 dark:bg-rose-500/20 dark:border-rose-500/50 dark:text-rose-400' 
                    : step === 2
                    ? 'bg-amber-100 border-amber-300 text-amber-600 dark:bg-amber-500/10 dark:border-amber-400 dark:text-amber-400'
                    : 'bg-indigo-50 border-indigo-100 text-indigo-500 dark:bg-indigo-500/20 dark:border-indigo-400 dark:text-indigo-400'
                }`}
              >
                {/* Continuous rotating glowing outer rings for high security look */}
                <span className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30 animate-spin" style={{ animationDuration: '8s' }} />
                {step === 2 && !isSuccessUnlocked && !isLocked && (
                  <span className="absolute inset-0.5 rounded-full border border-amber-500/50 animate-reverse-spin" style={{ animationDuration: '4s' }} />
                )}
                
                {isSuccessUnlocked ? (
                  <Unlock size={30} className="animate-bounce" />
                ) : isLocked ? (
                  <ShieldAlert size={30} className="animate-pulse" />
                ) : step === 2 ? (
                  <AlertTriangle size={30} className="animate-pulse" />
                ) : (
                  <Lock size={30} />
                )}
              </motion.div>

              {/* Countdown circle */}
              {step === 2 && !isSuccessUnlocked && !isLocked && (
                <div className="flex flex-col items-center mt-1">
                  <div className="relative flex items-center justify-center h-11 w-11 rounded-full border-2 border-amber-300 dark:border-amber-500/20 bg-slate-50 dark:bg-slate-950 shadow-inner">
                    <span className="font-mono text-base font-black text-amber-650 dark:text-amber-400 tracking-wider">
                      {step2Timer}s
                    </span>
                    <svg className="absolute top-0 left-0 w-full h-full -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        className="stroke-amber-500 fill-none"
                        strokeWidth="2.5"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 * (1 - step2Timer / 15)}
                        style={{ transform: 'translate(2px, 2px)', transition: 'stroke-dashoffset 1s linear' }}
                      />
                    </svg>
                  </div>
                  <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 tracking-widest uppercase mt-1">
                    System Autodestruct Countdown
                  </span>
                </div>
              )}

              <h3 className="text-xl font-black tracking-tight mt-3 text-slate-800 dark:text-white">
                {isSuccessUnlocked ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-center">
                    <ShieldCheck size={22} className="animate-bounce" />
                    ACCESS GRANTED
                  </span>
                ) : isOneYearLock ? (
                  <span className="text-rose-600 dark:text-rose-500 animate-pulse flex items-center gap-1.5 justify-center font-black">
                    <ShieldAlert size={20} className="shrink-0 text-rose-500" />
                    ⚠️ WARNING: HARD LOCK ACTIVE
                  </span>
                ) : isLocked ? (
                  "Access Lockout Active"
                ) : step === 2 ? (
                  <span className="text-amber-600 dark:text-amber-500">Secondary High-Security Auth</span>
                ) : (
                  "Advanced Features Locked"
                )}
              </h3>
              
              <div className={`px-3 py-1 rounded font-extrabold text-[9px] uppercase tracking-wider mt-2 ${
                isSuccessUnlocked
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : isLocked
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-550/25 dark:text-rose-300'
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
              }`}>
                {isSuccessUnlocked ? "Asset Unlocked successfully" : "Beta Feature restricted Preview"}
              </div>
            </div>

            {/* Lockbox Description & Forms */}
            <div className="space-y-4">
              {isSuccessUnlocked ? (
                <div className="text-center p-6 space-y-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-500/30">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Applying premium algorithms & full academic components...
                  </p>
                  <div className="flex justify-center py-2">
                    <RefreshCw size={24} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              ) : isLocked ? (
                /* RED WARNING countdown (Decreasing Months, Days, Hours, Minutes, Seconds, Milliseconds live!) */
                <div className="space-y-4 bg-rose-100/50 dark:bg-slate-950/85 p-5 rounded-2xl border border-rose-300 dark:border-rose-500/20">
                  <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-500">
                    <Clock size={20} className="animate-spin shrink-0" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">LOCKOUT TERMINAL ACTIVE</span>
                      <span className="text-[9px] font-bold text-rose-750 dark:text-rose-400/80">SECURITY VIOLATION DETECTED</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-rose-850 dark:text-slate-300 leading-relaxed font-medium">
                    A critical authentication failure has triggered a system hard-lock. Advanced feature activation is suspended to guard local code integrations.
                  </p>

                  <div className="bg-rose-500/10 dark:bg-rose-500/5 p-4 rounded-xl border border-rose-350 dark:border-rose-500/25 space-y-2">
                    <span className="text-[9px] font-black tracking-widest text-rose-600 dark:text-rose-400 uppercase block text-center">
                      🔐 HIGH SECURITY COOLDOWN REMAINING
                    </span>
                    <div className="grid grid-cols-6 gap-1 text-center font-mono">
                      <div className="bg-rose-200/80 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-500/30 p-2 rounded">
                        <span className="text-lg font-black text-rose-700 dark:text-rose-450 block leading-tight">
                          {timeLeftParts.months}
                        </span>
                        <span className="text-[7px] text-rose-650 dark:text-rose-300/80 uppercase font-bold">Month</span>
                      </div>
                      <div className="bg-rose-200/80 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-500/30 p-2 rounded">
                        <span className="text-lg font-black text-rose-700 dark:text-rose-450 block leading-tight">
                          {timeLeftParts.days}
                        </span>
                        <span className="text-[7px] text-rose-650 dark:text-rose-300/80 uppercase font-bold">Day</span>
                      </div>
                      <div className="bg-rose-200/80 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-500/30 p-2 rounded">
                        <span className="text-lg font-black text-rose-700 dark:text-rose-450 block leading-tight">
                          {timeLeftParts.hours}
                        </span>
                        <span className="text-[7px] text-rose-650 dark:text-rose-300/80 uppercase font-bold">Hour</span>
                      </div>
                      <div className="bg-rose-200/80 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-500/30 p-2 rounded">
                        <span className="text-lg font-black text-rose-700 dark:text-rose-450 block leading-tight">
                          {timeLeftParts.minutes}
                        </span>
                        <span className="text-[7px] text-rose-650 dark:text-rose-300/80 uppercase font-bold">Min</span>
                      </div>
                      <div className="bg-rose-200/80 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-500/30 p-2 rounded">
                        <span className="text-lg font-black text-rose-700 dark:text-rose-450 block leading-tight">
                          {timeLeftParts.seconds}
                        </span>
                        <span className="text-[7px] text-rose-650 dark:text-rose-300/80 uppercase font-bold">Sec</span>
                      </div>
                      <div className="bg-rose-200/80 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-500/30 p-2 rounded">
                        <span className="text-sm font-black text-rose-700 dark:text-rose-450 block leading-normal">
                          {timeLeftParts.ms.toString().padStart(3, '0')}
                        </span>
                        <span className="text-[7px] text-rose-650 dark:text-rose-300/80 uppercase font-bold">Ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : step === 1 ? (
                /* STEP 1 FORM: Theme responsive input and card design */
                <>
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 leading-relaxed">
                    <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wide block">🔬 Stage 1: Developer Beta Access</span>
                    <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                      This premium component is currently in restricted beta testing. To proceed:
                    </p>
                    <ul className="text-xs text-slate-550 dark:text-slate-400 font-medium space-y-1.5 pl-1.5 list-disc list-inside">
                      <li>
                        Contact the{' '}
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToAbout) {
                              onNavigateToAbout();
                              onClose();
                            }
                          }}
                          className="text-indigo-600 dark:text-indigo-400 font-black hover:underline cursor-pointer focus:outline-none inline bg-transparent p-0 m-0 border-0"
                        >
                          developer (phaniswar23)
                        </button>{' '}
                        for your access key.
                      </li>
                      <li>Or enter your high-security 26-character beta key below.</li>
                    </ul>
                  </div>

                  <form onSubmit={handleVerifyStep1} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wide">Enter 26-Letter Beta Access Key</label>
                        <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-500 flex items-center gap-0.5 animate-pulse">
                          ⚠️ {getAttemptsRemaining()} attempts left
                        </span>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={26}
                          placeholder="e.g. BETA-ACCESS-MARKFLOW-..."
                          value={accessKey}
                          onChange={(e) => setAccessKey(e.target.value.replace(/[^A-Za-z-]/g, ''))}
                          className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-xs focus:border-indigo-400 dark:focus:border-indigo-500 transition-all font-mono text-slate-700 dark:text-white uppercase placeholder-slate-450 dark:placeholder-slate-700"
                        />
                        <Key size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={accessKey.length < 15}
                        className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                          accessKey.length < 15
                            ? 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed dark:bg-slate-850 dark:border-slate-800 dark:text-slate-605'
                            : 'bg-indigo-655 hover:bg-indigo-600 text-white shadow-indigo-600/20'
                        }`}
                      >
                        <Lock size={12} />
                        <span>Verify Step 1</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* STEP 2 FORM: OTP INPUTS styled with full light/dark theme adaptive styles */
                <>
                  <div className="space-y-3 bg-amber-50 dark:bg-amber-500/5 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 leading-relaxed text-left">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider block">⚠️ STAGE 2: HIGH-SECURITY SECURE CODE REQUIRED</span>
                    <p className="text-xs text-amber-850 dark:text-amber-300/90 font-medium">
                      Enter the highly secure 8-digit separate numeric code.
                    </p>
                    <div className="p-2.5 bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-[10px] text-rose-700 dark:text-rose-300 font-extrabold uppercase tracking-wide">
                      🛑 STRICT PROTOCOL: You have exactly ONE (1) chance. Typing incorrect code or countdown timer reaching zero triggers an instant 1-YEAR lockout.
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-center text-[10px] font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                        8-DIGIT SECURE CODE
                      </label>
                      
                      <div className="flex justify-between items-center gap-1.5">
                        {Array(8).fill(null).map((_, index) => (
                          <input
                            key={index}
                            type="text"
                            maxLength={1}
                            ref={el => inputRefs.current[index] = el}
                            value={otp[index]}
                            onChange={e => handleOtpChange(index, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(index, e)}
                            className="w-10 h-12 bg-slate-50 dark:bg-slate-950 border border-amber-300 dark:border-amber-500/30 rounded-xl text-center font-mono text-lg font-black text-amber-650 dark:text-amber-400 focus:border-amber-500 outline-none transition-all shadow-inner focus:shadow-amber-500/10"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleYearLockout("Verification aborted! System locked for safety.");
                        }}
                        className="flex-1 py-3 border border-rose-300 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Abort Protocol
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
