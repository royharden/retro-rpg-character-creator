import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { z } from 'npm:zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const JEV_MODEL = 'jev-1.13.0';
const TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';
const DAILY_CAP = 200;
const COST_PER_INPUT_TOKEN = 0.042 / 1_000_000;
const MAX_BODY_BYTES = 8192;

const CLASS_CHOICES = {
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

const ALIGNMENT_CHOICES = {
  lawful: 'Follows rules, order, and tradition.',
  neutral: 'Balanced or indifferent on order vs freedom.',
  chaotic: 'Values freedom and unpredictability over rules.',
  uncertain: 'The description does not indicate a tendency.',
};

const MORALITY_CHOICES = {
  good: 'Helps others, shows compassion and altruism.',
  neutral: 'Neither altruistic nor cruel.',
  evil: 'Selfish, cruel, or destructive.',
  uncertain: 'The description does not indicate morality.',
};

const STAT_CRITERIA = [
  'Feeble: clearly weak or frail.',
  'Below average: some sign of weakness.',
  'Average: nothing stated either way.',
  'Strong: clear signs of strength or heavy labor.',
  'Legendary: strength is a defining trait.',
];

const STAT_IDS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const STAT_INSTRUCTIONS: Record<string, string> = {
  str: 'How physically strong is the hero in `description`?',
  dex: 'How agile and nimble is the hero in `description`?',
  con: 'How tough and resilient is the hero in `description`?',
  int: 'How intelligent and scholarly is the hero in `description`?',
  wis: 'How wise and perceptive is the hero in `description`?',
  cha: 'How charismatic and persuasive is the hero in `description`?',
};

function buildQuestions(): Record<string, unknown> {
  const questions: Record<string, unknown> = {};
  questions['class'] = { type: 'choice', instructions: 'Which adventuring class best fits the hero in `description`?', criteria: CLASS_CHOICES };
  questions['law_chaos'] = { type: 'choice', instructions: 'Does the hero in `description` lean toward law, neutrality, or chaos?', criteria: ALIGNMENT_CHOICES };
  questions['good_evil'] = { type: 'choice', instructions: 'Does the hero in `description` lean toward good, neutrality, or evil?', criteria: MORALITY_CHOICES };
  for (const id of STAT_IDS) {
    questions[id] = { type: 'score', instructions: STAT_INSTRUCTIONS[id], criteria: STAT_CRITERIA };
  }
  questions['is_character'] = { type: 'noul', instructions: 'Does `description` describe a person or creature that could be a game character?' };
  return questions;
}

const ChoiceAnswerSchema = z.object({
  type: z.literal('choice'),
  choice: z.string(),
  confidence: z.number(),
  probabilities: z.record(z.string(), z.number()),
});

const ScoreAnswerSchema = z.object({
  type: z.literal('score'),
  score: z.number(),
  confidence: z.number(),
  probabilities: z.record(z.string(), z.number()),
});

const NoulAnswerSchema = z.object({
  type: z.literal('noul'),
  noul: z.number(),
});

const AnswersSchema = z.object({
  class: ChoiceAnswerSchema,
  law_chaos: ChoiceAnswerSchema,
  good_evil: ChoiceAnswerSchema,
  str: ScoreAnswerSchema,
  dex: ScoreAnswerSchema,
  con: ScoreAnswerSchema,
  int: ScoreAnswerSchema,
  wis: ScoreAnswerSchema,
  cha: ScoreAnswerSchema,
  is_character: NoulAnswerSchema,
});

const TypeSafeResponseSchema = z.object({
  model: z.string().optional(),
  answers: AnswersSchema,
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }).optional(),
});

const ALL_QUESTION_IDS = ['class', 'law_chaos', 'good_evil', ...STAT_IDS, 'is_character'];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

class DailyLimitError extends Error {
  constructor() {
    super('daily_limit');
  }
}

async function checkCap(supabaseClient: ReturnType<typeof createClient>): Promise<void> {
  const { data, error } = await supabaseClient.rpc('increment_usage', { fn: 'jev-build' });
  if (error || typeof data !== 'number') {
    throw new Error('cap_check_failed');
  }
  if (data > DAILY_CAP) {
    throw new DailyLimitError();
  }
}

async function callTypeSafe(apiKey: string, body: unknown): Promise<Response> {
  return await fetch(TYPESAFE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function fetchWithRetry(
  apiKey: string,
  body: unknown,
  supabaseClient: ReturnType<typeof createClient>,
  maxRetries = 3,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await checkCap(supabaseClient);
    try {
      const resp = await callTypeSafe(apiKey, body);
      if (resp.status === 429 || resp.status === 529) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        lastError = new Error(`TypeSafe returned ${resp.status}`);
        continue;
      }
      return resp;
    } catch (err) {
      if (err instanceof DailyLimitError) throw err;
      lastError = err as Error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError || new Error('TypeSafe request failed after retries');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const TYPESAFE_API_KEY = Deno.env.get('TYPESAFE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TYPESAFE_API_KEY) {
      return jsonResponse({ error: 'missing_secret', message: 'TYPESAFE_API_KEY is not configured' }, 503);
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: 'cap_check_failed', message: 'Supabase credentials unavailable' }, 503);
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'payload_too_large', message: 'Request body exceeds 8 KB limit' }, 413);
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'payload_too_large', message: 'Request body exceeds 8 KB limit' }, 413);
    }

    const { description, vibe } = JSON.parse(rawBody);
    const trimmedVibe = (vibe || '').slice(0, 50);
    const trimmed = (description || '').trim().slice(0, 1200);

    if (!trimmed) {
      return jsonResponse({ error: 'invalid_input', message: 'Description is required' }, 422);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const questions = buildQuestions();
    const requestBody = {
      model: JEV_MODEL,
      state: { description: trimmed, vibe: trimmedVibe || null },
      questions,
    };

    const startTime = Date.now();
    let resp: Response;
    try {
      resp = await fetchWithRetry(TYPESAFE_API_KEY, requestBody, supabase);
    } catch (err) {
      if (err instanceof DailyLimitError) {
        return jsonResponse({ error: 'daily_limit' }, 429);
      }
      if ((err as Error).message === 'cap_check_failed') {
        return jsonResponse({ error: 'cap_check_failed', message: 'Usage counter unavailable' }, 503);
      }
      throw err;
    }
    const latency_ms = Date.now() - startTime;

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => 'Unknown error');
      return jsonResponse({ error: 'typesafe_error', message: errorText, status: resp.status }, resp.status);
    }

    const raw = await resp.json();
    const parsed = TypeSafeResponseSchema.safeParse(raw);

    if (!parsed.success) {
      return jsonResponse({ error: 'parse_error', message: parsed.error.message }, 422);
    }

    const data = parsed.data;
    const answers = data.answers;

    // Check for missing question IDs
    const missingIds = ALL_QUESTION_IDS.filter((id) => !answers[id as keyof typeof answers]);
    if (missingIds.length > 0 && missingIds.length <= 2) {
      const retryQuestions: Record<string, unknown> = {};
      for (const id of missingIds) {
        retryQuestions[id] = questions[id];
      }
      const retryBody = {
        model: JEV_MODEL,
        state: { description: trimmed, vibe: trimmedVibe || null },
        questions: retryQuestions,
      };
      try {
        const retryResp = await fetchWithRetry(TYPESAFE_API_KEY, retryBody, supabase, 2);
        if (retryResp.ok) {
          const retryRaw = await retryResp.json();
          const retryParsed = TypeSafeResponseSchema.safeParse(retryRaw);
          if (retryParsed.success) {
            for (const id of missingIds) {
              const ans = retryParsed.data.answers[id as keyof typeof retryParsed.data.answers];
              if (ans) {
                (answers as Record<string, unknown>)[id] = ans;
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DailyLimitError) {
          return jsonResponse({ error: 'daily_limit' }, 429);
        }
        // Non-fatal: continue with partial answers
      }
    }

    const inputTokens = data.usage?.input_tokens ?? 0;
    const cost_usd = inputTokens * COST_PER_INPUT_TOKEN;

    return jsonResponse({
      answers,
      model: data.model || JEV_MODEL,
      usage: data.usage || { input_tokens: 0, output_tokens: 0 },
      latency_ms,
      cost_usd,
      mode: 'live',
    });
  } catch (err) {
    return jsonResponse({ error: 'internal_error', message: (err as Error).message }, 500);
  }
});
