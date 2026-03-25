"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Network,
  Bot,
  User,
  Swords,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import {
  BoardState,
  GameTreeNode,
  TreeGenerationResult,
  buildGameTree,
  getBestMoveAI,
  checkWinner,
} from "@/lib/game-tree";

const INITIAL_BOARD: BoardState = Array(9).fill(null);

// Math helper for layout
function getLeavesCount(node: GameTreeNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((acc, child) => acc + getLeavesCount(child), 0);
}

// Tree generation hook that computes coordinates
function useTreeLayout(
  treeData: TreeGenerationResult | null,
  containerWidth: number = 2000
) {
  return useMemo(() => {
    if (!treeData) return { nodes: [], edges: [] };

    const nodesWithCoord: (GameTreeNode & { x: number; y: number })[] = [];
    const edges: { x1: number; y1: number; x2: number; y2: number; isPruned: boolean; id: string }[] = [];

    const Y_STEP = 120;
    const TOTAL_WIDTH = Math.max(containerWidth, getLeavesCount(treeData.root) * 60);

    function layoutNode(
      node: GameTreeNode,
      xMin: number,
      xMax: number,
      y: number
    ): number {
      const thisX = (xMin + xMax) / 2;
      nodesWithCoord.push({ ...node, x: thisX, y });

      if (node.children.length > 0) {
        const totalLeaves = getLeavesCount(node);
        let currXMin = xMin;
        const widthPerLeaf = (xMax - xMin) / totalLeaves;

        for (const child of node.children) {
          const childLeaves = getLeavesCount(child);
          const childXMax = currXMin + childLeaves * widthPerLeaf;
          
          const childX = layoutNode(child, currXMin, childXMax, y + Y_STEP);
          
          edges.push({
            x1: thisX,
            y1: y + 20, // offset from center
            x2: childX,
            y2: y + Y_STEP - 20,
            isPruned: child.pruned,
            id: `${node.id}-${child.id}`,
          });

          currXMin = childXMax;
        }
      }
      return thisX;
    }

    layoutNode(treeData.root, 0, TOTAL_WIDTH, 40);

    return { nodes: nodesWithCoord, edges, width: TOTAL_WIDTH, height: 40 + 4 * Y_STEP };
  }, [treeData]);
}

export default function GameTreeStudioPage() {
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [winner, setWinner] = useState<"X" | "O" | "Draw" | null>(null);

  const [maxDepth, setMaxDepth] = useState(3);
  const [useAlphaBeta, setUseAlphaBeta] = useState(true);

  const [treeData, setTreeData] = useState<TreeGenerationResult | null>(null);
  
  // Animation states
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5);

  const playInterval = useRef<NodeJS.Timeout | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const layout = useTreeLayout(treeData, Math.max(1200, treeData ? treeData.nodesInOrder.length * 2 : 0));

  const maxSteps = treeData ? treeData.nodesInOrder.length : 0;

  // Render Loop
  useEffect(() => {
    if (isPlaying && treeData) {
      const speedMs = 600 - playbackSpeed * 50; 
      playInterval.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.max(10, speedMs));
    } else if (playInterval.current) {
      clearInterval(playInterval.current);
    }
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying, playbackSpeed, maxSteps, treeData]);

  const handleCellClick = (index: number) => {
    if (winner || board[index]) return;

    // User move (X)
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);

    const winX = checkWinner(newBoard);
    if (winX) {
      setWinner(winX);
      return;
    }

    // AI move (O)
    setTimeout(() => {
      const aiMove = getBestMoveAI(newBoard, false, maxDepth); // O is minimizing
      if (aiMove !== null) {
        newBoard[aiMove] = "O";
        setBoard([...newBoard]);
        const winO = checkWinner(newBoard);
        if (winO) setWinner(winO);
      }
    }, 300);
  };

  const handleExpandTree = () => {
    if (winner) return;
    setIsPlaying(false);
    // X is maximizing by default in our evaluate logic (X=+10, O=-10)
    // The current turn belongs to X if lengths of X and O are equal.
    const isMax = board.filter(c => c === "X").length === board.filter(c => c === "O").length;
    
    const result = buildGameTree(board, isMax, 0, maxDepth, useAlphaBeta);
    setTreeData(result);
    setCurrentStep(result.nodesInOrder.length - 1); // jump to full tree
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setWinner(null);
    setTreeData(null);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (currentStep >= maxSteps - 1 && !isPlaying) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const visibleNodesCache = useMemo(() => {
    if (!treeData) return new Set();
    const visible = new Set<string>();
    for (let i = 0; i <= currentStep; i++) {
        if(treeData.nodesInOrder[i]) {
            visible.add(treeData.nodesInOrder[i].id);
        }
    }
    return visible;
  }, [treeData, currentStep]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold text-white mb-2">
            Game Tree <span className="text-[#d873ff] neon-text-secondary text-shadow-none shadow-[#d873ff]">Studio</span>
          </h1>
          <p className="text-[#adaaaa] text-sm md:text-base max-w-xl">
            Play Tic-Tac-Toe against Minimax AI & visualize its decision tree with Alpha-Beta Pruning.
          </p>
        </div>
        <div className="text-right flex items-center gap-4">
           {treeData && (
              <div className="flex gap-4 p-3 bg-[#131313] border border-white/10 rounded-xl shadow-inner">
                <div>
                  <p className="text-[10px] text-[#adaaaa] uppercase font-bold tracking-widest leading-none mb-1">Evaluated</p>
                  <p className="text-white font-mono text-base font-bold leading-none">{treeData.stats.evaluated}</p>
                </div>
                <div className="w-px bg-white/10"></div>
                <div>
                  <p className="text-[10px] text-[#adaaaa] uppercase font-bold tracking-widest leading-none mb-1">Pruned</p>
                  <p className="text-[#d873ff] font-mono text-base font-bold leading-none neon-glow-secondary shadow-none">{treeData.stats.pruned}</p>
                </div>
              </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Visualizer Area ── */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-[#1a1a1a] rounded-2xl flex-1 border border-white/5 relative overflow-hidden min-h-[400px] flex flex-col">
            <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-[#131313]">
               <h3 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2">
                  <Network size={14} className="text-[#d873ff]" /> Minimax Tree Canvas
               </h3>
               {treeData && (
                   <span className="text-xs text-[#adaaaa] font-mono">
                       Step {currentStep} / {maxSteps - 1}
                   </span>
               )}
            </div>

            <div 
                ref={containerRef}
                className="flex-1 overflow-auto bg-[#0a0a0a] relative tree-scroll-container cursor-grab active:cursor-grabbing p-4"
                style={{ height: "600px" }}
            >
              {!treeData ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#adaaaa]">
                  <Swords size={48} className="mb-4 opacity-50 text-[#d873ff]" />
                  <p>Play a move and hit "Expand Tree" to visualize Minimax thinking.</p>
                </div>
              ) : (
                <svg width={layout.width} height={layout.height} className="absolute top-0 left-0">
                  {/* Draw Edges */}
                  {layout.edges.map((e) => {
                    const childNode = layout.nodes.find(n => e.id.endsWith(n.id));
                    const isVisible = childNode && visibleNodesCache.has(childNode.id);
                    if (!isVisible) return null;

                    return (
                      <line
                        key={e.id}
                        x1={e.x1}
                        y1={e.y1}
                        x2={e.x2}
                        y2={e.y2}
                        stroke={e.isPruned ? "#484847" : childNode?.isBestMove ? "#8eff71" : "#262626"}
                        strokeWidth={childNode?.isBestMove ? 3 : 2}
                        strokeDasharray={e.isPruned ? "4,4" : "none"}
                        className="transition-all duration-300"
                      />
                    );
                  })}

                  {/* Draw Nodes */}
                  {layout.nodes.map((n) => {
                    if (!visibleNodesCache.has(n.id)) return null;
                    
                    const isMax = n.isMax;
                    const bColor = n.pruned 
                        ? "fill-[#131313] stroke-[#262626]" 
                        : isMax 
                        ? "fill-[#2ff801]/10 stroke-[#8eff71]" 
                        : "fill-[#d873ff]/10 stroke-[#ebadff]";
                    
                    const tColor = n.pruned ? "#484847" : "white";

                    return (
                      <g key={n.id} transform={`translate(${n.x}, ${n.y})`} className="transition-all duration-500">
                        <circle cx={0} cy={0} r={18} className={`${bColor} stroke-2`} />
                        <text x={0} y={4} textAnchor="middle" fontSize={10} fill={tColor} fontWeight="bold" fontFamily="monospace">
                          {n.score !== null ? n.score : "?"}
                        </text>
                        {/* Alpha/Beta tags */}
                        {(!n.pruned && (n.alpha !== -Infinity || n.beta !== Infinity)) && (
                            <text x={0} y={30} textAnchor="middle" fontSize={8} fill={n.pruned ? "#484847" : "#adaaaa"} fontFamily="monospace">
                                [{n.alpha === -Infinity ? "-∞" : n.alpha}, {n.beta === Infinity ? "∞" : n.beta}]
                            </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 md:p-6 border border-white/5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                disabled={!treeData}
                className="text-[#adaaaa] hover:text-white disabled:opacity-50"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep((p) => Math.max(0, p - 1));
                }}
                disabled={!treeData || currentStep === 0}
                className="text-[#adaaaa] hover:text-white disabled:opacity-50"
              >
                <SkipBack size={20} />
              </button>
              
              <button
                onClick={treeData ? togglePlay : handleExpandTree}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  !treeData
                    ? "bg-[#d873ff] text-[#39004f] hover:scale-105 neon-glow-secondary font-bold text-[10px] tracking-widest break-words"
                    : "bg-[#262626] text-white hover:bg-[#2c2c2c] border border-white/10"
                }`}
              >
                {!treeData ? <Network size={24} /> : isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep((p) => Math.min(maxSteps - 1, p + 1));
                }}
                disabled={!treeData || currentStep >= maxSteps - 1}
                className="text-[#adaaaa] hover:text-white disabled:opacity-50"
              >
                <SkipForward size={20} />
              </button>

              <div className="w-24 px-2">
                <span className="text-[10px] uppercase text-[#adaaaa] font-bold block mb-1">Speed</span>
                <Slider
                  value={[playbackSpeed]}
                  onValueChange={(v) => setPlaybackSpeed(v[0])}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 px-2">
              <span className="text-xs text-[#adaaaa] font-bold tracking-widest hidden sm:block">TIMELINE</span>
              <Slider
                value={[currentStep]}
                onValueChange={(v) => {
                  setIsPlaying(false);
                  setCurrentStep(v[0]);
                }}
                min={0}
                max={Math.max(0, maxSteps - 1)}
                step={1}
                disabled={!treeData}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* ── Sidebar Controls & Board ── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 space-y-6 flex flex-col items-center">
             <h3 className="font-bold text-white uppercase tracking-widest text-sm self-start flex gap-2 items-center">
                <Bot size={16} className="text-[#00d4ec]" /> Interactive Board
             </h3>
             
             {/* The 3x3 Grid */}
             <div className="grid grid-cols-3 gap-2 bg-[#131313] p-2 rounded-xl border border-white/5 shadow-inner">
                {board.map((cell, idx) => {
                  const isWinningCell = false; // Add highlighting logic if needed
                  let colorClass = "";
                  if (cell === "X") colorClass = "text-[#8eff71] neon-text-primary text-shadow-none shadow-[#8eff71]";
                  if (cell === "O") colorClass = "text-[#00d4ec] neon-text-tertiary text-shadow-none shadow-[#00d4ec]";
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleCellClick(idx)}
                      disabled={cell !== null || winner !== null}
                      className={`w-20 h-20 md:w-24 md:h-24 bg-[#1a1a1a] border border-[#262626] rounded-lg text-4xl font-bold flex items-center justify-center transition-all ${!cell && !winner ? "hover:bg-[#262626]" : ""} ${isWinningCell ? "bg-[#262626] border-white/20" : ""}`}
                    >
                      {cell && <motion.span initial={{scale:0}} animate={{scale:1}} className={`font-['Space_Grotesk'] ${colorClass}`}>{cell}</motion.span>}
                    </button>
                  );
                })}
             </div>

             <div className="w-full h-8 flex items-center justify-center">
               <AnimatePresence mode="wait">
                  {winner && (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className={`font-bold tracking-wider uppercase text-sm ${winner === "X" ? "text-[#8eff71]" : winner === "O" ? "text-[#00d4ec]" : "text-[#adaaaa]"}`}
                     >
                        {winner === "Draw" ? "IT'S A DRAW!" : `${winner} WINS THE GAME`}
                     </motion.div>
                  )}
               </AnimatePresence>
             </div>

             <div className="flex gap-2 w-full">
                <button
                  onClick={resetGame}
                  className="flex-1 py-2 bg-[#262626] hover:bg-[#333] border border-white/10 text-white font-bold rounded-lg transition-all text-xs tracking-widest uppercase"
                >
                  Reset Game
                </button>
             </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 space-y-6">
            <h3 className="font-bold text-white uppercase tracking-widest text-sm text-[#d873ff]">
              Algorithm Params
            </h3>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-xs uppercase tracking-widest">Alpha-Beta Pruning</p>
                    <p className="text-[10px] text-[#adaaaa]">Skip branches that don't affect outcome</p>
                  </div>
                  <Switch 
                     checked={useAlphaBeta} 
                     onCheckedChange={setUseAlphaBeta} 
                     className="data-[state=checked]:bg-[#d873ff] data-[state=checked]:shadow-[0_0_10px_#d873ff]" 
                  />
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                    <p className="text-white font-bold text-xs uppercase tracking-widest">Max Depth</p>
                    <span className="text-sm font-mono text-[#d873ff]">{maxDepth}</span>
                </div>
                <Slider
                    value={[maxDepth]}
                    onValueChange={(v) => setMaxDepth(v[0])}
                    min={1}
                    max={4}
                    step={1}
                />
            </div>

            <button
              onClick={handleExpandTree}
              disabled={!!winner}
              className="w-full py-3 mt-4 bg-[#9900ce]/10 border border-[#d873ff] text-[#d873ff] font-bold rounded-lg hover:bg-[#9900ce]/20 transition-all neon-glow-secondary disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              <Network size={16} /> Expand Tree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
