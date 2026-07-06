/**
 * Local math solve engine — computes real step-by-step solutions with
 * correct numeric answers for common K-12 problem types.
 *
 * This is the fallback that runs when the AI adapter is not yet configured.
 * It handles: arithmetic, percentages, simple linear equations, basic
 * geometry (area/perimeter of circle, rectangle, triangle, square).
 */

import type { Solution, SolutionStep } from '@/types';

let counter = 0;
function nextId() {
  counter += 1;
  return `local-${Date.now()}-${counter}`;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function round(n: number, dp = 4): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function fmt(n: number): string {
  // Remove trailing zeros after decimal point
  return String(round(n, 6)).replace(/\.?0+$/, '');
}

// ─── pattern matchers ────────────────────────────────────────────────────────

/**
 * "what is X op Y?" — handles natural language arithmetic questions.
 * Supports: +, -, *, /, x, times, plus, minus, divided by, mod, ^, squared, cubed
 */
function tryArithmetic(raw: string): Solution | null {
  const p = raw.trim();

  // Normalise "what is …?" shell
  const stripped = p
    .replace(/^what\s+is\s+/i, '')
    .replace(/\?$/, '')
    .trim();

  // Replace word operators
  const normalised = stripped
    .replace(/\btimes\b/gi, '*')
    .replace(/\bmultiplied\s+by\b/gi, '*')
    .replace(/\bdivided\s+by\b/gi, '/')
    .replace(/\bplus\b/gi, '+')
    .replace(/\bminus\b/gi, '-')
    .replace(/\bmod(?:ulo)?\b/gi, '%')
    .replace(/\bto\s+the\s+power\s+of\b/gi, '^')
    .replace(/\s*×\s*/g, '*')
    .replace(/\s*÷\s*/g, '/')
    .replace(/\s*\^\s*/g, '^')
    .trim();

  // Handle "N squared" / "N cubed"
  const squaredMatch = normalised.match(/^([0-9.]+)\s+squared$/i);
  if (squaredMatch) {
    const base = parseFloat(squaredMatch[1]);
    const result = base * base;
    return makeSquaredSolution(p, base, result);
  }

  const cubedMatch = normalised.match(/^([0-9.]+)\s+cubed$/i);
  if (cubedMatch) {
    const base = parseFloat(cubedMatch[1]);
    const result = base * base * base;
    return makeCubedSolution(p, base, result);
  }

  // Simple binary: A op B
  const binMatch = normalised.match(
    /^(-?[0-9]+(?:\.[0-9]+)?)\s*([\+\-\*\/\%\^])\s*(-?[0-9]+(?:\.[0-9]+)?)$/
  );
  if (binMatch) {
    const a = parseFloat(binMatch[1]);
    const op = binMatch[2];
    const b = parseFloat(binMatch[3]);
    return makeBinaryArithSolution(p, a, op, b);
  }

  // Chained arithmetic — try safe eval via recursive descent
  const chainMatch = /^[0-9\s\+\-\*\/\%\^\.\(\)]+$/.test(normalised);
  if (chainMatch) {
    try {
      const result = evalExpr(normalised);
      if (isFinite(result)) {
        return makeChainSolution(p, normalised, result);
      }
    } catch {
      // fall through
    }
  }

  return null;
}

/**
 * "X% of Y" or "what is X percent of Y"
 */
function tryPercentage(raw: string): Solution | null {
  const p = raw.trim();
  const m = p.match(
    /(?:what\s+is\s+)?([0-9]+(?:\.[0-9]+)?)\s*(?:%|percent(?:age)?)\s+of\s+([0-9]+(?:\.[0-9]+)?)/i
  );
  if (!m) return null;

  const pct = parseFloat(m[1]);
  const whole = parseFloat(m[2]);
  const result = round((pct / 100) * whole, 6);

  const steps: SolutionStep[] = [
    {
      explanation: `"Percent" means "out of 100", so ${fmt(pct)}% can be written as a decimal by dividing by 100.`,
      expression: `${fmt(pct)}% = ${fmt(pct)} ÷ 100 = ${fmt(pct / 100)}`,
    },
    {
      explanation: `Multiply the decimal by the whole number to find the percentage.`,
      expression: `${fmt(pct / 100)} × ${fmt(whole)} = ${fmt(result)}`,
    },
    {
      explanation: `So ${fmt(pct)}% of ${fmt(whole)} is ${fmt(result)}.`,
    },
  ];

  return {
    id: nextId(),
    problem: p,
    steps,
    finalAnswer: fmt(result),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Simple linear equation: ax + b = c  (one variable, one step)
 */
function tryLinearEquation(raw: string): Solution | null {
  const p = raw.trim();

  // Match patterns like: 2x + 5 = 13,  3x - 7 = 8,  x + 4 = 10, 5x = 20
  const m = p.match(
    /^(-?[0-9]*(?:\.[0-9]+)?)\s*\*?\s*x\s*([+\-]\s*[0-9]+(?:\.[0-9]+)?)?\s*=\s*(-?[0-9]+(?:\.[0-9]+)?)$/i
  );
  if (!m) return null;

  const aStr = m[1] === '' || m[1] === '-' ? (m[1] === '-' ? '-1' : '1') : m[1];
  const a = parseFloat(aStr);
  const bStr = m[2] ? m[2].replace(/\s/g, '') : '0';
  const b = parseFloat(bStr);
  const c = parseFloat(m[3]);

  if (isNaN(a) || isNaN(b) || isNaN(c)) return null;

  const steps: SolutionStep[] = [
    {
      explanation: `Start with the equation as given.`,
      expression: p.replace(/\s*=\s*/, ' = '),
    },
  ];

  if (b !== 0) {
    const rhs = c - b;
    steps.push({
      explanation: `${b > 0 ? 'Subtract' : 'Add'} ${fmt(Math.abs(b))} from both sides to move the constant to the right.`,
      expression: `${fmt(a)}x = ${fmt(c)} ${b > 0 ? '−' : '+'} ${fmt(Math.abs(b))}  →  ${fmt(a)}x = ${fmt(rhs)}`,
    });

    if (a !== 1) {
      const x = round(rhs / a, 6);
      steps.push({
        explanation: `Divide both sides by ${fmt(a)} to isolate x.`,
        expression: `x = ${fmt(rhs)} ÷ ${fmt(a)}  →  x = ${fmt(x)}`,
      });
      steps.push({
        explanation: `Check: substitute x = ${fmt(x)} back into the original equation: ${fmt(a)}(${fmt(x)}) ${b >= 0 ? '+' : '−'} ${fmt(Math.abs(b))} = ${fmt(a * x + b)} ✓`,
      });
      return { id: nextId(), problem: p, steps, finalAnswer: `x = ${fmt(x)}`, createdAt: new Date().toISOString() };
    } else {
      const x = round(rhs, 6);
      steps.push({
        explanation: `Check: substitute x = ${fmt(x)} back in: ${fmt(x)} ${b >= 0 ? '+' : '−'} ${fmt(Math.abs(b))} = ${fmt(x + b)} ✓`,
      });
      return { id: nextId(), problem: p, steps, finalAnswer: `x = ${fmt(x)}`, createdAt: new Date().toISOString() };
    }
  } else {
    // no constant term: ax = c
    const x = round(c / a, 6);
    if (a !== 1) {
      steps.push({
        explanation: `Divide both sides by ${fmt(a)} to isolate x.`,
        expression: `x = ${fmt(c)} ÷ ${fmt(a)}  →  x = ${fmt(x)}`,
      });
    }
    steps.push({
      explanation: `Check: ${fmt(a)} × ${fmt(x)} = ${fmt(a * x)} ✓`,
    });
    return { id: nextId(), problem: p, steps, finalAnswer: `x = ${fmt(x)}`, createdAt: new Date().toISOString() };
  }
}

/**
 * Geometry — area of circle, rectangle, triangle, square
 */
function tryGeometry(raw: string): Solution | null {
  const p = raw.trim();
  const lower = p.toLowerCase();

  // Circle area
  const circleArea = lower.match(
    /area\s+of\s+(?:a\s+)?circle\s+(?:with\s+)?(?:radius|r)\s*(?:=|of|is)?\s*([0-9]+(?:\.[0-9]+)?)/i
  );
  if (circleArea) {
    const r = parseFloat(circleArea[1]);
    const area = round(Math.PI * r * r, 4);
    return {
      id: nextId(),
      problem: p,
      steps: [
        { explanation: 'The formula for the area of a circle is A = π × r².', expression: 'A = π × r²' },
        { explanation: `Substitute r = ${fmt(r)}.`, expression: `A = π × ${fmt(r)}² = π × ${fmt(r * r)}` },
        { explanation: `Multiply by π ≈ 3.14159.`, expression: `A ≈ 3.14159 × ${fmt(r * r)} ≈ ${fmt(area)}` },
        { explanation: `The area is approximately ${fmt(area)} square units.` },
      ],
      finalAnswer: `A ≈ ${fmt(area)} square units`,
      createdAt: new Date().toISOString(),
    };
  }

  // Circle circumference
  const circleCirc = lower.match(
    /circumference\s+of\s+(?:a\s+)?circle\s+(?:with\s+)?(?:radius|r)\s*(?:=|of|is)?\s*([0-9]+(?:\.[0-9]+)?)/i
  );
  if (circleCirc) {
    const r = parseFloat(circleCirc[1]);
    const circ = round(2 * Math.PI * r, 4);
    return {
      id: nextId(),
      problem: p,
      steps: [
        { explanation: 'The formula for the circumference of a circle is C = 2π × r.', expression: 'C = 2 × π × r' },
        { explanation: `Substitute r = ${fmt(r)}.`, expression: `C = 2 × π × ${fmt(r)} = ${fmt(2 * r)}π` },
        { explanation: `Multiply: C ≈ ${fmt(2 * r)} × 3.14159 ≈ ${fmt(circ)}` },
      ],
      finalAnswer: `C ≈ ${fmt(circ)} units`,
      createdAt: new Date().toISOString(),
    };
  }

  // Rectangle area
  const rectArea = lower.match(
    /area\s+of\s+(?:a\s+)?rectangle\s+(?:with\s+)?(?:length|l)\s*(?:=|of|is)?\s*([0-9]+(?:\.[0-9]+)?)\s+(?:and\s+)?(?:width|w)\s*(?:=|of|is)?\s*([0-9]+(?:\.[0-9]+)?)/i
  );
  if (rectArea) {
    const l = parseFloat(rectArea[1]);
    const w = parseFloat(rectArea[2]);
    const area = round(l * w, 4);
    return {
      id: nextId(),
      problem: p,
      steps: [
        { explanation: 'The formula for the area of a rectangle is A = length × width.', expression: 'A = l × w' },
        { explanation: `Substitute l = ${fmt(l)} and w = ${fmt(w)}.`, expression: `A = ${fmt(l)} × ${fmt(w)} = ${fmt(area)}` },
      ],
      finalAnswer: `A = ${fmt(area)} square units`,
      createdAt: new Date().toISOString(),
    };
  }

  // Square area
  const squareArea = lower.match(
    /area\s+of\s+(?:a\s+)?square\s+(?:with\s+)?(?:side|s)\s*(?:=|of|is)?\s*([0-9]+(?:\.[0-9]+)?)/i
  );
  if (squareArea) {
    const s = parseFloat(squareArea[1]);
    const area = s * s;
    return {
      id: nextId(),
      problem: p,
      steps: [
        { explanation: 'The formula for the area of a square is A = side².', expression: 'A = s²' },
        { explanation: `Substitute s = ${fmt(s)}.`, expression: `A = ${fmt(s)}² = ${fmt(area)}` },
      ],
      finalAnswer: `A = ${fmt(area)} square units`,
      createdAt: new Date().toISOString(),
    };
  }

  // Triangle area
  const triArea = lower.match(
    /area\s+of\s+(?:a\s+)?triangle\s+(?:with\s+)?base\s*(?:=|of|is)?\s*([0-9]+(?:\.[0-9]+)?)\s+(?:and\s+)?height\s*(?:=|of|is)?\s*([0-9]+(?:\.[0-9]+)?)/i
  );
  if (triArea) {
    const base = parseFloat(triArea[1]);
    const height = parseFloat(triArea[2]);
    const area = round(0.5 * base * height, 4);
    return {
      id: nextId(),
      problem: p,
      steps: [
        { explanation: 'The formula for the area of a triangle is A = ½ × base × height.', expression: 'A = ½ × b × h' },
        { explanation: `Substitute b = ${fmt(base)} and h = ${fmt(height)}.`, expression: `A = ½ × ${fmt(base)} × ${fmt(height)} = ${fmt(area)}` },
      ],
      finalAnswer: `A = ${fmt(area)} square units`,
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Quadratic formula: ax² + bx + c = 0
 */
function tryQuadratic(raw: string): Solution | null {
  const p = raw.trim();
  // Factor simple quadratics: x² + bx + c = 0
  const m = p.match(
    /^x\s*[\^²]?\s*2?\s*([+\-]\s*[0-9]+(?:\.[0-9]+)?)\s*x\s*([+\-]\s*[0-9]+(?:\.[0-9]+)?)?\s*=\s*0$/i
  );
  if (!m) return null;

  const bStr = m[1].replace(/\s/g, '');
  const cStr = m[2] ? m[2].replace(/\s/g, '') : '0';
  const b = parseFloat(bStr);
  const c = parseFloat(cStr);

  if (isNaN(b) || isNaN(c)) return null;

  // Try factoring: find integers p, q where p+q = b and p*q = c
  const discriminant = b * b - 4 * c;
  if (discriminant < 0) return null;

  const sqrtDisc = Math.sqrt(discriminant);
  const x1 = round((-b + sqrtDisc) / 2, 6);
  const x2 = round((-b - sqrtDisc) / 2, 6);

  const steps: SolutionStep[] = [
    { explanation: 'Write the equation in standard form ax² + bx + c = 0.', expression: `x² ${b >= 0 ? '+' : ''}${fmt(b)}x ${c >= 0 ? '+' : ''}${fmt(c)} = 0` },
    { explanation: 'Identify a = 1, b and c from the equation.', expression: `a = 1, b = ${fmt(b)}, c = ${fmt(c)}` },
    { explanation: 'Use the quadratic formula x = (−b ± √(b²−4ac)) / 2a.', expression: `x = (−${fmt(b)} ± √(${fmt(b)}² − 4(1)(${fmt(c)}))) / 2` },
    { explanation: 'Calculate the discriminant b² − 4ac.', expression: `${fmt(b)}² − 4(1)(${fmt(c)}) = ${fmt(b * b)} − ${fmt(4 * c)} = ${fmt(discriminant)}` },
    { explanation: `Take the square root of the discriminant.`, expression: `√${fmt(discriminant)} ≈ ${fmt(sqrtDisc)}` },
    {
      explanation: `Compute both solutions.`,
      expression: `x₁ = (${fmt(-b)} + ${fmt(sqrtDisc)}) / 2 = ${fmt(x1)},   x₂ = (${fmt(-b)} − ${fmt(sqrtDisc)}) / 2 = ${fmt(x2)}`,
    },
  ];

  const answer = x1 === x2 ? `x = ${fmt(x1)}` : `x = ${fmt(x1)} or x = ${fmt(x2)}`;
  return { id: nextId(), problem: p, steps, finalAnswer: answer, createdAt: new Date().toISOString() };
}

// ─── solution builders ───────────────────────────────────────────────────────

function opLabel(op: string): string {
  switch (op) {
    case '+': return 'Add';
    case '-': return 'Subtract';
    case '*': return 'Multiply';
    case '/': return 'Divide';
    case '%': return 'Find the remainder (modulo)';
    case '^': return 'Raise to the power of';
    default: return 'Calculate';
  }
}

function opWord(op: string, a: number, b: number): string {
  switch (op) {
    case '+': return `${fmt(a)} + ${fmt(b)}`;
    case '-': return `${fmt(a)} − ${fmt(b)}`;
    case '*': return `${fmt(a)} × ${fmt(b)}`;
    case '/': return `${fmt(a)} ÷ ${fmt(b)}`;
    case '%': return `${fmt(a)} mod ${fmt(b)}`;
    case '^': return `${fmt(a)}^${fmt(b)}`;
    default: return `${fmt(a)} ${op} ${fmt(b)}`;
  }
}

function computeBinary(a: number, op: string, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return a / b;
    case '%': return a % b;
    case '^': return Math.pow(a, b);
    default: return NaN;
  }
}

function makeBinaryArithSolution(
  originalProblem: string,
  a: number,
  op: string,
  b: number
): Solution {
  const result = computeBinary(a, op, b);
  const steps: SolutionStep[] = [];

  if (op === '*') {
    steps.push({
      explanation: `We need to multiply ${fmt(a)} by ${fmt(b)}.`,
      expression: `${fmt(a)} × ${fmt(b)}`,
    });
    // Show intermediate for larger numbers
    if (Number.isInteger(a) && Number.isInteger(b) && a > 9 && b > 1) {
      steps.push({
        explanation: `One way to think about this: ${fmt(a)} × ${fmt(b)} means adding ${fmt(a)} to itself ${fmt(b)} times, or we can use the standard multiplication algorithm.`,
        expression: `${fmt(a)} × ${fmt(b)} = ${fmt(result)}`,
      });
    }
    steps.push({
      explanation: `Multiply: ${fmt(a)} × ${fmt(b)} = ${fmt(result)}.`,
      expression: `= ${fmt(result)}`,
    });
  } else if (op === '/') {
    steps.push({
      explanation: `We need to divide ${fmt(a)} by ${fmt(b)}.`,
      expression: `${fmt(a)} ÷ ${fmt(b)}`,
    });
    if (b !== 0) {
      const quotient = Math.floor(a / b);
      const remainder = a % b;
      if (Number.isInteger(a) && Number.isInteger(b) && remainder !== 0) {
        steps.push({
          explanation: `${fmt(b)} goes into ${fmt(a)} a total of ${fmt(quotient)} times, with a remainder of ${fmt(remainder)}.`,
          expression: `${fmt(a)} ÷ ${fmt(b)} = ${fmt(quotient)} remainder ${fmt(remainder)}`,
        });
      }
      steps.push({
        explanation: `The result of ${fmt(a)} ÷ ${fmt(b)} is ${fmt(result)}.`,
        expression: `= ${fmt(result)}`,
      });
    }
  } else if (op === '+') {
    steps.push({
      explanation: `We need to add ${fmt(a)} and ${fmt(b)} together.`,
      expression: `${fmt(a)} + ${fmt(b)}`,
    });
    steps.push({
      explanation: `Adding the numbers: ${fmt(a)} + ${fmt(b)} = ${fmt(result)}.`,
      expression: `= ${fmt(result)}`,
    });
  } else if (op === '-') {
    steps.push({
      explanation: `We need to subtract ${fmt(b)} from ${fmt(a)}.`,
      expression: `${fmt(a)} − ${fmt(b)}`,
    });
    steps.push({
      explanation: `Subtracting: ${fmt(a)} − ${fmt(b)} = ${fmt(result)}.`,
      expression: `= ${fmt(result)}`,
    });
  } else if (op === '^') {
    steps.push({
      explanation: `We need to raise ${fmt(a)} to the power of ${fmt(b)}. This means multiplying ${fmt(a)} by itself ${fmt(b)} time(s).`,
      expression: `${fmt(a)}^${fmt(b)}`,
    });
    if (b >= 2 && b <= 5 && Number.isInteger(b)) {
      const terms = Array(b as number).fill(fmt(a)).join(' × ');
      steps.push({ explanation: `Write it out:`, expression: `${terms} = ${fmt(result)}` });
    } else {
      steps.push({ explanation: `Calculate:`, expression: `${fmt(a)}^${fmt(b)} = ${fmt(result)}` });
    }
  } else if (op === '%') {
    steps.push({
      explanation: `We need to find the remainder when ${fmt(a)} is divided by ${fmt(b)}.`,
      expression: `${fmt(a)} mod ${fmt(b)}`,
    });
    const q = Math.floor(a / b);
    steps.push({
      explanation: `${fmt(b)} goes into ${fmt(a)} exactly ${fmt(q)} times (${fmt(b)} × ${fmt(q)} = ${fmt(b * q)}). The remainder is what's left over.`,
      expression: `${fmt(a)} − (${fmt(b)} × ${fmt(q)}) = ${fmt(a)} − ${fmt(b * q)} = ${fmt(result)}`,
    });
  } else {
    steps.push({
      explanation: `${opLabel(op)} ${fmt(a)} and ${fmt(b)}.`,
      expression: `${opWord(op, a, b)} = ${fmt(result)}`,
    });
  }

  steps.push({
    explanation: `The answer is ${fmt(result)}. ✓`,
  });

  return {
    id: nextId(),
    problem: originalProblem,
    steps,
    finalAnswer: fmt(result),
    createdAt: new Date().toISOString(),
  };
}

function makeSquaredSolution(problem: string, base: number, result: number): Solution {
  return {
    id: nextId(),
    problem,
    steps: [
      { explanation: `"Squared" means multiplying the number by itself.`, expression: `${fmt(base)}² = ${fmt(base)} × ${fmt(base)}` },
      { explanation: `Multiply ${fmt(base)} × ${fmt(base)}.`, expression: `= ${fmt(result)}` },
      { explanation: `The answer is ${fmt(result)}. ✓` },
    ],
    finalAnswer: fmt(result),
    createdAt: new Date().toISOString(),
  };
}

function makeCubedSolution(problem: string, base: number, result: number): Solution {
  return {
    id: nextId(),
    problem,
    steps: [
      { explanation: `"Cubed" means multiplying the number by itself three times.`, expression: `${fmt(base)}³ = ${fmt(base)} × ${fmt(base)} × ${fmt(base)}` },
      { explanation: `First: ${fmt(base)} × ${fmt(base)} = ${fmt(base * base)}.`, expression: `${fmt(base)} × ${fmt(base)} = ${fmt(base * base)}` },
      { explanation: `Then: ${fmt(base * base)} × ${fmt(base)} = ${fmt(result)}.`, expression: `${fmt(base * base)} × ${fmt(base)} = ${fmt(result)}` },
      { explanation: `The answer is ${fmt(result)}. ✓` },
    ],
    finalAnswer: fmt(result),
    createdAt: new Date().toISOString(),
  };
}

function makeChainSolution(problem: string, expr: string, result: number): Solution {
  return {
    id: nextId(),
    problem,
    steps: [
      { explanation: `We need to evaluate the expression: ${expr}.` },
      { explanation: `Following the order of operations (PEMDAS/BODMAS): Parentheses first, then Exponents, then Multiplication/Division left to right, then Addition/Subtraction left to right.` },
      { explanation: `Evaluating step by step gives us:`, expression: `${expr} = ${fmt(result)}` },
      { explanation: `The answer is ${fmt(result)}. ✓` },
    ],
    finalAnswer: fmt(result),
    createdAt: new Date().toISOString(),
  };
}

// ─── safe expression evaluator (no eval()) ───────────────────────────────────

function evalExpr(expr: string): number {
  const tokens = tokenise(expr);
  let pos = 0;

  function peek() { return tokens[pos]; }
  function consume() { return tokens[pos++]; }

  function parseExpr(): number { return parseAddSub(); }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseMulDiv();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parsePow();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parsePow();
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }

  function parsePow(): number {
    const base = parseUnary();
    if (peek() === '^') { consume(); return Math.pow(base, parsePow()); }
    return base;
  }

  function parseUnary(): number {
    if (peek() === '-') { consume(); return -parsePrimary(); }
    if (peek() === '+') { consume(); return parsePrimary(); }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const t = peek();
    if (t === '(') {
      consume();
      const val = parseExpr();
      consume(); // ')'
      return val;
    }
    consume();
    const n = parseFloat(t);
    if (isNaN(n)) throw new Error(`Unexpected token: ${t}`);
    return n;
  }

  return parseExpr();
}

function tokenise(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (c === ' ') { i++; continue; }
    if ('+-*/^()'.includes(c)) { tokens.push(c); i++; continue; }
    if (c >= '0' && c <= '9' || c === '.') {
      let num = '';
      while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) {
        num += expr[i++];
      }
      tokens.push(num);
      continue;
    }
    i++;
  }
  return tokens;
}

// ─── generic fallback ────────────────────────────────────────────────────────

function makeGenericSolution(problem: string): Solution {
  return {
    id: nextId(),
    problem,
    steps: [
      {
        explanation: `Let's read the problem carefully: "${problem}"`,
      },
      {
        explanation:
          'Identify what is being asked and what information you have. Write down any known values and the operation(s) needed.',
      },
      {
        explanation:
          'Apply the relevant rule or formula step by step, keeping both sides of any equation balanced.',
      },
      {
        explanation:
          'Simplify your expression until you reach the simplest form or a single value.',
      },
      {
        explanation:
          'Check your answer by substituting it back into the original problem or verifying it makes sense in context. ✓',
      },
    ],
    finalAnswer: 'See the steps above — connect to AI for a fully computed solution!',
    createdAt: new Date().toISOString(),
  };
}

// ─── public API ─────────────────────────────────────────────────────────────

/**
 * Attempt to solve `problem` locally.
 * Tries each solver in order; returns the first match.
 * Falls back to a generic step-guide if no pattern matches.
 */
export function solveLocally(problem: string): Solution {
  return (
    tryPercentage(problem) ??
    tryLinearEquation(problem) ??
    tryQuadratic(problem) ??
    tryGeometry(problem) ??
    tryArithmetic(problem) ??
    makeGenericSolution(problem)
  );
}
