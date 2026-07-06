/**
 * AI adapter interface — the rest of the app calls ONLY these exported functions.
 *
 * Resolution order:
 *  1. RILO-managed OpenAI adapter when OPENAI_API_KEY is present.
 *  2. Local fallback solver (real computed answers) when no key is set — ensures the full
 *     solve flow works end-to-end before the AI key is configured.
 */

import { env } from '../../config/env.js';
import { solveLocally } from './local-fallback.js';

export interface SolverStep {
  explanation: string;
  expression?: string;
}

export interface SolverResult {
  steps: SolverStep[];
  finalAnswer: string;
}

/**
 * Solve a math problem and return structured step-by-step worked solution.
 *
 * Uses the RILO OpenAI adapter when OPENAI_API_KEY is configured; otherwise falls back to
 * the local solver so every request still returns a real, computed answer.
 */
export async function solveMathProblem(problem: string): Promise<SolverResult> {
  if (env.openaiApiKey) {
    // Lazy-import the concrete adapter so no OpenAI SDK import happens unless needed.
    const { solveWithOpenAI } = await import('./openai.js');
    return solveWithOpenAI(problem);
  }

  // No key yet — use the local fallback (computes real answers for arithmetic, etc.)
  return solveLocally(problem);
}
