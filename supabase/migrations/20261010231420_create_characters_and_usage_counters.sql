/*
# Create characters and usage_counters tables

1. New Tables
- `characters`: stores generated character sheets for the public gallery.
  - id (uuid, primary key)
  - description (text, the user's free-text hero description)
  - vibe (text, the selected vibe card label or null)
  - sheet (jsonb, the computed character sheet: class, alignment, stats, HP, etc.)
  - lore (jsonb, LLM-generated lore: backstory, name_ideas, portrait_description, catchphrase)
  - jev_answers (jsonb, the raw Jev answers without any keys)
  - jev_mode (text, "live" | "replay" | "heuristic")
  - llm_mode (text, "live" | "mock")
  - seed (text, the RNG seed for reproducible roll-mode sheets)
  - created_at (timestamptz, defaults to now())
- `usage_counters`: daily call cap counter per edge function.
  - function_name (text, name of the edge function)
  - day (date, UTC day)
  - count (int, number of calls that day)
  - primary key (function_name, day)

2. Functions
- `increment_usage(fn text)`: SECURITY DEFINER function that atomically upserts
  the usage counter for (fn, current UTC date) and returns the new count as an int.
  EXECUTE is revoked from PUBLIC, anon, and authenticated; granted only to service_role.
  This ensures the browser anon key can never call it directly.

3. Security
- `characters`: RLS enabled. Permissive anon + authenticated SELECT and INSERT
  (public demo gallery, no auth). No UPDATE or DELETE policies.
- `usage_counters`: RLS enabled with NO policies for anon or authenticated.
  Only service_role can access it (via the SECURITY DEFINER function).
*/

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  vibe text,
  sheet jsonb NOT NULL,
  lore jsonb,
  jev_answers jsonb,
  jev_mode text NOT NULL DEFAULT 'replay',
  llm_mode text NOT NULL DEFAULT 'mock',
  seed text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_counters (
  function_name text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (function_name, day)
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- characters: permissive anon select + insert for the demo gallery (no auth, no update/delete)
DROP POLICY IF EXISTS "anon_select_characters" ON characters;
CREATE POLICY "anon_select_characters" ON characters FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_characters" ON characters;
CREATE POLICY "anon_insert_characters" ON characters FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- usage_counters: no policies for anon/authenticated; only service_role can access
-- (via the SECURITY DEFINER increment_usage function)

-- increment_usage: atomic upsert counter, SECURITY DEFINER, service_role only
CREATE OR REPLACE FUNCTION increment_usage(fn text) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count int;
BEGIN
  INSERT INTO usage_counters (function_name, day, count)
  VALUES (fn, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (function_name, day)
  DO UPDATE SET count = usage_counters.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_usage(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_usage(text) FROM anon;
REVOKE EXECUTE ON FUNCTION increment_usage(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(text) TO service_role;

-- Index for gallery query (latest 30, ordered by created_at desc)
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters (created_at DESC);
