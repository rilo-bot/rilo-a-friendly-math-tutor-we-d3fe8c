import type { Solution } from '@/types';

/**
 * Sample solutions used as seed data in the session history sidebar
 * when the backend is not yet reachable.
 * These are hand-crafted so the UI looks alive on first load.
 */
export const SAMPLE_SOLUTIONS: Solution[] = [
  {
    id: 'sample-1',
    problem: '2x + 5 = 13',
    steps: [
      {
        explanation: 'Start with the equation as given.',
        expression: '2x + 5 = 13',
      },
      {
        explanation: 'Subtract 5 from both sides to isolate the term with x.',
        expression: '2x + 5 − 5 = 13 − 5  →  2x = 8',
      },
      {
        explanation: 'Divide both sides by 2 to solve for x.',
        expression: '2x ÷ 2 = 8 ÷ 2  →  x = 4',
      },
      {
        explanation: 'Check: plug x = 4 back in. 2(4) + 5 = 8 + 5 = 13 ✓',
      },
    ],
    finalAnswer: 'x = 4',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'sample-2',
    problem: 'What is 15% of 200?',
    steps: [
      {
        explanation: 'Recall that "percent" means "out of 100", so 15% = 15/100 = 0.15.',
        expression: '15% = 0.15',
      },
      {
        explanation: 'Multiply 0.15 by 200 to find the percentage.',
        expression: '0.15 × 200 = 30',
      },
    ],
    finalAnswer: '30',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'sample-3',
    problem: 'Area of a circle with radius 7',
    steps: [
      {
        explanation: 'The formula for the area of a circle is A = π × r².',
        expression: 'A = π × r²',
      },
      {
        explanation: 'Substitute r = 7 into the formula.',
        expression: 'A = π × 7² = π × 49',
      },
      {
        explanation: 'Multiply by π ≈ 3.14159.',
        expression: 'A ≈ 3.14159 × 49 ≈ 153.94',
      },
    ],
    finalAnswer: 'A ≈ 153.94 square units',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];
