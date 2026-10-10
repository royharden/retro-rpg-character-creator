export type ClassId =
  | 'fighter'
  | 'wizard'
  | 'rogue'
  | 'cleric'
  | 'ranger'
  | 'bard'
  | 'paladin'
  | 'warlock'
  | 'uncertain';

export type AlignmentAxis = 'lawful' | 'neutral' | 'chaotic';
export type MoralityAxis = 'good' | 'neutral' | 'evil';

export type StatId = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type JevMode = 'live' | 'replay' | 'heuristic';
export type LlmMode = 'live' | 'mock';

export type SheetMode = 'standard' | 'roll';

export interface JevAnswerChoice {
  type: 'choice';
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface JevAnswerScore {
  type: 'score';
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface JevAnswerNoul {
  type: 'noul';
  noul: number;
}

export type JevAnswer = JevAnswerChoice | JevAnswerScore | JevAnswerNoul;

export interface JevAnswers {
  class: JevAnswerChoice;
  law_chaos: JevAnswerChoice;
  good_evil: JevAnswerChoice;
  str: JevAnswerScore;
  dex: JevAnswerScore;
  con: JevAnswerScore;
  int: JevAnswerScore;
  wis: JevAnswerScore;
  cha: JevAnswerScore;
  is_character: JevAnswerNoul;
}

export interface JevUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface JevResponse {
  answers: JevAnswers;
  model: string;
  usage: JevUsage;
  latency_ms: number;
  cost_usd: number;
  mode: JevMode;
}

export interface StatEntry {
  id: StatId;
  label: string;
  score: number;
  modifier: number;
  expectedLevel: number;
  probabilities: Record<string, number>;
}

export interface CharacterSheet {
  classId: ClassId;
  className: string;
  alignment: string;
  lawChaos: AlignmentAxis;
  goodEvil: MoralityAxis;
  level: number;
  hp: number;
  hitDie: number;
  stats: StatEntry[];
  classBonuses: Partial<Record<StatId, number>>;
  mode: SheetMode;
  seed: string;
  isCharacter: number;
  isCharacterConfidence: number;
  classConfidence: number;
  lawChaosConfidence: number;
  goodEvilConfidence: number;
}

export interface Lore {
  backstory: string;
  name_ideas: string[];
  portrait_description: string;
  catchphrase: string;
  mode: LlmMode;
}

export interface FullCharacter {
  description: string;
  vibe: string | null;
  sheet: CharacterSheet;
  lore: Lore;
  jevAnswers: JevAnswers;
  jevMode: JevMode;
  llmMode: LlmMode;
  seed: string;
  model?: string;
  usage?: JevUsage;
  latencyMs?: number;
  costUsd?: number;
}

export interface Override {
  classId?: ClassId;
  lawChaos?: AlignmentAxis;
  goodEvil?: MoralityAxis;
}

export interface DemoCharacter {
  id: string;
  label: string;
  description: string;
  vibe: string;
  jevRequest: {
    model: string;
    state: { description: string; vibe: string | null };
    questions: Record<string, unknown>;
  };
  jevResponse: JevAnswers;
  descriptionHash: string;
}

export type ToastType = 'info' | 'error' | 'success' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

export interface GalleryCharacter {
  id: string;
  description: string;
  vibe: string | null;
  sheet: CharacterSheet;
  lore: Lore;
  jev_mode: JevMode;
  llm_mode: LlmMode;
  seed: string;
  created_at: string;
}
