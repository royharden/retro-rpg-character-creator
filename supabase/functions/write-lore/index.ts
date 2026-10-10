import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { z } from 'npm:zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DAILY_CAP = 200;

const LoreSchema = z.object({
  backstory: z.string().min(80).max(300),
  name_ideas: z.array(z.string()).length(5),
  portrait_description: z.string().min(20),
  catchphrase: z.string().min(3),
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const SYSTEM_PROMPT = `You are a creative writer for a retro RPG character sheet generator.
You receive a FIXED character sheet (class, alignment, stats, HP, description) and a tone.
You write ONLY narrative text for the sheet: a backstory, 5 name ideas, a portrait description, and a catchphrase.
The sheet data is FIXED and must NOT be changed or contradicted in your writing.
Do not suggest different stats, class, or alignment. Write within the given constraints.
Respond as JSON with keys: backstory, name_ideas (array of 5 strings), portrait_description, catchphrase.`;

function buildUserPrompt(sheet: {
  classId: string;
  className: string;
  alignment: string;
  level: number;
  hp: number;
  stats: { id: string; label: string; score: number; modifier: number }[];
  description: string;
}, tone: string): string {
  const statLines = sheet.stats.map((s) => `  ${s.label}: ${s.score} (mod ${s.modifier >= 0 ? '+' : ''}${s.modifier})`).join('\n');
  return `Tone: ${tone}

Character sheet (FIXED - do not change or contradict):
Class: ${sheet.className}
Alignment: ${sheet.alignment}
Level: ${sheet.level}
HP: ${sheet.hp}
Stats:
${statLines}
Description: ${sheet.description}

Write:
1. backstory: 120-180 words, matching the tone, consistent with the sheet above.
2. name_ideas: 5 creative fantasy names fitting this character.
3. portrait_description: one paragraph of visual details (appearance, clothing, expression).
4. catchphrase: a short memorable line this character would say.

Respond as JSON: { "backstory": "...", "name_ideas": ["...", "...", "...", "...", "..."], "portrait_description": "...", "catchphrase": "..." }`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-6-luna';
    const OPENAI_BASE_URL = Deno.env.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: 'missing_secret', message: 'OPENAI_API_KEY is not configured' }, 503);
    }

    const { sheet, tone } = await req.json();

    if (!sheet || !sheet.classId) {
      return jsonResponse({ error: 'invalid_input', message: 'Sheet is required' }, 422);
    }

    // Daily cap check (fail closed)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase.rpc('increment_usage', { fn: 'write-lore' });
      if (error || typeof data !== 'number') {
        return jsonResponse({ error: 'cap_check_failed', message: 'Usage counter unavailable' }, 503);
      }
      if (data > DAILY_CAP) {
        return jsonResponse({ error: 'daily_limit' }, 429);
      }
    }

    const userPrompt = buildUserPrompt(sheet, tone || 'heroic');

    const body = {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    };

    let parsed: z.infer<typeof LoreSchema> | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const resp = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorText = await resp.text().catch(() => 'Unknown error');
        return jsonResponse({ error: 'openai_error', message: errorText, status: resp.status }, resp.status);
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return jsonResponse({ error: 'empty_response', message: 'OpenAI returned no content' }, 422);
      }

      try {
        const json = JSON.parse(content);
        const result = LoreSchema.safeParse(json);
        if (result.success) {
          parsed = result.data;
          break;
        }
      } catch {
        // retry
      }
    }

    if (!parsed) {
      return jsonResponse({ error: 'parse_error', message: 'Failed to parse LLM response after retry' }, 422);
    }

    return jsonResponse({
      ...parsed,
      mode: 'live',
    });
  } catch (err) {
    return jsonResponse({ error: 'internal_error', message: (err as Error).message }, 500);
  }
});
