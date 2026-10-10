import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { ClassId, AlignmentAxis, MoralityAxis, JevAnswerChoice } from '@/lib/types';
import { getTopThreeClasses } from '@/lib/characterMath';
import { CLASS_DATA } from '@/lib/classData';

interface UncertaintyPickerProps {
  classAnswer: JevAnswerChoice;
  lawChaosAnswer: JevAnswerChoice;
  goodEvilAnswer: JevAnswerChoice;
  classConfidence: number;
  lawChaosConfidence: number;
  goodEvilConfidence: number;
  onClassOverride: (cls: ClassId) => void;
  onLawChaosOverride: (axis: AlignmentAxis) => void;
  onGoodEvilOverride: (axis: MoralityAxis) => void;
}

export function UncertaintyPicker({
  classAnswer,
  lawChaosAnswer,
  goodEvilAnswer,
  classConfidence,
  lawChaosConfidence,
  goodEvilConfidence,
  onClassOverride,
  onLawChaosOverride,
  onGoodEvilOverride,
}: UncertaintyPickerProps) {
  const showClassPicker = classAnswer.choice === 'uncertain' || classConfidence < 0.40;
  const showLawChaosPicker = lawChaosAnswer.choice === 'uncertain' || lawChaosConfidence < 0.40;
  const showGoodEvilPicker = goodEvilAnswer.choice === 'uncertain' || goodEvilConfidence < 0.40;

  if (!showClassPicker && !showLawChaosPicker && !showGoodEvilPicker) return null;

  const topClasses = getTopThreeClasses(classAnswer.probabilities);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pixel-panel pixel-border-gold mb-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-gold-400" />
        <span className="font-pixel text-[10px] text-gold-400">THE ORACLE HESITATES...</span>
      </div>

      {showClassPicker && (
        <div className="mb-4">
          <div className="font-terminal text-base text-cream-500 mb-2">Pick a class (top 3 by probability):</div>
          <div className="flex gap-2 flex-wrap">
            {topClasses.map(({ id, probability }) => {
              const info = CLASS_DATA[id as Exclude<ClassId, 'uncertain'>];
              return (
                <button
                  key={id}
                  onClick={() => onClassOverride(id as ClassId)}
                  className="pixel-btn pixel-btn-gold"
                  style={{ fontSize: '9px', padding: '8px 12px' }}
                >
                  {info?.name || id} ({(probability * 100).toFixed(0)}%)
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showLawChaosPicker && (
        <div className="mb-4">
          <div className="font-terminal text-base text-cream-500 mb-2">Law vs Chaos:</div>
          <div className="flex gap-2">
            {(['lawful', 'neutral', 'chaotic'] as AlignmentAxis[]).map((axis) => (
              <button
                key={axis}
                onClick={() => onLawChaosOverride(axis)}
                className="pixel-btn pixel-btn-teal"
                style={{ fontSize: '9px', padding: '8px 12px', textTransform: 'capitalize' }}
              >
                {axis}
              </button>
            ))}
          </div>
        </div>
      )}

      {showGoodEvilPicker && (
        <div className="mb-2">
          <div className="font-terminal text-base text-cream-500 mb-2">Good vs Evil:</div>
          <div className="flex gap-2">
            {(['good', 'neutral', 'evil'] as MoralityAxis[]).map((axis) => (
              <button
                key={axis}
                onClick={() => onGoodEvilOverride(axis)}
                className="pixel-btn pixel-btn-teal"
                style={{ fontSize: '9px', padding: '8px 12px', textTransform: 'capitalize' }}
              >
                {axis}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="font-terminal text-sm text-cream-600 mt-2">
        Overrides are labeled "Set by you" on the sheet.
      </div>
    </motion.div>
  );
}
