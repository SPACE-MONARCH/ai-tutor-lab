"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ArrowLeft, Network, Target, CheckCircle, RotateCcw, AlertTriangle, Route } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useLabProgress } from "@/lib/progress";
import { TOY_PROBLEMS, ToyProblemId, ToyProblem } from "@/lib/problem-formulator";
import { NodeGraphViz } from "@/components/search/NodeGraphViz";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ── Interactive Games ── */

function PlayableTicTacToe({ onStateChange, onWin }: { onStateChange: (state: string[][]) => void; onWin: () => void }) {
  const [board, setBoard] = useState([
    [" ", " ", " "],
    [" ", " ", " "],
    [" ", " ", " "],
  ]);
  const [winner, setWinner] = useState<string | null>(null);

  const checkWinner = (b: string[][]) => {
    const lines = [
      [b[0][0], b[0][1], b[0][2]], [b[1][0], b[1][1], b[1][2]], [b[2][0], b[2][1], b[2][2]],
      [b[0][0], b[1][0], b[2][0]], [b[0][1], b[1][1], b[2][1]], [b[0][2], b[1][2], b[2][2]],
      [b[0][0], b[1][1], b[2][2]], [b[0][2], b[1][1], b[2][0]]
    ];
    for (let l of lines) {
      if (l[0] !== " " && l[0] === l[1] && l[1] === l[2]) return l[0];
    }
    if (b.flat().every(c => c !== " ")) return "Draw";
    return null;
  };

  const handleMove = (r: number, c: number) => {
    if (board[r][c] !== " " || winner) return;
    const newBoard = board.map((row, i) =>
      row.map((cell, j) => (i === r && j === c ? "X" : cell))
    );
    setBoard(newBoard);
    onStateChange(newBoard);

    let w = checkWinner(newBoard);
    if (w) { setWinner(w); if (w === "X") onWin(); return; }

    // Random AI move
    setTimeout(() => {
      let empty = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (newBoard[i][j] === " ") empty.push({ r: i, c: j });
        }
      }
      if (empty.length > 0) {
        let ai = empty[Math.floor(Math.random() * empty.length)];
        const aiBoard = newBoard.map((row, i) =>
          row.map((cell, j) => (i === ai.r && j === ai.c ? "O" : cell))
        );
        setBoard(aiBoard);
        onStateChange(aiBoard);
        let aiW = checkWinner(aiBoard);
        if (aiW) setWinner(aiW);
      }
    }, 500);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-[#1a1a1a] rounded-xl border border-white/10 relative">
      <div className="grid grid-cols-3 gap-2 mb-4 w-[250px] aspect-square">
        {board.map((row, i) =>
          row.map((cell, j) => (
            <button
              key={`${i}-${j}`}
              onClick={() => handleMove(i, j)}
              className="bg-[#262626] rounded-xl text-3xl font-bold flex items-center justify-center border border-white/5 hover:border-[#39FF14]/50 transition-colors"
            >
              <span className={cell === "X" ? "text-[#39FF14]" : cell === "O" ? "text-[#ff3366]" : ""}>{cell}</span>
            </button>
          ))
        )}
      </div>
      {winner && (
        <div className="text-[#39FF14] font-bold text-lg mb-2">
          {winner === "Draw" ? "It's a Draw!" : `${winner} Wins!`}
        </div>
      )}
      <button onClick={() => { setBoard([[" "," "," "],[" "," "," "],[" "," "," "]]); setWinner(null); onStateChange([[" "," "," "],[" "," "," "],[" "," "," "]]); }} className="px-4 py-2 bg-[#262626] rounded-lg text-xs font-bold uppercase hover:bg-white/10 text-white flex gap-2">
        <RotateCcw size={14} /> Reset
      </button>
    </div>
  );
}

type MState = { left: { m: number, c: number, boat: number }, right: { m: number, c: number, boat: number } };
const MS_START: MState = { left: { m: 3, c: 3, boat: 1 }, right: { m: 0, c: 0, boat: 0 } };

function PlayableMissionaries({ onStateChange, onWin }: { onStateChange: (s: MState) => void; onWin: () => void }) {
  const [s, setS] = useState<MState>(MS_START);
  const [error, setError] = useState<string | null>(null);

  const move = (m: number, c: number) => {
    setError(null);
    const active = s.left.boat === 1 ? s.left : s.right;
    if (active.m < m || active.c < c) return; // Not enough people

    const nL = { m: s.left.m + (s.left.boat === 1 ? -m : m), c: s.left.c + (s.left.boat === 1 ? -c : c), boat: s.left.boat === 1 ? 0 : 1 };
    const nR = { m: s.right.m + (s.right.boat === 1 ? -m : m), c: s.right.c + (s.right.boat === 1 ? -c : c), boat: s.right.boat === 1 ? 0 : 1 };

    if ((nL.m > 0 && nL.c > nL.m) || (nR.m > 0 && nR.c > nR.m)) {
      setError("Constraint Violated: Cannibals ate the Missionaries!");
      return; // Invalid state
    }

    const nState = { left: nL, right: nR };
    setS(nState);
    onStateChange(nState);

    if (nR.m === 3 && nR.c === 3) onWin();
  };

  return (
    <div className="flex flex-col items-center p-6 bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-[#ff3366] text-white text-xs font-bold p-2 flex items-center justify-center gap-2">
           <AlertTriangle size={14} /> {error}
        </div>
      )}
      <div className="flex gap-4 w-full h-[150px] relative mt-6">
        <div className="flex-1 bg-green-900/30 border-r-4 border-green-700/50 flex flex-wrap gap-2 p-4 justify-center content-start">
           {Array.from({ length: s.left.m }).map((_, i) => <div key={`lm-${i}`} className="w-6 h-6 bg-[#00e3fd] rounded-full flex items-center justify-center text-[10px] font-bold">M</div>)}
           {Array.from({ length: s.left.c }).map((_, i) => <div key={`lc-${i}`} className="w-6 h-6 bg-[#ff3366] rounded-full flex items-center justify-center text-[10px] font-bold">C</div>)}
           {s.left.boat === 1 && <div className="w-16 h-8 bg-[#ffcc00] rounded-b-xl self-end mt-auto text-black flex justify-center text-[10px] font-bold">BOAT</div>}
        </div>
        <div className="w-12 bg-blue-900/40 relative"></div>
        <div className="flex-1 bg-green-900/30 border-l-4 border-green-700/50 flex flex-wrap gap-2 p-4 justify-center content-start">
           {s.right.boat === 1 && <div className="w-16 h-8 bg-[#ffcc00] rounded-b-xl self-end mt-auto text-black flex justify-center text-[10px] font-bold">BOAT</div>}
           {Array.from({ length: s.right.m }).map((_, i) => <div key={`rm-${i}`} className="w-6 h-6 bg-[#00e3fd] rounded-full flex items-center justify-center text-[10px] font-bold">M</div>)}
           {Array.from({ length: s.right.c }).map((_, i) => <div key={`rc-${i}`} className="w-6 h-6 bg-[#ff3366] rounded-full flex items-center justify-center text-[10px] font-bold">C</div>)}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <button onClick={() => move(1, 0)} className="px-3 py-1 bg-white/10 rounded text-xs">1M</button>
        <button onClick={() => move(2, 0)} className="px-3 py-1 bg-white/10 rounded text-xs">2M</button>
        <button onClick={() => move(0, 1)} className="px-3 py-1 bg-white/10 rounded text-xs">1C</button>
        <button onClick={() => move(0, 2)} className="px-3 py-1 bg-white/10 rounded text-xs">2C</button>
        <button onClick={() => move(1, 1)} className="px-3 py-1 bg-white/10 rounded text-xs">1M 1C</button>
      </div>
      <button onClick={() => { setS(MS_START); setError(null); onStateChange(MS_START); }} className="mt-4 px-4 py-2 bg-[#262626] rounded-lg text-xs font-bold uppercase hover:bg-white/10 flex gap-2"><RotateCcw size={14}/> Reset</button>
    </div>
  );
}

type TState = { currentCity: string, visited: string[] };

function PlayableTSP({ onStateChange, onWin }: { onStateChange: (s: TState) => void; onWin: () => void }) {
  const CITIES = ["A", "B", "C", "D", "E", "F"];
  const [s, setS] = useState<TState>({ currentCity: "A", visited: ["A"] });
  const [dist, setDist] = useState(0);

  const go = (c: string) => {
    if (s.visited.includes(c) && !(s.visited.length === 6 && c === "A")) return;
    
    if (s.visited.length === 6 && c === "A") {
      setDist(d => d + 10);
      setS({ currentCity: "A", visited: [...s.visited, "A_DONE"] });
      onWin();
      return;
    }
    // Random fake distance mapping
    let d = Math.abs(c.charCodeAt(0) - s.currentCity.charCodeAt(0)) * 5 + 10;
    setDist(dist + d);
    const nState = { currentCity: c, visited: [...s.visited, c] };
    setS(nState);
    onStateChange(nState);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-[#1a1a1a] rounded-xl border border-white/10">
      <div className="flex items-center gap-2 font-mono text-[#39FF14] mb-4">
        <Route size={18} /> Total Cost: {dist}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {CITIES.map(c => {
           const isCurrent = s.currentCity === c;
           const isVisited = s.visited.includes(c) && c !== "A";
           const isEndEligible = s.visited.length === 6 && c === "A";
           
           return (
             <button
               key={c}
               onClick={() => go(c)}
               disabled={isVisited && !isEndEligible}
               className={`w-16 h-16 rounded-full font-bold flex items-center justify-center transition-all ${
                 isCurrent ? "bg-[#39FF14] text-black shadow-[0_0_15px_#39FF14] animate-pulse" :
                 isVisited ? "bg-[#262626] text-white/30 border border-white/5" :
                 isEndEligible ? "bg-[#ffcc00] text-black shadow-[0_0_15px_#ffcc00]" :
                 "bg-[#131313] text-white border border-white/20 hover:border-white/80"
               }`}
             >
               {c}
             </button>
           );
        })}
      </div>
      <button onClick={() => { setS({ currentCity: "A", visited: ["A"] }); setDist(0); onStateChange({ currentCity: "A", visited: ["A"] }); }} className="px-4 py-2 bg-[#262626] rounded-lg text-xs font-bold uppercase hover:bg-white/10 flex gap-2"><RotateCcw size={14}/> Reset</button>
    </div>
  );
}

/* ── Main Page ── */

export default function ProblemFormulatorPage() {
  const { progress, markProblemComplete } = useLabProgress();
  const [selectedId, setSelectedId] = useState<ToyProblemId>("tictactoe");
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  
  // Track Live Game State hooks
  const [liveState, setLiveState] = useState<any>(null);

  const problem: ToyProblem = TOY_PROBLEMS[selectedId];
  const isCompleted = progress?.modules?.problem === 1;

  useEffect(() => {
    setShowGraph(false);
    setLiveState(problem.initialState);
  }, [selectedId, problem.initialState]);

  const handleVisualize = () => {
    // Generate state explosion starting right from the live state position!
    const space = problem.generateSpace(liveState);

    const layoutNodes = space.nodes.map((n, i) => {
      const level = n.id === "root" || n.id === "s0" || n.id === "A" ? 0 : n.id.length > 2 ? 2 : 1;
      const x = 200 + (Math.cos(i) * 50 * level);
      const y = 80 + (level * 80) + (i % 2 === 0 ? 30 : -30); // Jitter
      return { ...n, x, y };
    });
    setNodes(layoutNodes);
    setEdges(space.edges);
    setShowGraph(true);
  };

  const handleWin = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#39FF14', '#00e3fd', '#d873ff']
    });
  };

  const handleComplete = () => {
    markProblemComplete(300);
  };

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 md:p-12">
      <Link href="/dashboard" className="px-4 py-2 hover:bg-white/5 text-[#adaaaa] hover:text-white font-bold rounded-lg transition-all flex items-center gap-2 mb-8 w-fit">
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto w-full">
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

            <Tabs defaultValue="tictactoe" onValueChange={(v) => setSelectedId(v as ToyProblemId)}>
              <TabsList className="bg-[#1a1a1a] border border-white/10 w-full rounded-xl">
                <TabsTrigger value="tictactoe" className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-black text-xs font-bold tracking-widest uppercase flex-1">Tic-Tac-Toe</TabsTrigger>
                <TabsTrigger value="missionaries" className="data-[state=active]:bg-[#00e3fd] data-[state=active]:text-black text-xs font-bold tracking-widest uppercase flex-1">Missionaries</TabsTrigger>
                <TabsTrigger value="tsp" className="data-[state=active]:bg-[#d873ff] data-[state=active]:text-black text-xs font-bold tracking-widest uppercase flex-1">TSP</TabsTrigger>
              </TabsList>

              <div className="mt-8 mb-8">
                <TabsContent value="tictactoe">
                  <PlayableTicTacToe onStateChange={setLiveState} onWin={handleWin} />
                </TabsContent>
                <TabsContent value="missionaries">
                  <PlayableMissionaries onStateChange={setLiveState} onWin={handleWin} />
                </TabsContent>
                <TabsContent value="tsp">
                  <PlayableTSP onStateChange={setLiveState} onWin={handleWin} />
                </TabsContent>
              </div>
            </Tabs>
            
            <div className="mt-8 space-y-4">
              <h3 className="text-xs font-bold text-[#adaaaa] uppercase tracking-widest border-b border-white/10 pb-2">Mathematical Formulation</h3>
              
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                <span className="text-[#39FF14] text-xs font-bold uppercase tracking-widest">S0: Current State Slice</span>
                <pre className="font-mono text-sm text-white mt-2 bg-black/50 p-2 rounded max-h-32 overflow-auto">
                  {JSON.stringify(liveState || problem.initialState, null, 2)}
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
             <button 
                onClick={handleVisualize}
                className="w-full py-4 bg-[#262626] hover:bg-white/10 text-white font-bold rounded-xl border border-[#00e3fd] shadow-[0_0_15px_rgba(0,227,253,0.1)] transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Network size={16} className="text-[#00e3fd]" />
                Show State Graph from Current Move
              </button>
            
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
                    title={`${problem.name} Tree Explosion`}
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
                  {`< Click 'Show State Graph' to explore >`}
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
               {isCompleted ? "MASTERED PROBLEM SOLVING (300 XP)" : "MARK AS MASTERED & EARN 300 XP"}
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
