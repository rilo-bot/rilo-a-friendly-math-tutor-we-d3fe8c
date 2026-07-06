import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useSolverStore } from '@/stores/solverStore';

export default function AppHeader() {
  const count = useSolverStore((s) => s.history.length);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        {/* Logo mark */}
        <motion.div
          initial={{ rotate: -20, scale: 0.7 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand text-brand-foreground shadow-sm flex-shrink-0"
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>

        {/* Wordmark */}
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          MathBuddy
        </motion.span>

        <div className="ml-auto flex items-center gap-3">
          {/* Solved count pill — only after first solve */}
          {count > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-accent/20 text-accent-foreground border border-brand-accent/30"
            >
              <span className="text-brand-accent font-bold">{count}</span>
              <span className="text-muted-foreground">
                {count === 1 ? 'problem solved' : 'problems solved'}
              </span>
            </motion.div>
          )}

          {/* Static badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            Step-by-step solver
          </span>
        </div>
      </div>
    </header>
  );
}
