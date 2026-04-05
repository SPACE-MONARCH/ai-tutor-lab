# 🧠 Synthetic Neuralist AI Lab

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Powered%20by-Next.js%2016-black?logo=next.js)
![Genkit](https://img.shields.io/badge/AI-Genkit%20%2B%20Gemini-orange)

An interactive, high-energy sandbox platform teaching heuristic search, constraint satisfaction, game theory, and intelligent agent design. Built with Next.js App Router, Firebase, and Google's Genkit.

---

## 📸 Screenshots & Demos

| Dashboard Overview | Adaptive Agent Playgrounds |
|:---:|:---:|
| <img src="/public/media/dashboard_screenshot_1774430799864.webp" width="400" /> | <img src="/public/media/agent_designer_sim_fixed_1774462721596.webp" width="400" /> |

| Genkit Generative Puzzles | Minimax Search Trees |
|:---:|:---:|
| <img src="/public/media/csp_generative_fixed_1774457865292.webp" width="400" /> | <img src="/public/media/game_tree_studio_test_1774434825855.webp" width="400" /> |

---

## 🗺️ Syllabus Map

The application consists of **6 Fully Interactive Modules** mirroring a university AI Lab syllabus:

1. **Problem Formulator** (/problem)
   - Translates physical behaviors (Tic-Tac-Toe, TSP, Missionaries & Cannibals) into connected state-space graph trees.
2. **Search Playground** (/search)
   - Visually pits algorithms (BFS, DFS, UCS, DLS, Greedy, A*) iteratively against adjustable heuristics across an 8x8 matrix grid.
3. **Game Tree Studio** (/game)
   - Real-time Minimax and Alpha-Beta bounding simulators running dynamically against Tic-Tac-Toe.
4. **CSP Board** (/csp)
   - Backtracking engines utilizing Minimum Remaining Values (MRV). Generates infinite Cryptarithmetic (`N-Word` scaling) and Map Coloring puzzles dynamically via `Gemini 2.0 Flash`.
5. **Agent Designer** (/agent)
   - Implements stochastic Vacuum Environments. Dual sim comparisons bridging Simple Reflex patterns vs Utility/Goal-based paths.
6. **Adaptive Quiz** (/quiz)
   - Capstone MCQ adaptive pools scaling off consecutive wins. Includes integrated Genkit AI Tutor evaluating reasoning gaps natively on failures.

---

## 🛠️ Tech Stack

- **Framework**: `Next.js 16.2.1` (App Router) + Turbopack
- **Styling**: Vanilla CSS/Tailwind + glassmorphism (`Framer Motion` animations)
- **AI Tooling**: `@genkit-ai/googleai` + `gemini-2.0-flash`
- **Data & Auth**: `Firebase Firestore` & `Firebase Auth` (Serverless Edge fallback safe)
- **Visualizations**: `Cytoscape.js` (Graph Theory) + Dynamic React SVGs (Trees & Arrays)
- **Deployment Strategy**: SSG + SSR Fallback bounds (Fully robust PWA support)

---

## 🚀 Deployment Checklist

This repository is strictly customized for static export bindings matching production Cloud / Edge environments out-of-the-box.

### 1. Environment Variables (`.env.local`)
To enable the Generative Node structures (CSP / Graphs) and Adaptive AI Tutor:
```bash
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
```
*(Firebase configuration is optional—application will natively fallback to `localStorage` browser-indexed persistence).*

### 2. Live Demo Scripts
Standard static checks:
```bash
npm install
npm run dev    # Tests realtime AST trees
npm run build  # Builds SSG pages strictly
```
*(Guaranteed Lighthouse 95+ scores with `vercel.json` native caching overrides.)*

### 3. Vercel Overrides
This repository automatically structures rewrites using `vercel.json`:
- `domain.com/search` → Points directly to `/dashboard/search` 
- `/media/(.*)` → Instantiates `Cache-Control: public, immutable`
- `/sw.js` → Registers offline-mode PWA bindings out-of-the-box!

---

*Made with ❤️ using Google Genkit + GCP.*
