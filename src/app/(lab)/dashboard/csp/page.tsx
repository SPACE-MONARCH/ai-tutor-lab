"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Zap,
  Map,
  Sigma,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MousePointer2,
  FastForward,
  X,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import { solveCSP, validateMapAssignments, CSPResult, CSPType, ManualValidationResult } from "@/lib/csp-solver";
import {
  generateCryptarithmetic,
  generateMapColoring,
  CryptoPuzzle,
  MapColoringPuzzle,
} from "@/ai/flows/generate-csp.genkit";

const COLORS: Record<string, string> = {
  Red: "#ff3366",
  Green: "#33ff66",
  Blue: "#3366ff",
};

const DEFAULT_CRYPTO: CryptoPuzzle = { word1: "SEND", word2: "MORE", result: "MONEY" };
const DEFAULT_MAP: MapColoringPuzzle = {
  regions: ["WA", "NT", "SA", "Q", "NSW", "V", "T"],
  edges: [
    ["WA", "NT"], ["WA", "SA"],
    ["NT", "SA"], ["NT", "Q"],
    ["SA", "Q"], ["SA", "NSW"], ["SA", "V"],
    ["Q", "NSW"], ["NSW", "V"],
  ],
};

export default function CSPBoardPage() {
  const [activeTab, setActiveTab] = useState<CSPType>("cryptarithmetic");

  // Config
  const [useMRV, setUseMRV] = useState(true);
  const [useForwardChecking, setUseForwardChecking] = useState(true);

  // Dynamic Puzzles
  const [cryptoPuz, setCryptoPuz] = useState<CryptoPuzzle>(DEFAULT_CRYPTO);
  const [mapPuz, setMapPuz] = useState<MapColoringPuzzle>(DEFAULT_MAP);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Results & Playback
  const [result, setResult] = useState<CSPResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5);
  const playInterval = useRef<NodeJS.Timeout | null>(null);

  // Instant Solve popup
  const [showInstantSolve, setShowInstantSolve] = useState(false);

  // Manual Map Coloring mode
  const [manualMode, setManualMode] = useState(false);
  const [manualAssignments, setManualAssignments] = useState<Record<string, string>>({});
  const [manualValidation, setManualValidation] = useState<ManualValidationResult | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const activeFrame = result && result.frames[currentStep] ? result.frames[currentStep] : null;
  const currentAssignments = activeFrame?.assignments || {};
  const currentDomains = activeFrame?.domains || {};

  // Procedural Map Layout
  const mapLayout = useMemo(() => {
    const R = 150;
    const cx = 250;
    const cy = 250;
    const nodes: Record<string, { x: number; y: number }> = {};

    if (mapPuz.regions.length === 7 && mapPuz.regions.includes("WA") && mapPuz.regions.includes("NT")) {
      nodes["WA"] = { x: 80, y: 180 };
      nodes["NT"] = { x: 220, y: 100 };
      nodes["SA"] = { x: 250, y: 220 };
      nodes["Q"]  = { x: 380, y: 120 };
      nodes["NSW"] = { x: 400, y: 250 };
      nodes["V"]  = { x: 360, y: 330 };
      nodes["T"]  = { x: 420, y: 410 };
      return nodes;
    }

    mapPuz.regions.forEach((region, i) => {
      const angle = (Math.PI * 2 * i) / mapPuz.regions.length;
      nodes[region] = {
        x: cx + R * Math.cos(angle - Math.PI / 2),
        y: cy + R * Math.sin(angle - Math.PI / 2),
      };
    });
    return nodes;
  }, [mapPuz]);

  // Playback timer
  useEffect(() => {
    if (isPlaying && result) {
      const speedMs = 800 - playbackSpeed * 70;
      playInterval.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= result.frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.max(20, speedMs));
    } else if (playInterval.current) {
      clearInterval(playInterval.current);
    }
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying, playbackSpeed, result]);

  // Manual mode live validation
  useEffect(() => {
    if (manualMode && activeTab === "map-coloring") {
      const v = validateMapAssignments(manualAssignments, mapPuz.regions, mapPuz.edges);
      setManualValidation(v);
    }
  }, [manualAssignments, manualMode, activeTab, mapPuz]);

  const handleStepSolve = useCallback(() => {
    setIsPlaying(false);
    setManualMode(false);
    setShowInstantSolve(false);
    const r = solveCSP({
      type: activeTab,
      useMRV,
      useForwardChecking,
      cryptoEquation: cryptoPuz,
      mapData: mapPuz,
    });
    setResult(r);
    setCurrentStep(0);
  }, [activeTab, useMRV, useForwardChecking, cryptoPuz, mapPuz]);

  const handleInstantSolve = useCallback(() => {
    setManualMode(false);
    const r = solveCSP({
      type: activeTab,
      useMRV,
      useForwardChecking,
      cryptoEquation: cryptoPuz,
      mapData: mapPuz,
    });
    setResult(r);
    if (r.success && r.frames.length > 0) {
      setCurrentStep(r.frames.length - 1);
      setShowInstantSolve(true);
    }
    setIsPlaying(false);
  }, [activeTab, useMRV, useForwardChecking, cryptoPuz, mapPuz]);

  const handleGenerate = async () => {
    setIsPlaying(false);
    setResult(null);
    setCurrentStep(0);
    setGenError(null);
    setManualMode(false);
    setManualAssignments({});
    setShowInstantSolve(false);
    setIsGenerating(true);

    try {
      if (activeTab === "cryptarithmetic") {
        const res = await generateCryptarithmetic();
        if (res.data) setCryptoPuz(res.data);
        if (res.error) setGenError(res.error);
      } else {
        const res = await generateMapColoring();
        if (res.data) setMapPuz(res.data);
        if (res.error) setGenError(res.error);
      }
    } catch (err: any) {
      setGenError("Unexpected error: " + (err?.message || "Unknown"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setResult(null);
    setCurrentStep(0);
    setGenError(null);
    setManualMode(false);
    setManualAssignments({});
    setShowInstantSolve(false);
    if (activeTab === "cryptarithmetic") setCryptoPuz(DEFAULT_CRYPTO);
    else setMapPuz(DEFAULT_MAP);
  };

  const togglePlay = () => {
    if (!result) return;
    if (currentStep >= result.frames.length - 1 && !isPlaying) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const enterManualMode = () => {
    setManualMode(true);
    setResult(null);
    setCurrentStep(0);
    setManualAssignments({});
    setShowInstantSolve(false);
    setSelectedRegion(null);
  };

  const assignManualColor = (region: string, color: string) => {
    setManualAssignments((prev) => {
      const next = { ...prev };
      if (next[region] === color) {
        delete next[region]; // Toggle off
      } else {
        next[region] = color;
      }
      return next;
    });
    setSelectedRegion(null);
  };

  useEffect(() => {
    setIsPlaying(false);
    setResult(null);
    setCurrentStep(0);
    setManualMode(false);
    setManualAssignments({});
    setGenError(null);
    setShowInstantSolve(false);
  }, [activeTab]);

  /* ── RENDER MAP GRAPH ── */
  const renderMap = () => {
    const displayAssignments = manualMode ? manualAssignments : currentAssignments;
    const conflictPairs = manualValidation?.conflicts || [];
    const conflictSet = new Set<string>();
    conflictPairs.forEach(([a, b]) => { conflictSet.add(a); conflictSet.add(b); });

    return (
      <div className="relative w-full h-[500px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex items-center justify-center p-4">
        {isGenerating ? (
          <div className="text-[#81ecff] flex flex-col items-center">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="font-mono text-xs uppercase tracking-widest">Generating Map...</span>
          </div>
        ) : (
          <svg viewBox="0 0 500 500" className="w-full h-full max-w-[500px] max-h-[500px]">
            {mapPuz.edges.map(([u, v], idx) => {
              const p1 = mapLayout[u];
              const p2 = mapLayout[v];
              if (!p1 || !p2) return null;
              const isConflictEdge = manualMode && conflictPairs.some(
                ([a, b]) => (a === u && b === v) || (a === v && b === u)
              );
              return (
                <line
                  key={idx}
                  x1={p1.x} y1={p1.y}
                  x2={p2.x} y2={p2.y}
                  stroke={isConflictEdge ? "#ff3366" : "#262626"}
                  strokeWidth={isConflictEdge ? 5 : 4}
                  className={isConflictEdge ? "animate-pulse" : ""}
                />
              );
            })}

            {mapPuz.regions.map((id) => {
              const pos = mapLayout[id] || { x: 250, y: 250 };
              const assignedColorName = displayAssignments[id];
              const isTargeted = !manualMode && activeFrame?.variable === id;
              const isSelected = manualMode && selectedRegion === id;
              const hasConflict = manualMode && conflictSet.has(id);
              const domList = !manualMode ? (currentDomains[id] || ["Red", "Green", "Blue"]) : ["Red", "Green", "Blue"];

              let fillColor = "#1a1a1a";
              if (assignedColorName) {
                fillColor = COLORS[assignedColorName] || fillColor;
              }

              return (
                <g
                  key={id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => manualMode && setSelectedRegion(selectedRegion === id ? null : id)}
                  className={manualMode ? "cursor-pointer" : ""}
                >
                  <circle
                    cx={0} cy={0} r={28}
                    fill={fillColor}
                    stroke={
                      hasConflict ? "#ff3366"
                      : isSelected ? "#ffcc00"
                      : isTargeted ? "#d873ff"
                      : "#444"
                    }
                    strokeWidth={isSelected || isTargeted || hasConflict ? 4 : 2}
                    className="transition-all duration-300"
                  />

                  {hasConflict && (
                    <circle cx={0} cy={0} r={34} fill="none" stroke="#ff3366" strokeWidth={2} className="animate-ping" />
                  )}
                  {!manualMode && activeFrame?.type === "prune" && isTargeted && (
                    <circle cx={0} cy={0} r={34} fill="none" stroke="#ff3366" strokeWidth={2} className="animate-ping" />
                  )}

                  <text x={0} y={5} textAnchor="middle" fill={assignedColorName ? "#000" : "#fff"} fontWeight="bold" fontSize={14}>
                    {id.length > 5 ? id.substring(0, 3) : id}
                  </text>

                  {!assignedColorName && !manualMode && (
                    <g transform="translate(-15, 34)">
                      {["Red", "Green", "Blue"].map((c, i) => (
                        <circle
                          key={c}
                          cx={i * 15} cy={0} r={4}
                          fill={domList.includes(c) ? COLORS[c] : "#111"}
                          stroke={domList.includes(c) ? "none" : "#333"}
                        />
                      ))}
                    </g>
                  )}

                  {/* Manual mode: color picker on selected */}
                  {manualMode && isSelected && (
                    <g transform="translate(-22, 38)">
                      {["Red", "Green", "Blue"].map((c, i) => (
                        <g key={c} onClick={(e) => { e.stopPropagation(); assignManualColor(id, c); }} className="cursor-pointer">
                          <circle
                            cx={i * 22} cy={0} r={9}
                            fill={COLORS[c]}
                            stroke={manualAssignments[id] === c ? "#fff" : "none"}
                            strokeWidth={2}
                          />
                        </g>
                      ))}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Manual mode status bar */}
        {manualMode && !isGenerating && (
          <div className="absolute bottom-3 left-3 right-3 bg-[#131313]/90 backdrop-blur rounded-lg px-4 py-2 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono">
              <MousePointer2 size={14} className="text-[#ffcc00]" />
              <span className="text-[#adaaaa]">Click a region → Pick a color</span>
            </div>
            <div className="flex items-center gap-2">
              {manualValidation && manualValidation.complete && manualValidation.valid && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[#8eff71] text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Solved!
                </motion.span>
              )}
              {manualValidation && manualValidation.conflicts.length > 0 && (
                <span className="text-[#ff3366] text-xs font-bold flex items-center gap-1">
                  <XCircle size={14} /> {manualValidation.conflicts.length} conflict{manualValidation.conflicts.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── RENDER CRYPTARITHMETIC ── */
  const renderCrypto = () => {
    const displayAssignments = showInstantSolve && result?.finalAssignments ? result.finalAssignments : currentAssignments;

    const renderLetterBox = (letter: string, idx: number) => {
      const val = displayAssignments[letter];
      const isTargeted = !showInstantSolve && activeFrame?.variable === letter;
      const domList = !showInstantSolve ? (currentDomains[letter] || []) : [];

      return (
        <div key={`${letter}-${idx}`} className="flex flex-col items-center gap-1">
          <div
            className={`w-12 h-14 md:w-16 md:h-20 flex flex-col items-center justify-center rounded border-2 transition-all ${
              showInstantSolve && val !== undefined
                ? "bg-[#8eff71]/15 border-[#8eff71] text-[#8eff71]"
                : isTargeted
                ? activeFrame!.type === "fail" || activeFrame!.type === "backtrack"
                  ? "bg-[#ff3366]/20 border-[#ff3366]"
                  : "bg-[#d873ff]/20 border-[#d873ff]"
                : val !== undefined
                ? "bg-[#8eff71]/10 border-[#8eff71]/50 text-[#8eff71]"
                : "bg-[#1a1a1a] border-[#333] text-white"
            }`}
          >
            <span className="text-[10px] text-[#adaaaa] font-bold absolute -mt-10 md:-mt-14 uppercase">{letter}</span>
            <span className="text-2xl md:text-3xl font-mono font-bold">{val !== undefined ? val : "_"}</span>
          </div>
          {!showInstantSolve && (
            <div className="w-full flex justify-between h-1 bg-[#111] mt-1 rounded overflow-hidden">
              {val === undefined &&
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`flex-1 ${domList.includes(i) ? "bg-[#d873ff]" : "bg-transparent"}`} />
                ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="w-full h-[500px] bg-[#0a0a0a] rounded-xl border border-white/5 flex flex-col items-center justify-center p-4 relative">
        {isGenerating ? (
          <div className="text-[#81ecff] flex flex-col items-center">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="font-mono text-xs uppercase tracking-widest">Conjuring Puzzle...</span>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-4 space-y-4 font-mono select-none">
            <div className="flex gap-2 justify-end w-full">
              {cryptoPuz.word1.split("").map((l, i) => renderLetterBox(l, i))}
            </div>
            <div className="flex gap-2 items-center justify-end w-full">
              <div className="text-3xl text-white font-bold w-12 md:w-16 flex justify-center">+</div>
              {cryptoPuz.word2.split("").map((l, i) => renderLetterBox(l, i + 100))}
            </div>
            <div className="w-full h-1 bg-white/20 rounded-full my-2 relative" />
            <div className="flex gap-2 relative justify-end w-full">
              {cryptoPuz.result.split("").map((l, i) => renderLetterBox(l, i + 200))}
              {(activeFrame?.type === "success" || showInstantSolve) && (
                <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="absolute -right-16 top-4 text-[#8eff71]">
                  <CheckCircle2 size={40} />
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Instant Solve overlay */}
        <AnimatePresence>
          {showInstantSolve && result?.finalAssignments && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-3 left-3 right-3 bg-[#131313]/95 backdrop-blur-xl rounded-xl px-4 py-3 border border-[#8eff71]/30 flex items-center justify-between"
            >
              <div>
                <p className="text-[#8eff71] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Solution Found
                </p>
                <p className="text-white font-mono text-xs">
                  {Object.entries(result.finalAssignments).map(([k, v]) => `${k}=${v}`).join("  ")}
                </p>
              </div>
              <button onClick={() => setShowInstantSolve(false)} className="text-[#adaaaa] hover:text-white ml-2">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold text-white mb-2">
            CSP <span className="text-[#81ecff]">Board</span>
          </h1>
          <p className="text-[#adaaaa] text-sm md:text-base max-w-xl">
            Visualize Constraint Satisfaction with MRV heuristics, Forward Checking, and manual solving.
          </p>
        </div>

        {result && !showInstantSolve && (
          <div className="flex gap-4 p-3 bg-[#131313] border border-white/10 rounded-xl shadow-inner">
            <div>
              <p className="text-[10px] text-[#adaaaa] uppercase font-bold tracking-widest leading-none mb-1">Backtracks</p>
              <p className="text-[#ff3366] font-mono text-base font-bold leading-none">{result.stats.backtracks}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-[10px] text-[#adaaaa] uppercase font-bold tracking-widest leading-none mb-1">Pruned</p>
              <p className="text-[#d873ff] font-mono text-base font-bold leading-none">{result.stats.pruned}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {genError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-xl px-4 py-3 flex items-start gap-3"
          >
            <AlertTriangle size={18} className="text-[#ff3366] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[#ff3366] text-xs font-bold uppercase tracking-widest mb-1">Generation Warning</p>
              <p className="text-[#adaaaa] text-xs">{genError}</p>
            </div>
            <button onClick={() => setGenError(null)} className="text-[#adaaaa] hover:text-white">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Viz + Controls */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CSPType)} className="w-full">
            <TabsList className="bg-[#1a1a1a] border border-white/10 mb-4 p-1 rounded-lg">
              <TabsTrigger value="cryptarithmetic" className="data-[state=active]:bg-[#262626] data-[state=active]:text-[#81ecff]">
                <Sigma size={16} className="mr-2" /> Cryptarithmetic
              </TabsTrigger>
              <TabsTrigger value="map-coloring" className="data-[state=active]:bg-[#262626] data-[state=active]:text-[#81ecff]">
                <Map size={16} className="mr-2" /> Map Coloring
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cryptarithmetic" className="mt-0 outline-none">
              {renderCrypto()}
            </TabsContent>
            <TabsContent value="map-coloring" className="mt-0 outline-none">
              {renderMap()}
            </TabsContent>
          </Tabs>

          {/* Playback Controls (hidden in manual mode) */}
          {!manualMode && (
            <div className="bg-[#1a1a1a] rounded-xl p-4 md:p-6 border border-white/5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded-lg border border-white/5 mb-4 font-mono text-sm text-[#adaaaa] h-12">
                {activeFrame ? (
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeFrame.type === "backtrack" ? "bg-[#ff3366]"
                        : activeFrame.type === "success" ? "bg-[#8eff71]"
                        : activeFrame.type === "prune" ? "bg-[#d873ff]"
                        : "bg-white"
                      }`}
                    />
                    {activeFrame.description}
                  </span>
                ) : (
                  <span className="opacity-50">Awaiting execution...</span>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <button onClick={() => setCurrentStep(0)} disabled={!result || isGenerating} className="text-[#adaaaa] hover:text-white disabled:opacity-50">
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={() => { setIsPlaying(false); setCurrentStep((p) => Math.max(0, p - 1)); }}
                  disabled={!result || currentStep === 0 || isGenerating}
                  className="text-[#adaaaa] hover:text-white disabled:opacity-50"
                >
                  <SkipBack size={20} />
                </button>

                <button
                  onClick={result ? togglePlay : handleStepSolve}
                  disabled={isGenerating}
                  className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-all ${
                    isGenerating ? "bg-[#262626] cursor-not-allowed opacity-50"
                    : !result ? "bg-[#81ecff] text-[#003d4a] hover:scale-105"
                    : "bg-[#262626] text-white hover:bg-[#2c2c2c] border border-white/10"
                  }`}
                >
                  {!result ? <Zap size={24} /> : isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>

                <button
                  onClick={() => { setIsPlaying(false); setCurrentStep((p) => Math.min((result?.frames.length || 1) - 1, p + 1)); }}
                  disabled={!result || currentStep >= result.frames.length - 1 || isGenerating}
                  className="text-[#adaaaa] hover:text-white disabled:opacity-50"
                >
                  <SkipForward size={20} />
                </button>

                <div className="w-24 px-2 hidden sm:block">
                  <span className="text-[10px] uppercase text-[#adaaaa] font-bold block mb-1">Speed</span>
                  <Slider value={[playbackSpeed]} onValueChange={(v) => setPlaybackSpeed(v[0])} min={1} max={10} step={1} />
                </div>
              </div>

              <div className="flex items-center gap-4 px-2">
                <span className="text-xs text-[#adaaaa] font-bold tracking-widest hidden sm:block">HISTORY</span>
                <div className="flex-1 space-y-2">
                  <Slider
                    value={[currentStep]}
                    onValueChange={(v) => { setIsPlaying(false); setCurrentStep(v[0]); }}
                    min={0}
                    max={Math.max(0, (result?.frames.length || 1) - 1)}
                    step={1}
                    disabled={!result || isGenerating}
                  />
                  <Progress value={result ? (currentStep / Math.max(1, result.frames.length - 1)) * 100 : 0} className="h-1" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Generation Panel */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-white uppercase tracking-widest text-sm flex gap-2 items-center text-[#d873ff]">
              <Sparkles size={16} /> Generation
            </h3>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-[#d873ff]/10 border border-[#d873ff] text-[#d873ff] font-bold rounded-lg hover:bg-[#d873ff]/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate New
            </button>
          </div>

          {/* Solver Modes Panel */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-white uppercase tracking-widest text-sm flex gap-2 items-center text-[#81ecff]">
              <Zap size={16} /> Solver Modes
            </h3>

            <button
              onClick={handleStepSolve}
              disabled={isGenerating}
              className="w-full py-3 bg-[#0a0a0a] border-2 border-[#81ecff] text-[#81ecff] font-bold rounded-lg hover:bg-[#81ecff]/10 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play size={14} /> Step-by-Step Solve
            </button>

            <button
              onClick={handleInstantSolve}
              disabled={isGenerating}
              className="w-full py-3 bg-[#0a0a0a] border-2 border-[#8eff71] text-[#8eff71] font-bold rounded-lg hover:bg-[#8eff71]/10 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FastForward size={14} /> Instant Solve
            </button>

            {activeTab === "map-coloring" && (
              <button
                onClick={manualMode ? () => setManualMode(false) : enterManualMode}
                disabled={isGenerating}
                className={`w-full py-3 border-2 font-bold rounded-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 ${
                  manualMode
                    ? "bg-[#ffcc00]/10 border-[#ffcc00] text-[#ffcc00]"
                    : "bg-[#0a0a0a] border-[#ffcc00]/50 text-[#ffcc00]/80 hover:border-[#ffcc00] hover:text-[#ffcc00]"
                }`}
              >
                <MousePointer2 size={14} /> {manualMode ? "Exit Manual Mode" : "Manual Solve"}
              </button>
            )}
          </div>

          {/* Heuristics Panel */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-white uppercase tracking-widest text-sm flex gap-2 items-center text-[#adaaaa]">
              Heuristics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-xs uppercase tracking-widest">MRV</p>
                  <p className="text-[10px] text-[#adaaaa]">Min Remaining Values</p>
                </div>
                <Switch
                  checked={useMRV}
                  onCheckedChange={setUseMRV}
                  className="data-[state=checked]:bg-[#81ecff] data-[state=checked]:shadow-[0_0_10px_#81ecff]"
                />
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div>
                  <p className="text-white font-bold text-xs uppercase tracking-widest">Forward Check</p>
                  <p className="text-[10px] text-[#adaaaa]">Prune domains on assign</p>
                </div>
                <Switch
                  checked={useForwardChecking}
                  onCheckedChange={setUseForwardChecking}
                  className="data-[state=checked]:bg-[#d873ff] data-[state=checked]:shadow-[0_0_10px_#d873ff]"
                />
              </div>
            </div>
            <button
              onClick={handleReset}
              disabled={isGenerating}
              className="w-full py-2 mt-2 bg-transparent text-[#adaaaa] hover:text-white font-bold rounded-lg transition-all text-xs tracking-widest uppercase border border-transparent hover:border-white/10 disabled:opacity-50"
            >
              Reset Defaults
            </button>
          </div>

          {/* CSP Definition */}
          <div className="bg-[#131313] p-6 rounded-xl border border-white/5">
            <h3 className="text-xs uppercase font-bold text-[#8eff71] tracking-widest mb-2">CSP Definition</h3>
            {activeTab === "cryptarithmetic" ? (
              <ul className="text-xs text-[#adaaaa] space-y-1 list-disc list-inside">
                <li><strong>Variables:</strong> {Array.from(new Set(`${cryptoPuz.word1}${cryptoPuz.word2}${cryptoPuz.result}`.split(""))).join(", ")}</li>
                <li><strong>Domains:</strong> {"{0, 1, ..., 9}"}</li>
                <li><strong>Constraints:</strong> Leading≠0, AllDiff, <br /> {cryptoPuz.word1} + {cryptoPuz.word2} = {cryptoPuz.result}</li>
              </ul>
            ) : (
              <ul className="text-xs text-[#adaaaa] space-y-1 list-disc list-inside">
                <li><strong>Variables:</strong> {mapPuz.regions.join(", ")}</li>
                <li><strong>Domains:</strong> {"{Red, Green, Blue}"}</li>
                <li><strong>Constraints:</strong> Adjacent ≠ same color</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
