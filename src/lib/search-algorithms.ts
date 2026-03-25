export type Point = { x: number; y: number };
export type CellType = "empty" | "wall" | "start" | "goal";

export interface CellNode {
  x: number;
  y: number;
  type: CellType;
  weight: number;
}

export type Grid = CellNode[][];

export type AlgorithmType = "BFS" | "DFS" | "DLS" | "UCS" | "BestFirst" | "A*";

export interface SearchStep {
  frontier: Point[];
  explored: Point[];
  path: Point[] | null;
  current: Point;
  stats: {
    nodesExpanded: number;
    pathCost: number;
  };
  nodeData: Record<string, { g?: number; h?: number; f?: number }>;
}

export interface SearchResult {
  steps: SearchStep[];
  found: boolean;
  pathCost: number;
  nodesExpanded: number;
}

/* ── Priority Queue ── */
class PriorityQueue<T> {
  private items: { element: T; priority: number }[] = [];

  enqueue(element: T, priority: number) {
    const queueElement = { element, priority };
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }
    if (!added) {
      this.items.push(queueElement);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/* ── Helpers ── */
const ptKey = (p: Point) => `${p.x},${p.y}`;
const getNeighbors = (grid: Grid, p: Point): Point[] => {
  const dirs = [
    { dx: 0, dy: -1 }, // up
    { dx: 1, dy: 0 }, // right
    { dx: 0, dy: 1 }, // down
    { dx: -1, dy: 0 }, // left
  ];
  return dirs
    .map((d) => ({ x: p.x + d.dx, y: p.y + d.dy }))
    .filter(
      (n) =>
        n.x >= 0 &&
        n.x < grid[0].length &&
        n.y >= 0 &&
        n.y < grid.length &&
        grid[n.y][n.x].type !== "wall"
    );
};

const manhattan = (p1: Point, p2: Point) =>
  Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

const constructPath = (
  cameFrom: Map<string, Point>,
  current: Point
): Point[] => {
  const path = [current];
  let curr = ptKey(current);
  while (cameFrom.has(curr)) {
    const prev = cameFrom.get(curr)!;
    path.unshift(prev);
    curr = ptKey(prev);
  }
  return path;
};

/* ── Main Runner ── */
export function runSearchAlgorithm(
  grid: Grid,
  start: Point,
  goal: Point,
  type: AlgorithmType
): SearchResult {
  switch (type) {
    case "BFS":
      return runBFS(grid, start, goal);
    case "DFS":
      return runDFS(grid, start, goal);
    case "DLS":
      return runDLS(grid, start, goal, 5); // DLS(5) limit
    case "UCS":
      return runUCS(grid, start, goal);
    case "BestFirst":
      return runBestFirst(grid, start, goal);
    case "A*":
      return runAStar(grid, start, goal);
    default:
      return runBFS(grid, start, goal);
  }
}

/* ── BFS ── */
function runBFS(grid: Grid, start: Point, goal: Point): SearchResult {
  const steps: SearchStep[] = [];
  const frontier: Point[] = [start];
  const explored = new Set<string>();
  const cameFrom = new Map<string, Point>();
  let nodesExpanded = 0;

  explored.add(ptKey(start));

  while (frontier.length > 0) {
    const current = frontier.shift()!;
    nodesExpanded++;

    steps.push({
      frontier: [...frontier],
      explored: Array.from(explored).map((str) => {
        const [x, y] = str.split(",").map(Number);
        return { x, y };
      }),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: {},
    });

    if (current.x === goal.x && current.y === goal.y) {
      const path = constructPath(cameFrom, current);
      // add final frame
      steps.push({
        ...steps[steps.length - 1],
        path,
        stats: { nodesExpanded, pathCost: path.length - 1 },
      });
      return { steps, found: true, pathCost: path.length - 1, nodesExpanded };
    }

    const neighbors = getNeighbors(grid, current);
    for (const n of neighbors) {
      if (!explored.has(ptKey(n))) {
        explored.add(ptKey(n));
        cameFrom.set(ptKey(n), current);
        frontier.push(n);
      }
    }
  }

  return { steps, found: false, pathCost: 0, nodesExpanded };
}

/* ── DFS ── */
function runDFS(grid: Grid, start: Point, goal: Point): SearchResult {
  const steps: SearchStep[] = [];
  const frontier: Point[] = [start];
  const explored = new Set<string>();
  const cameFrom = new Map<string, Point>();
  let nodesExpanded = 0;

  while (frontier.length > 0) {
    const current = frontier.pop()!;

    if (explored.has(ptKey(current))) continue;
    explored.add(ptKey(current));
    nodesExpanded++;

    steps.push({
      frontier: [...frontier],
      explored: Array.from(explored).map((str) => {
        const [x, y] = str.split(",").map(Number);
        return { x, y };
      }),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: {},
    });

    if (current.x === goal.x && current.y === goal.y) {
      const path = constructPath(cameFrom, current);
      steps.push({
        ...steps[steps.length - 1],
        path,
        stats: { nodesExpanded, pathCost: path.length - 1 },
      });
      return { steps, found: true, pathCost: path.length - 1, nodesExpanded };
    }

    // Neighbors push back to keep natural array stack order
    const neighbors = getNeighbors(grid, current);
    for (const n of neighbors.reverse()) {
      if (!explored.has(ptKey(n))) {
        cameFrom.set(ptKey(n), current);
        frontier.push(n);
      }
    }
  }

  return { steps, found: false, pathCost: 0, nodesExpanded };
}

/* ── DLS (Limit=5) ── */
function runDLS(grid: Grid, start: Point, goal: Point, limit: number): SearchResult {
  const steps: SearchStep[] = [];
  const frontier: { point: Point; depth: number }[] = [{ point: start, depth: 0 }];
  const explored = new Set<string>(); // naive tracking for visualization
  const cameFrom = new Map<string, Point>();
  let nodesExpanded = 0;

  while (frontier.length > 0) {
    const { point: current, depth } = frontier.pop()!;
    explored.add(ptKey(current));
    nodesExpanded++;

    steps.push({
      frontier: frontier.map((f) => f.point),
      explored: Array.from(explored).map((str) => {
        const [x, y] = str.split(",").map(Number);
        return { x, y };
      }),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: {},
    });

    if (current.x === goal.x && current.y === goal.y) {
      const path = constructPath(cameFrom, current);
      steps.push({
        ...steps[steps.length - 1],
        path,
        stats: { nodesExpanded, pathCost: path.length - 1 },
      });
      return { steps, found: true, pathCost: path.length - 1, nodesExpanded };
    }

    if (depth < limit) {
      const neighbors = getNeighbors(grid, current);
      for (const n of neighbors.reverse()) {
        const key = ptKey(n);
        // Avoid strict loops in DFS-based DLS by light tracking, but technically DFS can revisit
        // We'll just stop backtracking if it's already in cameFrom mapping for simplicity
        if (!cameFrom.has(key) || cameFrom.get(key) === current) {
          cameFrom.set(key, current);
          frontier.push({ point: n, depth: depth + 1 });
        }
      }
    }
  }

  return { steps, found: false, pathCost: 0, nodesExpanded };
}

/* ── UCS ── */
function runUCS(grid: Grid, start: Point, goal: Point): SearchResult {
  const steps: SearchStep[] = [];
  const frontier = new PriorityQueue<Point>();
  const costSoFar = new Map<string, number>();
  const cameFrom = new Map<string, Point>();
  const explored = new Set<string>();
  let nodesExpanded = 0;
  const nodeData: Record<string, { g?: number; h?: number; f?: number }> = {};

  frontier.enqueue(start, 0);
  costSoFar.set(ptKey(start), 0);
  nodeData[ptKey(start)] = { g: 0 };

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue()!;
    const cKey = ptKey(current);

    if (explored.has(cKey)) continue;
    explored.add(cKey);
    nodesExpanded++;

    steps.push({
      frontier: [], // (PQ serialization omitted for speed, can add if needed)
      explored: Array.from(explored).map((str) => {
        const [x, y] = str.split(",").map(Number);
        return { x, y };
      }),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: { ...nodeData },
    });

    if (current.x === goal.x && current.y === goal.y) {
      const path = constructPath(cameFrom, current);
      const totalCost = costSoFar.get(cKey)!;
      steps.push({
        ...steps[steps.length - 1],
        path,
        stats: { nodesExpanded, pathCost: totalCost },
      });
      return { steps, found: true, pathCost: totalCost, nodesExpanded };
    }

    const neighbors = getNeighbors(grid, current);
    for (const n of neighbors) {
      const newCost = costSoFar.get(cKey)! + grid[n.y][n.x].weight;
      const nKey = ptKey(n);

      if (!costSoFar.has(nKey) || newCost < costSoFar.get(nKey)!) {
        costSoFar.set(nKey, newCost);
        cameFrom.set(nKey, current);
        nodeData[nKey] = { g: newCost };
        frontier.enqueue(n, newCost);
      }
    }
  }

  return { steps, found: false, pathCost: 0, nodesExpanded };
}

/* ── Greedy Best-First ── */
function runBestFirst(grid: Grid, start: Point, goal: Point): SearchResult {
  const steps: SearchStep[] = [];
  const frontier = new PriorityQueue<Point>();
  const cameFrom = new Map<string, Point>();
  const explored = new Set<string>();
  const gCosts = new Map<string, number>();
  let nodesExpanded = 0;
  const nodeData: Record<string, { g?: number; h?: number; f?: number }> = {};

  // Best first solely prioritizes h(n)
  const hStart = manhattan(start, goal);
  frontier.enqueue(start, hStart);
  gCosts.set(ptKey(start), 0);
  nodeData[ptKey(start)] = { h: hStart };

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue()!;
    const cKey = ptKey(current);

    if (explored.has(cKey)) continue;
    explored.add(cKey);
    nodesExpanded++;

    steps.push({
      frontier: [],
      explored: Array.from(explored).map((str) => {
        const [x, y] = str.split(",").map(Number);
        return { x, y };
      }),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: { ...nodeData },
    });

    if (current.x === goal.x && current.y === goal.y) {
      const path = constructPath(cameFrom, current);
      const totalCost = gCosts.get(cKey)!;
      steps.push({
        ...steps[steps.length - 1],
        path,
        stats: { nodesExpanded, pathCost: totalCost },
      });
      return { steps, found: true, pathCost: totalCost, nodesExpanded };
    }

    const neighbors = getNeighbors(grid, current);
    for (const n of neighbors) {
      const nKey = ptKey(n);
      if (!explored.has(nKey)) {
        if (!cameFrom.has(nKey)) {
          cameFrom.set(nKey, current);
          gCosts.set(nKey, gCosts.get(cKey)! + grid[n.y][n.x].weight);
          const h = manhattan(n, goal);
          nodeData[nKey] = { h };
          frontier.enqueue(n, h);
        }
      }
    }
  }

  return { steps, found: false, pathCost: 0, nodesExpanded };
}

/* ── A* ── */
function runAStar(grid: Grid, start: Point, goal: Point): SearchResult {
  const steps: SearchStep[] = [];
  const frontier = new PriorityQueue<Point>();
  const costSoFar = new Map<string, number>(); // g(n)
  const cameFrom = new Map<string, Point>();
  const explored = new Set<string>();
  let nodesExpanded = 0;
  const nodeData: Record<string, { g?: number; h?: number; f?: number }> = {};

  const hStart = manhattan(start, goal);
  frontier.enqueue(start, hStart);
  costSoFar.set(ptKey(start), 0);
  nodeData[ptKey(start)] = { g: 0, h: hStart, f: hStart };

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue()!;
    const cKey = ptKey(current);

    if (explored.has(cKey)) continue;
    explored.add(cKey);
    nodesExpanded++;

    steps.push({
      frontier: [],
      explored: Array.from(explored).map((str) => {
        const [x, y] = str.split(",").map(Number);
        return { x, y };
      }),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: { ...nodeData },
    });

    if (current.x === goal.x && current.y === goal.y) {
      const path = constructPath(cameFrom, current);
      const totalCost = costSoFar.get(cKey)!;
      steps.push({
        ...steps[steps.length - 1],
        path,
        stats: { nodesExpanded, pathCost: totalCost },
      });
      return { steps, found: true, pathCost: totalCost, nodesExpanded };
    }

    const neighbors = getNeighbors(grid, current);
    for (const n of neighbors) {
      const newCost = costSoFar.get(cKey)! + grid[n.y][n.x].weight;
      const nKey = ptKey(n);

      if (!costSoFar.has(nKey) || newCost < costSoFar.get(nKey)!) {
        costSoFar.set(nKey, newCost);
        cameFrom.set(nKey, current);
        
        const h = manhattan(n, goal);
        const f = newCost + h;
        nodeData[nKey] = { g: newCost, h, f };
        frontier.enqueue(n, f);
      }
    }
  }

  return { steps, found: false, pathCost: 0, nodesExpanded };
}

/* ── NODE GRAPH ALGORITHMS ── */

export interface GraphNode {
  id: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphSearchStep {
  frontier: string[];
  explored: string[];
  path: string[] | null;
  current: string;
  stats: { nodesExpanded: number; pathCost: number };
  nodeData: Record<string, { g?: number; h?: number; f?: number }>;
}

export interface GraphSearchResult {
  steps: GraphSearchStep[];
  found: boolean;
  pathCost: number;
  nodesExpanded: number;
}

const getGraphNeighbors = (nodeId: string, edges: GraphEdge[]): { id: string; weight: number }[] => {
  const neighbors: { id: string; weight: number }[] = [];
  for (const edge of edges) {
    if (edge.source === nodeId) neighbors.push({ id: edge.target, weight: edge.weight });
    // If undirected: if (edge.target === nodeId) neighbors.push({ id: edge.source, weight: edge.weight });
    // Let's assume undirected for the playground to match grid adjacency
    if (edge.target === nodeId) neighbors.push({ id: edge.source, weight: edge.weight });
  }
  return neighbors;
};

const constructGraphPath = (cameFrom: Map<string, string>, current: string): string[] => {
  const path = [current];
  let curr = current;
  while (cameFrom.has(curr)) {
    const prev = cameFrom.get(curr)!;
    path.unshift(prev);
    curr = prev;
  }
  return path;
};

export function runGraphSearchAlgorithm(
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: string,
  goal: string,
  type: AlgorithmType
): GraphSearchResult {
  switch (type) {
    case "BFS": return runGraphBFS(nodes, edges, start, goal);
    case "DFS": return runGraphDFS(nodes, edges, start, goal);
    case "UCS": return runGraphUCS(nodes, edges, start, goal);
    case "BestFirst": return runGraphBestFirst(nodes, edges, start, goal);
    case "A*": return runGraphAStar(nodes, edges, start, goal);
    default: return runGraphBFS(nodes, edges, start, goal);
  }
}

function runGraphBFS(nodes: GraphNode[], edges: GraphEdge[], start: string, goal: string): GraphSearchResult {
  const steps: GraphSearchStep[] = [];
  const frontier: string[] = [start];
  const explored = new Set<string>();
  const cameFrom = new Map<string, string>();
  let nodesExpanded = 0;

  explored.add(start);

  while (frontier.length > 0) {
    const current = frontier.shift()!;
    nodesExpanded++;

    steps.push({
      frontier: [...frontier],
      explored: Array.from(explored),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: {},
    });

    if (current === goal) {
      const path = constructGraphPath(cameFrom, current);
      steps.push({ ...steps[steps.length - 1], path, stats: { nodesExpanded, pathCost: path.length - 1 } });
      return { steps, found: true, pathCost: path.length - 1, nodesExpanded };
    }

    const neighbors = getGraphNeighbors(current, edges);
    for (const n of neighbors) {
      if (!explored.has(n.id)) {
        explored.add(n.id);
        cameFrom.set(n.id, current);
        frontier.push(n.id);
      }
    }
  }
  return { steps, found: false, pathCost: 0, nodesExpanded };
}

function runGraphDFS(nodes: GraphNode[], edges: GraphEdge[], start: string, goal: string): GraphSearchResult {
  const steps: GraphSearchStep[] = [];
  const frontier: string[] = [start];
  const explored = new Set<string>();
  const cameFrom = new Map<string, string>();
  let nodesExpanded = 0;

  while (frontier.length > 0) {
    const current = frontier.pop()!;
    if (explored.has(current)) continue;
    explored.add(current);
    nodesExpanded++;

    steps.push({
      frontier: [...frontier],
      explored: Array.from(explored),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: {},
    });

    if (current === goal) {
      const path = constructGraphPath(cameFrom, current);
      steps.push({ ...steps[steps.length - 1], path, stats: { nodesExpanded, pathCost: path.length - 1 } });
      return { steps, found: true, pathCost: path.length - 1, nodesExpanded };
    }

    const neighbors = getGraphNeighbors(current, edges);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const n = neighbors[i];
      if (!explored.has(n.id)) {
        cameFrom.set(n.id, current);
        frontier.push(n.id);
      }
    }
  }
  return { steps, found: false, pathCost: 0, nodesExpanded };
}

function runGraphUCS(nodes: GraphNode[], edges: GraphEdge[], start: string, goal: string): GraphSearchResult {
  const steps: GraphSearchStep[] = [];
  const frontier = new PriorityQueue<string>();
  const costSoFar = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const explored = new Set<string>();
  let nodesExpanded = 0;
  const nodeData: Record<string, { g?: number }> = {};

  frontier.enqueue(start, 0);
  costSoFar.set(start, 0);
  nodeData[start] = { g: 0 };

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue()!;
    if (explored.has(current)) continue;
    explored.add(current);
    nodesExpanded++;

    steps.push({
      frontier: [],
      explored: Array.from(explored),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: { ...nodeData },
    });

    if (current === goal) {
      const path = constructGraphPath(cameFrom, current);
      const totalCost = costSoFar.get(current)!;
      steps.push({ ...steps[steps.length - 1], path, stats: { nodesExpanded, pathCost: totalCost } });
      return { steps, found: true, pathCost: totalCost, nodesExpanded };
    }

    const neighbors = getGraphNeighbors(current, edges);
    for (const n of neighbors) {
      const newCost = costSoFar.get(current)! + n.weight;
      if (!costSoFar.has(n.id) || newCost < costSoFar.get(n.id)!) {
        costSoFar.set(n.id, newCost);
        cameFrom.set(n.id, current);
        nodeData[n.id] = { g: newCost };
        frontier.enqueue(n.id, newCost);
      }
    }
  }
  return { steps, found: false, pathCost: 0, nodesExpanded };
}

function euclidean(n1: GraphNode, n2: GraphNode): number {
  if (n1.x === undefined || n1.y === undefined || n2.x === undefined || n2.y === undefined) return 0;
  return Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
}

function runGraphBestFirst(nodes: GraphNode[], edges: GraphEdge[], start: string, goal: string): GraphSearchResult {
  const steps: GraphSearchStep[] = [];
  const frontier = new PriorityQueue<string>();
  const cameFrom = new Map<string, string>();
  const explored = new Set<string>();
  const gCosts = new Map<string, number>();
  let nodesExpanded = 0;
  const nodeData: Record<string, { h?: number }> = {};

  const goalNode = nodes.find(n => n.id === goal)!;
  const startNode = nodes.find(n => n.id === start)!;
  const hStart = Math.round(euclidean(startNode, goalNode));
  
  frontier.enqueue(start, hStart);
  gCosts.set(start, 0);
  nodeData[start] = { h: hStart };

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue()!;
    if (explored.has(current)) continue;
    explored.add(current);
    nodesExpanded++;

    steps.push({
      frontier: [],
      explored: Array.from(explored),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: { ...nodeData },
    });

    if (current === goal) {
      const path = constructGraphPath(cameFrom, current);
      steps.push({ ...steps[steps.length - 1], path, stats: { nodesExpanded, pathCost: gCosts.get(current)! } });
      return { steps, found: true, pathCost: gCosts.get(current)!, nodesExpanded };
    }

    const neighbors = getGraphNeighbors(current, edges);
    for (const n of neighbors) {
      if (!explored.has(n.id)) {
        if (!cameFrom.has(n.id)) {
          cameFrom.set(n.id, current);
          gCosts.set(n.id, gCosts.get(current)! + n.weight);
          const nNode = nodes.find(node => node.id === n.id)!;
          const h = Math.round(euclidean(nNode, goalNode));
          nodeData[n.id] = { h };
          frontier.enqueue(n.id, h);
        }
      }
    }
  }
  return { steps, found: false, pathCost: 0, nodesExpanded };
}

function runGraphAStar(nodes: GraphNode[], edges: GraphEdge[], start: string, goal: string): GraphSearchResult {
  const steps: GraphSearchStep[] = [];
  const frontier = new PriorityQueue<string>();
  const costSoFar = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const explored = new Set<string>();
  let nodesExpanded = 0;
  const nodeData: Record<string, { g?: number; h?: number; f?: number }> = {};

  const goalNode = nodes.find(n => n.id === goal)!;
  const startNode = nodes.find(n => n.id === start)!;
  const hStart = Math.round(euclidean(startNode, goalNode));

  frontier.enqueue(start, hStart);
  costSoFar.set(start, 0);
  nodeData[start] = { g: 0, h: hStart, f: hStart };

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue()!;
    if (explored.has(current)) continue;
    explored.add(current);
    nodesExpanded++;

    steps.push({
      frontier: [],
      explored: Array.from(explored),
      path: null,
      current,
      stats: { nodesExpanded, pathCost: 0 },
      nodeData: { ...nodeData },
    });

    if (current === goal) {
      const path = constructGraphPath(cameFrom, current);
      steps.push({ ...steps[steps.length - 1], path, stats: { nodesExpanded, pathCost: costSoFar.get(current)! } });
      return { steps, found: true, pathCost: costSoFar.get(current)!, nodesExpanded };
    }

    const neighbors = getGraphNeighbors(current, edges);
    for (const n of neighbors) {
      const newCost = costSoFar.get(current)! + n.weight;
      if (!costSoFar.has(n.id) || newCost < costSoFar.get(n.id)!) {
        costSoFar.set(n.id, newCost);
        cameFrom.set(n.id, current);
        
        const nNode = nodes.find(node => node.id === n.id)!;
        const h = Math.round(euclidean(nNode, goalNode));
        const f = newCost + h;
        nodeData[n.id] = { g: newCost, h, f };
        frontier.enqueue(n.id, f);
      }
    }
  }
  return { steps, found: false, pathCost: 0, nodesExpanded };
}
