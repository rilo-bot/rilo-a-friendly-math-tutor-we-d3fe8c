import { Router } from 'express';
import { solveRouter } from './solve.js';

const router = Router();

// Math solver — public, no auth required.
router.use(solveRouter);

export default router;
