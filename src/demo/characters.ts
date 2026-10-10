import type { DemoCharacter } from '@/lib/types';
import { buildJevQuestions, JEV_MODEL } from '@/lib/jevQuestions';
import { hashDescription } from '@/lib/rng';
import recordedJev from '../../public/demo/recorded-jev.json' with { type: 'json' };

const DESCRIPTIONS: { id: string; label: string; description: string; vibe: string }[] = [
  {
    id: 'brakka',
    label: 'Brakka',
    description: 'A grumpy dwarf blacksmith who hits things until they are fixed.',
    vibe: 'grumpy dwarf blacksmith',
  },
  {
    id: 'lumi',
    label: 'Lumi',
    description: 'A cheerful necromancer who keeps her skeletons tidy and well dressed.',
    vibe: 'cheerful necromancer',
  },
  {
    id: 'sable',
    label: 'Sable',
    description: 'A quiet street orphan who picks locks faster than she reads.',
    vibe: 'street urchin thief',
  },
  {
    id: 'oswin',
    label: 'Brother Oswin',
    description: 'A former soldier who now heals anyone, even his enemies.',
    vibe: 'battlefield medic',
  },
  {
    id: 'pip',
    label: 'Pip',
    description: 'A halfling lute player who talks his way out of every fight.',
    vibe: 'wandering minstrel',
  },
  {
    id: 'vex',
    label: 'Vex',
    description: 'A scholar who made a deal with something in the old library.',
    vibe: 'library warlock',
  },
];

const recorded = recordedJev as unknown as Record<string, DemoCharacter['jevResponse']>;

export const DEMO_CHARACTERS: DemoCharacter[] = DESCRIPTIONS.map((d) => {
  const jevResponse = recorded[d.id];
  return {
    id: d.id,
    label: d.label,
    description: d.description,
    vibe: d.vibe,
    jevRequest: {
      model: JEV_MODEL,
      state: { description: d.description, vibe: null },
      questions: buildJevQuestions(),
    },
    jevResponse,
    descriptionHash: hashDescription(d.description),
  };
});
