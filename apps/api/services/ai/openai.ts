/**
 * RILO AI concrete adapter — uses the OpenAI client pointed at RILO's managed endpoint.
 * The rest of the app never imports this file directly; it is loaded by services/ai/index.ts.
 *
 * Platform-injected env vars (never ask the user for these):
 *   OPENAI_API_KEY  — RILO-managed key
 *   OPENAI_BASE_URL — RILO-managed base URL
 */

import OpenAI from 'openai';
import { env } from '../../config/env.js';
import type { SolverResult } from './index.js';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: env.openaiApiKey,
      baseURL: env.openaiBaseUrl,
    });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are MathBuddy, a friendly and encouraging math tutor for K-12 students.
When given a math problem, solve it step-by-step in a clear, age-appropriate way.
Explain the reasoning behind EVERY step so the student understands *why*, not just *what*.
Always end with the final numeric answer.

Respond ONLY with valid JSON in this exact shape (no markdown fences, no extra keys):
{
  "steps": [
    { "explanation": "What you do in this step and why", "expression": "the math expression or equation at this step" }
  ],
  "finalAnswer": "the final numeric result as a plain string, e.g. \\"96\\""
}

Rules:
- steps must have at least 2 entries even for simple problems (set-up + compute).
- explanation must be friendly and clear for the student's age level.
- expression is optional but highly encouraged to show the math concisely.
- finalAnswer must be ONLY the number (or simplified fraction), no units unless part of the problem.`;

export async function solveWithOpenAI(problem: string): Promise<SolverResult> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: problem },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '';

  // Strip optional markdown code fences the model might add despite instructions.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed: { steps: { explanation: string; expression?: string }[]; finalAnswer: string };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned non-JSON response: ${raw.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.steps) || !parsed.finalAnswer) {
    throw new Error('AI response is missing required fields (steps / finalAnswer)');
  }

  return {
    steps: parsed.steps.map((s) => ({
      explanation: s.explanation,
      expression: s.expression,
    })),
    finalAnswer: String(parsed.finalAnswer),
  };
}
