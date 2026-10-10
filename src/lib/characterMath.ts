import type {
  JevAnswers,
  JevAnswerScore,
  JevAnswerChoice,
  StatId,
  ClassId,
  AlignmentAxis,
  MoralityAxis,
  StatEntry,
  CharacterSheet,
  SheetMode,
  Override,
} from './types';
import {
  STAT_IDS,
  STAT_LABELS,
  CLASS_DATA,
  CLASS_BONUS,
} from './classData';
import { SeededRNG } from './rng';
import { computeAlignment } from './alignment';

const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

const POINT_BUY_BUDGET = 27;

export function expectedLevel(probabilities: Record<string, number>): number {
  let sum = 0;
  for (let i = 0; i <= 4; i++) {
    const p = probabilities[String(i)] ?? 0;
    sum += i * p;
  }
  const total = Object.values(probabilities).reduce((s, p) => s + p, 0);
  if (total > 0 && Math.abs(total - 1) > 0.001) {
    sum = sum / total;
  }
  return sum;
}

export function modifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function computeHp(hitDie: number, conScore: number): number {
  const hp = hitDie + modifier(conScore);
  return Math.max(1, hp);
}

function expectedToBase(e: number): number {
  return 8 + Math.round((e / 4) * 7);
}

function totalCost(scores: Record<StatId, number>): number {
  return STAT_IDS.reduce((s, id) => s + (POINT_BUY_COST[scores[id]] ?? 0), 0);
}

function applyPointBuy(
  expectedLevels: Record<StatId, number>,
): Record<StatId, number> {
  const scores: Record<StatId, number> = {} as Record<StatId, number>;
  for (const id of STAT_IDS) {
    scores[id] = Math.max(8, Math.min(15, expectedToBase(expectedLevels[id])));
  }

  let cost = totalCost(scores);

  let safety = 100;
  while (cost > POINT_BUY_BUDGET && safety > 0) {
    let bestId: StatId | null = null;
    let bestE = Infinity;
    for (const id of STAT_IDS) {
      if (scores[id] > 8 && expectedLevels[id] < bestE) {
        bestE = expectedLevels[id];
        bestId = id;
      }
    }
    if (!bestId) break;
    scores[bestId]--;
    cost = totalCost(scores);
    safety--;
  }

  safety = 100;
  while (cost < POINT_BUY_BUDGET && safety > 0) {
    let bestId: StatId | null = null;
    let bestE = -1;
    for (const id of STAT_IDS) {
      if (scores[id] < 15) {
        const newCost = cost + (POINT_BUY_COST[scores[id] + 1] ?? 0) - (POINT_BUY_COST[scores[id]] ?? 0);
        if (newCost <= POINT_BUY_BUDGET && expectedLevels[id] > bestE) {
          bestE = expectedLevels[id];
          bestId = id;
        }
      }
    }
    if (!bestId) break;
    scores[bestId]++;
    cost = totalCost(scores);
    safety--;
  }

  return scores;
}

function rollModeScores(
  answers: JevAnswers,
  rng: SeededRNG,
): Record<StatId, number> {
  const scores: Record<StatId, number> = {} as Record<StatId, number>;

  for (const id of STAT_IDS) {
    const ans = answers[id] as JevAnswerScore;
    const levelStr = rng.weightedSample(ans.probabilities);
    const level = parseInt(levelStr, 10);

    const ranges: Record<number, [number, number]> = {
      0: [3, 6],
      1: [7, 9],
      2: [10, 12],
      3: [13, 15],
      4: [16, 18],
    };
    const [min, max] = ranges[level] || [10, 12];

    const rolls = [
      rng.nextInt(1, 6),
      rng.nextInt(1, 6),
      rng.nextInt(1, 6),
      rng.nextInt(1, 6),
    ].sort((a, b) => b - a);
    const sum3 = rolls[0] + rolls[1] + rolls[2];

    let score = sum3;
    if (score < min) score = min;
    if (score > max) score = max;

    scores[id] = Math.max(3, Math.min(18, score));
  }

  return scores;
}

export function buildSheet(
  answers: JevAnswers,
  seed: string,
  mode: SheetMode,
  overrides?: Override,
): CharacterSheet {
  const rng = new SeededRNG(seed);

  const classAns = answers.class as JevAnswerChoice;
  let classId = (classAns.choice || 'uncertain') as ClassId;
  if (overrides?.classId) classId = overrides.classId;

  const lawAns = answers.law_chaos as JevAnswerChoice;
  let lawChaos = (lawAns.choice || 'neutral') as AlignmentAxis;
  if (overrides?.lawChaos) lawChaos = overrides.lawChaos;

  const goodAns = answers.good_evil as JevAnswerChoice;
  let goodEvil = (goodAns.choice || 'neutral') as MoralityAxis;
  if (overrides?.goodEvil) goodEvil = overrides.goodEvil;

  const isCharAns = answers.is_character;
  const isCharacter = isCharAns.noul;
  const isCharacterConfidence = Math.abs(2 * isCharacter - 1);

  const expectedLevels: Record<StatId, number> = {} as Record<StatId, number>;
  for (const id of STAT_IDS) {
    const ans = answers[id] as JevAnswerScore;
    expectedLevels[id] = expectedLevel(ans.probabilities);
  }

  let baseScores: Record<StatId, number>;
  if (mode === 'roll') {
    baseScores = rollModeScores(answers, rng);
  } else {
    baseScores = applyPointBuy(expectedLevels);
  }

  const resolvedClassId = classId === 'uncertain' ? 'fighter' : classId;
  const classInfo = CLASS_DATA[resolvedClassId as Exclude<ClassId, 'uncertain'>];
  const classBonus = CLASS_BONUS[resolvedClassId as Exclude<ClassId, 'uncertain'>] || {};

  const stats: StatEntry[] = STAT_IDS.map((id) => {
    const baseScore = baseScores[id];
    const bonus = classBonus[id] || 0;
    const score = baseScore + bonus;
    const ans = answers[id] as JevAnswerScore;
    return {
      id,
      label: STAT_LABELS[id],
      score,
      modifier: modifier(score),
      expectedLevel: expectedLevels[id],
      probabilities: ans.probabilities,
    };
  });

  const conStat = stats.find((s) => s.id === 'con')!;
  const hitDie = classInfo.hitDie;
  const hp = computeHp(hitDie, conStat.score);

  return {
    classId,
    className: classId === 'uncertain' ? 'Uncertain' : classInfo.name,
    alignment: computeAlignment(lawChaos, goodEvil),
    lawChaos,
    goodEvil,
    level: 1,
    hp,
    hitDie,
    stats,
    classBonuses: classBonus,
    mode,
    seed,
    isCharacter,
    isCharacterConfidence,
    classConfidence: classAns.confidence ?? 0,
    lawChaosConfidence: lawAns.confidence ?? 0,
    goodEvilConfidence: goodAns.confidence ?? 0,
  };
}

export function getTopThreeClasses(
  probabilities: Record<string, number>,
): { id: string; probability: number }[] {
  return Object.entries(probabilities)
    .filter(([k]) => k !== 'uncertain')
    .map(([id, p]) => ({ id, probability: p }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);
}
