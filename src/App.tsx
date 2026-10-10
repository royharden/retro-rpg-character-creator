import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users } from 'lucide-react';
import { TitleScreen } from '@/components/TitleScreen';
import { PipelineStrip, type PipelineStage } from '@/components/PipelineStrip';
import { CharacterSheetCard } from '@/components/CharacterSheet';
import { Gallery } from '@/components/Gallery';
import { ToastContainer } from '@/components/Toast';
import { DiceTray } from '@/components/DiceTray';
import { SoundToggle, CRTToggle } from '@/components/SoundToggle';
import { sfx } from '@/lib/sound';
import { supabase } from '@/lib/supabaseClient';
import { buildSheet } from '@/lib/characterMath';
import { buildJevQuestions } from '@/lib/jevQuestions';
import { generateMockLore } from '@/lib/mockLore';
import { heuristicMatch } from '@/lib/heuristic';
import { makeSeed, hashDescription } from '@/lib/rng';
import { decodeShareLink, isShareLink } from '@/lib/share';
import { DEMO_CHARACTERS } from '@/demo/characters';
import type {
  FullCharacter,
  JevAnswers,
  JevResponse,
  Lore,
  CharacterSheet,
  ClassId,
  AlignmentAxis,
  MoralityAxis,
  Override,
  ToastMessage,
  JevMode,
  LlmMode,
} from '@/lib/types';

type View = 'title' | 'generating' | 'result' | 'gallery' | 'shared';

export default function App() {
  const [view, setView] = useState<View>('title');
  const [character, setCharacter] = useState<FullCharacter | null>(null);
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [rollMode, setRollMode] = useState(false);
  const [jevMode, setJevMode] = useState<JevMode>('replay');
  const [llmMode, setLlmMode] = useState<LlmMode>('mock');
  const [isReplay, setIsReplay] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [galleryAdded, setGalleryAdded] = useState(false);
  const [overrides, setOverrides] = useState<Override>({});
  const [jevLatency, setJevLatency] = useState<number | undefined>();
  const [jevCost, setJevCost] = useState<number | undefined>();
  const [loreLatency, setLoreLatency] = useState<number | undefined>();
  const [showDice, setShowDice] = useState(false);
  const [pipelineData, setPipelineData] = useState<{
    jevMode: string;
    llmMode: string;
    jevLatencyMs?: number;
    jevCostUsd?: number;
    loreLatencyMs?: number;
  }>({ jevMode: 'replay', llmMode: 'mock' });

  const addToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check for share link on mount
  useEffect(() => {
    if (isShareLink()) {
      const decoded = decodeShareLink(window.location.hash);
      if (decoded) {
        setCharacter(decoded);
        setView('shared');
        setIsReplay(decoded.jevMode === 'replay');
      }
    }
  }, []);

  // Detect modes by trying a lightweight call to the edge function
  // For the demo, we assume replay/mock if no keys are set
  // The actual mode is determined when we call the edge function

  const callJevBuild = useCallback(async (description: string, vibe: string | null): Promise<{ answers: JevAnswers; mode: JevMode; model?: string; usage?: { input_tokens: number; output_tokens: number }; latencyMs?: number; costUsd?: number }> => {
    try {
      const { data, error } = await supabase.functions.invoke('jev-build', {
        body: { description, vibe },
      });

      if (error) {
        throw error;
      }

      if (data?.error === 'daily_limit') {
        addToast('warning', 'Daily demo limit reached - switching to Replay mode');
        return { answers: {} as JevAnswers, mode: 'replay' as JevMode };
      }

      if (data?.error === 'missing_secret') {
        return { answers: {} as JevAnswers, mode: 'replay' as JevMode };
      }

      if (data?.error) {
        throw new Error(data.message || data.error);
      }

      return {
        answers: data.answers as JevAnswers,
        mode: 'live' as JevMode,
        model: data.model,
        usage: data.usage,
        latencyMs: data.latency_ms,
        costUsd: data.cost_usd,
      };
    } catch {
      // Fall back to replay or heuristic
      return { answers: {} as JevAnswers, mode: 'replay' as JevMode };
    }
  }, [addToast]);

  const callWriteLore = useCallback(async (sheet: CharacterSheet, description: string, tone: string): Promise<{ lore: Lore; mode: LlmMode; latencyMs?: number }> => {
    try {
      const { data, error } = await supabase.functions.invoke('write-lore', {
        body: { sheet: { ...sheet, description }, tone },
      });

      if (error) {
        throw error;
      }

      if (data?.error === 'daily_limit') {
        addToast('warning', 'Daily demo limit reached - switching to Mock lore');
        return { lore: generateMockLore(sheet), mode: 'mock' as LlmMode };
      }

      if (data?.error === 'missing_secret') {
        return { lore: generateMockLore(sheet), mode: 'mock' as LlmMode };
      }

      if (data?.error) {
        throw new Error(data.message || data.error);
      }

      return {
        lore: {
          backstory: data.backstory,
          name_ideas: data.name_ideas,
          portrait_description: data.portrait_description,
          catchphrase: data.catchphrase,
          mode: 'live' as LlmMode,
        },
        mode: 'live' as LlmMode,
      };
    } catch {
      return { lore: generateMockLore(sheet), mode: 'mock' as LlmMode };
    }
  }, [addToast]);

  const findDemoMatch = useCallback((description: string) => {
    const hash = hashDescription(description);
    return DEMO_CHARACTERS.find((d) => d.descriptionHash === hash);
  }, []);

  const generateCharacter = useCallback(async (description: string, vibe: string | null, demoId?: string) => {
    setView('generating');
    setStage('idle');
    setOverrides({});
    setGalleryAdded(false);
    const seed = makeSeed();
    const sheetMode = rollMode ? 'roll' : 'standard';

    // Stage: Jev
    setStage('jev');

    let jevAnswers: JevAnswers;
    let resolvedJevMode: JevMode;
    let model: string | undefined;
    let usage: { input_tokens: number; output_tokens: number } | undefined;
    let latencyMs: number | undefined;
    let costUsd: number | undefined;

    // Check for demo character match first
    let demoMatch = demoId ? DEMO_CHARACTERS.find((d) => d.id === demoId) : findDemoMatch(description);

    if (demoMatch) {
      // Use recorded Jev answers
      jevAnswers = demoMatch.jevResponse;
      resolvedJevMode = 'replay';
      setIsReplay(true);
      setJevMode('replay');
      latencyMs = Math.floor(Math.random() * 50) + 20;
      costUsd = 690 * 0.042 / 1_000_000;
      model = 'jev-1.13.0';
      usage = { input_tokens: 690, output_tokens: 30 };
    } else {
      // Try live Jev
      const result = await callJevBuild(description, vibe);

      if (result.mode === 'live' && result.answers.class) {
        jevAnswers = result.answers;
        resolvedJevMode = 'live';
        setIsReplay(false);
        setJevMode('live');
        model = result.model;
        usage = result.usage;
        latencyMs = result.latencyMs;
        costUsd = result.costUsd;
      } else {
        // No match to demo and no live API - try demo by description, else heuristic
        demoMatch = findDemoMatch(description);
        if (demoMatch) {
          jevAnswers = demoMatch.jevResponse;
          resolvedJevMode = 'replay';
          setIsReplay(true);
          setJevMode('replay');
          latencyMs = Math.floor(Math.random() * 50) + 20;
          costUsd = 690 * 0.042 / 1_000_000;
        } else {
          // Heuristic fallback
          jevAnswers = heuristicMatch(description);
          resolvedJevMode = 'heuristic';
          setIsReplay(false);
          setJevMode('heuristic');
          addToast('info', 'Using heuristic keyword matcher. Add TYPESAFE_API_KEY for live Jev analysis.');
          latencyMs = Math.floor(Math.random() * 10) + 5;
          costUsd = 0;
        }
      }
    }

    setJevLatency(latencyMs);
    setJevCost(costUsd);

    // Check is_character
    if (jevAnswers.is_character.noul < 0.5) {
      addToast('warning', 'That does not sound like a hero. Try a vibe card?');
      setView('title');
      setStage('idle');
      return;
    }

    // Stage: Math
    setStage('math');
    await new Promise((r) => setTimeout(r, 300));

    const sheet = buildSheet(jevAnswers, seed, sheetMode, overrides);

    // Stage: Lore
    setStage('lore');
    let loreResult: { lore: Lore; mode: LlmMode; latencyMs?: number };

    // For demo characters in replay mode, use mock lore
    if (resolvedJevMode === 'replay' || resolvedJevMode === 'heuristic') {
      // Try live LLM, fall back to mock
      loreResult = await callWriteLore(sheet, description, resolvedJevMode === 'heuristic' ? 'grim' : 'heroic');
    } else {
      loreResult = await callWriteLore(sheet, description, 'heroic');
    }

    setLlmMode(loreResult.mode);
    setLoreLatency(loreResult.latencyMs);

    setPipelineData({
      jevMode: resolvedJevMode,
      llmMode: loreResult.mode,
      jevLatencyMs: latencyMs,
      jevCostUsd: costUsd,
      loreLatencyMs: loreResult.latencyMs,
    });

    // Stage: Done
    setStage('done');
    sfx.success();

    const fullCharacter: FullCharacter = {
      description,
      vibe,
      sheet,
      lore: loreResult.lore,
      jevAnswers,
      jevMode: resolvedJevMode,
      llmMode: loreResult.mode,
      seed,
      model,
      usage,
    };

    setCharacter(fullCharacter);

    if (rollMode) {
      setShowDice(true);
    } else {
      setView('result');
    }
  }, [rollMode, overrides, findDemoMatch, callJevBuild, callWriteLore, addToast]);

  const handleStart = useCallback((description: string, vibe: string | null) => {
    generateCharacter(description, vibe);
  }, [generateCharacter]);

  const handleDemoSelect = useCallback((demoId: string) => {
    const demo = DEMO_CHARACTERS.find((d) => d.id === demoId);
    if (demo) {
      generateCharacter(demo.description, demo.vibe, demo.id);
    }
  }, [generateCharacter]);

  const handleClassOverride = useCallback((cls: ClassId) => {
    setOverrides((prev) => ({ ...prev, classId: cls }));
    if (character) {
      const newSheet = buildSheet(character.jevAnswers, character.seed, character.sheet.mode, { ...overrides, classId: cls });
      setCharacter({ ...character, sheet: newSheet });
    }
    sfx.select();
  }, [character, overrides]);

  const handleLawChaosOverride = useCallback((axis: AlignmentAxis) => {
    setOverrides((prev) => ({ ...prev, lawChaos: axis }));
    if (character) {
      const newSheet = buildSheet(character.jevAnswers, character.seed, character.sheet.mode, { ...overrides, lawChaos: axis });
      setCharacter({ ...character, sheet: newSheet });
    }
    sfx.select();
  }, [character, overrides]);

  const handleGoodEvilOverride = useCallback((axis: MoralityAxis) => {
    setOverrides((prev) => ({ ...prev, goodEvil: axis }));
    if (character) {
      const newSheet = buildSheet(character.jevAnswers, character.seed, character.sheet.mode, { ...overrides, goodEvil: axis });
      setCharacter({ ...character, sheet: newSheet });
    }
    sfx.select();
  }, [character, overrides]);

  const handleAddToGallery = useCallback(async () => {
    if (!character) return;
    sfx.click();
    try {
      const { error } = await supabase.from('characters').insert({
        description: character.description,
        vibe: character.vibe,
        sheet: character.sheet,
        lore: character.lore,
        jev_answers: character.jevAnswers,
        jev_mode: character.jevMode,
        llm_mode: character.llmMode,
        seed: character.seed,
      });
      if (error) throw error;
      setGalleryAdded(true);
      addToast('success', 'Character added to gallery!');
    } catch (e) {
      addToast('error', `Failed to add to gallery: ${(e as Error).message}`);
    }
  }, [character, addToast]);

  const handleHome = useCallback(() => {
    setView('title');
    setCharacter(null);
    setStage('idle');
    setOverrides({});
    sfx.click();
  }, []);

  const handleDiceComplete = useCallback(() => {
    setShowDice(false);
    setView('result');
  }, []);

  return (
    <div className="min-h-screen bg-navy-900">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top nav bar (not on title screen) */}
      {view !== 'title' && (
        <div className="sticky top-0 z-50 bg-navy-900 border-b-3 border-cream-500 px-4 py-3 flex justify-between items-center" style={{ borderBottomWidth: '3px' }}>
          <div className="flex items-center gap-3">
            <button onClick={handleHome} className="pixel-btn" style={{ fontSize: '9px', padding: '8px 10px' }}>
              <span className="flex items-center gap-2"><Home size={14} /> HOME</span>
            </button>
            <button onClick={() => { setView('gallery'); sfx.click(); }} className="pixel-btn pixel-btn-teal" style={{ fontSize: '9px', padding: '8px 10px' }}>
              <span className="flex items-center gap-2"><Users size={14} /> GALLERY</span>
            </button>
          </div>
          <div className="flex gap-2">
            <SoundToggle />
            <CRTToggle />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'title' && (
          <motion.div key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TitleScreen
              onStart={handleStart}
              onDemoSelect={handleDemoSelect}
              rollMode={rollMode}
              onRollModeChange={setRollMode}
              jevMode={jevMode}
              llmMode={llmMode}
              isReplay={isReplay}
            />
          </motion.div>
        )}

        {view === 'generating' && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-3xl space-y-4">
              <div className="font-pixel text-lg text-gold-400 text-center mb-4 animate-pulse">
                GENERATING HERO...
              </div>
              <PipelineStrip
                stage={stage}
                jevMode={pipelineData.jevMode}
                llmMode={pipelineData.llmMode}
                jevLatencyMs={jevLatency}
                jevCostUsd={jevCost}
                loreLatencyMs={loreLatency}
              />
              {showDice && stage === 'math' && (
                <div className="flex justify-center">
                  <DiceTray seed={character?.seed || 'temp'} onComplete={handleDiceComplete} />
                </div>
              )}
              {!showDice && (
                <div className="flex justify-center">
                  <div className="font-pixel text-[10px] text-cream-600 animate-pulse">
                    {stage === 'jev' && 'Asking Jev 10 questions in one request...'}
                    {stage === 'math' && 'Computing stats, HP, and alignment...'}
                    {stage === 'lore' && 'Writing backstory and lore...'}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'result' && character && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 px-4">
            <PipelineStrip
              stage="done"
              jevMode={pipelineData.jevMode}
              llmMode={pipelineData.llmMode}
              jevLatencyMs={jevLatency}
              jevCostUsd={jevCost}
              loreLatencyMs={loreLatency}
            />
            <div className="mt-4">
              <CharacterSheetCard
                character={character}
                onAddToGallery={handleAddToGallery}
                galleryAdded={galleryAdded}
                onClassOverride={handleClassOverride}
                onLawChaosOverride={handleLawChaosOverride}
                onGoodEvilOverride={handleGoodEvilOverride}
                overrides={overrides}
              />
            </div>
          </motion.div>
        )}

        {view === 'shared' && character && (
          <motion.div key="shared" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 px-4">
            <CharacterSheetCard
              character={character}
              onAddToGallery={handleAddToGallery}
              galleryAdded={galleryAdded}
              isShared
            />
          </motion.div>
        )}

        {view === 'gallery' && (
          <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Gallery onBack={handleHome} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
