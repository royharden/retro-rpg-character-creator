import type { FullCharacter } from './types';

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShareLink(character: FullCharacter): string {
  const payload = {
    d: character.description,
    v: character.vibe,
    s: character.sheet,
    l: character.lore,
    j: character.jevAnswers,
    jm: character.jevMode,
    lm: character.llmMode,
    sd: character.seed,
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const base = window.location.origin + window.location.pathname;
  return `${base}#/c#${encoded}`;
}

export function decodeShareLink(hash: string): FullCharacter | null {
  try {
    const encoded = hash.replace(/^#\/c#/, '').replace(/^\/c#/, '');
    const json = fromBase64Url(encoded);
    const payload = JSON.parse(json);
    return {
      description: payload.d,
      vibe: payload.v,
      sheet: payload.s,
      lore: payload.l,
      jevAnswers: payload.j,
      jevMode: payload.jm,
      llmMode: payload.lm,
      seed: payload.sd,
    };
  } catch {
    return null;
  }
}

export function isShareLink(): boolean {
  const hash = window.location.hash;
  return hash.startsWith('#/c#') || hash.startsWith('#c#');
}
