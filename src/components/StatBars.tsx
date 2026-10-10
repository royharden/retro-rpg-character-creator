import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StatEntry } from '@/lib/types';

interface StatBarsProps {
  stats: StatEntry[];
  mode: string;
}

function statColor(score: number): string {
  if (score >= 16) return '#22c55e';
  if (score >= 13) return '#14b8a6';
  if (score >= 10) return '#fbbf24';
  if (score >= 8) return '#f59e0b';
  return '#dc2626';
}

function StatBar({ stat, mode }: { stat: StatEntry; mode: string }) {
  const [hovered, setHovered] = useState(false);
  const segments = 18;
  const filled = Math.min(18, Math.max(3, stat.score));

  const probEntries = Object.entries(stat.probabilities)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-pixel text-[10px] text-cream-500">{stat.label}</span>
        <span className="font-pixel text-[10px]" style={{ color: statColor(stat.score) }}>
          {stat.score}
          <span className="text-cream-500/60 ml-1">
            ({stat.modifier >= 0 ? '+' : ''}{stat.modifier})
          </span>
        </span>
      </div>
      <div className="flex gap-[2px]">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="stat-segment"
            style={{
              backgroundColor: i < filled ? statColor(stat.score) : '#1a1f4a',
              border: '1px solid #0a0e27',
            }}
          />
        ))}
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 left-0 top-full mt-2 pixel-panel pixel-border-teal min-w-[260px]"
          >
            <div className="font-pixel text-[8px] text-teal-400 mb-2">
              {stat.label} - JEV DISTRIBUTION ({mode === 'roll' ? 'ROLL' : 'POINT-BUY'})
            </div>
            <div className="space-y-1">
              {probEntries.map(([level, prob]) => (
                <div key={level} className="flex items-center gap-2">
                  <span className="font-terminal text-sm text-cream-500 w-20">
                    {['Feeble', 'Below avg', 'Average', 'Strong', 'Legendary'][parseInt(level)]}
                  </span>
                  <div className="flex-1 h-3 bg-navy-700 border border-navy-500">
                    <div
                      className="h-full"
                      style={{ width: `${prob * 100}%`, backgroundColor: statColor(8 + parseInt(level) * 2) }}
                    />
                  </div>
                  <span className="font-terminal text-sm text-cream-600 w-12 text-right">
                    {(prob * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 font-terminal text-sm text-gold-400">
              Expected level: {stat.expectedLevel.toFixed(2)}
            </div>
            <div className="font-terminal text-sm text-cream-600">
              {mode === 'roll'
                ? `Sampled level -> 4d6 drop lowest -> ${stat.score}`
                : `E=${stat.expectedLevel.toFixed(2)} -> 8+round(E/4*7) -> base -> point-buy -> +class bonus -> ${stat.score}`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StatBars({ stats, mode }: StatBarsProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {stats.map((stat) => (
        <StatBar key={stat.id} stat={stat} mode={mode} />
      ))}
    </div>
  );
}
