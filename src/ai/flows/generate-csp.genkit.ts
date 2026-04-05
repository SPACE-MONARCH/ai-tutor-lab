import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Ensure keys are read dynamically in server actions
export interface CryptoPuzzle {
  words: string[];
  result: string;
  solution?: Record<string, number>;
}

export interface MapColoringPuzzle {
  regions: string[];
  edges: [string, string][];
}

export interface GenerationResult<T> {
  data: T | null;
  error: string | null;
  fromFallback: boolean;
  fallbackIndex?: number;
  fallbackTotal?: number;
}

const CRYPTO_FALLBACKS: CryptoPuzzle[] = [
  { words: ['SEND', 'MORE'], result: 'MONEY', solution: {S:9,E:5,N:6,D:7,M:1,O:0,R:8,Y:2} },
  { words: ['BASE', 'BALL'], result: 'GAMES', solution: {B:7,A:4,S:8,E:3,L:5,G:1,M:9} },
  { words: ['CROSS', 'ROADS'], result: 'DANGER', solution: {C:9,R:6,O:2,S:3,A:5,D:1,N:8,G:7,E:4} },
  { words: ['DONALD', 'GERALD'], result: 'ROBERT', solution: {D:5,O:2,N:6,A:4,L:8,G:1,E:9,R:7,B:3,T:0} },
  { words: ['ONE', 'ONE'], result: 'TWO', solution: {O:2,N:3,E:1,T:4,W:6} },
  { words: ['TWO', 'TWO'], result: 'FOUR', solution: {T:7,W:3,O:4,F:1,U:6,R:8} },
  { words: ['TO', 'TO'], result: 'FOR', solution: {T:8,O:5,F:1,R:0} },
  { words: ['SUN', 'FUN'], result: 'GUN', solution: {S:1,U:2,N:3,F:4,G:5} },
  { words: ['HE', 'ME'], result: 'WE', solution: {H:1,E:0,M:2,W:3} },
  { words: ['TO', 'GO'], result: 'OUT', solution: {T:2,O:1,G:8,U:0} },
  { words: ['I', 'AM'], result: 'ME', solution: {I:1,A:8,M:9,E:0} },
  { words: ['SEE', 'SEE'], result: 'YES', solution: {S:3,E:4,Y:6} },
  { words: ['TEN', 'TEN', 'FORTY'], result: 'SIXTY', solution: {T:8,E:5,N:0,F:2,O:9,R:7,Y:6,S:3,I:1,X:4} },
  { words: ['ME', 'ME'], result: 'BEE', solution: {M:6,E:0,B:1} },
  { words: ['NO', 'NO', 'NO'], result: 'YES', solution: {N:6,O:4,Y:1,E:9,S:2} }
];

const MAP_FALLBACKS: MapColoringPuzzle[] = [
  { regions: ["A", "B", "C", "D"], edges: [["A","B"],["B","C"],["C","D"],["D","A"],["A","C"]] },
  { regions: ["X", "Y", "Z", "W", "V"], edges: [["X","Y"],["Y","Z"],["Z","W"],["W","V"],["V","X"],["X","Z"]] },
  { regions: ["N", "S", "E", "W", "C", "P"], edges: [["N","S"],["N","E"],["S","W"],["E","W"],["C","N"],["C","S"],["C","E"],["P","W"],["P","S"]] },
  { regions: ["T1", "T2", "T3", "T4"], edges: [["T1","T2"],["T2","T3"],["T3","T4"],["T4","T1"],["T1","T3"],["T2","T4"]] },
];

function randomFallback<T>(arr: T[]): { item: T; index: number; total: number } {
  const idx = Math.floor(Math.random() * arr.length);
  return { item: arr[idx], index: idx + 1, total: arr.length };
}

const MAX_RETRIES = 3;

export async function generateCryptarithmetic(): Promise<GenerationResult<CryptoPuzzle>> {
  if (typeof window === "undefined") {
    const f = randomFallback(CRYPTO_FALLBACKS);
    return { data: f.item, error: "SSG compile-time bypass wrapper", fromFallback: true, fallbackIndex: f.index, fallbackTotal: f.total };
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("[CSP-Genkit] No NEXT_PUBLIC_GEMINI_API_KEY found in env. Using fallback puzzle.");
    const f = randomFallback(CRYPTO_FALLBACKS);
    return { data: f.item, error: "API key missing. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local (get one at ai.google.dev).", fromFallback: true, fallbackIndex: f.index, fallbackTotal: f.total };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[CSP-Genkit] Generating cryptarithmetic (Attempt ${attempt}/3)...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              words: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Array of words being summed" },
              result: { type: SchemaType.STRING, description: "The resulting word sum" },
            },
            required: ["words", "result"],
          },
        },
      });

      const prompt = `Create a UNIQUE and CREATIVE cryptarithmetic puzzle: WORD_1 + WORD_2 + ... = RESULT.
[ENTROPY_SEED: ${Date.now()}-${Math.random()}] <- USE THIS TO GUARANTEE A NEW PUZZLE.
Rules:
- Generate 2 to 3 words for the sum array. Use UPPERCASE English words only.
- DO NOT use SEND MORE MONEY or BASE BALL GAMES. Invent something obscure or thematic (like SPACE+TIME=COSMOS).
- Total unique letters across all words must be EXACTLY between 6 and 10.
- The puzzle MUST be mathematically solvable (each letter maps to a unique digit 0-9, leading letters cannot be 0).
Return JSON with fields: words (array of strings), result.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`[CSP-Genkit] Raw Gemini response (Attempt ${attempt}):`, text);
      const data = JSON.parse(text) as CryptoPuzzle;

      if (!data.words || data.words.length < 2 || !data.result) {
        throw new Error("Gemini returned incomplete JSON: " + text);
      }

      data.words = data.words.map(w => w.toUpperCase());
      data.result = data.result.toUpperCase();

      console.log("[CSP-Genkit] Parsed puzzle:", `${data.words.join(" + ")} = ${data.result}`);
      return { data, error: null, fromFallback: false };
    } catch (error: any) {
      console.error(`[CSP-Genkit] Attempt ${attempt} failed:`, error?.message || error);
      if (attempt === MAX_RETRIES) {
        const f = randomFallback(CRYPTO_FALLBACKS);
        return { data: f.item, error: `Generation failed after ${MAX_RETRIES} attempts. Using fallback.`, fromFallback: true, fallbackIndex: f.index, fallbackTotal: f.total };
      }
    }
  }

  const fb = randomFallback(CRYPTO_FALLBACKS);
  return { data: fb.item, error: "Unknown loop exit.", fromFallback: true, fallbackIndex: fb.index, fallbackTotal: fb.total };
}

export async function generateMapColoring(): Promise<GenerationResult<MapColoringPuzzle>> {
  if (typeof window === "undefined") {
    const f = randomFallback(MAP_FALLBACKS);
    return { data: f.item, error: "SSG compile-time bypass wrapper", fromFallback: true, fallbackIndex: f.index, fallbackTotal: f.total };
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("[CSP-Genkit] No NEXT_PUBLIC_GEMINI_API_KEY found in env. Using fallback map.");
    const f = randomFallback(MAP_FALLBACKS);
    return { data: f.item, error: "API key missing. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local (get one at ai.google.dev).", fromFallback: true, fallbackIndex: f.index, fallbackTotal: f.total };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[CSP-Genkit] Generating map coloring (Attempt ${attempt}/3)...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              regions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              edges: { type: SchemaType.ARRAY, items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } } },
            },
            required: ["regions", "edges"],
          },
        },
      });

      const prompt = `Generate a UNIQUE random planar graph for a map coloring problem.
[ENTROPY_SEED: ${Date.now()}-${Math.random()}] <- USE THIS TO GUARANTEE A NEW MAP.
Rules:
- Create between 6 and 9 regions with creative unique names (e.g., "Alpha", "Omega", "Sector7", "NodeX").
- Add adjacency edges between neighboring regions.
- The graph must be completely connected (no isolated regions) and exactly 3-colorable or 4-colorable.
- Each region MUST have at least 2 neighbors, some should have 4 or 5.
- Do not make a simple ring or line. Make it a complex intersecting planar web.
Return JSON: { regions: string[], edges: string[][] }`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`[CSP-Genkit] Raw Gemini response (Attempt ${attempt}):`, text);
      const data = JSON.parse(text) as MapColoringPuzzle;

      if (!data.regions?.length || !data.edges?.length) {
        throw new Error("Invalid map data: " + text);
      }

      console.log("[CSP-Genkit] Parsed map:", data.regions.length, "regions,", data.edges.length, "edges");
      return { data, error: null, fromFallback: false };
    } catch (error: any) {
      console.error(`[CSP-Genkit] Attempt ${attempt} failed:`, error?.message || error);
      if (attempt === MAX_RETRIES) {
        const f = randomFallback(MAP_FALLBACKS);
        return { data: f.item, error: `Generation failed after ${MAX_RETRIES} attempts. Using fallback.`, fromFallback: true, fallbackIndex: f.index, fallbackTotal: f.total };
      }
    }
  }

  const fb = randomFallback(MAP_FALLBACKS);
  return { data: fb.item, error: "Unknown loop exit.", fromFallback: true, fallbackIndex: fb.index, fallbackTotal: fb.total };
}
