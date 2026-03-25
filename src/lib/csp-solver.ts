export type CSPType = "cryptarithmetic" | "map-coloring";

export interface CSPFrame {
  id: number;
  type: "assign" | "backtrack" | "prune" | "success" | "fail";
  variable: string;
  value: any;
  assignments: Record<string, any>;
  domains: Record<string, any[]>;
  description: string;
}

export interface CSPResult {
  frames: CSPFrame[];
  success: boolean;
  finalAssignments: Record<string, any> | null;
  stats: {
    backtracks: number;
    pruned: number;
  };
}

export interface CSPProblemOptions {
  type: CSPType;
  useMRV: boolean;
  useForwardChecking: boolean;
  cryptoEquation?: { word1: string; word2: string; result: string };
  mapData?: { regions: string[]; edges: [string, string][] };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/* ── Manual constraint validation for Map Coloring ── */
export interface ManualValidationResult {
  valid: boolean;
  conflicts: [string, string][];
  complete: boolean;
}

export function validateMapAssignments(
  assignments: Record<string, string>,
  regions: string[],
  edges: [string, string][]
): ManualValidationResult {
  const conflicts: [string, string][] = [];
  for (const [a, b] of edges) {
    if (assignments[a] && assignments[b] && assignments[a] === assignments[b]) {
      conflicts.push([a, b]);
    }
  }
  const complete = regions.every((r) => assignments[r] !== undefined && assignments[r] !== "");
  return { valid: conflicts.length === 0, conflicts, complete };
}

/* ── Main Solver ── */
export function solveCSP(options: CSPProblemOptions): CSPResult {
  const { type, useMRV, useForwardChecking, cryptoEquation, mapData } = options;

  const frames: CSPFrame[] = [];
  let frameId = 0;
  let backtracks = 0;
  let pruned = 0;

  let vars: string[] = [];
  const initialDomains: Record<string, any[]> = {};
  let mapEdges: [string, string][] = [];

  if (type === "cryptarithmetic" && cryptoEquation) {
    const { word1, word2, result } = cryptoEquation;
    const allLetters = Array.from(new Set((word1 + word2 + result).split("")));
    vars = allLetters;

    const leadingLetters = new Set([word1[0], word2[0], result[0]]);
    vars.forEach((v) => {
      initialDomains[v] = leadingLetters.has(v)
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
        : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    });
  } else if (type === "map-coloring" && mapData) {
    vars = mapData.regions;
    mapEdges = mapData.edges;
    vars.forEach((v) => {
      initialDomains[v] = ["Red", "Green", "Blue"];
    });
  }

  const assignments: Record<string, any> = {};

  function addFrame(
    fType: CSPFrame["type"],
    variable: string,
    value: any,
    currentAssigns: Record<string, any>,
    currentDomains: Record<string, any[]>,
    desc: string
  ) {
    frames.push({
      id: frameId++,
      type: fType,
      variable,
      value,
      assignments: deepClone(currentAssigns),
      domains: deepClone(currentDomains),
      description: desc,
    });
  }

  function getValue(word: string, assigns: Record<string, any>): number {
    let sum = 0;
    for (let i = 0; i < word.length; i++) {
      sum = sum * 10 + assigns[word[i]];
    }
    return sum;
  }

  function isConsistent(variable: string, value: any, assigns: Record<string, any>): boolean {
    if (type === "map-coloring") {
      for (const [a, b] of mapEdges) {
        if (a === variable && assigns[b] === value) return false;
        if (b === variable && assigns[a] === value) return false;
      }
      return true;
    } else {
      // Cryptarithmetic: AllDiff
      for (const v of vars) {
        if (v !== variable && assigns[v] === value) return false;
      }

      const allAssigned = vars.every((v) => assigns[v] !== undefined || v === variable);
      if (allAssigned && cryptoEquation) {
        const testAsgn = { ...assigns, [variable]: value };
        const v1 = getValue(cryptoEquation.word1, testAsgn);
        const v2 = getValue(cryptoEquation.word2, testAsgn);
        const vRes = getValue(cryptoEquation.result, testAsgn);
        return v1 + v2 === vRes;
      }
      return true;
    }
  }

  function selectUnassignedVariable(
    assigns: Record<string, any>,
    currentDomains: Record<string, any[]>
  ): string | null {
    const unassigned = vars.filter((v) => assigns[v] === undefined);
    if (unassigned.length === 0) return null;

    if (useMRV) {
      unassigned.sort((a, b) => currentDomains[a].length - currentDomains[b].length);
    }
    return unassigned[0];
  }

  function forwardCheck(
    variable: string,
    value: any,
    currentDomains: Record<string, any[]>,
    assigns: Record<string, any>
  ): Record<string, any[]> | null {
    const newDomains = deepClone(currentDomains);

    if (type === "map-coloring") {
      for (const [a, b] of mapEdges) {
        const neighbor = a === variable ? b : b === variable ? a : null;
        if (neighbor && assigns[neighbor] === undefined) {
          const originalLen = newDomains[neighbor].length;
          newDomains[neighbor] = newDomains[neighbor].filter((d: any) => d !== value);
          if (newDomains[neighbor].length < originalLen) {
            pruned += originalLen - newDomains[neighbor].length;
            addFrame("prune", neighbor, value, assigns, newDomains, `Forward Check: Removed ${value} from ${neighbor}`);
          }
          if (newDomains[neighbor].length === 0) return null;
        }
      }
    } else {
      for (const v of vars) {
        if (v !== variable && assigns[v] === undefined) {
          const originalLen = newDomains[v].length;
          newDomains[v] = newDomains[v].filter((d: any) => d !== value);
          if (newDomains[v].length < originalLen) {
            pruned += originalLen - newDomains[v].length;
          }
          if (newDomains[v].length === 0) return null;
        }
      }
    }
    return newDomains;
  }

  function backtrack(assigns: Record<string, any>, currentDomains: Record<string, any[]>): boolean {
    if (frames.length > 50000) return false;

    const variable = selectUnassignedVariable(assigns, currentDomains);
    if (!variable) {
      addFrame("success", "", "", assigns, currentDomains, "All variables assigned successfully!");
      return true;
    }

    const domainValues = [...currentDomains[variable]];

    for (const val of domainValues) {
      if (isConsistent(variable, val, assigns)) {
        assigns[variable] = val;
        addFrame("assign", variable, val, assigns, currentDomains, `Assign ${val} to ${variable}`);

        let nextDomains = currentDomains;
        if (useForwardChecking) {
          const fcResult = forwardCheck(variable, val, currentDomains, assigns);
          if (!fcResult) {
            addFrame("fail", variable, val, assigns, currentDomains, `Forward Check failed for ${variable}=${val}`);
          } else {
            nextDomains = fcResult;
          }
        }

        if (!useForwardChecking || nextDomains !== currentDomains) {
          if (backtrack(assigns, nextDomains)) {
            return true;
          }
        }

        delete assigns[variable];
        backtracks++;
        addFrame("backtrack", variable, val, assigns, currentDomains, `Backtrack: Removed ${val} from ${variable}`);
      }
    }
    return false;
  }

  const success = backtrack(assignments, initialDomains);

  return {
    frames,
    success,
    finalAssignments: success ? frames[frames.length - 1].assignments : null,
    stats: { backtracks, pruned },
  };
}
