"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Box, Wind, Coins, Award, Target, BrainCircuit, ScanLine, Bot } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { 
  AgentType, 
  WorldState, 
  TickResult, 
  generateVacuumWorld, 
  simulateAgent 
} from "@/lib/agents";

const WORLD_W = 5;
const WORLD_H = 5;

// Colors for agents
const AGENT_COLORS: Record<AgentType, string> = {
  "simple-reflex": "#ffcc00", // Yellow
  "model-based": "#81ecff",   // Cyan
  "goal-based": "#d873ff",    // Purple
  "utility-based": "#8eff71", // Green
};

export default function AgentDesignerPage() {
  // Config
  const [agent1, setAgent1] = useState<AgentType>("simple-reflex");
  const [agent2, setAgent2] = useState<AgentType>("goal-based");
  
  // World State
  const [world, setWorld] = useState<WorldState>(() => generateVacuumWorld(WORLD_W, WORLD_H, 0.4, 0.15));
  
  // Results
  const [res1, setRes1] = useState<TickResult[]>([]);
  const [res2, setRes2] = useState<TickResult[]>([]);
  
  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [tick, setTick] = useState(0);
  const playInterval = useRef<NodeJS.Timeout | null>(null);

  const maxTicks = Math.max(res1.length, res2.length);

  // Re-simulate if world or agents change
  useEffect(() => {
    setIsPlaying(false);
    setTick(0);
    setRes1(simulateAgent(agent1, world));
    setRes2(simulateAgent(agent2, world));
  }, [world, agent1, agent2]);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      const speedMs = 1000 - speed * 90; // 1: 910ms, 10: 100ms
      playInterval.current = setInterval(() => {
        setTick(prev => {
          if (prev >= maxTicks - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speedMs);
    } else if (playInterval.current) {
      clearInterval(playInterval.current);
    }
    return () => clearInterval(playInterval.current as any);
  }, [isPlaying, speed, maxTicks]);

  const handleGenerate = () => setWorld(generateVacuumWorld(WORLD_W, WORLD_H, 0.4, 0.15));

  const safeFrame = (res: TickResult[], t: number) => {
    if (res.length === 0) return null;
    return res[Math.min(t, res.length - 1)];
  };

  const f1 = safeFrame(res1, tick);
  const f2 = safeFrame(res2, tick);

  const renderGrid = (agentKey: AgentType, frame: TickResult | null, resultFrames: TickResult[]) => {
    if (!frame) return null;

    // To cleanly render dirt, we figure out which dirts have not been sucked up to this frame
    const cleanedSoFar = new Set(
        resultFrames.slice(0, tick + 1)
            .filter(f => f.action === "SUCK")
            .map(f => `${f.agentPos.x},${f.agentPos.y}`)
    );

    const activeDirt = world.dirt.filter(d => !cleanedSoFar.has(`${d.x},${d.y}`));
    const color = AGENT_COLORS[agentKey];
    
    // Trail of path
    const path = resultFrames.slice(0, tick + 1).map(f => f.agentPos);

    return (
      <div className="relative aspect-square w-full max-w-[400px] bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] mx-auto font-mono">
        {/* Draw grid lines */}
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 opacity-20 pointer-events-none">
           {Array.from({length: 25}).map((_, i) => (
               <div key={i} className="border-r border-b border-white border-dashed last:border-b-0" />
           ))}
        </div>

        {/* Trail SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 500 500">
           <polyline 
             points={path.map(p => `${(p.x * 100) + 50},${(p.y * 100) + 50}`).join(" ")}
             fill="none"
             stroke={color}
             strokeWidth="4"
             strokeOpacity="0.3"
             strokeLinecap="round"
             className="transition-all"
           />
        </svg>

        {/* Entities */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {world.walls.map((w, i) => (
             <motion.div 
               key={`wall-${i}`}
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               className="absolute w-[20%] h-[20%] bg-[#262626] border-2 border-[#131313] rounded transition-all"
               style={{ left: `${w.x * 20}%`, top: `${w.y * 20}%` }}
             >
                <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#333_5px,#333_10px)]" />
             </motion.div>
          ))}

          {activeDirt.map((d, i) => (
             <div 
               key={`dirt-${d.x}-${d.y}`}
               className="absolute w-[20%] h-[20%] flex items-center justify-center transition-opacity"
               style={{ left: `${d.x * 20}%`, top: `${d.y * 20}%` }}
             >
                 <Wind size={20} className="text-[#adaaaa] animate-pulse opacity-50" />
             </div>
          ))}

          {/* Sucked overlay animation */}
          <AnimatePresence>
            {frame.action === "SUCK" && (
                <motion.div 
                   key={`suck-${tick}`}
                   initial={{ opacity: 1, scale: 0.5 }}
                   animate={{ opacity: 0, scale: 1.5 }}
                   exit={{ opacity: 0 }}
                   className="absolute w-[20%] h-[20%] border-4 opacity-0 z-30"
                   style={{ left: `${frame.agentPos.x * 20}%`, top: `${frame.agentPos.y * 20}%`, borderColor: color }}
                />
            )}
          </AnimatePresence>

          {/* Vacuum Agent */}
          <div 
            className="absolute w-[20%] h-[20%] flex items-center justify-center transition-all duration-300 ease-in-out z-40"
            style={{ left: `${frame.agentPos.x * 20}%`, top: `${frame.agentPos.y * 20}%` }}
          >
             <motion.div 
               animate={frame.action === "SUCK" ? { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] } : {}}
               className="p-1.5 md:p-2 rounded w-8 h-8 md:w-10 md:h-10 border-2 bg-black flex items-center justify-center shadow-[0_0_15px_currentColor]"
               style={{ borderColor: color, color: color, textShadow: "0 0 10px currentColor" }}
             >
                <Bot size={20} />
             </motion.div>
          </div>
        </div>
      </div>
    );
  };

  const win1 = f1 && f2 && (f1.score > f2.score);
  const win2 = f2 && f1 && (f2.score > f1.score);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold text-white mb-2">
            Agent <span className="text-[#ffcc00] neon-text-primary text-shadow-none shadow-[#ffcc00]">Designer</span>
          </h1>
          <p className="text-[#adaaaa] text-sm md:text-base max-w-xl">
             Dual-sim intelligent agents in a stochastic Vacuum-Cleaner environment to optimize Utility vs Performance cost.
          </p>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={handleGenerate}
                disabled={isPlaying}
                className="px-4 py-2 border border-[#81ecff] text-[#81ecff] rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#81ecff]/10 disabled:opacity-50 transition-colors"
            >
               <ScanLine size={16} className="inline mr-2 -mt-0.5" />
               New World
            </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-4 md:p-6 border border-white/5 space-y-4 shadow-xl">
         <div className="flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-2">
              <button
                onClick={() => setTick(0)}
                disabled={isPlaying}
                className="p-2 text-[#adaaaa] hover:text-white disabled:opacity-50 transition-colors"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={() => {
                  if (tick >= maxTicks - 1) setTick(0);
                  setIsPlaying(!isPlaying);
                }}
                className="w-12 h-12 bg-[#ffcc00] text-black rounded-full flex items-center justify-center hover:scale-105 neon-glow-primary transition-all ml-2"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>
              
              <div className="px-4 text-xs font-mono font-bold uppercase tracking-widest text-[#adaaaa]">
                  TICK {(tick+1).toString().padStart(3, '0')} / {maxTicks.toString().padStart(3, '0')}
              </div>
           </div>

           <div className="w-48 px-2 hidden sm:block">
              <span className="text-[10px] uppercase text-[#adaaaa] font-bold block mb-1 tracking-widest">Sim Speed</span>
              <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={1} max={10} step={1} />
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* SIM 1 */}
         <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#0a0a0a] p-1 border border-white/10 rounded-lg">
                <ToggleGroup type="single" value={agent1} onValueChange={(v: string) => v && setAgent1(v as AgentType)} className="w-full justify-between">
                    <ToggleGroupItem value="simple-reflex" aria-label="Simple" className={`flex-1 text-[10px] uppercase tracking-wider font-bold ${agent1==='simple-reflex' ? 'bg-[#262626] text-[#ffcc00]' : 'text-[#adaaaa]'}`}>Reflex</ToggleGroupItem>
                    <ToggleGroupItem value="model-based" aria-label="Model" className={`flex-1 text-[10px] uppercase tracking-wider font-bold ${agent1==='model-based' ? 'bg-[#262626] text-[#81ecff]' : 'text-[#adaaaa]'}`}>Model</ToggleGroupItem>
                    <ToggleGroupItem value="goal-based" aria-label="Goal" className={`flex-1 text-[10px] uppercase tracking-wider font-bold ${agent1==='goal-based' ? 'bg-[#262626] text-[#d873ff]' : 'text-[#adaaaa]'}`}>Goal</ToggleGroupItem>
                    <ToggleGroupItem value="utility-based" aria-label="Utility" className={`flex-1 text-[10px] uppercase tracking-wider font-bold ${agent1==='utility-based' ? 'bg-[#262626] text-[#8eff71]' : 'text-[#adaaaa]'}`}>Utility</ToggleGroupItem>
                </ToggleGroup>
            </div>

            {renderGrid(agent1, f1, res1)}

            <div className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-500 bg-[#131313] ${win1 && (tick === maxTicks - 1) ? 'border-[#ffcc00] shadow-[0_0_20px_rgba(255,204,0,0.1)]' : 'border-white/5'}`}>
               <AnimatePresence>
                  {win1 && (tick === maxTicks - 1) && (
                     <motion.div initial={{opacity:0, scale:2}} animate={{opacity:1, scale:1}} className="absolute -top-3 -right-3 text-[#ffcc00] opacity-20 rotate-12">
                        <Award size={100} strokeWidth={1} />
                     </motion.div>
                  )}
               </AnimatePresence>
               
               <div className="flex justify-between relative z-10">
                  <div>
                    <p className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><BrainCircuit size={12}/> AI Logs</p>
                    <p className="font-mono text-sm text-white" style={{color: AGENT_COLORS[agent1] || '#fff'}}>
                       {">"} {f1?.log || "Waiting..."}
                    </p>
                    <div className="mt-4 flex gap-6">
                       <div>
                          <p className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest flex items-center gap-1 mb-0.5"><Wind size={10}/> Cleans</p>
                          <p className="text-xl font-bold font-mono text-white">{f1?.dirtCleaned || 0} / {world.dirt.length}</p>
                       </div>
                       <div>
                          <p className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest flex items-center gap-1 mb-0.5"><Coins size={10}/> Utility Score</p>
                          <p className="text-xl font-bold font-mono text-white">{f1?.score || 0}</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
         </div>

         {/* SIM 2 */}
         <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#0a0a0a] p-1 border border-white/10 rounded-lg">
                <ToggleGroup type="single" value={agent2} onValueChange={(v: string) => v && setAgent2(v as AgentType)} className="w-full justify-between">
                    <ToggleGroupItem value="simple-reflex" aria-label="Simple" className={`flex-1 text-[10px] uppercase tracking-wider font-bold ${agent2==='simple-reflex' ? 'bg-[#262626] text-[#ffcc00]' : 'text-[#adaaaa]'}`}>Reflex</ToggleGroupItem>
                    <ToggleGroupItem value="model-based" aria-label="Model" className={`flex-1 text-[10px] uppercase tracking-wider font-bold ${agent2==='model-based' ? 'bg-[#262626] text-[#81ecff]' : 'text-[#adaaaa]'}`}>Model</ToggleGroupItem>
                    <ToggleGroupItem value="goal-based" aria-label="Goal" className={`flex-1 text-[10px] uppercase tracking-wider font-bold ${agent2==='goal-based' ? 'bg-[#262626] text-[#d873ff]' : 'text-[#adaaaa]'}`}>Goal</ToggleGroupItem>
                    <ToggleGroupItem value="utility-based" aria-label="Utility" className={`flex-1 text-[10px] uppercase tracking-wider font-bold ${agent2==='utility-based' ? 'bg-[#262626] text-[#8eff71]' : 'text-[#adaaaa]'}`}>Utility</ToggleGroupItem>
                </ToggleGroup>
            </div>

            {renderGrid(agent2, f2, res2)}

            <div className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-500 bg-[#131313] ${win2 && (tick === maxTicks - 1) ? 'border-[#ffcc00] shadow-[0_0_20px_rgba(255,204,0,0.1)]' : 'border-white/5'}`}>
               <AnimatePresence>
                  {win2 && (tick === maxTicks - 1) && (
                     <motion.div initial={{opacity:0, scale:2}} animate={{opacity:1, scale:1}} className="absolute -top-3 -right-3 text-[#ffcc00] opacity-20 rotate-12">
                        <Award size={100} strokeWidth={1} />
                     </motion.div>
                  )}
               </AnimatePresence>
               
               <div className="flex justify-between relative z-10">
                  <div>
                    <p className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><BrainCircuit size={12}/> AI Logs</p>
                    <p className="font-mono text-sm text-white" style={{color: AGENT_COLORS[agent2] || '#fff'}}>
                       {">"} {f2?.log || "Waiting..."}
                    </p>
                    <div className="mt-4 flex gap-6">
                       <div>
                          <p className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest flex items-center gap-1 mb-0.5"><Wind size={10}/> Cleans</p>
                          <p className="text-xl font-bold font-mono text-white">{f2?.dirtCleaned || 0} / {world.dirt.length}</p>
                       </div>
                       <div>
                          <p className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest flex items-center gap-1 mb-0.5"><Coins size={10}/> Utility Score</p>
                          <p className="text-xl font-bold font-mono text-white">{f2?.score || 0}</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
