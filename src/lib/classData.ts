import type { ClassId, StatId } from './types';

export interface ClassInfo {
  id: ClassId;
  name: string;
  hitDie: number;
  primary: StatId;
  secondary: StatId;
  description: string;
}

export const CLASS_DATA: Record<Exclude<ClassId, 'uncertain'>, ClassInfo> = {
  fighter: {
    id: 'fighter',
    name: 'Fighter',
    hitDie: 10,
    primary: 'str',
    secondary: 'con',
    description: 'A master of martial combat, skilled with a variety of weapons and armor.',
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard',
    hitDie: 6,
    primary: 'int',
    secondary: 'dex',
    description: 'A scholarly magic-user capable of manipulating the structures of reality.',
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    hitDie: 8,
    primary: 'dex',
    secondary: 'int',
    description: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies.',
  },
  cleric: {
    id: 'cleric',
    name: 'Cleric',
    hitDie: 8,
    primary: 'wis',
    secondary: 'con',
    description: 'A priestly champion who wields divine magic in service of a higher power.',
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    hitDie: 10,
    primary: 'dex',
    secondary: 'wis',
    description: 'A warrior of the wilderness, skilled in tracking, survival, and ranged combat.',
  },
  bard: {
    id: 'bard',
    name: 'Bard',
    hitDie: 8,
    primary: 'cha',
    secondary: 'dex',
    description: 'A master of song, speech, and the magic they inspire.',
  },
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    hitDie: 10,
    primary: 'str',
    secondary: 'cha',
    description: 'A holy warrior bound by a sacred oath to uphold justice and righteousness.',
  },
  warlock: {
    id: 'warlock',
    name: 'Warlock',
    hitDie: 8,
    primary: 'cha',
    secondary: 'con',
    description: 'A wielder of magic derived from a bargain with an otherworldly being.',
  },
};

export const CLASS_ORDER: ClassId[] = [
  'fighter', 'wizard', 'rogue', 'cleric', 'ranger', 'bard', 'paladin', 'warlock',
];

export const CLASS_BONUS: Record<Exclude<ClassId, 'uncertain'>, Partial<Record<StatId, number>>> = {
  fighter: { str: 2, con: 1 },
  wizard: { int: 2, dex: 1 },
  rogue: { dex: 2, int: 1 },
  cleric: { wis: 2, con: 1 },
  ranger: { dex: 2, wis: 1 },
  bard: { cha: 2, dex: 1 },
  paladin: { str: 2, cha: 1 },
  warlock: { cha: 2, con: 1 },
};

export const STAT_IDS: StatId[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const STAT_LABELS: Record<StatId, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
};
export const STAT_FULL_NAMES: Record<StatId, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export const CLASS_CHOICES: Record<string, string> = {
  fighter: 'Wins with weapons, armor, and toughness.',
  wizard: 'Studies arcane magic from books.',
  rogue: 'Relies on stealth, tricks, and nimble hands.',
  cleric: 'Serves a faith and heals or protects others.',
  ranger: 'Hunter or scout at home in the wild.',
  bard: 'Performer who uses charm, music, and words.',
  paladin: 'Holy warrior bound by an oath.',
  warlock: 'Gets power from a pact with a patron.',
  uncertain: 'The description does not point to any class.',
};

export const STAT_CRITERIA: string[] = [
  'Feeble: clearly weak or frail.',
  'Below average: some sign of weakness.',
  'Average: nothing stated either way.',
  'Strong: clear signs of strength or heavy labor.',
  'Legendary: strength is a defining trait.',
];

export const ALIGNMENT_CHOICES: Record<string, string> = {
  lawful: 'Follows rules, order, and tradition.',
  neutral: 'Balanced or indifferent on order vs freedom.',
  chaotic: 'Values freedom and unpredictability over rules.',
  uncertain: 'The description does not indicate a tendency.',
};

export const MORALITY_CHOICES: Record<string, string> = {
  good: 'Helps others, shows compassion and altruism.',
  neutral: 'Neither altruistic nor cruel.',
  evil: 'Selfish, cruel, or destructive.',
  uncertain: 'The description does not indicate morality.',
};

export const VIBE_CARDS: { label: string; description: string }[] = [
  { label: 'grumpy dwarf blacksmith', description: 'A stout, cantankerous crafter of arms and armor.' },
  { label: 'cheerful necromancer', description: 'A bubbly spellcaster who raises the dead with a smile.' },
  { label: 'street urchin thief', description: 'A quick-fingered orphan who grew up in the alleys.' },
  { label: 'battlefield medic', description: 'A former soldier who now heals friend and foe alike.' },
  { label: 'wandering minstrel', description: 'A charming lute player who talks their way out of trouble.' },
  { label: 'library warlock', description: 'A scholar who made a pact with something in the old stacks.' },
];

export const DAILY_CAP = 200;
