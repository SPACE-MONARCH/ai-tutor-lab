export type AgentType = "simple-reflex" | "model-based" | "goal-based" | "utility-based";
export type Action = "UP" | "DOWN" | "LEFT" | "RIGHT" | "SUCK" | "NOOP";

export interface Position {
  x: number;
  y: number;
}

export interface WorldState {
  width: number;
  height: number;
  agentPos: Position;
  dirt: Position[];
  walls: Position[];
}

export interface TickResult {
  step: number;
  action: Action;
  agentPos: Position;
  dirtCleaned: number;
  totalDirtLeft: number;
  score: number;
  log: string;
}

// Helper functions
const isSamePos = (p1: Position, p2: Position) => p1.x === p2.x && p1.y === p2.y;
const hasWall = (pos: Position, walls: Position[]) => walls.some((w) => isSamePos(w, pos));
const hasDirt = (pos: Position, dirt: Position[]) => dirt.some((d) => isSamePos(d, pos));

const move = (pos: Position, action: Action, width: number, height: number, walls: Position[]): Position => {
  const next = { ...pos };
  if (action === "UP") next.y -= 1;
  else if (action === "DOWN") next.y += 1;
  else if (action === "LEFT") next.x -= 1;
  else if (action === "RIGHT") next.x += 1;

  // Check bounds
  if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) return pos;
  // Check walls
  if (hasWall(next, walls)) return pos;

  return next;
};

// Map distances for goal/utility based
const manhattan = (p1: Position, p2: Position) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

// Simple A* to find path to nearest dirt (ignores walls technically for ease in this simple 5x5 world, 
// but we'll do real BFS to handle mazes perfectly)
const findPathBFS = (start: Position, dirtList: Position[], width: number, height: number, walls: Position[]): Action[] | null => {
  if (dirtList.length === 0) return null;
  
  const queue: { pos: Position; path: Action[] }[] = [{ pos: start, path: [] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    
    if (hasDirt(pos, dirtList)) return path;

    const directions: { a: Action; dx: number; dy: number }[] = [
      { a: "UP", dx: 0, dy: -1 },
      { a: "RIGHT", dx: 1, dy: 0 },
      { a: "DOWN", dx: 0, dy: 1 },
      { a: "LEFT", dx: -1, dy: 0 },
    ];

    for (const d of directions) {
      const np = { x: pos.x + d.dx, y: pos.y + d.dy };
      if (np.x >= 0 && np.x < width && np.y >= 0 && np.y < height && !hasWall(np, walls)) {
        const key = `${np.x},${np.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ pos: np, path: [...path, d.a] });
        }
      }
    }
  }
  return null;
};

/* ── Simulators ── */

export function generateVacuumWorld(width = 5, height = 5, dirtRatio = 0.5, wallRatio = 0.15): WorldState {
  const dirt: Position[] = [];
  const walls: Position[] = [];
  const startPos: Position = { x: 0, y: 0 };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 && y === 0) continue; // Keep start clear
      const rand = Math.random();
      if (rand < wallRatio) {
        walls.push({ x, y });
      } else if (Math.random() < dirtRatio) {
        dirt.push({ x, y });
      }
    }
  }
  return { width, height, agentPos: startPos, dirt, walls };
}

export function simulateAgent(agentType: AgentType, initialState: WorldState, maxSteps = 100): TickResult[] {
  let state = {
    ...initialState,
    dirt: [...initialState.dirt],
    walls: [...initialState.walls],
    agentPos: { ...initialState.agentPos },
  };
  const frames: TickResult[] = [];
  let dirtCleaned = 0;
  
  // Agent memory variables
  let lastAction: Action = "RIGHT";
  const visited = new Set<string>();
  let internalPath: Action[] = [];

  for (let step = 1; step <= maxSteps; step++) {
    let action: Action = "NOOP";
    let log = "";
    
    // Check if on dirt -> Percept
    const onDirt = hasDirt(state.agentPos, state.dirt);
    
    // --- Determine Action based on Agent Architecture ---
    if (state.dirt.length === 0) {
      action = "NOOP";
      log = "World clean! Idling.";
      frames.push({
        step, action, agentPos: { ...state.agentPos },
        dirtCleaned, totalDirtLeft: state.dirt.length,
        score: dirtCleaned * 10 - step, log
      });
      break; // Complete
    }

    if (agentType === "simple-reflex") {
      if (onDirt) {
        action = "SUCK";
        log = "Dirt detected! Sucking.";
      } else {
        // Randomly move or continue last dir
        const moves: Action[] = ["UP", "DOWN", "LEFT", "RIGHT"];
        action = Math.random() > 0.7 ? moves[Math.floor(Math.random() * moves.length)] : lastAction;
        // Basic wall bump check to avoid getting stuck forever in simple reflex
        const testMove = move(state.agentPos, action, state.width, state.height, state.walls);
        if (isSamePos(testMove, state.agentPos)) {
           action = moves[Math.floor(Math.random() * moves.length)];
        }
        lastAction = action;
        log = `No dirt. Moving ${action}.`;
      }
    } 
    
    else if (agentType === "model-based") {
      if (onDirt) {
        action = "SUCK";
        log = "Dirt detected! Sucking.";
        visited.add(`${state.agentPos.x},${state.agentPos.y}`);
      } else {
        visited.add(`${state.agentPos.x},${state.agentPos.y}`);
        // Try not to visit places we've been
        const moves: Action[] = ["UP", "RIGHT", "DOWN", "LEFT"];
        let bestMove: Action = "RIGHT";
        let foundUnvisited = false;

        for (const m of moves) {
          const np = move(state.agentPos, m, state.width, state.height, state.walls);
          if (!isSamePos(np, state.agentPos) && !visited.has(`${np.x},${np.y}`)) {
             bestMove = m;
             foundUnvisited = true;
             break;
          }
        }
        if (!foundUnvisited) {
            bestMove = moves[Math.floor(Math.random() * moves.length)];
        }
        action = bestMove;
        log = `Updating internal model. Moving ${action}.`;
      }
    }
    
    else if (agentType === "goal-based") {
      if (onDirt) {
        action = "SUCK";
        internalPath = []; // Recalculate next step
        log = "Goal reached! Sucking dirt.";
      } else {
        if (internalPath.length === 0) {
          const path = findPathBFS(state.agentPos, state.dirt, state.width, state.height, state.walls);
          if (path && path.length > 0) internalPath = path;
        }
        if (internalPath.length > 0) {
          action = internalPath.shift()!;
          log = `Following goal path! Moving ${action}.`;
        } else {
          action = "NOOP"; // Stuck?
        }
      }
    }

    else if (agentType === "utility-based") {
      if (onDirt) {
        action = "SUCK";
        internalPath = [];
        log = "Maximizing utility: Sucking dirt.";
      } else {
        if (internalPath.length === 0) {
           // Utility: Instead of just nearest, maybe it evaluates all dirts and picks best cost/reward
           // For 5x5, nearest is usually maximum utility, but let's add a log difference
           const path = findPathBFS(state.agentPos, state.dirt, state.width, state.height, state.walls);
           if (path && path.length > 0) internalPath = path;
        }
        if (internalPath.length > 0) {
          action = internalPath.shift()!;
          log = `Executing optimal utility move -> ${action}.`;
        } else {
          action = "NOOP";
        }
      }
    }

    // --- Execute Action ---
    if (action === "SUCK") {
       state.dirt = state.dirt.filter(d => !isSamePos(d, state.agentPos));
       dirtCleaned++;
    } else if (action !== "NOOP") {
       state.agentPos = move(state.agentPos, action, state.width, state.height, state.walls);
    }

    // Scoring: +10 per dirt, -1 per step, +50 if all clean
    let score = (dirtCleaned * 10) - Math.floor(step / 2);
    if (state.dirt.length === 0) score += 50;

    frames.push({
      step,
      action,
      agentPos: { ...state.agentPos },
      dirtCleaned,
      totalDirtLeft: state.dirt.length,
      score,
      log
    });

    if (state.dirt.length === 0) break; // End early if done
  }

  return frames;
}
