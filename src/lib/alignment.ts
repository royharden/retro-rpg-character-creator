import type { AlignmentAxis, MoralityAxis } from './types';

export function computeAlignment(
  lawChaos: AlignmentAxis,
  goodEvil: MoralityAxis,
): string {
  if (lawChaos === 'neutral' && goodEvil === 'neutral') return 'True Neutral';
  const parts: string[] = [];
  if (lawChaos !== 'neutral') parts.push(lawChaos.charAt(0).toUpperCase() + lawChaos.slice(1));
  if (goodEvil !== 'neutral') parts.push(goodEvil.charAt(0).toUpperCase() + goodEvil.slice(1));
  if (parts.length === 0) return 'True Neutral';
  if (parts.length === 1) {
    if (lawChaos === 'neutral') return `${parts[0]} Neutral`;
    return `Neutral ${parts[0]}`;
  }
  return parts.join(' ');
}
