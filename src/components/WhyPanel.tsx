import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Code, Brain } from 'lucide-react';
import type { JevAnswers, CharacterSheet } from '@/lib/types';
import { STAT_IDS, STAT_LABELS, STAT_FULL_NAMES } from '@/lib/classData';
import { expectedLevel } from '@/lib/characterMath';

interface WhyPanelProps {
  answers: JevAnswers;
  sheet: CharacterSheet;
  mode: string;
}

export function WhyPanel({ answers, sheet, mode }: WhyPanelProps) {
  const [open, setOpen] = useState(false);
  const [rawJson, setRawJson] = useState(false);

  const statRows = STAT_IDS.map((id) => {
    const ans = answers[id];
    const stat = sheet.stats.find((s) => s.id === id)!;
    const eLevel = expectedLevel(ans.probabilities);
    return { id, label: STAT_LABELS[id], fullName: STAT_FULL_NAMES[id], ans, stat, eLevel };
  });

  return (
    <div className="w-full pixel-panel pixel-border-teal mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-pixel text-[10px] text-teal-400 flex items-center gap-2">
          <Code size={14} /> WHY THIS SHEET?
        </span>
        {open ? <ChevronUp size={16} className="text-teal-400" /> : <ChevronDown size={16} className="text-teal-400" />}
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-4 space-y-4 overflow-hidden"
        >
          {/* Class */}
          <div className="border-b border-navy-600 pb-3">
            <div className="font-pixel text-[8px] text-gold-400 mb-2">CLASS</div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-terminal text-base text-cream-500">
                Choice: <span className="text-gold-400">{answers.class.choice}</span>
              </span>
              <span className="font-terminal text-sm text-cream-600">
                Confidence: {(answers.class.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="space-y-1">
              {Object.entries(answers.class.probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([cls, prob]) => (
                  <div key={cls} className="flex items-center gap-2">
                    <span className="font-terminal text-sm text-cream-500 w-20">{cls}</span>
                    <div className="flex-1 h-2 bg-navy-700">
                      <div className="h-full bg-gold-400" style={{ width: `${prob * 100}%` }} />
                    </div>
                    <span className="font-terminal text-sm text-cream-600 w-12 text-right">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Alignment */}
          <div className="border-b border-navy-600 pb-3 grid grid-cols-2 gap-4">
            <div>
              <div className="font-pixel text-[8px] text-gold-400 mb-2">LAW vs CHAOS</div>
              <div className="font-terminal text-base text-cream-500 mb-1">
                Choice: <span className="text-gold-400">{answers.law_chaos.choice}</span>
              </div>
              {Object.entries(answers.law_chaos.probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([axis, prob]) => (
                  <div key={axis} className="flex items-center gap-2 mb-1">
                    <span className="font-terminal text-sm text-cream-500 w-16">{axis}</span>
                    <div className="flex-1 h-2 bg-navy-700">
                      <div className="h-full bg-teal-400" style={{ width: `${prob * 100}%` }} />
                    </div>
                    <span className="font-terminal text-sm text-cream-600 w-10 text-right">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
            <div>
              <div className="font-pixel text-[8px] text-gold-400 mb-2">GOOD vs EVIL</div>
              <div className="font-terminal text-base text-cream-500 mb-1">
                Choice: <span className="text-gold-400">{answers.good_evil.choice}</span>
              </div>
              {Object.entries(answers.good_evil.probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([axis, prob]) => (
                  <div key={axis} className="flex items-center gap-2 mb-1">
                    <span className="font-terminal text-sm text-cream-500 w-16">{axis}</span>
                    <div className="flex-1 h-2 bg-navy-700">
                      <div className="h-full bg-teal-400" style={{ width: `${prob * 100}%` }} />
                    </div>
                    <span className="font-terminal text-sm text-cream-600 w-10 text-right">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Stats */}
          <div className="border-b border-navy-600 pb-3">
            <div className="font-pixel text-[8px] text-gold-400 mb-2 flex items-center gap-2">
              <Brain size={12} /> STATS - EXPECTED VALUE + POINT-BUY
            </div>
            <div className="space-y-2">
              {statRows.map(({ id, label, fullName, ans, stat, eLevel }) => (
                <div key={id} className="border border-navy-600 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-pixel text-[8px] text-cream-500">{label}</span>
                    <span className="font-terminal text-sm text-gold-400">
                      {`E=${eLevel.toFixed(2)} -> base ${8 + Math.round((eLevel / 4) * 7)} -> +${sheet.classBonuses[id] || 0} bonus -> ${stat.score}`}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Object.entries(ans.probabilities)
                      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                      .map(([level, prob]) => (
                        <div key={level} className="flex-1">
                          <div className="h-8 bg-navy-700 flex items-end">
                            <div
                              className="w-full bg-teal-400"
                              style={{ height: `${Math.max(2, prob * 100)}%` }}
                            />
                          </div>
                          <div className="font-terminal text-xs text-cream-600 text-center mt-1">
                            L{level}: {(prob * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Is character */}
          <div className="border-b border-navy-600 pb-3">
            <div className="font-pixel text-[8px] text-gold-400 mb-1">IS CHARACTER (Noul)</div>
            <div className="font-terminal text-base text-cream-500">
              Noul: <span className="text-gold-400">{answers.is_character.noul.toFixed(2)}</span>
              <span className="text-cream-600 ml-2">
                |2p-1| = {Math.abs(2 * answers.is_character.noul - 1).toFixed(2)} confidence
              </span>
            </div>
          </div>

          {/* HP calc */}
          <div className="border-b border-navy-600 pb-3">
            <div className="font-pixel text-[8px] text-gold-400 mb-1">HP CALCULATION</div>
            <div className="font-terminal text-base text-cream-500">
              Hit die d{sheet.hitDie} + CON modifier {sheet.stats.find(s => s.id === 'con')?.modifier && sheet.stats.find(s => s.id === 'con')!.modifier >= 0 ? '+' : ''}
              {sheet.stats.find(s => s.id === 'con')?.modifier} = {sheet.hp} HP
            </div>
          </div>

          {/* Raw JSON toggle */}
          <div>
            <button
              onClick={() => setRawJson(!rawJson)}
              className="font-pixel text-[8px] text-teal-400 hover:text-gold-400"
            >
              {rawJson ? 'HIDE' : 'SHOW'} RAW JEV JSON
            </button>
            {rawJson && (
              <pre className="mt-2 p-3 bg-navy-900 border border-navy-600 overflow-auto max-h-64 font-terminal text-sm text-cream-600">
                {JSON.stringify(answers, null, 2)}
              </pre>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
