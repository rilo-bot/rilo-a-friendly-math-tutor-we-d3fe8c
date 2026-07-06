/**
 * Local fallback solver — no AI required.
 *
 * Handles common K-12 problem patterns and returns a real, computed step-by-step solution
 * including the correct final numeric answer. Used when the RILO AI adapter is not yet
 * configured (missing API key) so the full solve flow proves out from day one.
 *
 * Covers:
 *  - Simple arithmetic: +, -, *, ×, x, /, ÷, ^ (and word forms like "times", "plus", etc.)
 *  - Multi-step expressions via safe numeric evaluation
 *  - "What is X?" / "Calculate X" phrasing
 *  - Fractions: a/b + c/d, a/b * c/d, etc.
 *  - Percentage: "X% of Y", "X percent of Y"
 *  - Square root: "sqrt(X)" / "square root of X"
 */

import type { SolverResult } from './index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Round to 6 sig figs to avoid floating-point noise
  const rounded = parseFloat(n.toPrecision(6));
  return String(rounded);
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

// ---------------------------------------------------------------------------
// Pattern matchers
// ---------------------------------------------------------------------------

/** "X% of Y" or "X percent of Y" */
function tryPercentage(problem: string): SolverResult | null {
  const m =
    problem.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/i) ||
    problem.match(/(\d+(?:\.\d+)?)\s*percent\s+of\s*(\d+(?:\.\d+)?)/i);
  if (!m) return null;

  const pct = parseFloat(m[1]);
  const whole = parseFloat(m[2]);
  const decimal = pct / 100;
  const result = decimal * whole;

  return {
    steps: [
      {
        explanation: `We need to find ${pct}% of ${whole}. "Percent" means "per hundred", so we convert the percentage to a decimal first.`,
        expression: `${pct}% = ${pct} ÷ 100 = ${decimal}`,
      },
      {
        explanation: `Now multiply the decimal by the whole number.`,
        expression: `${decimal} × ${whole} = ${formatNumber(result)}`,
      },
    ],
    finalAnswer: formatNumber(result),
  };
}

/** "sqrt(X)" or "square root of X" */
function trySqrt(problem: string): SolverResult | null {
  const m =
    problem.match(/sqrt\(\s*(\d+(?:\.\d+)?)\s*\)/i) ||
    problem.match(/square\s+root\s+of\s+(\d+(?:\.\d+)?)/i);
  if (!m) return null;

  const n = parseFloat(m[1]);
  const result = Math.sqrt(n);
  const perfect = Number.isInteger(result);

  const steps = perfect
    ? [
        {
          explanation: `We need to find the square root of ${n}. We ask: what number multiplied by itself equals ${n}?`,
          expression: `√${n} = ?`,
        },
        {
          explanation: `${result} × ${result} = ${n}, so the square root of ${n} is ${result}.`,
          expression: `√${n} = ${result}`,
        },
      ]
    : [
        {
          explanation: `We need to find the square root of ${n}. Since ${n} is not a perfect square, we use a calculator or estimation.`,
          expression: `√${n} = ?`,
        },
        {
          explanation: `Using a calculator, √${n} ≈ ${formatNumber(result)} (rounded to 6 significant figures).`,
          expression: `√${n} ≈ ${formatNumber(result)}`,
        },
      ];

  return { steps, finalAnswer: formatNumber(result) };
}

/** Fraction arithmetic: a/b OP c/d */
function tryFraction(problem: string): SolverResult | null {
  // Match patterns like "3/4 + 1/2" or "2/3 * 3/4"
  const m = problem.match(
    /(\d+)\s*\/\s*(\d+)\s*([\+\-\*×xX\/÷]|plus|minus|times|divided\s+by)\s*(\d+)\s*\/\s*(\d+)/i,
  );
  if (!m) return null;

  const [, an, ad, rawOp, bn, bd] = m;
  const a = parseInt(an, 10),
    b = parseInt(ad, 10),
    c = parseInt(bn, 10),
    d = parseInt(bd, 10);

  const op = normaliseOp(rawOp.trim());

  let numResult: number;
  let steps: SolverResult['steps'];

  if (op === '+' || op === '-') {
    const common = lcm(b, d);
    const aAdj = a * (common / b);
    const bAdj = c * (common / d);
    const numRaw = op === '+' ? aAdj + bAdj : aAdj - bAdj;
    const g = gcd(Math.abs(numRaw), common);
    const numSimp = numRaw / g;
    const denSimp = common / g;
    numResult = numSimp / denSimp;

    steps = [
      {
        explanation: `To add or subtract fractions we need a common denominator. The least common multiple (LCM) of ${b} and ${d} is ${common}.`,
        expression: `LCM(${b}, ${d}) = ${common}`,
      },
      {
        explanation: `Convert each fraction to an equivalent fraction with denominator ${common}.`,
        expression: `${a}/${b} = ${aAdj}/${common},  ${c}/${d} = ${bAdj}/${common}`,
      },
      {
        explanation: `Now ${op === '+' ? 'add' : 'subtract'} the numerators.`,
        expression: `${aAdj}/${common} ${op} ${bAdj}/${common} = ${numRaw}/${common}`,
      },
      ...(g > 1
        ? [
            {
              explanation: `Simplify by dividing numerator and denominator by their GCD (${g}).`,
              expression: `${numRaw}/${common} = ${numSimp}/${denSimp} = ${formatNumber(numResult)}`,
            },
          ]
        : [
            {
              explanation: `The fraction ${numRaw}/${common} is already in simplest form.`,
              expression: `= ${numSimp}/${denSimp} = ${formatNumber(numResult)}`,
            },
          ]),
    ];
  } else if (op === '*') {
    const numRaw = a * c;
    const denRaw = b * d;
    const g = gcd(numRaw, denRaw);
    numResult = numRaw / denRaw;
    steps = [
      {
        explanation: `To multiply fractions, multiply the numerators together and the denominators together.`,
        expression: `${a}/${b} × ${c}/${d} = (${a}×${c}) / (${b}×${d}) = ${numRaw}/${denRaw}`,
      },
      {
        explanation: g > 1 ? `Simplify by dividing by the GCD (${g}).` : `The fraction is already in simplest form.`,
        expression: `${numRaw}/${denRaw} = ${numRaw / g}/${denRaw / g} = ${formatNumber(numResult)}`,
      },
    ];
  } else {
    // division: a/b ÷ c/d = a/b × d/c
    const numRaw = a * d;
    const denRaw = b * c;
    const g = gcd(numRaw, denRaw);
    numResult = numRaw / denRaw;
    steps = [
      {
        explanation: `To divide by a fraction, multiply by its reciprocal (flip the second fraction).`,
        expression: `${a}/${b} ÷ ${c}/${d} = ${a}/${b} × ${d}/${c}`,
      },
      {
        explanation: `Multiply the numerators and denominators.`,
        expression: `= (${a}×${d}) / (${b}×${c}) = ${numRaw}/${denRaw}`,
      },
      {
        explanation: g > 1 ? `Simplify by dividing by the GCD (${g}).` : `The fraction is already in simplest form.`,
        expression: `${numRaw}/${denRaw} = ${numRaw / g}/${denRaw / g} = ${formatNumber(numResult)}`,
      },
    ];
  }

  return { steps, finalAnswer: formatNumber(numResult) };
}

/** Normalise operator string to +, -, *, / */
function normaliseOp(op: string): '+' | '-' | '*' | '/' {
  const l = op.toLowerCase();
  if (l === '+' || l === 'plus') return '+';
  if (l === '-' || l === 'minus') return '-';
  if (l === '*' || l === '×' || l === 'x' || l === 'times') return '*';
  return '/';
}

/**
 * Simple two-operand arithmetic: "12 x 8", "144 / 12", "25 + 17", etc.
 * Also handles "What is X OP Y?" phrasing.
 */
function trySimpleArithmetic(problem: string): SolverResult | null {
  // Strip leading question words
  const cleaned = problem
    .replace(/^(what\s+is|calculate|compute|find|evaluate|solve)\s*/i, '')
    .replace(/\?$/, '')
    .trim();

  // Match: NUMBER OP NUMBER  (possibly with extra words stripped)
  const m = cleaned.match(
    /^([\d,]+(?:\.\d+)?)\s*([\+\-\*×xX\/÷]|plus|minus|times|divided\s+by|multiplied\s+by)\s*([\d,]+(?:\.\d+)?)$/i,
  );
  if (!m) return null;

  const a = parseFloat(m[1].replace(/,/g, ''));
  const rawOp = m[2].trim();
  const b = parseFloat(m[3].replace(/,/g, ''));
  const op = normaliseOp(rawOp);

  let result: number;
  let opSymbol: string;
  let opWord: string;

  switch (op) {
    case '+':
      result = a + b;
      opSymbol = '+';
      opWord = 'add';
      break;
    case '-':
      result = a - b;
      opSymbol = '−';
      opWord = 'subtract';
      break;
    case '*':
      result = a * b;
      opSymbol = '×';
      opWord = 'multiply';
      break;
    case '/':
      if (b === 0) return null; // don't attempt divide-by-zero
      result = a / b;
      opSymbol = '÷';
      opWord = 'divide';
      break;
  }

  const steps = buildArithmeticSteps(a, b, op, opSymbol, opWord, result);
  return { steps, finalAnswer: formatNumber(result) };
}

function buildArithmeticSteps(
  a: number,
  b: number,
  op: '+' | '-' | '*' | '/',
  opSymbol: string,
  opWord: string,
  result: number,
): SolverResult['steps'] {
  switch (op) {
    case '+':
      return [
        {
          explanation: `We are adding ${a} and ${b} together. Line them up and add each place value.`,
          expression: `${a} + ${b}`,
        },
        {
          explanation: `${a} + ${b} = ${formatNumber(result)}. That's our answer!`,
          expression: `= ${formatNumber(result)}`,
        },
      ];
    case '-':
      return [
        {
          explanation: `We are subtracting ${b} from ${a}. Start from the ones place and work left, borrowing when needed.`,
          expression: `${a} − ${b}`,
        },
        {
          explanation: `${a} − ${b} = ${formatNumber(result)}.`,
          expression: `= ${formatNumber(result)}`,
        },
      ];
    case '*': {
      const steps: SolverResult['steps'] = [
        {
          explanation: `We are multiplying ${a} by ${b}. Think of it as adding ${a} to itself ${b} time${b !== 1 ? 's' : ''}.`,
          expression: `${a} × ${b}`,
        },
      ];
      // For whole number multiplications where b fits nicely, show partial products
      if (
        Number.isInteger(a) &&
        Number.isInteger(b) &&
        b > 1 &&
        b <= 12 &&
        a <= 9999
      ) {
        steps.push({
          explanation: `Using the multiplication table (or long multiplication): ${a} × ${b} = ${formatNumber(result)}.`,
          expression: `${a} × ${b} = ${formatNumber(result)}`,
        });
      } else {
        steps.push({
          explanation: `Multiply the numbers: ${a} × ${b} = ${formatNumber(result)}.`,
          expression: `${a} × ${b} = ${formatNumber(result)}`,
        });
      }
      steps.push({
        explanation: `The final answer is ${formatNumber(result)}.`,
        expression: `= ${formatNumber(result)}`,
      });
      return steps;
    }
    case '/': {
      const steps: SolverResult['steps'] = [
        {
          explanation: `We are dividing ${a} by ${b}. Division asks: how many times does ${b} fit into ${a}?`,
          expression: `${a} ÷ ${b}`,
        },
      ];
      if (Number.isInteger(result)) {
        steps.push({
          explanation: `${b} fits into ${a} exactly ${formatNumber(result)} times with no remainder.`,
          expression: `${a} ÷ ${b} = ${formatNumber(result)}`,
        });
      } else {
        const whole = Math.floor(a / b);
        const remainder = a - whole * b;
        steps.push({
          explanation: `${b} fits into ${a} about ${whole} times. The remainder is ${remainder}.`,
          expression: `${a} = ${b} × ${whole} + ${remainder}`,
        });
        steps.push({
          explanation: `As a decimal: ${a} ÷ ${b} = ${formatNumber(result)}.`,
          expression: `= ${formatNumber(result)}`,
        });
      }
      return steps;
    }
  }
}

/**
 * Generic safe evaluator for arbitrary arithmetic expressions.
 * Only allows digits, whitespace, and the operators + - * / ^ ( ).
 */
function tryGenericExpression(problem: string): SolverResult | null {
  // Strip question wording
  let expr = problem
    .replace(/^(what\s+is|calculate|compute|find|evaluate|solve)\s*/i, '')
    .replace(/\?$/, '')
    .trim()
    // Normalise operator tokens
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\bx\b/gi, '*')
    .replace(/\btimes\b/gi, '*')
    .replace(/\bdivided\s+by\b/gi, '/')
    .replace(/\bplus\b/gi, '+')
    .replace(/\bminus\b/gi, '-')
    .replace(/\^/g, '**');

  // Whitelist: only allow digits, operators, spaces, parens, dots, commas
  if (!/^[\d\s\+\-\*\/\(\)\.\,\*]+$/.test(expr)) return null;

  // Remove commas (thousands separators)
  expr = expr.replace(/,/g, '');

  let result: number;
  try {
    // eslint-disable-next-line no-new-func
    result = Function(`"use strict"; return (${expr})`)() as number;
  } catch {
    return null;
  }

  if (typeof result !== 'number' || !isFinite(result)) return null;

  return {
    steps: [
      {
        explanation: `Let's evaluate the expression step by step, following the order of operations (PEMDAS/BODMAS): Parentheses first, then Exponents, then Multiplication and Division (left to right), then Addition and Subtraction (left to right).`,
        expression: expr.replace(/\*\*/g, '^'),
      },
      {
        explanation: `After applying all operations in the correct order, we get the final result.`,
        expression: `= ${formatNumber(result)}`,
      },
    ],
    finalAnswer: formatNumber(result),
  };
}

/** Generic "can't parse" fallback — returns a helpful message but no real answer. */
function unknownProblem(problem: string): SolverResult {
  return {
    steps: [
      {
        explanation: `Let's break down the problem: "${problem}". Read through it carefully and identify what information is given and what you need to find.`,
        expression: `Given: ${problem}`,
      },
      {
        explanation: `Set up the appropriate equation or calculation based on the problem type. Make sure to write out every step clearly so you can check your work.`,
        expression: `Set up equation`,
      },
      {
        explanation: `Solve the equation step by step, showing all your work. Double-check each calculation before moving on.`,
        expression: `Solve step by step`,
      },
    ],
    finalAnswer: 'See steps above',
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function solveLocally(problem: string): SolverResult {
  return (
    tryPercentage(problem) ??
    trySqrt(problem) ??
    tryFraction(problem) ??
    trySimpleArithmetic(problem) ??
    tryGenericExpression(problem) ??
    unknownProblem(problem)
  );
}
