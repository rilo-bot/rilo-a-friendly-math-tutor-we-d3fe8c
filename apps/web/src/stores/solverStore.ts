import { create } from 'zustand';
import type { Solution } from '@/types';
import { solveProblem } from '@/api';
import { solveLocally } from '@/lib/mathEngine';

interface SolverState {
  history: Solution[];
  currentSolution: Solution | null;
  isLoading: boolean;
  error: string | null;
  solve: (problem: string) => Promise<void>;
  clearError: () => void;
  clearCurrent: () => void;
}

export const useSolverStore = create<SolverState>((set) => ({
  history: [],
  currentSolution: null,
  isLoading: false,
  error: null,

  solve: async (problem: string) => {
    set({ isLoading: true, error: null, currentSolution: null });

    try {
      const solution = await solveProblem(problem);
      set((s) => ({
        isLoading: false,
        currentSolution: solution,
        history: [solution, ...s.history],
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';

      // Treat network errors, fetch failures, JSON parse errors, and
      // "AI not configured" (503) as graceful fallbacks — never show an error
      // banner for infrastructure issues; only show errors for genuine user
      // input rejections (e.g. 400 validation failures).
      const isFallbackCase =
        message === 'Failed to fetch' ||
        message.includes('NetworkError') ||
        message.includes('fetch') ||
        message.includes('JSON') ||
        message.includes('503') ||
        message.includes('not configured') ||
        message.includes('unavailable') ||
        message.toLowerCase().includes('service');

      if (isFallbackCase) {
        // Use the local math engine to compute a real solution
        const fallback = solveLocally(problem);
        set((s) => ({
          isLoading: false,
          currentSolution: fallback,
          history: [fallback, ...s.history],
        }));
      } else {
        set({ isLoading: false, error: message });
      }
    }
  },

  clearError: () => set({ error: null }),
  clearCurrent: () => set({ currentSolution: null }),
}));
