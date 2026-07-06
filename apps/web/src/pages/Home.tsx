import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { History, X, Loader2, Send, Lightbulb } from 'lucide-react';
import { useSolverStore } from '@/stores/solverStore';
import AppHeader from '@/components/AppHeader';
import SolutionCard from '@/components/SolutionCard';
import SessionHistory from '@/components/SessionHistory';
import WelcomeBanner from '@/components/WelcomeBanner';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Solution } from '@/types';

const EXAMPLE_PROBLEMS = [
  '2x + 5 = 13',
  'What is 15% of 200?',
  'Area of a circle with radius 7',
  'Factor x² + 5x + 6',
];

// ---------------------------------------------------------------------------
// Inline problem input — avoids a separate component importing the store twice
// ---------------------------------------------------------------------------
function ProblemInputPanel({ onSolve }: { onSolve: (problem: string) => Promise<void> }) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = useSolverStore((s) => s.isLoading);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setText('');
    await onSolve(trimmed);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={submit}>
        <div className="relative rounded-2xl border-2 border-border bg-background shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 transition-all duration-200">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your math problem here"
            rows={2}
            disabled={isLoading}
            className="resize-none border-0 bg-transparent text-base pr-14 py-4 px-5 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 min-h-[72px]"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          />
          <div className="absolute right-3 bottom-3">
            <Button
              type="submit"
              disabled={!text.trim() || isLoading}
              size="sm"
              className="rounded-xl h-10 px-4 bg-brand hover:bg-brand/90 text-brand-foreground shadow-sm transition-all duration-150 active:scale-95 font-semibold"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Solving…
                  </motion.span>
                ) : (
                  <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                    <Send className="w-4 h-4" />
                    Solve it
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground px-1">
          Press{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">
            Enter
          </kbd>{' '}
          to solve &nbsp;·&nbsp; Shift+Enter for a new line
        </p>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold mr-1">
          <Lightbulb className="w-3.5 h-3.5" /> Try:
        </span>
        {EXAMPLE_PROBLEMS.map((ex) => (
          <motion.button
            key={ex}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setText(ex);
              textareaRef.current?.focus();
            }}
            type="button"
            className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-150 font-medium"
          >
            {ex}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Home() {
  const { currentSolution, history, error, clearError, isLoading, solve } = useSolverStore();
  const [viewingSolution, setViewingSolution] = useState<Solution | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeSolution = viewingSolution ?? currentSolution;
  const isCurrentNew = activeSolution?.id === currentSolution?.id && viewingSolution === null;

  const handleSolve = async (problem: string) => {
    setViewingSolution(null);
    await solve(problem);
  };

  const handleSelectHistory = (s: Solution) => {
    setViewingSolution(s);
    setHistoryOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6 items-start">
          {/* ---- Main column ---- */}
          <div className="flex-1 min-w-0 space-y-6">
            <WelcomeBanner />

            {/* Input card */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-lg">🔢</span> Type your math problem
              </h2>
              <ProblemInputPanel onSolve={handleSolve} />
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive"
                >
                  <span className="text-lg">😬</span>
                  <span className="text-sm font-medium flex-1">{error}</span>
                  <button onClick={clearError} className="hover:opacity-70">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Solution / loading / empty */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-card border border-border p-10 flex flex-col items-center gap-4"
                >
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-3 h-3 rounded-full bg-brand"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Working through the steps…
                  </p>
                </motion.div>
              ) : activeSolution ? (
                <motion.div key={activeSolution.id} initial={false}>
                  <SolutionCard solution={activeSolution} isNew={isCurrentNew} />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={false}>
                  <EmptyState />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ---- Desktop sidebar: session history ---- */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-4 border-b border-border flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground">Session History</h2>
                {history.length > 0 && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-brand text-brand-foreground font-bold">
                    {history.length}
                  </span>
                )}
              </div>
              <SessionHistory
                history={history}
                onSelect={handleSelectHistory}
                selectedId={viewingSolution?.id}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile FAB — open history sheet */}
      <AnimatePresence>
        {history.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setHistoryOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand text-brand-foreground shadow-lg flex items-center justify-center"
          >
            <History className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-accent text-[10px] font-bold flex items-center justify-center text-foreground">
              {history.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile history bottom sheet */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setHistoryOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-border shadow-2xl max-h-[70vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-card px-5 py-4 border-b border-border flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-bold flex-1">Session History</h2>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SessionHistory
                history={history}
                onSelect={handleSelectHistory}
                selectedId={viewingSolution?.id}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
