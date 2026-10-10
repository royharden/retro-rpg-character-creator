import type { CharacterSheet, Lore, ClassId, AlignmentAxis, MoralityAxis } from './types';

const CLASS_LORE_TEMPLATES: Record<Exclude<ClassId, 'uncertain'>, { backstory: (name: string, desc: string) => string; names: string[]; portrait: (desc: string) => string; catchphrase: string }> = {
  fighter: {
    backstory: (name, desc) =>
      `${name} grew up in a frontier town where steel was the only law. ${desc} From a young age, ${name} learned that a strong arm and a thick shield solve most problems. After years of mercenary work, ${name} now seeks something worth fighting for beyond mere coin.`,
    names: ['Garrick', 'Brunhild', 'Thora', 'Kord', 'Magnus'],
    portrait: (desc) => `A broad-shouldered figure in scarred plate armor, ${desc}. Their shield bears the marks of a hundred battles, and their eyes carry the calm of someone who has seen the worst and stood firm.`,
    catchphrase: 'Steel speaks louder than words.',
  },
  wizard: {
    backstory: (name, desc) =>
      `${name} spent more time in libraries than in sunlight. ${desc} Obsessed with the arcane from childhood, ${name} pored over crumbling grimoires until the formulas became as natural as breathing. Now ${name} ventures forth to find knowledge no book can teach.`,
    names: ['Aldric', 'Sylas', 'Morwen', 'Pellinore', 'Iridia'],
    portrait: (desc) => `A lean figure draped in starlit robes, ${desc}. An orb-tipped staff glows at their side, and ink stains their fingers from decades of copying spells by candlelight.`,
    catchphrase: 'Knowledge is the only true power.',
  },
  rogue: {
    backstory: (name, desc) =>
      `${name} learned to pick locks before learning to read. ${desc} Growing up in the city's shadowed underbelly, ${name} survived by being quicker and quieter than everyone else. Now ${name} seeks a bigger score and a way out of the gutter.`,
    names: ['Sable', 'Jasper', 'Viper', 'Nyx', 'Rook'],
    portrait: (desc) => `A wiry figure in dark leather, ${desc}. A hood shadows their face, and their fingers never stop moving, as if counting coins that aren't there yet.`,
    catchphrase: "You didn't see me. You never do.",
  },
  cleric: {
    backstory: (name, desc) =>
      `${name} heard the call of the divine in a moment of desperate need. ${desc} Once a skeptic, ${name} now carries their faith like a torch, healing the wounded and striking down the unholy with equal conviction.`,
    names: ['Oswin', 'Cassia', 'Bramwell', 'Hesper', 'Thaddeus'],
    portrait: (desc) => `A serene figure in white and gold vestments, ${desc}. A holy symbol hangs at their chest, glowing faintly, and their hands bear the calluses of both prayer and war.`,
    catchphrase: 'The light does not ask permission.',
  },
  ranger: {
    backstory: (name, desc) =>
      `${name} was born where the map ends. ${desc} More at home among trees and trails than among people, ${name} tracks beasts and bandits alike through wilderness that would swallow anyone else whole.`,
    names: ['Hawkeye', 'Sylvana', 'Brenn', 'Fenris', 'Talia'],
    portrait: (desc) => `A weathered figure in earth-tone leathers, ${desc}. A bow sits across their back, and their eyes scan the horizon with the patience of someone who has tracked a single deer for three days.`,
    catchphrase: 'The wild does not forgive the unprepared.',
  },
  bard: {
    backstory: (name, desc) =>
      `${name} discovered that a well-timed song can stop a bar fight faster than a sword. ${desc} A wanderer by trade and a storyteller by calling, ${name} collects tales and secrets in equal measure, turning both into gold and applause.`,
    names: ['Pip', 'Calliope', 'Ryn', 'Marigold', 'Lyric'],
    portrait: (desc) => `A colorful figure in flamboyant attire, ${desc}. A lute hangs from their shoulder, and their grin suggests they know three things about you that you haven't told them.`,
    catchphrase: 'Everyone has a story. I just make yours sound better.',
  },
  paladin: {
    backstory: (name, desc) =>
      `${name} swore an oath that cannot be unsworn. ${desc} Clad in righteousness as much as armor, ${name} rides toward injustice the way a moth flies toward flame, trusting that the light will not consume them.`,
    names: ['Galahad', 'Seraphine', 'Duncan', 'Valeria', 'Aurelius'],
    portrait: (desc) => `A towering figure in gleaming plate, ${desc}. Their sword hums with sacred energy, and their shield bears a crest that seems to glow brighter when danger approaches.`,
    catchphrase: 'My oath is my compass. It never wavers.',
  },
  warlock: {
    backstory: (name, desc) =>
      `${name} found something in the old library that should have stayed buried. ${desc} The bargain was struck in whispers and signed in shadow. Now ${name} wields borrowed power, wondering each day whether the price was worth it.`,
    names: ['Vex', 'Mortimer', 'Elspeth', 'Crowley', 'Lenore'],
    portrait: (desc) => `A gaunt figure in dark robes, ${desc}. An eldritch glow flickers behind their eyes, and a tome at their hip seems to breathe with a life of its own.`,
    catchphrase: 'Everything has a price. I just negotiated better than most.',
  },
};

export function generateMockLore(sheet: CharacterSheet): Lore {
  const classId = (sheet.classId === 'uncertain' ? 'fighter' : sheet.classId) as Exclude<ClassId, 'uncertain'>;
  const template = CLASS_LORE_TEMPLATES[classId];
  const name = template.names[0];

  return {
    backstory: template.backstory(name, sheet.alignment + ' by nature,'),
    name_ideas: template.names,
    portrait_description: template.portrait(`aligned to ${sheet.alignment}`),
    catchphrase: template.catchphrase,
    mode: 'mock',
  };
}

export function getMockLoreForAlignment(sheet: CharacterSheet): Lore {
  return generateMockLore(sheet);
}
