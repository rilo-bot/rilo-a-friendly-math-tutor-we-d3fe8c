export interface SolutionStep {
  explanation: string;
  expression?: string;
}

export interface Solution {
  id: string;
  problem: string;
  steps: SolutionStep[];
  finalAnswer: string;
  createdAt: string;
}
