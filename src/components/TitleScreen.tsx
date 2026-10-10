import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Sparkles, Dices, BookOpen, ChevronRight } from 'lucide-react';
import { VIBE_CARDS } from '@/lib/classData';
import { DEMO_CHARACTERS } from '@/demo/characters';
import { sfx } from '@/lib/sound';
import { SoundToggle, CRTToggle } from './SoundToggle';

interface TitleScreenProps {
  onStart: (description: string, vibe: string | null) => void;
  onDemoSelect: (demoId: string) => void;
  rollMode: boolean;
  onRollModeChange: (v: boolean) => void;
  jevMode: string;
  llmMode: string;
  isReplay: boolean;
}

export function TitleScreen({
  onStart,
  onDemoSelect,
  rollMode,
  onRollModeChange,
  jevMode,
  llmMode,
  isReplay,
}: TitleScreenProps) {
  const [text, setText] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);

  const handleStart = () => {
    if (!text.trim()) return;
    sfx.start();
    onStart(text.trim(), selectedVibe);
  };

  const handleVibe = (label: string) => {
    sfx.select();
    setSelectedVibe(label);
    setText((prev) => prev || label);
  };

  const handleDemo = (id: string) => {
    sfx.start();
    onDemoSelect(id);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 pb-16 px-4">
      {/* Top bar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <div className="flex gap-2">
          <SoundToggle />
          <CRTToggle />
        </div>
        <div className="flex gap-2 items-center">
          {isReplay && (
            <span className="font-pixel text-[8px] text-gold-400 pixel-panel pixel-border-gold px-3 py-2">
              REPLAY MODE
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="font-pixel text-2xl md:text-4xl text-gold-400 mb-2" style={{ textShadow: '4px 4px 0 #0a0e27' }}>
          RETRO RPG
        </h1>
        <h2 className="font-pixel text-lg md:text-2xl text-cream-500" style={{ textShadow: '3px 3px 0 #0a0e27' }}>
          CHARACTER CREATOR
        </h2>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-gold-400" />
          <span className="font-pixel text-[10px] text-cream-600 animate-blink">PRESS START</span>
          <Sparkles size={16} className="text-gold-400" />
        </div>
      </motion.div>

      {/* Textarea */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl mb-4"
      >
        <label className="font-pixel text-[10px] text-cream-500 mb-2 block">DESCRIBE YOUR HERO...</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1200}
          rows={4}
          className="w-full bg-navy-800 border-3 border-cream-500 p-4 font-terminal text-lg text-cream-500 focus:outline-none focus:border-gold-400 resize-none"
          style={{ borderWidth: '3px' }}
          placeholder="A grumpy dwarf blacksmith who hits things until they are fixed..."
        />
        <div className="flex justify-between items-center mt-1">
          <span className="font-terminal text-sm text-slate-500">{text.length}/1200</span>
        </div>
      </motion.div>

      {/* Vibe cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-2xl mb-4"
      >
        <label className="font-pixel text-[8px] text-cream-600 mb-2 block">VIBE CARDS</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {VIBE_CARDS.map((card) => (
            <button
              key={card.label}
              onClick={() => handleVibe(card.label)}
              onMouseEnter={() => sfx.hover()}
              className={`pixel-panel text-left transition-all hover:translate-x-[2px] hover:translate-y-[-2px] ${
                selectedVibe === card.label ? 'pixel-border-gold' : ''
              }`}
              style={{ padding: '10px 12px' }}
            >
              <div className="font-pixel text-[8px] text-gold-400 mb-1">{card.label}</div>
              <div className="font-terminal text-sm text-cream-600 leading-tight">{card.description}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Mode toggles */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3 flex-wrap items-center justify-center mb-4"
      >
        <button
          onClick={() => { onRollModeChange(!rollMode); sfx.click(); }}
          className={`pixel-btn ${rollMode ? 'pixel-btn-gold' : ''}`}
        >
          <span className="flex items-center gap-2">
            <Dices size={14} />
            ROLL MODE: {rollMode ? 'ON' : 'OFF'}
          </span>
        </button>
        <div className="flex gap-2 items-center">
          <span className="font-terminal text-sm text-cream-600">Jev:</span>
          <span className={`font-pixel text-[8px] px-2 py-1 ${jevMode === 'live' ? 'text-teal-400' : jevMode === 'replay' ? 'text-gold-400' : 'text-crimson-400'}`}>
            {jevMode.toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="font-terminal text-sm text-cream-600">LLM:</span>
          <span className={`font-pixel text-[8px] px-2 py-1 ${llmMode === 'live' ? 'text-teal-400' : 'text-crimson-400'}`}>
            {llmMode.toUpperCase()}
          </span>
        </div>
      </motion.div>

      {/* Start button */}
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStart}
        disabled={!text.trim()}
        className="pixel-btn pixel-btn-gold text-base mb-8"
        style={{ fontSize: '14px', padding: '16px 32px' }}
      >
        <span className="flex items-center gap-2">
          <Swords size={16} />
          GENERATE HERO
          <ChevronRight size={16} />
        </span>
      </motion.button>

      {/* Demo characters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-2xl"
      >
        <label className="font-pixel text-[8px] text-cream-600 mb-2 block flex items-center gap-2">
          <BookOpen size={12} /> DEMO CHARACTERS (ONE CLICK)
        </label>
        <div className="flex flex-wrap gap-2">
          {DEMO_CHARACTERS.map((demo) => (
            <button
              key={demo.id}
              onClick={() => handleDemo(demo.id)}
              onMouseEnter={() => sfx.hover()}
              className="pixel-btn"
              style={{ fontSize: '9px', padding: '8px 12px' }}
            >
              {demo.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
