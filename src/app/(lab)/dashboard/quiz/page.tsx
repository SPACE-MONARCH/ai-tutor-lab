"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, AlertTriangle, Sparkles, LogOut, Loader2, Play, Award, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

import { Question, Difficulty, getInitialQuestions, getAdaptiveQuestion } from "@/lib/quiz-bank";
import { getQuizExplanation } from "./actions";
import { useLabProgress } from "@/lib/progress";

// Optional Firebase auth - mock if fails
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

// Initialize Firebase if env vars exist
let db: any = null;
let auth: any = null;
if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  try {
    const app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    });
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase init failed", e);
  }
}

export default function AdaptiveQuizPage() {
  const { markQuizComplete } = useLabProgress();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // State
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  
  // UI Interaction
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  const [isFinished, setIsFinished] = useState(false);
  const [savedLocally, setSavedLocally] = useState<boolean>(false);

  // Initialize
  useEffect(() => {
    // Start with 10 random easy/medium
    const initial = getInitialQuestions(10);
    setQuestions(initial);
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelect = async (optIndex: number) => {
    if (isEvaluating || isFinished) return;
    setSelectedOption(optIndex);
    setIsEvaluating(true);

    const isCorrect = optIndex === currentQ.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    const newScore = isCorrect ? score + (currentQ.difficulty === 'hard' ? 20 : currentQ.difficulty === 'medium' ? 15 : 10) : score;

    setStreak(newStreak);
    setScore(newScore);
    setAnsweredIds(prev => [...prev, currentQ.id]);

    if (!isCorrect) {
       // Fetch Genkit Explanation
       setIsLoadingExplanation(true);
       try {
         const exp = await getQuizExplanation(currentQ.text, currentQ.options[currentQ.correctAnswer], currentQ.options[optIndex]);
         setExplanation(exp);
       } catch (e) {
         setExplanation(`The correct answer was: ${currentQ.options[currentQ.correctAnswer]}`);
       }
       setIsLoadingExplanation(false);
    } else {
       // Optional correct confetti
       if (newStreak % 3 === 0) {
         confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: ['#8eff71', '#39FF14'] });
       }
    }
  };

  const nextQuestion = () => {
    setExplanation(null);
    setSelectedOption(null);
    setIsEvaluating(false);

    if (currentIndex >= 9) { // End of 10 question session
       handleFinish(score, streak);
    } else {
       // Check if we need to adapt the upcoming question based on streak
       const nextQ = getAdaptiveQuestion(currentQ.difficulty, streak, answeredIds);
       
       // Replace the remaining queue with adapted questions
       setQuestions(prev => {
          const updated = [...prev];
          updated[currentIndex + 1] = nextQ;
          return updated;
       });
       setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFinish = async (finalScore: number, finalStreak: number) => {
    setIsFinished(true);
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, zIndex: 100 });
    
    // Save globally to ring
    markQuizComplete(finalScore);
    
    // Save Score
    if (auth && db) {
       try {
         const cred = await signInAnonymously(auth);
         await setDoc(doc(db, "quiz_scores", cred.user.uid), {
             score: finalScore,
             maxStreak: finalStreak,
             timestamp: serverTimestamp(),
             modules: 6
         }, { merge: true });
         setSavedLocally(true); // Firebase worked
       } catch (error) {
         console.warn("Anon Auth/Save failed. Check Firebase rules.", error);
       }
    } else {
        // Fallback Local Storage
        localStorage.setItem("AI_LAB_SCORE", finalScore.toString());
        setSavedLocally(true);
    }
  };

  const resetQuiz = () => {
     setQuestions(getInitialQuestions(10));
     setCurrentIndex(0);
     setScore(0);
     setStreak(0);
     setAnsweredIds([]);
     setSelectedOption(null);
     setIsEvaluating(false);
     setExplanation(null);
     setIsFinished(false);
  };

  if (questions.length === 0) return <div className="p-10 flex items-center justify-center text-[#39FF14] font-mono animate-pulse">BOOTING QUIZ ENGINE...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 mt-4 h-full relative">
       {/* Master Certificate Screen */}
       <AnimatePresence>
         {isFinished && (
            <motion.div 
               initial={{ opacity: 0, y: 50, scale: 0.9 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               className="absolute inset-0 z-50 bg-[#0e0e0e]/90 backdrop-blur-xl flex flex-col items-center justify-center pt-20"
            >
               <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#ffcc00]/50 rounded-2xl p-8 md:p-12 shadow-[0_0_50px_rgba(255,204,0,0.15)] flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,204,0,0.05)_25%,transparent_25%,transparent_50%,rgba(255,204,0,0.05)_50%,rgba(255,204,0,0.05)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />
                  
                  <Award size={80} className="text-[#ffcc00] drop-shadow-[0_0_15px_#ffcc00] mb-6 relative z-10" />
                  
                  <h1 className="font-['Space_Grotesk'] text-4xl md:text-5xl font-extrabold text-[#ffcc00] drop-shadow-[0_0_10px_rgba(255,204,0,0.5)] tracking-tight mb-2 relative z-10">
                     AI Search Master
                  </h1>
                  <p className="text-[#adaaaa] font-mono tracking-widest text-sm mb-8 relative z-10 uppercase">
                     Certificate of Completion • Unit 03
                  </p>

                  <div className="flex gap-12 mb-8 relative z-10">
                     <div className="text-center">
                        <p className="text-[10px] text-[#adaaaa] uppercase font-bold tracking-widest mb-1">Final Score</p>
                        <p className="text-3xl font-mono font-bold text-white">{score}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] text-[#adaaaa] uppercase font-bold tracking-widest mb-1">Max Streak</p>
                        <p className="text-3xl font-mono font-bold text-white">{streak}</p>
                     </div>
                  </div>

                  <div className="bg-[#131313] border border-white/10 rounded-lg p-3 text-xs font-mono text-[#8eff71] relative z-10 w-full mb-8">
                     {savedLocally ? "> Score recorded to global registry successfully." : "> Local session completed. Unregistered user."}
                  </div>

                  <button 
                     onClick={resetQuiz}
                     className="px-8 py-3 bg-[#ffcc00] text-black font-bold uppercase tracking-widest rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 relative z-10"
                  >
                     <RotateCcw size={16} /> Re-take Assessment
                  </button>
               </div>
            </motion.div>
         )}
       </AnimatePresence>


       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
         <div>
           <h1 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
             Adaptive <span className="text-[#39FF14] neon-text-primary text-shadow-none shadow-[#39FF14]">Quiz</span>
           </h1>
           <p className="text-[#adaaaa] text-sm md:text-base max-w-xl">
              Knowledge validation across Search, Minimax, CSPs, and Intelligent Agent architectures.
           </p>
         </div>
         <div className="flex items-center gap-6 bg-[#131313] p-3 rounded-xl border border-white/10 shadow-lg">
             <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-[#adaaaa] tracking-widest">Score</p>
                <p className="font-mono text-xl font-bold text-[#8eff71]">{score}</p>
             </div>
             <div className="text-right pl-4 border-l border-white/10">
                <p className="text-[10px] uppercase font-bold text-[#adaaaa] tracking-widest flex items-center justify-end gap-1"><Trophy size={10} className={streak >= 3 ? "text-[#ffcc00]" : ""} /> Streak</p>
                <p className="font-mono text-xl font-bold text-white">x{streak}</p>
             </div>
         </div>
       </div>

       {/* Progress Bar */}
       <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5 mx-2">
          <motion.div 
             className="h-full bg-[linear-gradient(90deg,#9900ce,#39FF14)]"
             initial={{ width: 0 }}
             animate={{ width: `${((currentIndex) / 10) * 100}%` }}
             transition={{ duration: 0.5 }}
          />
       </div>

       {/* Question Card */}
       <AnimatePresence mode="wait">
         <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl space-y-8"
         >
            <div className="flex justify-between items-start mb-4">
               <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full ${
                  currentQ.difficulty === 'easy' ? 'bg-[#8eff71]/20 text-[#8eff71]' : 
                  currentQ.difficulty === 'medium' ? 'bg-[#ffcc00]/20 text-[#ffcc00]' : 
                  'bg-[#ff3b30]/20 text-[#ff3b30]'
               }`}>
                  {currentQ.difficulty} ({currentQ.category})
               </span>
               <span className="font-mono text-[#adaaaa] text-sm font-bold opacity-50">
                  {currentIndex + 1} / 10
               </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight font-['Space_Grotesk']">
               {currentQ.text}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {currentQ.options.map((opt, idx) => {
                  let stateClass = "border-white/10 hover:border-[#39FF14]/50 hover:bg-[#39FF14]/5";
                  
                  if (isEvaluating) {
                     if (idx === currentQ.correctAnswer) {
                        stateClass = "border-[#39FF14] bg-[#39FF14]/10 text-white drop-shadow-[0_0_10px_rgba(57,255,20,0.3)]";
                     } else if (idx === selectedOption) {
                        stateClass = "border-[#ff3b30] bg-[#ff3b30]/10 opacity-70";
                     } else {
                        stateClass = "border-white/5 opacity-30 select-none";
                     }
                  }

                  return (
                     <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        disabled={isEvaluating}
                        className={`text-left p-4 rounded-xl border-2 transition-all duration-300 font-medium ${stateClass}`}
                     >
                        <span className="font-mono opacity-50 mr-4 text-xs">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                     </button>
                  );
               })}
            </div>

            {/* AI Explanation Area */}
            <AnimatePresence>
               {isEvaluating && selectedOption !== currentQ.correctAnswer && (
                  <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="bg-[#262626] rounded-xl overflow-hidden border border-[#d873ff]/30"
                  >
                     <div className="p-4 flex items-start gap-4">
                        <div className="p-2 bg-[#d873ff]/20 rounded-lg text-[#d873ff] hidden md:block">
                           <Brain size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h3 className="text-[#d873ff] font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                             Gemini Tutor Feedback
                             {isLoadingExplanation && <Loader2 size={12} className="animate-spin" />}
                           </h3>
                           <div className="text-[#adaaaa] text-sm leading-relaxed p-0 m-0">
                              {isLoadingExplanation ? (
                                <span className="animate-pulse">Analyzing logic and generating explanation...</span>
                              ) : (
                                explanation
                              )}
                           </div>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* Next Button */}
            {isEvaluating && (
               <div className="flex justify-end pt-4 border-t border-white/5">
                  <button 
                     onClick={nextQuestion}
                     className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                  >
                     {currentIndex === 9 ? "Finish Course!" : "Next Question"} <Play size={16} />
                  </button>
               </div>
            )}
         </motion.div>
       </AnimatePresence>
    </div>
  );
}
