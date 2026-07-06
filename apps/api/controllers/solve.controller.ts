import type { Request, Response, NextFunction } from 'express';
import { solveAndPersist, ValidationError } from '../services/solve.service.js';

/**
 * POST /api/solve
 *
 * Body: { problem: string }
 * Response 200: { id, problem, steps, finalAnswer, createdAt }
 * Response 400: invalid / empty problem
 *
 * The solve service always returns a real computed result — either via the RILO AI adapter
 * (when OPENAI_API_KEY is set) or via the local fallback solver. A 503 is never returned.
 */
export async function postSolve(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { problem } = req.body as { problem?: unknown };

    if (typeof problem !== 'string' || !problem.trim()) {
      res.status(400).json({
        error: 'problem is required and must be a non-empty string',
      });
      return;
    }

    const solution = await solveAndPersist(problem);
    res.status(200).json(solution);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}
