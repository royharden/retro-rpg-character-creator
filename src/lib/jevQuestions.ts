import { CLASS_CHOICES, STAT_CRITERIA, ALIGNMENT_CHOICES, MORALITY_CHOICES, STAT_IDS } from './classData';

export function buildJevQuestions(): Record<string, unknown> {
  const questions: Record<string, unknown> = {};

  questions['class'] = {
    type: 'choice',
    instructions: 'Which adventuring class best fits the hero in `description`?',
    criteria: CLASS_CHOICES,
  };

  questions['law_chaos'] = {
    type: 'choice',
    instructions: 'Does the hero in `description` lean toward law, neutrality, or chaos?',
    criteria: ALIGNMENT_CHOICES,
  };

  questions['good_evil'] = {
    type: 'choice',
    instructions: 'Does the hero in `description` lean toward good, neutrality, or evil?',
    criteria: MORALITY_CHOICES,
  };

  const statInstructions: Record<string, string> = {
    str: 'How physically strong is the hero in `description`?',
    dex: 'How agile and nimble is the hero in `description`?',
    con: 'How tough and resilient is the hero in `description`?',
    int: 'How intelligent and scholarly is the hero in `description`?',
    wis: 'How wise and perceptive is the hero in `description`?',
    cha: 'How charismatic and persuasive is the hero in `description`?',
  };

  for (const id of STAT_IDS) {
    questions[id] = {
      type: 'score',
      instructions: statInstructions[id],
      criteria: STAT_CRITERIA,
    };
  }

  questions['is_character'] = {
    type: 'noul',
    instructions: 'Does `description` describe a person or creature that could be a game character?',
  };

  return questions;
}

export const JEV_MODEL = 'jev-1.13.0';
export const TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';
export const COST_PER_INPUT_TOKEN = 0.042 / 1_000_000;
