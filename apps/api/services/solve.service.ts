import { SolutionModel } from '../models/solution.model.js';
import { solveMathProblem } from './ai/index.js';

export interface SolutionDTO {
  id: string;
  problem: string;
  steps: { explanation: string; expression?: string }[];
  finalAnswer: string;
  createdAt: string;
}

/**
 * Solve a student's math problem:
 *  1. Call the AI adapter (RILO OpenAI when configured, local fallback otherwise) to get
 *     structured steps + a real computed final answer.
 *  2. Persist the result in MongoDB so session history survives restarts.
 *  3. Return a plain DTO that maps 1-to-1 with the API contract response shape.
 */
export async function solveAndPersist(problem: string): Promise<SolutionDTO> {
  const trimmed = problem.trim();
  if (!trimmed) {
    throw new ValidationError('problem must not be empty');
  }

  const { steps, finalAnswer } = await solveMathProblem(trimmed);

  const doc = await SolutionModel.create({ problem: trimmed, steps, finalAnswer });

  const plain = doc.toJSON() as {
    id: string;
    problem: string;
    steps: { explanation: string; expression?: string }[];
    finalAnswer: string;
    createdAt: Date;
  };

  return {
    id: plain.id,
    problem: plain.problem,
    steps: plain.steps,
    finalAnswer: plain.finalAnswer,
    createdAt: plain.createdAt.toISOString(),
  };
}

export class ValidationError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
