"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Search,
  GitBranch,
  LayoutGrid,
  Bot,
  HelpCircle,
  ArrowRight,
  Lock,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useLabProgress } from "@/lib/progress";

/* ── Module data ── */
interface LabModule {
  id: number;
  title: string;
  icon: React.ElementType;
  description: string;
  image: string;
  status: "completed" | "in-progress" | "resume" | "locked" | "timed-lock";
  xp: string;
  scholars?: string;
  progress?: number;         // 0-1
  lockMessage?: string;
  href?: string;
  videoHover?: string;
}

const MODULES: LabModule[] = [
  {
    id: 1,
    title: "Problem Formulator",
    icon: Brain,
    description:
      "Learn to translate real-world challenges into state-space abstractions.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCUN8G6aE_RF8laM4v_JVlpNGQs90iiHflUAvatoZwEtS1BKnz1KTPnnQBFjpLa0Oy-8uZioBUM6ft-iuVommz8UL0qfacs0VAbmeeFonpDQRaz5LBGOdDJcK5aWFqXj3veJi7Sy199OwP27D5sUlhV6iF3e1EbohSuBeVcTEAReSmCIuHk7-SFzzRvaeUxXId0vzigScpT0PJOWkFEarV1KyIrHx8j4z0mdNNf8gf0Dgp9WYi6qMc5jQks3PiNzYWfGeiO9_UqPA",
    status: "in-progress",
    xp: "3/3 XP",
    scholars: "1.2k Scholars",
    href: "/dashboard/problem",
    videoHover: "/media/sidebar_collapse_1774467854498.webp",
  },
  {
    id: 2,
    title: "Search Playground",
    icon: Search,
    description:
      "Visualize BFS, DFS, and A* algorithms traversing complex grid worlds.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7-WMKOu6NcQ_YOzawJp2oUNdhMjA8Pm-2K5gN4IP8-CeldItimSodZ4ZR200X8blG74cTwPmy0aVfDvv_uE5I4oU4t3GOpTwLqLMupbE-sIRXHyg_bTCtMbOHB-AawqVR83Btr6vWajIxJ6baklFDOlFuT2u5SB9Z0pWXkwG_Rzq-NcI_J3Bz61qXoYgQ1_u1QdIByQpwulJx1CAYp429KpPbNn6seUWZP-2WRJ4mYD2W6MVJqGeMpBoyJOtvIIQf-yrtw72mDQ",
    status: "in-progress",
    xp: "0/3 XP",
    progress: 0.66,
    href: "/dashboard/search",
    videoHover: "/media/search_playground_test_1774432423091.webp",
  },
  {
    id: 3,
    title: "Game Tree Studio",
    icon: GitBranch,
    description:
      "Master Minimax and Alpha-Beta pruning in competitive environments.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBRHxcfFE-PC8ibc3aUt7cynMQm8SluTY4_QQRbx9WHjOE4Hp-NvusiKEJUiXFqASzRbgojHQ5t33_hNqGvBED1EIwtKKUPMCbehDW86UkzMLk37Ttwt7ixgjMYiYOsej3h-gHQT-Kqzdbi1zI7VK-ba7dnGrHN6CpS9R8q3dVBLuwwyLrQhxi4JO_4XifhnIuIsacCRkYeM5N46zSSKK86eg6F0Vxuhz56S1EZpzFu-VLty6MuXe7GIZqNsnbOSCvn0U76BggW2w",
    status: "resume",
    xp: "",
    href: "/dashboard/game",
    videoHover: "/media/game_tree_studio_test_1774434825855.webp",
  },
  {
    id: 4,
    title: "CSP Board",
    icon: LayoutGrid,
    description:
      "Solve map coloring and Sudoku using constraint satisfaction heuristics.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDy4rqGux_JIMA-0WScpiPBhq4kz_4p-92pq-bmnG_LoU9RHFhvsSYU2-FpDotOW22Vjg04MidLi7beBZqIs7I0xC5xEvwCbfvmdcOe5WD0RyomBvmXU2gDfQaqX6I-dxJ60RR6DRJ3kgrv90dOh6gnreE5QzrSc3TjukkFohhaUPyQPrSGE9qcYck2dta9cWcmW-DT5uG47hOH51hP9YH6ObE2b_6Pk9vo8wNbPLrZ1CBrDOK7ASJN6g4_eedoXRjXAXAodemz9w",
    status: "resume",
    xp: "0/3 XP",
    href: "/dashboard/csp",
    videoHover: "/media/csp_generative_fixed_1774457865292.webp",
  },
  {
    id: 5,
    title: "Agent Designer",
    icon: Bot,
    description:
      "Program simple reflex and goal-based agents for vacuum environments.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnosqPnaLlzXw7ClDswiU2ZKs6O3H7QRey0O5n3pdWaJbiBB9fhXA9BUu4LKwg2rdvccH7qnu21v9KVRpq-dY7VwWOsQhF5eLKnYp-oJK2TyX_Wk_APTwOIWhp5MJAIEU12-Z2m4BsrFkSS0oFQw8QxuUbcfsVTh6cjzoSGF3dlYlrUd2MBuwMZl36KJhwHT1XTwCA-MJvVivrN1t6FMHASNF9BFzE8ERO_qnHDD9cVB3kQjjpRz5hhtBS1szx7v2MP5TN8g54sQ",
    status: "in-progress",
    xp: "0/3 XP",
    href: "/dashboard/agent",
    videoHover: "/media/agent_designer_sim_fixed_1774462721596.webp",
  },
  {
    id: 6,
    title: "Adaptive Quiz",
    icon: HelpCircle,
    description:
      "Test your neural retention with evolving difficulty algorithms.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAhbGR2yq8V1pcGeSMj6gE8FW8-KaQ_xQJW9MXDctFjNCpZUQCmf88GvIrj8SGjPKB25Joh8ijA65L5Gt0oYyilauTzY55XEVjfsQYLh3nmpAF8pacIogsJ9icStN55MzhE5DQeakNBBQ_3vc_DiDzsr9oa1AjNS6JMo0g_2RdsOmqTbEl517GMKYmPrKVZmHwkoP1gYmuY-z5mChyb-QR0x7NyZ20V9MVOvs5Fz9LYqpcgO2o1faYH-0Yjdt2HPO_8EhyrL_dtyA",
    status: "in-progress",
    xp: "0/3 XP",
    href: "/dashboard/quiz",
    videoHover: "/media/adaptive_quiz_flow_1774463744837.webp",
  },
];

/* ── Animation variants ── */
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

/* ── Module Card Footer ── */
function CardFooter({ mod }: { mod: LabModule }) {
  switch (mod.status) {
    case "completed":
      return (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full border border-[#0e0e0e] bg-[#8eff71]/20" />
              <div className="w-6 h-6 rounded-full border border-[#0e0e0e] bg-[#8eff71]/40" />
            </div>
            <span className="text-[10px] font-medium text-[#adaaaa]">
              {mod.scholars}
            </span>
          </div>
          <div className="relative group/xp cursor-help ml-2">
            <span className="text-xs font-bold text-[#8eff71] whitespace-nowrap">
              {mod.xp}
            </span>
            <div className="opacity-0 w-max group-hover/xp:opacity-100 absolute bottom-full right-0 mb-2 px-2 py-1 bg-[#0a0a0a] border border-white/10 text-[#adaaaa] text-[10px] font-mono rounded pointer-events-none transition-opacity z-20">
              Total XP earned: {mod.xp}
            </div>
          </div>
        </div>
      );

    case "in-progress":
      return (
        <div className="flex items-center justify-between mt-4">
          {mod.progress !== undefined ? (
            <div className="w-full bg-[#131313] h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#8eff71] h-full transition-all duration-500"
                style={{ width: `${mod.progress * 100}%` }}
              />
            </div>
          ) : (
            <div className="flex gap-1">
              {[0, 1, 2].map((d) => (
                <div
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-white/10"
                />
              ))}
            </div>
          )}
          <div className="relative group/xp cursor-help ml-4">
            <span className="text-xs font-bold text-[#8eff71] whitespace-nowrap">
              {mod.xp}
            </span>
            <div className="opacity-0 w-max group-hover/xp:opacity-100 absolute bottom-full right-0 mb-2 px-2 py-1 bg-[#0a0a0a] border border-white/10 text-[#adaaaa] text-[10px] font-mono rounded pointer-events-none transition-opacity z-20">
              XP rewarded upon completion
            </div>
          </div>
        </div>
      );

    case "resume":
      return (
        <button className="w-full mt-4 py-2 bg-[#262626] border border-white/10 rounded-lg text-xs font-bold hover:bg-white/5 transition-colors uppercase tracking-widest">
          Resume Session
        </button>
      );

    case "locked":
      return (
        <button className="w-full mt-4 py-2 bg-[#262626] border border-white/10 rounded-lg text-xs font-bold hover:bg-white/5 transition-colors uppercase tracking-widest text-[#adaaaa]">
          {mod.lockMessage}
        </button>
      );

    case "timed-lock":
      return (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs font-bold text-[#adaaaa] italic">
            {mod.lockMessage}
          </span>
          <Lock size={16} className="text-[#adaaaa]" />
        </div>
      );
  }
}

/* ── Dashboard Page ── */
export default function DashboardPage() {
  const router = useRouter();
  const { progress } = useLabProgress();

  return (
    <>
      {/* ── Hero Section ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 relative overflow-hidden rounded-2xl bg-[#131313] border border-white/5 p-8 md:p-12"
      >
        {/* Background artwork */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-[#8eff71]/20 to-transparent" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Neural Network Pattern"
            className="w-full h-full object-cover grayscale brightness-50"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5r0257xL-M6ADeAp6shgCLdQZTcZVPqngP8MhtvrmEzNZjOQ1IEubvaOm60dYlB31NCOOaRQ8PN6lysvJzMal3OybwZ3oLg49Xjx-21iWmrh61NLTmgljEV2wCC7ec0bBo0HgKrOXCnMK30AxMhqZHQYMIY4JLXymnjp9Ol4syUMb_w-nSvKqfRztmoJYDKsNAfDVy_Pa2-aZD27ssY-md_yF2Aq174v_2CdR40L6EwiL7jfv5P_Cfq_pzyDGX6d2YXo2vcqQ8Q"
          />
        </div>

        <div className="relative z-10 max-w-2xl">
          {/* Active badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8eff71]/10 border border-[#8eff71]/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#8eff71] animate-pulse" />
            <span className="text-[10px] font-bold text-[#8eff71] uppercase tracking-widest">
              Core Directive Active
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-headline)] text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Master the{" "}
            <span className="text-[#8eff71] neon-text-primary">
              Synthetic Mind
            </span>
          </h1>
          <p className="text-[#adaaaa] text-lg mb-8 max-w-lg">
            Dive into a high-energy sandbox of heuristic search, constraint
            satisfaction, and agent design. Build the future, one node at a
            time.
          </p>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const nextModule = MODULES.find(m => {
                 let s = m.status;
                 if (progress?.modules) {
                    const id = m.id;
                    const val = id === 1 ? progress.modules.problem :
                                id === 2 ? progress.modules.search :
                                id === 3 ? progress.modules.game :
                                id === 4 ? progress.modules.csp :
                                id === 5 ? progress.modules.agent :
                                id === 6 ? progress.modules.quiz : 0;
                    s = val === 1 ? "completed" : "in-progress";
                 }
                 return s !== "completed";
              });
              router.push(nextModule?.href || "/dashboard/quiz");
              console.log("Click CTA Start Learning");
            }}
            className="group relative px-8 py-4 bg-[#8eff71] text-[#0d6100] font-bold rounded-xl overflow-hidden transition-all neon-glow-primary"
          >
            <span className="relative z-10 flex items-center gap-2">
              START LEARNING
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </span>
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.button>
        </div>
      </motion.section>

      {/* ── Bento Grid ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {MODULES.map((baseMod) => {
          const Icon = baseMod.icon;
          let calculatedStatus = baseMod.status;
          let calculatedProgress = baseMod.progress;

          if (progress && progress.modules) {
            const val =
              baseMod.id === 1 ? progress.modules.problem :
              baseMod.id === 2 ? progress.modules.search :
              baseMod.id === 3 ? progress.modules.game :
              baseMod.id === 4 ? progress.modules.csp :
              baseMod.id === 5 ? progress.modules.agent :
              baseMod.id === 6 ? progress.modules.quiz : 0;
            
            calculatedProgress = val;
            calculatedStatus = val === 1 ? "completed" : "in-progress";
          }
          
          const mod = { ...baseMod, progress: calculatedProgress, status: calculatedStatus };

          return (
            <motion.div
              key={mod.id}
              variants={cardVariant}
              onClick={() => {
                if (mod.href) {
                  router.push(mod.href);
                  console.log(`Click module ${mod.title}`);
                }
              }}
              whileTap={{ scale: 0.98 }}
              className={`group relative bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5 transition-all duration-500 flex flex-col h-[340px] ${
                mod.href ? "cursor-pointer hover:border-[#8eff71]/30 hover:shadow-[0_0_20px_rgba(142,255,113,0.15)]" : ""
              }`}
            >
              {/* Image area */}
              <div className="h-40 bg-[#262626] relative overflow-hidden">
                {mod.videoHover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mod.videoHover} alt="Visual Demo" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 z-10" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={mod.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-20"
                  src={mod.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent z-10 pointer-events-none" />
                <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-[#8eff71]">
                  MODULE {String(mod.id).padStart(2, "0")}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-[family-name:var(--font-headline)] text-xl font-bold text-white">
                      {mod.title}
                    </h3>
                    <Icon size={22} className="text-[#8eff71]" />
                  </div>
                  <p className="text-sm text-[#adaaaa] line-clamp-2">
                    {mod.description}
                  </p>
                </div>

                <CardFooter mod={mod} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
}
