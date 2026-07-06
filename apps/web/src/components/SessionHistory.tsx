import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, Hash } from 'lucide-react';
import type { Solution } from '@/types';

interface Props {
  history: Solution[];
  onSelect: (s: Solution) => void;
  selectedId?: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function SessionHistory({ history, onSelect, selectedId }: Props) {
  if (history.length === 0) {
    return (
      <div className="py-8 px-5 text-center">
        <div className="w-10 h-10 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
          <Clock className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">No problems yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1 leading-snug">
          Solved problems appear here so you can revisit them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      <AnimatePresence initial={false}>
        {history.map((item, i) => {
          const isSelected = item.id === selectedId;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.22 }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(item)}
              className={`w-full text-left px-3 py-3 rounded-xl transition-colors duration-150 flex items-start gap-2.5 group ${
                isSelected
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'hover:bg-muted text-foreground border border-transparent'
              }`}
            >
              {/* Step count badge */}
              <div
                className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Hash className="w-3 h-3" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{item.problem}</p>
                <p
                  className={`text-xs mt-0.5 truncate font-medium ${
                    isSelected ? 'text-primary/70' : 'text-muted-foreground'
                  }`}
                >
                  {item.finalAnswer}
                </p>
                <p className="text-[10px] mt-0.5 text-muted-foreground/60">{timeAgo(item.createdAt)}</p>
              </div>

              <ChevronRight
                className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform duration-150 ${
                  isSelected ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5'
                }`}
              />
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
