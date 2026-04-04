"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ArrowLeft, Network, Target, Play, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useLabProgress } from "@/lib/progress";
import { TOY_PROBLEMS, ToyProblemId, ToyProblem } from "@/lib/problem-formulator";
import { NodeGraphViz } from "@/components/search/NodeGraphViz";

export default function ProblemFormulatorPage() {
  const { progress, markProblemComplete } = useLabProgress();
  const [selectedId, setSelectedId] = useState<ToyProblemId>("tictactoe");
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const problem: ToyProblem = TOY_PROBLEMS[selectedId];
  const isCompleted = progress.modules.problem === 1;

  // Render dummy graph via layout logic when "Visualize Space" is clicked
  const handleVisualize = () => {
    const space = problem.generateSpace();
    // Assign generic static spiral/tree positions so Cytoscape preset layout reads them
    const layoutNodes = space.nodes.map((n, i) => {
      // Very basic static layout arrangement for the toy examples
      const level = n.id === "root" || n.id === "s0" || n.id === "A" ? 0 : n.id.length > 2 ? 2 : 1;
      const x = 200 + (Math.cos(i) * 50 * level);
      const y = 50 + (level * 80) + (i * 20);
      return { ...n, x, y };
    });
    setNodes(layoutNodes);
    setEdges(space.edges);
    setShowGraph(true);
    setTestResult(null);
  };

  const handleTestGoal = () => {
    setTestResult("Simulating agent transitions... Goal condition satisfied in 14 steps!");
  };

  const handleComplete = () => {
    markProblemComplete(250);
  };

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 md:p-12">
      <Link href="/dashboard" className="px-4 py-2 hover:bg-white/5 text-[#adaaaa] hover:text-white font-bold rounded-lg transition-all flex items-center gap-2 mb-8 w-fit">
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto w-full">
        {/* Left Panel: Formulator Controls */}
        <div className="flex-1 space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-8 rounded-2xl bg-[#131313] border border-white/5 shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#39FF14]/10 rounded-xl rounded-tl-sm border border-[#39FF14]/30">
                  <Brain className="text-[#39FF14]" size={28} />
                </div>
                <div>
                  <h1 className="font-['Space_Grotesk'] text-3xl font-bold text-white">Problem Formulator</h1>
                  <p className="text-[#adaaaa] text-sm">State-Space abstraction</p>
                </div>
              </div>
              {isCompleted && (
                 <div className="px-3 py-1 bg-[#8eff71]/20 border border-[#8eff71]/40 text-[#8eff71] text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-2">
                   <CheckCircle size={14} /> Completed
                 </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-widest">Select Domain Toy Problem</label>
              <select
                className="w-full bg-[#1a1a1a] text-white p-4 rounded-xl border border-white/10 outline-none focus:border-[#39FF14]/50 cursor-pointer appearance-none uppercase text-sm font-bold tracking-wider"
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value as ToyProblemId);
                  setShowGraph(false);
                  setTestResult(null);
                }}
              >
                {Object.values(TOY_PROBLEMS).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mt-8 space-y-4">
              <h3 className="text-xs font-bold text-[#adaaaa] uppercase tracking-widest border-b border-white/10 pb-2">Mathematical Formulation</h3>
              
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                <span className="text-[#39FF14] text-xs font-bold uppercase tracking-widest">S0: Initial State</span>
                <pre className="font-mono text-sm text-white mt-2 bg-black/50 p-2 rounded max-h-32 overflow-auto">
                  {JSON.stringify(problem.initialState, null, 2)}
                </pre>
              </div>

              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                <span className="text-[#00e3fd] text-xs font-bold uppercase tracking-widest">A(s): Actions</span>
                <p className="text-sm text-[#adaaaa] mt-1">{problem.actionsDesc}</p>
              </div>

              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                <span className="text-[#d873ff] text-xs font-bold uppercase tracking-widest">T(s, a): Transition Model</span>
                <p className="text-sm text-[#adaaaa] mt-1">{problem.transitionDesc}</p>
              </div>

              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 relative overflow-hidden">
                <span className="text-[#ffcc00] text-xs font-bold uppercase tracking-widest flex justify-between">
                  Goal Test G(s)
                </span>
                <p className="text-sm text-white mt-1 border-l-2 border-[#ffcc00] pl-3 py-1 font-mono">
                  {problem.goalDesc}
                </p>
                <Target className="absolute -bottom-4 -right-4 text-[#ffcc00]/10 w-24 h-24 pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Panel: Visualization & Controls */}
        <div className="flex-1 flex flex-col gap-6">
          <motion.div
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.1 }}
             className="bg-[#131313] p-6 rounded-2xl border border-white/5 flex flex-col gap-4"
          >
            <div className="flex gap-4">
              <button 
                onClick={handleVisualize}
                className="flex-1 py-4 bg-[#262626] hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Network size={16} className="text-[#00e3fd]" />
                Visualize BFS Tree
              </button>
              <button 
                onClick={handleTestGoal}
                className="flex-1 py-4 bg-[#262626] hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Play size={16} className="text-[#d873ff]" />
                Test Goal
              </button>
            </div>
            
            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#8eff71]/10 border border-[#8eff71]/30 p-3 rounded-lg text-[#8eff71] text-xs font-mono"
                >
                  {testResult}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {showGraph ? (
                <motion.div
                   key="graph"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="mt-4"
                >
                  <NodeGraphViz
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={() => {}}
                    onEdgesChange={() => {}}
                    startNode={nodes[0]?.id || ""}
                    goalNode={""}
                    onSetStart={() => {}}
                    onSetGoal={() => {}}
                    activeTool="select"
                    stampWeight={1}
                    isPlaying={false}
                    title={`${problem.name} Prefix BFS Space`}
                  />
                </motion.div>
              ) : (
                <motion.div 
                   key="placeholder"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="h-[320px] sm:h-[400px] border border-white/5 border-dashed rounded-xl flex items-center justify-center text-[#adaaaa] font-mono text-sm"
                >
                  {`< Awaiting Visualization >`}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
               onClick={handleComplete}
               disabled={isCompleted}
               className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-colors ${
                 isCompleted 
                 ? "bg-[#8eff71]/10 text-[#8eff71] border border-[#8eff71]/30 cursor-not-allowed" 
                 : "bg-[#39FF14] text-[#0d6100] hover:bg-[#8eff71] neon-glow-primary font-bold shadow-[0_0_20px_rgba(57,255,20,0.3)]"
               }`}
            >
               <CheckCircle size={20} />
               {isCompleted ? "MODULE COMPLETE (250 XP AWARDED)" : "MARK AS COMPLETE & EARN XP"}
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
