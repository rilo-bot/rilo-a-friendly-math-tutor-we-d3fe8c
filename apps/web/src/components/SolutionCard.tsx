import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Zap, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Solution } from '@/types';

interface Props {
  solution: Solution;
  isNew?: boolean;
}

const ENCOURAGEMENTS = [
  "Great question! Here's how to solve it 🎉",
  "Let's work through this together! 🚀",
  "Nice one! Here's the full solution 🌟",
  "You've got this! Let me show you the steps 💡",
  "Excellent! Here's the step-by-step breakdown ✨",
  "Awesome problem! Let me break it down 🔥",
];

function pickEncouragement(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ENCOURAGEMENTS[Math.abs(hash) % ENCOURAGEMENTS.length];
}

/** Guess topic from problem text for a friendly badge */
function guessTopic(problem: string): string {
  const p = problem.toLowerCase();
  if (/\bfactor\b|quadratic|x\^2|x²/.test(p)) return 'Algebra';
  if (/\bequation\b|solve for|\bsolve\b/.test(p)) return 'Equations';
  if (/\barea\b|\bperimeter\b|\bcircle\b|\btriangle\b|\bsquare\b|\bradius\b/.test(p)) return 'Geometry';
  if (/percent|%/.test(p)) return 'Percentages';
  if (/fraction|\//.test(p)) return 'Fractions';
  if (/slope|intercept|linear|y\s*=/.test(p)) return 'Linear Functions';
  if (/\bderivative\b|\bintegral\b|\blimit\b/.test(p)) return 'Calculus';
  if (/\bprobability\b|\bchance\b/.test(p)) return 'Probability';
  if (/\btimes\b|\bmultiply\b|×|\bplus\b|\badd\b|\bsubtract\b|\bdivide\b/.test(p)) return 'Arithmetic';
  return 'Math';
}

const TOPIC_COLORS: Record<string, string> = {
  Algebra: 'bg-primary/15 text-primary border-primary/25',
  Equations: 'bg-primary/15 text-primary border-primary/25',
  Geometry: 'bg-brand-accent/20 text-brand-accent border-brand-accent/30',
  Percentages: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  Fractions: 'bg-chart-5/20 text-chart-5 border-chart-5/30',
  'Linear Functions': 'bg-primary/15 text-primary border-primary/25',
  Calculus: 'bg-destructive/15 text-destructive border-destructive/25',
  Probability: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  Arithmetic: 'bg-secondary text-secondary-foreground border-border',
  Math: 'bg-muted text-muted-foreground border-border',
};

const stepVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.32, ease: 'easeOut' },
  }),
};

export default function SolutionCard({ solution, isNew = false }: Props) {
  const encouragement = pickEncouragement(solution.id);
  const topic = guessTopic(solution.problem);
  const topicClass = TOPIC_COLORS[topic] ?? TOPIC_COLORS['Math'];

  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = async () => {
    const text = [
      `Problem: ${solution.problem}`,
      '',
      'Steps:',
      ...solution.steps.map((s, i) => {
        const expr = s.expression ? `\n   ${s.expression}` : '';
        return `Step ${i + 1}. ${s.explanation}${expr}`;
      }),
      '',
      `Answer: ${solution.finalAnswer}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback — ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 24, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      className="w-full rounded-2xl bg-card border border-border shadow-md overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-5 bg-gradient-to-br from-primary/10 via-brand/5 to-brand-accent/10 border-b border-border">
        <div className="flex items-start gap-3">
          <motion.div
            initial={isNew ? { scale: 0, rotate: -20 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.05 }}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-brand text-brand-foreground flex items-center justify-center"
          >
            <Zap className="w-4 h-4" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`inline-flex text-xs font-bold px-2.5 py-0.5 rounded-full border ${topicClass}`}>
                {topic}
              </span>
              <p className="text-xs font-semibold text-muted-foreground">{encouragement}</p>
            </div>
            <p
              className="text-xl font-bold text-foreground leading-snug break-words"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              {solution.problem}
            </p>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1 ml-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              title="Copy solution"
              className="w-8 h-8 rounded-lg bg-background/70 hover:bg-background flex items-center justify-center border border-border transition-colors"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-3.5 h-3.5 text-brand-accent" />
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Show steps' : 'Collapse'}
              className="w-8 h-8 rounded-lg bg-background/70 hover:bg-background flex items-center justify-center border border-border transition-colors"
            >
              {collapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Steps (collapsible) ─────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-6 pt-5 pb-4 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Step-by-Step Solution
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                  {solution.steps.length} steps
                </span>
              </div>

              <ol className="space-y-3 relative">
                {/* Vertical connector line */}
                <div className="absolute left-3.5 top-7 bottom-7 w-px bg-border" aria-hidden />

                {solution.steps.map((step, i) => (
                  <motion.li
                    key={i}
                    custom={i}
                    variants={stepVariants}
                    initial={isNew ? 'hidden' : 'visible'}
                    animate="visible"
                    className="flex gap-4 relative"
                  >
                    {/* Step number bubble */}
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-10 shadow-sm">
                      {i + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                        Step {i + 1}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{step.explanation}</p>
                      {step.expression && (
                        <motion.div
                          initial={isNew ? { opacity: 0, x: -8 } : false}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 + 0.15 }}
                          className="mt-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-muted to-muted/50 border border-border flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent flex-shrink-0" />
                          <code className="text-sm font-mono text-foreground font-semibold break-all leading-relaxed">
                            {step.expression}
                          </code>
                        </motion.div>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Final Answer ────────────────────────────────────────── */}
      <motion.div
        initial={isNew ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: collapsed ? 0 : solution.steps.length * 0.1 + 0.15, duration: 0.35 }}
        className="mx-5 mb-5 px-5 py-4 rounded-2xl bg-gradient-to-r from-brand-accent/20 via-brand/10 to-primary/10 border-2 border-brand/20 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-full bg-brand-accent/20 border-2 border-brand-accent/40 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-brand-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
            Final Answer
          </p>
          <p
            className="text-2xl font-bold text-foreground break-words"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            {solution.finalAnswer}
          </p>
        </div>
        <motion.div
          initial={isNew ? { scale: 0 } : false}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: solution.steps.length * 0.1 + 0.25 }}
          className="text-2xl flex-shrink-0 select-none"
        >
          🎉
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
