import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { GalleryCharacter, FullCharacter } from '@/lib/types';
import { SpriteCanvas } from './SpriteCanvas';
import { sfx } from '@/lib/sound';

interface GalleryProps {
  onBack: () => void;
}

export function Gallery({ onBack }: GalleryProps) {
  const [characters, setCharacters] = useState<GalleryCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FullCharacter | null>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      setError(error.message);
    } else if (data) {
      setCharacters(data as unknown as GalleryCharacter[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleSelect = (char: GalleryCharacter) => {
    sfx.select();
    setSelected({
      description: char.description,
      vibe: char.vibe,
      sheet: char.sheet,
      lore: char.lore,
      jevAnswers: (char as unknown as { jev_answers: FullCharacter['jevAnswers'] }).jev_answers || {
        class: { type: 'choice', choice: '', confidence: 0, probabilities: {} },
        law_chaos: { type: 'choice', choice: '', confidence: 0, probabilities: {} },
        good_evil: { type: 'choice', choice: '', confidence: 0, probabilities: {} },
        str: { type: 'score', score: 0, confidence: 0, probabilities: {} },
        dex: { type: 'score', score: 0, confidence: 0, probabilities: {} },
        con: { type: 'score', score: 0, confidence: 0, probabilities: {} },
        int: { type: 'score', score: 0, confidence: 0, probabilities: {} },
        wis: { type: 'score', score: 0, confidence: 0, probabilities: {} },
        cha: { type: 'score', score: 0, confidence: 0, probabilities: {} },
        is_character: { type: 'noul', noul: 0 },
      },
      jevMode: char.jev_mode,
      llmMode: char.llm_mode,
      seed: char.seed,
    });
  };

  if (selected) {
    return (
      <div className="min-h-screen p-4 pt-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => { setSelected(null); sfx.click(); }} className="pixel-btn mb-4" style={{ fontSize: '9px' }}>
            <span className="flex items-center gap-2"><ArrowLeft size={14} /> BACK TO GALLERY</span>
          </button>
          <CharacterSheetReadOnly character={selected} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-gold-400" />
            <h1 className="font-pixel text-lg text-gold-400">GALLERY</h1>
          </div>
          <button onClick={() => { onBack(); sfx.click(); }} className="pixel-btn" style={{ fontSize: '9px' }}>
            <span className="flex items-center gap-2"><ArrowLeft size={14} /> BACK</span>
          </button>
        </div>

        {loading && (
          <div className="font-pixel text-[10px] text-cream-600 animate-pulse">LOADING...</div>
        )}

        {error && (
          <div className="pixel-panel pixel-border-crimson">
            <span className="font-terminal text-base text-crimson-400">Failed to load gallery: {error}</span>
          </div>
        )}

        {!loading && !error && characters.length === 0 && (
          <div className="pixel-panel text-center py-12">
            <div className="font-pixel text-[10px] text-cream-600 mb-2">NO CHARACTERS YET</div>
            <div className="font-terminal text-base text-cream-600">
              Generate a hero and click "Add to Gallery" to see it here.
            </div>
          </div>
        )}

        {!loading && !error && characters.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => handleSelect(char)}
                onMouseEnter={() => sfx.hover()}
                className="pixel-panel hover:pixel-border-gold transition-all text-left"
              >
                <div className="flex justify-center mb-2">
                  <SpriteCanvas
                    classId={char.sheet.classId}
                    lawChaos={char.sheet.lawChaos}
                    goodEvil={char.sheet.goodEvil}
                    seed={char.seed}
                    scale={4}
                  />
                </div>
                <div className="font-pixel text-[8px] text-gold-400 truncate mb-1">
                  {char.lore?.name_ideas?.[0] || 'Hero'}
                </div>
                <div className="font-terminal text-sm text-cream-500 truncate">
                  {char.sheet.className}
                </div>
                <div className="font-terminal text-sm text-cream-600 truncate">
                  {char.sheet.alignment}
                </div>
                {char.jev_mode === 'replay' && (
                  <span className="font-pixel text-[6px] text-gold-400">REPLAY</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterSheetReadOnly({ character }: { character: FullCharacter }) {
  const { sheet, lore } = character;
  return (
    <div className="pixel-panel pixel-border p-6">
      <div className="flex gap-6 flex-col md:flex-row">
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
        <div className="flex-1 space-y-3">
          <h2 className="font-pixel text-base text-gold-400">{lore.name_ideas[0] || 'Hero'}</h2>
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
            </div>
          </div>
          <div className="pixel-panel pixel-border-teal p-2">
            <span className="font-terminal text-base text-teal-400 italic">"{lore.catchphrase}"</span>
          </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-navy-600">
        <StatBarsSimple sheet={sheet} />
      </div>
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
    </div>
  );
}

function StatBarsSimple({ sheet }: { sheet: FullCharacter['sheet'] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {sheet.stats.map((stat) => (
        <div key={stat.id}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[10px] text-cream-500">{stat.label}</span>
            <span className="font-pixel text-[10px] text-gold-400">
              {stat.score} ({stat.modifier >= 0 ? '+' : ''}{stat.modifier})
            </span>
          </div>
          <div className="flex gap-[2px]">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="stat-segment"
                style={{
                  backgroundColor: i < stat.score ? '#fbbf24' : '#1a1f4a',
                  border: '1px solid #0a0e27',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
