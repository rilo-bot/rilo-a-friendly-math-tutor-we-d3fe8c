import { API_ROUTES } from '@/contract';
import type { Solution } from '@/types';

export async function solveProblem(problem: string): Promise<Solution> {
  const res = await fetch(API_ROUTES.POST_API_SOLVE.path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);

    // 503 means the AI adapter is not configured — treat as infrastructure
    // unavailability so the store falls back to the local solution generator.
    if (res.status === 503) {
      throw new Error('AI service unavailable (503)');
    }

    throw new Error(body?.error ?? 'Something went wrong');
  }

  return res.json() as Promise<Solution>;
}
