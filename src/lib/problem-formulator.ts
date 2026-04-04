export type ToyProblemId = "tictactoe" | "missionaries" | "tsp";

export interface ToyProblem {
  id: ToyProblemId;
  name: string;
  initialState: any;
  actionsDesc: string;
  transitionDesc: string;
  goalDesc: string;
  generateSpace: (maxDepth?: number) => { nodes: any[]; edges: any[] };
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
    generateSpace: () => {
      // Simulate BFS of a 3x3 tic-tac-toe state space for 1.5 levels
      const nodes: any[] = [{ id: "root", label: "Empty Board (X's turn)", group: "start" }];
      const edges: any[] = [];
      const moves = ["Top-Left", "Center", "Bottom-Right"];
      moves.forEach((m, i) => {
        const nid = `m${i}`;
        nodes.push({ id: nid, label: `X plays ${m}`, group: "node" });
        edges.push({ source: "root", target: nid, weight: 1 });
        
        // Next ply per move
        if (i === 1) { // Just expand center for explosion demo
          nodes.push({ id: "o1", label: "O plays Top", group: "node" });
          nodes.push({ id: "o2", label: "O plays Bottom", group: "node" });
          edges.push({ source: nid, target: "o1", weight: 1 });
          edges.push({ source: nid, target: "o2", weight: 1 });
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
    generateSpace: () => {
      const nodes = [
        { id: "s0", label: "Start: 3M, 3C (L)", group: "start" },
        { id: "s1", label: "Move 1M, 1C", group: "node" },
        { id: "s2", label: "Move 2C", group: "node" },
        { id: "s3", label: "Move 1C", group: "node" },
        // Expanded from s2 (Valid: 2C on Right)
        { id: "s2_1", label: "Return 1C", group: "node" },
        // Expanded from s1 (Valid: 1M 1C on Right)
        { id: "s1_1", label: "Return 1M", group: "node" },
      ];
      const edges = [
        { source: "s0", target: "s1", weight: 1 },
        { source: "s0", target: "s2", weight: 1 },
        { source: "s0", target: "s3", weight: 1 },
        { source: "s2", target: "s2_1", weight: 1 },
        { source: "s1", target: "s1_1", weight: 1 },
      ];
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
    generateSpace: () => {
      const nodes = [
        { id: "A", label: "City A", group: "start" },
        { id: "B", label: "City B", group: "node" },
        { id: "C", label: "City C", group: "node" },
        { id: "D", label: "City D", group: "node" },
        { id: "AB", label: "A → B", group: "node" },
        { id: "AC", label: "A → C", group: "node" },
        { id: "AD", label: "A → D", group: "node" },
        { id: "ABC", label: "B → C", group: "node" },
        { id: "ABD", label: "B → D", group: "node" },
      ];
      const edges = [
        { source: "A", target: "AB", weight: 10 },
        { source: "A", target: "AC", weight: 15 },
        { source: "A", target: "AD", weight: 20 },
        { source: "AB", target: "ABC", weight: 35 },
        { source: "AB", target: "ABD", weight: 25 },
      ];
      return { nodes, edges };
    },
  },
};
