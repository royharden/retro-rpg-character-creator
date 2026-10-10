import { motion } from 'framer-motion';
import { FileText, Cpu, Calculator, BookOpen, CheckCircle, Loader2 } from 'lucide-react';

export type PipelineStage = 'idle' | 'jev' | 'math' | 'lore' | 'done';

interface PipelineStripProps {
  stage: PipelineStage;
  jevMode: string;
  llmMode: string;
  jevLatencyMs?: number;
  jevCostUsd?: number;
  loreLatencyMs?: number;
}

const STEPS = [
  { id: 'desc', label: 'Description', icon: FileText },
  { id: 'jev', label: 'Jev (1 request, 10 Q)', icon: Cpu },
  { id: 'math', label: 'Sheet Math (code)', icon: Calculator },
  { id: 'lore', label: 'Lore (LLM)', icon: BookOpen },
];

function stepState(stage: PipelineStage, index: number): 'done' | 'active' | 'pending' {
  const stageOrder: PipelineStage[] = ['idle', 'jev', 'math', 'lore', 'done'];
  const stageIdx = stageOrder.indexOf(stage);
  if (stageIdx > index + 1) return 'done';
  if (stageIdx === index + 1) return 'active';
  if (stage === 'done' && index === 3) return 'done';
  return 'pending';
}

export function PipelineStrip({ stage, jevMode, llmMode, jevLatencyMs, jevCostUsd, loreLatencyMs }: PipelineStripProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap pixel-panel pixel-border-gold">
      {STEPS.map((step, i) => {
        const state = stepState(stage, i);
        const Icon = step.icon;
        const color =
          state === 'done' ? 'text-grass-400' :
          state === 'active' ? 'text-gold-400' :
          'text-slate-600';

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 ${state === 'active' ? 'animate-pulse' : ''}`}>
              {state === 'done' ? (
                <CheckCircle size={16} className={color} />
              ) : state === 'active' ? (
                <Loader2 size={16} className={`animate-spin ${color}`} />
              ) : (
                <Icon size={16} className={color} />
              )}
              <span className={`font-pixel text-[8px] ${color}`}>{step.label}</span>
              {i === 1 && state === 'done' && jevLatencyMs !== undefined && (
                <span className="font-terminal text-sm text-cream-600 ml-1">
                  ({jevLatencyMs}ms, ${jevCostUsd?.toFixed(8) ?? '0'})
                </span>
              )}
              {i === 1 && state === 'done' && (
                <span className={`font-terminal text-sm ml-1 ${jevMode === 'replay' ? 'text-gold-400' : jevMode === 'heuristic' ? 'text-crimson-400' : 'text-teal-400'}`}>
                  [{jevMode.toUpperCase()}]
                </span>
              )}
              {i === 3 && state === 'done' && loreLatencyMs !== undefined && (
                <span className="font-terminal text-sm text-cream-600 ml-1">
                  ({loreLatencyMs}ms)
                </span>
              )}
              {i === 3 && state === 'done' && (
                <span className={`font-terminal text-sm ml-1 ${llmMode === 'mock' ? 'text-crimson-400' : 'text-teal-400'}`}>
                  [{llmMode.toUpperCase()}]
                </span>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <motion.div
                className={`w-4 h-[2px] ${state === 'done' ? 'bg-grass-400' : 'bg-slate-700'}`}
                animate={state === 'active' ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
                transition={{ duration: 0.8, repeat: state === 'active' ? Infinity : 0 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
