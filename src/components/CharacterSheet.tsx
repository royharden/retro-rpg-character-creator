import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Image as ImageIcon, Link2, Heart, Edit3, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { FullCharacter, ClassId, AlignmentAxis, MoralityAxis } from '@/lib/types';
import { SpriteCanvas } from './SpriteCanvas';
import { StatBars } from './StatBars';
import { WhyPanel } from './WhyPanel';
import { UncertaintyPicker } from './UncertaintyPicker';
import { encodeShareLink } from '@/lib/share';
import { sfx } from '@/lib/sound';
import { CLASS_DATA } from '@/lib/classData';

interface CharacterSheetProps {
  character: FullCharacter;
  onAddToGallery: () => void;
  galleryAdded: boolean;
  isShared?: boolean;
  onClassOverride?: (cls: ClassId) => void;
  onLawChaosOverride?: (axis: AlignmentAxis) => void;
  onGoodEvilOverride?: (axis: MoralityAxis) => void;
  overrides?: { classId?: ClassId; lawChaos?: AlignmentAxis; goodEvil?: MoralityAxis };
}

export function CharacterSheetCard({
  character,
  onAddToGallery,
  galleryAdded,
  isShared,
  onClassOverride,
  onLawChaosOverride,
  onGoodEvilOverride,
  overrides,
}: CharacterSheetProps) {
  const { sheet, lore, jevAnswers, jevMode, llmMode } = character;
  const [selectedName, setSelectedName] = useState(lore.name_ideas[0] || 'Hero');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(selectedName);
  const [showWhy, setShowWhy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const resolvedClass = sheet.classId === 'uncertain' ? 'fighter' : sheet.classId;
  const classInfo = CLASS_DATA[resolvedClass as Exclude<ClassId, 'uncertain'>];

  const handleSavePng = async () => {
    if (!cardRef.current) return;
    sfx.click();
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        style: { imageRendering: 'pixelated' },
      });
      const link = document.createElement('a');
      link.download = `${selectedName.replace(/\s+/g, '_')}_character.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('PNG export failed:', e);
    }
  };

  const handleDownloadJson = () => {
    sfx.click();
    const exportData = {
      sheet,
      seed: character.seed,
      jevMode,
      llmMode,
      jevAnswers,
      lore,
      description: character.description,
      vibe: character.vibe,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${selectedName.replace(/\s+/g, '_')}_character.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleCopyLink = () => {
    sfx.click();
    const link = encodeShareLink(character);
    navigator.clipboard.writeText(link).catch(() => {});
  };

  const handleNameSave = () => {
    setSelectedName(nameInput || 'Hero');
    setEditingName(false);
    sfx.select();
  };

  const showClassOverride = !isShared && onClassOverride;
  const showAlignmentOverride = !isShared && onLawChaosOverride && onGoodEvilOverride;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Badges */}
      <div className="flex gap-2 flex-wrap mb-3 items-center">
        {isShared && (
          <span className="font-pixel text-[8px] text-teal-400 pixel-panel pixel-border-teal px-3 py-2">
            SHARED CHARACTER
          </span>
        )}
        {jevMode === 'replay' && (
          <span className="font-pixel text-[8px] text-gold-400 pixel-panel pixel-border-gold px-3 py-2">
            REPLAY: recorded Jev answers
          </span>
        )}
        {jevMode === 'heuristic' && (
          <span className="font-pixel text-[8px] text-crimson-400 pixel-panel pixel-border-crimson px-3 py-2">
            HEURISTIC (not Jev)
          </span>
        )}
        {llmMode === 'mock' && (
          <span className="font-pixel text-[8px] text-crimson-400 pixel-panel pixel-border-crimson px-3 py-2">
            MOCK LORE
          </span>
        )}
        {overrides?.classId && (
          <span className="font-pixel text-[8px] text-teal-400 pixel-panel px-3 py-2">
            CLASS: Set by you
          </span>
        )}
        {overrides?.lawChaos && (
          <span className="font-pixel text-[8px] text-teal-400 pixel-panel px-3 py-2">
            LAW/CHAOS: Set by you
          </span>
        )}
        {overrides?.goodEvil && (
          <span className="font-pixel text-[8px] text-teal-400 pixel-panel px-3 py-2">
            GOOD/EVIL: Set by you
          </span>
        )}
      </div>

      {/* Uncertainty picker */}
      {showClassOverride && showAlignmentOverride && (
        <UncertaintyPicker
          classAnswer={jevAnswers.class}
          lawChaosAnswer={jevAnswers.law_chaos}
          goodEvilAnswer={jevAnswers.good_evil}
          classConfidence={sheet.classConfidence}
          lawChaosConfidence={sheet.lawChaosConfidence}
          goodEvilConfidence={sheet.goodEvilConfidence}
          onClassOverride={onClassOverride!}
          onLawChaosOverride={onLawChaosOverride!}
          onGoodEvilOverride={onGoodEvilOverride!}
        />
      )}

      {/* Main card */}
      <motion.div
        ref={cardRef}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pixel-panel pixel-border p-6"
      >
        {/* Header row */}
        <div className="flex gap-6 flex-col md:flex-row">
          {/* Sprite */}
          <div className="shrink-0">
            <div className="pixel-panel pixel-border-gold p-2 inline-block">
              <SpriteCanvas
                classId={sheet.classId}
                lawChaos={sheet.lawChaos}
                goodEvil={sheet.goodEvil}
                seed={character.seed}
                scale={8}
              />
            </div>
          </div>

          {/* Name + identity */}
          <div className="flex-1 space-y-3">
            {/* Name */}
            <div>
              {editingName ? (
                <div className="flex gap-2 items-center">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-navy-800 border-2 border-cream-500 px-2 py-1 font-terminal text-lg text-cream-500 focus:outline-none focus:border-gold-400"
                    style={{ borderWidth: '2px' }}
                    maxLength={30}
                  />
                  <button onClick={handleNameSave} className="pixel-btn pixel-btn-grass" style={{ fontSize: '9px', padding: '6px 8px' }}>
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-pixel text-base text-gold-400">{selectedName}</h2>
                  {!isShared && (
                    <button onClick={() => { setEditingName(true); setNameInput(selectedName); sfx.click(); }} className="opacity-50 hover:opacity-100">
                      <Edit3 size={14} className="text-cream-500" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Name ideas */}
            {!isShared && (
              <div className="flex gap-1 flex-wrap">
                {lore.name_ideas.map((name) => (
                  <button
                    key={name}
                    onClick={() => { setSelectedName(name); sfx.pip(); }}
                    onMouseEnter={() => sfx.hover()}
                    className={`font-terminal text-sm px-2 py-1 border ${
                      selectedName === name
                        ? 'border-gold-400 text-gold-400 bg-navy-700'
                        : 'border-navy-600 text-cream-600 hover:border-cream-500'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {/* Class + Alignment + Level + HP */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[8px] text-cream-600">CLASS</span>
                <span className="font-terminal text-lg text-cream-500">{sheet.className}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[8px] text-cream-600">ALIGN</span>
                <span className="font-terminal text-lg text-cream-500">{sheet.alignment}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[8px] text-cream-600">LEVEL</span>
                <span className="font-terminal text-lg text-cream-500">{sheet.level}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[8px] text-cream-600">HP</span>
                <span className="font-terminal text-lg text-crimson-400">{sheet.hp}</span>
                <span className="font-terminal text-sm text-cream-600">(d{sheet.hitDie})</span>
              </div>
            </div>

            {/* Catchphrase */}
            <div className="pixel-panel pixel-border-teal p-2">
              <span className="font-terminal text-base text-teal-400 italic">"{lore.catchphrase}"</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-4 border-t border-navy-600">
          <div className="font-pixel text-[10px] text-gold-400 mb-3">ABILITIES (hover for Jev distribution)</div>
          <StatBars stats={sheet.stats} mode={sheet.mode} />
        </div>

        {/* Lore */}
        <div className="mt-6 pt-4 border-t border-navy-600 space-y-3">
          <div>
            <div className="font-pixel text-[8px] text-gold-400 mb-1">BACKSTORY</div>
            <p className="font-terminal text-base text-cream-500 leading-relaxed">{lore.backstory}</p>
          </div>
          <div>
            <div className="font-pixel text-[8px] text-gold-400 mb-1">PORTRAIT</div>
            <p className="font-terminal text-base text-cream-500 leading-relaxed">{lore.portrait_description}</p>
          </div>
        </div>
      </motion.div>

      {/* Export buttons */}
      {!isShared && (
        <div className="flex gap-2 flex-wrap mt-4">
          <button onClick={handleSavePng} className="pixel-btn pixel-btn-gold" style={{ fontSize: '9px' }}>
            <span className="flex items-center gap-2"><ImageIcon size={14} /> SAVE PNG</span>
          </button>
          <button onClick={handleDownloadJson} className="pixel-btn" style={{ fontSize: '9px' }}>
            <span className="flex items-center gap-2"><Download size={14} /> DOWNLOAD JSON</span>
          </button>
          <button onClick={handleCopyLink} className="pixel-btn pixel-btn-teal" style={{ fontSize: '9px' }}>
            <span className="flex items-center gap-2"><Link2 size={14} /> COPY SHARE LINK</span>
          </button>
          <button
            onClick={onAddToGallery}
            disabled={galleryAdded}
            className={`pixel-btn ${galleryAdded ? 'pixel-btn-grass' : ''}`}
            style={{ fontSize: '9px' }}
          >
            <span className="flex items-center gap-2"><Heart size={14} /> {galleryAdded ? 'ADDED!' : 'ADD TO GALLERY'}</span>
          </button>
          <button
            onClick={() => { setShowWhy(!showWhy); sfx.click(); }}
            className="pixel-btn pixel-btn-teal"
            style={{ fontSize: '9px' }}
          >
            {showWhy ? 'HIDE WHY' : 'WHY THIS SHEET?'}
          </button>
        </div>
      )}

      {/* Why panel */}
      {showWhy && !isShared && (
        <WhyPanel answers={jevAnswers} sheet={sheet} mode={sheet.mode} />
      )}
    </div>
  );
}
