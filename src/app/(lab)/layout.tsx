"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Search,
  GitBranch,
  LayoutGrid,
  Bot,
  HelpCircle,
  Bell,
  Settings,
  LifeBuoy,
  X,
  Send,
  FlaskConical,
  Globe,
  Cpu,
  Puzzle,
  UserCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLabProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";

/* ── Navigation data ── */
type NavItem = { label: string; icon: any; href: string; active?: boolean };
const NAV_ITEMS: NavItem[] = [
  { label: "Problem Formulator", icon: Brain, href: "#", active: true },
  { label: "Search Playground", icon: Search, href: "#" },
  { label: "Game Tree Studio", icon: GitBranch, href: "#" },
  { label: "CSP Board", icon: LayoutGrid, href: "#" },
  { label: "Agent Designer", icon: Bot, href: "#" },
  { label: "Adaptive Quiz", icon: HelpCircle, href: "#" },
];

const MOBILE_NAV = [
  { label: "Lab", icon: FlaskConical, href: "/dashboard" },
  { label: "Search", icon: Globe, href: "#" },
  { label: "Agents", icon: Cpu, href: "#" },
  { label: "Quiz", icon: Puzzle, href: "#" },
] as const;

/* ── Mastery Ring SVG ── */
function MasteryRing({ percentage }: { percentage: number }) {
  const dashoffset = 125.6 - (125.6 * percentage) / 100;
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
        <circle
          className="text-[#262626]"
          cx="24"
          cy="24"
          r="20"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="4"
        />
        <motion.circle
          className="text-[#8eff71] drop-shadow-[0_0_5px_#2ff801]"
          cx="24"
          cy="24"
          r="20"
          fill="transparent"
          stroke="currentColor"
          strokeDasharray="125.6"
          initial={{ strokeDashoffset: 125.6 }}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
        {Math.round(percentage)}%
      </div>
    </div>
  );
}

/* ── AI Tutor Chat Panel ── */
function AiTutorChat({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-80 glass-panel border border-[#9900ce]/30 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(153,0,206,0.15)] mb-2 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-[#9900ce]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d873ff] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#d873ff]">
                  AI Tutor Online
                </span>
              </div>
              <button
                onClick={onToggle}
                className="text-[#adaaaa] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-4 max-h-60 overflow-y-auto scrollbar-hide">
              <div className="flex flex-col gap-2">
                <div className="bg-[#131313] p-3 rounded-xl rounded-tr-none self-end text-sm max-w-[85%] border border-white/5">
                  How do I optimize the Search Playground?
                </div>
                <div className="bg-[#9900ce]/10 p-3 rounded-xl rounded-tl-none self-start text-sm max-w-[85%] border border-[#9900ce]/20 neon-glow-secondary">
                  <span className="font-bold text-[#d873ff] block mb-1">
                    Hint:
                  </span>
                  Try applying the A* heuristic with Manhattan distance for
                  better convergence in Module 02.
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 bg-black">
              <div className="relative">
                <input
                  className="w-full bg-[#131313] border-none rounded-lg py-2 pl-3 pr-10 text-xs focus:ring-1 focus:ring-[#9900ce] focus:bg-[#20201f] transition-all outline-none"
                  placeholder="Ask for a hint..."
                  type="text"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#d873ff] hover:text-[#ebadff] transition-colors">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle FAB */}
      <button
        onClick={onToggle}
        className="w-14 h-14 rounded-full bg-[#9900ce] text-white flex items-center justify-center shadow-[0_0_20px_rgba(153,0,206,0.5)] transition-transform hover:scale-110 active:scale-90"
      >
        <Bot size={24} />
      </button>
    </div>
  );
}

/* ── Lab Layout ── */
export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const { progress, completedCount, completionPercentage, isLoaded } = useLabProgress();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("sidebar-open");
    if (stored !== null) {
      setIsDesktopSidebarOpen(stored === "true");
    }
  }, []);

  const toggleDesktopSidebar = () => {
    const newState = !isDesktopSidebarOpen;
    setIsDesktopSidebarOpen(newState);
    localStorage.setItem("sidebar-open", String(newState));
  };

  return (
    <div className="relative min-h-screen bg-[#0e0e0e] text-white font-[family-name:var(--font-body)] selection:bg-[#8eff71] selection:text-[#0d6100]">
      {/* ── Top Header ── */}
      <header className="fixed top-0 w-full z-50 bg-[#0e0e0e]/60 backdrop-blur-md border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-[#adaaaa] hover:text-[#8eff71] transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>

          <Link href="/dashboard" className="text-2xl font-black text-[#39FF14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)] hover:drop-shadow-[0_0_15px_rgba(57,255,20,0.9)] hover:text-[#8eff71] transition-all font-[family-name:var(--font-headline)] tracking-tight">
            AI Lab
          </Link>

          {/* Progress chip */}
          <div className="hidden md:flex items-center gap-4 bg-[#131313] px-4 py-1.5 rounded-full border border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]">
              Progress
            </span>
            <div className="w-48 h-2 bg-[#262626] rounded-full overflow-hidden">
              <div 
                 className="h-full bg-[#2ff801] shadow-[0_0_10px_#2ff801] transition-all duration-1000"
                 style={{ width: `${isLoaded ? completionPercentage : 0}%` }}
              />
            </div>
            <span className="text-xs font-mono text-[#8eff71]">
              {completedCount}/5 modules
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-[#adaaaa] hover:text-[#8eff71] transition-colors">
            <Bell size={20} />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none">
                 {isLoading ? "Connecting..." : user ? `Neural_User_${user.uid.slice(0, 4)}` : "Guest"}
              </p>
              <p className="text-[10px] text-[#8eff71]">
                 {user ? "Cloud Synced" : "Local Mode"}
              </p>
            </div>
            <button className="relative w-10 h-10 rounded-full bg-[#262626] border border-[#8eff71]/30 flex items-center justify-center transition-transform active:scale-90 overflow-hidden">
              {user && <div className="absolute inset-0 bg-[#39FF14]/20 animate-pulse" />}
              <UserCircle size={22} className="text-[#8eff71] relative z-10" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Sidebar (Desktop) ── */}
      <motion.aside
        initial={false}
        animate={{ width: isDesktopSidebarOpen ? 280 : 72 }}
        className="fixed left-0 top-0 h-full z-40 bg-[#1a1a1a] shadow-[10px_0_30px_rgba(0,0,0,0.5)] hidden md:flex flex-col pt-20 pb-6 border-r border-white/5 whitespace-nowrap overflow-hidden"
      >
        <div className="mb-6 px-4 flex items-center justify-between h-8">
          <AnimatePresence>
            {isDesktopSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: 'auto' }} 
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h2 className="font-[family-name:var(--font-headline)] text-sm uppercase tracking-wider text-[#39FF14] font-bold">
                  Explorer
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={toggleDesktopSidebar}
            className={`flex items-center justify-center w-8 h-8 rounded-lg text-[#adaaaa] hover:text-[#39FF14] hover:bg-[#39FF14]/10 hover:shadow-[0_0_15px_rgba(57,255,20,0.2)] transition-all ${!isDesktopSidebarOpen ? 'mx-auto' : ''}`}
          >
            <motion.div animate={{ rotate: isDesktopSidebarOpen ? 0 : 180 }}>
              <ChevronLeft size={20} />
            </motion.div>
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                title={!isDesktopSidebarOpen ? item.label : undefined}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
                  item.active
                    ? "bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14] font-bold"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(57,255,20,0.1)]"
                } ${isDesktopSidebarOpen ? "gap-4" : "justify-center"}`}
              >
                <div className={`${item.active ? "drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" : ""}`}>
                  <Icon size={22} className={!isDesktopSidebarOpen && item.active ? "scale-110" : "group-hover:scale-110 transition-transform"} />
                </div>
                <AnimatePresence>
                  {isDesktopSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-[family-name:var(--font-headline)] text-sm uppercase tracking-wider overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <AnimatePresence>
          {isDesktopSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-auto space-y-4 pt-4 border-t border-white/5 px-3 overflow-hidden"
            >
              <div className="flex items-center gap-4 px-2">
                <MasteryRing percentage={isLoaded ? completionPercentage : 0} />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white whitespace-nowrap">
                    {completedCount}/5 Modules ({Math.round(completionPercentage)}%)
                  </p>
                  <p className="text-[10px] text-[#8eff71] uppercase tracking-widest mt-1">
                    XP: {progress.xp} pts
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Link
                  href="#"
                  className="flex items-center gap-3 p-2 rounded-lg text-gray-500 hover:text-gray-300 transition-all text-xs uppercase tracking-widest"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 p-2 rounded-lg text-gray-500 hover:text-gray-300 transition-all text-xs uppercase tracking-widest"
                >
                  <LifeBuoy size={16} />
                  <span>Support</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-[280px] z-50 bg-[#1a1a1a] shadow-[10px_0_30px_rgba(0,0,0,0.5)] flex flex-col pt-20 pb-6 px-4 space-y-2 md:hidden"
            >
              <div className="mb-6 px-2">
                <h2 className="font-[family-name:var(--font-headline)] text-sm uppercase tracking-wider text-[#39FF14] font-bold">
                  AI Lab Explorer
                </h2>
                <p className="text-[10px] text-[#adaaaa] mt-1">
                  Level 14 – 2400 XP
                </p>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        item.active
                          ? "bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14] font-bold translate-x-1"
                          : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-[family-name:var(--font-headline)] text-sm uppercase tracking-wider">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main 
        className="pt-24 pb-20 px-6 md:px-10 min-h-screen transition-all duration-300"
        style={{ marginLeft: isMounted && typeof window !== 'undefined' && window.innerWidth >= 768 ? (isDesktopSidebarOpen ? 280 : 72) : 0 }}
      >
        {children}
      </main>

      {/* ── AI Tutor Chat ── */}
      <AiTutorChat open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed bottom-0 w-full md:hidden z-50 rounded-t-2xl bg-[#0e0e0e]/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] flex justify-around items-center h-16 px-4">
        {MOBILE_NAV.map((item, i) => {
          const Icon = item.icon;
          const isActive = i === 0;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${
                isActive
                  ? "text-[#39FF14] scale-110"
                  : "text-gray-500 active:bg-white/5"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
