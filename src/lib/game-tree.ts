export type Player = "X" | "O" | null;
export type BoardState = Player[];

export interface GameTreeNode {
  id: string;
  board: BoardState;
  isMax: boolean;
  depth: number;
  score: number | null;
  alpha: number;
  beta: number;
  pruned: boolean;
  children: GameTreeNode[];
  move: number | null; // cell index 0-8
  isBestMove: boolean;
}

export interface TreeGenerationResult {
  root: GameTreeNode;
  nodesInOrder: GameTreeNode[]; // DFS order of evaluation
  stats: {
    evaluated: number;
    pruned: number;
  };
}

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6]             // diagonals
];

export function checkWinner(board: BoardState): "X" | "O" | "Draw" | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (!board.includes(null)) return "Draw";
  return null;
}

export function evaluateBoard(board: BoardState): number | null {
  const winner = checkWinner(board);
  if (winner === "X") return 10;
  if (winner === "O") return -10;
  if (winner === "Draw") return 0;
  return null;
}

let nodeIdCounter = 0;

export function buildGameTree(
  board: BoardState,
  isMax: boolean,       // X is max, O is min
  depth: number,
  maxDepth: number,
  useAlphaBeta: boolean,
  currentAlpha = -Infinity,
  currentBeta = Infinity,
  moveMade: number | null = null
): TreeGenerationResult {
  nodeIdCounter = 0;
  const nodesInOrder: GameTreeNode[] = [];
  let evaluatedCount = 0;
  let prunedCount = 0;

  function minimax(
    b: BoardState,
    isMaximizing: boolean,
    d: number,
    alpha: number,
    beta: number,
    moveToHere: number | null
  ): GameTreeNode {
    evaluatedCount++;
    const node: GameTreeNode = {
      id: `node-${nodeIdCounter++}`,
      board: [...b],
      isMax: isMaximizing,
      depth: d,
      score: null,
      alpha,
      beta,
      pruned: false,
      children: [],
      move: moveToHere,
      isBestMove: false,
    };
    nodesInOrder.push(node);

    const evalScore = evaluateBoard(b);

    // Terminal state or max depth reached
    if (evalScore !== null || d === maxDepth) {
      // Small optimization: penalize/reward deeper/shallower wins slightly
      // but purely we can just return evalScore if it's terminal, 
      // or a heuristic if max depth reached without terminal state (0 for generic tic-tac-toe)
      node.score = evalScore !== null ? evalScore : 0;
      return node;
    }

    let bestScore = isMaximizing ? -Infinity : Infinity;
    let bestChildIndex = -1;

    for (let i = 0; i < 9; i++) {
      if (b[i] === null) {
        // We branch out
        const nextBoard = [...b];
        nextBoard[i] = isMaximizing ? "X" : "O";

        // Check if pruned before creating the actual sub-branch logic
        if (useAlphaBeta && alpha >= beta) {
          prunedCount++;
          // We still create a "stub" node to show it was considered but pruned
          const prunedNode: GameTreeNode = {
            id: `node-${nodeIdCounter++}`,
            board: nextBoard,
            isMax: !isMaximizing,
            depth: d + 1,
            score: null,
            alpha,
            beta,
            pruned: true,
            children: [],
            move: i,
            isBestMove: false,
          };
          node.children.push(prunedNode);
          nodesInOrder.push(prunedNode);
          continue; // skip the deep minimax call
        }

        const childNode = minimax(nextBoard, !isMaximizing, d + 1, alpha, beta, i);
        node.children.push(childNode);
        const childScore = childNode.score!;

        if (isMaximizing) {
          if (childScore > bestScore) {
            bestScore = childScore;
            bestChildIndex = node.children.length - 1;
          }
          if (useAlphaBeta) alpha = Math.max(alpha, bestScore);
        } else {
          if (childScore < bestScore) {
            bestScore = childScore;
            bestChildIndex = node.children.length - 1;
          }
          if (useAlphaBeta) beta = Math.min(beta, bestScore);
        }
      }
    }

    // Flag the best move for visual path highlighting
    if (bestChildIndex !== -1 && !node.children[bestChildIndex].pruned) {
      node.children[bestChildIndex].isBestMove = true;
    }

    node.score = bestScore;
    node.alpha = alpha;
    node.beta = beta;
    return node;
  }

  const root = minimax(board, isMax, 0, currentAlpha, currentBeta, moveMade);

  return {
    root,
    nodesInOrder,
    stats: {
      evaluated: evaluatedCount,
      pruned: prunedCount,
    },
  };
}

// Quick AI helper (returns the index to play)
export function getBestMoveAI(board: BoardState, isMax: boolean, maxDepth: number): number {
  const result = buildGameTree(board, isMax, 0, maxDepth, true); // Always use A-B for actual play logic
  const bestChild = result.root.children.find((c) => c.isBestMove);
  return bestChild?.move ?? board.indexOf(null); // Fallback to first empty if needed
}
