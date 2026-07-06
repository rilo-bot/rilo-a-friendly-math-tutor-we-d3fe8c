import { motion } from 'framer-motion';
import { Calculator, Sigma, BookOpen, TrendingUp } from 'lucide-react';

const floatingIcons = [
  { Icon: Calculator, delay: 0, x: '8%', y: '18%', rotate: -14, size: 'w-9 h-9' },
  { Icon: Sigma, delay: 0.15, x: '84%', y: '12%', rotate: 12, size: 'w-10 h-10' },
  { Icon: BookOpen, delay: 0.3, x: '80%', y: '65%', rotate: -8, size: 'w-8 h-8' },
  { Icon: TrendingUp, delay: 0.45, x: '4%', y: '68%', rotate: 7, size: 'w-9 h-9' },
];

export default function WelcomeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-brand to-brand-accent p-8 sm:p-10 text-brand-foreground shadow-xl"
    >
      {/* Floating decorative icons */}
      {floatingIcons.map(({ Icon, delay, x, y, rotate, size }) => (
        <motion.div
          key={`${x}-${y}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.18, scale: 1, rotate }}
          transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
          className="absolute pointer-events-none text-white"
          style={{ left: x, top: y }}
        >
          <Icon className={size} />
        </motion.div>
      ))}

      {/* Blobs */}
      <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-sm border border-white/20"
        >
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          Your personal math tutor
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-4xl sm:text-5xl font-bold leading-tight mb-3"
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          Type any math problem — I'll show you every step!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-base opacity-85 leading-relaxed max-w-md"
        >
          From basic arithmetic to algebra, geometry, and percentages — I explain the{' '}
          <em className="font-bold not-italic underline decoration-white/40 underline-offset-2">why</em>{' '}
          behind every step, not just the final answer.
        </motion.p>
      </div>
    </motion.div>
  );
}
