"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

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
];

const MAP_FALLBACKS: MapColoringPuzzle[] = [
  { regions: ["A", "B", "C", "D"], edges: [["A","B"],["B","C"],["C","D"],["D","A"],["A","C"]] },
  { regions: ["X", "Y", "Z", "W", "V"], edges: [["X","Y"],["Y","Z"],["Z","W"],["W","V"],["V","X"],["X","Z"]] },
  { regions: ["N", "S", "E", "W", "C", "P"], edges: [["N","S"],["N","E"],["S","W"],["E","W"],["C","N"],["C","S"],["C","E"],["P","W"],["P","S"]] },
];

function randomFallback<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function generateCryptarithmetic(): Promise<GenerationResult<CryptoPuzzle>> {
  if (!apiKey) {
    console.warn("[CSP-Genkit] No GEMINI_API_KEY found in env. Using fallback puzzle.");
    return { data: randomFallback(CRYPTO_FALLBACKS), error: "API key missing. Add GEMINI_API_KEY to .env.local (get one at ai.google.dev).", fromFallback: true };
  }

  try {
    console.log("[CSP-Genkit] Generating cryptarithmetic puzzle via Gemini...");
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

    const prompt = `Create a cryptarithmetic puzzle: WORD1 + WORD2 = RESULT.
Rules:
- Use UPPERCASE English words only (2-4 letters each for word1 and word2, 3-5 for result).
- Total unique letters across all three words must be between 6 and 8.
- The puzzle must be solvable (each letter maps to a unique digit 0-9, leading letters cannot be 0).
- Be creative. Examples: SEND+MORE=MONEY, BASE+BALL=GAMES.
Return JSON with fields: word1, word2, result (all uppercase strings).`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("[CSP-Genkit] Raw Gemini response:", text);
    const data = JSON.parse(text) as CryptoPuzzle;

    // Validate structure
    if (!data.word1 || !data.word2 || !data.result) {
      throw new Error("Gemini returned incomplete JSON: " + text);
    }

    // Normalize to uppercase
    data.word1 = data.word1.toUpperCase();
    data.word2 = data.word2.toUpperCase();
    data.result = data.result.toUpperCase();

    console.log("[CSP-Genkit] Parsed puzzle:", `${data.word1} + ${data.word2} = ${data.result}`);
    return { data, error: null, fromFallback: false };
  } catch (error: any) {
    console.error("[CSP-Genkit] Cryptarithmetic generation failed:", error?.message || error);
    return { data: randomFallback(CRYPTO_FALLBACKS), error: `Generation failed: ${error?.message || "Unknown error"}. Using fallback.`, fromFallback: true };
  }
}

export async function generateMapColoring(): Promise<GenerationResult<MapColoringPuzzle>> {
  if (!apiKey) {
    console.warn("[CSP-Genkit] No GEMINI_API_KEY found in env. Using fallback map.");
    return { data: randomFallback(MAP_FALLBACKS), error: "API key missing. Add GEMINI_API_KEY to .env.local (get one at ai.google.dev).", fromFallback: true };
  }

  try {
    console.log("[CSP-Genkit] Generating map coloring puzzle via Gemini...");
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

    const prompt = `Generate a random planar graph for a map coloring problem.
Rules:
- Create between 4 and 6 regions with short unique names (1-3 chars, like "A", "B", "NW", "X1").
- Add adjacency edges between neighboring regions.
- The graph must be connected (no isolated regions) and 3-colorable.
- Each region should have at least 2 neighbors.
Return JSON: { regions: string[], edges: string[][] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("[CSP-Genkit] Raw Gemini response:", text);
    const data = JSON.parse(text) as MapColoringPuzzle;

    if (!data.regions?.length || !data.edges?.length) {
      throw new Error("Invalid map data: " + text);
    }

    console.log("[CSP-Genkit] Parsed map:", data.regions.length, "regions,", data.edges.length, "edges");
    return { data, error: null, fromFallback: false };
  } catch (error: any) {
    console.error("[CSP-Genkit] Map generation failed:", error?.message || error);
    return { data: randomFallback(MAP_FALLBACKS), error: `Generation failed: ${error?.message || "Unknown error"}. Using fallback.`, fromFallback: true };
  }
}
