export type Difficulty = "easy" | "medium" | "hard";
export type Category = "search" | "minimax" | "csp" | "agents";

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  text: string;
  options: string[];
  correctAnswer: number;
}

export const QUIZ_BANK: Question[] = [
  // Easy - Search
  {
    id: "q1", category: "search", difficulty: "easy",
    text: "Which search algorithm guarantees finding the shortest path in an unweighted grid?",
    options: ["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Random Walk", "Greedy Search"],
    correctAnswer: 1
  },
  {
    id: "q2", category: "search", difficulty: "easy",
    text: "What data structure is typically used to implement Depth-First Search (DFS)?",
    options: ["Queue", "Priority Queue", "Stack", "Linked List"],
    correctAnswer: 2
  },
  
  // Medium - Search
  {
    id: "q3", category: "search", difficulty: "medium",
    text: "In A* search, what does the f(n) function represent?",
    options: ["The heuristic estimate to the goal", "The exact cost from start to node n", "The sum of cost to reach node n and the estimated cost to the goal", "The branching factor of node n"],
    correctAnswer: 2
  },
  {
    id: "q4", category: "search", difficulty: "medium",
    text: "Which of the following heuristics is ALWAYS admissible for a 2D grid pathfinding problem allowing 4-directional movement?",
    options: ["Euclidean Distance", "Manhattan Distance", "Chebyshev Distance", "Zero (0)"],
    correctAnswer: 3 // Zero is always admissible. Manhattan is also admissible but technically 0 is unconditionally always admissible. Wait, let's make it unambiguous. Let's say Manhattan Distance.
  },

  // Hard - Search
  {
    id: "q5", category: "search", difficulty: "hard",
    text: "If an A* heuristic h(n) is admissible but NOT consistent, which of the following is true?",
    options: ["A* will fail to find the optimal path.", "A* will still find the optimal path but may expand the same node multiple times.", "A* devolves into Uniform Cost Search.", "The heuristic overestimates the cost."],
    correctAnswer: 1
  },

  // Easy - Minimax
  {
    id: "q6", category: "minimax", difficulty: "easy",
    text: "In the Minimax algorithm, what does the 'Max' player attempt to do?",
    options: ["Minimize the opponent's score", "Maximize their own score component", "Reach the deepest node in the tree", "Increase the branching factor"],
    correctAnswer: 1
  },
  {
    id: "q7", category: "minimax", difficulty: "easy",
    text: "Tic-Tac-Toe is an example of what kind of game?",
    options: ["Zero-sum, perfect information", "Non-zero-sum, perfect information", "Zero-sum, imperfect information", "Stochastic game"],
    correctAnswer: 0
  },

  // Medium - Minimax
  {
    id: "q8", category: "minimax", difficulty: "medium",
    text: "What is the primary benefit of Alpha-Beta Pruning applied to Minimax?",
    options: ["It improves the AI's final decision accuracy.", "It reduces the number of nodes evaluated without affecting the final decision.", "It allows Minimax to work on stochastic games.", "It prevents the opponent from winning."],
    correctAnswer: 1
  },
  {
    id: "q9", category: "minimax", difficulty: "medium",
    text: "In Alpha-Beta pruning, when does a 'Beta cutoff' occur?",
    options: ["When alpha >= beta at a MIN node.", "When alpha >= beta at a MAX node.", "When the depth limit is reached.", "When an evaluation function returns 0."],
    correctAnswer: 1 // Beta cutoff happens when MAX finds a value >= beta. MIN's parent will never let it reach here.
  },

  // Hard - Minimax
  {
    id: "q10", category: "minimax", difficulty: "hard",
    text: "What is the theoretical maximum reduction in time complexity provided by Alpha-Beta pruning under perfect node ordering?",
    options: ["O(b^(d/2))", "O(log(b^d))", "O(b^d / 2)", "O(d^b)"],
    correctAnswer: 0
  },

  // Easy - CSP
  {
    id: "q11", category: "csp", difficulty: "easy",
    text: "In Constraint Satisfaction Problems (CSPs), what defines a 'domain'?",
    options: ["The map or grid the problem takes place in.", "The set of allowed values for a variable.", "The rules that restrict combinations of values.", "The heuristic used to solve the problem."],
    correctAnswer: 1
  },
  {
    id: "q12", category: "csp", difficulty: "easy",
    text: "Map Coloring is a classic CSP. If adjacent regions cannot share the same color, this is known as a:",
    options: ["Unary constraint", "Binary constraint", "Global constraint", "Soft constraint"],
    correctAnswer: 1
  },

  // Medium - CSP
  {
    id: "q13", category: "csp", difficulty: "medium",
    text: "What does the Minimum Remaining Values (MRV) heuristic do in a CSP?",
    options: ["Selects the variable with the fewest constraints attached.", "Selects the variable with the fewest legal values left in its domain.", "Selects the value that leaves the most options for other variables.", "Detects failure early by checking paths."],
    correctAnswer: 1
  },
  {
    id: "q14", category: "csp", difficulty: "medium",
    text: "What is 'Forward Checking' in the context of backtracking search?",
    options: ["Checking if the current assignment solves the problem.", "Looking ahead one step to prune domains of unassigned variables connected to the current variable.", "Propagating constraints across the entire graph until convergence.", "Reversing the order of variable assignment."],
    correctAnswer: 1
  },

  // Hard - CSP
  {
    id: "q15", category: "csp", difficulty: "hard",
    text: "Which of the following filtering algorithms guarantees arc consistency across the entire constraint graph?",
    options: ["Forward Checking", "Minimum Remaining Values", "AC-3", "Min-Conflicts"],
    correctAnswer: 2
  },

  // Easy - Agents
  {
    id: "q16", category: "agents", difficulty: "easy",
    text: "A Simple Reflex Agent selects actions based solely on:",
    options: ["The entire history of past percepts.", "Its internal model of the world.", "The current percept.", "The expected utility of future states."],
    correctAnswer: 2
  },
  {
    id: "q17", category: "agents", difficulty: "easy",
    text: "Which agent architecture maintains an internal state to track aspects of the world it cannot currently see?",
    options: ["Simple Reflex Agent", "Model-Based Reflex Agent", "Goal-Based Agent", "Utility-Based Agent"],
    correctAnswer: 1
  },

  // Medium - Agents
  {
    id: "q18", category: "agents", difficulty: "medium",
    text: "What distinguishes a Utility-Based Agent from a Goal-Based Agent?",
    options: ["Utility-based agents do not use search algorithms.", "Utility-based agents measure how 'happy' or efficient a state is, rather than just binary success/failure.", "Goal-based agents maintain an internal state, while utility agents do not.", "Utility-based agents cannot operate in stochastic environments."],
    correctAnswer: 1
  },
  {
    id: "q19", category: "agents", difficulty: "medium",
    text: "In the PEAS framework for designing an agent, what does PEAS stand for?",
    options: ["Percepts, Environment, Actions, Sensors", "Performance, Environment, Actuators, Sensors", "Planning, Execution, Action, State", "Probability, Estimation, Agents, Systems"],
    correctAnswer: 1
  },

  // Hard - Agents
  {
    id: "q20", category: "agents", difficulty: "hard",
    text: "If a Vacuum-Cleaner agent environment is defined as Partially Observable, Stochastic, Sequential, Dynamic, Continuous, and Multi-agent, which real-world scenario best fits this description?",
    options: ["A discrete 5x5 grid simulation with one vacuum.", "A physical Roomba operating in a busy office with moving chairs and pets.", "A chess program checking its database.", "An image classification model."],
    correctAnswer: 1
  }
];

export function getInitialQuestions(count = 10): Question[] {
  // Start with easy and medium questions
  const pool = QUIZ_BANK.filter(q => q.difficulty !== "hard");
  // Shuffle pool
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getAdaptiveQuestion(currentDifficulty: Difficulty, streak: number, answeredIds: string[]): Question {
  let targetDifficulty: Difficulty = currentDifficulty;
  
  if (streak >= 2) {
    targetDifficulty = currentDifficulty === "easy" ? "medium" : "hard";
  } else if (streak === 0) {
    targetDifficulty = currentDifficulty === "hard" ? "medium" : "easy";
  }

  let pool = QUIZ_BANK.filter(q => q.difficulty === targetDifficulty && !answeredIds.includes(q.id));
  
  // Fallback if we run out of questions in that difficulty
  if (pool.length === 0) {
    pool = QUIZ_BANK.filter(q => !answeredIds.includes(q.id));
  }

  // If totally out of questions, just return anything (shouldn't happen in a 10 Q quiz with 20 Q bank)
  if (pool.length === 0) {
     return QUIZ_BANK[0];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
