import { Router } from 'express';
import { API_ROUTES } from '../contract.js';
import { postSolve } from '../controllers/solve.controller.js';

export const solveRouter = Router();

// POST /api/solve — no auth required; any student can submit a problem.
solveRouter.post(API_ROUTES.POST_API_SOLVE.path, postSolve);
