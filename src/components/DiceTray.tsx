import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices } from 'lucide-react';
import { SeededRNG } from '@/lib/rng';

interface DiceTrayProps {
  seed: string;
  onComplete: () => void;
}

export function DiceTray({ seed, onComplete }: DiceTrayProps) {
  const [dice, setDice] = useState<number[]>([1, 1, 1, 1]);
  const [rolling, setRolling] = useState(true);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const rng = new SeededRNG(seed + '_dice');
    const maxRounds = 8;
    let currentRound = 0;

    const interval = setInterval(() => {
      currentRound++;
      setRound(currentRound);
      setDice([
        rng.nextInt(1, 6),
        rng.nextInt(1, 6),
        rng.nextInt(1, 6),
        rng.nextInt(1, 6),
      ]);

      if (currentRound >= maxRounds) {
        clearInterval(interval);
        setRolling(false);
        setTimeout(onComplete, 400);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [seed, onComplete]);

  const sumTop3 = [...dice].sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="pixel-panel pixel-border-gold p-6 flex flex-col items-center gap-4"
    >
      <div className="font-pixel text-[10px] text-gold-400 flex items-center gap-2">
        <Dices size={16} className={rolling ? 'animate-spin' : ''} />
        ROLLING STATS...
      </div>
      <div className="flex gap-3">
        <AnimatePresence mode="popLayout">
          {dice.map((die, i) => (
            <motion.div
              key={`${round}-${i}`}
              initial={{ rotate: 0, scale: 0.8 }}
              animate={{ rotate: rolling ? 360 : 0, scale: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="dice-face"
            >
              {die}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {!rolling && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-pixel text-[10px] text-grass-400"
        >
          TOP 3 SUM: {sumTop3}
        </motion.div>
      )}
    </motion.div>
  );
}
