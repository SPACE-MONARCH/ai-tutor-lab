export type ToyProblemId = "tictactoe" | "missionaries" | "tsp";

export interface ToyProblem {
  id: ToyProblemId;
  name: string;
  initialState: any;
  actionsDesc: string;
  transitionDesc: string;
  goalDesc: string;
  generateSpace: (currentState?: any) => { nodes: any[]; edges: any[] };
}

export const TOY_PROBLEMS: Record<ToyProblemId, ToyProblem> = {
  tictactoe: {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    initialState: [
      [" ", " ", " "],
      [" ", " ", " "],
      [" ", " ", " "],
    ],
    actionsDesc: "Place an X or O in an empty square.",
    transitionDesc: "Update the grid with the placed mark and flip the active player.",
    goalDesc: "Three marks in a row, column, or diagonal, or the board is full.",
    generateSpace: (currentState?: string[][]) => {
      // Use dynamic state if provided
      const state = currentState || [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
      ];
      
      const flat = state.flat();
      const xCount = flat.filter(c => c === 'X').length;
      const oCount = flat.filter(c => c === 'O').length;
      const playerTurn = xCount <= oCount ? 'X' : 'O';
      
      const nodes: any[] = [{ id: "root", label: `Current Board (${playerTurn}'s turn)`, group: "start" }];
      const edges: any[] = [];
      const moves = ["Top-Left", "Top-Center", "Top-Right", "Mid-Left", "Center", "Mid-Right", "Bot-Left", "Bot-Center", "Bot-Right"];
      
      // Calculate possible next moves dynamically
      let emptyIndices: number[] = [];
      flat.forEach((c, i) => { if (c === " ") emptyIndices.push(i); });
      
      // Only show up to 3 next moves to avoid overwhelming the graph immediately
      const limit = emptyIndices.slice(0, 3);
      
      limit.forEach((idx, i) => {
        const nid = `m${i}`;
        nodes.push({ id: nid, label: `${playerTurn} plays ${moves[idx]}`, group: "node" });
        edges.push({ source: "root", target: nid, weight: 1 });
        
        // Show 1 level of response for the first path only
        if (i === 0 && emptyIndices.length > 1) {
          const opponent = playerTurn === 'X' ? 'O' : 'X';
          const nextEmpty = emptyIndices.find(e => e !== idx);
          if (nextEmpty !== undefined) {
             const subNid = `sub${i}`;
             nodes.push({ id: subNid, label: `${opponent} plays ${moves[nextEmpty]}`, group: "node" });
             edges.push({ source: nid, target: subNid, weight: 1 });
          }
        }
      });
      return { nodes, edges };
    },
  },
  missionaries: {
    id: "missionaries",
    name: "Missionaries & Cannibals",
    initialState: { left: { m: 3, c: 3, boat: 1 }, right: { m: 0, c: 0, boat: 0 } },
    actionsDesc: "Move 1 or 2 people across the river, boat must have at least 1 person.",
    transitionDesc: "Subtract from starting side, add to destination side.",
    goalDesc: "All people on the right side: { left: { m: 0, c: 0 }, right: { m: 3, c: 3 } }",
    generateSpace: (currentState?: { left: { m: number, c: number, boat: number }, right: { m: number, c: number, boat: number } }) => {
      const state = currentState || { left: { m: 3, c: 3, boat: 1 }, right: { m: 0, c: 0, boat: 0 } };
      
      const boatPos = state.left.boat === 1 ? 'Left' : 'Right';
      const labelStr = `Start: L(${state.left.m}M, ${state.left.c}C) R(${state.right.m}M, ${state.right.c}C) [Boat ${boatPos}]`;
      
      const nodes: any[] = [
        { id: "s0", label: labelStr, group: "start" },
      ];
      const edges: any[] = [];
      
      // Calculate generic valid transfers for the current side the boat is on
      const transfers = [
        { m: 1, c: 0, lbl: "1M" },
        { m: 2, c: 0, lbl: "2M" },
        { m: 0, c: 1, lbl: "1C" },
        { m: 0, c: 2, lbl: "2C" },
        { m: 1, c: 1, lbl: "1M, 1C" }
      ];
      
      const activeSide = state.left.boat === 1 ? state.left : state.right;
      const targetSide = state.left.boat === 1 ? state.right : state.left;
      
      let validCount = 1;
      
      transfers.forEach((tr) => {
        if (activeSide.m >= tr.m && activeSide.c >= tr.c) {
           const id = `s${validCount}`;
           nodes.push({ id, label: `Move ${tr.lbl} to ${state.left.boat === 1 ? 'Right' : 'Left'}`, group: "node" });
           edges.push({ source: "s0", target: id, weight: 1 });
           validCount++;
        }
      });
      
      return { nodes, edges };
    },
  },
  tsp: {
    id: "tsp",
    name: "Traveling Salesperson",
    initialState: "Start at City A",
    actionsDesc: "Travel to an unvisited city.",
    transitionDesc: "Add path cost to total, mark city as visited.",
    goalDesc: "All cities visited and returned to City A.",
    generateSpace: (currentState?: { currentCity: string, visited: string[] }) => {
      const state = currentState || { currentCity: "A", visited: ["A"] };
      const unvisited = ["A", "B", "C", "D", "E", "F"].filter(c => !state.visited.includes(c));
      
      const nodes: any[] = [
        { id: "root", label: `In City ${state.currentCity}`, group: "start" },
      ];
      const edges: any[] = [];
      
      if (unvisited.length === 0) {
        nodes.push({ id: "end", label: "Go back to start", group: "goal" });
        edges.push({ source: "root", target: "end", weight: 10 });
      } else {
        unvisited.slice(0, 3).forEach((city, i) => {
          const id = `c${i}`;
          nodes.push({ id, label: `Travel to ${city}`, group: "node" });
          edges.push({ source: "root", target: id, weight: Math.floor(Math.random() * 20) + 10 });
        });
      }
      
      return { nodes, edges };
    },
  },
};
