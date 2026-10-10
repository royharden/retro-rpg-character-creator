import type { ClassId, JevAnswers, JevAnswerChoice, JevAnswerScore, JevAnswerNoul } from './types';

const KEYWORDS: Record<Exclude<ClassId, 'uncertain'>, string[]> = {
  fighter: ['sword', 'fight', 'warrior', 'soldier', 'battle', 'brawl', 'muscle', 'strong', 'armor', 'weapon', 'mercenary', 'guard', 'knight'],
  wizard: ['spell', 'book', 'magic', 'arcane', 'scholar', 'study', 'tome', 'grimoire', 'learn', 'library', 'sage', 'mage', 'enchant'],
  rogue: ['stealth', 'thief', 'sneak', 'lock', 'pick', 'shadow', 'dart', 'trap', 'poison', 'assassin', 'street', 'urchin', 'rogue', 'nimble'],
  cleric: ['heal', 'faith', 'god', 'divine', 'pray', 'temple', 'priest', 'holy', 'bless', 'light', 'sacred', 'cleric', 'mend'],
  ranger: ['bow', 'hunt', 'wild', 'forest', 'track', 'scout', 'trail', 'beast', 'nature', 'arrow', 'ranger', 'woods', 'survival'],
  bard: ['song', 'music', 'lute', 'perform', 'charm', 'tale', 'story', 'dance', 'bard', 'minstrel', 'play', 'entertain', 'charm'],
  paladin: ['oath', 'honor', 'justice', 'righteous', 'paladin', 'vow', 'sacred', 'duty', 'protect', 'sworn', 'crusade'],
  warlock: ['pact', 'demon', 'patron', 'eldritch', 'warlock', 'deal', 'bargain', 'old one', 'forbidden', 'dark power', 'whisper', 'surrender'],
};

export function heuristicMatch(description: string): JevAnswers {
  const text = description.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [cls, words] of Object.entries(KEYWORDS)) {
    scores[cls] = 0;
    for (const w of words) {
      if (text.includes(w)) scores[cls] += 1;
    }
  }

  let bestClass: Exclude<ClassId, 'uncertain'> = 'fighter';
  let bestScore = -1;
  for (const [cls, s] of Object.entries(scores)) {
    if (s > bestScore) {
      bestScore = s;
      bestClass = cls as Exclude<ClassId, 'uncertain'>;
    }
  }

  const isEvil = text.match(/evil|dark|shadow|cruel|necromanc|dead|kill|murder|hate|demon|warlock|curse/);
  const isGood = text.match(/heal|help|good|kind|protect|save|light|holy|paladin|cleric|bless|charitab/);
  const isLawful = text.match(/law|order|rule|duty|honor|oath|soldier|guard|knight|paladin|templ/);
  const isChaotic = text.match(/chaos|free|wild|rebel|rogue|thief|wander|street|trick/);

  const goodEvil = isEvil ? 'evil' : isGood ? 'good' : 'neutral';
  const lawChaos = isLawful ? 'lawful' : isChaotic ? 'chaotic' : 'neutral';

  // Stat heuristics
  const isStrong = text.match(/strong|muscle|brawl|hammer|heavy|lift|tough|warrior|fighter|blacksmith/);
  const isDex = text.match(/quick|fast|nimble|sneak|stealth|lock|dart|agile|thief|rogue/);
  const isCon = text.match(/tough|endure|stamina|heal|surviv|sturdy|dwarf/);
  const isInt = text.match(/smart|scholar|study|book|learn|genius|wizard|sage|research/);
  const isWis = text.match(/wise|insight|perceiv|calm|spirit|faith|nature|ranger|cleric/);
  const isCha = text.match(/charm|persuad|talk|leader|beautiful|perform|bard|diplomat/);

  const statProb = (level: number): Record<string, number> => {
    const p: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 };
    p[String(level)] = 0.6;
    p[String(Math.max(0, level - 1))] = 0.25;
    p[String(Math.min(4, level + 1))] = 0.15;
    return p;
  };

  const makeScore = (level: number): JevAnswerScore => ({
    type: 'score',
    score: level,
    confidence: 0.5,
    probabilities: statProb(level),
  });

  const makeChoice = (choice: string, probabilities: Record<string, number>, confidence: number): JevAnswerChoice => ({
    type: 'choice',
    choice,
    confidence,
    probabilities,
  });

  const classProbs: Record<string, number> = {};
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  for (const [cls, s] of Object.entries(scores)) {
    classProbs[cls] = s / total;
  }
  classProbs[bestClass] = Math.max(classProbs[bestClass], 0.4);
  classProbs['uncertain'] = bestScore === 0 ? 0.5 : 0.05;

  return {
    class: makeChoice(bestClass, classProbs, bestScore > 0 ? 0.55 : 0.3),
    law_chaos: makeChoice(lawChaos, { lawful: lawChaos === 'lawful' ? 0.5 : 0.2, neutral: 0.3, chaotic: lawChaos === 'chaotic' ? 0.5 : 0.2, uncertain: 0.05 }, 0.4),
    good_evil: makeChoice(goodEvil, { good: goodEvil === 'good' ? 0.5 : 0.2, neutral: 0.3, evil: goodEvil === 'evil' ? 0.5 : 0.2, uncertain: 0.05 }, 0.4),
    str: makeScore(isStrong ? 3 : 2),
    dex: makeScore(isDex ? 3 : 2),
    con: makeScore(isCon ? 3 : 2),
    int: makeScore(isInt ? 3 : 2),
    wis: makeScore(isWis ? 3 : 2),
    cha: makeScore(isCha ? 3 : 2),
    is_character: { type: 'noul', noul: 0.85 } as JevAnswerNoul,
  };
}
