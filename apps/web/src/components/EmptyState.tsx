import { motion } from 'framer-motion';

const TOPIC_PILLS = [
  { emoji: '➕', label: 'Arithmetic' },
  { emoji: '✖️', label: 'Algebra' },
  { emoji: '📐', label: 'Geometry' },
  { emoji: '➗', label: 'Fractions' },
  { emoji: '💯', label: 'Percentages' },
  { emoji: '📈', label: 'Functions' },
];

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="rounded-2xl border border-dashed border-border bg-card/50 py-14 px-8 flex flex-col items-center text-center"
    >
      {/* Icon */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-5 shadow-sm"
      >
        <span className="text-4xl select-none" role="img" aria-label="calculator">
          🧮
        </span>
      </motion.div>

      <h2
        className="text-2xl font-bold text-foreground mb-2"
        style={{ fontFamily: 'Fredoka, sans-serif' }}
      >
        Your solution will appear here
      </h2>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
        Type a math problem above and hit{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs border border-border">
          Enter
        </kbd>{' '}
        — I'll walk you through it step by step!
      </p>

      {/* Topic pills */}
      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-sm">
        {TOPIC_PILLS.map(({ emoji, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.07 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold border border-border"
          >
            <span>{emoji}</span>
            {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
