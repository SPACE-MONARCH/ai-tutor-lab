"use server";

import { quizExplanationFlow } from "@/ai/flows/quiz-tutor.genkit";

export async function getQuizExplanation(question: string, correctAnswer: string, userAnswer: string) {
  try {
    const res = await quizExplanationFlow({ question, correctAnswer, userAnswer });
    return res.explanation;
  } catch (error) {
    console.error("Failed to generate quiz explanation:", error);
    return `The correct answer is actually ${correctAnswer}.`;
  }
}
