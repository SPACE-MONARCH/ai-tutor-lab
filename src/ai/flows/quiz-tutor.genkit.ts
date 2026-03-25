import { genkit, z } from "genkit";
import { gemini20Flash, googleAI } from "@genkit-ai/googleai";

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: gemini20Flash,
});

export const quizExplanationFlow = ai.defineFlow(
  {
    name: "quizExplanationFlow",
    inputSchema: z.object({
      question: z.string(),
      correctAnswer: z.string(),
      userAnswer: z.string(),
    }),
    outputSchema: z.object({
      explanation: z.string(),
    }),
  },
  async (input) => {
    if (!process.env.GEMINI_API_KEY) {
      return {
        explanation: `(Offline Mode: The correct answer is **${input.correctAnswer}**. Your answer **${input.userAnswer}** was incorrect. Add GEMINI_API_KEY to .env.local for AI Tutor explanations!)`,
      };
    }

    try {
      const prompt = `
You are an encouraging and expert AI Tutor in a university-level Artificial Intelligence lab.
A student just answered a multiple-choice question INCORRECTLY.

Question: "${input.question}"
Correct Answer: "${input.correctAnswer}"
Student's Wrong Answer: "${input.userAnswer}"

Please write a 2-3 sentence explanation. 
1. Acknowledge what they got wrong gently.
2. Explain briefly *why* the student's answer is incorrect.
3. Explain *why* the correct answer is the right one, tying it back to core AI concepts (Search, Minimax, CSP, or Agents).

Format: plain text (no markdown headings). Be supportive and concise!
`;

      const response = await ai.generate({
        prompt,
      });

      return {
        explanation: response.text,
      };
    } catch (error) {
      console.error("Gemini Tutor Error:", error);
      return {
        explanation: `Uh oh, my AI circuits are busy right now! But remember: The correct answer is **${input.correctAnswer}**, not **${input.userAnswer}**.`,
      };
    }
  }
);
