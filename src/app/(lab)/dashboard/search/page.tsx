"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Target,
  MapPin,
  SquareDashed,
  Hammer,
  SplitSquareHorizontal,
  Route,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  runSearchAlgorithm,
  Grid,
  Point,
  AlgorithmType,
  SearchResult,
  SearchStep,
  GraphNode,
  GraphEdge,
  GraphSearchResult,
  GraphSearchStep,
  runGraphSearchAlgorithm,
} from "@/lib/search-algorithms";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NodeGraphViz } from "@/components/search/NodeGraphViz";

const GRID_SIZE = 8;
type Tool = "start" | "goal" | "wall" | "empty" | "weight";
type Mode = "grid" | "graph";

export default function SearchPlaygroundPage() {
  const [mode, setMode] = useState<Mode>("grid");
  // --- States ---
  const [grid, setGrid] = useState<Grid>(() => {
    const init: Grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Grid[0] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({ x, y, type: "empty", weight: 1 });
      }
      init.push(row);
    }
    init[1][1].type = "start";
    init[6][6].type = "goal";
    return init;
  });

  const [startPoint, setStartPoint] = useState<Point>({ x: 1, y: 1 });
  const [goalPoint, setGoalPoint] = useState<Point>({ x: 6, y: 6 });

  // --- Graph States ---
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([
    { id: "A", x: 100, y: 150 },
    { id: "B", x: 250, y: 50 },
    { id: "C", x: 250, y: 250 },
    { id: "D", x: 450, y: 150 },
  ]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([
    { source: "A", target: "B", weight: 1 },
    { source: "A", target: "C", weight: 4 },
    { source: "B", target: "D", weight: 5 },
    { source: "C", target: "D", weight: 1 },
  ]);
  const [graphStart, setGraphStart] = useState("A");
  const [graphGoal, setGraphGoal] = useState("D");

  const [graphResult1, setGraphResult1] = useState<GraphSearchResult | null>(null);
  const [graphResult2, setGraphResult2] = useState<GraphSearchResult | null>(null);

  const [activeTool, setActiveTool] = useState<Tool>("wall");
  const [stampWeight, setStampWeight] = useState(5);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const [algo1, setAlgo1] = useState<AlgorithmType>("BFS");
  const [algo2, setAlgo2] = useState<AlgorithmType>("A*");

  const [result1, setResult1] = useState<SearchResult | null>(null);
  const [result2, setResult2] = useState<SearchResult | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5); // 1 to 10

  const playInterval = useRef<NodeJS.Timeout | null>(null);

  const maxSteps = Math.max(
    mode === "grid" 
      ? Math.max(result1?.steps.length || 0, isCompareMode ? (result2?.steps.length || 0) : 0)
      : Math.max(graphResult1?.steps.length || 0, isCompareMode ? (graphResult2?.steps.length || 0) : 0)
  );

  const hasResult = mode === "grid" ? !!result1 : !!graphResult1;

  // --- Handlers ---
  const handleCellClick = (x: number, y: number) => {
    if (isPlaying) return;
    
    // clear results if grid changes
    setResult1(null);
    setResult2(null);
    setCurrentStep(0);

    const newGrid = [...grid.map((r) => [...r])];
    const cell = newGrid[y][x];

    if (activeTool === "start") {
      newGrid[startPoint.y][startPoint.x].type = "empty";
      cell.type = "start";
      setStartPoint({ x, y });
    } else if (activeTool === "goal") {
      newGrid[goalPoint.y][goalPoint.x].type = "empty";
      cell.type = "goal";
      setGoalPoint({ x, y });
    } else if (activeTool === "wall") {
      if (cell.type !== "start" && cell.type !== "goal") {
        cell.type = cell.type === "wall" ? "empty" : "wall";
      }
    } else if (activeTool === "empty") {
      if (cell.type !== "start" && cell.type !== "goal") {
        cell.type = "empty";
        cell.weight = 1;
      }
    } else if (activeTool === "weight") {
      if (cell.type !== "start" && cell.type !== "goal" && cell.type !== "wall") {
        cell.weight = stampWeight;
      }
    }
    setGrid(newGrid);
  };

  const handleRun = () => {
    setIsPlaying(false);
    clearInterval(playInterval.current!);
    setCurrentStep(0);

    if (mode === "grid") {
      const r1 = runSearchAlgorithm(grid, startPoint, goalPoint, algo1);
      setResult1(r1);

      if (isCompareMode) {
        const r2 = runSearchAlgorithm(grid, startPoint, goalPoint, algo2);
        setResult2(r2);
      } else {
        setResult2(null);
      }
    } else {
      const r1 = runGraphSearchAlgorithm(graphNodes, graphEdges, graphStart, graphGoal, algo1);
      setGraphResult1(r1);

      if (isCompareMode) {
        const r2 = runGraphSearchAlgorithm(graphNodes, graphEdges, graphStart, graphGoal, algo2);
        setGraphResult2(r2);
      } else {
        setGraphResult2(null);
      }
    }
  };

  const togglePlay = () => {
    if (currentStep >= maxSteps - 1 && !isPlaying) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying) {
      const speedMs = 1100 - playbackSpeed * 100; // 1 -> 1000ms, 10 -> 100ms
      playInterval.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speedMs);
    } else if (playInterval.current) {
      clearInterval(playInterval.current);
    }
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying, playbackSpeed, maxSteps]);

  // --- Render Helpers ---
  const renderGrid = (result: SearchResult | null, title: string) => {
    const stepData: SearchStep | undefined = result?.steps[
      Math.min(currentStep, result.steps.length - 1)
    ];

    const frontierSet = new Set(stepData?.frontier.map((p) => `${p.x},${p.y}`));
    const exploredSet = new Set(stepData?.explored.map((p) => `${p.x},${p.y}`));
    const pathSet = new Set(stepData?.path?.map((p) => `${p.x},${p.y}`));
    const currentKey = stepData ? `${stepData.current.x},${stepData.current.y}` : "";

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center text-[#8eff71] font-bold font-['Space_Grotesk'] tracking-wider">
          <span>{title}</span>
          {stepData && (
            <span className="text-xs px-2 py-1 bg-[#262626] rounded-md text-white border border-white/5">
              Cost: {stepData.stats.pathCost} | Expanded: {stepData.stats.nodesExpanded}
            </span>
          )}
        </div>
        <div className="grid grid-cols-8 gap-1 bg-[#1a1a1a] p-2 rounded-xl border border-white/5 shadow-inner">
          {grid.map((row, y) =>
            row.map((cell, x) => {
              const key = `${x},${y}`;
              const isStart = cell.type === "start";
              const isGoal = cell.type === "goal";
              const isWall = cell.type === "wall";

              const isFrontier = frontierSet.has(key);
              const isExplored = exploredSet.has(key);
              const isPath = pathSet.has(key);
              const isCurrent = currentKey === key;

              let bgColor = "bg-[#131313]";
              let borderColor = "border-white/5";
              let textColor = "text-[#adaaaa]";

              if (isWall) {
                bgColor = "bg-black";
                borderColor = "border-[#262626]";
              } else if (isStart) {
                bgColor = "bg-[#2ff801]";
                textColor = "text-[#0d6100]";
                borderColor = "border-[#8eff71] neon-glow-primary";
              } else if (isGoal) {
                bgColor = "bg-[#d873ff]";
                textColor = "text-[#39004f]";
                borderColor = "border-[#ebadff] neon-glow-secondary";
              } else if (isPath) {
                bgColor = "bg-[#8eff71]/40";
                borderColor = "border-[#8eff71]";
              } else if (isCurrent) {
                bgColor = "bg-[#00d4ec]/50";
                borderColor = "border-[#00e3fd] neon-glow-tertiary";
              } else if (isFrontier) {
                bgColor = "bg-[#00d4ec]/10";
                borderColor = "border-[#00d4ec]/50";
              } else if (isExplored) {
                bgColor = "bg-[#262626]";
              }

              const nData = stepData?.nodeData[key];

              return (
                <div
                  key={key}
                  onClick={() => handleCellClick(x, y)}
                  className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border rounded-md flex items-center justify-center transition-all cursor-pointer select-none ${bgColor} ${borderColor} ${textColor} hover:brightness-125 hover:scale-105 active:scale-95`}
                >
                  <AnimatePresence>
                    {(isFrontier || isExplored || isPath) && !isStart && !isGoal && !isWall && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`absolute inset-0 rounded-md ${
                          isPath ? "bg-[#8eff71]/20 shadow-[0_0_10px_#8eff71]" : ""
                        }`}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Content inside cell */}
                  <span className="relative z-10 text-[8px] sm:text-[10px] font-bold">
                    {isStart
                      ? "S"
                      : isGoal
                      ? "G"
                      : isWall
                      ? ""
                      : cell.weight > 1 && !nData?.f
                      ? `w${cell.weight}`
                      : nData?.f !== undefined
                      ? nData.f
                      : nData?.g !== undefined
                      ? nData.g
                      : ""}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-4">
            Search <span className="text-[#00d4ec] neon-text-primary text-shadow-none shadow-[#00d4ec]">Playground</span>
            <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as Mode)} className="bg-[#131313] border border-white/10 rounded-lg h-9">
               <ToggleGroupItem value="grid" className="text-xs px-3 data-[state=on]:bg-[#00d4ec]/20 data-[state=on]:text-[#00d4ec]">Grid World</ToggleGroupItem>
               <ToggleGroupItem value="graph" className="text-xs px-3 data-[state=on]:bg-[#39FF14]/20 data-[state=on]:text-[#39FF14]">Node Graph</ToggleGroupItem>
            </ToggleGroup>
          </h1>
          <p className="text-[#adaaaa] text-sm md:text-base max-w-xl">
            Visualize pathfinding algorithms across matrix grids and arbitrary node-edge graphs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
              isCompareMode
                ? "bg-[#9900ce]/20 border-[#d873ff] text-[#d873ff] neon-glow-secondary"
                : "bg-[#1a1a1a] border-white/10 text-[#adaaaa] hover:text-white"
            }`}
          >
            <SplitSquareHorizontal size={16} />
            Compare Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Visualizer Area ── */}
        <div className="lg:col-span-8 space-y-6">
          <div className={`grid grid-cols-1 ${isCompareMode ? "md:grid-cols-2" : ""} gap-6`}>
            {mode === "grid" ? (
              <>
                 {renderGrid(result1, algo1)}
                 {isCompareMode && renderGrid(result2, algo2)}
              </>
            ) : (
              <>
                 <NodeGraphViz
                   nodes={graphNodes}
                   edges={graphEdges}
                   onNodesChange={setGraphNodes}
                   onEdgesChange={setGraphEdges}
                   startNode={graphStart}
                   goalNode={graphGoal}
                   onSetStart={setGraphStart}
                   onSetGoal={setGraphGoal}
                   activeTool={activeTool}
                   stampWeight={stampWeight}
                   stepData={graphResult1?.steps[Math.min(currentStep, graphResult1.steps.length - 1)]}
                   title={algo1}
                   isPlaying={isPlaying}
                 />
                 {isCompareMode && (
                   <NodeGraphViz
                     nodes={graphNodes}
                     edges={graphEdges}
                     onNodesChange={setGraphNodes}
                     onEdgesChange={setGraphEdges}
                     startNode={graphStart}
                     goalNode={graphGoal}
                     onSetStart={setGraphStart}
                     onSetGoal={setGraphGoal}
                     activeTool={activeTool}
                     stampWeight={stampWeight}
                     stepData={graphResult2?.steps[Math.min(currentStep, graphResult2.steps.length - 1)]}
                     title={algo2}
                     isPlaying={isPlaying}
                   />
                 )}
              </>
            )}
          </div>

          {/* Timeline and Playback Controls */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 md:p-6 border border-white/5 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentStep(0)}
                disabled={!hasResult}
                className="text-[#adaaaa] hover:text-white disabled:opacity-50"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep((p) => Math.max(0, p - 1));
                }}
                disabled={!hasResult || currentStep === 0}
                className="text-[#adaaaa] hover:text-white disabled:opacity-50"
              >
                <SkipBack size={20} />
              </button>
              
              <button
                onClick={hasResult ? togglePlay : handleRun}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  !hasResult
                    ? "bg-[#8eff71] text-[#0d6100] hover:scale-105 neon-glow-primary"
                    : "bg-[#262626] text-white hover:bg-[#2c2c2c] border border-white/10"
                }`}
              >
                {!hasResult ? <Play size={24} className="ml-1" /> : isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep((p) => Math.min(maxSteps - 1, p + 1));
                }}
                disabled={!hasResult || currentStep >= maxSteps - 1}
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

            <div className="flex items-center gap-4">
              <span className="text-xs text-[#adaaaa] font-mono w-16 text-right">
                Step {currentStep} / {Math.max(0, maxSteps - 1)}
              </span>
              <Slider
                value={[currentStep]}
                onValueChange={(v) => {
                  setIsPlaying(false);
                  setCurrentStep(v[0]);
                }}
                min={0}
                max={Math.max(0, maxSteps - 1)}
                step={1}
                disabled={!hasResult}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* ── Sidebar Controls ── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 space-y-6">
            <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
              <Route size={16} className="text-[#8eff71]" /> Environment Tools
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTool("start")}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all ${
                  activeTool === "start" ? "bg-[#8eff71]/20 border-[#8eff71] text-[#8eff71]" : "bg-[#131313] border-white/5 text-[#adaaaa]"
                }`}
              >
                <MapPin size={14} /> Set Start
              </button>
              <button
                onClick={() => setActiveTool("goal")}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all ${
                  activeTool === "goal" ? "bg-[#9900ce]/20 border-[#d873ff] text-[#d873ff]" : "bg-[#131313] border-white/5 text-[#adaaaa]"
                }`}
              >
                <Target size={14} /> Set Goal
              </button>
              <button
                onClick={() => setActiveTool("wall")}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all ${
                  activeTool === "wall" ? "bg-[#262626] border-[#484847] text-white" : "bg-[#131313] border-white/5 text-[#adaaaa]"
                }`}
              >
                <Hammer size={14} /> Draw Wall
              </button>
              <button
                onClick={() => setActiveTool("empty")}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all ${
                  activeTool === "empty" ? "bg-black border-[#484847] text-white" : "bg-[#131313] border-white/5 text-[#adaaaa]"
                }`}
              >
                <SquareDashed size={14} /> Eraser
              </button>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setActiveTool("weight")}
                  className={`text-xs font-bold uppercase tracking-widest px-2 py-1 border rounded ${activeTool === "weight" ? "border-[#00d4ec] text-[#00d4ec] bg-[#00d4ec]/10" : "border-white/10 text-[#adaaaa]"}`}
                >
                  Set Weight
                </button>
                <span className="text-sm font-mono text-white">{stampWeight}</span>
              </div>
              <Slider
                value={[stampWeight]}
                onValueChange={(v) => {
                  setStampWeight(v[0]);
                  setActiveTool("weight");
                }}
                min={1}
                max={10}
                step={1}
              />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-white uppercase tracking-widest text-sm text-[#00d4ec]">
              Algorithms
            </h3>

            <div>
              <label className="text-xs text-[#adaaaa] mb-1 block">Algorithm 1</label>
              <Select value={algo1} onValueChange={(v) => setAlgo1(v as AlgorithmType)}>
                <SelectTrigger className="w-full bg-[#131313] border-white/10">
                  <SelectValue placeholder="Select Algorithm" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#262626] text-white">
                  {["BFS", "DFS", "DLS", "UCS", "BestFirst", "A*"].map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <AnimatePresence>
              {isCompareMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="text-xs text-[#adaaaa] mb-1 block">Algorithm 2</label>
                  <Select value={algo2} onValueChange={(v) => setAlgo2(v as AlgorithmType)}>
                    <SelectTrigger className="w-full bg-[#131313] border-white/10">
                      <SelectValue placeholder="Select Algorithm" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#262626] text-white">
                      {["BFS", "DFS", "DLS", "UCS", "BestFirst", "A*"].map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleRun}
              className="w-full py-3 mt-4 bg-[#81ecff]/10 border border-[#00d4ec] text-[#00d4ec] font-bold rounded-lg hover:bg-[#00d4ec]/20 transition-all neon-glow-tertiary"
            >
              COMPUTE PATH
            </button>
          </div>

          <Accordion type="single" collapsible defaultValue="item-1" className="w-full text-[#adaaaa]">
            <AccordionItem value="item-1" className="border-white/10">
              <AccordionTrigger className="hover:text-white hover:no-underline font-bold text-sm tracking-widest uppercase">
                Challenges
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#131313] border border-white/5 rounded-lg">
                  <div>
                    <p className="text-xs text-white font-bold">Optimal Cost</p>
                    <p className="text-[10px] text-[#adaaaa]">Find path with cost {"<"} 12</p>
                  </div>
                  <span className="text-[#8eff71] text-xs font-bold">+50 XP</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#131313] border border-white/5 rounded-lg">
                  <div>
                    <p className="text-xs text-white font-bold">Heuristic Master</p>
                    <p className="text-[10px] text-[#adaaaa]">Expand {"<"} 20 nodes with A*</p>
                  </div>
                  <span className="text-[#d873ff] text-xs font-bold">+100 XP</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
