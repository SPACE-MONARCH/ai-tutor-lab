"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";

export default function ProblemFormulatorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="bg-[#1a1a1a] p-12 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(57,255,20,0.05)] relative overflow-hidden max-w-2xl w-full"
      >
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(57,255,20,0.02)_25%,transparent_25%,transparent_50%,rgba(57,255,20,0.02)_50%,rgba(57,255,20,0.02)_75%,transparent_75%,transparent)] bg-[length:20px_20px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-24 h-24 mb-6">
                <Brain className="w-full h-full text-[#39FF14] opacity-20" />
                <Construction className="w-12 h-12 text-[#ffcc00] absolute bottom-0 right-0 animate-bounce shadow-black drop-shadow" />
            </div>

            <h1 className="font-['Space_Grotesk'] text-4xl font-bold text-white mb-4">
                Problem <span className="text-[#39FF14] neon-text-primary">Formulator</span>
            </h1>
            
            <p className="text-[#adaaaa] text-lg mb-8 max-w-md">
                This module is currently undergoing structural upgrades in the neural forge. Check back in a future update!
            </p>

            <Link href="/dashboard" className="px-6 py-3 bg-[#262626] border border-white/10 hover:border-[#39FF14]/50 hover:bg-white/5 text-white font-bold rounded-lg transition-all flex items-center gap-2 group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Return to Dashboard
            </Link>
        </div>
      </motion.div>
    </div>
  );
}
