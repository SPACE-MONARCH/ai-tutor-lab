import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Ensure keys are read dynamically in server actions
export interface CryptoPuzzle {
  word1: string;
  word2: string;
  result: string;
}

export interface MapColoringPuzzle {
  regions: string[];
  edges: [string, string][];
}

export interface GenerationResult<T> {
  data: T | null;
  error: string | null;
  fromFallback: boolean;
}

const CRYPTO_FALLBACKS: CryptoPuzzle[] = [
  { word1: "BASE", word2: "BALL", result: "GAMES" },
  { word1: "SEND", word2: "MORE", result: "MONEY" },
  { word1: "CROSS", word2: "ROADS", result: "DANGER" },
  { word1: "EAT", word2: "THAT", result: "APPLE" },
  { word1: "MAC", word2: "PC", result: "APPLE" },
  { word1: "POINT", word2: "ZERO", result: "ENERGY" },
  { word1: "WATER", word2: "EARTH", result: "NATURE" },
  { word1: "TEN", word2: "TEN", result: "TWENTY" },
  { word1: "TWO", word2: "TWO", result: "FOUR" },
  { word1: "HERE", word2: "THERE", result: "EVERYWHERE" },
];

const MAP_FALLBACKS: MapColoringPuzzle[] = [
  { regions: ["A", "B", "C", "D"], edges: [["A","B"],["B","C"],["C","D"],["D","A"],["A","C"]] },
  { regions: ["X", "Y", "Z", "W", "V"], edges: [["X","Y"],["Y","Z"],["Z","W"],["W","V"],["V","X"],["X","Z"]] },
  { regions: ["N", "S", "E", "W", "C", "P"], edges: [["N","S"],["N","E"],["S","W"],["E","W"],["C","N"],["C","S"],["C","E"],["P","W"],["P","S"]] },
  { regions: ["T1", "T2", "T3", "T4"], edges: [["T1","T2"],["T2","T3"],["T3","T4"],["T4","T1"],["T1","T3"],["T2","T4"]] },
];

function randomFallback<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const MAX_RETRIES = 3;

export async function generateCryptarithmetic(): Promise<GenerationResult<CryptoPuzzle>> {
  if (typeof window === "undefined") {
    return { data: randomFallback(CRYPTO_FALLBACKS), error: "SSG compile-time bypass wrapper", fromFallback: true };
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("[CSP-Genkit] No NEXT_PUBLIC_GEMINI_API_KEY found in env. Using fallback puzzle.");
    return { data: randomFallback(CRYPTO_FALLBACKS), error: "API key missing. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local (get one at ai.google.dev).", fromFallback: true };
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
              word1: { type: SchemaType.STRING },
              word2: { type: SchemaType.STRING },
              result: { type: SchemaType.STRING },
            },
            required: ["word1", "word2", "result"],
          },
        },
      });

      const prompt = `Create a UNIQUE and CREATIVE cryptarithmetic puzzle: WORD1 + WORD2 = RESULT.
[ENTROPY_SEED: ${Date.now()}-${Math.random()}] <- USE THIS TO GUARANTEE A NEW PUZZLE.
Rules:
- Use UPPERCASE English words only (2-5 letters each for word1 and word2, 3-6 for result).
- DO NOT use SEND+MORE=MONEY or BASE+BALL=GAMES. Invent something obscure or thematic (like SPACE+TIME=COSMOS).
- Total unique letters across all three words must be EXACTLY between 6 and 10.
- The puzzle MUST be mathematically solvable (each letter maps to a unique digit 0-9, leading letters cannot be 0).
Return JSON with fields: word1, word2, result.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`[CSP-Genkit] Raw Gemini response (Attempt ${attempt}):`, text);
      const data = JSON.parse(text) as CryptoPuzzle;

      if (!data.word1 || !data.word2 || !data.result) {
        throw new Error("Gemini returned incomplete JSON: " + text);
      }

      data.word1 = data.word1.toUpperCase();
      data.word2 = data.word2.toUpperCase();
      data.result = data.result.toUpperCase();

      console.log("[CSP-Genkit] Parsed puzzle:", `${data.word1} + ${data.word2} = ${data.result}`);
      return { data, error: null, fromFallback: false };
    } catch (error: any) {
      console.error(`[CSP-Genkit] Attempt ${attempt} failed:`, error?.message || error);
      if (attempt === MAX_RETRIES) {
        return { data: randomFallback(CRYPTO_FALLBACKS), error: `Generation failed after ${MAX_RETRIES} attempts. Using fallback.`, fromFallback: true };
      }
    }
  }

  return { data: randomFallback(CRYPTO_FALLBACKS), error: "Unknown loop exit.", fromFallback: true };
}

export async function generateMapColoring(): Promise<GenerationResult<MapColoringPuzzle>> {
  if (typeof window === "undefined") {
    return { data: randomFallback(MAP_FALLBACKS), error: "SSG compile-time bypass wrapper", fromFallback: true };
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("[CSP-Genkit] No NEXT_PUBLIC_GEMINI_API_KEY found in env. Using fallback map.");
    return { data: randomFallback(MAP_FALLBACKS), error: "API key missing. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local (get one at ai.google.dev).", fromFallback: true };
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
        return { data: randomFallback(MAP_FALLBACKS), error: `Generation failed after ${MAX_RETRIES} attempts. Using fallback.`, fromFallback: true };
      }
    }
  }

  return { data: randomFallback(MAP_FALLBACKS), error: "Unknown loop exit.", fromFallback: true };
}
