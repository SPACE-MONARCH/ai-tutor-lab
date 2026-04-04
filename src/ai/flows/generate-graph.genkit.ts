import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

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

export interface GraphTopology {
  nodes: GraphNode[];
  edges: GraphEdge[];
  startNode: string;
  goalNode: string;
}

export interface GenerationResult<T> {
  data: T | null;
  error: string | null;
  fromFallback: boolean;
}

const FALLBACK_TOPOLOGIES: GraphTopology[] = [
  {
    nodes: [
      { id: "A", x: 100, y: 150 }, { id: "B", x: 250, y: 50 }, { id: "C", x: 250, y: 250 },
      { id: "D", x: 450, y: 150 }, { id: "E", x: 600, y: 50 }, { id: "F", x: 600, y: 250 },
      { id: "G", x: 750, y: 150 }
    ],
    edges: [
      { source: "A", target: "B", weight: 3 }, { source: "A", target: "C", weight: 6 },
      { source: "B", target: "D", weight: 4 }, { source: "C", target: "D", weight: 5 },
      { source: "C", target: "F", weight: 7 }, { source: "D", target: "E", weight: 2 },
      { source: "D", target: "F", weight: 3 }, { source: "E", target: "G", weight: 5 },
      { source: "F", target: "G", weight: 4 }
    ],
    startNode: "A", goalNode: "G"
  },
  {
    nodes: [
      { id: "S", x: 100, y: 200 }, { id: "N1", x: 300, y: 100 }, { id: "N2", x: 300, y: 300 },
      { id: "N3", x: 500, y: 100 }, { id: "N4", x: 500, y: 300 }, { id: "G", x: 700, y: 200 }
    ],
    edges: [
      { source: "S", target: "N1", weight: 2 }, { source: "S", target: "N2", weight: 5 },
      { source: "N1", target: "N2", weight: 1 }, { source: "N1", target: "N3", weight: 6 },
      { source: "N2", target: "N4", weight: 3 }, { source: "N3", target: "N4", weight: 2 },
      { source: "N3", target: "G", weight: 4 }, { source: "N4", target: "G", weight: 7 }
    ],
    startNode: "S", goalNode: "G"
  },
  {
    nodes: [
      { id: "Alpha", x: 150, y: 250 }, { id: "Beta", x: 300, y: 100 }, { id: "Gamma", x: 300, y: 400 },
      { id: "Delta", x: 500, y: 250 }, { id: "Epsilon", x: 650, y: 100 }, { id: "Zeta", x: 650, y: 400 },
      { id: "Omega", x: 800, y: 250 }
    ],
    edges: [
      { source: "Alpha", target: "Beta", weight: 8 }, { source: "Alpha", target: "Gamma", weight: 4 },
      { source: "Beta", target: "Delta", weight: 3 }, { source: "Gamma", target: "Delta", weight: 9 },
      { source: "Gamma", target: "Zeta", weight: 5 }, { source: "Delta", target: "Epsilon", weight: 2 },
      { source: "Delta", target: "Zeta", weight: 6 }, { source: "Epsilon", target: "Omega", weight: 7 },
      { source: "Zeta", target: "Omega", weight: 1 }
    ],
    startNode: "Alpha", goalNode: "Omega"
  }
];

function randomFallback<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const MAX_RETRIES = 3;

export async function generateRandomGraph(): Promise<GenerationResult<GraphTopology>> {
  if (typeof window === "undefined") {
    return { data: randomFallback(FALLBACK_TOPOLOGIES), error: "SSG compile-time bypass wrapper", fromFallback: true };
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("[Graph-Genkit] No NEXT_PUBLIC_GEMINI_API_KEY found in env. Using fallback graph.");
    return { data: randomFallback(FALLBACK_TOPOLOGIES), error: "API key missing. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local (get one at ai.google.dev).", fromFallback: true };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[Graph-Genkit] Generating Graph Topology (Attempt ${attempt}/3)...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              nodes: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    id: { type: SchemaType.STRING },
                    x: { type: SchemaType.NUMBER },
                    y: { type: SchemaType.NUMBER }
                  },
                  required: ["id", "x", "y"]
                }
              },
              edges: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    source: { type: SchemaType.STRING },
                    target: { type: SchemaType.STRING },
                    weight: { type: SchemaType.NUMBER }
                  },
                  required: ["source", "target", "weight"]
                }
              },
              startNode: { type: SchemaType.STRING },
              goalNode: { type: SchemaType.STRING }
            },
            required: ["nodes", "edges", "startNode", "goalNode"],
          },
        },
      });

      const prompt = `Generate a UNIQUE random planar graph topology.
[ENTROPY_SEED: ${Date.now()}-${Math.random()}] <- USE THIS TO GUARANTEE A NEW MAP.
Rules:
- Create between 8 and 15 unique nodes. Use creative node strings for IDs (e.g., 'Core', 'Relay1', 'Hub').
- Provide integer X and Y coordinates for each node to build an aesthetically pleasing layout.
  - X domain: 100 to 800
  - Y domain: 100 to 500
- Create between 15 and 30 edges linking nodes. Assign random positive integer weights (between 1 and 25).
- StartNode should be on the far left (X ~ 100), GoalNode should be on the far right (X ~ 800).
- Graph MUST BE CONNECTED.
Return strictly the JSON mapping the schema properties.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`[Graph-Genkit] Raw Gemini response (Attempt ${attempt}):`, text);
      const data = JSON.parse(text) as GraphTopology;

      if (!data.nodes?.length || !data.edges?.length || !data.startNode || !data.goalNode) {
        throw new Error("Invalid graph data: " + text);
      }

      console.log("[Graph-Genkit] Parsed Graph:", data.nodes.length, "nodes,", data.edges.length, "edges");
      return { data, error: null, fromFallback: false };
    } catch (error: any) {
      console.error(`[Graph-Genkit] Attempt ${attempt} failed:`, error?.message || error);
      if (attempt === MAX_RETRIES) {
        return { data: randomFallback(FALLBACK_TOPOLOGIES), error: `Generation failed after ${MAX_RETRIES} attempts. Using fallback.`, fromFallback: true };
      }
    }
  }

  return { data: randomFallback(FALLBACK_TOPOLOGIES), error: "Unknown loop exit.", fromFallback: true };
}
