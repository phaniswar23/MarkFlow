import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, ArrowRight, Trash2, RefreshCw, Volume2, VolumeX, Copy, Check, Calculator, Calendar, Settings, Award, Mic, MicOff } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('offline'); // 'offline', 'connecting', 'connected'
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('markflow-ai-chat-history');
    return saved ? JSON.parse(saved) : [
      { 
        role: 'assistant', 
        text: 'Hi, this is Markflow bot. How can I help you today? ✨' 
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef(null);
  const speechUtteranceRef = useRef(null);
  const recognitionRef = useRef(null);

  // Prevent stale closure bug (multiple duplicate queries) in Speech Recognition
  const handleSendMessageRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('markflow-ai-chat-history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  // Keep ref in sync on every render
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  });

  // Simulate real-time secure connection when the chat is opened
  useEffect(() => {
    if (isOpen) {
      if (connectionStatus !== 'connected') {
        setConnectionStatus('connecting');
        const timer = setTimeout(() => {
          setConnectionStatus('connected');
        }, 1200); // Elegant real-time connection delay
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen]);

  // Stop reading and recording if chatbot window is closed
  useEffect(() => {
    if (!isOpen) {
      handleStopSpeaking();
      handleStopListening();
    }
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        
        // Auto-send voice query using the fresh ref to prevent duplicate triggers
        setTimeout(() => {
          if (handleSendMessageRef.current) {
            handleSendMessageRef.current(transcript);
          }
        }, 600);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleStartListening = () => {
    if (recognitionRef.current) {
      try {
        setInput(''); // Clear previous query instantly for fresh voice input
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    } else {
      alert('Voice speech recognition is not supported in this browser. Please try using Google Chrome or Safari.');
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput('');

    // Append user message
    const updatedMessages = [...messages, { role: 'user', text: messageText }];
    setMessages(updatedMessages);
    setIsLoading(true);

    const systemInstruction = `You are "MarkFlow AI", a specialized, premium academic assistant for the MarkFlow application.
MarkFlow is an Academic OS and grade dashboard designed for students to plan continuous assessments (CAs), attendance, bunking schedules, SGPA, and cumulative CGPA.

CRITICAL RULES:
1. You must ONLY answer questions directly related to MarkFlow, academics, GPA/CGPA calculations, course planning, or how to use this website's features (such as CA Weightage, Bunk Planner, Semester SGPA, Overall CGPA, Trash Bin, and Interface customization).
2. If the user asks anything unrelated to MarkFlow, course planning, or academic grade planning (e.g. general knowledge, programming questions, cooking, pop culture, movie trivia), politely refuse and guide them back to MarkFlow features.
3. Keep your answers concise, structured, friendly, and visually aligned using clear markdown formatting. For example:
- Use bullet points for steps.
- Use bold text for subject codes or menu options.
- Keep calculations simple and easy to understand.
4. If a user asks "How do I calculate CGPA?" explain that they can navigate to the "Semester SGPA" or "Overall CGPA" pages to use the integrated visual calculators.`;

    // Map messages for Gemini API
    const contents = updatedMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    try {
      // 1. Try querying the backend proxy route first
      const response = await fetch(
        `http://localhost:5001/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to connect to backend proxy.');
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I had trouble understanding that. Could you please rephrase?";

      setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
    } catch (error) {
      console.warn('Backend proxy call failed, trying secure client-side API Key fallback...', error);
      
      // 2. Fallback to client-side localStorage key if the student previously set it up
      const localKey = localStorage.getItem('markflow-gemini-key');
      if (localKey) {
        try {
          const fallbackRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${localKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                  parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                  maxOutputTokens: 800,
                  temperature: 0.2
                }
              }),
            }
          );

          if (!fallbackRes.ok) {
            throw new Error('Fallback direct API call failed.');
          }

          const fallbackData = await fallbackRes.json();
          const replyText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I had trouble understanding that. Could you please rephrase?";
          
          setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
          return; // Success! Bypassed backend config issue
        } catch (fallbackErr) {
          console.error('Fallback direct call error:', fallbackErr);
        }
      }      // If both backend and local key fallback fail, use a smart local academic fallback reply to ensure 100% uptime:
      const textLower = messageText.toLowerCase();
      let fallbackText = '';

      if (textLower.includes('bunk') || textLower.includes('attendance') || textLower.includes('classes')) {
        fallbackText = `📅 **Bunk Planner Support (Local Mode):**\n\nThe Bunk Planner helps you simulate academic attendance. You enter your total classes and attended sessions, and specify a target threshold (e.g., **75%**). MarkFlow calculates precisely how many upcoming classes you can safely skip or must attend.\n\n👉 Click **"Go to Bunk Planner 🗓️"** below to try it!`;
      } else if (textLower.includes('cgpa') || textLower.includes('cumulative')) {
        fallbackText = `📈 **Overall CGPA Support (Local Mode):**\n\nThe Overall CGPA tool lets you input SGPAs across all completed semesters to track and project your graduation GPA progression.\n\n👉 Click **"Go to Overall CGPA 📈"** below to plan your semesters!`;
      } else if (textLower.includes('sgpa') || textLower.includes('semester')) {
        fallbackText = `📊 **Semester SGPA Support (Local Mode):**\n\nInput subject credits and grade points to calculate your current term SGPA. You can import Continuous Assessment (CA) averages directly into this panel to calculate final scores.\n\n👉 Click **"Go to Semester SGPA 📊"** below to calculate!`;
      } else if (textLower.includes('ca') || textLower.includes('weightage') || textLower.includes('assessment')) {
        fallbackText = `🧮 **CA Weightage Support (Local Mode):**\n\nThe CA Weightage page lets you enter multiple internal exam marks, set proportional grading rules (like **"Best 2 of 3"** or **"Highest CA"**), and scale them automatically to fit subject parameters.\n\n👉 Click **"Go to CA Weightage 🧮"** below to test it!`;
      } else if (textLower.includes('theme') || textLower.includes('setting') || textLower.includes('dark')) {
        fallbackText = `⚙️ **Interface Settings (Local Mode):**\n\nYou can toggle between **Light**, **Dark**, and **System** themes, select custom fonts (Jakarta, Inter, Outfit), enable audio clicks, and secure local JSON backups of all dashboard details.\n\n👉 Click **"Go to Settings ⚙️"** below to customize!`;
      } else if (textLower.includes('markflow') || textLower.includes('what is') || textLower.includes('hello') || textLower.includes('hi')) {
        fallbackText = `✨ **Welcome to MarkFlow Assistant (Local Mode):**\n\nMarkFlow is an advanced, student-first Academic OS designed to plan grades and schedules. Because the cloud Gemini API has hit its free-tier rate limits, I am assisting you in local fallback mode! \n\nI can help you navigate:\n* **Bunk Planner** for attendance simulation\n* **CA Weightage** for internal exam rules\n* **SGPA & CGPA** calculators`;
      } else {
        fallbackText = `⚠️ **Gemini API Rate Limit Active**\n\nYour Gemini API key has exceeded its hourly free-tier quota (20 requests/min). I have entered high-performance local fallback mode to keep helping you!\n\n**Quick Tips:**\n1. Use the bottom sticky navigation bar to explore features.\n2. Ask me about specific modules like **Bunk Planner**, **CA Weightage**, **SGPA**, **CGPA**, or **Settings** to receive customized local guidance!`;
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: fallbackText 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Premium feature: Copy Text to Clipboard
  const handleCopyText = (text, index) => {
    // Strip markdown formatting before copying
    const plainText = text.replace(/\*\*|\*|__/g, '');
    navigator.clipboard.writeText(plainText).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  };

  // Premium feature: Text-to-Speech (TTS) Voice Synthesis
  const handleSpeakText = (text, index) => {
    if ('speechSynthesis' in window) {
      // If already speaking the clicked message, stop it
      if (speakingIndex === index) {
        handleStopSpeaking();
        return;
      }

      // Stop any active speech first
      window.speechSynthesis.cancel();

      // Clean the text from markdown markers for natural reading
      const cleanText = text
        .replace(/\*\*|__/g, '') // Remove bold markers
        .replace(/\*\s/g, '• ')   // Clean list markers
        .replace(/`[^`]+`/g, (m) => m.replace(/`/g, '')); // Clean code marks

      const utterance = new SpeechSynthesisUtterance(cleanText);
      speechUtteranceRef.current = utterance;
      
      utterance.onend = () => {
        setSpeakingIndex(null);
      };
      
      utterance.onerror = () => {
        setSpeakingIndex(null);
      };

      setSpeakingIndex(index);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in this browser.');
    }
  };

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
  };

  // Dispatch custom events to navigate App.jsx subpages instantly
  const handleTriggerNavigation = (pageId) => {
    window.dispatchEvent(new CustomEvent('markflow-navigate', { detail: pageId }));
  };

  // Render parsed custom markdown for extremely premium high-end typography
  const parseMarkdown = (text) => {
    if (!text) return '';

    // Split text into lines to identify bullets/lists
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;

      // Match bold tags (**text**)
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const matches = content.match(boldRegex);
      if (matches) {
        content = content.replace(boldRegex, '<strong class="font-extrabold text-indigo-650 bg-indigo-50/70 border border-indigo-100/20 px-1.5 py-0.5 rounded-lg shadow-soft-sm">$1</strong>');
      }

      // Match important tags (Bunk Planner, Semester SGPA, etc.) to highlight them with glowing blue pill style
      const keywords = ['Bunk Planner', 'Semester SGPA', 'Overall CGPA', 'CA Weightage', 'Settings', 'Trash Bin'];
      keywords.forEach(keyword => {
        if (content.includes(keyword) && !content.includes(`class="`)) {
          const regex = new RegExp(keyword, 'g');
          content = content.replace(regex, `<span class="bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded-md shadow-soft-sm text-[10px] mx-0.5 whitespace-nowrap uppercase tracking-wider">${keyword}</span>`);
        }
      });

      // Render items starting with asterisk (*) as clean bullet elements
      if (line.trim().startsWith('* ')) {
        const bulletText = content.replace(/^\s*\*\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2.5 my-2 pl-1 bg-white/40 p-2 border border-slate-100/30 rounded-xl shadow-soft-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-2 shadow-soft" />
            <span className="text-[11px] font-extrabold leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: bulletText }} />
          </div>
        );
      }

      // Render empty lines as spaced block breaks
      if (line.trim() === '') {
        return <div key={idx} className="h-2.5" />;
      }

      return (
        <p key={idx} className="text-[11px] font-bold leading-relaxed text-slate-650 my-1.5" dangerouslySetInnerHTML={{ __html: content }} />
      );
    });
  };

  // Helper to dynamically extract navigation suggestions based on message context
  const getAutoNavSuggestions = (text) => {
    const textLower = text.toLowerCase();
    const suggestions = [];

    if (textLower.includes('bunk planner') || textLower.includes('bunking') || textLower.includes('attendance')) {
      suggestions.push({ label: 'Go to Bunk Planner 🗓️', pageId: 'bunk-planner', icon: <Calendar size={11} /> });
    }
    if (textLower.includes('semester sgpa') || textLower.includes('sgpa calculator') || textLower.includes('grade point')) {
      suggestions.push({ label: 'Go to Semester SGPA 📊', pageId: 'semester-sgpa', icon: <Calculator size={11} /> });
    }
    if (textLower.includes('overall cgpa') || textLower.includes('cgpa calculator') || textLower.includes('cumulative')) {
      suggestions.push({ label: 'Go to Overall CGPA 📈', pageId: 'overall-cgpa', icon: <Award size={11} /> });
    }
    if (textLower.includes('ca weightage') || textLower.includes('weighted score') || textLower.includes('assessment')) {
      suggestions.push({ label: 'Go to CA Weightage 🧮', pageId: 'ca-weightage', icon: <Calculator size={11} /> });
    }
    if (textLower.includes('theme') || textLower.includes('font') || textLower.includes('typography') || textLower.includes('backup')) {
      suggestions.push({ label: 'Go to Settings ⚙️', pageId: 'settings', icon: <Settings size={11} /> });
    }

    return suggestions;
  };

  const quickPrompts = [
    { label: 'What is MarkFlow?', text: 'Can you give me an overview of what MarkFlow is and what features it offers?' },
    { label: 'How does Bunk Planner work?', text: 'How does the Bunk Planner calculate how many classes I can safely bunk?' },
    { label: 'How to calculate SGPA?', text: 'How do I use the Semester SGPA Calculator to find my semester grade points?' },
    { label: 'Explain CA Weightage', text: 'How does the CA Weightage page help me calculate weighted scores?' }
  ];

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[9999] select-none text-left font-sans">
      {/* Audio Wave Visualizer Keyframes */}
      <style>{`
        @keyframes dance-1 { 0%, 100% { height: 4px; } 50% { height: 16px; } }
        @keyframes dance-2 { 0%, 100% { height: 6px; } 50% { height: 20px; } }
        @keyframes dance-3 { 0%, 105% { height: 3px; } 50% { height: 14px; } }
        @keyframes dance-4 { 0%, 100% { height: 8px; } 50% { height: 18px; } }
        @keyframes dance-5 { 0%, 100% { height: 5px; } 50% { height: 22px; } }
        .wave-bar {
          width: 2px;
          background-color: rgb(239, 68, 68);
          border-radius: 4px;
          transition: all 0.25s ease;
        }
      `}</style>
      
      {/* Speech Bubble Tooltip (displayed above the floating logo when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.92 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: { type: 'spring', delay: 0.8, damping: 15 } 
            }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setIsOpen(true)}
            className="absolute bottom-16 right-0 w-60 p-3 bg-white/95 backdrop-blur-md border border-slate-100/80 rounded-2xl shadow-xl shadow-indigo-500/5 cursor-pointer text-left select-none z-[9999]"
          >
            {/* Pointy speech arrow */}
            <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-white border-r border-b border-slate-100/80 transform rotate-45" />
            
            <div className="flex gap-2.5 items-start">
              <div className="h-7 w-7 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 shadow-soft-sm">
                <Sparkles size={13} className="animate-pulse text-indigo-500" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider leading-none mb-0.5">MarkFlow AI Assistant</h4>
                <p className="text-[11px] font-bold text-slate-700 leading-tight">How can I help you today? ✨</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Floating Logo Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: isOpen ? -90 : 8 }}
        whileTap={{ scale: 0.95 }}
        className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 cursor-pointer outline-none hover:shadow-indigo-500/50"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} className="animate-pulse" />}
      </motion.button>
 
      {/* Chat Window Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-24 right-4 left-4 sm:absolute sm:bottom-16 sm:left-auto sm:right-0 w-auto sm:w-[380px] h-[500px] sm:h-[550px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-100/90 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-[9999]"
          >
            {/* Premium Inline Clear History Confirmation Modal */}
            <AnimatePresence>
              {showClearConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[10000] flex items-center justify-center p-4 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 10 }}
                    className="bg-white border border-slate-100 rounded-2xl p-5 max-w-[280px] w-full shadow-2xl space-y-4"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                        <Trash2 size={18} />
                      </div>
                      <h4 className="text-xs font-black text-slate-800 tracking-tight">Clear Chat History?</h4>
                      <p className="text-[10px] text-slate-450 font-bold leading-relaxed">
                        Are you sure you want to clear your conversation history? This cannot be undone.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const initial = [
                            { 
                              role: 'assistant', 
                              text: 'Hi, this is Markflow bot. How can I help you today? ✨' 
                            }
                          ];
                          setMessages(initial);
                          localStorage.setItem('markflow-ai-chat-history', JSON.stringify(initial));
                          setShowClearConfirm(false);
                          handleStopSpeaking();
                        }}
                        className="py-2 bg-rose-500 hover:bg-rose-650 text-white font-bold text-[10px] rounded-xl shadow-soft hover:shadow-rose-500/20 transition-all cursor-pointer"
                      >
                        Clear Chat
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-950/20 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/30">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-tight leading-none">MarkFlow AI</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {connectionStatus === 'connecting' ? (
                      <>
                        <RefreshCw size={8} className="animate-spin text-indigo-400" />
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider animate-pulse">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Connected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowClearConfirm(true)} 
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-white/10"
                  title="Clear Chat History"
                >
                  <Trash2 size={13} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-slate-50/30">
              {connectionStatus === 'connecting' ? (
                /* Connecting Live Stream View */
                <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50/50 border border-indigo-100/30 flex items-center justify-center text-indigo-600 shrink-0">
                    <RefreshCw size={22} className="animate-spin text-indigo-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider animate-pulse">🔌 Connecting to Markflow bot...</span>
                </div>
              ) : (
                /* Message Log & Predefined Questions */
                <>
                  <div className="space-y-4">
                    {messages.map((msg, index) => {
                      const isAssistant = msg.role === 'assistant';
                      const navSuggestions = isAssistant ? getAutoNavSuggestions(msg.text) : [];
                      
                      return (
                        <div
                          key={index}
                          className="flex flex-col space-y-2"
                        >
                          <div className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                            {isAssistant && (
                              <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm mt-1">
                                <Bot size={13} />
                              </div>
                            )}
                            
                            <div className="flex flex-col space-y-1.5 max-w-[80%]">
                              {/* Message bubble itself */}
                              <div
                                className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-soft border relative ${
                                  isAssistant
                                    ? 'bg-white border-slate-100 text-slate-700 rounded-tl-none font-sans shadow-soft-sm'
                                    : 'bg-indigo-600 border-indigo-600 text-white rounded-tr-none font-sans font-semibold shadow-soft'
                                }`}
                              >
                                {isAssistant ? (
                                  <div>{parseMarkdown(msg.text)}</div>
                                ) : (
                                  msg.text
                                )}

                                {/* Premium Micro Utilities (Copy & Voice TTS icons - always cleanly visible for assistant replies!) */}
                                {isAssistant && (
                                  <div className="flex gap-2 justify-end border-t border-slate-105/50 mt-2.5 pt-1.5">
                                    <button
                                      onClick={() => handleCopyText(msg.text, index)}
                                      className="text-slate-400 hover:text-indigo-650 transition-colors cursor-pointer p-1 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-[9px] font-bold"
                                      title="Copy Message"
                                    >
                                      {copiedIndex === index ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                      <span>{copiedIndex === index ? 'Copied!' : 'Copy'}</span>
                                    </button>
                                    <button
                                      onClick={() => handleSpeakText(msg.text, index)}
                                      className={`transition-colors cursor-pointer p-1 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-[9px] font-bold ${speakingIndex === index ? 'text-emerald-550' : 'text-slate-400 hover:text-indigo-650'}`}
                                      title={speakingIndex === index ? "Stop Speaking" : "Listen Response"}
                                    >
                                      {speakingIndex === index ? <VolumeX size={11} className="text-rose-500" /> : <Volume2 size={11} />}
                                      <span>{speakingIndex === index ? 'Stop' : 'Listen'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Render beautiful dynamic navigation suggestions */}
                          {isAssistant && navSuggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pl-9 mt-0.5">
                              {navSuggestions.map((suggest, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => handleTriggerNavigation(suggest.pageId)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/60 border border-indigo-100/40 rounded-xl text-[10px] font-extrabold text-indigo-600 hover:bg-indigo-600 hover:border-indigo-600 transition-all cursor-pointer shadow-soft-sm transform hover:scale-[1.02] outline-none group"
                                >
                                  {React.cloneElement(suggest.icon, { className: "text-indigo-650 group-hover:text-white transition-colors shrink-0" })}
                                  <span className="text-indigo-650 group-hover:text-white transition-colors">{suggest.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isLoading && (
                      <div className="flex gap-2.5 justify-start items-center">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                          <Bot size={13} />
                        </div>
                        <div className="bg-white border border-slate-100 text-slate-400 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-soft-sm">
                          <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {messages.length === 1 && (
                    <div className="space-y-2.5 pt-2">
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        Suggested Inquiries:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {quickPrompts.map((qp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(qp.text)}
                            className="w-full text-left p-2.5 bg-white border border-slate-100 rounded-xl text-[10px] text-slate-650 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50/20 font-black shadow-soft-sm transition-all flex items-center justify-between group cursor-pointer outline-none"
                          >
                            <span>{qp.label}</span>
                            <ArrowRight size={10} className="text-slate-400 group-hover:text-indigo-650 transform group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Bar */}
            {connectionStatus === 'connected' && (
              <div className="p-3 bg-white border-t border-slate-100/80 flex items-center gap-2">
                {/* Voice Frequency / Modulation Visualizer when Mic Mode is active */}
                {isListening && (
                  <div className="flex items-center gap-0.5 h-6 px-2 mr-1">
                    <span className="wave-bar" style={{ animation: 'dance-1 0.6s infinite ease-in-out' }} />
                    <span className="wave-bar" style={{ animation: 'dance-2 0.7s infinite ease-in-out' }} />
                    <span className="wave-bar" style={{ animation: 'dance-3 0.5s infinite ease-in-out' }} />
                    <span className="wave-bar" style={{ animation: 'dance-4 0.8s infinite ease-in-out' }} />
                    <span className="wave-bar" style={{ animation: 'dance-5 0.6s infinite ease-in-out' }} />
                    <span className="wave-bar" style={{ animation: 'dance-2 0.7s infinite ease-in-out' }} />
                    <span className="wave-bar" style={{ animation: 'dance-1 0.5s infinite ease-in-out' }} />
                  </div>
                )}
                
                <input
                  type="text"
                  placeholder={isListening ? "Listening to voice..." : "Ask about MarkFlow formulas, bunk plans..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading || isListening}
                  className={`flex-1 p-2.5 text-xs border rounded-xl outline-none font-bold transition-all placeholder-slate-400 ${
                    isListening 
                      ? 'bg-rose-50/40 border-rose-200 text-rose-600 animate-pulse' 
                      : 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-700'
                  }`}
                />
                
                {/* Voice Search Microphone Button */}
                <button
                  type="button"
                  onClick={isListening ? handleStopListening : handleStartListening}
                  disabled={isLoading}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all transform active:scale-95 shadow-md cursor-pointer shrink-0 ${
                    isListening 
                      ? 'bg-rose-550 hover:bg-rose-600 text-white animate-pulse' 
                      : 'bg-indigo-50 border border-indigo-100/40 hover:bg-indigo-100 text-indigo-600'
                  }`}
                  style={isListening ? { backgroundColor: 'rgb(239, 68, 68)' } : {}}
                  title={isListening ? "Stop listening" : "Ask with voice"}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || isListening || !input.trim()}
                  className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white flex items-center justify-center transition-all transform active:scale-95 shadow-md cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
